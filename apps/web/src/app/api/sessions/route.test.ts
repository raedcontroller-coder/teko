import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

const mocks = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
  mockInsertValues: vi.fn(),
  mockReturning: vi.fn(),
  mockVerify: vi.fn(),
  mockEq: vi.fn(),
  mockAnd: vi.fn()
}));

vi.mock('jose', () => ({
  jwtVerify: mocks.mockVerify
}));

vi.mock('drizzle-orm', () => ({
  eq: mocks.mockEq,
  and: mocks.mockAnd
}));

vi.mock('../../../../../../packages/db/db/schema', () => ({
  users: {
    id: 'id',
    role: 'role',
    psicologoId: 'psicologoId'
  },
  games: {
    name: 'name'
  },
  gameSessions: {}
}));

vi.mock('../../../../../../packages/db/db/index', () => ({
  db: {
    query: {
      users: { findFirst: mocks.mockFindFirst },
      games: { findFirst: mocks.mockFindFirst }
    },
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

describe('Sessions API (/api/sessions)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockVerify.mockResolvedValue({ payload: { sub: 'psi_123', role: 'PSICOLOGO' } });
  });

  it('should return 401 if token is missing', async () => {
    const req = new Request('http://localhost/api/sessions', { method: 'POST' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should return 400 if required fields are missing', async () => {
    const req = new Request('http://localhost/api/sessions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ gameName: 'Test' })
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('alunoId, gameName e behaviorData são obrigatórios.');
  });

  it('should return 200 and ignore database if alunoId is anonymous', async () => {
    const req = new Request('http://localhost/api/sessions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ alunoId: 'anonymous', gameName: 'Test', behaviorData: {} })
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe('anonymous');
  });

  it('should return 403 if child does not belong to psicologo', async () => {
    mocks.mockFindFirst.mockResolvedValueOnce(null); // Child not found or not belonging

    const req = new Request('http://localhost/api/sessions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ alunoId: 'child_1', gameName: 'Test', behaviorData: {} })
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('Criança não encontrada ou não vinculada a este psicólogo.');
  });

  it('should successfully create session for psicologo', async () => {
    mocks.mockFindFirst
      .mockResolvedValueOnce({ id: 'child_1' }) // Child found
      .mockResolvedValueOnce({ id: 'game_1', name: 'Test' }); // Game found
    
    mocks.mockReturning.mockResolvedValueOnce([{ id: 'session_1' }]);

    const req = new Request('http://localhost/api/sessions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ alunoId: 'child_1', gameName: 'Test', behaviorData: { score: 10 } })
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe('session_1');
  });

  it('should successfully create session for GLOBAL_ADMIN', async () => {
    mocks.mockVerify.mockResolvedValue({ payload: { sub: 'admin_1', role: 'GLOBAL_ADMIN' } });
    
    mocks.mockFindFirst
      .mockResolvedValueOnce({ id: 'child_1' }) // Child found (bypass psicologo check)
      .mockResolvedValueOnce(null); // Game not found, creates it
    
    mocks.mockReturning
      .mockResolvedValueOnce([{ id: 'new_game' }])
      .mockResolvedValueOnce([{ id: 'session_1' }]);

    const req = new Request('http://localhost/api/sessions', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ alunoId: 'child_1', gameName: 'New Game', behaviorData: { score: 10 } })
    });
    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.id).toBe('session_1');
  });
});
