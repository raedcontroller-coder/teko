import { NextResponse } from 'next/server';
import { db } from '../../../../../../../packages/db/db/index';
import { users, gameSessions } from '../../../../../../../packages/db/db/schema';
import { eq, and } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_teko_app");

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      payload = verified.payload;
    } catch {
      return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 401 });
    }

    const url = new URL(request.url);
    const adminPsiId = url.searchParams.get("psicologoId");

    let psicologoId = payload.sub as string;
    if (payload.role === 'GLOBAL_ADMIN') {
      if (!adminPsiId) {
        return NextResponse.json({ error: "psicologoId obrigatório para administradores." }, { status: 400 });
      }
      psicologoId = adminPsiId;
    } else if (!psicologoId) {
      return NextResponse.json({ error: "ID do usuário não encontrado no token." }, { status: 400 });
    }

    const { id: patientId } = await context.params;

    const patientData = await db.query.users.findFirst({
      where: and(
        eq(users.id, patientId),
        eq(users.role, "ALUNO"),
        eq(users.psicologoId, psicologoId)
      )
    });

    if (!patientData) {
      return NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });
    }

    let guardianData = null;
    if (patientData.guardianId) {
      guardianData = await db.query.users.findFirst({
        where: eq(users.id, patientData.guardianId)
      });
    }

    const rawSessions = await db.query.gameSessions.findMany({
      where: eq(gameSessions.alunoId, patientId),
      orderBy: (gameSessions, { desc }) => [desc(gameSessions.startedAt)],
    });

    const allGames = await db.query.games.findMany();

    const sessionsData = rawSessions.map(session => {
      const game = allGames.find(g => g.id === session.gameId);
      return {
        ...session,
        gameName: game ? game.name : 'Desconhecido'
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: {
        patient: patientData,
        guardian: guardianData,
        sessions: sessionsData
      } 
    });

  } catch (error) {
    console.error("API Patient [id] GET Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      payload = verified.payload;
    } catch {
      return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 401 });
    }

    const url = new URL(request.url);
    const adminPsiId = url.searchParams.get("psicologoId");

    let psicologoId = payload.sub as string;
    if (payload.role === 'GLOBAL_ADMIN') {
      if (!adminPsiId) {
        return NextResponse.json({ error: "psicologoId obrigatório para administradores." }, { status: 400 });
      }
      psicologoId = adminPsiId;
    } else if (!psicologoId) {
      return NextResponse.json({ error: "ID do usuário não encontrado no token." }, { status: 400 });
    }

    const { id: targetId } = await context.params;
    
    const updateType = url.searchParams.get("type"); // "patient" ou "guardian"
    
    const body = await request.json();

    if (updateType === "patient") {
      const { name, age, gender } = body;
      
      const [updated] = await db.update(users)
        .set({ name, age, gender })
        .where(
          and(
            eq(users.id, targetId),
            eq(users.psicologoId, psicologoId),
            eq(users.role, "ALUNO")
          )
        )
        .returning();

      if (!updated) {
        return NextResponse.json({ error: "Paciente não encontrado ou sem permissão." }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: "Dados do paciente atualizados com sucesso." });

    } else if (updateType === "guardian") {
      const { name, email, phone } = body;
      
      const [updated] = await db.update(users)
        .set({ name, email, phone })
        .where(
          and(
            eq(users.id, targetId),
            eq(users.psicologoId, psicologoId),
            eq(users.role, "FAMILIAR")
          )
        )
        .returning();

      if (!updated) {
        return NextResponse.json({ error: "Responsável não encontrado ou sem permissão." }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: "Dados do responsável atualizados com sucesso." });

    } else {
      return NextResponse.json({ error: "Tipo de atualização não especificado (?type=patient ou ?type=guardian)." }, { status: 400 });
    }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("API Patient [id] PUT Error:", error);

    // Tratamento específico para campos únicos (email, telefone) duplicados (Drizzle joga o erro real em error.cause)
    const dbError = error?.cause || error;

    if (dbError?.code === '23505' || (dbError?.message && dbError.message.includes('unique constraint')) || (error?.message && error.message.includes('unique constraint'))) {
      if (dbError?.detail?.includes('phone') || (error?.message && error.message.includes('users_phone_unique'))) {
        return NextResponse.json({ error: "Este telefone já está cadastrado para outro usuário." }, { status: 400 });
      }
      if (dbError?.detail?.includes('email') || (error?.message && error.message.includes('users_email_unique'))) {
        return NextResponse.json({ error: "Este e-mail já está cadastrado para outro usuário." }, { status: 400 });
      }
      return NextResponse.json({ error: "E-mail ou telefone já estão em uso por outra conta." }, { status: 400 });
    }

    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let payload;
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      payload = verified.payload;
    } catch {
      return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 401 });
    }

    const url = new URL(request.url);
    const adminPsiId = url.searchParams.get("psicologoId");

    let psicologoId = payload.sub as string;
    if (payload.role === 'GLOBAL_ADMIN') {
      if (!adminPsiId) {
        return NextResponse.json({ error: "psicologoId obrigatório para administradores." }, { status: 400 });
      }
      psicologoId = adminPsiId;
    } else if (!psicologoId) {
      return NextResponse.json({ error: "ID do usuário não encontrado no token." }, { status: 400 });
    }

    const { id: patientId } = await context.params;

    const [deleted] = await db.delete(users)
      .where(
        and(
          eq(users.id, patientId),
          eq(users.psicologoId, psicologoId),
          eq(users.role, "ALUNO")
        )
      )
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Paciente não encontrado ou sem permissão para excluir." }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Paciente excluído com sucesso." });

  } catch (error) {
    console.error("API Patient [id] DELETE Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
