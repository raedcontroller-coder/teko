/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, @next/next/no-page-custom-font */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { GET } from './route';
import { db } from '../../../../../../../../packages/db/db/index';
import { users } from '../../../../../../../../packages/db/db/schema';
import { like, eq } from 'drizzle-orm';
import * as jose from 'jose';

vi.mock('jose', () => ({
  jwtVerify: vi.fn()
}));

describe('Integração - Admin Reports Export API (/api/admin/reports/export)', () => {
  const cleanupAdminLixo = async () => {
    // Apenas criando um psi mínimo para garantir que ele exporte algo no CSV
    await db.delete(users).where(like(users.email, '%INTEG_API_CSV%'));
  };

  beforeAll(async () => {
    await cleanupAdminLixo();
    (jose.jwtVerify as any).mockResolvedValue({
      payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' }
    });

    const psi = await db.insert(users).values({
      name: 'Psi API CSV',
      email: 'psi_INTEG_API_CSV@teko.local',
      passwordHash: 'hash',
      crp: 'CRP-API-CSV',
      role: 'PSICOLOGO'
    }).returning();

    await db.insert(users).values({
      name: 'Aluno API CSV',
      email: 'aluno_INTEG_API_CSV@teko.local',
      passwordHash: 'hash',
      role: 'ALUNO',
      psicologoId: psi[0].id
    });
  });

  afterAll(async () => {
    await cleanupAdminLixo();
  });

  describe('GET', () => {
    describe('Caminhos de Sucesso', () => {
      it('deve bater na action real, compilar a string no banco e retornar um CSV HTTP válido', async () => {
        (jose.jwtVerify as any).mockResolvedValue({ payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' } });

        const request = new Request('http://localhost/api/admin/reports/export', {
          headers: { 'Authorization': 'Bearer valid_admin_token' }
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        
        expect(data.csv).toBeDefined();
        expect(data.csv).toContain('Psicólogo;Email Psicólogo;CRP');
        expect(data.csv).toContain('Psi API CSV'); // Dado persistido
      });
    });

    describe('Caminhos Negativos', () => {
      it('deve retornar 401 Unauthorized se tentar exportar CSV real sem token', async () => {
        const request = new Request('http://localhost/api/admin/reports/export');
        const response = await GET(request);
        expect(response.status).toBe(401);
      });

      it('deve retornar 401 Unauthorized se tentar exportar com token JWT corrompido', async () => {
        (jose.jwtVerify as any).mockRejectedValueOnce(new Error('Invalid token'));
        const request = new Request('http://localhost/api/admin/reports/export', {
          headers: { 'Authorization': 'Bearer token_corrompido' }
        });
        const response = await GET(request);
        expect(response.status).toBe(401);
      });

      it('deve retornar 403 Forbidden se tentar exportar CSV com token de PSICOLOGO', async () => {
        (jose.jwtVerify as any).mockResolvedValueOnce({ payload: { sub: 'psi-123', role: 'PSICOLOGO' } });
        const request = new Request('http://localhost/api/admin/reports/export', {
          headers: { 'Authorization': 'Bearer valid_psicologo_token' }
        });
        const response = await GET(request);
        expect(response.status).toBe(403);
      });
    });
  });
});

