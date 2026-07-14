/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, @next/next/no-page-custom-font */
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
      return NextResponse.json({ error: "Token nÃ£o fornecido." }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verificar token
    let payload;
    try {
      const verified = await jwtVerify(token, JWT_SECRET);
      payload = verified.payload;
    } catch (err) {
      return NextResponse.json({ error: "Token invÃ¡lido ou expirado." }, { status: 401 });
    }

    const psicologoId = payload.sub as string;
    if (!psicologoId) {
      return NextResponse.json({ error: "ID do usuÃ¡rio nÃ£o encontrado no token." }, { status: 400 });
    }

    const body = await request.json();
    const { alunoId, gameName, behaviorData } = body;

    if (!alunoId || !gameName || !behaviorData) {
      return NextResponse.json({ error: "alunoId, gameName e behaviorData sÃ£o obrigatÃ³rios." }, { status: 400 });
    }

    // 3. ValidaÃ§Ã£o Especial: Se for "anonymous", nÃ£o salvamos no banco
    if (alunoId === "anonymous") {
      return NextResponse.json({ success: true, data: { id: "anonymous", message: "Anonymous session ignored by database" } });
    }

    // 4. Validar se a crianÃ§a existe e (se nÃ£o for admin) se pertence a este psicÃ³logo
    const isAdmin = payload.role === 'GLOBAL_ADMIN';
    const child = await db.query.users.findFirst({
      where: and(
        eq(users.id, alunoId),
        eq(users.role, "ALUNO"),
        isAdmin ? undefined : eq(users.psicologoId, psicologoId)
      )
    });

    if (!child) {
      return NextResponse.json({ error: "CrianÃ§a nÃ£o encontrada ou nÃ£o vinculada a este psicÃ³logo." }, { status: 403 });
    }

    // 4. Buscar o jogo pelo nome (cria se nÃ£o existir)
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

    // 5. Inserir a sessÃ£o na tabela gameSessions
    const newSession = await db.insert(gameSessions).values({
      alunoId: alunoId,
      gameId: game.id,
      behaviorData: behaviorData,
    }).returning();

    return NextResponse.json({ success: true, data: newSession[0] });

  } catch (error) {
    console.error("API Sessions POST Error:", error);
    return NextResponse.json({ error: "Erro interno do servidor ao salvar sessÃ£o." }, { status: 500 });
  }
}

