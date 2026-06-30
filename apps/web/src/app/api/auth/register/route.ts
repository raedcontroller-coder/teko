import { NextResponse } from 'next/server';
import { db } from '../../../../../../../packages/db/db/index';
import { users } from '../../../../../../../packages/db/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_teko_app");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, confirmPassword, crp, clinicName } = body;

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "As senhas não coincidem." }, { status: 400 });
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email.trim()),
    });

    if (existingUser) {
      return NextResponse.json({ error: "Este e-mail já está em uso." }, { status: 400 });
    }

    if (crp) {
      const existingCrp = await db.query.users.findFirst({
        where: eq(users.crp, crp.trim()),
      });
      if (existingCrp) {
        return NextResponse.json({ error: "Este CRP já está cadastrado em outra conta." }, { status: 400 });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Creates the user enforcing the PSICOLOGO role for mobile registrations
    await db.insert(users).values({
      role: "PSICOLOGO",
      name: name.trim(),
      email: email.trim(),
      crp: crp?.trim() || null,
      clinicName: clinicName?.trim() || null,
      passwordHash,
    });

    const newUser = await db.query.users.findFirst({
      where: eq(users.email, email.trim()),
    });

    if (!newUser) {
      return NextResponse.json({ error: "Erro ao recuperar usuário após o cadastro." }, { status: 500 });
    }

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

    return NextResponse.json({ 
      success: true, 
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error("API Register Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
