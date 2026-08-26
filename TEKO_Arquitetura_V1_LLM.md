# TEKO — Arquitetura Funcional e Técnica da V1

> Documento de contexto arquitetural para uso por LLMs em IDEs e agentes de desenvolvimento.
> Baseado integralmente na especificação **“TEKO: Arquitetura Funcional e Técnica da V1 para Organização Clínica, Acompanhamento de Pacientes e Visualização dos Resultados Digitais” (2026)**.

## 0. Objetivo deste arquivo

Este arquivo deve funcionar como **fonte de verdade arquitetural da V1 da Teko** para assistentes de programação. Ao gerar, modificar, refatorar ou revisar código, a LLM deve preservar os princípios, módulos, relacionamentos e limites descritos aqui.

Não inventar requisitos clínicos, métricas, módulos ou comportamentos não especificados. Quando uma implementação exigir uma decisão ausente neste documento, a LLM deve identificar explicitamente a lacuna antes de assumir uma solução.

---

## 1. Visão geral da V1

A primeira versão da Teko reúne, em um único ambiente, funções para:

- organizar o acompanhamento do paciente;
- registrar informações clínicas;
- organizar consultas;
- receber e apresentar resultados produzidos pelos jogos Teko;
- acompanhar longitudinalmente métricas comportamentais;
- utilizar IA como apoio textual à leitura dos resultados já processados.

A V1 não busca adicionar indiscriminadamente funcionalidades. O objetivo é estabelecer uma estrutura inicial clara, integrada e suficientemente sólida para sustentar o uso cotidiano e permitir evolução posterior sem comprometer a arquitetura.

A V1 funciona como uma **camada clínica e operacional construída ao redor dos recursos já existentes da Teko**, conectando pacientes, registros, aplicações, resultados e consultas.

### 1.1 Estrutura funcional

```text
TEKO
│
├── PACIENTES
│   ├── Dados
│   ├── Anamnese
│   ├── Notas clínicas
│   └── Dashboard
│       ├── Resumo
│       ├── Resultados Teko
│       └── Evolução
│           ├── VTR
│           ├── DV
│           └── Comissões
│
├── AGENDA
│   ├── Dia
│   ├── Semana
│   ├── Mês
│   └── Consultas
│
└── PERFIL / CONFIGURAÇÕES
```

### 1.2 Responsabilidade de cada área

| Área | Responsabilidade central |
|---|---|
| Pacientes | Centralizar registros individuais e oferecer acesso à anamnese, notas clínicas e dashboard. |
| Dashboard | Organizar resultados Teko da aplicação selecionada e evolução das métricas entre aplicações. |
| Agenda | Organizar consultas nas visões diária, semanal e mensal usando a mesma entidade de consulta. |
| Perfil / Configurações | Permanecer na navegação principal; requisitos internos ainda não definidos nesta especificação. |

---

## 2. Princípios arquiteturais obrigatórios

### 2.1 Paciente como referência central

O paciente é a entidade central dos registros clínicos e dos dados produzidos pelos jogos. Ao abrir um paciente, a aplicação deve preservar o mesmo contexto de identidade durante a navegação por dados, anamnese, notas, aplicações, resultados e consultas.

### 2.2 Módulos não podem funcionar como ilhas

Uma consulta criada na Agenda deve estar associada ao paciente correspondente. Uma aplicação Teko deve produzir resultados acessíveis no dashboard daquele paciente. Anamnese e notas clínicas devem permanecer vinculadas ao mesmo identificador individual.

### 2.3 Identificadores consistentes

As relações devem utilizar identificadores, principalmente:

- `patient_id`: identifica o paciente;
- `psychologist_id`: identifica/associa o profissional;
- `tenant_id`: delimita o ambiente ao qual os dados pertencem.

Evitar duplicar informações textuais apenas para representar relações. Dados de uma mesma pessoa devem ser recuperados por referência.

### 2.4 Multitenancy e acesso

Cada paciente deve possuir identificador único e estar vinculado ao profissional e ao tenant responsável. Esses vínculos sustentam separação dos ambientes e permissões de acesso.

### 2.5 Uma fonte de verdade

Uma entidade deve ser persistida uma única vez e reaproveitada nas diferentes visualizações. Exemplos:

- Dia, Semana e Mês consultam a mesma entidade `appointments`;
- próxima consulta é derivada de `appointments`, não duplicada no paciente;
- resultados exibidos no dashboard vêm do backend, não são recalculados independentemente no frontend.

