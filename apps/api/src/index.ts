import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import os from 'os';
import path from 'path';

dotenv.config();

const fastify = Fastify({ logger: true });

// Register multipart support
fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

fastify.post('/api/bomba/validate', async (request, reply) => {
  try {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'No file uploaded' });
    }

    let category = 'Categoria desconhecida';
    if (data.fields && data.fields.category && 'value' in data.fields.category) {
      category = String(data.fields.category.value);
    }

    const tempFilePath = path.join(os.tmpdir(), `audio-${Date.now()}.m4a`);
    const writeStream = fs.createWriteStream(tempFilePath);
    
    await new Promise((resolve, reject) => {
      data.file.pipe(writeStream)
        .on('finish', resolve)
        .on('error', reject);
    });

    // Converter para base64
    const audioBuffer = await fs.promises.readFile(tempFilePath);
    const audioBase64 = audioBuffer.toString('base64');

    // Analisar áudio e texto em uma única chamada multimodal
    const completion = await openai.chat.completions.create({
      model: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
      messages: [
        {
          role: 'user',
          // @ts-ignore - OpenAI SDK types might not fully support OpenRouter audio input formatting yet, but it passes through
          content: [
            {
              type: 'text',
              text: `Transcreva a palavra falada neste áudio e verifique se ela pertence à categoria "${category}".
Sua resposta deve ser APENAS um objeto JSON válido, sem nenhuma marcação markdown.
Exemplo:
{"transcription": "cachorro", "valid": true}`
            },
            {
              type: 'input_audio',
              input_audio: {
                data: audioBase64,
                format: 'm4a'
              }
            }
          ]
        }
      ]
    });

    const resultText = completion.choices[0].message.content?.trim() || "{}";
    
    // Limpar o markdown de código caso o modelo retorne
    const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let resultData = { transcription: "", valid: false };
    try {
      resultData = JSON.parse(cleanJson);
    } catch (e) {
      console.error("Falha ao fazer parse do JSON do Nemotron:", cleanJson);
    }

    fs.unlink(tempFilePath, () => {});

    return reply.send({
      valid: resultData.valid,
      transcription: resultData.transcription,
      resultText: cleanJson
    });

  } catch (err: any) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro interno ao validar áudio', message: err.message });
  }
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
