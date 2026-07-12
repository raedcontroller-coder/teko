import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginAction, publicRegisterAction } from './auth';
import { db } from '../../../../packages/db/db/index';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

vi.mock('../../../../packages/db/db/index', () => {
  return {
    db: {
      query: {
        users: {
          findFirst: vi.fn(),
        },
      },
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockResolvedValue(true),
    },
  };
});

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
}));

vi.mock('next/headers', () => {
  const mockCookies = {
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  };
  return {
    cookies: vi.fn(() => Promise.resolve(mockCookies)),
  };
});

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}));

vi.mock('jose', () => {
  class MockSignJWT {
    constructor(payload: any) {}
    setProtectedHeader() { return this; }
    setIssuedAt() { return this; }
    setExpirationTime() { return this; }
    async sign() { return 'mock-jwt-token'; }
  }
  return {
    SignJWT: MockSignJWT,
    jwtVerify: vi.fn(),
  };
});

describe('Integração de Comunicação - Autenticação da Web vs Banco de Dados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. loginAction', () => {
    it('deve logar um psicólogo com sucesso, gerar token e redirecionar', async () => {
      const formData = new FormData();
      formData.append('email', 'teste@teste.com');
      formData.append('password', 'senha123');
      
      const mockUser = {
        id: 'uuid-1',
        name: 'Dr. Teste',
        email: 'teste@teste.com',
        role: 'PSICOLOGO',
        passwordHash: 'hashed-password',
        deletedAt: null,
      };

      (db.query.users.findFirst as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);

      await loginAction(null, formData);

      expect(db.query.users.findFirst).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalledWith('senha123', 'hashed-password');
      const cookiesStore = await cookies();
      expect(cookiesStore.set).toHaveBeenCalledWith('teko_session', 'mock-jwt-token', expect.any(Object));
      expect(redirect).toHaveBeenCalledWith('/pt/dashboard');
    });

    it('deve retornar erro se o usuário não for encontrado', async () => {
      const formData = new FormData();
      formData.append('email', 'fantasma@teste.com');
      formData.append('password', 'senha123');
      
      (db.query.users.findFirst as any).mockResolvedValue(undefined);

      const res = await loginAction(null, formData);
      expect(res).toEqual({ error: 'Credenciais inválidas.' });
    });

    it('deve retornar erro se a senha for incorreta', async () => {
      const formData = new FormData();
      formData.append('email', 'teste@teste.com');
      formData.append('password', 'senha_errada');
      
      (db.query.users.findFirst as any).mockResolvedValue({ passwordHash: 'hash-verdadeiro', deletedAt: null });
      (bcrypt.compare as any).mockResolvedValue(false);

      const res = await loginAction(null, formData);
      expect(res).toEqual({ error: 'Credenciais inválidas.' });
    });
  });

  describe('2. publicRegisterAction', () => {
    it('deve registrar um psicólogo com sucesso, criar cookie de sessão e retornar sucesso', async () => {
      const formData = new FormData();
      formData.append('full_name', 'Dr. Novo');
      formData.append('email', 'novo@teste.com');
      formData.append('password', 'senha123');
      formData.append('confirm_password', 'senha123');
      formData.append('crp', '12/34567');
      formData.append('clinicName', 'Clínica Vida');

      const mockNewUser = {
        id: 'uuid-2',
        name: 'Dr. Novo',
        email: 'novo@teste.com',
        role: 'PSICOLOGO',
        crp: '12/34567',
      };

      (db.query.users.findFirst as any)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockNewUser);
        
      (bcrypt.hash as any).mockResolvedValue('hashed-password-novo');

      const response = await publicRegisterAction(formData);

      expect(bcrypt.hash).toHaveBeenCalledWith('senha123', 10);
      expect(db.insert).toHaveBeenCalled();
      const cookiesStore = await cookies();
      expect(cookiesStore.set).toHaveBeenCalledWith('teko_session', 'mock-jwt-token', expect.any(Object));
      expect(response).toEqual({ success: true });
    });

    it('deve retornar erro se o e-mail já estiver em uso', async () => {
      const formData = new FormData();
      formData.append('full_name', 'Dr. Novo');
      formData.append('email', 'ja_existe@teste.com');
      formData.append('password', 'senha123');
      formData.append('confirm_password', 'senha123');

      (db.query.users.findFirst as any).mockResolvedValue({ id: 'usuario-existente' });

      const res = await publicRegisterAction(formData);
      expect(res).toEqual({ error: 'Este e-mail já está em uso.' });
    });

    it('deve retornar erro em caso de falha no banco de dados', async () => {
      const formData = new FormData();
      formData.append('full_name', 'Dr. Novo');
      formData.append('email', 'novo@teste.com');
      formData.append('password', 'senha123');
      formData.append('confirm_password', 'senha123');
      
      (db.query.users.findFirst as any).mockResolvedValue(null);
      (db.insert as any).mockImplementationOnce(() => { throw new Error('Crash DB'); });

      const res = await publicRegisterAction(formData);
      expect(res).toEqual({ error: 'Erro interno no servidor ao tentar cadastrar.' });
    });
  });
});
