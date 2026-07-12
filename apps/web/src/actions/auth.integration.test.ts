import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { publicRegisterAction, loginAction, getSession } from './auth';
import { db } from '../../../../packages/db/db/index';
import { users } from '../../../../packages/db/db/schema';
import { eq, like } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Mock apenas de bibliotecas do Next.js (Cookies e Redirecionamento)
// O Banco de Dados NÃO é mockado aqui! Bateremos no PostgreSQL real.
vi.mock('next/headers', () => {
  const mockCookies = { set: vi.fn(), get: vi.fn(), delete: vi.fn() };
  return { cookies: vi.fn(() => Promise.resolve(mockCookies)) };
});

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('Integration Tests (DB Real) - Autenticação', () => {
  const TEST_EMAIL = 'integration_auth@teko.local';
  
  // Limpeza de segurança caso testes anteriores tenham quebrado
  beforeAll(async () => {
    await db.delete(users).where(eq(users.email, TEST_EMAIL));
  });

  // TEARDOWN: Garbage Collection (Rollback)
  afterAll(async () => {
    await db.delete(users).where(eq(users.email, TEST_EMAIL));
  });

  it('deve registrar um usuário no banco real, criar hash, e recuperar no banco', async () => {
    // 1. Cadastrar usuário usando o Server Action real
    const formData = new FormData();
    formData.append('full_name', '[TESTE] Psicólogo Integração');
    formData.append('email', TEST_EMAIL);
    formData.append('password', 'senhaSegura123');
    formData.append('confirm_password', 'senhaSegura123');
    formData.append('crp', '1234/INT');
    formData.append('clinicName', 'Clínica Integração');

    const result = await publicRegisterAction(formData);
    
    // Verificamos o sucesso da requisição
    expect(result).toEqual({ success: true });

    // 2. Validar no banco de dados real se ele foi gravado (sem mocks)
    const savedUser = await db.query.users.findFirst({
      where: eq(users.email, TEST_EMAIL)
    });

    expect(savedUser).toBeDefined();
    expect(savedUser?.name).toBe('[TESTE] Psicólogo Integração');
    expect(savedUser?.role).toBe('PSICOLOGO');
    
    // O bcrypt deve ter feito o hash no momento da inserção
    expect(savedUser?.passwordHash).toBeDefined();
    expect(savedUser?.passwordHash).not.toBe('senhaSegura123'); // Nunca salvar em texto puro!
  });

  it('deve realizar login batendo as credenciais contra o banco de dados real', async () => {
    // O usuário já foi inserido no DB no teste acima
    const formData = new FormData();
    formData.append('email', TEST_EMAIL);
    formData.append('password', 'senhaSegura123'); // Senha correta

    await loginAction(null, formData);

    // O Mock de cookies do NextJS tem que ter sido chamado com a JWT
    const cookiesStore = await cookies();
    expect(cookiesStore.set).toHaveBeenCalledWith('teko_session', expect.any(String), expect.any(Object));
    expect(redirect).toHaveBeenCalledWith('/pt/dashboard');
  });

  it('deve bloquear login com senha incorreta e proteger o banco real', async () => {
    const formData = new FormData();
    formData.append('email', TEST_EMAIL);
    formData.append('password', 'senhaERRADA'); // Senha incorreta

    const result = await loginAction(null, formData);

    expect(result).toEqual({ error: 'Credenciais inválidas.' });
  });

  it('deve retornar erro ao tentar logar com usuário inexistente (fantasma) no banco real', async () => {
    const formData = new FormData();
    formData.append('email', 'fantasma_nao_existe@teko.local');
    formData.append('password', 'senhaSegura123'); 

    const result = await loginAction(null, formData);

    expect(result).toEqual({ error: 'Credenciais inválidas.' });
  });

  it('deve bloquear registro caso o e-mail já exista no banco real', async () => {
    // Tenta registrar novamente usando o TEST_EMAIL (que já foi inserido no primeiro teste)
    const formData = new FormData();
    formData.append('full_name', '[TESTE] Outro Psicólogo');
    formData.append('email', TEST_EMAIL); 
    formData.append('password', 'outraSenha321');
    formData.append('confirm_password', 'outraSenha321');
    formData.append('crp', '0000/INT');
    formData.append('clinicName', 'Clínica Fake');

    const result = await publicRegisterAction(formData);

    // O banco real deve reconhecer o e-mail e a Action deve devolver a mensagem de erro esperada
    expect(result).toEqual({ error: 'Este e-mail já está em uso.' });
  });
});
