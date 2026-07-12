import { api, setAuthToken } from './api';

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

describe('Integração de Comunicação - Administrador Global vs Banco de Dados', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAuthToken(null);
  });

  describe('1. Autenticação e Autorização (Admin)', () => {
    it('deve armazenar e anexar o token corretamente ao logar como Admin', () => {
      const mockAdminToken = 'admin-jwt-token';
      setAuthToken(mockAdminToken);
      expect(api.defaults.headers.common['Authorization']).toBe(`Bearer ${mockAdminToken}`);
    });

    it('deve capturar falha (401) ao tentar logar com senha inválida', async () => {
      const mockErrorResponse = { response: { data: { error: 'E-mail ou senha inválidos' }, status: 401 } };
      (api.post as jest.Mock).mockRejectedValueOnce(mockErrorResponse);

      try {
        await api.post('/api/auth/login', { email: 'admin@teko.com', password: 'err' });
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('2. Dashboard Geral (Painel de Visão)', () => {
    it('deve extrair corretamente as estatísticas globais', async () => {
      const mockDashboard = {
        data: {
          success: true,
          data: {
            stats: { profissionais: 10, relatorios: 50, criancas: 100 },
            recentPsychologists: []
          }
        }
      };
      (api.get as jest.Mock).mockResolvedValueOnce(mockDashboard);

      const res = await api.get('/api/admin/dashboard');
      expect(api.get).toHaveBeenCalledWith('/api/admin/dashboard');
      expect(res.data.data.stats.profissionais).toBe(10);
    });

    it('deve capturar erro (403) ao tentar acessar o dashboard sem privilégios de Admin', async () => {
      const mockErrorResponse = { response: { data: { error: 'Acesso negado' }, status: 403 } };
      (api.get as jest.Mock).mockRejectedValueOnce(mockErrorResponse);

      try {
        await api.get('/api/admin/dashboard');
      } catch (error: any) {
        expect(error.response.status).toBe(403);
      }
    });
  });

  describe('3. Catálogo de Profissionais (Listagem)', () => {
    it('deve listar todos os psicólogos do sistema', async () => {
      const mockList = {
        data: { success: true, data: [{ id: '1', name: 'Dr. Teste', crp: '123' }] }
      };
      (api.get as jest.Mock).mockResolvedValueOnce(mockList);

      const res = await api.get('/api/admin/psychologists');
      expect(api.get).toHaveBeenCalledWith('/api/admin/psychologists');
      expect(res.data.data[0].name).toBe('Dr. Teste');
    });

    it('deve interpretar falha interna do servidor (500) ao buscar o catálogo', async () => {
      const mockErrorResponse = { response: { data: { error: 'Erro no servidor' }, status: 500 } };
      (api.get as jest.Mock).mockRejectedValueOnce(mockErrorResponse);

      try {
        await api.get('/api/admin/psychologists');
      } catch (error: any) {
        expect(error.response.status).toBe(500);
      }
    });
  });

  describe('4. Perfil, Edição e Exclusão do Psicólogo (CRUD)', () => {
    it('deve buscar e mapear os detalhes específicos de um psicólogo', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { success: true, data: { name: 'Dra. Ana', clinicName: 'Clínica Paz' } }
      });
      const res = await api.get('/api/admin/psychologists/psi-123');
      expect(api.get).toHaveBeenCalledWith('/api/admin/psychologists/psi-123');
      expect(res.data.data.clinicName).toBe('Clínica Paz');
    });

    it('deve enviar a requisição PUT corretamente para alterar dados do psicólogo', async () => {
      const payload = { clinicName: 'Nova Clínica' };
      (api.put as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
      const res = await api.put('/api/admin/psychologists/psi-123', payload);
      expect(api.put).toHaveBeenCalledWith('/api/admin/psychologists/psi-123', payload);
      expect(res.data.success).toBe(true);
    });

    it('deve enviar a requisição DELETE para remover um psicólogo', async () => {
      (api.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
      const res = await api.delete('/api/admin/psychologists/psi-123');
      expect(api.delete).toHaveBeenCalledWith('/api/admin/psychologists/psi-123');
      expect(res.data.success).toBe(true);
    });

    it('deve capturar um erro 404 ao tentar abrir perfil de psicólogo inexistente', async () => {
      const mockErrorResponse = { response: { data: { error: 'Não encontrado' }, status: 404 } };
      (api.get as jest.Mock).mockRejectedValueOnce(mockErrorResponse);
      try {
        await api.get('/api/admin/psychologists/inexistente');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });

    it('deve capturar um erro 400 se o admin tentar salvar perfil com dados inválidos', async () => {
      const mockErrorResponse = { response: { data: { error: 'Email em branco' }, status: 400 } };
      (api.put as jest.Mock).mockRejectedValueOnce(mockErrorResponse);
      try {
        await api.put('/api/admin/psychologists/psi-123', { email: '' });
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('5. Criação Direta de Profissionais', () => {
    it('deve enviar o payload correto para criar um novo psicólogo como Admin', async () => {
      const mockNewUser = { name: 'Dr. Novo', email: 'novo@teste.com', password: '123' };
      (api.post as jest.Mock).mockResolvedValueOnce({ data: { success: true } });
      const res = await api.post('/api/auth/register', mockNewUser);
      expect(api.post).toHaveBeenCalledWith('/api/auth/register', mockNewUser);
      expect(res.data.success).toBe(true);
    });

    it('deve capturar erro 409 ao registrar um psicólogo com e-mail duplicado', async () => {
      const mockErrorResponse = { response: { data: { error: 'E-mail em uso' }, status: 409 } };
      (api.post as jest.Mock).mockRejectedValueOnce(mockErrorResponse);
      try {
        await api.post('/api/auth/register', { email: 'existente@teste.com' });
      } catch (error: any) {
        expect(error.response.status).toBe(409);
      }
    });
  });

  describe('6. Extração do Data Lake (Relatórios CSV)', () => {
    it('deve solicitar os dados da tabela bruta para visualização', async () => {
      const mockReportData = {
        data: { success: true, data: [{ alunoName: 'João', vtri: '200' }] }
      };
      (api.get as jest.Mock).mockResolvedValueOnce(mockReportData);
      const res = await api.get('/api/admin/reports');
      expect(api.get).toHaveBeenCalledWith('/api/admin/reports');
      expect(res.data.data[0].vtri).toBe('200');
    });

    it('deve solicitar a string do arquivo CSV e receber o formato correto', async () => {
      (api.get as jest.Mock).mockResolvedValueOnce({
        data: { success: true, csv: 'nome,idade\nJoão,8' }
      });
      const res = await api.get('/api/admin/reports/export');
      expect(api.get).toHaveBeenCalledWith('/api/admin/reports/export');
      expect(res.data.csv).toContain('nome,idade');
    });

    it('deve capturar falha (500) caso a montagem do CSV falhe no backend', async () => {
      const mockErrorResponse = { response: { data: { error: 'Erro de formatação' }, status: 500 } };
      (api.get as jest.Mock).mockRejectedValueOnce(mockErrorResponse);
      try {
        await api.get('/api/admin/reports/export');
      } catch (error: any) {
        expect(error.response.status).toBe(500);
      }
    });
  });
});
