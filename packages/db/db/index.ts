import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                 // Limite de conexões concorrentes por container
  idleTimeoutMillis: 30000, // Fecha conexões ociosas após 30 segundos
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });
