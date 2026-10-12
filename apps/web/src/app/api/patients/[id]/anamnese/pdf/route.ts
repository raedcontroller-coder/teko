import { NextResponse } from 'next/server';
import { db } from '../../../../../../../../../packages/db/db/index';
import { users, anamneses } from '../../../../../../../../../packages/db/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_teko_app");

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

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { psicologoId } = auth;
    const { id: patientId } = await context.params;

    // 1. Fetch Patient and Psychologist details (Enforce RLS strictly)
    const patient = await db.query.users.findFirst({
      where: and(
        eq(users.id, patientId),
        eq(users.role, "ALUNO"),
        eq(users.psicologoId, psicologoId)
      )
    });

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado ou sem permissão de acesso." }, { status: 404 });
    }

    const psicologo = await db.query.users.findFirst({
      where: eq(users.id, psicologoId)
    });

    // 2. Fetch guardian (FAMILIAR) linked to patient
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

    // 3. Fetch active anamnese content from DB (Enforce RLS strictly)
    const anamneseData = await db.query.anamneses.findFirst({
      where: and(
        eq(anamneses.patientId, patientId),
        eq(anamneses.psicologoId, psicologoId),
        isNull(anamneses.deletedAt)
      )
    });

    const url = new URL(request.url);
    const lang = url.searchParams.get("lang") || "pt";

    const rawContent = (anamneseData?.content as Record<string, any>) || {};

    const guardianName = guardian?.name || 
      (patient as any).guardianName || 
      (patient as any).responsavel || 
      rawContent.responsavel || 
      rawContent.guardianName || 
      rawContent.nomeResponsavel || 
      (lang === 'en' ? "Legal Guardian" : "Responsável Legal");

    // Consolidate dynamic payload for PDF generator
    const pdfPayload = {
      ...rawContent,
      lang,
      patientName: patient.name,
      patientAge: patient.age ? `${patient.age} ${lang === 'en' ? 'years' : 'anos'}` : "",
      patientGender: patient.gender || (patient as any).gender || rawContent.patientGender || "",
      responsavel: guardianName,
      guardianName: guardianName,
      psicologoName: psicologo?.name || (lang === 'en' ? "Teko Specialist" : "Profissional Teko"),
      psicologoCrp: psicologo?.crp || (psicologo as any)?.crp || rawContent.psicologoCrp || "",
      clinica: psicologo?.clinicName || (psicologo as any)?.clinica || rawContent.clinica || (lang === 'en' ? "Teko Neuropsychology Center" : "Centro Teko de Neuropsicologia"),
      date: anamneseData?.updatedAt 
        ? new Date(anamneseData.updatedAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR') 
        : new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'pt-BR'),
    };

    // 3. Temporary PDF file paths
    const tmpDir = os.tmpdir();
    const pdfTmpPath = path.join(tmpDir, `anamnese-${patientId}-${Date.now()}.pdf`);
    
    // Resolve absolute path to the Python PDF generator script with fallback
    let pyScript = path.resolve(process.cwd(), '../api_two/src/pdfs/teko_modelo_anamnese.py');
    if (!fs.existsSync(pyScript)) {
      pyScript = path.resolve(process.cwd(), 'apps/api_two/src/pdfs/teko_modelo_anamnese.py');
    }
    if (!fs.existsSync(pyScript)) {
      pyScript = path.join(__dirname, '../../../../../../../../api_two/src/pdfs/teko_modelo_anamnese.py');
    }

    // 4. Spawn Python process to generate PDF on-the-fly
    const scriptDir = path.dirname(pyScript);
    const pythonProcess = spawn('python', [pyScript, '--output', pdfTmpPath, '--lang', lang, '--data', JSON.stringify(pdfPayload)], {
      cwd: scriptDir
    });

    let stderr = '';
    if (pythonProcess.stderr) {
      pythonProcess.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });
    }

    const exitCode = await new Promise((resolve) => {
      pythonProcess.on('close', resolve);
      pythonProcess.on('error', (err) => {
        stderr += err.message;
        resolve(1);
      });
    });

    if (exitCode !== 0 || !fs.existsSync(pdfTmpPath)) {
      console.error("Python PDF Error (exit code", exitCode, "):", stderr, "Script Path:", pyScript);
      return NextResponse.json({ error: `Erro ao gerar PDF da anamnese: ${stderr || 'script execution failed'}` }, { status: 500 });
    }

    // 5. Read PDF Buffer and clean temporary file (no database persistence)
    const pdfBuffer = fs.readFileSync(pdfTmpPath);
    try {
      fs.unlinkSync(pdfTmpPath);
    } catch {}

    const sanitizedPatientName = patient.name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Anamnese_${sanitizedPatientName}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });

  } catch (error) {
    console.error("API Anamnese PDF Route Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor ao gerar PDF." }, { status: 500 });
  }
}
