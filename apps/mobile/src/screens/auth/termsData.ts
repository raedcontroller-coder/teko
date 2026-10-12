export interface TermSection {
  title: string;
  content: string;
}

export const TERMS_SECTIONS_PT: TermSection[] = [
  {
    title: "Princípios que orientam a Teko",
    content: "• Experiência infanto-juvenil em primeiro lugar.\n• Ludicidade com propósito.\n• Evidência antes de conclusão.\n• Precisão, rastreabilidade e privacidade.\n• Transparência de interpretação e complementaridade ao trabalho profissional.\n\nA Teko encontra-se em desenvolvimento e validação. O recorte dos estudos iniciais envolve adolescentes de 12 a 14 anos; a plataforma tem escopo mais amplo de apoio ao acompanhamento psicológico."
  },
  {
    title: "1. Sobre a Teko e finalidade deste Termo",
    content: "A Teko é uma plataforma digital lúdica em desenvolvimento no âmbito do Projeto Startup da Fundação Escola de Comércio Álvares Penteado - FECAP, desenvolvida por Carlos Eduardo de Lima, Maria Victória Batista Oliveira e Miguel Rodrigues Pereira Francisco.\n\nA plataforma foi concebida para transformar interações realizadas em tarefas digitais gamificadas em dados comportamentais objetivos e informações de apoio à interpretação profissional. Na etapa atual, a Teko prioriza adolescentes de 12 a 14 anos e utiliza o TDAH como primeiro recorte de investigação e validação.\n\nEste Termo estabelece as condições aplicáveis ao uso da Teko pelo psicólogo e descreve, de forma transparente, como os dados inseridos ou gerados dentro da plataforma são utilizados nas funcionalidades atualmente previstas.\n\nA Teko não substitui diagnóstico, avaliação clínica, julgamento profissional, acompanhamento psicológico ou outros procedimentos que sejam necessários ao caso. Seus resultados devem ser entendidos como informação complementar."
  },
  {
    title: "2. Aceitação e perfil profissional",
    content: "Ao criar sua conta, marcar a opção de aceite deste Termo ou utilizar funcionalidades que dependam dele, o psicólogo declara que leu e compreendeu as condições aqui descritas.\n\nNo cadastro profissional, a Teko poderá solicitar nome, e-mail, senha, número de CRP e, quando houver, nome da clínica. O psicólogo é responsável por informar dados corretos, manter suas credenciais em sigilo e não compartilhar o acesso com pessoas não autorizadas.\n\nO uso da plataforma pressupõe responsabilidade profissional sobre as informações inseridas e sobre a interpretação dos resultados apresentados.\n\n2.1 Ciência do profissional e bases legais distintas: O aceite deste Termo formaliza a ciência e a concordância do psicólogo quanto às condições de uso da Teko. Esse aceite não constitui, por si só, consentimento do paciente ou do responsável legal para todas as operações de tratamento de dados. Cada finalidade deve possuir base legal pertinente na Lei nº 13.709/2018; tratando-se de dados de saúde e outros dados sensíveis, aplicam-se as hipóteses específicas do art. 11. Compete aos agentes de tratamento definir e documentar responsabilidades, bases legais e informações prestadas aos titulares.\n\n2.2 Registro do aceite: Recomenda-se registrar identidade da conta profissional, versão e idioma do Termo, data e hora do aceite e eventual renovação."
  },
  {
    title: "3. Cadastro do paciente e do responsável",
    content: "O psicólogo pode criar um paciente informando nome, gênero e idade. Junto ao paciente, é criado um responsável vinculado, com nome, e-mail e telefone de contato.\n\nEssas informações são organizadas no banco de dados da Teko para que cada paciente seja corretamente relacionado às suas informações clínicas, aplicações dos jogos, métricas, dashboards e relatórios.\n\nO psicólogo deve cadastrar apenas pacientes e responsáveis para os quais possua legitimidade profissional e as autorizações aplicáveis ao atendimento e ao uso da plataforma.\n\n3.1 Minimização cadastral: A plataforma coleta somente dados compatíveis com finalidades legítimas, determinadas e informadas (LGPD, art. 6º, I a III)."
  },
  {
    title: "4. Anamnese, notas clínicas e agendamentos",
    content: "Após a criação do paciente, o psicólogo pode registrar informações de anamnese, notas clínicas e agendamentos. Esses conteúdos formam o contexto clínico registrado na Teko e permanecem vinculados ao paciente.\n\nO psicólogo é responsável pelo conteúdo que inserir. Recomenda-se registrar somente informações pertinentes às finalidades do acompanhamento e evitar dados excessivos, irrelevantes ou de terceiros sem necessidade.\n\nAnamnese, notas clínicas e agendamentos não são utilizados como entrada do modelo estatístico que calcula a estimativa relacionada ao TDAH. Essas informações são utilizadas posteriormente, quando o psicólogo solicita a elaboração do relatório final, para fornecer contexto à síntese textual.\n\n4.1 Conteúdo clínico e identificação indireta: Anamneses e notas clínicas podem conter dados pessoais sensíveis e identificadores indiretos. O psicólogo deverá evitar informações excessivas e verificar a pertinência de cada registro."
  },
  {
    title: "5. Jogos digitais e coleta telemétrica",
    content: "A Teko utiliza atualmente três tarefas digitais: Jogo do Goleiro, Fotógrafo da Floresta e Toca Rápido!. Durante as aplicações, o sistema registra eventos comportamentais e dados telemétricos relacionados ao desempenho do paciente.\n\nEsses registros podem incluir, conforme a tarefa, tempos de resposta, acertos, omissões, comissões, antecipações, eventos de estímulo, respostas por tentativa e métricas derivadas do desempenho.\n\nOs dados ficam associados ao paciente e à aplicação correspondente, permitindo preservar o histórico das sessões e utilizar a telemetria nas funcionalidades de dashboard e análise estatística.\n\n5.1 Indicadores e atualização da dinâmica: Os indicadores centrais registrados pela Teko são a variabilidade dos tempos de reação no Jogo do Goleiro, a mudança do tempo médio de resposta entre a primeira e a segunda metade do Fotógrafo da Floresta e a contagem de respostas indevidas aos gatos no Toca Rápido!. Métricas isoladas não equivalem a diagnóstico."
  },
  {
    title: "6. Dashboard e interpretação breve por inteligência artificial",
    content: "Na seção de dashboard, os dados telemétricos armazenados são utilizados para construir gráficos interativos específicos para os jogos, com o objetivo de facilitar a visualização do desempenho do paciente.\n\nA Teko realiza uma requisição a uma API externa de inteligência artificial, utilizando um modelo de linguagem externo configurado para essa finalidade, para gerar um resumo ou interpretação breve de apoio à leitura dos gráficos.\n\nO texto gerado pela inteligência artificial pode ser armazenado junto às informações do dashboard e poderá integrar o contexto utilizado posteriormente na geração do relatório final.\n\nEsse resumo não constitui diagnóstico, parecer clínico autônomo ou substituto da interpretação do psicólogo. O profissional deve revisar criticamente qualquer conteúdo gerado automaticamente."
  },
  {
    title: "7. Solicitação do relatório final e funcionamento do núcleo analítico",
    content: "O relatório final é gerado somente quando o psicólogo solicita essa funcionalidade. A partir dessa solicitação, o sistema executa duas etapas diferentes: análise estatística da telemetria e, posteriormente, unificação do contexto para redação do relatório.\n\n7.1 Modelo de regressão linear múltipla: A regressão linear múltipla calibrada recebe somente os dados telemétricos da aplicação mais recente dos jogos. Informações de anamnese, notas clínicas, agendamentos e textos do dashboard não são entradas desse modelo.\n\nREGRA CENTRAL: o modelo estatístico usa somente dados telemétricos dos jogos. O contexto clínico não altera o cálculo da regressão.\n\n7.2 Unificação do contexto: Depois de calculada a estimativa estatística, a Teko reúne estimativa da regressão, métricas dos jogos, anamnese, notas clínicas e histórico de agendamentos.\n\n7.3 Geração do relatório final por IA: O contexto unificado é enviado a uma API externa de IA que organiza as informações e redige uma versão do relatório final para revisão do psicólogo.\n\n7.4 Limites da estimativa estatística: A saída matemática reflete as variáveis e a calibração do modelo utilizado e não representa uma probabilidade clínica validada automaticamente."
  },
  {
    title: "8. Como os dados são utilizados",
    content: "Os dados tratados dentro da Teko são utilizados conforme a finalidade de cada função:\n• Conta profissional: Autenticação, identificação e uso da conta.\n• Paciente e responsável: Vinculação do acompanhamento e dos registros do paciente.\n• Anamnese, notas e agenda: Organização do contexto clínico e composição do relatório quando solicitado.\n• Telemetria dos jogos: Gráficos, métricas, histórico e entrada do modelo estatístico.\n• Resumo do dashboard: Apoio à leitura dos gráficos e contexto do relatório final.\n• Estimativa estatística: Informação quantitativa complementar utilizada no relatório final.\n• Relatório final: Síntese organizada para revisão pelo psicólogo."
  },
  {
    title: "9. Uso de serviços externos de inteligência artificial",
    content: "Algumas funcionalidades da Teko dependem de serviços tecnológicos externos (APIs para resumos do dashboard e relatório final).\n\n9.1 Envio minimizado e proteção da identidade: Antes da chamada destinada à redação do relatório final são removidos campos diretos como nome do paciente, nome do responsável, nome do profissional, registro profissional e clínica; esses elementos são reinseridos localmente na composição do PDF. Permanecem dados necessários à síntese, como idade, indicadores dos jogos, anamnese e notas clínicas. A medida constitui minimização e desidentificação parcial, e não prova anonimização irreversível nos termos dos arts. 5º, XI, e 12 da LGPD.\n\n9.2 Fornecedores e transferência internacional: A migração para a ChatGPT API (OpenAI) é uma integração planejada. Não são enviados intencionalmente senhas nem segredos de autenticação."
  },
  {
    title: "10. Armazenamento, acesso e segurança",
    content: "A Teko armazena dados cadastrais, informações clínicas, telemetria, métricas, dashboards e relatórios sob o princípio da precisão, rastreabilidade e privacidade.\n\n10.1 Fundamentos legais: Observância dos princípios de finalidade, necessidade, transparência, segurança e prevenção da LGPD (art. 6º, 7º, 11 e 14).\n10.2 Credenciais e comunicações: Senhas com hash bcrypt, JWT assinados (jose) e HTTPS/TLS.\n10.3 Segregação por profissional: PostgreSQL com Row-Level Security (RLS) e isolamento multitenant.\n10.4 Auditoria: Registros com usuário, operação, recurso e marca temporal em tabela própria (audit_logs)."
  },
  {
    title: "11. Limites de interpretação",
    content: "• A Teko não realiza diagnóstico autônomo.\n• A estimativa estatística não confirma nem exclui TDAH por si só.\n• Gráficos, métricas, probabilidades e textos gerados por IA são informações de apoio.\n• Conteúdos gerados automaticamente podem conter imprecisões, omissões ou simplificações.\n• O psicólogo continua responsável pela análise profissional, revisão do relatório e decisões relacionadas ao paciente.\n• A Teko não deve ser utilizada como única fonte para decisões clínicas, educacionais, jurídicas ou sociais."
  },
  {
    title: "12. Responsabilidades do psicólogo",
    content: "O psicólogo compromete-se a: fornecer informações profissionais verdadeiras; cadastrar pacientes e responsáveis com legitimidade; registrar dados de forma pertinente; não compartilhar credenciais; revisar conteúdos gerados por IA antes do uso clínico; e cumprir as normas éticas e regulatórias do CFP."
  },
  {
    title: "13. Dados de crianças e adolescentes",
    content: "A plataforma prioriza adolescentes de 12 a 14 anos na validação atual. O tratamento observa a prioridade absoluta e o melhor interesse (LGPD, art. 14 e Enunciado CD/ANPD nº 1/2023). Este termo do psicólogo não substitui o consentimento devido aos responsáveis legais.\n\n13.2 Limites profissionais e avaliação psicológica: Resolução CFP nº 31/2022 (SATEPSI). As ferramentas digitais Teko são instrumentos complementares de apoio, sem equivalência a testes psicológicos padronizados privativos."
  },
  {
    title: "14. Alterações da plataforma e deste Termo",
    content: "A Teko poderá evoluir suas funcionalidades, métricas e modelos. Alterações materiais exigirão atualização do Termo e renovação do aceite ativo pelo profissional."
  },
  {
    title: "15. Contato oficial",
    content: "Canal oficial para dúvidas, suporte ou requisição de direitos de privacidade dos titulares:\nE-mail oficial: teko.controller@gmail.com"
  },
  {
    title: "16. Declarações de ciência e aceite",
    content: "Para a ativação da conta, o psicólogo deve assinalar individualmente cada uma das 13 declarações obrigatórias estruturadas no aplicativo, confirmando a ciência de todas as cláusulas e limites da plataforma Teko."
  }
];

