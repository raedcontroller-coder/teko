/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, @next/next/no-page-custom-font */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import * as jose from 'jose';
import * as adminActions from '../../../../actions/admin.ts';

vi.mock('jose', () => ({
  jwtVerify: vi.fn()
}));

vi.mock('../../../../actions/admin.ts', () => ({
  getAdminDadosGeradosAction: vi.fn()
}));

describe('Admin Reports API (/api/admin/reports)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (jose.jwtVerify as any).mockResolvedValue({
      payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' }
    });
  });

  describe('GET', () => {
    describe('Caminhos de Sucesso', () => {
      it('deve extrair a lista formatada diretamente da action e retornar via JSON', async () => {
        (adminActions.getAdminDadosGeradosAction as any).mockResolvedValue({
          data: [{ id: 'aluno-1', alunoName: 'Criança', vtri: '1250.50' }]
        });

        const request = new Request('http://localhost/api/admin/reports', {
          headers: { 'Authorization': 'Bearer valid_admin_token' }
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.length).toBe(1);
        expect(data.data[0].alunoName).toBe('Criança');
        expect(adminActions.getAdminDadosGeradosAction).toHaveBeenCalledWith(true);
      });
    });

    describe('Caminhos Negativos', () => {
      it('deve retornar 401 Unauthorized se não enviar token', async () => {
        const request = new Request('http://localhost/api/admin/reports');
        const response = await GET(request);
        expect(response.status).toBe(401);
      });

      it('deve retornar 401 Unauthorized se o token for inválido', async () => {
        (jose.jwtVerify as any).mockRejectedValue(new Error('Invalid token'));
        const request = new Request('http://localhost/api/admin/reports', {
          headers: { 'Authorization': 'Bearer invalid_token' }
        });
        const response = await GET(request);
        expect(response.status).toBe(401);
      });

      it('deve retornar 403 Forbidden se o usuário não for ADMIN', async () => {
        (jose.jwtVerify as any).mockResolvedValue({
          payload: { sub: 'user-123', role: 'PSICOLOGO' } // Role errada
        });
        const request = new Request('http://localhost/api/admin/reports', {
          headers: { 'Authorization': 'Bearer token_psicologo' }
        });
        const response = await GET(request);
        expect(response.status).toBe(403);
      });

      it('deve retornar 500 Internal Server Error se a action falhar', async () => {
        (adminActions.getAdminDadosGeradosAction as any).mockRejectedValue(new Error('Erro de banco de dados mockado'));
        const request = new Request('http://localhost/api/admin/reports', {
          headers: { 'Authorization': 'Bearer valid_admin_token' }
        });
        const response = await GET(request);
        expect(response.status).toBe(500);
      });
    });
  });
});

