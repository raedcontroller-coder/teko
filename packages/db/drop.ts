import { Client } from "pg";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../../.env") });

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log("Connected to DB, dropping tables...");
  await client.query("DROP TABLE IF EXISTS game_sessions CASCADE;");
  await client.query("DROP TABLE IF EXISTS games CASCADE;");
  await client.query("DROP TABLE IF EXISTS users CASCADE;");
  await client.query("DROP TYPE IF EXISTS role CASCADE;");
  await client.query("DELETE FROM drizzle.__drizzle_migrations;");
  console.log("Dropped!");
  await client.end();
}

run().catch(console.error);
