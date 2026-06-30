import { NextResponse } from 'next/server';
import { db } from '../../../../../../packages/db/db/index';
import { users } from '../../../../../../packages/db/db/schema';
import { eq, and } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_teko_app");

export async function GET(request: Request) {
  try {
    // 1. Extrair token do header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verificar token
    let payload;
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      payload = verified.payload;
    } catch (err) {
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

    // 3. Buscar pacientes vinculados a este psicólogo
    const patients = await db.query.users.findMany({
      where: and(
        eq(users.role, "ALUNO"),
        eq(users.psicologoId, psicologoId)
      ),
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    return NextResponse.json({ success: true, data: patients });

  } catch (error) {
    console.error("API Patients GET Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // 1. Extrair token do header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verificar token
    let payload;
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      payload = verified.payload;
    } catch (err) {
      return NextResponse.json({ error: "Token inválido ou expirado." }, { status: 401 });
    }

    const body = await request.json();
    const adminPsiId = body.psicologoId;

    let psicologoId = payload.sub as string;
    if (payload.role === 'GLOBAL_ADMIN') {
      if (!adminPsiId) {
        return NextResponse.json({ error: "psicologoId obrigatório para administradores." }, { status: 400 });
      }
      psicologoId = adminPsiId;
    } else if (!psicologoId) {
      return NextResponse.json({ error: "ID do usuário não encontrado no token." }, { status: 400 });
    }

    const { name, age, gender, guardianName, guardianEmail, guardianPhone } = body;

    if (!name || !age || !gender || !guardianName || !guardianEmail || !guardianPhone) {
      return NextResponse.json({ error: "Todos os campos são obrigatórios." }, { status: 400 });
    }

    // 4. Procurar se o responsável já existe
    const [existingGuardianByEmail] = await db.select().from(users).where(eq(users.email, guardianEmail));
    const [existingGuardianByPhone] = await db.select().from(users).where(eq(users.phone, guardianPhone));
    
    let guardianId = "";

    if (existingGuardianByEmail || existingGuardianByPhone) {
      if (existingGuardianByEmail && existingGuardianByEmail.phone !== guardianPhone) {
        return NextResponse.json({ error: "Este e-mail já está cadastrado com outro número de telefone." }, { status: 400 });
      }
      if (existingGuardianByPhone && existingGuardianByPhone.email !== guardianEmail) {
        return NextResponse.json({ error: "Este telefone já está cadastrado com outro e-mail." }, { status: 400 });
      }
      
      const existingGuardian = existingGuardianByEmail || existingGuardianByPhone;
      
      if (existingGuardian.role !== "FAMILIAR") {
        return NextResponse.json({ error: "Os dados de contato fornecidos já pertencem a outro tipo de conta." }, { status: 400 });
      }
      guardianId = existingGuardian.id;
    } else {
      // Criar o novo responsável
      const [newGuardian] = await db.insert(users).values({
        role: "FAMILIAR",
        name: guardianName,
        email: guardianEmail,
        phone: guardianPhone,
        psicologoId: psicologoId,
      }).returning();
      
      guardianId = newGuardian.id;
    }

    // 5. Criar o Paciente (ALUNO)
    const childUniqueEmail = `child_${Date.now()}_${Math.random().toString(36).substring(7)}@teko.local`;

    await db.insert(users).values({
      role: "ALUNO",
      name: name,
      age: age,
      gender: gender,
      email: childUniqueEmail,
      guardianId: guardianId,
      psicologoId: psicologoId,
    });

    return NextResponse.json({ success: true, message: "Paciente cadastrado com sucesso!" });

  } catch (error: any) {
    console.error("API Patients POST Error:", error);

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
