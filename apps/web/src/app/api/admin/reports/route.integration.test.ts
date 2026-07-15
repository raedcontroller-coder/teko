/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react/no-unescaped-entities, @next/next/no-page-custom-font */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { GET } from './route';
import { db } from '../../../../../../../packages/db/db/index';
import { users, gameSessions } from '../../../../../../../packages/db/db/schema';
import { like, inArray } from 'drizzle-orm';
import * as jose from 'jose';

vi.mock('jose', () => ({
  jwtVerify: vi.fn()
}));

describe('Integração - Admin Reports API (/api/admin/reports)', () => {
  const cleanupAdminLixo = async () => {
    const lixos = await db.select().from(users).where(like(users.email, '%INTEG_API_REPORTS%'));
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

    const psi = await db.insert(users).values({
      name: 'Psi API Reports',
      email: 'psi_INTEG_API_REPORTS@teko.local',
      passwordHash: 'hash',
      role: 'PSICOLOGO'
    }).returning();

    const guardian = await db.insert(users).values({
      name: 'Guard API Reports',
      email: 'guard_INTEG_API_REPORTS@teko.local',
      passwordHash: 'hash',
      role: 'FAMILIAR'
    }).returning();

    const aluno = await db.insert(users).values({
      name: 'Aluno API Reports',
      email: 'aluno_INTEG_API_REPORTS@teko.local',
      passwordHash: 'hash',
      role: 'ALUNO',
      psicologoId: psi[0].id,
      guardianId: guardian[0].id
    }).returning();

    const game = await db.query.games.findFirst();
    if (game) {
      await db.insert(gameSessions).values({
        alunoId: aluno[0].id,
        gameId: game.id,
        startedAt: new Date(),
        behaviorData: { vtr_ms: 888.88, variacao: 25 },
      });
    }
  });

  afterAll(async () => {
    await cleanupAdminLixo();
  });

  describe('GET', () => {
    describe('Caminhos de Sucesso', () => {
      it('deve extrair a árvore inteira de relacionamentos via API (Action real, BD real)', async () => {
        (jose.jwtVerify as any).mockResolvedValue({ payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' } });
        
        const request = new Request('http://localhost/api/admin/reports', {
          headers: { 'Authorization': 'Bearer valid_admin_token' }
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        
        const foundAluno = data.data.find((a: any) => a.alunoName === 'Aluno API Reports');
        expect(foundAluno).toBeDefined();
        expect(foundAluno.psicologoName).toBe('Psi API Reports');
        expect(foundAluno.guardianName).toBe('Guard API Reports');
        
        // As métricas devem ser extraídas, pois foram injetadas
        expect(foundAluno.vtri === '888.88' || foundAluno.qa === '25.00').toBeTruthy(); 
      });
    });

    describe('Caminhos Negativos', () => {
      it('deve retornar 401 Unauthorized se tentar acessar relatórios reais sem token', async () => {
        const request = new Request('http://localhost/api/admin/reports');
        const response = await GET(request);
        expect(response.status).toBe(401);
      });

      it('deve retornar 401 Unauthorized se tentar acessar com token JWT corrompido', async () => {
        (jose.jwtVerify as any).mockRejectedValueOnce(new Error('Invalid token'));
        const request = new Request('http://localhost/api/admin/reports', {
          headers: { 'Authorization': 'Bearer token_corrompido' }
        });
        const response = await GET(request);
        expect(response.status).toBe(401);
      });

      it('deve retornar 403 Forbidden se tentar acessar relatórios com token de PSICOLOGO', async () => {
        (jose.jwtVerify as any).mockResolvedValueOnce({ payload: { sub: 'psi-123', role: 'PSICOLOGO' } });
        const request = new Request('http://localhost/api/admin/reports', {
          headers: { 'Authorization': 'Bearer valid_psicologo_token' }
        });
        const response = await GET(request);
        expect(response.status).toBe(403);
      });
    });
  });
});

