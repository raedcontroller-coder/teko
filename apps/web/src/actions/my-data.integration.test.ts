import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { getMyDataAction, updateMyDataAction, verifyCurrentPasswordAction, updatePasswordAction, softDeleteAccountAction } from './my-data';
import { publicRegisterAction } from './auth';
import { db } from '../../../../packages/db/db/index';
import { users } from '../../../../packages/db/db/schema';
import { eq, like } from 'drizzle-orm';
import * as auth from './auth';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('./auth', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    getSession: vi.fn(),
  };
});

vi.mock('next/headers', () => {
  const mockCookies = { delete: vi.fn(), set: vi.fn(), get: vi.fn() };
  return { cookies: vi.fn(() => Promise.resolve(mockCookies)) };
});

describe('Integration Tests (DB Real) - Meu Perfil', () => {
  const PSI_EMAIL = 'integration_mydata@teko.local';
  let psiId = '';

  const cleanupLixo = async () => {
    await db.delete(users).where(eq(users.email, PSI_EMAIL));
    await db.delete(users).where(eq(users.email, 'integration_updated@teko.local'));
    await db.delete(users).where(eq(users.email, 'integration_psi_2@teko.local'));
  };

  beforeAll(async () => {
    await cleanupLixo();

    const formData = new FormData();
    formData.append('full_name', '[TESTE] Perfil');
    formData.append('email', PSI_EMAIL);
    formData.append('password', 'senha123');
    formData.append('confirm_password', 'senha123');
    formData.append('crp', '00000/MYDATA');
    formData.append('clinicName', 'Clínica Antiga');

    await publicRegisterAction(formData);

    const formData2 = new FormData();
    formData2.append('full_name', '[TESTE] Perfil 2');
    formData2.append('email', 'integration_psi_2@teko.local');
    formData2.append('password', 'senha123');
    formData2.append('confirm_password', 'senha123');
    await publicRegisterAction(formData2);

    const psi = await db.query.users.findFirst({ where: eq(users.email, PSI_EMAIL) });
    if (psi) {
      psiId = psi.id;
      (auth.getSession as any).mockResolvedValue({ sub: psiId, role: 'PSICOLOGO' });
    }
  });

  afterAll(async () => {
    await cleanupLixo();
  });

  it('deve buscar os dados do perfil logado direto do banco', async () => {
    const result = await getMyDataAction();
    expect(result.data).toBeDefined();
    expect(result.data?.name).toBe('[TESTE] Perfil');
    expect(result.data?.crp).toBe('00000/MYDATA');
  });

  it('deve atualizar o nome e email do psicólogo no banco real', async () => {
    const payload = {
      name: '[TESTE] Perfil Atualizado',
      email: 'integration_updated@teko.local',
      crp: '11111/MYDATA',
      clinicName: 'Clínica Nova'
    };

    const result = await updateMyDataAction(payload);
    expect(result).toEqual({ success: true });

    const updatedPsi = await db.query.users.findFirst({ where: eq(users.id, psiId) });
    expect(updatedPsi?.name).toBe('[TESTE] Perfil Atualizado');
    expect(updatedPsi?.email).toBe('integration_updated@teko.local');

    // Restaurar e-mail para o cleanupLixo e para as próximas baterias
    await updateMyDataAction({
      name: '[TESTE] Perfil',
      email: PSI_EMAIL,
    });
  });

  it('deve bloquear a alteração de e-mail caso ele já pertença a outro usuário no banco real', async () => {
    const payload = {
      name: '[TESTE] Perfil Atualizado',
      email: 'integration_psi_2@teko.local', // E-mail que inserimos no beforeAll
    };

    const result = await updateMyDataAction(payload);
    expect(result).toEqual({ error: 'Este email já está em uso por outro usuário.' });
  });

  it('deve validar a senha real corretamente usando o hash salvo', async () => {
    const resultSuccess = await verifyCurrentPasswordAction('senha123');
    expect(resultSuccess).toEqual({ success: true });

    const resultFail = await verifyCurrentPasswordAction('senha_errada');
    expect(resultFail).toEqual({ error: 'A senha atual está incorreta.' });
  });

  it('deve atualizar a senha com sucesso, criptografando novamente', async () => {
    const result = await updatePasswordAction('senha123', 'novaSenha456');
    expect(result).toEqual({ success: true });

    // Validar direto no banco
    const updatedPsi = await db.query.users.findFirst({ where: eq(users.id, psiId) });
    const isNewValid = await bcrypt.compare('novaSenha456', updatedPsi!.passwordHash!);
    expect(isNewValid).toBe(true);

    const isOldValid = await bcrypt.compare('senha123', updatedPsi!.passwordHash!);
    expect(isOldValid).toBe(false);
  });

  it('deve bloquear a alteração de senha se a senha atual informada for incorreta no banco real', async () => {
    const result = await updatePasswordAction('senha_errada_bd_real', 'novaSenha789');
    expect(result).toEqual({ error: 'A senha atual está incorreta.' });
  });

  it('deve fazer o soft delete da conta no banco', async () => {
    const result = await softDeleteAccountAction();
    expect(result).toEqual({ success: true });

    const deletedPsi = await db.query.users.findFirst({ where: eq(users.id, psiId) });
    expect(deletedPsi?.deletedAt).toBeDefined();
    expect(deletedPsi?.deletedAt).not.toBeNull();
  });
});
