import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { GET, POST } from './route';
import { db } from '../../../../../../../packages/db/db/index';
import { users, gameSessions } from '../../../../../../../packages/db/db/schema';
import { like, inArray, eq } from 'drizzle-orm';
import * as jose from 'jose';

vi.mock('jose', () => ({
  jwtVerify: vi.fn()
}));

describe('Integração - Admin Psychologists API (/api/admin/psychologists)', () => {
  const cleanupAdminLixo = async () => {
    const lixos = await db.select().from(users).where(like(users.email, '%INTEG_API_PSYCHO%'));
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

    // Injeta um psicólogo, um aluno e uma sessão para garantir contagem completa
    const psi = await db.insert(users).values({
      name: 'Psi Route API',
      email: 'psi_INTEG_API_PSYCHO@teko.local',
      passwordHash: 'hash',
      role: 'PSICOLOGO'
    }).returning();

    const aluno = await db.insert(users).values({
      name: 'Aluno Route API',
      email: 'aluno_INTEG_API_PSYCHO@teko.local',
      passwordHash: 'hash',
      role: 'ALUNO',
      psicologoId: psi[0].id
    }).returning();

    const game = await db.query.games.findFirst();
    if (game) {
      await db.insert(gameSessions).values({
        alunoId: aluno[0].id,
        gameId: game.id,
        startedAt: new Date(),
        behaviorData: {},
      });
    }
  });

  afterAll(async () => {
    await cleanupAdminLixo();
  });

  describe('GET', () => {
    describe('Caminhos de Sucesso', () => {
      it('deve listar profissionais e puxar contagens de alunos e sessões através dos JOINs reais', async () => {
        (jose.jwtVerify as any).mockResolvedValue({ payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' } });

        const request = new Request('http://localhost/api/admin/psychologists', {
          headers: { 'Authorization': 'Bearer valid_admin_token' }
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        
        const foundPsi = data.data.find((p: any) => p.email === 'psi_INTEG_API_PSYCHO@teko.local');
        expect(foundPsi).toBeDefined();
        expect(foundPsi.childrenCount).toBeGreaterThanOrEqual(1);
        expect(foundPsi.sessionsCount).toBeGreaterThanOrEqual(1);
      });
    });

    describe('Caminhos Negativos', () => {
      it('deve retornar 401 Unauthorized se tentar listar sem token', async () => {
        const request = new Request('http://localhost/api/admin/psychologists');
        const response = await GET(request);
        expect(response.status).toBe(401);
      });

      it('deve retornar 403 Forbidden se tentar listar com token de PSICOLOGO', async () => {
        (jose.jwtVerify as any).mockResolvedValueOnce({ payload: { sub: 'psi-123', role: 'PSICOLOGO' } });
        const request = new Request('http://localhost/api/admin/psychologists', {
          headers: { 'Authorization': 'Bearer valid_psicologo_token' }
        });
        const response = await GET(request);
        expect(response.status).toBe(403);
      });
    });
  });

  describe('POST', () => {
    describe('Caminhos de Sucesso', () => {
      it('deve registrar e hash a senha fisicamente no banco pela API', async () => {
        (jose.jwtVerify as any).mockResolvedValue({ payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' } });

        const request = new Request('http://localhost/api/admin/psychologists', {
          method: 'POST',
          headers: { 
            'Authorization': 'Bearer valid_admin_token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'Novo Psi Criado API',
            email: 'novo_criado_INTEG_API_PSYCHO@teko.local',
            password: 'senhaSeguraAPI123',
            crp: 'CRP-API-123',
            clinicName: 'Clínica Nova API'
          })
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        const dbPsi = await db.query.users.findFirst({
          where: eq(users.email, 'novo_criado_INTEG_API_PSYCHO@teko.local')
        });
        expect(dbPsi).toBeDefined();
        expect(dbPsi?.name).toBe('Novo Psi Criado API');
        expect(dbPsi?.passwordHash).not.toBe('senhaSeguraAPI123');
      });
    });

    describe('Caminhos Negativos', () => {
      it('deve retornar 401 Unauthorized se tentar criar sem token', async () => {
        const request = new Request('http://localhost/api/admin/psychologists', { method: 'POST' });
        const response = await POST(request);
        expect(response.status).toBe(401);
      });

      it('deve retornar 400 Bad Request se o corpo da requisição estiver vazio', async () => {
        (jose.jwtVerify as any).mockResolvedValue({ payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' } });
        const request = new Request('http://localhost/api/admin/psychologists', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer valid_admin_token', 'Content-Type': 'application/json' },
          body: ''
        });
        const response = await POST(request);
        expect(response.status).toBe(400);
      });

      it('deve retornar 400 Bad Request se houver Conflito de E-mail físico no BD', async () => {
        (jose.jwtVerify as any).mockResolvedValue({ payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' } });
        // Tentar criar com o e-mail que já foi injetado no beforeAll (psi_INTEG_API_PSYCHO@teko.local)
        const request = new Request('http://localhost/api/admin/psychologists', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer valid_admin_token', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Cópia Email',
            email: 'psi_INTEG_API_PSYCHO@teko.local',
            password: 'senha',
            crp: 'CRP-UNICO-A',
          })
        });
        const response = await POST(request);
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('já está em uso');
      });

      it('deve retornar 400 Bad Request se houver Conflito de CRP físico no BD', async () => {
        (jose.jwtVerify as any).mockResolvedValue({ payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' } });
        
        // Insere primeiro CRP
        await db.insert(users).values({
          name: 'Com CRP',
          email: 'crp1_INTEG_API_PSYCHO@teko.local',
          passwordHash: 'hash',
          role: 'PSICOLOGO',
          crp: 'MEU-CRP-UNICO'
        });

        // Tenta criar outro com o mesmo CRP
        const request = new Request('http://localhost/api/admin/psychologists', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer valid_admin_token', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Ladrão CRP',
            email: 'ladrao_INTEG_API_PSYCHO@teko.local',
            password: 'senha',
            crp: 'MEU-CRP-UNICO',
          })
        });
        const response = await POST(request);
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('já está cadastrado');
      });
    });
  });
});
