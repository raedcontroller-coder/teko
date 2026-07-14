/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMyDataAction, updateMyDataAction, verifyCurrentPasswordAction, updatePasswordAction, softDeleteAccountAction } from './my-data';
import { db } from '../../../../packages/db/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import * as auth from './auth';

vi.mock('../../../../packages/db/db', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  };
  return { db: mockDb };
});

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
}));

vi.mock('./auth', () => ({
  getSession: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('next/headers', () => {
  const mockCookies = {
    delete: vi.fn(),
  };
  return {
    cookies: vi.fn(() => Promise.resolve(mockCookies)),
  };
});

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

describe('Integração de Comunicação - Meu Perfil da Web vs Banco de Dados', () => {
  const mockSession = { sub: 'uuid-1', role: 'PSICOLOGO' };

  beforeEach(() => {
    vi.clearAllMocks();
    (auth.getSession as any).mockResolvedValue(mockSession);
  });

  describe('1. getMyDataAction', () => {
    it('deve buscar os dados do perfil logado e retornar sucesso', async () => {
      const mockUser = {
        name: 'Dr. João',
        email: 'joao@teste.com',
        crp: '123',
        clinicName: 'Clínica A',
      };
      
      (db.where as any).mockResolvedValueOnce([mockUser]);

      const res = await getMyDataAction();
      
      expect(auth.getSession).toHaveBeenCalled();
      expect(db.select).toHaveBeenCalled();
      expect(db.from).toHaveBeenCalled();
      expect(db.where).toHaveBeenCalled();
      expect(res.data).toEqual(mockUser);
    });

    it('deve retornar erro se não houver sessão ativa', async () => {
      (auth.getSession as any).mockResolvedValueOnce(null);
      const res = await getMyDataAction();
      expect(res).toEqual({ error: 'Não autorizado.' });
    });

    it('deve retornar erro se o usuário for deletado fisicamente do banco', async () => {
      (db.where as any).mockResolvedValueOnce([]); // mock db finds no user
      const res = await getMyDataAction();
      expect(res).toEqual({ error: 'Usuário não encontrado.' });
    });
  });

  describe('2. updateMyDataAction', () => {
    it('deve enviar dados válidos para atualizar o perfil no banco', async () => {
      const payload = {
        name: 'Dr. João Novo',
        email: 'joaonovo@teste.com',
        crp: '321',
        clinicName: 'Clínica Nova'
      };

      // Simula que NÃO existe usuário com esse email (retorna [])
      (db.where as any).mockResolvedValueOnce([]);
      
      (db.set as any).mockReturnValue({
        where: vi.fn().mockResolvedValue([payload])
      });

      const res = await updateMyDataAction(payload);
      
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Dr. João Novo',
        email: 'joaonovo@teste.com'
      }));
      expect(res.success).toBe(true);
    });

    it('deve retornar erro se o email já estiver em uso por outra conta', async () => {
      const payload = {
        name: 'Dr. João Novo',
        email: 'joaonovo@teste.com',
      };
      // Simula que achou OUTRO usuário com esse e-mail
      (db.where as any).mockResolvedValueOnce([{ id: 'uuid-2' }]);
      const res = await updateMyDataAction(payload);
      expect(res).toEqual({ error: 'Este email já está em uso por outro usuário.' });
    });

    it('deve retornar erro se não houver sessão ativa', async () => {
      (auth.getSession as any).mockResolvedValueOnce(null);
      const res = await updateMyDataAction({ name: 'Dr', email: 'a@a.com' });
      expect(res).toEqual({ error: 'Não autorizado.' });
    });
  });

  describe('3. verifyCurrentPasswordAction', () => {
    it('deve validar a senha atual corretamente contra o banco', async () => {
      const mockUser = { passwordHash: 'hashed-old-password' };
      (db.where as any).mockResolvedValueOnce([mockUser]);
      (bcrypt.compare as any).mockResolvedValue(true);

      const res = await verifyCurrentPasswordAction('old-password');
      
      expect(db.select).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalledWith('old-password', 'hashed-old-password');
      expect(res.success).toBe(true);
    });

    it('deve retornar erro se a senha estiver incorreta', async () => {
      (db.where as any).mockResolvedValueOnce([{ passwordHash: 'hash-antigo' }]);
      (bcrypt.compare as any).mockResolvedValue(false); // Errou a senha

      const res = await verifyCurrentPasswordAction('senha-errada');
      expect(res).toEqual({ error: 'A senha atual está incorreta.' });
    });
  });

  describe('4. updatePasswordAction', () => {
    it('deve criptografar e atualizar a senha no banco', async () => {
      const mockUser = { passwordHash: 'hashed-old-password' };
      (db.where as any).mockResolvedValueOnce([mockUser]).mockResolvedValueOnce([mockUser]);
      (bcrypt.compare as any).mockResolvedValue(true);
      (bcrypt.hash as any).mockResolvedValue('hashed-new-password');

      (db.set as any).mockReturnValue({
        where: vi.fn().mockResolvedValue([mockUser])
      });

      const res = await updatePasswordAction('old-password', 'new-password');
      
      expect(bcrypt.hash).toHaveBeenCalledWith('new-password', 10);
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalledWith(expect.objectContaining({ passwordHash: 'hashed-new-password' }));
      expect(res.success).toBe(true);
    });

    it('deve retornar erro se a validação da senha atual falhar', async () => {
      (db.where as any).mockResolvedValueOnce([{ passwordHash: 'hash-antigo' }]);
      (bcrypt.compare as any).mockResolvedValue(false); // Senha atual bateu errado

      const res = await updatePasswordAction('senha-errada', 'nova-senha');
      expect(res).toEqual({ error: 'A senha atual está incorreta.' });
    });
  });

  describe('5. softDeleteAccountAction', () => {
    it('deve marcar a conta como deletada no banco e limpar o cookie', async () => {
      (db.where as any).mockResolvedValueOnce([true]);
      (db.set as any).mockReturnValue({
        where: vi.fn().mockResolvedValue([true])
      });

      const res = await softDeleteAccountAction();
      
      expect(db.update).toHaveBeenCalled();
      expect(db.set).toHaveBeenCalledWith(expect.objectContaining({
        deletedAt: expect.any(Date)
      }));
      const cookiesStore = await cookies();
      expect(cookiesStore.delete).toHaveBeenCalledWith('teko_session');
      expect(res.success).toBe(true);
    });

    it('deve retornar erro se não houver sessão ativa ao tentar deletar conta', async () => {
      (auth.getSession as any).mockResolvedValueOnce(null);
      const res = await softDeleteAccountAction();
      expect(res).toEqual({ error: 'Não autorizado.' });
    });
  });
});
