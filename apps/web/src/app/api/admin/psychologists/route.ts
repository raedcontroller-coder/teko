import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '../../../../../../../packages/db/db/index';
import { users, gameSessions } from '../../../../../../../packages/db/db/schema';
import { eq, isNull, and, count } from 'drizzle-orm';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_teko_app");

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      payload = verified.payload;
    } catch (e) {
      return NextResponse.json({ error: "Token inválido." }, { status: 401 });
    }

    if (payload.role !== 'GLOBAL_ADMIN') {
      return NextResponse.json({ error: "Acesso negado. Requer permissão de administrador." }, { status: 403 });
    }

    const psicologos = await db.query.users.findMany({
      where: and(eq(users.role, "PSICOLOGO"), isNull(users.deletedAt)),
      columns: {
        id: true,
        name: true,
        email: true,
        crp: true,
        clinicName: true,
        createdAt: true,
      },
      orderBy: (users, { desc }) => [desc(users.createdAt)]
    });

    const psicologosWithCounts = await Promise.all(
      psicologos.map(async (psi) => {
        const resultChildren = await db
          .select({ value: count(users.id) })
          .from(users)
          .where(
            and(
              eq(users.role, "ALUNO"),
              eq(users.psicologoId, psi.id),
              isNull(users.deletedAt)
            )
          );
          
        const resultSessions = await db
          .select({ value: count(gameSessions.id) })
          .from(gameSessions)
          .innerJoin(users, eq(gameSessions.alunoId, users.id))
          .where(
            and(
              eq(users.psicologoId, psi.id),
              isNull(users.deletedAt)
            )
          );

        return {
          ...psi,
          childrenCount: resultChildren[0]?.value || 0,
          reportsCount: 0,
          sessionsCount: resultSessions[0]?.value || 0,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: psicologosWithCounts
    });

  } catch (error) {
    console.error("API Admin Psychologists Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      payload = verified.payload;
    } catch (e) {
      return NextResponse.json({ error: "Token inválido." }, { status: 401 });
    }

    if (payload.role !== 'GLOBAL_ADMIN') {
      return NextResponse.json({ error: "Acesso negado. Requer permissão de administrador." }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, crp, clinicName } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
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

    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);

    await db.insert(users).values({
      role: "PSICOLOGO",
      name: name.trim(),
      email: email.trim(),
      crp: crp?.trim() || null,
      clinicName: clinicName?.trim() || null,
      passwordHash,
    });

    return NextResponse.json({ 
      success: true, 
      message: "Profissional cadastrado com sucesso!" 
    });

  } catch (error) {
    console.error("API Register Psychologists Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor ao cadastrar profissional." }, { status: 500 });
  }
}

