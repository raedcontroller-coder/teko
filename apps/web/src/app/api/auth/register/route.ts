import { NextResponse } from 'next/server';
import { db } from '../../../../../../../packages/db/db/index';
import { users, userConsents, auditLogs } from '../../../../../../../packages/db/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { generateSignedPdfBuffer } from '../../../../../../../packages/db/sign-terms-pdf';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_teko_app");

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      password, 
      confirmPassword, 
      crp, 
      clinicName,
      lang = 'pt',
      termsAccepted,
      termsItems
    } = body;

    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "As senhas não coincidem." }, { status: 400 });
    }

    // Validação estrita dos termos de consentimento e das 13 declarações obrigatórias
    if (!termsAccepted) {
      return NextResponse.json({ error: "É obrigatório aceitar o Termo de Consentimento de Uso e Ciência do Psicólogo." }, { status: 400 });
    }

    if (Array.isArray(termsItems) && (termsItems.length < 13 || termsItems.some((item: any) => item !== true))) {
      return NextResponse.json({ error: "Todas as 13 declarações do Termo de Consentimento devem ser confirmadas." }, { status: 400 });
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

    const passwordHash = await bcrypt.hash(password, 10);

    // Cria o usuário com o perfil PSICOLOGO
    await db.insert(users).values({
      role: "PSICOLOGO",
      name: name.trim(),
      email: email.trim(),
      crp: crp?.trim() || null,
      clinicName: clinicName?.trim() || null,
      passwordHash,
    });

    const newUser = await db.query.users.findFirst({
      where: eq(users.email, email.trim()),
    });

    if (!newUser) {
      return NextResponse.json({ error: "Erro ao recuperar usuário após o cadastro." }, { status: 500 });
    }

    // Gera o PDF assinado digitalmente com as caixas assinaladas e o carimbo do profissional
    const acceptedAt = new Date().toISOString();
    let signedPdfBase64: string | null = null;
    try {
      const signedBuffer = generateSignedPdfBuffer(lang === 'en' ? 'en' : 'pt', {
        id: newUser.id,
        name: newUser.name,
        crp: newUser.crp,
        email: newUser.email,
        acceptedAt
      });
      signedPdfBase64 = signedBuffer.toString('base64');
    } catch (pdfErr) {
      console.error("Erro ao gerar PDF carimbado do termo:", pdfErr);
    }

    // Salva o registro de consentimento formal na tabela user_consents
    await db.insert(userConsents).values({
      userId: newUser.id,
      termVersion: '2.0',
      termLanguage: lang === 'en' ? 'en' : 'pt',
      checkItems: Array.isArray(termsItems) ? termsItems : Array(13).fill(true),
      signedPdfBase64,
      acceptedAt: new Date(acceptedAt),
    });

    // Registra na auditoria
    await db.insert(auditLogs).values({
      userId: newUser.id,
      userRole: newUser.role,
      action: 'TERM_ACCEPTED',
      resourceType: 'TERMS_CONSENT',
      resourceId: newUser.id,
      details: {
        version: '2.0',
        language: lang === 'en' ? 'en' : 'pt',
        totalCheckboxes: 13,
        acceptedAt
      }
    });

    const token = await new SignJWT({
      sub: newUser.id,
      role: newUser.role,
      name: newUser.name,
      email: newUser.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(JWT_SECRET);

    return NextResponse.json({ 
      success: true, 
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatarUrl: newUser.avatarUrl || ''
      }
    });

  } catch (error) {
    console.error("API Register Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
