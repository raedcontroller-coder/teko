import Fastify from 'fastify';
import multipart from '@fastify/multipart';
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