---

## 3. Módulo PACIENTES

### 3.1 Papel

Pacientes é o **núcleo clínico da Teko** e a porta de entrada para as informações pertencentes a uma pessoa acompanhada.

```text
Paciente
│
├── Dados
├── Anamnese
├── Notas clínicas
├── Aplicações Teko
├── Resultados
└── Consultas
```

### 3.2 Responsabilidades

O módulo deve:

- listar pacientes disponíveis ao profissional dentro do tenant;
- buscar pacientes utilizando os mecanismos existentes;
- criar pacientes e gerar o identificador usado pelos demais módulos;
- editar informações cadastrais sem alterar vínculos históricos;
- excluir ou desativar conforme a regra adotada pela aplicação;
- abrir a ficha individual mantendo o contexto do paciente;
- controlar quais profissionais podem acessar seus registros;
- centralizar acesso à anamnese, notas, consultas, aplicações e resultados.

### 3.3 Relações

A relação profissional-paciente sustenta os demais vínculos:

```text
Psicólogo
   │
   └── Paciente
       ├── Anamnese
       ├── Notas
       ├── Consultas
       └── Aplicações Teko
```

As funcionalidades clínicas devem se conectar ao paciente por `patient_id`, além dos vínculos com profissional e tenant.

---

## 4. ANAMNESE

### 4.1 Conceito

A anamnese é um **documento estruturado, persistente e vinculado ao paciente**. Diferentes tipos de informação não devem ser acumulados em uma única caixa de texto. Cada categoria deve possuir posição estável e representação própria no modelo de dados.

### 4.2 Seções previstas

| Seção | Função |
|---|---|
| Identificação | Manter identificação utilizada no documento e associação ao paciente. |
| Queixa principal | Registrar o motivo central apresentado para acompanhamento ou avaliação. |
| Desenvolvimento | Organizar informações de desenvolvimento relatadas. |
| Histórico escolar | Registrar informações relacionadas à trajetória escolar. |
| Histórico familiar | Separar informações relevantes do contexto familiar. |
| Aspectos sociais | Concentrar observações relacionadas ao contexto social. |
| Sono | Registrar informações relacionadas ao sono. |
| Histórico de saúde | Organizar antecedentes e informações de saúde informados. |
| Medicação | Registrar dados de medicação de forma estruturada. |
| Acompanhamentos anteriores | Manter histórico de acompanhamentos relatados. |
| Observações | Informações complementares fora das categorias anteriores. |

### 4.3 Modelo conceitual

```text
anamnese
├── id
├── patient_id
├── psychologist_id
├── tenant_id
├── created_at
├── updated_at
├── queixa_principal
├── desenvolvimento
├── historico_escolar
├── historico_familiar
├── aspectos_sociais
├── sono
├── historico_medico
├── medicacao
└── observacoes
```

`created_at` registra criação e `updated_at` a última modificação.

### 4.4 Funcionalidades

A anamnese deve permitir:

- criar documento associado ao paciente selecionado;
- salvar manualmente;
- editar campos existentes sem criar novo documento a cada mudança;
- salvamento automático durante o preenchimento;
- mostrar data da última atualização;
- recuperar todo o conteúdo ao retornar ao paciente.

A experiência deve permitir iniciar, interromper e continuar o preenchimento sem perda de conteúdo.

### 4.5 Medicação

Dados mínimos:

```text
Medicação
├── Nome
├── Dose
├── Frequência
└── Observações
```

A informação estruturada poderá contextualizar o acompanhamento e resultados comportamentais. **A Teko não deve atribuir interpretação automática à medicação.**

---

## 5. NOTAS CLÍNICAS

### 5.1 Conceito

Notas clínicas diferem da anamnese:

- anamnese: documento estruturado que pode ser atualizado;
- notas: registros sucessivos e independentes produzidos durante o acompanhamento.

Uma nova nota **não substitui** as anteriores. O histórico cresce cronologicamente.

```text
Paciente
└── Notas
    ├── Nota 01
    ├── Nota 02
    ├── Nota 03
    └── ...
```

### 5.2 Categorias

- Sessão;
- Observação;
- Família;
- Escola;
- Avaliação;
- Medicação;
- Outro.

A categoria serve para organização e futura filtragem, sem restringir a escrita do profissional.

### 5.3 Modelo conceitual

