import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import dotenv from 'dotenv';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

dotenv.config();

const fastify = Fastify({ 
  logger: {
    level: 'info'
  } 
});

fastify.addHook('onRequest', async (request) => {
  console.log(`[${new Date().toLocaleTimeString('pt-BR')}] 📥 ${request.method} ${request.url}`);
});

fastify.addHook('onResponse', async (request, reply) => {
  const statusEmoji = reply.statusCode < 400 ? '✅' : '❌';
  console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ${statusEmoji} ${request.method} ${request.url} -> Status ${reply.statusCode}`);
});

fastify.register(multipart, {
  limits: { fileSize: 10 * 1024 * 1024 }
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

fastify.post('/api/calculo/tdah', async (request, reply) => {
  try {
    const data = request.body as any;

    if (!data) {
      return reply.status(400).send({ error: 'Payload de dados do paciente ausente.' });
    }

    const pyScript = path.join(__dirname, 'calculo_tdah.py');
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
      fastify.log.error(`Erro no script TDAH Python (exit code ${code}): ${errorString}`);
      return reply.status(500).send({ error: 'Erro ao executar inferência de TDAH no Python.' });
    }

    try {
      const result = JSON.parse(dataString);
      if (result.error) {
        return reply.status(400).send({ error: result.error });
      }
      return reply.send(result);
    } catch (parseErr) {
      fastify.log.error(`Erro de parse do retorno do Python (TDAH): ${dataString}`);
      return reply.status(500).send({ error: 'Retorno inválido do script TDAH Python.' });
    }
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro interno no servidor ao chamar inferência TDAH.' });
  }
});
fastify.post('/api/relatorio/generate-content', async (request, reply) => {
  try {
    const data = request.body as any;

    if (!data) {
      return reply.status(400).send({ error: 'Payload de dados do paciente/bateria ausente.' });
    }

    const tmpDir = os.tmpdir();
    const dataTmpPath = path.join(tmpDir, `input-content-${Date.now()}.json`);
    fs.writeFileSync(dataTmpPath, JSON.stringify(data, null, 2), 'utf-8');

    const pyScript = path.join(__dirname, 'generate_content', 'teko_relatorio_final.py');
    const pythonProcess = spawn('python', [pyScript, dataTmpPath]);

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

    try { fs.unlinkSync(dataTmpPath); } catch {}

    if (code !== 0) {
      fastify.log.error(`Erro no script LLM Nemotron Python (exit code ${code}): ${errorString}`);
      return reply.status(500).send({ error: 'Erro ao gerar conteúdo do relatório via LLM Nemotron.' });
    }

    try {
      const result = JSON.parse(dataString);
      if (result.error) {
        return reply.status(400).send({ error: result.error });
      }
      return reply.send(result);
    } catch (parseErr) {
      fastify.log.error(`Erro de parse do retorno da LLM Nemotron: ${dataString}`);
      return reply.status(500).send({ error: 'Retorno inválido da LLM Nemotron.' });
    }
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro interno ao gerar conteúdo do relatório.' });
  }
});

fastify.post('/api/relatorio/pdf', async (request, reply) => {
  try {
    const data = request.body as any || {};
    const tmpDir = os.tmpdir();
    const pdfTmpPath = path.join(tmpDir, `relatorio-final-${Date.now()}.pdf`);
    const dataTmpPath = path.join(tmpDir, `pdf-data-${Date.now()}.json`);
    fs.writeFileSync(dataTmpPath, JSON.stringify(data, null, 2), 'utf-8');

    const pyScript = path.join(__dirname, 'pdfs', 'teko_relatorio_final_pdf.py');
    const pythonProcess = spawn('python', [pyScript, '--output', pdfTmpPath, '--data', dataTmpPath]);

    let errorString = '';
    for await (const chunk of pythonProcess.stderr) {
      errorString += chunk.toString();
    }

    const code = await new Promise((resolve) => {
      pythonProcess.on('close', resolve);
    });

    try { fs.unlinkSync(dataTmpPath); } catch {}

    if (code !== 0 || !fs.existsSync(pdfTmpPath)) {
      fastify.log.error(`Erro no script PDF Relatório Final Python (exit code ${code}): ${errorString}`);
      return reply.status(500).send({ error: 'Erro ao gerar PDF do relatório final no Python.' });
    }

    const stream = fs.createReadStream(pdfTmpPath);
    stream.on('close', () => {
      try { fs.unlinkSync(pdfTmpPath); } catch {}
    });

    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', 'attachment; filename="Relatorio_Final_Teko.pdf"')
      .send(stream);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro interno ao gerar PDF do relatório final.' });
  }
});

fastify.post('/api/anamnese/pdf', async (request, reply) => {
  try {
    const data = request.body as any || {};
    const tmpDir = os.tmpdir();
    const pdfTmpPath = path.join(tmpDir, `anamnese-${Date.now()}.pdf`);
    const pyScript = path.join(__dirname, 'pdfs', 'teko_modelo_anamnese.py');

    const pythonProcess = spawn('python', [pyScript, '--output', pdfTmpPath, '--data', JSON.stringify(data)]);

    let errorString = '';
    for await (const chunk of pythonProcess.stderr) {
      errorString += chunk.toString();
    }

    const code = await new Promise((resolve) => {
      pythonProcess.on('close', resolve);
    });

    if (code !== 0 || !fs.existsSync(pdfTmpPath)) {
      fastify.log.error(`Erro no script PDF Anamnese Python (exit code ${code}): ${errorString}`);
      return reply.status(500).send({ error: 'Erro ao gerar PDF da anamnese no Python.' });
    }

    const stream = fs.createReadStream(pdfTmpPath);
    stream.on('close', () => {
      try { fs.unlinkSync(pdfTmpPath); } catch {}
    });

    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', 'attachment; filename="Anamnese.pdf"')
      .send(stream);
  } catch (err) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro interno ao gerar PDF da anamnese.' });
  }
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3002;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`\n==================================================`);
    console.log(`🚀 [API V2 - CÁLCULOS PSICOMÉTRICOS & TEKA]`);
    console.log(`📡 Servidor rodando em: http://localhost:${port}`);
    console.log(`📋 Logs estruturados ativos com Pino Pretty`);
    console.log(`==================================================\n`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
