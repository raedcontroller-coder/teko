import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from './route';

const mocks = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockFindMany: vi.fn(),
  mockUpdateValues: vi.fn(),
  mockDeleteWhere: vi.fn(),
  mockReturning: vi.fn(),
  mockVerify: vi.fn(),
  mockEq: vi.fn(),
  mockAnd: vi.fn(),
  mockDesc: vi.fn()
}));

vi.mock('jose', () => ({
  jwtVerify: mocks.mockVerify
}));

vi.mock('drizzle-orm', () => ({
  eq: mocks.mockEq,
  and: mocks.mockAnd,
  desc: mocks.mockDesc
}));

vi.mock('../../../../../../../packages/db/db/schema', () => ({
  users: {
    id: 'id',
    name: 'name',
    email: 'email',
    role: 'role',
    psicologoId: 'psicologoId',
    guardianId: 'guardianId'
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

vi.mock('../../../../../../../packages/db/db/index', () => ({
  db: {
    query: {
      users: { 
        findFirst: mocks.mockFindFirst
      },
      gameSessions: { 
        findMany: mocks.mockFindMany 
      },
      games: { 
        findMany: mocks.mockFindMany 
      }
    },
    update: () => ({
      set: () => ({
        where: mocks.mockUpdateValues
      })
    }),
    delete: () => ({
      where: mocks.mockDeleteWhere
    })
  }
}));

mocks.mockUpdateValues.mockImplementation(() => ({
  returning: mocks.mockReturning
}));

mocks.mockDeleteWhere.mockImplementation(() => ({
  returning: mocks.mockReturning
}));

const getAuthHeaders = () => {
  return new Headers({
    'authorization': 'Bearer valid_token'
  });
};

const getContext = (id: string) => ({
  params: Promise.resolve({ id })
});

describe('Patient Details API (/api/patients/[id])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockVerify.mockResolvedValue({ payload: { sub: 'psi_123', role: 'PSICOLOGO' } });
  });

  describe('GET', () => {
    it('should return 404 if patient is not found', async () => {
      mocks.mockFindFirst.mockResolvedValueOnce(null);

      const req = new Request('http://localhost/api/patients/patient_1', { headers: getAuthHeaders() });
      const res = await GET(req, getContext('patient_1'));
      const data = await res.json();

      expect(res.status).toBe(404);
      expect(data.error).toBe('Paciente não encontrado.');
    });

    it('should return patient data successfully', async () => {
      mocks.mockFindFirst
        .mockResolvedValueOnce({ id: 'patient_1', name: 'João', guardianId: 'guardian_1' })
        .mockResolvedValueOnce({ id: 'guardian_1', name: 'Maria' }); // Guardian
      
      mocks.mockFindMany
        .mockResolvedValueOnce([]) // gameSessions
        .mockResolvedValueOnce([]); // games

      const req = new Request('http://localhost/api/patients/patient_1', { headers: getAuthHeaders() });
      const res = await GET(req, getContext('patient_1'));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.patient.name).toBe('João');
      expect(data.data.guardian.name).toBe('Maria');
    });
  });

  describe('PUT', () => {
    it('should return 400 if type is invalid', async () => {
      const req = new Request('http://localhost/api/patients/patient_1', { 
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({})
      });
      const res = await PUT(req, getContext('patient_1'));
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Tipo de atualização não especificado (?type=patient ou ?type=guardian).');
    });

    it('should successfully update patient', async () => {
      mocks.mockReturning.mockResolvedValueOnce([{ id: 'patient_1' }]);

      const req = new Request('http://localhost/api/patients/patient_1?type=patient', { 
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: 'João Novo', age: '11', gender: 'Masculino' })
      });
      const res = await PUT(req, getContext('patient_1'));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Dados do paciente atualizados com sucesso.');
    });

    it('should successfully update guardian', async () => {
      mocks.mockReturning.mockResolvedValueOnce([{ id: 'guardian_1' }]);

      const req = new Request('http://localhost/api/patients/guardian_1?type=guardian', { 
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: 'Maria Nova', email: 'maria@nova.com', phone: '11999999999' })
      });
      const res = await PUT(req, getContext('guardian_1'));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Dados do responsável atualizados com sucesso.');
    });

    it('should return 404 if trying to update a patient that does not belong to psicologo', async () => {
      mocks.mockReturning.mockResolvedValueOnce([]); // No rows updated

      const req = new Request('http://localhost/api/patients/patient_1?type=patient', { 
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: 'João Novo' })
      });
      const res = await PUT(req, getContext('patient_1'));
      const data = await res.json();

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE', () => {
    it('should successfully delete a patient', async () => {
      mocks.mockReturning.mockResolvedValueOnce([{ id: 'patient_1' }]);

      const req = new Request('http://localhost/api/patients/patient_1', { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const res = await DELETE(req, getContext('patient_1'));
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 404 if trying to delete a patient that does not belong to psicologo', async () => {
      mocks.mockReturning.mockResolvedValueOnce([]); // No rows deleted

      const req = new Request('http://localhost/api/patients/patient_1', { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const res = await DELETE(req, getContext('patient_1'));
      const data = await res.json();

      expect(res.status).toBe(404);
    });
  });
});
