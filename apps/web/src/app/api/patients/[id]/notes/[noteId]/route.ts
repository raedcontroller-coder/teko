import { NextResponse } from 'next/server';
import { db } from '../../../../../../../../../packages/db/db/index';
import { users, clinicalNotes } from '../../../../../../../../../packages/db/db/schema';
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

// 1. PUT /api/patients/[id]/notes/[noteId] -> Update note
export async function PUT(request: Request, context: { params: Promise<{ id: string; noteId: string }> }) {
  try {
    const auth = await authenticateRequest(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { psicologoId } = auth;
    const { id: patientId, noteId } = await context.params;

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

    const noteExists = await db.query.clinicalNotes.findFirst({
      where: and(
        eq(clinicalNotes.id, noteId),
        eq(clinicalNotes.patientId, patientId),
        eq(clinicalNotes.psicologoId, psicologoId),
        isNull(clinicalNotes.deletedAt)
      )
    });

    if (!noteExists) {
      return NextResponse.json({ error: "Nota não encontrada." }, { status: 404 });
    }

    const body = await request.json();
    const { category, title, color } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: "O conteúdo da nota não pode estar vazio." }, { status: 400 });
    }

    const [updatedNote] = await db.update(clinicalNotes)
      .set({
        category: category || noteExists.category,
        title: title.trim(),
        color: color || noteExists.color,
        updatedAt: new Date()
      })
      .where(eq(clinicalNotes.id, noteId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedNote
    });

  } catch (error) {
    console.error("API Clinical Notes PUT Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor ao atualizar nota." }, { status: 500 });
  }
}

// 2. DELETE /api/patients/[id]/notes/[noteId] -> Soft delete note
export async function DELETE(request: Request, context: { params: Promise<{ id: string; noteId: string }> }) {
  try {
    const auth = await authenticateRequest(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { psicologoId } = auth;
    const { id: patientId, noteId } = await context.params;

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

    const noteExists = await db.query.clinicalNotes.findFirst({
      where: and(
        eq(clinicalNotes.id, noteId),
        eq(clinicalNotes.patientId, patientId),
        eq(clinicalNotes.psicologoId, psicologoId),
        isNull(clinicalNotes.deletedAt)
      )
    });

    if (!noteExists) {
      return NextResponse.json({ error: "Nota não encontrada." }, { status: 404 });
    }

    await db.update(clinicalNotes)
      .set({
        deletedAt: new Date()
      })
      .where(eq(clinicalNotes.id, noteId));

    return NextResponse.json({
      success: true,
      message: "Nota excluída com sucesso."
    });

  } catch (error) {
    console.error("API Clinical Notes DELETE Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor ao excluir nota." }, { status: 500 });
  }
}