```text
clinical_notes
├── id
├── patient_id
├── psychologist_id
├── tenant_id
├── category
├── title
├── content
├── created_at
└── updated_at
```

Cada nota deve possuir data, autor, categoria, título opcional e conteúdo.

### 5.4 Interface

Priorizar leitura rápida e criação simples:

```text
NOTAS CLÍNICAS
[ + Nova anotação ]

16/08/2026
Sessão
Paciente relatou...

09/08/2026
Família
Responsável informou...

02/08/2026
Observação
Durante a aplicação...
```

As notas devem ser exibidas cronologicamente, com categoria em destaque e prévia ou conteúdo completo conforme a decisão visual.

---

## 6. DASHBOARD DO PACIENTE

### 6.1 Objetivo

O dashboard transforma dados produzidos pelos jogos em visualizações organizadas para responder principalmente:

1. Como foi a aplicação selecionada?
2. Como as métricas do paciente estão se comportando ao longo das aplicações?

### 6.2 Separação entre cálculo e interface

O dashboard **não é responsável pelo cálculo principal das métricas**.

Fluxo obrigatório:

```text
Telemetria bruta
      ↓
Backend
      ↓
Cálculo psicométrico
      ↓
Resultado armazenado
      ↓
Dashboard
```

Centralizar cálculos no backend evita implementações divergentes entre dispositivos e fornece um único ponto para correções futuras.

O dashboard deve consumir resultados associados ao `patient_id` e à aplicação selecionada.

---

## 7. RESUMO DO DASHBOARD

A primeira camada de leitura deve apresentar:

- número total de aplicações;
- data da última aplicação;
- jogos realizados;
- indicadores principais mais recentes.

Indicadores:

| Jogo | Indicador principal | Papel |
|---|---|---|
| Goleiro | VTR | Medida principal mais recente do jogo. |
| Fotógrafo da Floresta | DV | Diferença de tempo médio entre os blocos da aplicação. |
| Toca Rápido! | Comissões | Quantidade de erros por comissão. |

Exemplo conceitual:

```text
RESUMO DO DESEMPENHO
Aplicações: 5
Última: 16/08/2026

GOLEIRO          FOTÓGRAFO        TOCA RÁPIDO!
VTR              DV               COMISSÕES
182 ms           +91 ms           3
```

O resumo não substitui o detalhamento; é uma porta de entrada para aplicação específica ou evolução.

---

## 8. RESULTADOS TEKO

A seção Resultados Teko inspeciona **uma aplicação específica**.

```text
Resultados Teko
│
├── Selecionar aplicação
│
├── Goleiro
├── Fotógrafo da Floresta
└── Toca Rápido!
```

A seleção deve utilizar o identificador da aplicação, ainda que a interface mostre uma data amigável. Nunca misturar resultados pertencentes a sessões diferentes.

---

## 9. JOGO GOLEIRO

### 9.1 Métrica principal

**VTR**.

### 9.2 Dados complementares

- TR médio;
- TR mediano;
- tentativas válidas;
- antecipações;
- omissões.

### 9.3 Preservação da telemetria

Os tempos de cada tentativa devem permanecer individualmente armazenados:

```text
Tentativa 1 → 432 ms
Tentativa 2 → 510 ms
Tentativa 3 → 397 ms
...
```

Isso permite revisar o conjunto usado no cálculo, recalcular métricas e produzir futuras visualizações sem perder o dado original.

### 9.4 Processamento conceitual

```text
Tempos válidos
      ↓
Desvio-padrão
      ↓
VTR
```

A interface apresenta o VTR e informações complementares da mesma aplicação; o backend preserva os tempos por tentativa como fonte auditável.

---

## 10. JOGO FOTÓGRAFO DA FLORESTA

### 10.1 Métrica principal

**DV**.

### 10.2 Dados apresentados

- TR médio Bloco 1;
- TR médio Bloco 2;
- DV;
- respostas válidas;
- omissões.

### 10.3 Organização temporal

A aplicação possui seis minutos, divididos em dois blocos de aproximadamente três minutos.

```text
Bloco 1 → TR médio B1
Bloco 2 → TR médio B2

DV = B2 - B1
```

O DV não deve ser exibido sem contexto quando a compreensão exigir os valores B1 e B2 que o originaram.

---

## 11. JOGO TOCA RÁPIDO!

### 11.1 Métrica principal

**Erros por comissão**.

### 11.2 Lógica Go/No-Go

