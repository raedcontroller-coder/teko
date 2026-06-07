"use server";

import { db } from "../../../../packages/db/db/index";
import { users } from "../../../../packages/db/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getSession } from "./auth";

export async function registerPsicologoAction(formData: FormData) {
  const session = await getSession();
  if (session?.role !== "GLOBAL_ADMIN") {
    return { error: "Acesso negado. Apenas administradores podem realizar esta ação." };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const cpf = formData.get("cpf") as string;
  const crp = formData.get("crp") as string;
  const clinicName = formData.get("clinicName") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password || !cpf) {
    return { error: "Preencha os campos obrigatórios (Nome, E-mail, CPF, Senha)." };
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    return { error: "Este e-mail já está cadastrado." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({
      role: "PSICOLOGO",
      name,
      email,
      cpf,
      crp,
      clinicName,
      passwordHash,
    });
    return { success: true };
  } catch (err: any) {
    console.error("Erro ao inserir:", err);
    return { error: "Erro interno ao cadastrar psicólogo. Verifique os dados." };
  }
}

export async function listPsicologosAction() {
  const session = await getSession();
  if (session?.role !== "GLOBAL_ADMIN") {
    return [];
  }
  
  return db.query.users.findMany({
    where: eq(users.role, "PSICOLOGO"),
    columns: {
      id: true,
      name: true,
      email: true,
      cpf: true,
      crp: true,
      clinicName: true,
      createdAt: true,
    },
    orderBy: (users, { desc }) => [desc(users.createdAt)]
  });
}
