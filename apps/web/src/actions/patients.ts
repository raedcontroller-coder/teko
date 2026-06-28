"use server";

import { db } from "../../../../packages/db/db/index";
import { users } from "../../../../packages/db/db/schema";
import { eq, and } from "drizzle-orm";
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

    // 1. Procurar se o responsável já existe (apenas por email)
    const [existingGuardianByEmail] = await db.select().from(users).where(eq(users.email, guardianEmail));
    
    let guardianId = "";

    if (existingGuardianByEmail) {
      if (existingGuardianByEmail.role !== "FAMILIAR") {
        return { error: "Este email já está em uso por outro tipo de conta." };
      }
      guardianId = existingGuardianByEmail.id;
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
    
  } catch (error: any) {
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

    return { data: patients };
  } catch (error: any) {
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

    return { 
      data: {
        patient,
        guardian
      }
    };
  } catch (error: any) {
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
  } catch (error: any) {
    console.error(error);
    if (error.code === '23505') {
      return { error: "Este email ou telefone já está em uso por outra conta." };
    }
    return { error: "Erro ao atualizar dados do responsável." };
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