```text
Cachorro → Go
Gato → No-Go

Clique indevido em estímulo No-Go
              ↓
          Comissão
```

### 11.3 Dados complementares

A interface pode apresentar:

- total de estímulos Go;
- total de estímulos No-Go;
- omissões Go;
- taxa de comissão;
- TR médio Go.

O resultado persistido deve permitir recuperar tanto a contagem principal quanto informações complementares da aplicação.

---

## 12. EVOLUÇÃO

### 12.1 Objetivo

Comparar aplicações diferentes do **mesmo paciente** e produzir leitura longitudinal.

```text
Paciente
├── Sessão 01
├── Sessão 02
├── Sessão 03
├── Sessão 04
└── Sessão 05
        ↓
Comparação longitudinal
```

A consulta deve utilizar sessões pertencentes ao mesmo `patient_id`, ordenadas por data ou ordem de aplicação.

### 12.2 Regra de visualização

**VTR, DV e comissões devem permanecer em gráficos independentes.**

São medidas diferentes e não devem compartilhar artificialmente a mesma escala.

### 12.3 Evolução do VTR

- sessões no eixo X;
- VTR no eixo Y;
- um VTR por aplicação válida.

Resumo:

- primeiro valor;
- último valor;
- maior valor;
- menor valor;
- média das aplicações selecionadas.

A análise assistida por IA pode aparecer abaixo do gráfico para descrever direção e oscilações, **sem transformar a série em diagnóstico**.

### 12.4 Evolução do DV

Um valor de DV por sessão.

Resumo:

- DV atual;
- DV anterior;
- média;
- maior valor;
- menor valor.

TR médio B1 e B2 podem aparecer paralelamente como apoio à interpretação do valor.

### 12.5 Evolução das comissões

Um valor de comissão por sessão.

Resumo:

- valor atual;
- média;
- máximo;
- mínimo;
- número de aplicações consideradas.

Manter a escala separada de VTR e DV.

---

## 13. INTELIGÊNCIA ARTIFICIAL NO DASHBOARD

### 13.1 Papel

A IA não deve ser uma área independente da navegação. É um **serviço interno do dashboard**, usado para produzir análise textual dos resultados já calculados.

### 13.2 Regra fundamental

> **O backend calcula; o LLM descreve.**

O LLM nunca deve ser tratado como fonte das métricas psicométricas.

### 13.3 Fluxo

```text
Dados do paciente
      +
Resultados Teko
      +
Histórico
      ↓
Backend Teko
      ↓
Contexto estruturado
      ↓
LLM
      ↓
Análise textual
      ↓
Psicólogo
```

### 13.4 Dados enviados ao LLM

A telemetria bruta **não deve ser enviada integralmente ao modelo**. Primeiro o backend processa os dados e produz VTR, DV, comissões, médias, variações e organização das sessões.

Exemplo conceitual de contexto:

```json
{
  "idade": 13,
  "vtr": [210, 195, 181],
  "dv": [120, 102, 95],
  "comissoes": [5, 4, 3]
}
```

### 13.5 Limites

A IA pode:

- descrever desempenho;
- apontar tendências presentes nos dados;
- destacar oscilações;
- facilitar a leitura profissional.

A IA **não deve**:

- substituir os cálculos determinísticos;
- produzir as métricas a partir da telemetria bruta;
- converter automaticamente séries em conclusões diagnósticas.

---

## 14. AGENDA

### 14.1 Conceito

A Agenda é independente dos jogos, porém conectada aos pacientes. Sua função é organizar compromissos profissionais e associar cada consulta à ficha da pessoa atendida.

Dia, Semana e Mês são **visualizações da mesma base**, não entidades independentes.

```text
AGENDA
├── Dia
├── Semana
├── Mês
└── Consulta
    └── Paciente
```

### 14.2 Entidade Consulta

Campos conceituais:

| Campo | Finalidade |
|---|---|
| ID | Identificar unicamente a consulta. |
| Psicólogo | Associar ao profissional responsável. |
| Paciente | Vincular à ficha correta. |
| Data | Definir o dia. |
| Hora inicial | Definir início do atendimento. |
| Hora final | Definir término previsto ou registrado. |
| Tipo | Classificar o tipo conforme a aplicação. |
| Status | Representar o estado atual. |
| Observação | Informação complementar do agendamento. |

---

## 15. AGENDA — DIA

Objetivo: mostrar a rotina imediata do profissional.

