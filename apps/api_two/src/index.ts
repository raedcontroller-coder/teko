import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

dotenv.config();

const fastify = Fastify({ logger: true });

fastify.register(multipart, {
  limits: { fileSize: 10 * 1024 * 1024 }
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper para Semantic Biasing do Whisper
// Categorias sincronizadas com apps/mobile/src/data/categories.ts
const getCategoryPrompt = (category: string) => {
  const mapping: Record<string, string> = {
    // Simples (Níveis 1-6)
    'Cores': 'Azul, vermelho, amarelo, verde, rosa, roxo, laranja, branco, preto, marrom.',
    'Animais': 'Cachorro, gato, leão, elefante, peixe, pássaro, cobra, sapo, borboleta, cavalo.',
    'Frutas': 'Maçã, banana, laranja, uva, morango, pera, melancia, abacaxi, manga, limão.',
    'Doces': 'Chocolate, bala, pirulito, sorvete, chiclete, bolo, brigadeiro, pudim.',
    'Brinquedos': 'Bola, boneca, carrinho, urso de pelúcia, pipa, blocos, quebra-cabeça, pião, skate.',
    'Bebidas': 'Água, suco, refrigerante, leite, achocolatado, chá, vitamina.',
    'Brincadeiras': 'Pega-pega, esconde-esconde, amarelinha, pular corda, queimada.',
    'Roupas': 'Camiseta, calça, vestido, sapato, meia, boné, blusa, casaco, saia, bermuda.',
    'Partes do Corpo Humano': 'Cabeça, ombro, joelho, pé, mão, olho, boca, nariz, orelha, barriga, dedo.',
    'Bichos de Fazenda': 'Vaca, cavalo, porco, ovelha, galinha, pato, boi, cabra, burro, peru.',

    // Médio (Níveis 7-14)
    'Alimentos Saudáveis': 'Maçã, banana, brócolis, cenoura, salada, peixe, frango, tomate.',
    'Esportes': 'Futebol, basquete, vôlei, natação, judô, corrida, ginástica, tênis.',
    'Veículos': 'Carro, ônibus, avião, trem, bicicleta, moto, barco, caminhão.',
    'Material Escolar': 'Caderno, lápis, borracha, régua, mochila, tesoura, cola, caneta, apontador, livro.',
    'Móveis de Casa': 'Sofá, cama, mesa, cadeira, armário, prateleira, geladeira, fogão, televisão.',
    'Coisas da Cozinha': 'Panela, colher, garfo, faca, liquidificador, fogão, geladeira, prato, copo, frigideira.',
    'Super-Heróis': 'Homem-Aranha, Batman, Super-Homem, Mulher-Maravilha, Flash, Hulk, Capitão América.',
    'Desenhos Animados': 'Peppa Pig, Ben 10, Pokémon, Bob Esponja, Patrulha Canina, Turma da Mônica, Moranguinho.',
    'Lugares para Passear': 'Parque, praia, shopping, cinema, zoológico, museu, praça, clube, fazenda, campo.',
    'Comidas de Aniversário': 'Bolo, brigadeiro, beijinho, pipoca, refrigerante, salgadinho, pão de queijo, coxinha.',

    // Complexo (Níveis 15+)
    'Coisas do céu': 'Sol, lua, estrela, nuvem, avião, pássaro, pipa, helicóptero.',
    'Bichos que Voam': 'Pássaro, borboleta, abelha, mosca, libélula, besouro, morcego, águia, pombo, mosquito, dragão, fênix, grifo.',
    'Instrumentos Musicais': 'Violão, piano, bateria, flauta, pandeiro, guitarra, teclado, trompete, sanfona.',
    'Profissões': 'Médico, professor, bombeiro, policial, padeiro, dentista, engenheiro, veterinário.',
    'Coisas Verdes': 'Folha, sapo, brócolis, pepino, maçã verde, abacate, grama, ervilha, planta, relva, goiaba, limão.',
    'Coisas Redondas': 'Bola, laranja, moeda, relógio, pneu, planeta, lua cheia, pizza, roda, melancia.'
  };
  const examples = mapping[category] ?? 'várias palavras que pertencem a essa categoria.';
  return `O áudio a seguir é de uma criança de 5 a 12 anos brincando de um jogo de palavras em português. A criança deve falar uma palavra da categoria "${category}". Exemplos de respostas válidas: ${examples}`;
};

// Frases que o Whisper alucina quando recebe áudio vazio/silencioso
const HALLUCINATION_PATTERNS = [
  // Alucinações comuns do Whisper quando recebe áudio vazio/silencioso
  'exemplos de respostas válidas',
  'exemplos de respostas validas',
  'você tem que clicar',
  'obrigado por assistir',
  // Frases de YouTube que o Whisper alucina com ruído de fundo
  'inscreva-se no canal',
  'inscreva no canal',
  'se inscreve no canal',
  'ative o sino',
  'deixar o seu like',
  'deixe o seu like',
  'a gente se vê na próxima',
  'a gente se ve na proxima',
  'curta e compartilhe',
];

const isHallucination = (text: string): boolean => {
  const lower = text.toLowerCase().trim();
  return HALLUCINATION_PATTERNS.some(p => lower.includes(p));
};

fastify.post('/api/bomba/validate', async (request, reply) => {
  let category = 'Categoria desconhecida';
  let usedWords: string[] = [];
  let tempFilePath: string | null = null;

  try {
    // Iterar sobre todas as parts do multipart para capturar campos ANTES e DEPOIS do arquivo
    const parts = request.parts();

    for await (const part of parts) {
      if (part.type === 'field') {
        // Campo de texto (category, etc.)
        if (part.fieldname === 'category') {
          category = String(part.value);
        } else if (part.fieldname === 'usedWords') {
          try {
            usedWords = JSON.parse(String(part.value));
          } catch (e) {
            console.error('[V2] Erro ao parsear usedWords:', e);
          }
        }
      } else if (part.type === 'file') {
        // Arquivo de áudio — salvar em disco
        tempFilePath = path.join(os.tmpdir(), `audio-v2-${Date.now()}.m4a`);
        const writeStream = fs.createWriteStream(tempFilePath);
        await new Promise<void>((resolve, reject) => {
          part.file.pipe(writeStream)
            .on('finish', resolve)
            .on('error', reject);
        });
      }
    }

    if (!tempFilePath) {
      return reply.status(400).send({ error: 'Nenhum arquivo de áudio recebido.' });
    }

    console.log(`\n[V2] Categoria recebida: "${category}"`);
    console.log(`[V2] Whisper Prompt ativado para: "${category}"`);

    // 1. Whisper com Viés Semântico (Prompt Tuning)
    const whisperPrompt = getCategoryPrompt(category);

    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: 'whisper-1',
      language: 'pt',
      prompt: whisperPrompt,
    });

    const transcriptionText = transcriptionResponse.text.trim();

    // Limpa arquivo temporário imediatamente após a transcrição
    fs.unlink(tempFilePath, () => { });
    tempFilePath = null;

    // Detecção de áudio vazio (alucinação do Whisper)
    if (!transcriptionText || isHallucination(transcriptionText)) {
      console.log(`[V2] Áudio vazio ou alucinação detectada: "${transcriptionText}"`);
      return reply.send({
        valid: false,
        message: 'Não ouvi nada. Segure o botão e fale mais perto!',
        transcription: '',
      });
    }

    console.log(`[V2] Whisper Transcreveu: "${transcriptionText}"`);

    // 2. Validador Semântico-Fonético (GPT-4o-mini)
    // O prompt do sistema é genérico para todas as categorias.
    // Os exemplos da categoria específica vão no user message, junto com a transcrição.
    const categoryExamples = getCategoryPrompt(category)
      .split('Exemplos de respostas válidas: ')[1] ?? '';

    let usedWordsContext = '';
    if (usedWords.length > 0) {
      usedWordsContext = `\n7. PALAVRAS REPETIDAS (PROIBIDO): A criança NÃO PODE repetir palavras. Ela JÁ DISSE as seguintes palavras nesta categoria: ${JSON.stringify(usedWords)}. Se a transcrição corresponder EXATAMENTE ou for UM SINÔNIMO ÓBVIO de alguma dessas palavras, retorne FALSE e diga que ela já disse essa palavra!`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Você é um especialista em fonética infantil avaliando respostas em um jogo de palavras para crianças de 5 a 12 anos.
O Whisper transcreveu o que a criança falou. Sua tarefa é decidir se essa transcrição corresponde a uma palavra válida da categoria informada.

REGRAS DE TOLERÂNCIA FONÉTICA (OBRIGATÓRIAS):
1. SUBSTITUIÇÕES VOCÁLICAS: Crianças inserem ou trocam vogais. Ex: "Esfeira" = "Esfera", "Aivão" = "Avião", "Maçan" = "Maçã".
2. SIMPLIFICAÇÃO CONSONANTAL: Crianças eliminam consoantes difíceis. Ex: "Pato" = "Prato", "Teem" = "Trem", "Futa" = "Fruta".
3. TROCAS CONSONANTAIS: Ex: "Caçolo" = "Cachorro", "Fiolim" = "Violim".
4. ONOMATOPEIAS: "Au au" = Cachorro, "Miau" = Gato, "Muu" = Vaca.
5. CRIATURAS FICTÍCIAS E MITOLÓGICAS: Se a categoria descreve uma característica (ex: "Bichos que Voam", "Coisas Verdes"), aceite criaturas fictícias/mitológicas que tenham essa característica no imaginário popular infantil. Ex: "Dragão" voa → TRUE para "Bichos que Voam". "Fênix" voa → TRUE. "Sereia" nada → TRUE para categoria de animais aquáticos.
6. REGRA DE OURO: Se a transcrição soa como poderia ser dita por uma criança tentando falar uma palavra da categoria, retorne TRUE. Em caso de dúvida, SEMPRE prefira TRUE.${usedWordsContext}

Sua resposta DEVE ser um objeto JSON estrito com APENAS 2 chaves:
- "valid": boolean (true ou false)
- "message": frase MUITO curta e simples (max 10 palavras). Se true, celebre. Se false, incentive carinhosamente. NÃO USE EMOJIS NENHUM.`
        },
        {
          role: 'user',
          content: `Categoria: "${category}"
Exemplos válidos para essa categoria: ${categoryExamples}
Transcrição do que a criança falou: "${transcriptionText}"

Essa transcrição é uma resposta válida (ou aproximação fonética válida) para a categoria "${category}"?`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const resultText = completion.choices[0].message.content?.trim() || '{}';

    let resultData = { valid: false, message: 'Puxa, não entendi. Pode repetir?' };
    try {
      resultData = JSON.parse(resultText);
      console.log('[V2] GPT Validou:', resultData);
    } catch (e) {
      console.error('[V2] Erro parse JSON:', resultText);
    }

    return reply.send({
      valid: resultData.valid,
      message: resultData.message,
      transcription: transcriptionText
    });

  } catch (err: any) {
    // Limpeza de emergência se algo falhou antes de deletar
    if (tempFilePath) fs.unlink(tempFilePath, () => { });

    const errCode = err?.code ?? err?.error?.code ?? null;
    const errMessage: string = err?.message ?? '';

    // Áudio curtíssimo (clique acidental < 0.1s)
    if (errCode === 'audio_too_short' || errMessage.includes('too short')) {
      console.warn('[V2] Áudio muito curto (clique acidental).');
      return reply.status(200).send({
        valid: false,
        transcription: '',
        message: 'Ops! Segure o botão um pouquinho mais para eu te ouvir! 🎤',
      });
    }

    // Arquivo corrompido ou formato inválido (arquivo vazio / codec inválido)
    if (errMessage.includes('could not be decoded') || errMessage.includes('format is not supported')) {
      console.warn('[V2] Arquivo de áudio corrompido ou muito curto para decodificar.');
      return reply.status(200).send({
        valid: false,
        transcription: '',
        message: 'Não consegui ouvir direito. Segure o botão e fale bem pertinho! 🎙️',
      });
    }

    // Erros reais de servidor — logado no terminal, mensagem amigável para o app
    fastify.log.error(err);
    return reply.status(500).send({
      error: 'Erro interno V2',
      message: 'Algo deu errado aqui. Tenta de novo!',
    });
  }
});

fastify.post('/api/bomba/slope-change', async (request, reply) => {
  try {
    const { reactionTimes } = request.body as { reactionTimes: number[] };
    
    if (!reactionTimes || !Array.isArray(reactionTimes)) {
      return reply.status(400).send({ error: 'Array reactionTimes inválido ou ausente.' });
    }

    const pyScript = path.join(__dirname, 'piecewise.py');
    const pythonProcess = spawn('python', [pyScript, JSON.stringify(reactionTimes)]);

    let dataString = '';
    let errorString = '';

    for await (const chunk of pythonProcess.stdout) {
      dataString += chunk.toString();
    }
    for await (const chunk of pythonProcess.stderr) {
      errorString += chunk.toString();
    }

    const code = await new Promise((resolve) => {
      pythonProcess.on('close', resolve);
    });

    if (code !== 0) {
      fastify.log.error(`Erro no script Python (exit code ${code}): ${errorString}`);
      return reply.status(500).send({ error: 'Erro ao calcular slope change no Python.' });
    }

    try {
      const result = JSON.parse(dataString);
      if (result.error) {
        return reply.status(400).send({ error: result.error });
      }
      return reply.send(result);
    } catch (parseErr) {
      fastify.log.error(`Erro de parse do retorno do Python: ${dataString}`);
      return reply.status(500).send({ error: 'Retorno inválido do script Python.' });
    }
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro interno no servidor ao chamar Python.' });
  }
});

fastify.post('/api/gonogo/sdt', async (request, reply) => {
  try {
    const data = request.body as any;

    if (!data || typeof data.hits !== 'number') {
      return reply.status(400).send({ error: 'Payload de matriz de confusão inválido.' });
    }

    const pyScript = path.join(__dirname, 'sdt.py');
    const pythonProcess = spawn('python', [pyScript, JSON.stringify(data)]);

    let dataString = '';
    let errorString = '';

    for await (const chunk of pythonProcess.stdout) {
      dataString += chunk.toString();
    }
    for await (const chunk of pythonProcess.stderr) {
      errorString += chunk.toString();
    }

    const code = await new Promise((resolve) => {
      pythonProcess.on('close', resolve);
    });

    if (code !== 0) {
      fastify.log.error(`Erro no script SDT Python (exit code ${code}): ${errorString}`);
      return reply.status(500).send({ error: 'Erro ao calcular SDT no Python.' });
    }

    try {
      const result = JSON.parse(dataString);
      if (result.error) {
        return reply.status(400).send({ error: result.error });
      }
      return reply.send(result);
    } catch (parseErr) {
      fastify.log.error(`Erro de parse do retorno do Python (SDT): ${dataString}`);
      return reply.status(500).send({ error: 'Retorno inválido do script SDT Python.' });
    }
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro interno no servidor ao chamar Python SDT.' });
  }
});

fastify.post('/api/puzzle/metrics', async (request, reply) => {
  try {
    const levels = request.body as any;

    if (!Array.isArray(levels)) {
      return reply.status(400).send({ error: 'Payload de níveis inválido.' });
    }

    const pyScript = path.join(__dirname, 'puzzle.py');
    const pythonProcess = spawn('python', [pyScript, JSON.stringify(levels)]);

    let dataString = '';
    let errorString = '';

    for await (const chunk of pythonProcess.stdout) {
      dataString += chunk.toString();
    }
    for await (const chunk of pythonProcess.stderr) {
      errorString += chunk.toString();
    }

    const code = await new Promise((resolve) => {
      pythonProcess.on('close', resolve);
    });

    if (code !== 0) {
      fastify.log.error(`Erro no script Puzzle Python (exit code ${code}): ${errorString}`);
      return reply.status(500).send({ error: 'Erro ao calcular regressões no Python.' });
    }

    try {
      const result = JSON.parse(dataString);
      if (result.error) {
        return reply.status(400).send({ error: result.error });
      }
      return reply.send(result);
    } catch (parseErr) {
      fastify.log.error(`Erro de parse do retorno do Python (Puzzle): ${dataString}`);
      return reply.status(500).send({ error: 'Retorno inválido do script Puzzle Python.' });
    }
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro interno no servidor ao chamar Python Puzzle.' });
  }
});

fastify.post('/api/calculo/goleiro', async (request, reply) => {
  try {
    const data = request.body as any;

    if (!data || !data.reaction_times_ms || !Array.isArray(data.reaction_times_ms)) {
      return reply.status(400).send({ error: 'Payload de telemetria inválido.' });
    }

    const pyScript = path.join(__dirname, 'calculo_goleiro.py');
    const pythonProcess = spawn('python', [pyScript, JSON.stringify(data)]);

    let dataString = '';
    let errorString = '';

    for await (const chunk of pythonProcess.stdout) {
      dataString += chunk.toString();
    }
    for await (const chunk of pythonProcess.stderr) {
      errorString += chunk.toString();
      // Imprime o print formatado do VTR no terminal Node
      process.stdout.write(chunk.toString());
    }

    const code = await new Promise((resolve) => {
      pythonProcess.on('close', resolve);
    });

    if (code !== 0) {
      fastify.log.error(`Erro no script Goleiro Python (exit code ${code}): ${errorString}`);
      return reply.status(500).send({ error: 'Erro ao calcular VTR no Python.' });
    }

    try {
      const result = JSON.parse(dataString);
      if (result.error) {
        return reply.status(400).send({ error: result.error });
      }
      return reply.send(result);
    } catch (parseErr) {
      fastify.log.error(`Erro de parse do retorno do Python (Goleiro): ${dataString}`);
      return reply.status(500).send({ error: 'Retorno inválido do script Goleiro Python.' });
    }
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro interno no servidor ao chamar Python Goleiro.' });
  }
});

fastify.post('/api/calculo/fotografo', async (request, reply) => {
  try {
    const data = request.body as any;

    if (!data || !data.telemetry || !Array.isArray(data.telemetry)) {
      return reply.status(400).send({ error: 'Payload de telemetria inválido.' });
    }

    const pyScript = path.join(__dirname, 'calculo_fotografo.py');
    const pythonProcess = spawn('python', [pyScript, JSON.stringify(data)]);

    let dataString = '';
    let errorString = '';

    for await (const chunk of pythonProcess.stdout) {
      dataString += chunk.toString();
    }
    for await (const chunk of pythonProcess.stderr) {
      errorString += chunk.toString();
      // Imprime o print formatado do QA no terminal Node
      process.stdout.write(chunk.toString());
    }

    const code = await new Promise((resolve) => {
      pythonProcess.on('close', resolve);
    });

    if (code !== 0) {
      fastify.log.error(`Erro no script Fotografo Python (exit code ${code}): ${errorString}`);
      return reply.status(500).send({ error: 'Erro ao calcular QA no Python.' });
    }

    try {
      const result = JSON.parse(dataString);
      if (result.error) {
        return reply.status(400).send({ error: result.error });
      }
      return reply.send(result);
    } catch (parseErr) {
      fastify.log.error(`Erro de parse do retorno do Python (Fotografo): ${dataString}`);
      return reply.status(500).send({ error: 'Retorno inválido do script Fotografo Python.' });
    }
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro interno no servidor ao chamar Python Fotografo.' });
  }
});

fastify.post('/api/calculo/tocarapido', async (request, reply) => {
  try {
    const data = request.body as any;

    if (!data) {
      return reply.status(400).send({ error: 'Payload vazio.' });
    }

    const pyScript = path.join(__dirname, 'calculo_toca_rapido.py');
    const pythonProcess = spawn('python', [pyScript, JSON.stringify(data)]);

    let dataString = '';
    let errorString = '';

    for await (const chunk of pythonProcess.stdout) {
      dataString += chunk.toString();
    }
    for await (const chunk of pythonProcess.stderr) {
      errorString += chunk.toString();
      // Imprime o print formatado do Impulsividade no terminal Node
      process.stdout.write(chunk.toString());
    }

    const code = await new Promise((resolve) => {
      pythonProcess.on('close', resolve);
    });

    if (code !== 0) {
      fastify.log.error(`Erro no script Toca Rápido Python (exit code ${code}): ${errorString}`);
      return reply.status(500).send({ error: 'Erro ao calcular Impulsividade no Python.' });
    }

    try {
      const result = JSON.parse(dataString);
      if (result.error) {
        return reply.status(400).send({ error: result.error });
      }
      return reply.send(result);
    } catch (parseErr) {
      fastify.log.error(`Erro de parse do retorno do Python (Toca Rápido): ${dataString}`);
      return reply.status(500).send({ error: 'Retorno inválido do script Toca Rápido Python.' });
    }
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro interno no servidor ao chamar Python Toca Rápido.' });
  }
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3002;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`[API V2] Server listening on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
