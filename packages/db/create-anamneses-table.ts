import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, "../../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log("Criando a tabela 'anamneses' no PostgreSQL...");
  const sql = `
    CREATE TABLE IF NOT EXISTS "anamneses" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "patient_id" uuid NOT NULL REFERENCES "users"("id"),
      "psicologo_id" uuid NOT NULL REFERENCES "users"("id"),
      "status" text NOT NULL DEFAULT 'draft',
      "content" jsonb NOT NULL DEFAULT '{}'::jsonb,
      "created_at" timestamp NOT NULL DEFAULT now(),
      "updated_at" timestamp NOT NULL DEFAULT now(),
      "deleted_at" timestamp
    );
  `;
  
  try {
    await pool.query(sql);
    console.log("Tabela 'anamneses' criada com sucesso!");
  } catch (e: any) {
    console.error("Erro ao criar a tabela 'anamneses':", e.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
