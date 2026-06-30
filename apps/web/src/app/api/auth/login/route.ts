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
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
    }

    const userRecord = await db.query.users.findFirst({
      where: eq(users.email, email.trim()),
    });

    if (!userRecord || !userRecord.passwordHash) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    if (userRecord.deletedAt !== null) {
      return NextResponse.json({ error: "Esta conta foi inativada/excluída. Entre em contato com o suporte." }, { status: 403 });
    }

    const isValid = await bcrypt.compare(password, userRecord.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

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

    return NextResponse.json({ 
      success: true, 
      token,
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role
      }
    });

  } catch (error) {
    console.error("API Login Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
