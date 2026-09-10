import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, "../../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log("Criando a tabela 'appointments' no PostgreSQL...");
  const sql = `
    CREATE TABLE IF NOT EXISTS "appointments" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "psicologo_id" uuid NOT NULL REFERENCES "users"("id"),
      "patient_id" uuid REFERENCES "users"("id"),
      "date" text NOT NULL,
      "start_time" text NOT NULL,
      "end_time" text NOT NULL,
      "title" text NOT NULL,
      "name" text NOT NULL,
      "type" text NOT NULL,
      "status" text NOT NULL DEFAULT 'confirmado',
      "color" text DEFAULT '#10B981',
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      "deleted_at" timestamp
    );
  `;
  
  try {
    await pool.query(sql);
    console.log("Tabela 'appointments' criada com sucesso no banco de dados!");
  } catch (e: any) {
    console.error("Erro ao criar a tabela 'appointments':", e.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
