import { NextResponse } from 'next/server';
import { db } from '../../../../../../../packages/db/db/index';
import { auditLogs, users } from '../../../../../../../packages/db/db/schema';
import { eq, desc } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_teko_app");

export async function GET(request: Request) {
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

    // Apenas GLOBAL_ADMIN pode auditar o histórico global de acessos e ações
    if (payload.role !== 'GLOBAL_ADMIN') {
      return NextResponse.json({ error: "Acesso negado. Recurso restrito a administradores." }, { status: 403 });
    }

    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 100);
    const offset = Number(url.searchParams.get('offset')) || 0;

    const logs = await db.query.auditLogs.findMany({
      orderBy: [desc(auditLogs.createdAt)],
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      data: logs,
      count: logs.length,
    });
  } catch (error) {
    console.error("API Audit Logs GET Error:", error);
    return NextResponse.json({ error: "Erro interno ao buscar logs de auditoria." }, { status: 500 });
  }
}
