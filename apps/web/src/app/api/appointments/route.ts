import { NextResponse } from 'next/server';
import { db } from '../../../../../../packages/db/db/index';
import { appointments } from '../../../../../../packages/db/db/schema';
import { eq, and, isNull, asc } from 'drizzle-orm';
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

// 1. GET /api/appointments -> List all active appointments for psychologist
export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { psicologoId } = auth;

    const list = await db.query.appointments.findMany({
      where: and(
        eq(appointments.psicologoId, psicologoId),
        isNull(appointments.deletedAt)
      ),
      orderBy: [asc(appointments.date), asc(appointments.startTime)]
    });

    return NextResponse.json({
      success: true,
      data: list
    });

  } catch (error) {
    console.error("API Appointments GET Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor ao listar consultas." }, { status: 500 });
  }
}

// 2. POST /api/appointments -> Create new appointment
export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { psicologoId } = auth;

    const body = await request.json();
    const { date, startTime, endTime, title, name, type, status, color, patientId } = body;

    if (!date || !startTime || !endTime || !title || !name) {
      return NextResponse.json({ error: "Preencha todos os campos obrigatórios (data, horário, título e paciente)." }, { status: 400 });
    }

    const [newAppointment] = await db.insert(appointments).values({
      psicologoId,
      patientId: patientId || null,
      date,
      startTime,
      endTime,
      title: title.trim(),
      name: name.trim(),
      type: type || 'Atendimento Geral',
      status: status || 'confirmado',
      color: color || '#10B981',
    }).returning();

    return NextResponse.json({
      success: true,
      data: newAppointment
    }, { status: 201 });

  } catch (error) {
    console.error("API Appointments POST Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor ao agendar consulta." }, { status: 500 });
  }
}
