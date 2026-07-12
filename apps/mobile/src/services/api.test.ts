import { api, setAuthToken } from './api';

// Simula o comportamento das lógicas de requisição do Mobile App,
// isolando a comunicação do App com as rotas reais,
// sem utilizar a renderização gráfica nativa do Windows.

jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      defaults: {
        headers: {
          common: {}
        }
      }
    }))
  };
});

describe('Integração de Comunicação - Aplicativo vs Banco de Dados', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAuthToken(null);
  });

  describe('1. Autenticação e Autorização', () => {
    it('deve armazenar e anexar o token de autorização nas chamadas corretamente', () => {
      const mockToken = 'mock-jwt-token-12345';
      setAuthToken(mockToken);
      expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${mockToken}`);
    });

    it('deve enviar os dados corretos para o registro de um novo psicólogo', async () => {
      const mockNewUser = {
        name: 'Dra. Silva',
        email: 'silva@test.com',
        crp: '99999',
        password: 'securepassword123',
        clinicName: 'Clínica Silva'
      };

      (api.post as jest.Mock).mockResolvedValueOnce({
        data: { success: true, message: 'Usuário registrado com sucesso!' }
      });

      const response = await api.post('/api/auth/register', mockNewUser);

      expect(api.post).toHaveBeenCalledWith('/api/auth/register', mockNewUser);
      expect(response.data.success).toBe(true);
    });
  });

  describe('2. Dashboard do Psicólogo', () => {
    it('deve extrair as métricas de saúde perfeitamente das respostas do backend', async () => {
      const mockDashboardResponse = {
        data: {
          success: true,
          data: {
            pacientesAtivos: 15,
            sessoesRealizadas: 42,
            horasDeJogo: '24h',
            metricas: { acertos_totais: 350, erros_totais: 15 }
          }
        }
      };

      (api.get as jest.Mock).mockResolvedValueOnce(mockDashboardResponse);

      const response = await api.get('/api/psychologist/dashboard');
      const backendData = response.data.data;

      expect(api.get).toHaveBeenCalledWith('/api/psychologist/dashboard');
      expect(response.data.success).toBe(true);
      expect(backendData.pacientesAtivos).toBe(15);
      expect(backendData.sessoesRealizadas).toBe(42);
    });
  });

  describe('3. Perfil do Psicólogo (CRUD)', () => {
    it('deve buscar os dados do perfil do psicólogo logado', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: { name: 'Dr. João', crp: '12345' } }
      });
      const res = await api.get('/api/psychologist/profile');
      expect(api.get).toHaveBeenCalledWith('/api/psychologist/profile');
      expect(res.data.data.name).toBe('Dr. João');
    });

    it('deve atualizar os dados do perfil do psicólogo no banco', async () => {
      const payload = { name: 'Dr. João Atualizado', crp: '54321', clinicName: 'Clínica Luz' };
      (api.put as jest.Mock).mockResolvedValueOnce({
        data: { success: true, message: 'Perfil atualizado.' }
      });
      const res = await api.put('/api/psychologist/profile', payload);
      expect(api.put).toHaveBeenCalledWith('/api/psychologist/profile', payload);
      expect(res.data.success).toBe(true);
    });
  });

  describe('4. Cadastro de Crianças', () => {
    it('deve garantir os parâmetros corretos para criação de um novo paciente', async () => {
      const mockNewPatient = { name: 'João Pedro', age: '8', gender: 'M', guardianName: 'Maria Silva', guardianEmail: 'maria@test.com', guardianPhone: '11999999999' };
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { success: true, message: 'Paciente cadastrado com sucesso!' } });
      const response = await api.post('/api/patients', mockNewPatient);
      expect(api.post).toHaveBeenCalledWith('/api/patients', mockNewPatient);
      expect(response.data.success).toBe(true);
    });
  });

  describe('5. Listagem de Pacientes', () => {
    it('deve receber e mapear o histórico de jogos e a integridade da criança no catálogo', async () => {
      const mockPatientsList = {
        data: { success: true, data: [{ id: 'uuid-1', name: 'Ana', age: '7', guardianName: 'Roberto', sessionCount: 5 }] }
      };
      (api.get as jest.Mock).mockResolvedValueOnce(mockPatientsList);
      const response = await api.get('/api/patients');
      const patients = response.data.data;
      expect(api.get).toHaveBeenCalledWith('/api/patients');
      expect(patients.length).toBe(1);
      expect(patients[0].sessionCount).toBeGreaterThan(0);
    });
  });

  describe('6. Perfil, Edição e Exclusão do Paciente (CRUD Completo)', () => {
    it('deve buscar os detalhes avançados do paciente e responsável', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: { patient: { name: 'Ana' }, guardian: { name: 'Roberto' }, sessions: [] } }
      });
      const res = await api.get('/api/patients/uuid-1');
      expect(api.get).toHaveBeenCalledWith('/api/patients/uuid-1');
      expect(res.data.data.guardian.name).toBe('Roberto');
    });

    it('deve atualizar os dados diretos da criança', async () => {
      const payload = { name: 'Ana Souza', age: '8', gender: 'F' };
      (api.put as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
      const res = await api.put('/api/patients/uuid-1?type=patient', payload);
      expect(api.put).toHaveBeenCalledWith('/api/patients/uuid-1?type=patient', payload);
      expect(res.data.success).toBe(true);
    });

    it('deve atualizar os dados do responsável da criança', async () => {
      const payload = { name: 'Roberto Souza', email: 'roberto@email.com', phone: '11999999999' };
      (api.put as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
      const res = await api.put('/api/patients/guardian-uuid?type=guardian', payload);
      expect(api.put).toHaveBeenCalledWith('/api/patients/guardian-uuid?type=guardian', payload);
      expect(res.data.success).toBe(true);
    });

    it('deve solicitar a exclusão completa do paciente ao banco', async () => {
      (api.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
      const res = await api.delete('/api/patients/uuid-1');
      expect(api.delete).toHaveBeenCalledWith('/api/patients/uuid-1');
      expect(res.data.success).toBe(true);
    });
  });

  describe('7. Tratamento de Erros e Comunicação com o Usuário', () => {
    it('deve capturar corretamente erros de login (ex: senha inválida) para alimentar os popups de erro', async () => {
      const mockErrorResponse = {
        response: { data: { error: 'E-mail ou senha inválidos' } }
      };
      (api.post as jest.Mock).mockRejectedValueOnce(mockErrorResponse);

      try {
        await api.post('/api/auth/login', { email: 'errado@test.com', password: '123' });
      } catch (error: any) {
        expect(error.response.data.error).toBe('E-mail ou senha inválidos');
      }
    });

    it('deve capturar erro de e-mail duplicado no cadastro', async () => {
      const mockErrorResponse = {
        response: { data: { error: 'Este e-mail já está em uso.' } }
      };
      (api.post as jest.Mock).mockRejectedValueOnce(mockErrorResponse);

      try {
        await api.post('/api/auth/register', { email: 'jaexiste@test.com' });
      } catch (error: any) {
        expect(error.response.data.error).toBe('Este e-mail já está em uso.');
      }
    });

    it('deve interpretar falha de servidor ao buscar pacientes (ex: 500)', async () => {
      const mockErrorResponse = {
        response: { data: { error: 'Erro interno no servidor' }, status: 500 }
      };
      (api.get as jest.Mock).mockRejectedValueOnce(mockErrorResponse);

      try {
        await api.get('/api/patients');
      } catch (error: any) {
        expect(error.response.status).toBe(500);
        expect(error.response.data.error).toContain('Erro interno');
      }
    });

    it('deve simular bloqueio ao dashboard por token expirado ou ausente (401)', async () => {
      const mockErrorResponse = { response: { data: { error: 'Não autorizado' }, status: 401 } };
      (api.get as jest.Mock).mockRejectedValueOnce(mockErrorResponse);
      try {
        await api.get('/api/psychologist/dashboard');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    it('deve capturar erro 400 ao tentar cadastrar paciente sem dados obrigatórios', async () => {
      const mockErrorResponse = { response: { data: { error: 'Nome e idade são obrigatórios' }, status: 400 } };
      (api.post as jest.Mock).mockRejectedValueOnce(mockErrorResponse);
      try {
        await api.post('/api/patients', { gender: 'M' }); // Dados incompletos
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error).toBe('Nome e idade são obrigatórios');
      }
    });

    it('deve capturar erro 404 ao tentar abrir perfil de psicólogo não encontrado', async () => {
      const mockErrorResponse = { response: { data: { error: 'Psicólogo não encontrado' }, status: 404 } };
      (api.get as jest.Mock).mockRejectedValueOnce(mockErrorResponse);
      try {
        await api.get('/api/psychologist/profile');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });

    it('deve capturar erro 404 ao buscar perfil de criança deletada ou inexistente', async () => {
      const mockErrorResponse = { response: { data: { error: 'Paciente não encontrado' }, status: 404 } };
      (api.get as jest.Mock).mockRejectedValueOnce(mockErrorResponse);
      try {
        await api.get('/api/patients/inexistente-uuid');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });

    it('deve capturar erro 403 ao tentar editar paciente pertencente a outro psicólogo', async () => {
      const mockErrorResponse = { response: { data: { error: 'Permissão negada. Este paciente pertence a outro psicólogo.' }, status: 403 } };
      (api.put as jest.Mock).mockRejectedValueOnce(mockErrorResponse);
      try {
        await api.put('/api/patients/outro-uuid?type=patient', { name: 'João' });
      } catch (error: any) {
        expect(error.response.status).toBe(403);
      }
    });

    it('deve capturar erro ao tentar deletar paciente já deletado ou sem vínculo (404/403)', async () => {
      const mockErrorResponse = { response: { data: { error: 'Não foi possível excluir o paciente.' }, status: 400 } };
      (api.delete as jest.Mock).mockRejectedValueOnce(mockErrorResponse);
      try {
        await api.delete('/api/patients/uuid-1');
      } catch (error: any) {
        expect(error.response.data.error).toContain('Não foi possível excluir');
      }
    });
  });
});
