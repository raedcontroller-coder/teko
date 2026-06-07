"use server";

import { db } from "../../../../packages/db/db/index";
import { users } from "../../../../packages/db/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_teko_app");

export async function loginAction(formData: FormData) {
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();
  
  if (!email || !password) {
    return { error: "Preencha todos os campos." };
  }

  // 1. Procurar usuario
  const userRecord = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!userRecord || !userRecord.passwordHash) {
    console.log("Falha no login: Usuario nao encontrado para o email:", email);
    return { error: "Credenciais inválidas." };
  }

  // 2. Verificar a senha
  const isValid = await bcrypt.compare(password, userRecord.passwordHash);
  if (!isValid) {
    console.log("Falha no login: Senha incorreta para:", email);
    return { error: "Credenciais inválidas." };
  }
  
  console.log("Login bem-sucedido para:", email);

  // 3. Criar token JWT com dados basicos
  const token = await new SignJWT({
    sub: userRecord.id,
    role: userRecord.role,
    name: userRecord.name,
    email: userRecord.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(JWT_SECRET);

  // 4. Salvar token no cookie e redirecionar
  const cookieStore = await cookies();
  cookieStore.set("teko_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
    path: "/",
  });

  redirect("/dashboard");
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("teko_session")?.value;
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as { sub: string; role: string; name: string; email: string };
  } catch (err) {
    return null;
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("teko_session");
  redirect("/login");
}
