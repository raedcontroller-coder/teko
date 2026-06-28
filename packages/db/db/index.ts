import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Garante que o dotenv carregue na inicializacao se estiver rodando isolado
dotenv.config({ path: resolve(__dirname, "../../../.env") });

if (!process.env.DATABASE_URL) {
  throw new Error("A variavel DATABASE_URL nao foi definida no ambiente.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                 // Limite de conexoes concorrentes por container
  idleTimeoutMillis: 30000, // Fecha conexoes ociosas apos 30 segundos
  connectionTimeoutMillis: 0,
});

export const db = drizzle(pool, { schema });
