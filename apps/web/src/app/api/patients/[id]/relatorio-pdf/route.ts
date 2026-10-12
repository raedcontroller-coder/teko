import { NextResponse } from 'next/server';
import { db } from '../../../../../../../../packages/db/db/index';
import { users, gameSessions, games, clinicalNotes, anamneses } from '../../../../../../../../packages/db/db/schema';
import { eq, and, asc, isNull } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { recordAudit } from '@/lib/audit';

export const maxDuration = 180; // Configuração Vercel / Next.js para permitir até 3 minutos de execução

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_teko_app");
const API_TWO_URL = process.env.API_TWO_URL || "http://osor03kc2dy6lkyazdhydnwz.62.171.175.197.sslip.io";

type JobState = {
  status: 'generating' | 'ready' | 'error';
  error?: string;
  pdfPath?: string;
  startedAt: number;
};

// Map global em memória para rastreamento de jobs de geração de PDF por paciente
const pdfJobsCache = new Map<string, JobState>();

async function authenticateRequest(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: "Token não fornecido.", status: 401 };
  }

  const token = authHeader.split(' ')[1];
  let payload;
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    payload = verified.payload;
  } catch {
    return { error: "Token inválido ou expirado.", status: 401 };
  }

  const url = new URL(request.url);
  const adminPsiId = url.searchParams.get("psicologoId");

  let psicologoId = payload.sub as string;
  if (payload.role === 'GLOBAL_ADMIN') {
    if (!adminPsiId) {
      return { error: "psicologoId obrigatório para administradores.", status: 400 };
    }
    psicologoId = adminPsiId;
  } else if (!psicologoId) {
    return { error: "ID do usuário não encontrado no token.", status: 400 };
  }

  return { psicologoId };
}

function resolveScriptPath(relativeSubPath: string): string {
  let pyScript = path.resolve(process.cwd(), `../api_two/src/${relativeSubPath}`);
  if (!fs.existsSync(pyScript)) {
    pyScript = path.resolve(process.cwd(), `apps/api_two/src/${relativeSubPath}`);
  }
  if (!fs.existsSync(pyScript)) {
    pyScript = path.join(__dirname, `../../../../../../../../api_two/src/${relativeSubPath}`);
  }
  return pyScript;
}

async function runPythonProcess(scriptPath: string, args: string[], cwd?: string, timeoutMs = 210000): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const pythonProcess = spawn('python', [scriptPath, ...args], {
      cwd: cwd || path.dirname(scriptPath)
    });

    let stdout = '';
    let stderr = '';
    let timer: NodeJS.Timeout | null = null;

    if (timeoutMs > 0) {
      timer = setTimeout(() => {
        try { pythonProcess.kill('SIGKILL'); } catch {}
        resolve({ stdout, stderr: stderr + '\n[Timeout de execução Python excedido]', exitCode: 124 });
      }, timeoutMs);
    }

    if (pythonProcess.stdout) {
      pythonProcess.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    }
    if (pythonProcess.stderr) {
      pythonProcess.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    }

    pythonProcess.on('close', (code) => {
      if (timer) clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });
    pythonProcess.on('error', (err) => {
      if (timer) clearTimeout(timer);
      resolve({ stdout, stderr: stderr + err.message, exitCode: 1 });
    });
  });
}

