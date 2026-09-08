import { NextResponse } from 'next/server';
import { db } from '../../../../../../../../packages/db/db/index';
import { users, anamneses } from '../../../../../../../../packages/db/db/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_teko_app");

// Helper to authenticate user and extract tenant psicologoId
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

// 1. GET Anamnese for a patient
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

    // Find active anamnese for patient
    const anamneseData = await db.query.anamneses.findFirst({
      where: and(
        eq(anamneses.patientId, patientId),
        eq(anamneses.psicologoId, psicologoId),
        isNull(anamneses.deletedAt)
      )
    });

    return NextResponse.json({
      success: true,
      data: anamneseData || null
    });

  } catch (error) {
    console.error("API Anamnese GET Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

// 2. POST / PUT Anamnese (Create or Update Upsert)
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleUpsert(request, context);
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return handleUpsert(request, context);
}

async function handleUpsert(request: Request, context: { params: Promise<{ id: string }> }) {
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
      return NextResponse.json({ error: "Paciente não encontrado ou sem permissão." }, { status: 404 });
    }

    const body = await request.json();
    const { content, status = 'draft' } = body;

    // Check if active anamnese exists
    const existing = await db.query.anamneses.findFirst({
      where: and(
        eq(anamneses.patientId, patientId),
        eq(anamneses.psicologoId, psicologoId),
        isNull(anamneses.deletedAt)
      )
    });

    if (existing) {
      const [updated] = await db.update(anamneses)
        .set({
          content: content || existing.content,
          status,
          updatedAt: new Date()
        })
        .where(eq(anamneses.id, existing.id))
        .returning();

      return NextResponse.json({
        success: true,
        message: "Anamnese atualizada com sucesso.",
        data: updated
      });
    } else {
      const [created] = await db.insert(anamneses)
        .values({
          patientId,
          psicologoId,
          status,
          content: content || {}
        })
        .returning();

      return NextResponse.json({
        success: true,
        message: "Anamnese criada com sucesso.",
        data: created
      });
    }

  } catch (error) {
    console.error("API Anamnese UPSERT Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

// 3. DELETE Anamnese (Soft Delete)
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await authenticateRequest(request);
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { psicologoId } = auth;
    const { id: patientId } = await context.params;

    const existing = await db.query.anamneses.findFirst({
      where: and(
        eq(anamneses.patientId, patientId),
        eq(anamneses.psicologoId, psicologoId),
        isNull(anamneses.deletedAt)
      )
    });

    if (!existing) {
      return NextResponse.json({ error: "Anamnese não encontrada ou já excluída." }, { status: 404 });
    }

    const [deleted] = await db.update(anamneses)
      .set({ deletedAt: new Date() })
      .where(eq(anamneses.id, existing.id))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Anamnese excluída com sucesso.",
      data: deleted
    });

  } catch (error) {
    console.error("API Anamnese DELETE Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
