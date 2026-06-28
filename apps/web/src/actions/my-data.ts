"use server";

import { db } from "../../../../packages/db/db";
import { users } from "../../../../packages/db/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "./auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function getMyDataAction() {
  try {
    const session = await getSession();
    if (!session || !session.sub) return { error: "Não autorizado." };

    const [user] = await db
      .select({
        name: users.name,
        email: users.email,
        crp: users.crp,
        clinicName: users.clinicName,
        passwordHash: users.passwordHash,
      })
      .from(users)
      .where(eq(users.id, session.sub));

    if (!user) {
      return { error: "Usuário não encontrado." };
    }

    return { data: user };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao buscar dados." };
  }
}

export async function updateMyDataAction(data: { name: string; email: string; crp?: string; clinicName?: string }) {
  try {
    const session = await getSession();
    if (!session || !session.sub) return { error: "Não autorizado." };

    // Check if the new email already exists for another user
    const [existing] = await db.select().from(users).where(eq(users.email, data.email));
    if (existing && existing.id !== session.sub) {
      return { error: "Este email já está em uso por outro usuário." };
    }

    await db
      .update(users)
      .set({
        name: data.name,
        email: data.email,
        crp: data.crp || null,
        clinicName: data.clinicName || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.sub));

    revalidatePath("/[lang]/dashboard/my-data", "page");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao atualizar dados." };
  }
}

export async function verifyCurrentPasswordAction(currentPassword: string) {
  try {
    const session = await getSession();
    if (!session || !session.sub) return { error: "Não autorizado." };
    if (!currentPassword) return { error: "Senha inválida." };

    const [user] = await db.select().from(users).where(eq(users.id, session.sub));
    if (!user || !user.passwordHash) return { error: "Usuário não encontrado." };

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return { error: "A senha atual está incorreta." };
    }

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao verificar senha." };
  }
}

export async function updatePasswordAction(currentPassword?: string, newPassword?: string) {
  try {
    const session = await getSession();
    if (!session || !session.sub) return { error: "Não autorizado." };
    if (!newPassword || !currentPassword) return { error: "Senhas inválidas." };

    // Verify current password first
    const [user] = await db.select().from(users).where(eq(users.id, session.sub));
    if (!user || !user.passwordHash) return { error: "Usuário não encontrado." };

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return { error: "A senha atual está incorreta." };
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.sub));

    // Clear session so user needs to login again with new password
    (await cookies()).delete('teko_session');

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao atualizar senha." };
  }
}

export async function softDeleteAccountAction() {
  try {
    const session = await getSession();
    if (!session || !session.sub) return { error: "Não autorizado." };

    await db
      .update(users)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.sub));

    (await cookies()).delete('teko_session');

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Erro ao excluir conta." };
  }
}
