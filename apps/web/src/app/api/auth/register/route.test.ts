import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

// Mock dependencies
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
  }
}));

vi.mock('jose', () => {
  return {
    SignJWT: class {
      setProtectedHeader = vi.fn().mockReturnThis();
      setIssuedAt = vi.fn().mockReturnThis();
      setExpirationTime = vi.fn().mockReturnThis();
      sign = vi.fn().mockResolvedValue('mock_token');
    }
  };
});

const mocks = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockInsertValues: vi.fn()
}));

vi.mock('../../../../../../../packages/db/db/index', () => ({
  db: {
    query: {
      users: {
        findFirst: mocks.mockFindFirst
      }
    },
    insert: () => ({
      values: mocks.mockInsertValues
    })
  }
}));

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 if required fields are missing', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Eduardo' }) // Missing email, password, confirmPassword
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Preencha todos os campos obrigatórios.');
  });

  it('should return 400 if passwords do not match', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Eduardo', email: 'edu@test.com', password: '123', confirmPassword: '321' })
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('As senhas não coincidem.');
  });

  it('should return 400 if email is already in use', async () => {
    mocks.mockFindFirst.mockResolvedValueOnce({ id: 'existing_user' });

    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Eduardo', email: 'edu@test.com', password: '123', confirmPassword: '123' })
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Este e-mail já está em uso.');
  });

  it('should successfully create a psychologist account', async () => {
    // Primeira chamada: verifica email (null)
    // Segunda chamada: busca usuário após cadastro (novo usuário)
    mocks.mockFindFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'new_uuid', name: 'Eduardo', email: 'edu@test.com', role: 'PSICOLOGO' });
    
    mocks.mockInsertValues.mockResolvedValue([{ id: 'new_uuid' }]);

    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Eduardo', email: 'edu@test.com', password: '123', confirmPassword: '123' })
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.token).toBe('mock_token');
    expect(data.user).toMatchObject({
      id: 'new_uuid',
      name: 'Eduardo',
      email: 'edu@test.com',
      role: 'PSICOLOGO'
    });
  });
});
