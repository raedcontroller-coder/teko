import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { exportAdminDadosGeradosCsvAction } from "@/actions/admin";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_super_secret_key_teko_app"
);

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido." }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    const verified = await jwtVerify(token, JWT_SECRET);
    if (verified.payload.role !== "GLOBAL_ADMIN") {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const response = await exportAdminDadosGeradosCsvAction(true);
    if (response.error || !response.csv) {
      return NextResponse.json({ error: response.error || "Erro ao gerar CSV" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      csv: response.csv
    });
  } catch (error) {
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