export const TERMS_SECTIONS_EN: TermSection[] = [
  {
    title: "Principles that guide Teko",
    content: "• Children and adolescents first.\n• Purposeful playfulness.\n• Evidence before conclusions.\n• Accuracy, traceability and privacy.\n• Transparent interpretation and support for professional practice.\n\nTeko remains in development and validation. Early studies focus on adolescents aged 12–14, while the platform has a broader intended scope as a tool supporting psychological care."
  },
  {
    title: "1. About Teko and the purpose of these Terms",
    content: "Teko is a playful digital platform under development as part of the Startup Project at FECAP, developed by Carlos Eduardo de Lima, Maria Victória Batista Oliveira, and Miguel Rodrigues Pereira Francisco.\n\nThe platform transforms gamified interactions into objective behavioral data supporting professional interpretation. ADHD is its initial research focus.\n\nTeko does not replace diagnosis, clinical assessment, professional judgment, psychological care, or any other procedures. Results are complementary information."
  },
  {
    title: "2. Acceptance and professional profile",
    content: "By creating an account, the psychologist declares they have read and understood these Terms. Credentials must remain confidential.\n\n2.1 Professional acknowledgement: This acceptance does not replace the patient's or guardian's consent under LGPD Art. 11 & 14.\n2.2 Evidence of acceptance: Identity, terms version, language, timestamp and renewal are recorded."
  },
  {
    title: "3. Patient and responsible party registration",
    content: "The psychologist creates patient records with name, gender, and age, linked to a responsible party. Only authorized patients may be registered. Minimized registration applies."
  },
  {
    title: "4. Anamnesis, clinical notes, and appointments",
    content: "Clinical narrative context is recorded by the psychologist and kept linked to the patient. These are not inputs to the statistical model and are unified only upon final report generation."
  },
  {
    title: "5. Digital games and telemetry data collection",
    content: "Tasks include Goalkeeper Game, Forest Photographer, and Tap Fast!. Telemetry events (reaction time variability, omissions, commissions, correct hits) are stored for dashboards and analytics."
  },
  {
    title: "6. Dashboard and brief artificial intelligence interpretation",
    content: "Charts visualize performance. An external AI API generates brief chart reading summaries. Summaries are not autonomous diagnoses and require critical professional review."
  },
  {
    title: "7. Requesting the final report and analytical core",
    content: "7.1 Multiple linear regression receives ONLY game telemetry. Clinical context does not alter the regression.\n7.2 Context integration gathers metrics, anamnesis and notes.\n7.3 External AI drafts the report for psychologist review.\n7.4 Output is a statistical estimate, not clinical certainty."
  },
  {
    title: "8. How data are used",
    content: "Data are processed according to explicit purposes: account authentication, patient care linking, clinical notes, game telemetry, dashboard insights, statistical scoring, and drafted final reports."
  },
  {
    title: "9. Use of external artificial intelligence services",
    content: "Direct identifiers (names, license, clinic) are stripped before sending drafting requests to external AI. Clinical notes remain partially de-identified. Passwords are never sent to AI."
  },
  {
    title: "10. Storage, access, and security",
    content: "Secure storage with bcrypt password hashing, signed JWTs, HTTPS/TLS, PostgreSQL Row-Level Security (RLS), and audit logs for clinical traceability."
  },
  {
    title: "11. Limitations of interpretation",
    content: "• Teko does not provide autonomous diagnosis.\n• Statistical estimates do not confirm or rule out ADHD alone.\n• Psychologists remain fully responsible for clinical decisions."
  },
  {
    title: "12. Psychologist responsibilities",
    content: "Provide accurate professional details, safeguard credentials, review AI drafts, avoid treating Teko as diagnostic certainty, and adhere to CFP ethical codes."
  },
  {
    title: "13. Data relating to children and adolescents",
    content: "Prioritizes best interests and data minimization under LGPD Art. 14. Games and indicators are supplementary digital tools, not standardized psychological tests (CFP 31/2022)."
  },
  {
    title: "14. Changes to the platform and these Terms",
    content: "Material changes in data processing or vendors require terms updates and renewed active acknowledgement."
  },
  {
    title: "15. Official Contact",
    content: "Official communication channel for support and data privacy rights: teko.controller@gmail.com"
  },
  {
    title: "16. Acknowledgement and acceptance statements",
    content: "Psychologists must actively acknowledge and check each of the 13 required statements in the mobile application to activate their account."
  }
];
