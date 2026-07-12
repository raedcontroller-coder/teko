import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';

const mocks = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockInsertValues: vi.fn(),
  mockReturning: vi.fn(),
  mockFindMany: vi.fn(),
  mockVerify: vi.fn(),
  mockEq: vi.fn(),
  mockAnd: vi.fn(),
  mockInArray: vi.fn()
}));

vi.mock('jose', () => ({
  jwtVerify: mocks.mockVerify
}));

vi.mock('drizzle-orm', () => ({
  eq: mocks.mockEq,
  and: mocks.mockAnd,
  inArray: mocks.mockInArray
}));

vi.mock('../../../../../../packages/db/db/schema', () => ({
  users: {
    id: 'id',
    name: 'name',
    email: 'email',
    role: 'role',
    psicologoId: 'psicologoId',
    guardianId: 'guardianId',
    phone: 'phone',
    createdAt: 'createdAt'
  },
  gameSessions: {
    id: 'id',
    alunoId: 'alunoId',
    gameId: 'gameId',
    startedAt: 'startedAt'
  },
  games: {
    id: 'id',
    name: 'name'
  }
}));

vi.mock('../../../../../../packages/db/db/index', () => ({
  db: {
    query: {
      users: { findMany: mocks.mockFindMany },
      gameSessions: { findMany: mocks.mockFindMany },
      games: { findMany: mocks.mockFindMany }
    },
    select: () => ({
      from: () => ({
        where: mocks.mockSelect
      })
    }),
    insert: () => ({
      values: mocks.mockInsertValues
    })
  }
}));

const valuesMockResult = {
  returning: mocks.mockReturning,
  then: function(resolve) { resolve(true); }
};
mocks.mockInsertValues.mockReturnValue(valuesMockResult);

const getAuthHeaders = () => {
  return new Headers({
    'authorization': 'Bearer valid_token'
  });
};

describe('Patients API (/api/patients)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockVerify.mockResolvedValue({ payload: { sub: 'psi_123', role: 'PSICOLOGO' } });
  });

  describe('GET', () => {
    it('should return 401 if token is missing', async () => {
      const req = new Request('http://localhost/api/patients');
      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('should return list of patients successfully', async () => {
      mocks.mockFindMany
        .mockResolvedValueOnce([{ id: 'patient_1', name: 'João', guardianId: 'guardian_1' }]) // users (ALUNO)
        .mockResolvedValueOnce([{ id: 'guardian_1', name: 'Maria' }]) // users (FAMILIAR)
        .mockResolvedValueOnce([]) // gameSessions
        .mockResolvedValueOnce([]); // games

      const req = new Request('http://localhost/api/patients', { headers: getAuthHeaders() });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data[0].name).toBe('João');
      expect(data.data[0].guardianName).toBe('Maria');
    });
  });

  describe('POST', () => {
    it('should return 400 if required fields are missing', async () => {
      const req = new Request('http://localhost/api/patients', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: 'João' }) // Missing age, gender, guardian info
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Todos os campos são obrigatórios.');
    });

    it('should return 400 if guardian email belongs to a non-FAMILIAR user', async () => {
      mocks.mockSelect
        .mockResolvedValueOnce([{ id: 'existing_admin', email: 'admin@test.com', role: 'GLOBAL_ADMIN', phone: '123' }])
        .mockResolvedValueOnce([]); // by phone

      const req = new Request('http://localhost/api/patients', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: 'João', age: '10', gender: 'Masculino',
          guardianName: 'Admin', guardianEmail: 'admin@test.com', guardianPhone: '123'
        })
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Os dados de contato fornecidos já pertencem a outro tipo de conta.');
    });

    it('should return 400 if email is already registered with another phone', async () => {
      mocks.mockSelect
        .mockResolvedValueOnce([{ id: 'guardian_1', email: 'maria@test.com', role: 'FAMILIAR', phone: '9999' }]) // by email
        .mockResolvedValueOnce([]); // by phone

      const req = new Request('http://localhost/api/patients', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: 'João', age: '10', gender: 'Masculino',
          guardianName: 'Maria', guardianEmail: 'maria@test.com', guardianPhone: '8888' // DIFFERENT PHONE
        })
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Este e-mail já está cadastrado com outro número de telefone.');
    });

    it('should successfully create a new patient and a new guardian', async () => {
      mocks.mockSelect
        .mockResolvedValueOnce([]) // No email conflict
        .mockResolvedValueOnce([]); // No phone conflict

      mocks.mockReturning.mockResolvedValue([{ id: 'new_guardian_id' }]);

      const req = new Request('http://localhost/api/patients', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: 'João', age: '10', gender: 'Masculino',
          guardianName: 'Maria', guardianEmail: 'maria@new.com', guardianPhone: '8888'
        })
      });

      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Paciente cadastrado com sucesso!');
    });
  });
});
