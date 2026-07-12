import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { db } from '../../../../../../../packages/db/db/index';
import * as jose from 'jose';

vi.mock('../../../../../../../packages/db/db/index', () => ({
  db: {
    query: {
      users: {
        findMany: vi.fn(),
      }
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn()
      }))
    })),
  }
}));

vi.mock('jose', () => ({
  jwtVerify: vi.fn()
}));

describe('Admin Dashboard API (/api/admin/dashboard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (jose.jwtVerify as any).mockResolvedValue({
      payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' }
    });
  });

  describe('GET', () => {
    describe('Caminhos de Sucesso', () => {
      it('deve retornar as estatísticas do dashboard e os psicólogos recentes', async () => {
        // Mock db.select para as 3 chamadas (profissionais, psicologosAtivos, criancas)
        const selectMock = vi.fn()
          .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ value: 10 }]) }) }) // profissionais
          .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ id: 'psi-1' }, { id: 'psi-2' }]) }) }) // psicologosAtivos
          .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([{ value: 50 }]) }) }); // criancas
        
        (db.select as any) = selectMock;

        // Mock db.query.users.findMany para psicólogos recentes
        (db.query.users.findMany as any).mockResolvedValue([
          { id: 'psi-1', name: 'Dr. Teste', email: 'teste@teko.local' }
        ]);

        const request = new Request('http://localhost/api/admin/dashboard', {
          headers: { 'Authorization': 'Bearer valid_admin_token' }
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.stats.profissionais).toBe(10);
        expect(data.data.stats.criancas).toBe(50);
        expect(data.data.recentPsychologists.length).toBe(1);
      });
    });

    describe('Caminhos Negativos', () => {
      it('deve retornar 401 Unauthorized se não enviar token', async () => {
        const request = new Request('http://localhost/api/admin/dashboard');
        const response = await GET(request);
        expect(response.status).toBe(401);
      });

      it('deve retornar 401 Unauthorized se o token for inválido', async () => {
        (jose.jwtVerify as any).mockRejectedValue(new Error('Invalid token'));
        const request = new Request('http://localhost/api/admin/dashboard', {
          headers: { 'Authorization': 'Bearer invalid_token' }
        });
        const response = await GET(request);
        expect(response.status).toBe(401);
      });

      it('deve retornar 403 Forbidden se o usuário não for ADMIN', async () => {
        (jose.jwtVerify as any).mockResolvedValue({
          payload: { sub: 'user-123', role: 'PSICOLOGO' }
        });
        const request = new Request('http://localhost/api/admin/dashboard', {
          headers: { 'Authorization': 'Bearer token_psicologo' }
        });
        const response = await GET(request);
        expect(response.status).toBe(403);
      });

      it('deve retornar 500 Internal Server Error se o banco de dados falhar', async () => {
        (db.select as any) = vi.fn().mockImplementation(() => {
          throw new Error('Erro forçado no mock do db.select');
        });
        const request = new Request('http://localhost/api/admin/dashboard', {
          headers: { 'Authorization': 'Bearer valid_admin_token' }
        });
        const response = await GET(request);
        expect(response.status).toBe(500);
      });
    });
  });
});
