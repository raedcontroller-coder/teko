/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, @next/next/no-page-custom-font */
import { NextResponse } from 'next/server';
import { db } from '../../../../../../packages/db/db/index';
import { users } from '../../../../../../packages/db/db/schema';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_teko_app");

async function authenticate(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error("Token nÃ£o fornecido.");
  }

  const token = authHeader.split(' ')[1];
  const verified = await jwtVerify(token, JWT_SECRET);
  const psicologoId = verified.payload.sub as string;
  if (!psicologoId) {
    throw new Error("ID do usuÃ¡rio nÃ£o encontrado no token.");
  }
  return psicologoId;
}

export async function GET(request: Request) {
  try {
    const psicologoId = await authenticate(request);

    const [user] = await db.select({
      name: users.name,
      email: users.email,
      crp: users.crp,
      clinicName: users.clinicName,
    }).from(users).where(eq(users.id, psicologoId));

    if (!user) {
      return NextResponse.json({ error: "UsuÃ¡rio nÃ£o encontrado." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const psicologoId = await authenticate(request);
    
    const url = new URL(request.url);
    const updateType = url.searchParams.get("type"); // "personal" ou "security"
    const body = await request.json();

    if (updateType === "personal") {
      const { name, email, crp, clinicName } = body;
      
      const [existing] = await db.select().from(users).where(eq(users.email, email));
      if (existing && existing.id !== psicologoId) {
        return NextResponse.json({ error: "Este email jÃ¡ estÃ¡ em uso por outro usuÃ¡rio." }, { status: 400 });
      }

      await db.update(users)
        .set({ name, email, crp: crp || null, clinicName: clinicName || null, updatedAt: new Date() })
        .where(eq(users.id, psicologoId));

      return NextResponse.json({ success: true, message: "Dados atualizados com sucesso." });
      
    } else if (updateType === "security") {
      const { currentPassword, newPassword } = body;

      const [user] = await db.select().from(users).where(eq(users.id, psicologoId));
      if (!user || !user.passwordHash) {
        return NextResponse.json({ error: "UsuÃ¡rio nÃ£o encontrado." }, { status: 404 });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json({ error: "A senha atual estÃ¡ incorreta." }, { status: 400 });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await db.update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, psicologoId));

      return NextResponse.json({ success: true, message: "Senha atualizada com sucesso." });

    } else {
      return NextResponse.json({ error: "Tipo de atualizaÃ§Ã£o invÃ¡lido." }, { status: 400 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const psicologoId = await authenticate(request);

    // Soft delete ou delete real, para o escopo mobile vamos seguir o soft delete da web
    await db.update(users)
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, psicologoId));

    return NextResponse.json({ success: true, message: "Conta excluÃ­da com sucesso." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Erro interno." }, { status: 500 });
  }
}