A consulta deve aparecer conforme seu horário e permitir reconhecimento do paciente sem exibir desnecessariamente toda a ficha clínica.

Exemplo:

```text
16 DE AGOSTO

08:00 - João
09:00 - Ana
10:30 - Lucas
14:00 - Pedro
```

Ações previstas:

- abrir detalhes da consulta;
- abrir ficha do paciente;
- editar compromisso;
- marcar consulta como realizada;
- cancelar consulta.

---

## 16. AGENDA — SEMANA

Objetivo: planejamento semanal.

As mesmas consultas da base são distribuídas pelos dias e horários da semana selecionada para permitir:

- identificar horários disponíveis;
- reorganizar compromissos;
- compreender carga semanal.

A visão semanal **não cria novos dados**.

---

## 17. AGENDA — MÊS

Objetivo: visão macro da agenda.

Cada dia pode mostrar a quantidade de compromissos. Ao selecionar um dia, o profissional deve acessar a visualização diária correspondente.

A visão mensal prioriza volume e localização temporal; detalhes ficam na visão diária ou na consulta.

---

## 18. PERSISTÊNCIA DAS CONSULTAS

Não criar estruturas independentes como:

```text
consulta_dia
consulta_semana
consulta_mes
```

Usar uma única entidade:

```text
appointments
```

A mesma tabela é consultada com filtros diferentes:

- Dia → filtra uma data;
- Semana → intervalo semanal;
- Mês → período mensal.

### 18.1 Operações CRUD

- criar consulta;
- ler/recuperar consulta;
- editar consulta;
- cancelar consulta;
- excluir consulta caso a regra da aplicação permita.

### 18.2 Status previstos

```text
Agendada
Realizada
Cancelada
Faltou
```

---

## 19. INTEGRAÇÃO AGENDA ↔ PACIENTE

Ao criar uma consulta, o profissional seleciona o paciente. A consulta guarda essa referência e passa a fazer parte tanto da Agenda quanto do contexto individual do paciente.

### 19.1 Próxima consulta

**Não armazenar próxima consulta como texto duplicado na ficha do paciente.**

Derivar a informação da tabela `appointments`:

```text
Paciente
   ↓
patient_id
   ↓
appointments futuras
   ↓
ordenar cronologicamente
   ↓
primeiro compromisso
   ↓
Próxima consulta
```

Consultas anteriores também devem ser recuperadas da mesma tabela.

Uma consulta é criada uma vez e reutilizada nas visualizações diária, semanal, mensal e individual.

---

## 20. PERFIL / CONFIGURAÇÕES

Perfil / Configurações deve permanecer como item principal da navegação da V1.

**Esta especificação não define:**

- campos;
- operações;
- regras internas;
- estrutura de dados;
- novas funcionalidades.

Não inventar arquitetura interna para este módulo como se fosse requisito confirmado. Sua especificação deverá ser definida posteriormente.

---

## 21. MODELO CONCEITUAL GLOBAL

A partir das relações explicitadas na arquitetura:

```text
TENANT
│
└── PROFISSIONAL / PSYCHOLOGIST
    │
    ├── PACIENTES
    │   │
    │   └── PATIENT
    │       ├── Dados
    │       ├── Anamnese
    │       ├── Clinical Notes
    │       ├── Appointments
    │       └── Teko Applications
    │           ├── Goleiro
    │           │   └── VTR + dados complementares + tentativas
    │           ├── Fotógrafo da Floresta
    │           │   └── DV + B1 + B2 + dados complementares
    │           └── Toca Rápido!
    │               └── Comissões + dados complementares
    │
    └── APPOINTMENTS
        └── referência ao paciente
```

Este desenho é uma representação consolidada das relações descritas no documento, não um esquema SQL definitivo.

---

## 22. FLUXO GLOBAL DE DADOS DOS JOGOS

```text
Paciente
   ↓
Aplicação Teko
   ↓
Jogo
   ↓
Telemetria bruta
   ↓
Persistência dos dados originais necessários
   ↓
Backend
   ↓
Cálculos determinísticos
   ↓
Resultados armazenados
   ↓
┌──────────────────────────┐
│ Dashboard                │
│ ├── Resumo               │
│ ├── Resultado da sessão  │
│ └── Evolução histórica   │
└──────────────────────────┘
   ↓
Contexto estruturado
   ↓
LLM
   ↓
Descrição assistida
   ↓
Profissional
```

---

