import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '../../../../../../../packages/db/db/index';
import { users, gameSessions } from '../../../../../../../packages/db/db/schema';
import { eq, isNull, and, count, inArray } from 'drizzle-orm';

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

    // 1. Estatísticas do Dashboard
    const resultProfissionais = await db.select({ value: count(users.id) })
      .from(users)
      .where(and(eq(users.role, "PSICOLOGO"), isNull(users.deletedAt)));

    const psicologosAtivos = await db.select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, "PSICOLOGO"), isNull(users.deletedAt)));
      
    const psicologoIds = psicologosAtivos.map(p => p.id);

    let totalCriancas = 0;
    if (psicologoIds.length > 0) {
      const resultCriancas = await db.select({ value: count(users.id) })
        .from(users)
        .where(
          and(
            eq(users.role, "ALUNO"),
            isNull(users.deletedAt),
            inArray(users.psicologoId, psicologoIds)
          )
        );
      totalCriancas = resultCriancas[0]?.value || 0;
    }

    const stats = {
      profissionais: resultProfissionais[0]?.value || 0,
      relatorios: 0,
      criancas: totalCriancas,
    };

    // 2. Lista de Psicólogos Recentes (Limitado a 3)
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
      orderBy: (users, { desc }) => [desc(users.createdAt)],
      limit: 3,
    });

    return NextResponse.json({
      success: true,
      data: {
        stats,
        recentPsychologists: psicologos
      }
    });

  } catch (error) {
    console.error("API Admin Dashboard Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