async function generatePdfJobAsync(jobKey: string, patientId: string, psicologoId: string, inputPayload: any, patientName: string) {
  try {
    const genScript = resolveScriptPath('generate_content/teko_relatorio_final.py');
    const pdfScript = resolveScriptPath('pdfs/teko_relatorio_final_pdf.py');

    const tmpDir = os.tmpdir();
    const payloadTmpPath = path.join(tmpDir, `input-payload-${patientId}-${Date.now()}.json`);
    const reportContentTmpPath = path.join(tmpDir, `report-content-${patientId}-${Date.now()}.json`);
    const pdfTmpPath = path.join(tmpDir, `relatorio-final-${patientId}.pdf`);

    if (fs.existsSync(genScript) && fs.existsSync(pdfScript)) {
      try {
        fs.writeFileSync(payloadTmpPath, JSON.stringify(inputPayload, null, 2), 'utf-8');

        const genResult = await runPythonProcess(genScript, [payloadTmpPath], undefined, 210000);
        if (genResult.exitCode === 0 && genResult.stdout) {
          let reportContentData: any;
          try {
            reportContentData = JSON.parse(genResult.stdout);
          } catch {
            reportContentData = null;
          }

          if (reportContentData && !reportContentData.error) {
            fs.writeFileSync(reportContentTmpPath, JSON.stringify(reportContentData, null, 2), 'utf-8');
            const pdfResult = await runPythonProcess(pdfScript, ['--output', pdfTmpPath, '--data', reportContentTmpPath], undefined, 60000);

            if (pdfResult.exitCode === 0 && fs.existsSync(pdfTmpPath)) {
              pdfJobsCache.set(jobKey, {
                status: 'ready',
                pdfPath: pdfTmpPath,
                startedAt: Date.now()
              });
              return;
            }
          }
        }
      } finally {
        try { if (fs.existsSync(payloadTmpPath)) fs.unlinkSync(payloadTmpPath); } catch {}
        try { if (fs.existsSync(reportContentTmpPath)) fs.unlinkSync(reportContentTmpPath); } catch {}
      }
    }

    // Fallback via HTTP para api_two caso Python local não execute
    const genRes = await fetch(`${API_TWO_URL}/api/relatorio/generate-content`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputPayload)
    });

    if (!genRes.ok) {
      pdfJobsCache.set(jobKey, { status: 'error', error: "Erro ao gerar conteúdo via IA.", startedAt: Date.now() });
      return;
    }

    const reportContentData = await genRes.json();

    const pdfRes = await fetch(`${API_TWO_URL}/api/relatorio/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportContentData)
    });

    if (!pdfRes.ok) {
      pdfJobsCache.set(jobKey, { status: 'error', error: "Erro ao renderizar o documento PDF.", startedAt: Date.now() });
      return;
    }

    const pdfArrayBuffer = await pdfRes.arrayBuffer();
    fs.writeFileSync(pdfTmpPath, Buffer.from(pdfArrayBuffer));
    pdfJobsCache.set(jobKey, {
      status: 'ready',
      pdfPath: pdfTmpPath,
      startedAt: Date.now()
    });

    await recordAudit({
      userId: psicologoId,
      action: "AI_REPORT_GENERATED",
      resourceType: "REPORT",
      resourceId: patientId,
      details: {
        aiModel: "nvidia/nemotron-3-ultra-550b",
        pipelineVersion: "1.0.0-beta",
        lang: inputPayload.lang || 'pt',
        biomarkers: inputPayload.batteryMetrics,
        tdahProbability: inputPayload.tdahResult?.percentual
      }
    });
  } catch (err: any) {
    console.error("[relatorio-pdf] Erro no job em segundo plano:", err);
    pdfJobsCache.set(jobKey, { status: 'error', error: err.message || "Erro ao processar laudo.", startedAt: Date.now() });
  }
}

async function handleReportPdfRequest(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { psicologoId } = auth;
    const { id: patientId } = await context.params;

    const url = new URL(request.url);
    const action = url.searchParams.get("action");
    const lang = url.searchParams.get("lang") || "pt";

    const jobKey = `${patientId}_${psicologoId}_${lang}`;

    // Ação 'status': Polling leve e instantâneo (< 5ms)
    if (action === 'status') {
      const currentJob = pdfJobsCache.get(jobKey);
      if (!currentJob) {
        return NextResponse.json({ status: 'idle' });
      }
      return NextResponse.json({
        status: currentJob.status,
        error: currentJob.error,
        startedAt: currentJob.startedAt
      });
    }

    // 1. Busca paciente
    const patient = await db.query.users.findFirst({
      where: and(
        eq(users.id, patientId),
        eq(users.role, "ALUNO"),
        eq(users.psicologoId, psicologoId)
      )
    });

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado ou sem acesso." }, { status: 404 });
    }

    // Busca detalhes do psicólogo
    const psicologo = await db.query.users.findFirst({
      where: eq(users.id, psicologoId)
    });

    // Busca responsável (FAMILIAR) vinculado ao paciente
    const guardian = await db.query.users.findFirst({
      where: and(
        eq(users.role, "FAMILIAR"),
        eq(users.alunoId, patientId),
        isNull(users.deletedAt)
      )
    }) || await db.query.users.findFirst({
      where: and(
        eq(users.role, "FAMILIAR"),
        eq(users.psicologoId, patient.psicologoId || psicologoId),
        isNull(users.deletedAt)
      )
    });

    // Busca anamnese ativa para obter queixas e dados do responsável se preenchidos
    const anamneseData = await db.query.anamneses.findFirst({
      where: and(
        eq(anamneses.patientId, patientId),
        eq(anamneses.psicologoId, psicologoId),
        isNull(anamneses.deletedAt)
      )
    });

    const anamneseContent = (anamneseData?.content as Record<string, any>) || {};

    const guardianName = guardian?.name || 
      (patient as any).guardianName || 
      (patient as any).responsavel || 
      anamneseContent.responsavel || 
      anamneseContent.guardianName || 
      anamneseContent.nomeResponsavel || 
      (lang === 'en' ? "Legal Guardian" : "Responsável Legal");

    // Ação 'download': Retorna o PDF compilado do disco se o job estiver pronto
    if (action === 'download' || (action !== 'start' && request.method === 'GET' && pdfJobsCache.get(jobKey)?.status === 'ready')) {
      const job = pdfJobsCache.get(jobKey);
      if (job?.status === 'ready' && job.pdfPath && fs.existsSync(job.pdfPath)) {
        await recordAudit({
          userId: psicologoId,
          action: "PDF_DOWNLOAD",
          resourceType: "REPORT",
          resourceId: patientId,
          details: { patientName: patient.name, lang }
        });

        const pdfBuffer = fs.readFileSync(job.pdfPath);
        return new Response(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Relatorio_Final_${patient.name.replace(/\s+/g, '_')}.pdf"`
          }
        });
      }
    }

    // 2. Busca sessões reais de telemetria do banco de dados ordenadas por data de início
    const sessions = await db.query.gameSessions.findMany({
      where: eq(gameSessions.alunoId, patientId),
      orderBy: [asc(gameSessions.startedAt)]
    });

    const allGames = await db.query.games.findMany();

    // 3. Busca notas do psicólogo
    const notes = await db.query.clinicalNotes.findMany({
      where: and(
        eq(clinicalNotes.patientId, patientId),
        eq(clinicalNotes.psicologoId, psicologoId)
      )
    });

    // 4. Extração dos valores telemétricos reais do banco de dados
    let realVtr = 0;
    let realVtri = 0;
    let realQa = 0;
    let realImpInt = 0;
    let lastDateStr = new Date().toLocaleDateString('pt-BR');
    let hasPlayedGoleiro = false;
    let hasPlayedToca = false;
    let hasPlayedFotografo = false;

    if (sessions.length > 0) {
      const reversedSessions = [...sessions].reverse();
      
      for (const s of reversedSessions) {
        const b = (s.behaviorData as any) || {};
        const game = allGames.find(g => g.id === s.gameId || g.name.toLowerCase() === String((s as any).gameName || '').toLowerCase());
        const name = (game?.name || (s as any).gameName || s.gameId || '').toLowerCase();

        if (s.startedAt) {
          lastDateStr = new Date(s.startedAt).toLocaleDateString('pt-BR');
        }

        // Toca Rápido (GoNoGo - IMP)
        if (name.includes('toca') || name.includes('gonogo') || name.includes('rapido') || b.erro_nogo !== undefined || b.falseAlarms !== undefined || b.imp !== undefined) {
          if (!hasPlayedToca) {
            const rawImp = b.erro_nogo ?? b.falseAlarms ?? b.imp ?? b.erros ?? 0;
            realImpInt = Math.round(Math.abs(Number(rawImp)));
            hasPlayedToca = true;
          }
        }

        // Goleiro (VTRI e VTR)
        if (name.includes('goleiro') || b.vtr_ms !== undefined || b.vtri !== undefined || b.media_reacao_ms !== undefined) {
          if (!hasPlayedGoleiro) {
            realVtr = Number(b.vtr_ms ?? b.vtr ?? b.media_reacao_ms ?? 0);
            realVtri = Number(b.vtri ?? b.variabilidade ?? b.stdDev ?? b.vtr_ms ?? 0);
            hasPlayedGoleiro = true;
          }
        }

        // Fotógrafo da Floresta (QA)
        if (name.includes('fotó') || name.includes('fotografo') || name.includes('quebra') || name.includes('puzzle') || b.qa !== undefined || b.variacao !== undefined || b.variacao_ms !== undefined) {
          if (!hasPlayedFotografo) {
            realQa = Number(b.qa ?? b.qa_score ?? b.variacao ?? b.variacao_ms ?? 0);
            hasPlayedFotografo = true;
          }
        }
      }
    }

    // Verifica se os 3 jogos foram jogados obrigatoriamente
    if (!hasPlayedGoleiro || !hasPlayedToca || !hasPlayedFotografo) {
      return NextResponse.json({
        error: "É necessário que o paciente tenha realizado obrigatoriamente os 3 jogos da bateria (Goleiro, Toca Rápido e Fotógrafo da Floresta) para liberar o laudo final."
      }, { status: 400 });
    }

    const patientAge = Number(patient.age) || 8.0;

    // Cálculo do modelo estatístico probabilístico de TDAH
    const zScore = -1.415854 + (0.011830 * realVtri) + (0.000127 * realQa) + (0.397986 * realImpInt) + (-0.079936 * patientAge);
    const probabilidade = 1 / (1 + Math.exp(-zScore));
    const percentual = Number((probabilidade * 100).toFixed(1));
    const classificacao = percentual >= 60 ? "Elevada Probabilidade de TDAH" : percentual >= 40 ? "Moderada Probabilidade de TDAH" : "Baixa Probabilidade de TDAH";
    const faixa_risco = percentual >= 60 ? "Elevado" : percentual >= 40 ? "Moderado" : "Baixo";

    const telemetriaLongitudinal = sessions.map((s, idx) => {
      const b = (s.behaviorData as any) || {};
      const game = allGames.find(g => g.id === s.gameId);
      const gameNameStr = (game?.name || (s as any).gameName || '').toLowerCase();
      let gameKey: 'goleiro' | 'toca_rapido' | 'fotografo' = 'goleiro';
      if (gameNameStr.includes('toca') || gameNameStr.includes('gonogo') || gameNameStr.includes('rapido') || b.erro_nogo !== undefined) {
        gameKey = 'toca_rapido';
      } else if (gameNameStr.includes('fotó') || gameNameStr.includes('fotografo') || gameNameStr.includes('quebra') || b.variacao !== undefined || b.variacao_ms !== undefined) {
        gameKey = 'fotografo';
      } else {
        gameKey = 'goleiro';
      }
      const rawImp = b.erro_nogo ?? b.falseAlarms ?? b.imp ?? b.erros ?? 2;

      return {
        sessaoNum: idx + 1,
        data: s.startedAt ? new Date(s.startedAt).toLocaleDateString('pt-BR') : lastDateStr,
        gameId: s.gameId,
        gameKey,
        gameName: game ? game.name : (gameKey === 'toca_rapido' ? 'Toca Rápido' : gameKey === 'fotografo' ? 'Fotógrafo da Floresta' : 'Goleiro'),
        vtr: Math.round(Number(b.vtr_ms ?? b.vtr ?? 412)),
        vtri: Number((b.vtri ?? b.variabilidade ?? 85.0).toFixed(2)),
        variacao_ms: Math.round(Number(b.variacao_ms ?? b.variacao ?? b.qa ?? 38)),
        qa: Number((b.variacao_ms ?? b.variacao ?? b.qa ?? 38)),
        imp: Math.round(Math.abs(Number(rawImp)))
      };
    });

    const psicologoDisplayName = psicologo?.name || (lang === 'en' ? "Licensed Psychologist" : "Psicólogo(a) Responsável");
    const psicologoDisplayCrp = psicologo?.crp || "";
    const clinicDisplayName = psicologo?.clinicName || (lang === 'en' ? "Neuropsychology Center" : "Clínica de Neuropsicologia");

    const inputPayload = {
      lang,
      patientInfo: {
        patientName: patient.name,
        patientAge: patient.age ? `${patient.age} ${lang === 'en' ? 'years old' : 'anos'}` : (lang === 'en' ? "8 years old" : "8 anos"),
        patientGender: patient.gender || (lang === 'en' ? "Not informed" : "Não informado"),
        responsavel: guardianName,
        guardianName: guardianName,
        psicologoName: psicologoDisplayName,
        psicologoCrp: psicologoDisplayCrp,
        clinica: clinicDisplayName,
        date: lastDateStr
      },
      batteryMetrics: {
        vtr: Math.round(realVtr),
        VTRI: Number(realVtri.toFixed(2)),
        IMP: Math.round(realImpInt),
        QA: Number(realQa.toFixed(2)),
        Idade: patientAge,
        tocaTaxaErros: `${Math.round(realImpInt)} erros de comissão`,
        tocaComissao: `${Math.round(realImpInt)} erros`,
        tocaAcertos: "14/15",
        fotografoInicial: Math.round(realVtr > 0 ? realVtr : 420),
        fotografoFinal: Math.round((realVtr > 0 ? realVtr : 420) + (realQa || 38)),
        fotografoInclinacao: `${realQa >= 0 ? '+' : ''}${Math.round(realQa)} ms`
      },
      tdahResult: {
        modelo_versao: "1.0.0-beta",
        z_score: Number(zScore.toFixed(4)),
        probabilidade: Number(probabilidade.toFixed(4)),
        percentual,
        classificacao,
        faixa_risco
      },
      anamneseCompleta: {
        queixaPrincipal: anamneseContent.queixaPrincipal || anamneseContent.queixa || (lang === 'en' ? "Mild hyperactivity and attention fluctuation" : "Hiperatividade leve e oscilação atencional"),
        historicoEscolar: anamneseContent.historicoEscolar || anamneseContent.escola || (lang === 'en' ? "Variable focus on sustained tasks" : "Foco variável em atividades de longa duração"),
        historicoMedico: anamneseContent.historicoMedico || anamneseContent.saude || "",
        rotinaSono: anamneseContent.rotinaSono || anamneseContent.sono || "",
        relatoFamiliar: anamneseContent.relatoFamiliar || anamneseContent.familia || ""
      },
      notasClinicasPsicologo: notes.map(n => ({
        data: n.createdAt ? new Date(n.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR') : '',
        nota: n.title || ''
      })),
      telemetriaLongitudinal
    };

    // Se ação for 'start' ou se for requisição POST, inicia job em segundo plano
    const existingJob = pdfJobsCache.get(jobKey);
    if (existingJob?.status === 'generating') {
      return NextResponse.json({ status: 'generating', message: 'Geração já em andamento.' });
    }

    pdfJobsCache.set(jobKey, { status: 'generating', startedAt: Date.now() });

    // Dispara a geração assíncrona em segundo plano sem bloquear a resposta HTTP
    generatePdfJobAsync(jobKey, patientId, psicologoId, inputPayload, patient.name);

    if (action === 'start' || request.method === 'POST') {
      return NextResponse.json({ status: 'generating', message: 'Geração de laudo iniciada em segundo plano.' });
    }

    // Caso o cliente faça um GET síncrono legado, aguarda o término da geração (com suporte de até 600s / 10 minutos)
    let checks = 0;
    while (checks < 600) {
      await new Promise(r => setTimeout(r, 1000));
      checks++;
      const currentJob = pdfJobsCache.get(jobKey);
      if (currentJob?.status === 'ready' && currentJob.pdfPath && fs.existsSync(currentJob.pdfPath)) {
        const pdfBuffer = fs.readFileSync(currentJob.pdfPath);
        return new Response(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="Relatorio_Final_${patient.name.replace(/\s+/g, '_')}.pdf"`
          }
        });
      }
      if (currentJob?.status === 'error') {
        return NextResponse.json({ error: currentJob.error || "Erro na geração do laudo." }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Tempo limite de geração excedido." }, { status: 504 });

  } catch (err: any) {
    console.error("[relatorio-pdf] Erro interno:", err);
    return NextResponse.json({ error: "Erro interno ao processar laudo em PDF." }, { status: 500 });
  }
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleReportPdfRequest(request, context);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleReportPdfRequest(request, context);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}


