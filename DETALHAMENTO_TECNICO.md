# Detalhamento Técnico — TekoPorã 🌿

Este documento apresenta uma visão geral e detalhamento técnico completo do projeto **TekoPorã**, uma plataforma voltada para a **avaliação neurocognitiva infantil**. O projeto substitui testes tradicionais por dinâmicas gamificadas imersivas, visando diminuir a ansiedade clínica e coletar métricas neurológicas precisas através de telemetria.

---

## 🏗 Estrutura do Projeto

O projeto adota uma arquitetura de **Monorepo** gerenciada através do **Turborepo** (`turbo.json`). Esta estrutura permite compartilhar configurações e bibliotecas entre os diferentes módulos da plataforma, promovendo consistência e reuso de código.

As divisões principais do projeto estão distribuídas nas pastas `apps/` (aplicativos principais) e `packages/` (pacotes compartilhados):

1. **`apps/mobile`**: O aplicativo móvel voltado para o paciente (criança) realizar as dinâmicas e jogos neurocognitivos.
2. **`apps/web`**: O dashboard web, focado nos psicólogos, clínicas e administradores para gerenciar pacientes, visualizar relatórios e configurações.
3. **`apps/api`**: O backend central, responsável por prover as rotas da API, integrações com inteligência artificial e lógica de negócios pesada.
4. **`packages/db`**: Camada compartilhada de persistência e orquestração de banco de dados, sendo a única fonte da verdade para o esquema dos dados.

---

## 🛠 Stack Tecnológica por Funcionalidade

A escolha da stack foca em garantir altíssima performance para a captura telemétrica de dados cognitivos (com precisão de milissegundos) e, ao mesmo tempo, oferecer uma interface fluida (Glassmorphism e microinterações).

### 📱 Aplicativo Mobile (`apps/mobile`)
Responsável pelas avaliações gamificadas. Precisa capturar toques com alta precisão e processamento de áudio/gestos.
- **Framework Base:** [React Native](https://reactnative.dev/)
- **Ecossistema & Build:** [Expo](https://expo.dev/) (para build nativo, hot-reload e roteamento de dependências).
- **Animações e Interações:** React Native Reanimated v3.
- **Captura de Gestos:** `react-native-gesture-handler` (captura precisa de posição e timestamp de toques).
- **Renderização de Alta Precisão:** `@shopify/react-native-skia` (utilizado para gráficos complexos e controle milimétrico de frame para dinâmicas visuais, como onsets visuais e snap de quebra-cabeças).
- **Comunicação:** Axios para requisições e Expo AV para mídia/áudio.

### 💻 Dashboard Web (`apps/web`)
A interface para profissionais de saúde e clínicos acompanharem os laudos.
- **Framework Base:** [Next.js](https://nextjs.org/)
- **Estilização:** [Tailwind CSS v4](https://tailwindcss.com/) (para implementar designs modernos sem esforço excessivo).
- **Ícones:** Lucide React.
- **Banco de Dados (integração direta via server components):** Drizzle ORM integrado nativamente com o banco `pg` (PostgreSQL).

### ⚙️ Backend e Inteligência (`apps/api`)
Responsável pela validação semântica, integração de IA e serviços essenciais.
- **Framework:** Node.js puro com **Fastify** (ótimo para alta performance e processamento assíncrono).
- **IA & Transcrição:** Integração com **OpenAI** SDK (Whisper para processamento de voz e transcrição ultra rápida das dinâmicas do Jogo da Bomba).
- **Processamento:** TypeScript nativo focado em validação lógica rápida para minimizar gargalos no TR (Tempo de Reação) coletado dos pacientes.

---

## 🗄️ Banco de Dados e Seu Comportamento

O projeto utiliza **PostgreSQL** orquestrado pelo **Drizzle ORM** (`packages/db`). O banco de dados foi modelado para suportar **multitenancy** (múltiplos inquilinos) através de hierarquias de papéis (Roles).

### Tabelas e Estrutura Principal (`schema.ts`)

#### 1. Enumeradores de Acesso (`roleEnum`)
Define os tipos de usuários da plataforma: `GLOBAL_ADMIN`, `PSICOLOGO`, `ALUNO` (Paciente/Criança) e `FAMILIAR`.

#### 2. Tabela de Usuários (`users`)
Centraliza todos os indivíduos do ecossistema. Suporta multitenancy vinculando pacientes aos seus psicólogos.
- **Campos Principais:** `id` (UUID), `role` (enum), `name`, `email` (opcional, alunos podem entrar apenas com PIN), `cpf`, `crp` (para psicólogos), `clinicName`.
- **Relacionamentos:** 
  - `psicologoId`: Para pacientes (`ALUNO`) e `FAMILIAR`, este campo referencia o ID do psicólogo responsável.
  - `alunoId`: Para perfis `FAMILIAR`, vincula diretamente ao respectivo aluno.

#### 3. Tabela de Jogos / Dinâmicas (`games`)
O catálogo de módulos lúdicos da plataforma (ex: Jogo da Bomba, Go/No-Go).
- **Campos Principais:** `id`, `name`, `description`.
- **`clinicalTarget`:** Mapeia o construto psicométrico primário focado pelo jogo (Ex: 'WISC-V', 'Controle Inibitório').

#### 4. Sessões de Jogo (`gameSessions`)
O coração analítico da plataforma. Armazena cada vez que um paciente interage com uma avaliação.
- **Relacionamentos:** `alunoId` (referencia o paciente) e `gameId` (referencia o minigame testado).
- **Controle Temporal:** `startedAt` e `finishedAt`.
- **Telemetria (`behaviorData`):** Campo tipo `jsonb` de extrema importância. Armazena os dados comportamentais brutos, tais como tempo de reação em milissegundos, posição de cliques, taxa de acertos e falhas semânticas.
- **Análises de Inteligência (`flaggedPatterns`):** Outro `jsonb` focado em guardar padrões (insights) e bandeiras (red/green flags) gerados pelo backend/IA baseados no `behaviorData`.

### Comportamento Geral do Banco
O modelo é orientado a eventos de telemetria. Quando a criança utiliza o `mobile`, um vasto log é gerado (armazenado temporariamente na memória/local) e, ao fim, empacotado e persistido no `behaviorData` (um json estruturado sem esquemas engessados que engessa o payload) da respectiva `gameSession`. O `web` e a `api` então consultam esses dados brutos, realizam a modelagem probabilística e geram os relatórios behavioristas acessíveis para o `PSICOLOGO` atrelado (via `psicologoId`).
