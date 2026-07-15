/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { db } from '../../../../../../../packages/db/db/index';
import * as jose from 'jose';

vi.mock('../../../../../../../packages/db/db/index', () => ({
  db: {
    query: {
      users: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      }
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn()
        })),
        where: vi.fn()
      }))
    })),
    insert: vi.fn(() => ({
      values: vi.fn()
    }))
  }
}));

vi.mock('jose', () => ({
  jwtVerify: vi.fn()
}));

// Mock bcryptjs internally used in the route
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(() => Promise.resolve('hashed_password_123')),
  }
}));

describe('Admin Psychologists API (/api/admin/psychologists)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (jose.jwtVerify as any).mockResolvedValue({
      payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' }
    });
  });

  describe('GET', () => {
    describe('Caminhos de Sucesso', () => {
      it('deve listar todos os psicólogos e agregar as métricas corretamente', async () => {
        (db.query.users.findMany as any).mockResolvedValue([
          { id: 'psi-1', name: 'Dr. API Test', email: 'api@teko.local', crp: '111', clinicName: 'API Clinic', createdAt: new Date() }
        ]);

        const selectMock = vi.fn()
          .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ value: 2 }]) }) }) // resultChildren
          .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ innerJoin: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ value: 10 }]) }) }) }); // resultSessions
        
        (db.select as any) = selectMock;

        const request = new Request('http://localhost/api/admin/psychologists', {
          headers: { 'Authorization': 'Bearer valid_admin_token' }
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.length).toBe(1);
        expect(data.data[0].name).toBe('Dr. API Test');
        expect(data.data[0].childrenCount).toBe(2);
        expect(data.data[0].sessionsCount).toBe(10);
      });
    });

    describe('Caminhos Negativos', () => {
      it('deve retornar 401 Unauthorized se não enviar token', async () => {
        const request = new Request('http://localhost/api/admin/psychologists');
        const response = await GET(request);
        expect(response.status).toBe(401);
      });

      it('deve retornar 403 Forbidden se o usuário não for ADMIN', async () => {
        (jose.jwtVerify as any).mockResolvedValue({
          payload: { sub: 'user-123', role: 'PSICOLOGO' }
        });
        const request = new Request('http://localhost/api/admin/psychologists', {
          headers: { 'Authorization': 'Bearer token_psicologo' }
        });
        const response = await GET(request);
        expect(response.status).toBe(403);
      });
    });
  });

  describe('POST', () => {
    describe('Caminhos de Sucesso', () => {
      it('deve registrar um novo psicólogo via API', async () => {
        (db.query.users.findFirst as any).mockResolvedValue(null); // E-mail não existe, CRP não existe

        const request = new Request('http://localhost/api/admin/psychologists', {
          method: 'POST',
          headers: { 
            'Authorization': 'Bearer valid_admin_token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'Novo Psi API',
            email: 'novoapi@teko.local',
            password: 'senhaSegura123',
            crp: '333/SP',
            clinicName: 'Clínica Nova API'
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(db.insert).toHaveBeenCalled();
      });
    });

    describe('Caminhos Negativos', () => {
      it('deve retornar 401 Unauthorized se não enviar token', async () => {
        const request = new Request('http://localhost/api/admin/psychologists', { method: 'POST' });
        const response = await POST(request);
        expect(response.status).toBe(401);
      });

      it('deve retornar 403 Forbidden se o usuário não for ADMIN', async () => {
        (jose.jwtVerify as any).mockResolvedValue({
          payload: { sub: 'user-123', role: 'PSICOLOGO' }
        });
        const request = new Request('http://localhost/api/admin/psychologists', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer token_psicologo', 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Teste' })
        });
        const response = await POST(request);
        expect(response.status).toBe(403);
      });

      it('deve retornar 400 Bad Request se o corpo JSON estiver ausente ou inválido', async () => {
        const request = new Request('http://localhost/api/admin/psychologists', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer valid_admin_token', 'Content-Type': 'application/json' },
          body: '' // Corpo vazio
        });
        const response = await POST(request);
        expect(response.status).toBe(400);
      });

      it('deve retornar 400 Bad Request se faltarem campos obrigatórios', async () => {
        const request = new Request('http://localhost/api/admin/psychologists', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer valid_admin_token', 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Teste' }) // Faltam email, password, crp
        });
        const response = await POST(request);
        expect(response.status).toBe(400);
      });

      it('deve retornar 400 Bad Request se o email for inválido', async () => {
        const request = new Request('http://localhost/api/admin/psychologists', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer valid_admin_token', 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Teste', email: 'email-invalido', password: '123', crp: '123' })
        });
        const response = await POST(request);
        expect(response.status).toBe(400);
      });

      it('deve retornar 500 Internal Server Error se o banco falhar ao inserir', async () => {
        (db.query.users.findFirst as any).mockResolvedValue(null);
        (db.insert as any).mockImplementation(() => {
          throw new Error('Erro de inserção mockado');
        });

        const request = new Request('http://localhost/api/admin/psychologists', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer valid_admin_token', 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Teste', email: 'teste@email.com', password: '123', crp: '123' })
        });
        const response = await POST(request);
        expect(response.status).toBe(500);
      });
    });
  });
});
