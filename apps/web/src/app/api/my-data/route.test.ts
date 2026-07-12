import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from './route';

const mocks = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockUpdate: vi.fn(),
  mockSet: vi.fn(),
  mockWhere: vi.fn(),
  mockVerify: vi.fn(),
  mockCompare: vi.fn(),
  mockHash: vi.fn()
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: mocks.mockCompare,
    hash: mocks.mockHash,
  }
}));

vi.mock('jose', () => ({
  jwtVerify: mocks.mockVerify
}));

vi.mock('../../../../../../packages/db/db/schema', () => ({
  users: {
    id: 'id',
    name: 'name',
    email: 'email',
    crp: 'crp',
    clinicName: 'clinicName',
    passwordHash: 'passwordHash'
  }
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
}));

vi.mock('../../../../../../packages/db/db/index', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: mocks.mockSelect
      })
    }),
    update: () => ({
      set: () => ({
        where: mocks.mockUpdate
      })
    })
  }
}));

const getAuthHeaders = () => {
  return new Headers({
    'authorization': 'Bearer valid_token'
  });
};

describe('My Data API (/api/my-data)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockVerify.mockResolvedValue({ payload: { sub: 'psicologo_id_123' } });
  });

  describe('GET', () => {
    it('should return 404 if user is not found', async () => {
      mocks.mockSelect.mockResolvedValue([]);
      
      const req = new Request('http://localhost/api/my-data', { headers: getAuthHeaders() });
      const res = await GET(req);
      const data = await res.json();

      console.error('DEBUG ERROR:', data.error);
      expect(res.status).toBe(404);
      expect(data.error).toBe('Usuário não encontrado.');
    });

    it('should return user data successfully', async () => {
      const mockUser = { name: 'Dr. Test', email: 'dr@test.com', crp: '12345', clinicName: 'Clinic' };
      mocks.mockSelect.mockResolvedValue([mockUser]);
      
      const req = new Request('http://localhost/api/my-data', { headers: getAuthHeaders() });
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockUser);
    });
  });

  describe('PUT', () => {
    it('should update personal data successfully', async () => {
      mocks.mockSelect.mockResolvedValue([]); // No conflicting email
      mocks.mockUpdate.mockResolvedValue(true);
      
      const req = new Request('http://localhost/api/my-data?type=personal', { 
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: 'Dr. New Name', email: 'new@test.com' })
      });
      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 if updating to an existing email belonging to another user', async () => {
      mocks.mockSelect.mockResolvedValue([{ id: 'other_user_id' }]); // Conflicting email
      
      const req = new Request('http://localhost/api/my-data?type=personal', { 
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: 'Dr. New Name', email: 'existing@test.com' })
      });
      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('Este email já está em uso por outro usuário.');
    });

    it('should return 400 if changing password with incorrect current password', async () => {
      mocks.mockSelect.mockResolvedValue([{ id: 'psicologo_id_123', passwordHash: 'old_hash' }]);
      mocks.mockCompare.mockResolvedValue(false); // Wrong password
      
      const req = new Request('http://localhost/api/my-data?type=security', { 
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword: 'wrong', newPassword: 'new' })
      });
      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toBe('A senha atual está incorreta.');
    });

    it('should update password successfully', async () => {
      mocks.mockSelect.mockResolvedValue([{ id: 'psicologo_id_123', passwordHash: 'old_hash' }]);
      mocks.mockCompare.mockResolvedValue(true); // Correct password
      mocks.mockHash.mockResolvedValue('new_hash');
      mocks.mockUpdate.mockResolvedValue(true);
      
      const req = new Request('http://localhost/api/my-data?type=security', { 
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword: 'correct', newPassword: 'new' })
      });
      const res = await PUT(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('DELETE', () => {
    it('should soft delete user successfully', async () => {
      mocks.mockUpdate.mockResolvedValue(true);
      
      const req = new Request('http://localhost/api/my-data', { 
        method: 'DELETE',
        headers: getAuthHeaders() 
      });
      const res = await DELETE(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});
