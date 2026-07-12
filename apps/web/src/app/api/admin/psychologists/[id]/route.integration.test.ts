import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { GET, PUT, DELETE } from './route';
import { db } from '../../../../../../../../packages/db/db/index';
import { users } from '../../../../../../../../packages/db/db/schema';
import { like, eq } from 'drizzle-orm';
import * as jose from 'jose';

vi.mock('jose', () => ({
  jwtVerify: vi.fn()
}));

describe('Integração - Admin Psychologists ID API (/api/admin/psychologists/[id])', () => {
  let psiId = '';

  const cleanupAdminLixo = async () => {
    await db.delete(users).where(like(users.email, '%INTEG_API_ID%'));
  };

  beforeAll(async () => {
    await cleanupAdminLixo();
    (jose.jwtVerify as any).mockResolvedValue({
      payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' }
    });

    const psi = await db.insert(users).values({
      name: 'Psi API ID',
      email: 'psi_INTEG_API_ID@teko.local',
      passwordHash: 'hash',
      crp: 'CRP-API-ID',
      clinicName: 'Clínica API ID',
      role: 'PSICOLOGO'
    }).returning();
    psiId = psi[0].id;
  });

  afterAll(async () => {
    await cleanupAdminLixo();
  });

  describe('GET', () => {
    describe('Caminhos de Sucesso', () => {
      it('deve buscar o psicólogo perfeitamente pelo ID no banco', async () => {
        (jose.jwtVerify as any).mockResolvedValue({ payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' } });
        const request = new Request(`http://localhost/api/admin/psychologists/${psiId}`, {
          headers: { 'Authorization': 'Bearer valid_admin_token' }
        });
        const context = { params: Promise.resolve({ id: psiId }) };

        const response = await GET(request, context);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.name).toBe('Psi API ID');
      });
    });

    describe('Caminhos Negativos', () => {
      it('deve retornar 401 Unauthorized se tentar buscar sem token', async () => {
        const request = new Request(`http://localhost/api/admin/psychologists/${psiId}`);
        const context = { params: Promise.resolve({ id: psiId }) };
        const response = await GET(request, context);
        expect(response.status).toBe(401);
      });

      it('deve retornar 404 Not Found se pesquisar por um UUID fantasma', async () => {
        (jose.jwtVerify as any).mockResolvedValue({ payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' } });
        const ghostId = '123e4567-e89b-12d3-a456-426614174000'; // UUID fake
        const request = new Request(`http://localhost/api/admin/psychologists/${ghostId}`, {
          headers: { 'Authorization': 'Bearer valid_admin_token' }
        });
        const context = { params: Promise.resolve({ id: ghostId }) };
        const response = await GET(request, context);
        expect(response.status).toBe(404);
      });
    });
  });

  describe('PUT', () => {
    describe('Caminhos de Sucesso', () => {
      it('deve fazer um UPDATE real nos dados básicos do psicólogo', async () => {
        (jose.jwtVerify as any).mockResolvedValue({ payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' } });
        const request = new Request(`http://localhost/api/admin/psychologists/${psiId}?type=data`, {
          method: 'PUT',
          headers: { 
            'Authorization': 'Bearer valid_admin_token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: 'Nome Atualizado API ID',
            email: 'novo_psi_INTEG_API_ID@teko.local',
            crp: 'CRP-NOVO-API'
          })
        });
        const context = { params: Promise.resolve({ id: psiId }) };

        const response = await PUT(request, context);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        const dbPsi = await db.query.users.findFirst({ where: eq(users.id, psiId) });
        expect(dbPsi?.name).toBe('Nome Atualizado API ID');
        expect(dbPsi?.email).toBe('novo_psi_INTEG_API_ID@teko.local');
      });

      it('deve fazer um UPDATE real na senha do psicólogo, com hash físico', async () => {
        (jose.jwtVerify as any).mockResolvedValue({ payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' } });
        const request = new Request(`http://localhost/api/admin/psychologists/${psiId}?type=password`, {
          method: 'PUT',
          headers: { 
            'Authorization': 'Bearer valid_admin_token',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            password: 'novaSenhaSegura456'
          })
        });
        const context = { params: Promise.resolve({ id: psiId }) };

        const response = await PUT(request, context);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        const dbPsi = await db.query.users.findFirst({ where: eq(users.id, psiId) });
        expect(dbPsi?.passwordHash).not.toBe('hash');
      });
    });

    describe('Caminhos Negativos', () => {
      it('deve retornar 404 Not Found se tentar atualizar um UUID fantasma', async () => {
        (jose.jwtVerify as any).mockResolvedValue({ payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' } });
        const ghostId = '123e4567-e89b-12d3-a456-426614174000';
        const request = new Request(`http://localhost/api/admin/psychologists/${ghostId}?type=data`, {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer valid_admin_token', 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'F', email: 'f@teko.local' })
        });
        const context = { params: Promise.resolve({ id: ghostId }) };
        const response = await PUT(request, context);
        expect(response.status).toBe(404);
      });

      it('deve retornar 400 Bad Request se tentar atualizar o e-mail para um já existente (Roubo de Credencial)', async () => {
        (jose.jwtVerify as any).mockResolvedValue({ payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' } });
        
        // Criar um usuário 2
        const psi2 = await db.insert(users).values({
          name: 'Psi 2', email: 'psi2_INTEG_API_ID@teko.local', passwordHash: 'hash', role: 'PSICOLOGO'
        }).returning();

        // Tentar alterar o psiId para ter o email do psi2
        const request = new Request(`http://localhost/api/admin/psychologists/${psiId}?type=data`, {
          method: 'PUT',
          headers: { 'Authorization': 'Bearer valid_admin_token', 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Nome', email: 'psi2_INTEG_API_ID@teko.local' })
        });
        const context = { params: Promise.resolve({ id: psiId }) };
        const response = await PUT(request, context);
        expect(response.status).toBe(400);
      });
    });
  });

  describe('DELETE', () => {
    describe('Caminhos de Sucesso', () => {
      it('deve preencher o deletedAt apagando logicamente na base', async () => {
        (jose.jwtVerify as any).mockResolvedValue({ payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' } });
        const request = new Request(`http://localhost/api/admin/psychologists/${psiId}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer valid_admin_token' }
        });
        const context = { params: Promise.resolve({ id: psiId }) };

        const response = await DELETE(request, context);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);

        const dbPsi = await db.query.users.findFirst({ where: eq(users.id, psiId) });
        expect(dbPsi?.deletedAt).not.toBeNull();
      });
    });

    describe('Caminhos Negativos', () => {
      it('deve retornar 404 Not Found se tentar aplicar soft delete em um UUID fantasma', async () => {
        (jose.jwtVerify as any).mockResolvedValue({ payload: { sub: 'admin-123', role: 'GLOBAL_ADMIN' } });
        const ghostId = '123e4567-e89b-12d3-a456-426614174000';
        const request = new Request(`http://localhost/api/admin/psychologists/${ghostId}`, {
          method: 'DELETE',
          headers: { 'Authorization': 'Bearer valid_admin_token' }
        });
        const context = { params: Promise.resolve({ id: ghostId }) };
        const response = await DELETE(request, context);
        expect(response.status).toBe(404);
      });
    });
  });
});
