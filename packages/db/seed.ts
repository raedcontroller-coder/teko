import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { users } from "./db/schema";
import * as dotenv from "dotenv";
import { resolve } from "path";
import bcrypt from "bcryptjs";

dotenv.config({ path: resolve(__dirname, "../../.env") });

async function seed() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const db = drizzle(client);

  console.log("Seeding database...");

  // Create Admin
  const adminPassword = await bcrypt.hash("queridao", 10);
  await db.insert(users).values({
    role: "GLOBAL_ADMIN",
    name: "Administrador Global",
    email: "admin@teko.com.br",
    passwordHash: adminPassword,
  });
  console.log("Global Admin created: admin@teko.com.br");

  // Create Psicologo
  const psicoPassword = await bcrypt.hash("eusoudoido", 10);
  await db.insert(users).values({
    role: "PSICOLOGO",
    name: "Maria Victoria",
    email: "psicologo@teco.com.br",
    cpf: "333.444.555-111",
    crp: "06/123456",
    clinicName: "MaviPsic",
    passwordHash: psicoPassword,
  });
  console.log("Psicólogo created: psicologo@teco.com.br");

  console.log("Seed completed!");
  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
