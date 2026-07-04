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
  apiKey: process.env.OPENAI_API_KEY,
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

    // 1. Transcrição com Whisper
    const transcriptionResponse = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tempFilePath),
      model: 'whisper-1',
      language: 'pt',
    });

    const transcriptionText = transcriptionResponse.text.trim();

    if (!transcriptionText) {
      console.log("-> Áudio vazio/ininteligível");
      fs.unlink(tempFilePath, () => {});
      return reply.send({
        valid: false,
        transcription: "",
        message: "Não consegui ouvir nada! Tente falar um pouquinho mais alto.",
      });
    }

    console.log(`-> Whisper Transcreveu: "${transcriptionText}" para a categoria: "${category}"`);

    // 2. Validação Semântica Infantil com GPT-4o-mini
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Você é um validador de palavras simpático para um jogo educacional infantil. 
Você vai receber a palavra dita pela criança e uma categoria.
Seu trabalho é avaliar se a palavra falada pertence de fato à categoria.

REGRAS:
1. Seja MUITO tolerante com erros de dicção, onomatopeias e sotaques. (Ex: se a categoria for "Animal", e a criança falar "au au" ou "totó" ou "caçolo", aceite como válido para "Cachorro").
2. Pense na semântica ampla: "Vaca", "Porco", "Galinha" PERTENCEM a "Bichos da Fazenda". 
3. Se a palavra não fizer sentido nenhum para a categoria, é inválido.
4. Se for válido, forneça uma curta mensagem de parabéns amigável.
5. Se for inválido, forneça uma mensagem amigável e encorajadora dizendo o que você entendeu e que não combina.

Sua resposta DEVE ser um objeto JSON estrito sem formatação markdown:
{"valid": boolean, "message": "Sua mensagem amigável aqui"}`
        },
        {
          role: 'user',
          content: `Palavra dita pela criança: "${transcriptionText}"\nCategoria alvo: "${category}"`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const resultText = completion.choices[0].message.content?.trim() || "{}";
    
    let resultData = { valid: false, message: "Puxa, acho que não entendi direito. Pode repetir?" };
    try {
      resultData = JSON.parse(resultText);
      console.log("-> GPT Validou:", resultData);
    } catch (e) {
      console.error("Falha ao fazer parse do JSON do GPT:", resultText);
    }

    fs.unlink(tempFilePath, () => {});

    return reply.send({
      valid: resultData.valid,
      transcription: transcriptionText,
      message: resultData.message
    });

  } catch (err: any) {
    fastify.log.error(err);
    return reply.status(500).send({ error: 'Erro interno ao validar áudio', message: err.message });
  }
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
