/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, @next/next/no-page-custom-font */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import * as jose from 'jose';
import * as adminActions from '../../../../../actions/admin.ts';

vi.mock('jose', () => ({
  jwtVerify: vi.fn()
}));

vi.mock('../../../../../actions/admin.ts', () => ({
  exportAdminDadosGeradosCsvAction: vi.fn()
}));

describe('Admin Export CSV API (/api/admin/reports/export)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (jose.jwtVerify as any).mockResolvedValue({
      payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' }
    });
  });

  describe('GET', () => {
    describe('Caminhos de Sucesso', () => {
      it('deve extrair o CSV diretamente da action e retornar via JSON', async () => {
        (adminActions.exportAdminDadosGeradosCsvAction as any).mockResolvedValue({
          csv: 'Cabecalho1;Cabecalho2\nValor1;Valor2'
        });

        const request = new Request('http://localhost/api/admin/reports/export', {
          headers: { 'Authorization': 'Bearer valid_admin_token' }
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.csv).toContain('Cabecalho1;Cabecalho2');
        expect(adminActions.exportAdminDadosGeradosCsvAction).toHaveBeenCalledWith(true);
      });
    });

    describe('Caminhos Negativos', () => {
      it('deve retornar 401 Unauthorized se nÃ£o enviar token', async () => {
        const request = new Request('http://localhost/api/admin/reports/export');
        const response = await GET(request);
        expect(response.status).toBe(401);
      });

      it('deve retornar 401 Unauthorized se o token for invÃ¡lido', async () => {
        (jose.jwtVerify as any).mockRejectedValue(new Error('Invalid token'));
        const request = new Request('http://localhost/api/admin/reports/export', {
          headers: { 'Authorization': 'Bearer invalid_token' }
        });
        const response = await GET(request);
        expect(response.status).toBe(401);
      });

      it('deve retornar 403 Forbidden se o usuÃ¡rio nÃ£o for ADMIN', async () => {
        (jose.jwtVerify as any).mockResolvedValue({
          payload: { sub: 'user-123', role: 'PSICOLOGO' }
        });
        const request = new Request('http://localhost/api/admin/reports/export', {
          headers: { 'Authorization': 'Bearer token_psicologo' }
        });
        const response = await GET(request);
        expect(response.status).toBe(403);
      });

      it('deve retornar 500 Internal Server Error se a action falhar', async () => {
        (adminActions.exportAdminDadosGeradosCsvAction as any).mockRejectedValue(new Error('Erro ao exportar CSV'));
        const request = new Request('http://localhost/api/admin/reports/export', {
          headers: { 'Authorization': 'Bearer valid_admin_token' }
        });
        const response = await GET(request);
        expect(response.status).toBe(500);
      });
    });
  });
});

