"use server";

import { db } from "../../../../packages/db/db/index";
import { users, gameSessions } from "../../../../packages/db/db/schema";
import { eq, isNull, and, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getSession } from "./auth";

export async function registerPsicologoAction(formData: FormData) {
  const session = await getSession();
  if (session?.role !== "GLOBAL_ADMIN") {
    return { error: "Acesso negado. Apenas administradores podem realizar esta ação." };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const crp = formData.get("crp") as string;
  const clinicName = formData.get("clinicName") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "Preencha os campos obrigatórios (Nome, E-mail, Senha)." };
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    return { error: "Este e-mail já está cadastrado." };
  }

  if (crp) {
    const existingCrp = await db.query.users.findFirst({
      where: eq(users.crp, crp),
    });
    if (existingCrp) {
      return { error: "Este CRP já está vinculado a outro profissional." };
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await db.insert(users).values({
      role: "PSICOLOGO",
      name,
      email,
      crp,
      clinicName,
      passwordHash,
    });
    return { success: true };
  } catch (err: any) {
    console.error("Erro ao inserir:", err);
    return { error: "Erro interno ao cadastrar psicólogo. Verifique os dados." };
  }
}

export async function listPsicologosAction() {
  const session = await getSession();
  if (session?.role !== "GLOBAL_ADMIN") {
    return [];
  }
  
  const psicologos = await db.query.users.findMany({
    where: and(eq(users.role, "PSICOLOGO"), isNull(users.deletedAt)),
    columns: {
      id: true,
      name: true,
      email: true,
      crp: true,
      clinicName: true,
      createdAt: true,
    },
    orderBy: (users, { desc }) => [desc(users.createdAt)]
  });

  const psicologosWithCounts = await Promise.all(
    psicologos.map(async (psi) => {
      const resultChildren = await db
        .select({ value: count(users.id) })
        .from(users)
        .where(
          and(
            eq(users.role, "ALUNO"),
            eq(users.psicologoId, psi.id),
            isNull(users.deletedAt)
          )
        );
        
      const resultSessions = await db
        .select({ value: count(gameSessions.id) })
        .from(gameSessions)
        .innerJoin(users, eq(gameSessions.alunoId, users.id))
        .where(
          and(
            eq(users.psicologoId, psi.id),
            isNull(users.deletedAt)
          )
        );

      return {
        ...psi,
        childrenCount: resultChildren[0]?.value || 0,
        reportsCount: 0,
        sessionsCount: resultSessions[0]?.value || 0,
      };
    })
  );

  return psicologosWithCounts;
}

export async function getAdminDashboardStatsAction() {
  const session = await getSession();
  if (session?.role !== "GLOBAL_ADMIN") {
    return { profissionais: 0, relatorios: 0, criancas: 0 };
  }

  const resultProfissionais = await db.select({ value: count(users.id) })
    .from(users)
    .where(and(eq(users.role, "PSICOLOGO"), isNull(users.deletedAt)));

  const resultCriancas = await db.select({ value: count(users.id) })
    .from(users)
    .where(and(eq(users.role, "ALUNO"), isNull(users.deletedAt)));

  return {
    profissionais: resultProfissionais[0]?.value || 0,
    relatorios: 0,
    criancas: resultCriancas[0]?.value || 0,
  };
}

export async function getPsicologoByIdAction(id: string) {
  const session = await getSession();
  if (session?.role !== "GLOBAL_ADMIN") {
    return { error: "Acesso negado." };
  }

  const psi = await db.query.users.findFirst({
    where: and(eq(users.id, id), eq(users.role, "PSICOLOGO"), isNull(users.deletedAt)),
    columns: {
      id: true,
      name: true,
      email: true,
      crp: true,
      clinicName: true,
    }
  });

  if (!psi) {
    return { error: "Profissional não encontrado." };
  }

  return { data: psi };
}

export async function updatePsicologoAction(id: string, data: { name: string; email: string; crp?: string; clinicName?: string }) {
  const session = await getSession();
  if (session?.role !== "GLOBAL_ADMIN") {
    return { error: "Acesso negado." };
  }

  try {
    await db.update(users)
      .set({
        name: data.name,
        email: data.email,
        crp: data.crp || null,
        clinicName: data.clinicName || null,
        updatedAt: new Date()
      })
      .where(and(eq(users.id, id), eq(users.role, "PSICOLOGO")));
      
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/[lang]/dashboard/admin/profissionais/[id]/dados", "page");
    return { success: true };
  } catch (error: any) {
    console.error(error);
    if (error.code === '23505') {
      return { error: "Este email ou CRP já está em uso por outra conta." };
    }
    return { error: "Erro ao atualizar dados do profissional." };
  }
}

