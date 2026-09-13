/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextResponse } from 'next/server';
import { db } from '../../../../../../../../packages/db/db/index';
import { users, games, gameSessions } from '../../../../../../../../packages/db/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_teko_app");
const OPENROUTER_API_KEY = process.env.apiKey_OpenRouter || process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_MODEL = "inclusionai/ling-3.0-flash-sante:free";

// Função para chamar o OpenRouter com o modelo nvidia/nemotron-3.5-lightning:free
async function fetchOpenRouterAnalysis(
  gameTitle: string,
  gameTypeKey: 'fotografo' | 'goleiro' | 'toca_rapido',
  stats: { firstVal: number; lastVal: number; diff: number; trendText: string; totalSessions: number },
  patientName: string
): Promise<string | null> {
  if (!OPENROUTER_API_KEY) {
    console.warn("⚠️ OpenRouter API Key (apiKey_OpenRouter) não encontrada em .env");
    return null;
  }

  try {
    let metricDescription = "";
    let interpretationHint = "";

    if (gameTypeKey === 'goleiro') {
      const isImprovement = stats.diff < 0;
      interpretationHint = isImprovement
        ? `REDUÇÃO da oscilação (desvio padrão diminuiu de ${stats.firstVal}ms para ${stats.lastVal}ms, variação de ${stats.diff}ms). Significado clínico: MELHORA na estabilidade atencional e maior consistência no tempo de reação do paciente.`
        : `AUMENTO da oscilação (desvio padrão subiu de ${stats.firstVal}ms para ${stats.lastVal}ms, variação de +${stats.diff}ms). Significado clínico: MAIOR INCONSISTÊNCIA no tempo de resposta e oscilações no padrão de atenção atencional do paciente.`;
      metricDescription = `Jogo do Goleiro (Oscilação no Tempo de Reação / Desvio Padrão da Atenção em ms). ${interpretationHint}`;
    } else if (gameTypeKey === 'fotografo') {
      const isImprovement = stats.diff < 0;
      interpretationHint = isImprovement
        ? `REDUÇÃO da variação de foco (desvio padrão diminuiu de ${stats.firstVal}ms para ${stats.lastVal}ms, variação de ${stats.diff}ms). Significado clínico: MELHORA no foco visual e maior estabilização da atenção sustentada.`
        : `AUMENTO da variação de foco (desvio padrão subiu de ${stats.firstVal}ms para ${stats.lastVal}ms, variação de +${stats.diff}ms). Significado clínico: MAIOR OSCILAÇÃO do foco visual e menor estabilidade atencional.`;
      metricDescription = `Fotógrafo da Floresta (Variação de Foco Visual / Atenção Sustentada em ms). ${interpretationHint}`;
    } else {
      const isImprovement = stats.diff < 0;
      const isEqual = stats.diff === 0;
      if (isEqual) {
        interpretationHint = `MANUTENÇÃO do número de toques indevidos em ${stats.lastVal} toque(s). Significado clínico: Estabilidade no padrão de controle inibitório.`;
      } else if (isImprovement) {
        interpretationHint = `REDUÇÃO nos toques indevidos (de ${stats.firstVal} para ${stats.lastVal} toques, redução de ${Math.abs(stats.diff)} erro(s)). Significado clínico: MELHORA significativa no controle inibitório e redução da impulsividade.`;
      } else {
        interpretationHint = `AUMENTO nos toques indevidos (de ${stats.firstVal} para ${stats.lastVal} toques, aumento de +${stats.diff} erro(s)). Significado clínico: MAIOR IMPULSIVIDADE e menor eficácia no controle inibitório ao reagir aos estímulos do jogo.`;
      }
      metricDescription = `Toca Rápido! (Toques Indevidos / Erros por Impulsividade). ${interpretationHint}`;
    }

    const systemPrompt = `Você é o Assistente Neuropsicológico Clínico do aplicativo Teko, especializado em psicometria infantil e acompanhamento terapêutico.
Sua função é elaborar uma Análise Assistida precisa para o psicólogo responsável pelo paciente, interpretando fielmente os dados pré-analisados fornecidos.
Diretrizes do laudo:
1. Responda estritamente em Português do Brasil com linguagem clara, profissional e acessível para a área da saúde.
2. Siga estritamente o significado clínico pré-interpretado: se houve aumento de erros ou oscilação, indique piora/maior impulsividade/inconsistência; se houve redução, indique melhora/maior controle inibitório/estabilidade.
3. Seja conciso: escreva entre 2 e 3 frases completas e conclusivas.
4. Evite fórmulas complexas ou jargões matemáticos puros, focando na aplicação prática para o acompanhamento do paciente.
5. Não use markdown, códigos ou tags de raciocínio. Escreva diretamente o parecer clínico.`;

    const userPrompt = `Com base nos dados estatísticos do paciente, elabore o parecer clínico para a aba de Evolução:

Paciente: ${patientName}
Jogo / Mecânica: ${gameTitle}
Histórico de partida (${stats.totalSessions} sessões acumuladas): ${metricDescription}

Parecer Clínico Acessível:`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://tekoapp.com.br",
        "X-Title": "Teko Neuropsychology System",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.5,
        max_tokens: 180,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Erro na chamada OpenRouter (${response.status}):`, errText);
      return null;
    }

    const data = await response.json();
    let content = data?.choices?.[0]?.message?.content?.trim() || "";

    // Limpa possíveis blocos de raciocínio interno (<think>...</think>) que o modelo Nemotron costuma gerar
    if (content.includes("</think>")) {
      content = content.split("</think>").pop()?.trim() || content;
    }
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    return content || null;
  } catch (err) {
    console.error("Exceção ao chamar OpenRouter API:", err);
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: patientId } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      payload = verified.payload;
    } catch (err) {
      return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 401 });
    }

    const url = new URL(request.url);
    const adminPsiId = url.searchParams.get("psicologoId");
    let psicologoId = payload.sub as string;

    if (payload.role === 'GLOBAL_ADMIN') {
      if (adminPsiId) {
        psicologoId = adminPsiId;
      }
    }

    // Validar se o paciente existe
    const patient = await db.query.users.findFirst({
      where: and(
        eq(users.id, patientId),
        eq(users.role, "ALUNO")
      )
    });

    if (!patient) {
      return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
    }

    // Buscar todas as sessões do paciente em ordem cronológica crescente
    const sessions = await db.query.gameSessions.findMany({
      where: eq(gameSessions.alunoId, patientId),
      orderBy: [asc(gameSessions.startedAt)],
    });

    const allGames = await db.query.games.findMany();

    function roundVal(v: number) {
      return Number((Math.round(v * 100) / 100).toFixed(2));
    }

    // Processamento por jogo conforme o cálculo do Python salvo em Avaliações Clínicas
    const processGameData = async (gameTypeKey: 'fotografo' | 'goleiro' | 'toca_rapido') => {
      const filteredSessions = sessions.filter(s => {
        const game = allGames.find(g => g.id === s.gameId);
        if (!game) return false;
        const name = game.name.toLowerCase();
        if (gameTypeKey === 'fotografo') return name.includes('fotó') || name.includes('fotografo') || name.includes('quebra');
        if (gameTypeKey === 'goleiro') return name.includes('goleiro');
        if (gameTypeKey === 'toca_rapido') return name.includes('toca') || name.includes('gonogo') || name.includes('rapido');
        return false;
      });

      if (filteredSessions.length === 0) {
        return {
          hasData: false,
          hasEnoughData: false,
          chartData: [],
          stats: null,
          aiAnalysis: "Nenhuma sessão registrada para este jogo até o momento. Realize dinâmicas no app para computar os dados."
        };
      }

      const chartData = filteredSessions.map((s, index) => {
        const b = (s.behaviorData as any) || {};
        let val = 0;

        if (gameTypeKey === 'fotografo') {
          val = Number(b.variacao ?? b.variacao_ms ?? 0);
        } else if (gameTypeKey === 'goleiro') {
          val = Number(b.vtr_ms ?? b.vtr ?? b.media_reacao_ms ?? 0);
        } else {
          val = Number(b.erro_nogo ?? b.falseAlarms ?? 0);
          if (b.acertos_go === undefined) {
            if (Array.isArray(b.reactionTimesHits)) {
              b.acertos_go = b.reactionTimesHits.length;
            } else if (Array.isArray(b.reaction_times_hits)) {
              b.acertos_go = b.reaction_times_hits.length;
            } else if (typeof b.hits === 'number') {
              b.acertos_go = b.hits;
            }
          }
        }

        return {
          value: Math.abs(roundVal(val)),
          rawVal: roundVal(val),
          label: String(index + 1), // Numeração simples de Sessão (1, 2, 3...)
          date: s.startedAt ? new Date(s.startedAt).toLocaleDateString('pt-BR') : '',
          formattedTime: s.startedAt ? new Date(s.startedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '',
          sessionId: s.id,
          details: b,
        };
      });

      const hasEnoughData = chartData.length >= 3;
      const firstVal = chartData[0].rawVal;
      const lastVal = chartData[chartData.length - 1].rawVal;
      const diff = lastVal - firstVal;

      let trendText = "";
      if (gameTypeKey === 'goleiro') {
        const percentChange = firstVal > 0 ? Math.round(((firstVal - lastVal) / firstVal) * 100) : 0;
        trendText = percentChange >= 0 ? `↘ -${percentChange}% (Estabilização)` : `↗ +${Math.abs(percentChange)}%`;
      } else if (gameTypeKey === 'toca_rapido') {
        const diffErros = lastVal - firstVal;
        trendText = diffErros <= 0 ? `↘ ${diffErros} toque(s)` : `↗ +${diffErros} toque(s)`;
      } else {
        trendText = diff >= 0 ? `↗ +${roundVal(diff)} ms` : `↘ ${roundVal(diff)} ms`;
      }

      const stats = {
        firstVal: roundVal(firstVal),
        lastVal: roundVal(lastVal),
        diff: roundVal(diff),
        trendText,
        totalSessions: chartData.length
      };

      let aiAnalysis = "";
      if (!hasEnoughData) {
        aiAnalysis = `O paciente realizou ${chartData.length} de 3 partidas necessárias. Realize mais partidas para desbloquear o gráfico de tendência.`;
      } else {
        // A Análise Assistida da IA só é recalculada/atualizada em múltiplos de 3 partidas (3, 6, 9, 12...)
        // Para sessões intermediárias (ex: 4 ou 5), utilizamos o bloco consolidado do último ciclo de 3 (ex: primeiras 3 sessões)
        const lastCycleSessionCount = Math.floor(chartData.length / 3) * 3;
        const cycleChartData = chartData.slice(0, lastCycleSessionCount);
        const cycleFirstVal = cycleChartData[0].rawVal;
        const cycleLastVal = cycleChartData[cycleChartData.length - 1].rawVal;
        const cycleDiff = cycleLastVal - cycleFirstVal;

        let cycleTrendText = "";
        if (gameTypeKey === 'goleiro') {
          const percentChange = cycleFirstVal > 0 ? Math.round(((cycleFirstVal - cycleLastVal) / cycleFirstVal) * 100) : 0;
          cycleTrendText = percentChange >= 0 ? `↘ -${percentChange}% (Estabilização)` : `↗ +${Math.abs(percentChange)}%`;
        } else if (gameTypeKey === 'toca_rapido') {
          const diffErros = cycleLastVal - cycleFirstVal;
          cycleTrendText = diffErros <= 0 ? `↘ ${diffErros} toque(s)` : `↗ +${diffErros} toque(s)`;
        } else {
          cycleTrendText = cycleDiff >= 0 ? `↗ +${roundVal(cycleDiff)} ms` : `↘ ${roundVal(cycleDiff)} ms`;
        }

        const cycleStats = {
          firstVal: roundVal(cycleFirstVal),
          lastVal: roundVal(cycleLastVal),
          diff: roundVal(cycleDiff),
          trendText: cycleTrendText,
          totalSessions: lastCycleSessionCount
        };

        const gameTitle = gameTypeKey === 'fotografo' ? 'Fotógrafo da Floresta' : gameTypeKey === 'goleiro' ? 'Jogo do Goleiro' : 'Toca Rápido!';
        
        // Obter a sessão exata do marco (ex: 3ª, 6ª sessão)
        const milestoneSession = filteredSessions[lastCycleSessionCount - 1];
        let cachedAnalysis = (milestoneSession?.flaggedPatterns as any)?.aiAnalysis;

        const forceRefresh = url.searchParams.get("forceRefresh") === "true";
        const isFallback = cachedAnalysis && (cachedAnalysis.includes("O paciente") || cachedAnalysis.includes("A oscilação no tempo") || cachedAnalysis.includes("O índice de toques"));
        if (cachedAnalysis && !forceRefresh && !isFallback) {
          aiAnalysis = cachedAnalysis;
        } else {
          // Se não houver análise salva no banco de dados para a 3ª/6ª sessão, chama o OpenRouter
          const llmResponse = await fetchOpenRouterAnalysis(gameTitle, gameTypeKey, cycleStats, patient.name);

          if (llmResponse) {
            aiAnalysis = llmResponse;
            
            // Persiste no banco de dados no campo flaggedPatterns da sessão marco para CONGELAR/IMUTABILIZAR a análise
            try {
              const existingPatterns = (milestoneSession.flaggedPatterns as any) || {};
              const previousHistory = Array.isArray(existingPatterns.history) ? existingPatterns.history : [];
              
              // Se já existia uma aiAnalysis anterior salva nesta ou em outras sessões, preserva no histórico
              if (existingPatterns.aiAnalysis) {
                previousHistory.push({
                  aiAnalysis: existingPatterns.aiAnalysis,
                  generatedAt: existingPatterns.generatedAt || new Date().toISOString()
                });
              }

              await db.update(gameSessions)
                .set({
                  flaggedPatterns: {
                    ...existingPatterns,
                    aiAnalysis: llmResponse,
                    generatedAt: new Date().toISOString(),
                    history: previousHistory
                  }
                })
                .where(eq(gameSessions.id, milestoneSession.id));
            } catch (dbErr) {
              console.error("Erro ao salvar aiAnalysis no banco:", dbErr);
            }
          } else {
            // Fallback seguro em caso de indisponibilidade da API
            const isImp = cycleDiff < 0;
            if (gameTypeKey === 'fotografo') {
              aiAnalysis = isImp
                ? `O paciente ${patient.name} reduziu a variação de foco de ${cycleFirstVal.toFixed(2)}ms para ${cycleLastVal.toFixed(2)}ms na ${lastCycleSessionCount}ª sessão. O padrão indica melhora na atenção sustentada.`
                : `O paciente ${patient.name} apresentou aumento na variação de foco de ${cycleFirstVal.toFixed(2)}ms para ${cycleLastVal.toFixed(2)}ms na ${lastCycleSessionCount}ª sessão. Observa-se maior oscilação no foco atencional.`;
            } else if (gameTypeKey === 'goleiro') {
              aiAnalysis = isImp
                ? `A oscilação no tempo de resposta reduziu de ${cycleFirstVal.toFixed(2)}ms para ${cycleLastVal.toFixed(2)}ms na ${lastCycleSessionCount}ª partida. Indica maior estabilidade atencional e consistência motora.`
                : `A oscilação no tempo de resposta subiu de ${cycleFirstVal.toFixed(2)}ms para ${cycleLastVal.toFixed(2)}ms na ${lastCycleSessionCount}ª partida. Reflete maior inconsistência no padrão de atenção.`;
            } else {
              aiAnalysis = isImp
                ? `O número de toques indevidos diminuiu de ${cycleFirstVal} na 1ª sessão para ${cycleLastVal} na ${lastCycleSessionCount}ª sessão. Demonstra melhora no controle inibitório.`
                : `O número de toques indevidos aumentou de ${cycleFirstVal} na 1ª sessão para ${cycleLastVal} na ${lastCycleSessionCount}ª sessão. Aponta maior impulsividade no desempenho.`;
            }
          }
        }
      }

      return {
        hasData: true,
        hasEnoughData,
        chartData,
        stats,
        aiAnalysis
      };
    };

    const [fotografoRes, goleiroRes, tocaRapidoRes] = await Promise.all([
      processGameData('fotografo'),
      processGameData('goleiro'),
      processGameData('toca_rapido'),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        fotografo: fotografoRes,
        goleiro: goleiroRes,
        toca_rapido: tocaRapidoRes,
      }
    });

  } catch (error) {
    console.error("API Patient Evolution GET Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

