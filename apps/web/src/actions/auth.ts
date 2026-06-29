"use server";

import { db } from "../../../../packages/db/db/index";
import { users } from "../../../../packages/db/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_teko_app");

export async function loginAction(prevState: any, formData: FormData) {
  const rawEmail = formData.get("email") as string || "";
  const rawPassword = formData.get("password") as string || "";

  if (rawEmail.length > 0 && rawEmail.trim() === "") {
    return { error: "O e-mail não pode conter apenas espaços.", email: rawEmail };
  }

  if (rawPassword.length > 0 && rawPassword.trim() === "") {
    return { error: "A senha não pode conter apenas espaços.", email: rawEmail };
  }

  const email = rawEmail.trim();
  const password = rawPassword.trim();
  
  if (!email || !password) {
    return { error: "Preencha todos os campos.", email: rawEmail };
  }

  const userRecord = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!userRecord || !userRecord.passwordHash) {
    return { error: "Credenciais inválidas." };
  }

  if (userRecord.deletedAt !== null) {
    return { error: "Esta conta foi inativada/excluída. Entre em contato com o suporte para restaurá-la." };
  }

  const isValid = await bcrypt.compare(password, userRecord.passwordHash);
  if (!isValid) {
    return { error: "Credenciais inválidas." };
  }
  
  // 3. Criar token JWT com dados reais
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

  const lang = (formData.get("lang") as string) || "pt";
  redirect(`/${lang}/dashboard`);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("teko_session")?.value;
  if (!token) return null;

  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload as { sub: string; role: string; name: string; email: string };
    
    // Validar com o banco para barrar contas excluídas que ainda têm token ativo
    const userRecord = await db.query.users.findFirst({
      where: eq(users.id, payload.sub),
      columns: { deletedAt: true }
    });

    if (!userRecord || userRecord.deletedAt !== null) {
      return null;
    }
    
    return payload;
  } catch (err) {
    return null;
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("teko_session");
  redirect("/");
}

export async function publicRegisterAction(formData: FormData) {
  const name = (formData.get("full_name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();
  const confirmPassword = (formData.get("confirm_password") as string)?.trim();
  const crp = (formData.get("crp") as string)?.trim();
  const clinicName = (formData.get("clinicName") as string)?.trim();
  
  if (!name || !email || !password || !confirmPassword) {
    return { error: "Preencha todos os campos obrigatórios." };
  }

  if (password !== confirmPassword) {
    return { error: "As senhas não coincidem." };
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    return { error: "Este e-mail já está em uso." };
  }

  if (crp) {
    const existingCrp = await db.query.users.findFirst({
      where: eq(users.crp, crp),
    });
    if (existingCrp) {
      return { error: "Este CRP já está cadastrado em outra conta." };
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({
      role: "PSICOLOGO",
      name,
      email,
      crp,
      clinicName,
      passwordHash,
    });

    const newUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!newUser) {
      return { error: "Erro ao recuperar usuário após o cadastro." };
    }

    // Gerar token e logar o usuário automaticamente
    const token = await new SignJWT({
      sub: newUser.id,
      role: newUser.role,
      name: newUser.name,
      email: newUser.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set("teko_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    return { success: true };
  } catch (err: any) {
    console.error("Erro no cadastro público:", err);
    return { error: "Erro interno no servidor ao tentar cadastrar." };
  }
}
