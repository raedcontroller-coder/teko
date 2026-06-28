import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

dotenv.config({ path: resolve(__dirname, "../../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const sql = fs.readFileSync(resolve(__dirname, "drizzle/0001_groovy_newton_destine.sql"), "utf-8");
  const statements = sql.split("--> statement-breakpoint");
  
  for (const statement of statements) {
    if (statement.trim()) {
      console.log("Executing:", statement.trim());
      try {
        await pool.query(statement);
      } catch (e: any) {
        console.error("Error executing statement:", e.message);
      }
    }
  }
  console.log("Migration applied!");
  process.exit(0);
}

main();
