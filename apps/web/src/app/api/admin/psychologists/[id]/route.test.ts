import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from './route';
import { db } from '../../../../../../../../packages/db/db/index';
import * as jose from 'jose';

vi.mock('../../../../../../../../packages/db/db/index', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(),
      }
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn()
      }))
    })),
  }
}));

vi.mock('jose', () => ({
  jwtVerify: vi.fn()
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(() => Promise.resolve('hashed_password_123')),
  },
  hash: vi.fn(() => Promise.resolve('hashed_password_123')),
}));

describe('Admin Psychologists ID API (/api/admin/psychologists/[id])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (jose.jwtVerify as any).mockResolvedValue({
      payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' }
    });
  });

  describe('GET', () => {
    describe('Caminhos de Sucesso', () => {
      it('deve retornar os detalhes de um psicólogo', async () => {
        (db.query.users.findFirst as any).mockResolvedValue({
          id: 'psi-1', role: 'PSICOLOGO', name: 'Dr. Teste', email: 'teste@teko.local'
        });

        const request = new Request('http://localhost/api/admin/psychologists/psi-1', {
          headers: { 'Authorization': 'Bearer valid_admin_token' }
        });
        const context = { params: Promise.resolve({ id: 'psi-1' }) };

        const response = await GET(request, context);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.name).toBe('Dr. Teste');
      });
    });

    describe('Caminhos Negativos', () => {
      it('deve retornar 401 Unauthorized se não enviar token', async () => {
        const request = new Request('http://localhost/api/admin/psychologists/psi-1');
        const context = { params: Promise.resolve({ id: 'psi-1' }) };
        const response = await GET(request, context);
        expect(response.status).toBe(401);
      });

      it('deve retornar 403 Forbidden se o usuário não for ADMIN', async () => {
        (jose.jwtVerify as any).mockResolvedValue({
          payload: { sub: 'user-123', role: 'PSICOLOGO' }
        });
        const request = new Request('http://localhost/api/admin/psychologists/psi-1', {
          headers: { 'Authorization': 'Bearer token_psicologo' }
        });
        const context = { params: Promise.resolve({ id: 'psi-1' }) };
        const response = await GET(request, context);
        expect(response.status).toBe(403);
      });

      it('deve retornar 404 Not Found se o psicólogo não existir no banco', async () => {
        (db.query.users.findFirst as any).mockResolvedValue(null);
        const request = new Request('http://localhost/api/admin/psychologists/ghost-id', {
          headers: { 'Authorization': 'Bearer valid_admin_token' }
        });
        const context = { params: Promise.resolve({ id: 'ghost-id' }) };
        const response = await GET(request, context);
        expect(response.status).toBe(404);
      });
    });
  });

  describe('PUT', () => {
    describe('Caminhos de Sucesso', () => {
      it('deve atualizar os dados básicos do psicólogo', async () => {
        // Primeira chamada (verifica se existe) retorna o usuário, segunda (emailDuplicate) retorna null
        (db.query.users.findFirst as any)
          .mockResolvedValueOnce({ id: 'psi-1', role: 'PSICOLOGO', email: 'teste@teko.local' })
          .mockResolvedValueOnce(null);

        const request = new Request('http://localhost/api/admin/psychologists/psi-1?type=data', {
          method: 'PUT',
          headers: { 
            'Authorization': 'Bearer valid_admin_token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'Nome Atualizado',
            email: 'novo@teko.local',
            crp: '222/SP'
          })
        });
        const context = { params: Promise.resolve({ id: 'psi-1' }) };

        const response = await PUT(request, context);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(db.update).toHaveBeenCalled();
      });

      it('deve atualizar a senha do psicólogo', async () => {
        (db.query.users.findFirst as any)
          .mockResolvedValueOnce({ id: 'psi-1', role: 'PSICOLOGO' });

        const request = new Request('http://localhost/api/admin/psychologists/psi-1?type=password', {
          method: 'PUT',
          headers: { 
            'Authorization': 'Bearer valid_admin_token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            password: 'novaSenha123'
          })
        });
        const context = { params: Promise.resolve({ id: 'psi-1' }) };

        const response = await PUT(request, context);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(db.update).toHaveBeenCalled();
      });
    });

    describe('Caminhos Negativos', () => {
      it('deve retornar 401 Unauthorized se não enviar token', async () => {
        const request = new Request('http://localhost/api/admin/psychologists/psi-1', { method: 'PUT' });
        const context = { params: Promise.resolve({ id: 'psi-1' }) };
        const response = await PUT(request, context);
        expect(response.status).toBe(401);
      });

      it('deve retornar 403 Forbidden se o usuário não for ADMIN', async () => {
        (jose.jwtVerify as any).mockResolvedValue({
          payload: { sub: 'user-123', role: 'PSICOLOGO' }
        });
        const request = new Request('http://localhost/api/admin/psychologists/psi-1', {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer token_psicologo', 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Teste' })
        });
        const context = { params: Promise.resolve({ id: 'psi-1' }) };
        const response = await PUT(request, context);
        expect(response.status).toBe(403);
      });

      it('deve retornar 400 Bad Request se o body estiver ausente na atualização de dados', async () => {
        const request = new Request('http://localhost/api/admin/psychologists/psi-1?type=data', {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer valid_admin_token', 'Content-Type': 'application/json' },
          body: '' // Corpo vazio
        });
        const context = { params: Promise.resolve({ id: 'psi-1' }) };
        const response = await PUT(request, context);
        expect(response.status).toBe(400);
      });

      it('deve retornar 400 Bad Request se faltar a senha na atualização de senha', async () => {
        (db.query.users.findFirst as any).mockResolvedValueOnce({ id: 'psi-1', role: 'PSICOLOGO' });

        const request = new Request('http://localhost/api/admin/psychologists/psi-1?type=password', {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer valid_admin_token', 'Content-Type': 'application/json' },
          body: JSON.stringify({ wrongField: '123' }) // Falta "password"
        });
        const context = { params: Promise.resolve({ id: 'psi-1' }) };
        const response = await PUT(request, context);
        expect(response.status).toBe(400);
      });
      
      it('deve retornar 404 Not Found se tentar atualizar psicólogo que não existe', async () => {
        // Usa mockResolvedValue para garantir sobrescrita de filas
        (db.query.users.findFirst as any).mockResolvedValue(null);

        const request = new Request('http://localhost/api/admin/psychologists/ghost-id?type=data', {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer valid_admin_token', 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Fantasma', email: 'fantasma@teko.local' })
        });
        const context = { params: Promise.resolve({ id: 'ghost-id' }) };
        const response = await PUT(request, context);
        expect(response.status).toBe(404);
      });
    });
  });

  describe('DELETE', () => {
    describe('Caminhos de Sucesso', () => {
      it('deve aplicar soft delete no psicólogo', async () => {
        (db.query.users.findFirst as any).mockResolvedValueOnce({ id: 'psi-1', role: 'PSICOLOGO' });
        
        (db.update as any).mockImplementationOnce(() => ({
          set: vi.fn().mockReturnValueOnce({
            where: vi.fn().mockResolvedValueOnce({ rowCount: 1 })
          })
        }));

        const request = new Request('http://localhost/api/admin/psychologists/psi-1', {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer valid_admin_token' }
        });
        const context = { params: Promise.resolve({ id: 'psi-1' }) };

        const response = await DELETE(request, context);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(db.update).toHaveBeenCalled();
      });
    });

    describe('Caminhos Negativos', () => {
      it('deve retornar 401 Unauthorized se não enviar token', async () => {
        const request = new Request('http://localhost/api/admin/psychologists/psi-1', { method: 'DELETE' });
        const context = { params: Promise.resolve({ id: 'psi-1' }) };
        const response = await DELETE(request, context);
        expect(response.status).toBe(401);
      });

      it('deve retornar 403 Forbidden se o usuário não for ADMIN', async () => {
        (jose.jwtVerify as any).mockResolvedValue({
          payload: { sub: 'user-123', role: 'PSICOLOGO' }
        });
        const request = new Request('http://localhost/api/admin/psychologists/psi-1', {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer token_psicologo' }
        });
        const context = { params: Promise.resolve({ id: 'psi-1' }) };
        const response = await DELETE(request, context);
        expect(response.status).toBe(403);
      });

      it('deve retornar 404 Not Found se tentar deletar psicólogo fantasma', async () => {
        (db.query.users.findFirst as any).mockResolvedValue(null);

        const request = new Request('http://localhost/api/admin/psychologists/ghost-id', {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer valid_admin_token' }
        });
        const context = { params: Promise.resolve({ id: 'ghost-id' }) };
        const response = await DELETE(request, context);
        expect(response.status).toBe(404);
      });
    });
  });
});