export async function updatePsicologoPasswordAction(id: string, newPassword: string) {
  const session = await getSession();
  if (session?.role !== "GLOBAL_ADMIN") {
    return { error: "Acesso negado." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  try {
    await db.update(users)
      .set({
        passwordHash,
        updatedAt: new Date()
      })
      .where(and(eq(users.id, id), eq(users.role, "PSICOLOGO")));
      
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao atualizar senha." };
  }
}

export async function deletePsicologoAction(id: string) {
  const session = await getSession();
  if (session?.role !== "GLOBAL_ADMIN") {
    return { error: "Acesso negado." };
  }

  try {
    await db.update(users)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
      .where(and(eq(users.id, id), eq(users.role, "PSICOLOGO")));
      
    const { revalidatePath } = await import("next/cache");
    revalidatePath("/[lang]/dashboard/admin/profissionais", "page");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao excluir profissional." };
  }
}

export async function getAdminDadosGeradosAction() {
  const session = await getSession();
  if (session?.role !== "GLOBAL_ADMIN") return { error: "Acesso negado." };

  try {
    const { inArray } = await import("drizzle-orm");
    const alunos = await db.select().from(users).where(and(eq(users.role, "ALUNO"), isNull(users.deletedAt)));
    
    if (alunos.length === 0) return { data: [] };

    const psiIds = Array.from(new Set(alunos.map(a => a.psicologoId).filter(Boolean))) as string[];
    const guardianIds = Array.from(new Set(alunos.map(a => a.guardianId).filter(Boolean))) as string[];

    const psicologos = psiIds.length > 0 ? await db.select().from(users).where(inArray(users.id, psiIds)) : [];
    const guardians = guardianIds.length > 0 ? await db.select().from(users).where(inArray(users.id, guardianIds)) : [];

    const alunoIds = alunos.map(a => a.id);
    const sessions = alunoIds.length > 0 ? await db.select().from(gameSessions).where(inArray(gameSessions.alunoId, alunoIds)) : [];

    const psiMap = new Map(psicologos.map(p => [p.id, p]));
    const guardMap = new Map(guardians.map(g => [g.id, g]));

    const metricsMap = new Map();
    sessions.forEach(s => {
      if (!metricsMap.has(s.alunoId)) {
        metricsMap.set(s.alunoId, { vtri: "N/A", qa: "N/A", imp: "N/A" });
      }
    });

    const result = alunos.map(aluno => {
      const psi = aluno.psicologoId ? psiMap.get(aluno.psicologoId) : null;
      const guard = aluno.guardianId ? guardMap.get(aluno.guardianId) : null;
      const metrics = metricsMap.get(aluno.id) || { vtri: "N/A", qa: "N/A", imp: "N/A" };

      return {
        id: aluno.id,
        psicologoName: psi?.name || "N/A",
        psicologoEmail: psi?.email || "N/A",
        psicologoCrp: psi?.crp || "N/A",
        psicologoClinic: psi?.clinicName || "N/A",
        guardianName: guard?.name || "N/A",
        guardianEmail: guard?.email || "N/A",
        guardianPhone: guard?.phone || "N/A",
        alunoName: aluno.name || "N/A",
        alunoAge: aluno.age || "N/A",
        alunoGender: aluno.gender || "N/A",
        vtri: metrics.vtri,
        qa: metrics.qa,
        imp: metrics.imp,
        createdAt: aluno.createdAt
      };
    });

    return { data: result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()) };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao buscar dados." };
  }
}

export async function exportAdminDadosGeradosCsvAction() {
  const result = await getAdminDadosGeradosAction();
  if (result.error || !result.data) {
    return { error: result.error || "Erro ao gerar CSV" };
  }

  const data = result.data;
  
  const headers = [
    "Psicólogo", "Email Psicólogo", "CRP", "Clínica",
    "Responsável", "Email Responsável", "Telefone",
    "Criança", "Idade", "Gênero",
    "VTRI", "QA", "IMP"
  ];
  
  const rows = data.map(row => [
    `"${row.psicologoName}"`,
    `"${row.psicologoEmail}"`,
    `"${row.psicologoCrp}"`,
    `"${row.psicologoClinic}"`,
    `"${row.guardianName}"`,
    `"${row.guardianEmail}"`,
    `"${row.guardianPhone}"`,
    `"${row.alunoName}"`,
    `"${row.alunoAge}"`,
    `"${row.alunoGender}"`,
    `"${row.vtri}"`,
    `"${row.qa}"`,
    `"${row.imp}"`
  ].join(";"));
  
  const csvContent = "\uFEFF" + [headers.join(";"), ...rows].join("\n");
  
  return { csv: csvContent };
}