## 23. REGRAS PARA IMPLEMENTAÇÃO POR LLMs

Ao utilizar este arquivo como contexto de uma IDE com IA, seguir obrigatoriamente estas regras:

1. **Preservar `patient_id`, `psychologist_id` e `tenant_id` como referências arquiteturais centrais quando aplicáveis.**
2. **Não duplicar entidades apenas porque existem múltiplas telas.**
3. **Não criar `consulta_dia`, `consulta_semana` e `consulta_mes`; usar `appointments`.**
4. **Não armazenar `proxima_consulta` como informação duplicada quando ela puder ser derivada de `appointments`.**
5. **Não realizar os cálculos principais das métricas no frontend.**
6. **Preservar dados brutos necessários à auditabilidade e recálculo das métricas.**
7. **Não usar o LLM para calcular VTR, DV ou comissões.**
8. **Enviar ao LLM preferencialmente contexto estruturado produzido pelo backend, e não toda a telemetria bruta.**
9. **Não transformar automaticamente resultados comportamentais em diagnóstico.**
10. **Manter VTR, DV e comissões em gráficos independentes.**
11. **Não misturar resultados de aplicações diferentes ao apresentar uma sessão específica.**
12. **Notas clínicas são registros independentes; criar uma nova nota não substitui notas anteriores.**
13. **Anamnese é um documento persistente e editável, não uma coleção de notas.**
14. **Alterações cadastrais do paciente não devem quebrar seus vínculos históricos.**
15. **Perfil / Configurações ainda não possui arquitetura interna definida neste escopo.**
16. Quando um requisito necessário não estiver definido neste documento, **não tratá-lo como requisito oficial da Teko sem validação**.

---

## 24. LIMITES DA ESPECIFICAÇÃO ATUAL

O documento-base da V1 **não especifica completamente** os seguintes elementos e, portanto, este arquivo também não os transforma em requisitos definitivos:

- esquema SQL final;
- tipos exatos de colunas;
- PKs e FKs formais além das relações conceituais;
- índices e constraints;
- políticas RLS;
- arquitetura completa de autenticação/autorização;
- endpoints de API;
- contratos completos de request/response;
- estrutura física dos serviços backend;
- formato integral da telemetria;
- fórmulas matemáticas completas além dos fluxos conceituais descritos;
- comportamento para aplicações incompletas;
- versionamento de fórmulas;
- prompts finais do LLM;
- modelo/provedor de IA;
- tratamento completo de falhas da IA;
- estratégia de privacidade/anonimização enviada ao modelo;
- logs e auditoria completos;
- backup;
- regras de exclusão lógica;
- requisitos internos de Perfil / Configurações.

Se o desenvolvimento alcançar algum desses pontos, a implementação deve ser tratada como **nova decisão arquitetural a validar**, e não como algo já estabelecido por este documento.

---

## 25. RESUMO OPERACIONAL PARA O AGENTE DE PROGRAMAÇÃO

Ao trabalhar na Teko, pense na arquitetura desta forma:

```text
PACIENTE = núcleo de identidade e relacionamento
ANAMNESE = documento clínico estruturado e persistente
NOTAS = histórico cronológico de registros independentes
APLICAÇÃO TEKO = sessão que agrega resultados dos jogos
TELEMETRIA = fonte original dos cálculos
BACKEND = responsável pelos cálculos determinísticos
DASHBOARD = responsável pela apresentação
EVOLUÇÃO = comparação longitudinal entre aplicações do mesmo paciente
LLM = responsável somente por análise textual assistida dos resultados processados
AGENDA = organização de appointments vinculados aos pacientes
TENANT = delimitação do ambiente de dados
```

Fluxo mental principal:

```text
Selecionar paciente
        ↓
Consultar/registrar contexto clínico
        ↓
Executar/consultar aplicações Teko
        ↓
Backend processa telemetria
        ↓
Dashboard apresenta resultados
        ↓
Evolução compara sessões
        ↓
IA pode descrever os dados processados

Em paralelo:

Agenda ↔ Appointments ↔ Patient
```

### Princípio final

A arquitetura da V1 deve permanecer simples e integrada. Cada módulo possui uma responsabilidade definida e compartilha referências consistentes. Informações clínicas, resultados e consultas não devem ser duplicados entre telas ou bancos separados.

**Paciente conecta o ecossistema. O backend calcula. O dashboard apresenta. O LLM descreve. A Agenda organiza.**
