/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { createPatientAction, getPatientsAction, getPatientByIdAction, deletePatientAction, updatePatientAction } from './patients';
import { publicRegisterAction } from './auth';
import { db } from '../../../../packages/db/db/index';
import { users } from '../../../../packages/db/db/schema';
import { eq, like, inArray, and } from 'drizzle-orm';
import * as auth from './auth';
import { cookies } from 'next/headers';

// Mock NextJS e Auth de Sessão para simular que o Psicólogo de Teste está logado
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('./auth', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as any),
    getSession: vi.fn(), // Vamos dinamicamente alterar esse mock nos testes
  };
});

// Mockamos os cookies apenas para silenciar o erro do Next.js quando o publicRegisterAction roda
vi.mock('next/headers', () => {
  const mockCookies = { set: vi.fn(), get: vi.fn(), delete: vi.fn() };
  return { cookies: vi.fn(() => Promise.resolve(mockCookies)) };
});

describe('Integration Tests (DB Real) - Pacientes', () => {
  const PSI_EMAIL = 'integration_psi_patients@teko.local';
  const GUARDIAN_EMAIL = 'integration_guardian@teko.local';
  let psiId = '';
  let patientId = '';

  const cleanupLixo = async () => {
    // Para evitar erro de Foreign Key deletando lixo real sem querer, 
    // nós encontramos o PSI de integração e deletamos somente a árvore dele.
    const psi = await db.query.users.findFirst({ where: eq(users.email, PSI_EMAIL) });
    if (psi) {
      // Deleta os alunos que pertencem especificamente a esse Psicólogo
      await db.delete(users).where(and(eq(users.role, 'ALUNO'), eq(users.psicologoId, psi.id)));
      // Deleta o responsável de teste
      await db.delete(users).where(eq(users.email, GUARDIAN_EMAIL));
      await db.delete(users).where(eq(users.email, 'novo_guardian@teko.local')); // Cleanup extra de segurança
      // Deleta o próprio psicólogo
      await db.delete(users).where(eq(users.id, psi.id));
    }
    // Limpeza de segurança extra para casos onde a inserção falhou pela metade
    await db.delete(users).where(eq(users.email, PSI_EMAIL));
    await db.delete(users).where(eq(users.email, GUARDIAN_EMAIL));
    await db.delete(users).where(eq(users.email, 'novo_guardian@teko.local'));
  };

  beforeAll(async () => {
    await cleanupLixo();

    // SETUP DE INTEGRAÇÃO: Criar um psicólogo no banco real para hospedar os testes
    const formData = new FormData();
    formData.append('full_name', '[TESTE] Psicólogo Clínico');
    formData.append('email', PSI_EMAIL);
    formData.append('password', 'senha123');
    formData.append('confirm_password', 'senha123');

    await publicRegisterAction(formData);

    const psi = await db.query.users.findFirst({ where: eq(users.email, PSI_EMAIL) });
    if (psi) {
      psiId = psi.id;
      // Injetamos a sessão do nosso Psicólogo recém-criado na base real!
      (auth.getSession as any).mockResolvedValue({ sub: psiId, role: 'PSICOLOGO' });
    }
  });

  afterAll(async () => {
    await cleanupLixo(); // O Rollback Mestre! Todo o lixo sai do banco.
  });

  it('deve inserir uma nova criança e um responsável associados ao psicólogo', async () => {
    const formData = new FormData();
    formData.append('name', '[TESTE] Criança Paciente');
    formData.append('age', '7');
    formData.append('gender', 'M');
    formData.append('guardianName', '[TESTE] Responsável Criança');
    formData.append('guardianEmail', GUARDIAN_EMAIL);
    formData.append('guardianPhone', '11999999998');

    const result = await createPatientAction(formData);
    expect(result).toEqual({ success: true });

    // Verificar se no Banco de Dados Real as FKs (Foreign Keys) foram montadas perfeitamente
    const child = await db.query.users.findFirst({
      where: and(eq(users.role, 'ALUNO'), eq(users.name, '[TESTE] Criança Paciente'))
    });

    expect(child).toBeDefined();
    expect(child?.psicologoId).toBe(psiId); // Vinculado ao Psicólogo certo

    const guardian = await db.query.users.findFirst({
      where: eq(users.email, GUARDIAN_EMAIL)
    });

    expect(guardian).toBeDefined();
    expect(child?.guardianId).toBe(guardian?.id); // A Criança vinculou perfeitamente ao familiar no DB

    if (child) patientId = child.id;
  });

  it('deve listar apenas as crianças do psicólogo de integração', async () => {
    const result = await getPatientsAction();
    
    // Como acabou de criar 1, deve ter 1 na lista.
    expect(result.data).toBeDefined();
    expect(result.data?.length).toBeGreaterThanOrEqual(1);
    
    const foundChild = result.data?.find(p => p.name === '[TESTE] Criança Paciente');
    expect(foundChild).toBeDefined();
  });

  it('deve buscar os detalhes completos de uma criança pelo banco', async () => {
    const result = await getPatientByIdAction(patientId);
    
    expect(result.data).toBeDefined();
    expect(result.data?.patient.id).toBe(patientId);
    expect(result.data?.guardian?.email).toBe(GUARDIAN_EMAIL);
    expect(result.data?.sessions).toBeDefined(); // Retorna o array vazio pois não criamos jogos
  });

  it('deve atualizar os dados da criança no banco de dados', async () => {
    const payload = {
      name: '[TESTE] Criança Atualizada',
      age: '8',
      gender: 'F'
    };

    const result = await updatePatientAction(patientId, payload);
    expect(result).toEqual({ success: true });

    const updatedChild = await db.query.users.findFirst({
      where: eq(users.id, patientId)
    });

    expect(updatedChild?.name).toBe('[TESTE] Criança Atualizada');
    expect(updatedChild?.age).toBe('8');
    expect(updatedChild?.gender).toBe('F');
  });

  it('deve deletar a criança permanentemente do banco', async () => {
    const result = await deletePatientAction(patientId);
    expect(result).toEqual({ success: true });

    // Verificar se evaporou do DB
    const child = await db.query.users.findFirst({
      where: eq(users.id, patientId)
    });

    expect(child).toBeUndefined(); // Banco retornou Vazio
  });

  it('deve bloquear a criação de paciente caso o e-mail do responsável já exista no banco real', async () => {
    // O GUARDIAN_EMAIL ainda existe no banco mesmo após a criança ser deletada (o que é o correto no BD)
    const formData = new FormData();
    formData.append('name', '[TESTE] Criança Duplicada');
    formData.append('age', '7');
    formData.append('gender', 'M');
    formData.append('guardianName', 'Responsável Dois');
    formData.append('guardianEmail', GUARDIAN_EMAIL); // O mesmo e-mail já existente
    formData.append('guardianPhone', '11000000000'); // Telefone diferente

    const result = await createPatientAction(formData);

    expect(result).toEqual({ error: 'Este e-mail já está cadastrado com outro número de telefone. Por favor, verifique os dados.' });
  });

  it('deve bloquear a criação de paciente caso o telefone do responsável já exista no banco real', async () => {
    const formData = new FormData();
    formData.append('name', '[TESTE] Criança Telefone Duplicado');
    formData.append('age', '7');
    formData.append('gender', 'M');
    formData.append('guardianName', 'Responsável Dois');
    formData.append('guardianEmail', 'novo_guardian@teko.local'); // Email novo
    formData.append('guardianPhone', '11999999998'); // O telefone exato do primeiro teste

    const result = await createPatientAction(formData);

    expect(result).toEqual({ error: 'Este telefone já está cadastrado com outro e-mail. Por favor, verifique os dados.' });
  });

  it('deve retornar erro ao buscar um paciente inexistente (fantasma) no banco real', async () => {
    // Usamos um formato UUID válido para não estourar erro de sintaxe 22P02 no PostgreSQL
    const result = await getPatientByIdAction('11111111-1111-1111-1111-111111111111');
    expect(result).toEqual({ error: 'Paciente não encontrado.' });
  });
});
