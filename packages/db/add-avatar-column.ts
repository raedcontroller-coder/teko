import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, "../../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log("Aplicando alteração no banco: adicionar coluna avatar_url na tabela users...");
  
  const sql = `
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_url" text;
  `;
  
  try {
    await pool.query(sql);
    console.log("Coluna 'avatar_url' verificada/adicionada com sucesso!");
  } catch (e: any) {
    console.error("Erro ao aplicar alteração na coluna avatar_url:", e.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
