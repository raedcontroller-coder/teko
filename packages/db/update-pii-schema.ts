import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, "../../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
});

async function main() {
  console.log("Aplicando alteração no banco para PII / LGPD (users: email nullable, drop cpf)...");
  
  // 1. Tornar email nullable
  // 2. Remover coluna cpf e suas constraints caso existam
  const sql = `
    ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
    ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_cpf_unique";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "cpf";
  `;
  
  try {
    await pool.query(sql);
    console.log("Migração de LGPD executada com sucesso no banco de dados!");
  } catch (e: any) {
    console.error("Erro ao aplicar migração:", e.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

main();
