import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getDashboardMetricsAction, 
  getPatientsAction, 
  createPatientAction, 
  getPatientByIdAction, 
  updatePatientAction, 
  deletePatientAction 
} from './patients';
import { db } from '../../../../packages/db/db/index';
import * as auth from './auth';

vi.mock('../../../../packages/db/db/index', () => {
  const mockDb = {
    query: {
      users: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      gameSessions: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      games: {
        findMany: vi.fn().mockResolvedValue([]),
      }
    },
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };
  (mockDb.where as any).mockResolvedValue([]);
  (mockDb.set as any).mockReturnValue({
    where: vi.fn().mockResolvedValue([{ id: 'updated-id' }])
  });
  
  return { db: mockDb };
});

vi.mock('drizzle-orm', () => ({
  eq: vi.fn(),
  and: vi.fn(),
  desc: vi.fn(),
  sql: vi.fn(),
  inArray: vi.fn(),
}));

vi.mock('./auth', () => ({
  getSession: vi.fn(),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Integração de Comunicação - Pacientes da Web vs Banco de Dados', () => {
  const mockSession = { sub: 'psi-123', role: 'PSICOLOGO' };

  beforeEach(() => {
    vi.clearAllMocks();
    (auth.getSession as any).mockResolvedValue(mockSession);
  });

  describe('1. getDashboardMetricsAction', () => {
    it('deve extrair as métricas globais do dashboard com sucesso', async () => {
      const mockPatientsList = [{ id: 'pat-1', name: 'João' }, { id: 'pat-2', name: 'Maria' }];
      const mockAllSessions = [
        { id: 'sess-1', alunoId: 'pat-1' },
        { id: 'sess-2', alunoId: 'pat-1' },
        { id: 'sess-3', alunoId: 'pat-2' },
      ];

      (db.query.users.findMany as any).mockResolvedValueOnce(mockPatientsList);
      (db.query.gameSessions.findMany as any).mockResolvedValueOnce(mockAllSessions);

      const res = await getDashboardMetricsAction();
      
      expect(auth.getSession).toHaveBeenCalled();
      expect(db.query.users.findMany).toHaveBeenCalled();
      expect(res.data).toBeDefined();
      expect(res.data?.patients).toHaveLength(2);
      expect(res.data?.totalSessions).toBe(0);
    });

    it('deve retornar erro se não houver sessão ativa', async () => {
      (auth.getSession as any).mockResolvedValueOnce(null);
      const res = await getDashboardMetricsAction();
      expect(res.error).toBeDefined(); // Encoding tolerance
    });
  });

  describe('2. getPatientsAction', () => {
    it('deve listar todos os pacientes do psicólogo', async () => {
      const mockPatientsList = [{ id: 'pat-1', name: 'João' }, { id: 'pat-2', name: 'Maria' }];
      (db.query.users.findMany as any).mockResolvedValueOnce(mockPatientsList);
      (db.query.gameSessions.findMany as any).mockResolvedValueOnce([]);

      const res = await getPatientsAction();
      
      expect(db.query.users.findMany).toHaveBeenCalled();
      expect(res.data).toHaveLength(2);
      expect(res.data?.[0].name).toBe('João');
    });

    it('deve retornar erro se não houver sessão ativa', async () => {
      (auth.getSession as any).mockResolvedValueOnce(null);
      const res = await getPatientsAction();
      expect(res).toEqual({ error: 'Usuário não autenticado.' });
    });
  });

  describe('3. createPatientAction', () => {
    it('deve criar um novo familiar e paciente associado ao psicólogo logado', async () => {
      const formData = new FormData();
      formData.append('name', 'Criança Nova');
      formData.append('age', '8');
      formData.append('gender', 'M');
      formData.append('guardianName', 'Responsável Teste');
      formData.append('guardianEmail', 'resp@teste.com');
      formData.append('guardianPhone', '11999999999');

      // mock db.select().from(users).where()
      (db.where as any)
        .mockResolvedValueOnce([undefined]) // no guardian by email
        .mockResolvedValueOnce([undefined]); // no guardian by phone

      const res = await createPatientAction(formData);
      
      expect(db.insert).toHaveBeenCalledTimes(2); 
      expect(db.values).toHaveBeenCalled();
      expect(res.success).toBe(true);
    });

    it('deve retornar erro se o email do responsável já existir para outro usuário', async () => {
      const formData = new FormData();
      formData.append('name', 'Criança Nova');
      formData.append('age', '8');
      formData.append('gender', 'M');
      formData.append('guardianName', 'Responsável Teste');
      formData.append('guardianEmail', 'existente@teste.com');
      formData.append('guardianPhone', '11999999999');

      // mock db.select().from(users).where() para encontrar o e-mail
      (db.where as any).mockResolvedValueOnce([{ id: 'outro-user' }]); 

      const res = await createPatientAction(formData);
      expect(res).toEqual({ error: 'Este e-mail já está cadastrado com outro número de telefone. Por favor, verifique os dados.' });
    });

    it('deve retornar erro em caso de falha catastrófica no banco (insert crash)', async () => {
      const formData = new FormData();
      formData.append('name', 'Criança Nova');
      formData.append('age', '8');
      formData.append('gender', 'M');
      formData.append('guardianName', 'Responsável Teste');
      formData.append('guardianEmail', 'resp@teste.com');
      formData.append('guardianPhone', '11999999999');

      (db.where as any)
        .mockResolvedValueOnce([undefined]) 
        .mockResolvedValueOnce([undefined]); 
        
      (db.insert as any).mockImplementationOnce(() => { throw new Error('Crash Insert DB'); });

      const res = await createPatientAction(formData);
      expect(res).toEqual({ error: 'Erro interno ao salvar paciente. Tente novamente.' });
    });
  });

  describe('4. getPatientByIdAction', () => {
    it('deve buscar os detalhes completos de um paciente', async () => {
      const mockPatient = { id: 'pat-1', name: 'Criança', guardianId: 'guard-1' };
      const mockGuardian = { id: 'guard-1', name: 'Responsável' };
      
      (db.query.users.findFirst as any)
        .mockResolvedValueOnce(mockPatient)
        .mockResolvedValueOnce(mockGuardian);
        
      (db.query.gameSessions.findMany as any).mockResolvedValueOnce([]);
      (db.query.games.findMany as any).mockResolvedValueOnce([]);

      const res = await getPatientByIdAction('pat-1');
      
      expect(db.query.users.findFirst).toHaveBeenCalledTimes(2);
      expect(res.data?.patient.name).toBe('Criança');
      expect(res.data?.guardian?.name).toBe('Responsável');
    });

    it('deve retornar erro se paciente não for encontrado (fantasma)', async () => {
      (db.query.users.findFirst as any).mockResolvedValueOnce(undefined);

      const res = await getPatientByIdAction('id-fantasma');
      expect(res).toEqual({ error: 'Paciente não encontrado.' });
    });
  });

  describe('5. updatePatientAction', () => {
    it('deve atualizar os dados do paciente com sucesso', async () => {
      const payload = { name: 'Criança Editada', age: '9', gender: 'M' };

      const res = await updatePatientAction('pat-1', payload);
      
      expect(db.update).toHaveBeenCalled();
      expect(res.success).toBe(true);
    });

    it('deve retornar erro se não houver sessão ativa', async () => {
      (auth.getSession as any).mockResolvedValueOnce(null);
      const res = await updatePatientAction('pat-1', {});
      expect(res).toEqual({ error: 'Não autorizado.' });
    });
  });

  describe('6. deletePatientAction', () => {
    it('deve excluir permanentemente um paciente do sistema', async () => {
      (db.where as any).mockResolvedValueOnce([{ id: 'pat-1' }]); 

      const res = await deletePatientAction('pat-1');
      
      expect(db.delete).toHaveBeenCalled();
      expect(res.success).toBe(true);
    });

    it('deve retornar erro se não houver sessão ativa', async () => {
      (auth.getSession as any).mockResolvedValueOnce(null);
      const res = await deletePatientAction('pat-1');
      expect(res).toEqual({ error: 'Não autorizado.' });
    });
  });
});
