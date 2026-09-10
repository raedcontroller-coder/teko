import { NextResponse } from 'next/server';
import { db } from '../../../../../../../packages/db/db/index';
import { appointments } from '../../../../../../../packages/db/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_teko_app");

async function authenticateRequest(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: "Token não fornecido.", status: 401 };
  }

  const token = authHeader.split(' ')[1];
  let payload;
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    payload = verified.payload;
  } catch {
    return { error: "Token inválido ou expirado.", status: 401 };
  }

  const url = new URL(request.url);
  const adminPsiId = url.searchParams.get("psicologoId");

  let psicologoId = payload.sub as string;
  if (payload.role === 'GLOBAL_ADMIN') {
    if (!adminPsiId) {
      return { error: "psicologoId obrigatório para administradores.", status: 400 };
    }
    psicologoId = adminPsiId;
  } else if (!psicologoId) {
    return { error: "ID do usuário não encontrado no token.", status: 400 };
  }

  return { psicologoId };
}

// 1. PUT /api/appointments/[id] -> Update appointment
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { psicologoId } = auth;
    const { id } = await context.params;

    const existing = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.id, id),
        eq(appointments.psicologoId, psicologoId),
        isNull(appointments.deletedAt)
      )
    });

    if (!existing) {
      return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
    }

    const body = await request.json();
    const { date, startTime, endTime, title, name, type, status, color, patientId } = body;

    const [updated] = await db.update(appointments)
      .set({
        date: date || existing.date,
        startTime: startTime || existing.startTime,
        endTime: endTime || existing.endTime,
        title: title ? title.trim() : existing.title,
        name: name ? name.trim() : existing.name,
        type: type || existing.type,
        status: status || existing.status,
        color: color || existing.color,
        patientId: patientId !== undefined ? patientId : existing.patientId,
        updatedAt: new Date()
      })
      .where(eq(appointments.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated
    });

  } catch (error) {
    console.error("API Appointments PUT Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor ao atualizar consulta." }, { status: 500 });
  }
}

// 2. DELETE /api/appointments/[id] -> Soft delete appointment
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { psicologoId } = auth;
    const { id } = await context.params;

    const existing = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.id, id),
        eq(appointments.psicologoId, psicologoId),
        isNull(appointments.deletedAt)
      )
    });

    if (!existing) {
      return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
    }

    await db.update(appointments)
      .set({
        deletedAt: new Date()
      })
      .where(eq(appointments.id, id));

    return NextResponse.json({
      success: true,
      message: "Consulta excluída com sucesso."
    });

  } catch (error) {
    console.error("API Appointments DELETE Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor ao excluir consulta." }, { status: 500 });
  }
}
