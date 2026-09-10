import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, "../../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log("Criando a tabela 'clinical_notes' no PostgreSQL...");
  const sql = `
    CREATE TABLE IF NOT EXISTS "clinical_notes" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "patient_id" uuid NOT NULL REFERENCES "users"("id"),
      "psicologo_id" uuid NOT NULL REFERENCES "users"("id"),
      "category" text NOT NULL DEFAULT 'Sessão',
      "title" text NOT NULL,
      "color" text DEFAULT '#3B82F6',
      "created_at" timestamp NOT NULL DEFAULT now(),
      "updated_at" timestamp NOT NULL DEFAULT now(),
      "deleted_at" timestamp
    );
  `;
  
  try {
    await pool.query(sql);
    console.log("Tabela 'clinical_notes' criada com sucesso no banco de dados!");
  } catch (e: any) {
    console.error("Erro ao criar a tabela 'clinical_notes':", e.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
