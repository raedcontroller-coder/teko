"use server";

import { db } from "../../../../packages/db/db/index";
import { users, gameSessions } from "../../../../packages/db/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getSession } from "./auth";

export async function createPatientAction(formData: FormData, adminPsicologoId?: string) {
  try {
    const session = await getSession();
    if (!session || !session.sub) {
      return { error: "Usuário não autenticado." };
    }

    let psicologoId = session.sub;
    
    // Se foi passado um ID alvo e o usuário atual é ADMIN, delegar
    if (adminPsicologoId && session.role === "GLOBAL_ADMIN") {
      psicologoId = adminPsicologoId;
    }

    const name = formData.get("name") as string;
    const age = formData.get("age") as string;
    const gender = formData.get("gender") as string;
    
    const guardianName = formData.get("guardianName") as string;
    const guardianEmail = formData.get("guardianEmail") as string;
    const guardianPhone = formData.get("guardianPhone") as string;
    
    if (!psicologoId || !name || !age || !gender || !guardianName || !guardianEmail || !guardianPhone) {
      return { error: "Todos os campos são obrigatórios." };
    }

    // 1. Procurar se o responsável já existe (por email ou telefone)
    const [existingGuardianByEmail] = await db.select().from(users).where(eq(users.email, guardianEmail));
    const [existingGuardianByPhone] = await db.select().from(users).where(eq(users.phone, guardianPhone));
    
    let guardianId = "";

    if (existingGuardianByEmail || existingGuardianByPhone) {
      if (existingGuardianByEmail && existingGuardianByEmail.phone !== guardianPhone) {
        return { error: "Este e-mail já está cadastrado com outro número de telefone. Por favor, verifique os dados." };
      }
      if (existingGuardianByPhone && existingGuardianByPhone.email !== guardianEmail) {
        return { error: "Este telefone já está cadastrado com outro e-mail. Por favor, verifique os dados." };
      }
      
      const existingGuardian = existingGuardianByEmail || existingGuardianByPhone;
      
      if (existingGuardian.role !== "FAMILIAR") {
        return { error: "Os dados de contato fornecidos já pertencem a outro tipo de conta." };
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

    // 2. Criar o Paciente (ALUNO)
    // O paciente (criança) não tem email próprio obrigatório no form, 
    // mas o schema exige email unique para todo "user".
    // Então geramos um email fictício único para a criança.
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

    revalidatePath("/[lang]/dashboard/pacientes", "page");
    return { success: true };
    
  } catch (error) {
    console.error("Erro ao criar paciente:", error);
    return { error: "Erro interno ao salvar paciente. Tente novamente." };
  }
}

export async function getPatientsAction(adminPsicologoId?: string) {
  try {
    const session = await getSession();
    if (!session || !session.sub) {
      return { error: "Usuário não autenticado." };
    }

    let psicologoId = session.sub;
    
    if (adminPsicologoId && session.role === "GLOBAL_ADMIN") {
      psicologoId = adminPsicologoId;
    }

    const patients = await db.query.users.findMany({
      where: and(
        eq(users.role, "ALUNO"),
        eq(users.psicologoId, psicologoId)
      ),
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    const patientIds = patients.map((p) => p.id);
    let allSessions: Record<string, unknown>[] = [];
    if (patientIds.length > 0) {
      allSessions = await db.query.gameSessions.findMany({
        where: inArray(gameSessions.alunoId, patientIds),
      });
    }

    const patientsWithDate = patients.map((patient) => {
      const patientSessions = allSessions.filter((s) => s.alunoId === patient.id);
      let lastSessionDate = null;
      if (patientSessions.length > 0) {
        patientSessions.sort((a, b) => new Date(b.startedAt as string).getTime() - new Date(a.startedAt as string).getTime());
        lastSessionDate = patientSessions[0].startedAt as string | Date;
      }
      return {
        ...patient,
        lastSessionDate,
      };
    });

    return { data: patientsWithDate };
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error);
    return { error: "Erro interno ao buscar pacientes." };
  }
}

export async function getPatientByIdAction(patientId: string, adminPsicologoId?: string) {
  try {
    const session = await getSession();
    if (!session || !session.sub) {
      return { error: "Usuário não autenticado." };
    }

    let psicologoId = session.sub;
    if (adminPsicologoId && session.role === "GLOBAL_ADMIN") {
      psicologoId = adminPsicologoId;
    }

    const patient = await db.query.users.findFirst({
      where: and(
        eq(users.id, patientId),
        eq(users.role, "ALUNO"),
        eq(users.psicologoId, psicologoId)
      ),
    });

    if (!patient) {
      return { error: "Paciente não encontrado." };
    }

    let guardian = null;
    if (patient.guardianId) {
      guardian = await db.query.users.findFirst({
        where: eq(users.id, patient.guardianId),
      });
    }

    const rawSessions = await db.query.gameSessions.findMany({
      where: eq(gameSessions.alunoId, patientId),
      orderBy: (gameSessions, { desc }) => [desc(gameSessions.startedAt)],
    });

    const allGames = await db.query.games.findMany();

    const sessions = rawSessions.map(session => {
      const game = allGames.find(g => g.id === session.gameId);
      return {
        ...session,
        gameName: game ? game.name : 'Desconhecido'
      };
    });

    return { 
      data: {
        patient,
        guardian,
        sessions
      }
    };
  } catch (error) {
    console.error("Erro ao buscar detalhes do paciente:", error);
    return { error: "Erro interno ao buscar detalhes do paciente." };
  }
}

export async function updatePatientAction(patientId: string, data: { name: string; age: string; gender: string }, adminPsicologoId?: string) {
  try {
    const session = await getSession();
    if (!session || !session.sub) return { error: "Não autorizado." };

    let psicologoId = session.sub;
    if (adminPsicologoId && session.role === "GLOBAL_ADMIN") {
      psicologoId = adminPsicologoId;
    }

    await db.update(users)
      .set({ name: data.name, age: data.age, gender: data.gender })
      .where(and(eq(users.id, patientId), eq(users.psicologoId, psicologoId)));
    
    revalidatePath("/[lang]/dashboard/pacientes/[id]", "page");
    revalidatePath("/[lang]/dashboard/pacientes", "page");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao atualizar dados da criança." };
  }
}

export async function updateGuardianAction(guardianId: string, data: { name: string; email: string; phone: string }, adminPsicologoId?: string) {
  try {
    const session = await getSession();
    if (!session || !session.sub) return { error: "Não autorizado." };

    let psicologoId = session.sub;
    if (adminPsicologoId && session.role === "GLOBAL_ADMIN") {
      psicologoId = adminPsicologoId;
    }

    await db.update(users)
      .set({ name: data.name, email: data.email, phone: data.phone })
      .where(and(eq(users.id, guardianId), eq(users.psicologoId, psicologoId)));
    
    revalidatePath("/[lang]/dashboard/pacientes/[id]", "page");
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const pgError = error.cause || error;
    
    if (pgError.code === '23505') {
      const isPhone = pgError.constraint === 'users_phone_unique';
      const isEmail = pgError.constraint === 'users_email_unique';
      
      const msg = isPhone 
        ? "O telefone informado já pertence a outro usuário." 
        : isEmail 
          ? "O e-mail informado já pertence a outro usuário."
          : "Este email ou telefone já está em uso por outra conta.";
          
      console.log(`\n[Teko Info] Bloqueio na edição: Tentativa de usar ${isPhone ? 'telefone' : 'e-mail'} já cadastrado.`);
      return { error: msg };
    }
    console.error("Erro interno ao atualizar responsável:", error);
    return { error: "Erro interno ao atualizar dados do responsável." };
  }
}

export async function deletePatientAction(patientId: string, adminPsicologoId?: string) {
  try {
    const session = await getSession();
    if (!session || !session.sub) return { error: "Não autorizado." };

    let psicologoId = session.sub;
    if (adminPsicologoId && session.role === "GLOBAL_ADMIN") {
      psicologoId = adminPsicologoId;
    }

    await db.delete(users)
      .where(and(eq(users.id, patientId), eq(users.psicologoId, psicologoId)));
    
    revalidatePath("/[lang]/dashboard/pacientes", "page");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao excluir o paciente." };
  }
}
export async function getDashboardMetricsAction(adminPsicologoId?: string) {
  try {
    const session = await getSession();
    if (!session || !session.sub) return { error: "N�o autorizado." };

    let psicologoId = session.sub;
    if (adminPsicologoId && session.role === "GLOBAL_ADMIN") {
      psicologoId = adminPsicologoId;
    }

    const patientsList = await db.query.users.findMany({
      where: and(eq(users.role, "ALUNO"), eq(users.psicologoId, psicologoId)),
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    const patientIds = patientsList.map(p => p.id);
    let allSessions: Record<string, unknown>[] = [];
    if (patientIds.length > 0) {
      allSessions = await db.query.gameSessions.findMany({
        where: inArray(gameSessions.alunoId, patientIds)
      });
    }

    const allGames = await db.query.games.findMany();
    let totalSessions = 0;

    const patientsWithCount = patientsList.map(p => {
      const pSess = allSessions.filter(s => s.alunoId === p.id);
      let tR = 0, f = 0, g = 0;
      pSess.forEach(s => {
        const gm = allGames.find(x => x.id === s.gameId);
        if (gm) {
          const nm = gm.name.toLowerCase();
          if (nm.includes("toca") || nm.includes("gonogo")) tR++;
          else if (nm.includes("fot")) f++;
          else if (nm.includes("goleiro")) g++;
        }
      });
      const sessionCount = Math.min(tR, f, g);
      totalSessions += sessionCount;
      
      let lastSessionDate = null;
      if (pSess.length > 0) {
        pSess.sort((a, b) => new Date(b.startedAt as string).getTime() - new Date(a.startedAt as string).getTime());
        lastSessionDate = pSess[0].startedAt as string | Date;
      }
      
      return { ...p, sessionCount, lastSessionDate };
    });

    return { data: { patients: patientsWithCount, totalSessions } };
  } catch (error) {
    console.error(error);
    return { error: "Erro interno" };
  }
}
