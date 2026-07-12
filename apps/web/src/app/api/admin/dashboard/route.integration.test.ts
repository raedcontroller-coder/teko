import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { GET } from './route';
import { db } from '../../../../../../../packages/db/db/index';
import { users, gameSessions } from '../../../../../../../packages/db/db/schema';
import { like, inArray, eq } from 'drizzle-orm';
import * as jose from 'jose';

vi.mock('jose', () => ({
  jwtVerify: vi.fn()
}));

describe('Integração - Admin Dashboard API (/api/admin/dashboard)', () => {
  const cleanupAdminLixo = async () => {
    const lixos = await db.select().from(users).where(like(users.email, '%INTEG_API_DASHBOARD%'));
    if (lixos.length > 0) {
      const lixoIds = lixos.map(l => l.id);
      await db.delete(gameSessions).where(inArray(gameSessions.alunoId, lixoIds));
      await db.delete(users).where(inArray(users.id, lixos.filter(l => l.role === 'ALUNO').map(l => l.id)));
      await db.delete(users).where(inArray(users.id, lixoIds));
    }
  };

  beforeAll(async () => {
    await cleanupAdminLixo();
    (jose.jwtVerify as any).mockResolvedValue({
      payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' }
    });

    // Injeta um psicólogo e um aluno para garantir contagem
    const psi = await db.insert(users).values({
      name: 'Psi Dash API',
      email: 'psi_INTEG_API_DASHBOARD@teko.local',
      passwordHash: 'hash',
      role: 'PSICOLOGO'
    }).returning();

    await db.insert(users).values({
      name: 'Aluno Dash API',
      email: 'aluno_INTEG_API_DASHBOARD@teko.local',
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
      it('deve extrair as estatísticas totais diretamente do banco real', async () => {
        (jose.jwtVerify as any).mockResolvedValue({ payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' } });

        const request = new Request('http://localhost/api/admin/dashboard', {
          headers: { 'Authorization': 'Bearer valid_admin_token' }
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        
        // Valida estatísticas batendo na infraestrutura
        expect(data.data.stats.profissionais).toBeGreaterThanOrEqual(1);
        expect(data.data.stats.criancas).toBeGreaterThanOrEqual(1);
        
        // Valida psicólogos recentes trazidos do banco
        expect(data.data.recentPsychologists.length).toBeGreaterThanOrEqual(1);
        
        // O psicólogo criado deve estar na lista recente (já que é LIMIT 3 e acabamos de criar)
        const foundPsi = data.data.recentPsychologists.find((p: any) => p.email === 'psi_INTEG_API_DASHBOARD@teko.local');
        expect(foundPsi).toBeDefined();
      });
    });

    describe('Caminhos Negativos', () => {
      it('deve retornar 401 Unauthorized se tentar acessar o dashboard real sem token', async () => {
        const request = new Request('http://localhost/api/admin/dashboard');
        const response = await GET(request);
        expect(response.status).toBe(401);
      });

      it('deve retornar 401 Unauthorized se tentar acessar com token JWT corrompido', async () => {
        (jose.jwtVerify as any).mockRejectedValueOnce(new Error('Invalid token'));
        const request = new Request('http://localhost/api/admin/dashboard', {
          headers: { 'Authorization': 'Bearer token_corrompido' }
        });
        const response = await GET(request);
        expect(response.status).toBe(401);
      });

      it('deve retornar 403 Forbidden se tentar acessar dashboard com token de PSICOLOGO', async () => {
        (jose.jwtVerify as any).mockResolvedValueOnce({ payload: { sub: 'psi-123', role: 'PSICOLOGO' } });
        const request = new Request('http://localhost/api/admin/dashboard', {
          headers: { 'Authorization': 'Bearer valid_psicologo_token' }
        });
        const response = await GET(request);
        expect(response.status).toBe(403);
      });
    });
  });
});
