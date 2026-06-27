# Arquitetura de Banco de Dados e Multitenancy da Teko

Este documento detalha o funcionamento atual do banco de dados relacional que alimenta o ecossistema Teko, gerenciado pelo ORM **Drizzle**, conforme definido no pacote `packages/db`.

## 1. Visão Geral do Banco de Dados
A arquitetura de dados da Teko foi projetada para ser enxuta e altamente escalável. O esquema está focado na tríade central do produto: **Usuários** (Psicólogos, Crianças e Pais), **Jogos** (Avaliações/Mecânicas) e **Sessões de Jogo** (Resultados e Análises).

Todas as tabelas são orquestradas via Drizzle ORM sobre um banco PostgreSQL, utilizando UUIDs para identificação única global (`uuid('id').defaultRandom().primaryKey()`).

## 2. Modelagem de Usuários e Gestão de Múltiplas Clínicas (Multitenancy)

A estrutura adota o modelo de *Single Table Inheritance* conceitual para armazenar todas as entidades no mesmo local (`users`), isolando o acesso via uma estratégia elegante de **Self-Referencing Multitenancy** (Multitenancy Autorreferenciada).

### 2.1. Tabela `users`
- **`role`**: Define o papel do usuário no ecossistema através de um *Enum*: `GLOBAL_ADMIN`, `PSICOLOGO`, `ALUNO`, `FAMILIAR`. O padrão é `ALUNO`.
- **Credenciais e Verificação**: O campo `email` é **obrigatório**. Ele é a chave primária de segurança utilizada para verificar a identidade de todos os tipos de usuários da plataforma.
- **Dados Profissionais**: Campos como `crp` e `clinic_name` (Nome da Clínica) ficam atrelados diretamente ao usuário caso ele seja um Psicólogo.

### 2.2. Como o Multitenancy Funciona?
Ao invés de criar um banco de dados por clínica ou tabelas complexas de "Workspaces", a Teko resolve a gestão de múltiplas clínicas diretamente na relação entre usuários:

1. **O Psicólogo como Tenant (Inquilino)**: Todo usuário com a role `PSICOLOGO` atua como o "dono" de uma clínica.
2. **A Chave `psicologoId`**: Se o usuário criado for uma criança (`ALUNO`) ou pai/mãe (`FAMILIAR`), o campo `psicologoId` é preenchido com o ID do seu Psicólogo correspondente (uma chave estrangeira referenciando a própria tabela `users`).
3. **Isolamento de Dados**: No backend, basta filtrar os dados baseando-se no `psicologoId`. Um Psicólogo A nunca verá os alunos do Psicólogo B, pois todas as consultas (queries) da clínica são escopadas por esta chave.
4. **Vínculo Familiar**: O banco também possui o campo `alunoId`, que permite amarrar a conta de um `FAMILIAR` diretamente aos dados do `ALUNO` específico que ele está acompanhando.

## 3. Catálogo de Jogos (Serious Games)

A tabela `games` funciona como um dicionário global de avaliações lúdicas disponíveis na plataforma.
- Armazena o **nome**, **descrição** e o **`clinicalTarget`** (Alvo Clínico, por exemplo: *WISC-V*, *CBCL*). 
- Esses registros são estáticos em relação às clínicas, funcionando como o catálogo "core" do sistema.

## 4. Telemetria e Inteligência Analítica

Onde a mágica neuropsicológica acontece é na tabela `game_sessions` (Sessões de Jogo).

- **Mapeamento**: Registra qual aluno (`alunoId`) jogou qual jogo (`gameId`), com controle temporal (`startedAt` e `finishedAt`).
- **Captura Invisível de Dados**: Através de colunas `JSONB` de alto desempenho, o Drizzle mapeia dois campos vitais:
  - `behaviorData`: Dados brutos extraídos durante o gameplay (tempo de resposta, taxa de cliques, hesitação).
  - `flaggedPatterns`: Os insights e relatórios gerados a partir da análise desses dados (padrões mapeados por IA ou algoritmos psicométricos).

## Conclusão
A arquitetura atual é madura e voltada ao produto clínico. O uso de Multitenancy Autorreferenciado via `psicologoId` anula a necessidade daquela palavra técnica (Multitenancy) no frontend, pois para o Psicólogo, ele simplesmente está "gerenciando seus pacientes" em seu próprio ambiente (Plataforma Integrada), enquanto o banco de dados assegura total privacidade e isolamento sob o capô.
