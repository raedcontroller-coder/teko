import { NextResponse } from 'next/server';
import { db } from '../../../../../../../../packages/db/db/index';
import { users, clinicalNotes } from '../../../../../../../../packages/db/db/schema';
import { eq, and, isNull, desc } from 'drizzle-orm';
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

// 1. GET /api/patients/[id]/notes -> List all notes for patient
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { psicologoId } = auth;
    const { id: patientId } = await context.params;

    // Verify patient belongs to psychologist tenant
    const patientExists = await db.query.users.findFirst({
      where: and(
        eq(users.id, patientId),
        eq(users.role, "ALUNO"),
        eq(users.psicologoId, psicologoId)
      )
    });

    if (!patientExists) {
      return NextResponse.json({ error: "Paciente não encontrado ou sem acesso." }, { status: 404 });
    }

    const notesList = await db.query.clinicalNotes.findMany({
      where: and(
        eq(clinicalNotes.patientId, patientId),
        eq(clinicalNotes.psicologoId, psicologoId),
        isNull(clinicalNotes.deletedAt)
      ),
      orderBy: [desc(clinicalNotes.createdAt)]
    });

    return NextResponse.json({
      success: true,
      data: notesList
    });

  } catch (error) {
    console.error("API Clinical Notes GET Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

// 2. POST /api/patients/[id]/notes -> Create new note
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { psicologoId } = auth;
    const { id: patientId } = await context.params;

    const patientExists = await db.query.users.findFirst({
      where: and(
        eq(users.id, patientId),
        eq(users.role, "ALUNO"),
        eq(users.psicologoId, psicologoId)
      )
    });

    if (!patientExists) {
      return NextResponse.json({ error: "Paciente não encontrado ou sem acesso." }, { status: 404 });
    }

    const body = await request.json();
    const { category, title, color } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: "O conteúdo da nota não pode estar vazio." }, { status: 400 });
    }

    const [newNote] = await db.insert(clinicalNotes).values({
      patientId,
      psicologoId,
      category: category || 'Sessão',
      title: title.trim(),
      color: color || '#3B82F6',
    }).returning();

    return NextResponse.json({
      success: true,
      data: newNote
    }, { status: 201 });

  } catch (error) {
    console.error("API Clinical Notes POST Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor ao criar nota." }, { status: 500 });
  }
}
