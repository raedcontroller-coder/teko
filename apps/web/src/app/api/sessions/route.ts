import { NextResponse } from 'next/server';
import { db } from '../../../../../../packages/db/db/index';
import { users, games, gameSessions } from '../../../../../../packages/db/db/schema';
import { eq, and } from 'drizzle-orm';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_teko_app");

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

    const psicologoId = payload.sub as string;
    if (!psicologoId) {
      return NextResponse.json({ error: "ID do usuário não encontrado no token." }, { status: 400 });
    }

    const body = await request.json();
    const { alunoId, gameName, behaviorData } = body;

    if (!alunoId || !gameName || !behaviorData) {
      return NextResponse.json({ error: "alunoId, gameName e behaviorData são obrigatórios." }, { status: 400 });
    }

    // 3. Validar se a criança existe e se pertence a este psicólogo
    const child = await db.query.users.findFirst({
      where: and(
        eq(users.id, alunoId),
        eq(users.role, "ALUNO"),
        eq(users.psicologoId, psicologoId)
      )
    });

    if (!child) {
      return NextResponse.json({ error: "Criança não encontrada ou não vinculada a este psicólogo." }, { status: 403 });
    }

    // 4. Buscar o jogo pelo nome (cria se não existir)
    let game = await db.query.games.findFirst({
      where: eq(games.name, gameName)
    });

    if (!game) {
      const insertedGames = await db.insert(games).values({
        name: gameName,
        description: `Jogo ${gameName} coletado automaticamente.`,
      }).returning();
      game = insertedGames[0];
    }

    // 5. Inserir a sessão na tabela gameSessions
    const newSession = await db.insert(gameSessions).values({
      alunoId: alunoId,
      gameId: game.id,
      behaviorData: behaviorData,
    }).returning();

    return NextResponse.json({ success: true, data: newSession[0] });

  } catch (error) {
    console.error("API Sessions POST Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor ao salvar sessão." }, { status: 500 });
  }
}
