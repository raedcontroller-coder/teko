import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, "../../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 15000,
});

async function main() {
  console.log("Aplicando migração da tabela 'user_consents'...");

  const sql = `
    CREATE TABLE IF NOT EXISTS "user_consents" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
      "term_version" text NOT NULL DEFAULT '2.0',
      "term_language" text NOT NULL DEFAULT 'pt',
      "check_items" jsonb NOT NULL DEFAULT '[]'::jsonb,
      "signed_pdf_base64" text,
      "signed_pdf_path" text,
      "accepted_at" timestamp DEFAULT now() NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "idx_user_consents_user_id" ON "user_consents" ("user_id");
  `;

  try {
    await pool.query(sql);
    console.log("✅ Tabela 'user_consents' criada com sucesso no PostgreSQL!");
  } catch (err: any) {
    console.error("❌ Erro ao criar tabela 'user_consents':", err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
