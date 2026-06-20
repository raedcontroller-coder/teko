# TekoPorã — Especificação Técnica dos Módulos Lúdicos

**Protocolo de Implementação Telemétrica de Dinâmicas Lúdicas para Avaliação Psicométrica Neurocognitiva Infantil**
Versão 1.0 — FECAP / Técnico em Inteligência Artificial

---

## Índice

1. [Premissa Metodológica](#1-premissa-metodológica)
2. [Go/No-Go — Controle Inibitório](#2-gono-go--controle-inibitório)
3. [Lince — Atenção Seletiva Visual](#3-lince--atenção-seletiva-visual)
4. [Jogo da Bomba — Velocidade de Processamento](#4-jogo-da-bomba--velocidade-de-processamento)
5. [Uno — Flexibilidade Cognitiva](#5-uno--flexibilidade-cognitiva)
6. [Stop (Adedanha) — Velocidade de Busca Semântica](#6-stop-adedanha--velocidade-de-busca-semântica)
7. [Cara a Cara — Planejamento e Raciocínio Lógico](#7-cara-a-cara--planejamento-e-raciocínio-lógico)
8. [Quebra-Cabeça — Percepção Visuoespacial](#8-quebra-cabeça--percepção-visuoespacial)
9. [Jogo do Desenho — Controle Motor e Impulsividade Grafomotora](#9-jogo-do-desenho--controle-motor-e-impulsividade-grafomotora)
10. [Quadro Consolidado](#10-quadro-consolidado)
11. [Stack Técnica Global](#11-stack-técnica-global)

---

## 1. Premissa Metodológica

Cada dinâmica lúdica do Teko é calibrada para mensurar **um único construto psicométrico primário**. Esta decisão se fundamenta em três pilares:

**Validade de construto.** Tarefas cognitivas com demanda homogênea produzem medidas mais fidedignas — quanto menos variáveis concorrem pelo sistema de mensuração, maior a precisão do construto avaliado (Miyake et al., 2000).

**Interpretabilidade clínica.** Scores vinculados a um único construto são diretamente acionáveis para o psicólogo. Scores compostos não decompostos reduzem a utilidade clínica do relatório.

**Viabilidade de implementação.** Mecânicas de jogo projetadas em torno de uma variável-alvo única eliminam conflitos entre múltiplos paradigmas de coleta simultânea.

Construtos secundários que uma dinâmica possa tangenciar são tratados como **variáveis de enriquecimento do perfil**, não como métricas primárias da sessão.

---

## 2. Go/No-Go — Controle Inibitório

### 2.1 Construto Primário

**Controle inibitório** — capacidade de suprimir respostas motoras prepotentes diante de sinais de restrição. Componente central das funções executivas descrito por Miyake et al. (2000) como *inhibition*.

### 2.2 Funcionamento da Dinâmica

Estímulos visuais (ex.: figuras de animais) aparecem em sequência rápida na tela. A criança deve:

- **Tocar** a tela quando o estímulo-alvo aparecer (sinal **Go**)
- **Inibir** o toque quando qualquer outro estímulo aparecer (sinal **No-Go**)

**Parâmetros de sessão:**

| Parâmetro | Valor |
|-----------|-------|
| Proporção Go | 70% dos estímulos |
| Proporção No-Go | 30% dos estímulos |
| ISI (Intervalo Inter-Estímulo) | 500 – 1.500 ms (aleatorizado) |
| Janela de resposta válida | 1.000 ms após onset do estímulo |
| Posição do estímulo | Centralizada e fixa |

### 2.3 Lógica de Jogo

```
INÍCIO DA SESSÃO
│
├── Pseudoaleatorização da sequência de estímulos por blocos
│
└── LOOP DE ESTÍMULOS
    │
    ├── Exibir estímulo (onset registrado com ±10 ms)
    │
    ├── SE estímulo Go:
    │   ├── Toque dentro de 1.000 ms → Acerto (hit)
    │   └── Sem toque em 1.000 ms → Omissão (miss)
    │
    ├── SE estímulo No-Go:
    │   ├── Toque dentro de 1.000 ms → Erro de Comissão (falso alarme)
    │   └── Sem toque em 1.000 ms → Rejeição Correta
    │
    └── Registrar: { timestamp_onset, timestamp_toque, tipo_estímulo, tipo_resposta }
```

### 2.4 Método de Coleta Telemétrica

O sistema registra com timestamp em milissegundos **cada evento de toque na tela**. Eventos de toque em janelas de tempo de estímulos No-Go são classificados como **erros de comissão**.

**Schema do evento:**
```json
{
  "sessionId": "string",
  "gameId": "gonogo",
  "eventType": "stimulus_response",
  "timestamp": 1234567890123,
  "payload": {
    "stimulusType": "go | nogo",
    "stimulusOnset": 1234567890000,
    "responseTimestamp": 1234567890300,
    "responseType": "hit | miss | commission | correct_rejection",
    "reactionTime": 300
  }
}
```

### 2.5 Métricas Quantitativas

**Métrica primária:**

$$TEC = \frac{\text{Toques em estímulos No-Go}}{\text{Total de estímulos No-Go}} \times 100$$

**Taxa de Erros de Comissão (TEC)** — expressa em percentual (%). Valores elevados indicam dificuldade de controle inibitório.

**Métricas secundárias (enriquecimento):**

| Métrica | Fórmula | Unidade |
|---------|---------|---------|
| Taxa de Omissões (TO) | Omissões / Total Go × 100 | % |
| Tempo de Reação Médio (TRM) | Média dos RT em acertos Go | ms |
| d' (índice de sensibilidade) | Z(hit rate) − Z(false alarm rate) | adimensional |

### 2.6 Stack Técnica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Renderização | `@shopify/react-native-skia` | Controle preciso de onset/offset do estímulo (±10 ms) |
| Timestamps | `performance.now()` | Alta resolução (±1 ms), imune a ajustes de relógio |
| Gestos | `react-native-gesture-handler` | Captura de toque com timestamp nativo |
| Telemetria | Hook `useTelemetry()` customizado | Fila JSON com schema fixo |
| Aleatorização | Lógica TypeScript (Fisher-Yates por bloco) | Controle de efeitos de ordem |

**Diretrizes de implementação:**

- Estímulos em posição centralizada e fixa para eliminar variáveis de rastreamento visual
- Onset e offset registrados com precisão de ±10 ms via timestamp do sistema
- Sequência pseudoaleatorizada por blocos

---

## 3. Lince — Atenção Seletiva Visual

### 3.1 Construto Primário

**Atenção seletiva visual** — capacidade de identificar e discriminar um estímulo-alvo em um campo visual com múltiplos distratores competindo pela atenção. Replica o paradigma de busca visual (*visual search*) do instrumento TAVIS-4.

### 3.2 Funcionamento da Dinâmica

Um tabuleiro com **64 a 81 figuras distintas** é exibido na tela. Uma carta-estímulo com a figura-alvo é revelada no topo. A criança deve tocar na figura correspondente no tabuleiro o mais rapidamente possível. Cada rodada apresenta um novo alvo.

**Parâmetros de sessão:**

| Parâmetro | Valor |
|-----------|-------|
| Figuras no tabuleiro | 64 – 81 |
| Tamanho mínimo de toque por figura | 44 × 44 dp |
| Animação de reveal da carta-estímulo | 300 ms (duração fixa) |
| Início da contagem do TR | Após o fim da animação de reveal |
| Disposição do tabuleiro | Randomizada a cada rodada |

### 3.3 Lógica de Jogo

```
INÍCIO DA RODADA
│
├── Randomizar posições das figuras no tabuleiro
├── Revelar carta-estímulo (animação 300 ms)
├── t₀ = timestamp após fim da animação (onset de busca)
│
└── AGUARDAR TOQUE
    │
    ├── Toque na figura CORRETA:
    │   ├── t₁ = timestamp do toque
    │   ├── TRR = t₁ − t₀
    │   └── → PRÓXIMA RODADA
    │
    └── Toque na figura INCORRETA:
        ├── Registrar como erro de seleção
        └── → CONTINUAR AGUARDANDO TOQUE
```

### 3.4 Método de Coleta Telemétrica

O sistema registra o **timestamp do onset da carta-estímulo** e o **timestamp do toque** no tabuleiro. A diferença constitui o Tempo de Reação por Rodada (TRR).

**Schema do evento:**
```json
{
  "sessionId": "string",
  "gameId": "lince",
  "eventType": "round_response",
  "timestamp": 1234567890123,
  "payload": {
    "roundIndex": 1,
    "targetFigure": "cachorro",
    "stimulusOnset": 1234567890000,
    "responseTimestamp": 1234567890850,
    "responseType": "correct | selection_error",
    "reactionTime": 850,
    "touchPosition": { "x": 240, "y": 380 }
  }
}
```

### 3.5 Métricas Quantitativas

**Métrica primária:**

$$TRR_i = t_{\text{toque},i} - t_{\text{onset},i} \quad \text{(ms)}$$

$$TRR_{\text{sessão}} = \text{Mediana}(TRR_1, TRR_2, \ldots, TRR_n)$$

A **mediana** é escolhida por ser robusta a outliers de distração pontual.

**Métricas secundárias:**

| Métrica | Fórmula | Unidade |
|---------|---------|---------|
| Taxa de Erros de Seleção (TES) | Erros / Total de Rodadas × 100 | % |
| CV do TRR | DP(TRR) / Média(TRR) | adimensional |
| TRR por quartil de rodada | Mediana por bloco de 25% das rodadas | ms |

### 3.6 Stack Técnica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Renderização | `@shopify/react-native-skia` | Canvas 2D com controle de frame para animação de reveal |
| Timestamps | `performance.now()` | Precisão ±1 ms para onset pós-animação |
| Gestos | `react-native-gesture-handler` | Captura de posição e timestamp do toque |
| Randomização | TypeScript nativo | Shuffling do array de figuras a cada rodada |

**Diretrizes de implementação:**

- Tamanho mínimo de toque: **44 × 44 dp** por figura (guideline iOS/Android)
- A carta-estímulo é exibida com animação de reveal de **300 ms fixos**; o TR começa após o fim da animação
- Disposição das figuras randomizada a cada rodada para evitar aprendizado posicional

---

## 4. Jogo da Bomba — Velocidade de Processamento

### 4.1 Construto Primário

**Velocidade de processamento** — eficiência com que o sistema cognitivo recupera e seleciona informações semânticas da memória de longo prazo sob demanda temporal explícita. Correlaciona-se com a variável de velocidade psicomotora do CNS-VS.

### 4.2 Funcionamento da Dinâmica

Uma categoria semântica é exibida na tela (ex.: *frutas*, *animais*, *profissões*) junto a um **timer visual decrescente que acelera progressivamente**. A criança toca no botão de microfone e verbaliza uma palavra válida para a categoria antes do timer expirar.

**Parâmetros de sessão:**

| Parâmetro | Valor |
|-----------|-------|
| Timer inicial (5–7 anos) | 8 segundos |
| Timer inicial (8–12 anos) | 5 segundos |
| Progressão do timer | Aceleração configurável por sessão |
| Resposta sem fala no tempo limite | Codificada como omissão |

### 4.3 Lógica de Jogo

```
INÍCIO DA RODADA
│
├── Exibir categoria semântica
├── t₀ = timestamp de exibição da categoria
├── Iniciar timer visual decrescente
│
└── AGUARDAR ATIVAÇÃO DO MICROFONE
    │
    ├── Ativação antes do timeout:
    │   ├── t₁ = timestamp de onset da fala
    │   ├── TRS = t₁ − t₀
    │   └── → PRÓXIMA RODADA
    │
    └── Timeout sem resposta:
        ├── Registrar como omissão
        └── → PRÓXIMA RODADA (timer mais curto)
```

### 4.4 Método de Coleta Telemétrica

O sistema registra o **timestamp de exibição de cada categoria** e o **timestamp de ativação do microfone** (onset da resposta verbal). Apenas o onset de áudio é necessário para a métrica primária — não há processamento de conteúdo em tempo real.

**Schema do evento:**
```json
{
  "sessionId": "string",
  "gameId": "bomba",
  "eventType": "semantic_response",
  "timestamp": 1234567890123,
  "payload": {
    "roundIndex": 3,
    "category": "animais",
    "categoryDisplayTimestamp": 1234567890000,
    "micActivationTimestamp": 1234567891200,
    "responseType": "responded | omission",
    "semanticResponseTime": 1200,
    "timerDuration": 5000
  }
}
```

### 4.5 Métricas Quantitativas

**Métrica primária:**

$$TRS_i = t_{\text{mic},i} - t_{\text{categoria},i} \quad \text{(ms)}$$

A distribuição do TRS ao longo das rodadas é analisada para identificar a **curva de aceleração/deterioração sob pressão crescente**.

**Métricas secundárias:**

| Métrica | Descrição | Unidade |
|---------|-----------|---------|
| Taxa de Omissões (TO) | Omissões / Total de Rodadas × 100 | % |
| Slope do TRS | Regressão linear do TRS ao longo das rodadas | ms/rodada |
| TRS por bloco | Mediana por quartil de rodadas | ms |

### 4.6 Stack Técnica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Voz | `expo-speech-recognition` ou `@react-native-voice/voice` | Captura de onset de fala com timestamp nativo |
| Timestamps | `performance.now()` | Precisão ±1 ms |
| Timer visual | `react-native-reanimated v3` | Animação de contagem regressiva no UI thread |
| Configuração etária | Props por faixa etária (5–7, 8–12) | Adaptação do timer |

**Diretrizes de implementação:**

- O reconhecimento de voz captura apenas o **onset do áudio** (timestamp de início), sem processamento de conteúdo em tempo real
- O timer visual deve ter duração configurável por faixa etária
- A aceleração progressiva do timer é parametrizada no início da sessão

---

## 5. Uno — Flexibilidade Cognitiva

### 5.1 Construto Primário

**Flexibilidade cognitiva** — capacidade de alternar entre critérios de classificação em resposta a mudanças de regra do ambiente. Componente *shifting* do modelo de Miyake et al. (2000).

### 5.2 Funcionamento da Dinâmica

Jogo de turno único contra um **oponente virtual (bot)**. Cada turno exibe a carta do topo da pilha e a mão de cartas da criança. A regra muda a cada jogada (cor, número ou tipo de carta válida), exigindo adaptação contínua do critério de seleção.

**Parâmetros de sessão:**

| Parâmetro | Valor |
|-----------|-------|
| Latência artificial do bot | 1.500 ms por turno (fixo) |
| Layout da mão de cartas | Fixo e ordenado |
| Estado de regras vigentes | Sempre visível na interface |
| Cartas de ação | Pular, reverter, +2, +4 (introduzem mudanças de regra adicionais) |

### 5.3 Lógica de Jogo

```
INÍCIO DO TURNO
│
├── Exibir carta do topo da pilha
├── t₀ = timestamp de início do turno
├── Exibir mão de cartas da criança
│
└── AGUARDAR SELEÇÃO DE CARTA
    │
    ├── Seleção de carta VÁLIDA:
    │   ├── t₁ = timestamp de seleção
    │   ├── LDT = t₁ − t₀
    │   ├── SE turno após carta de ação do bot → marcar como "pós-alternância"
    │   └── → TURNO DO BOT (latência 1.500 ms) → PRÓXIMO TURNO
    │
    └── Seleção de carta INVÁLIDA:
        ├── Registrar erro de comissão de flexibilidade
        └── → CONTINUAR AGUARDANDO SELEÇÃO
```

### 5.4 Método de Coleta Telemétrica

O sistema registra, por turno, o **timestamp de início** (exibição da carta do topo) e o **timestamp de seleção** da carta pela criança.

**Schema do evento:**
```json
{
  "sessionId": "string",
  "gameId": "uno",
  "eventType": "turn_decision",
  "timestamp": 1234567890123,
  "payload": {
    "turnIndex": 7,
    "topCard": { "color": "red", "value": "7" },
    "selectedCard": { "color": "red", "value": "3" },
    "isValid": true,
    "isPostShift": true,
    "turnStartTimestamp": 1234567889000,
    "selectionTimestamp": 1234567890123,
    "decisionLatency": 1123
  }
}
```

### 5.5 Métricas Quantitativas

**Métrica primária:**

$$LDT_i = t_{\text{seleção},i} - t_{\text{início turno},i} \quad \text{(ms)}$$

**Switch Cost (custo de alternância):**

$$SC = \overline{LDT}_{\text{pós-alternância}} - \overline{LDT}_{\text{baseline}}$$

O aumento da LDT em turnos subsequentes a cartas de ação do oponente é o indicador de **custo de alternância cognitiva**.

**Métricas secundárias:**

| Métrica | Descrição | Unidade |
|---------|-----------|---------|
| Taxa de Erros de Flexibilidade (TEF) | Jogadas inválidas / Total de turnos × 100 | % |
| LDT Baseline | Mediana dos turnos sem mudança de regra | ms |
| LDT Pós-Shift | Mediana dos turnos após cartas de ação | ms |

### 5.6 Stack Técnica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Gestão de estados | `XState v5` | Modelagem explícita de estados, transições e regras de turno |
| Renderização | React Native (componentes padrão) | Jogo orientado a estado, não a frame |
| Bot | Lógica TypeScript com `setTimeout(1500)` | Latência artificial fixa para padronizar o ritmo |
| Timestamps | `performance.now()` | Precisão ±1 ms |

**Diretrizes de implementação:**

- O bot joga com latência artificial **fixa de 1.500 ms** por turno para eliminar variabilidade induzida pelo oponente
- A mão de cartas exibe **layout fixo e ordenado** para eliminar carga cognitiva de organização
- O estado completo de regras vigentes (cor/número atual) é sempre visível para isolar a flexibilidade da memória de trabalho das regras

---

## 6. Stop (Adedanha) — Velocidade de Busca Semântica

### 6.1 Construto Primário

**Velocidade de busca semântica e fluência verbal** — eficiência de recuperação lexical a partir de uma restrição fonológica inicial (letra) dentro de um domínio semântico específico (categoria). Relaciona-se ao paradigma RAN (*Rapid Automatized Naming*) do instrumento LET.

### 6.2 Funcionamento da Dinâmica

Uma **letra é sorteada** e exibida na tela junto a uma **única categoria semântica** por rodada (ex.: letra *B*, categoria *animal*). A criança tem tempo fixo para digitar ou verbalizar uma palavra válida. A restrição de uma categoria por rodada isola a busca semântica de sobrecarga multitarefa.

**Parâmetros de sessão:**

| Parâmetro | Valor |
|-----------|-------|
| Timeout por rodada | 10 segundos (fixo) |
| Modalidade de resposta (≥8 anos) | Digitação |
| Modalidade de resposta (<8 anos) | Voz |
| Validação | Offline por dicionário local (letra × categoria) |
| Banco de palavras | Pré-carregado localmente |

### 6.3 Lógica de Jogo

```
INÍCIO DA RODADA
│
├── Sortear letra
├── Selecionar categoria semântica
├── t₀ = timestamp de exibição do par letra/categoria
├── Iniciar timer de 10 segundos
│
└── AGUARDAR RESPOSTA
    │
    ├── Primeiro toque no teclado OU ativação do microfone:
    │   ├── t₁ = timestamp de onset da resposta
    │   ├── TAL = t₁ − t₀
    │   └── → Aguardar submissão completa → Validar offline → PRÓXIMA RODADA
    │
    └── Timeout (10s sem resposta):
        ├── Registrar como omissão
        └── → PRÓXIMA RODADA
```

### 6.4 Método de Coleta Telemétrica

O sistema registra o **timestamp de exibição do par letra/categoria** e o **timestamp de onset da resposta** (primeiro toque no teclado ou ativação do microfone). A validação semântica e ortográfica é realizada offline após a sessão.

**Schema do evento:**
```json
{
  "sessionId": "string",
  "gameId": "stop",
  "eventType": "lexical_response",
  "timestamp": 1234567890123,
  "payload": {
    "roundIndex": 5,
    "letter": "B",
    "category": "animal",
    "displayTimestamp": 1234567890000,
    "responseOnsetTimestamp": 1234567892300,
    "lexicalAccessTime": 2300,
    "responseText": "borboleta",
    "responseMode": "typing | voice",
    "letterFrequency": "high | low",
    "isValid": true,
    "isOmission": false
  }
}
```

### 6.5 Métricas Quantitativas

**Métrica primária:**

$$TAL_i = t_{\text{onset resposta},i} - t_{\text{exibição},i} \quad \text{(ms)}$$

**Índice de amplitude do léxico mental ativo:**

$$\Delta TAL = \overline{TAL}_{\text{letras baixa frequência}} - \overline{TAL}_{\text{letras alta frequência}}$$

Valores elevados de ΔT AL indicam léxico mental menos robusto.

**Métricas secundárias:**

| Métrica | Descrição | Unidade |
|---------|-----------|---------|
| Taxa de Omissões (TO) | Omissões / Total de Rodadas × 100 | % |
| Taxa de Erros Semânticos (TES) | Respostas inválidas / Total respondido × 100 | % |
| TAL por frequência de letra | Mediana separada por alta/baixa frequência | ms |

### 6.6 Stack Técnica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Voz | `expo-speech-recognition` | Onset de fala com timestamp para crianças <8 anos |
| Teclado | TextInput nativo React Native | Captura de primeiro keystroke para crianças ≥8 anos |
| Validação | Dicionário JSON local | Validação offline sem dependência de rede |
| Timestamps | `performance.now()` | Precisão ±1 ms |
| Estado | `XState v5` | Fluxo de turno: exibição → resposta → validação → próxima rodada |

**Diretrizes de implementação:**

- Interface com **duas modalidades de resposta** configuráveis pelo profissional
- Banco de palavras válidas pré-carregado localmente para **validação offline**
- Timeout fixo de **10 segundos** por rodada
- Letras de alta frequência (A, M, P) e baixa frequência (X, Z, W) são balanceadas na sequência de rodadas

---

## 7. Cara a Cara — Planejamento e Raciocínio Lógico

### 7.1 Construto Primário

**Raciocínio lógico hipotético-dedutivo e planejamento** — capacidade de formular hipóteses que maximizam a eliminação de alternativas por pergunta, exigindo raciocínio probabilístico e antecipação. Relaciona-se ao componente de função executiva complexa do CNS-VS.

### 7.2 Funcionamento da Dinâmica

A criança joga contra um oponente virtual (bot) com um conjunto de **24 personagens**. A criança escolhe uma pergunta por turno a partir de opções apresentadas na tela (ex.: *É homem?*, *Tem chapéu?*, *Usa óculos?*). Com base na resposta do bot, ela elimina personagens do tabuleiro. Objetivo: identificar o personagem do oponente com o **menor número de perguntas**.

**Parâmetros de sessão:**

| Parâmetro | Valor |
|-----------|-------|
| Total de personagens | 24 |
| Respostas do bot | Sempre verídicas (sem blefe) |
| Personagens eliminados | Exibidos esmaecidos no tabuleiro |
| Perguntas disponíveis | Apresentadas como botões com ícones visuais |

### 7.3 Lógica de Jogo

```
INÍCIO DA PARTIDA
│
├── Bot seleciona personagem secreto aleatoriamente
├── Criança recebe tabuleiro completo com 24 personagens
│
└── LOOP DE TURNOS
    │
    ├── t₀ = timestamp de início do turno
    ├── Exibir opções de perguntas disponíveis
    │
    ├── Criança seleciona pergunta:
    │   ├── t₁ = timestamp de seleção
    │   ├── LDT = t₁ − t₀
    │   ├── Bot responde (Sim/Não)
    │   ├── Personagens incompatíveis são esmaecidos
    │   ├── n_eliminados = personagens eliminados por esta pergunta
    │   ├── n_restantes_antes = personagens antes desta pergunta
    │   └── EE = n_eliminados / n_restantes_antes
    │
    └── SE apenas 1 personagem restante → FIM DA PARTIDA
```

### 7.4 Método de Coleta Telemétrica

O sistema registra, por turno: o timestamp de início, o timestamp de seleção da pergunta, a pergunta selecionada e o número de personagens eliminados.

**Schema do evento:**
```json
{
  "sessionId": "string",
  "gameId": "caraacara",
  "eventType": "turn_question",
  "timestamp": 1234567890123,
  "payload": {
    "turnIndex": 3,
    "turnStartTimestamp": 1234567889000,
    "questionSelectedTimestamp": 1234567890123,
    "decisionLatency": 1123,
    "questionAsked": "Tem chapéu?",
    "botAnswer": true,
    "charactersBeforeQuestion": 12,
    "charactersEliminated": 7,
    "eliminationRatio": 0.583
  }
}
```

### 7.5 Métricas Quantitativas

**Métrica primária:**

$$EE_i = \frac{n_{\text{eliminados},i}}{n_{\text{restantes antes},i}}$$

$$EEM = \frac{1}{n_{\text{turnos}}} \sum_{i=1}^{n} EE_i \times 100\%$$

**Índice de Planejamento Lógico (IPL):**

$$IPL = \frac{EEM_{\text{criança}}}{EEM_{\text{ótima teórica}}} \times 100$$

A EEM ótima teórica corresponde à estratégia que elimina 50% dos personagens restantes a cada turno (estratégia *binary search*).

**Métricas secundárias:**

| Métrica | Descrição | Unidade |
|---------|-----------|---------|
| Total de Turnos (TT) | Número de perguntas até identificar o personagem | perguntas |
| Latência Média de Decisão (LMD) | Média dos LDT ao longo dos turnos | ms |
| Turnos até Convergência | Número de turnos para reduzir para ≤3 personagens | perguntas |

### 7.6 Stack Técnica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Estado | `XState v5` | Modelagem de estados: tabuleiro completo → eliminações → convergência |
| Lógica do bot | TypeScript nativo | Bot determinístico com respostas sempre verídicas |
| Renderização | React Native (componentes padrão) | Interface de botões com labels e ícones |
| Timestamps | `performance.now()` | Precisão ±1 ms |

**Diretrizes de implementação:**

- Perguntas disponíveis apresentadas como **botões com labels claros e ícones visuais**
- Personagens eliminados exibidos **esmaecidos** para reduzir carga de memória de trabalho
- O bot responde sempre de forma **verídica** — não há elemento de blefe

---

## 8. Quebra-Cabeça — Percepção Visuoespacial

### 8.1 Construto Primário

**Percepção visuoespacial** — capacidade de analisar relações espaciais entre formas, orientar peças mentalmente e identificar correspondências geométricas e cromáticas. Relaciona-se ao domínio de percepção visuoespacial dos instrumentos TAVIS-4 e CNS-VS.

### 8.2 Funcionamento da Dinâmica

Um quebra-cabeça de **12 a 25 peças** é exibido com as peças embaralhadas em uma área de origem. A **imagem-referência completa** é sempre visível em miniatura. A criança arrasta e encaixa as peças por toque. O sistema detecta automaticamente encaixes corretos (*snap*) e tentativas incorretas.

**Parâmetros de sessão:**

| Parâmetro | Valor |
|-----------|-------|
| Número de peças | 12 – 25 |
| Área mínima de toque por peça | 60 × 60 dp |
| Snap zone (raio de encaixe correto) | 20 dp |
| Imagem-referência | Sempre visível (não pode ser ocultada) |

### 8.3 Lógica de Jogo

```
INÍCIO DA SESSÃO
│
├── Embaralhar peças na área de origem
├── Exibir imagem-referência em miniatura
│
└── LOOP DE TENTATIVAS
    │
    ├── Criança seleciona uma peça e arrasta para posição:
    │   ├── SE dentro do snap zone (20 dp da posição correta):
    │   │   ├── Registrar: encaixe correto na PRIMEIRA tentativa ou posterior
    │   │   └── Animar snap → peça encaixada
    │   │
    │   └── SE fora do snap zone:
    │       ├── Registrar: tentativa incorreta
    │       └── Peça retorna à área de origem
    │
    ├── Tentativas incorretas consecutivas na mesma peça
    │   → Agrupadas como episódio de encaixe forçado
    │
    └── SE todas as peças encaixadas → FIM
        └── Registrar: tempo total de conclusão
```

### 8.4 Método de Coleta Telemétrica

O sistema registra **cada tentativa de encaixe**: timestamp, peça selecionada, posição de destino e resultado (correto/incorreto).

**Schema do evento:**
```json
{
  "sessionId": "string",
  "gameId": "quebracabeca",
  "eventType": "piece_placement",
  "timestamp": 1234567890123,
  "payload": {
    "pieceId": "piece_07",
    "attemptIndex": 2,
    "isFirstAttempt": false,
    "destinationPosition": { "x": 340, "y": 220 },
    "correctPosition": { "x": 350, "y": 215 },
    "distanceFromCorrect": 11.2,
    "result": "correct | incorrect",
    "isSnapZoneHit": true,
    "cumulativeIncorrectForPiece": 1
  }
}
```

### 8.5 Métricas Quantitativas

**Métrica primária:**

$$IEP = \frac{\text{Encaixes corretos na primeira tentativa}}{\text{Total de peças}} \times 100\%$$

Um IEP de 100% indica que a criança identificou corretamente a posição de cada peça antes de tentar o encaixe, sem recorrer a tentativa e erro.

**Métricas secundárias:**

| Métrica | Descrição | Unidade |
|---------|-----------|---------|
| Tempo Total de Conclusão (TTC) | Da primeira peça movida ao último snap | s |
| Média de Tentativas por Peça (MTP) | Total de tentativas / Total de peças | tentativas |
| Episódios de Encaixe Forçado (EEF) | Grupos de ≥3 tentativas incorretas consecutivas na mesma peça | eventos |

### 8.6 Stack Técnica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Renderização | `@shopify/react-native-skia` | Canvas 2D para animação de snap e drag preciso |
| Gestos | `react-native-gesture-handler` | Drag-and-drop com posição e velocidade |
| Snap detection | Lógica TypeScript (distância euclidiana) | Raio configurável de 20 dp |
| Timestamps | `performance.now()` | Precisão ±1 ms |

**Diretrizes de implementação:**

- Área de toque mínima por peça: **60 × 60 dp**
- Snap zone calibrada como raio de **20 dp** para evitar falsos negativos por imprecisão motora fina
- A imagem-referência é **sempre visível** — o construto de interesse é visuoespacial, não de memória

---

## 9. Jogo do Desenho — Controle Motor e Impulsividade Grafomotora

### 9.1 Construto Primário

**Controle motor e impulsividade grafomotora** — capacidade de regular velocidade, pressão e direção dos movimentos motores finos em uma tarefa estruturada com limites físicos definidos. Avalia o controle inibitório motor, distinto do controle inibitório cognitivo do Go/No-Go.

### 9.2 Funcionamento da Dinâmica

A criança recebe uma tarefa de desenho **estruturada e não projetiva**: reproduzir uma figura geométrica composta (ex.: casa com janela, porta e telhado triangular) dentro de uma área delimitada, usando o dedo como instrumento. A figura-modelo é exibida ao lado **durante toda a tarefa**.

**Parâmetros de sessão:**

| Parâmetro | Valor |
|-----------|-------|
| Figura-modelo | Sempre visível na mesma escala e proporção da área de reprodução |
| Área de desenho | Bordas visualmente destacadas |
| Proxy de pressão (sem suporte a force) | Velocidade de traço |
| Limiar de impulsividade | Percentil 90 da velocidade média da sessão |

### 9.3 Lógica de Jogo

```
INÍCIO DA TAREFA
│
├── Exibir figura-modelo ao lado da área de desenho
├── Iniciar captura de telemetria de traço
│
└── LOOP DE TRAÇOS
    │
    ├── Para cada segmento de traço (touch move event):
    │   ├── Registrar posição (x, y), timestamp, pressão (force), velocidade angular
    │   ├── SE posição fora dos limites da área delimitada:
    │   │   └── Registrar boundary crossing event
    │   └── SE velocidade > limiar de impulsividade (P90):
    │       └── Marcar segmento como impulsivo
    │
    └── Toque levantado (touch end) → segmento encerrado
        └── SE criança para de desenhar → FIM DA TAREFA
```

### 9.4 Método de Coleta Telemétrica

O sistema registra, por segmento de traço: velocidade angular (dp/ms), pressão (force 0–1 em dispositivos compatíveis), eventos de saída dos limites (boundary crossing) e segmentos com velocidade acima do limiar de impulsividade.

**Schema do evento (por segmento):**
```json
{
  "sessionId": "string",
  "gameId": "desenho",
  "eventType": "stroke_segment",
  "timestamp": 1234567890123,
  "payload": {
    "segmentIndex": 42,
    "position": { "x": 180, "y": 290 },
    "angularVelocity": 2.4,
    "pressure": 0.65,
    "isBoundaryCrossing": false,
    "isImpulsiveSegment": true,
    "velocityThreshold": 2.1
  }
}
```

**Schema do evento de boundary crossing:**
```json
{
  "sessionId": "string",
  "gameId": "desenho",
  "eventType": "boundary_crossing",
  "timestamp": 1234567890500,
  "payload": {
    "crossingIndex": 3,
    "position": { "x": 402, "y": 215 },
    "velocityAtCrossing": 3.8
  }
}
```

### 9.5 Métricas Quantitativas

**Métrica primária:**

$$TCL = \frac{\text{Número de boundary crossings}}{\text{Tempo total da tarefa (s)}} \quad \text{(eventos/s)}$$

Valores elevados de TCL indicam **baixo controle motor inibitório** e tendência grafomotora impulsiva.

**Métricas secundárias:**

| Métrica | Descrição | Unidade |
|---------|-----------|---------|
| Velocidade Angular Média (VAM) | Média de dp/ms ao longo de todos os segmentos | dp/ms |
| Pressão Média (PM) | Média de force (0–1) — apenas iOS/Android com suporte | adimensional |
| Taxa de Segmentos Impulsivos (TSI) | Segmentos acima do P90 / Total de segmentos × 100 | % |
| Total de Boundary Crossings (TBC) | Contagem absoluta de eventos de saída de limite | eventos |

### 9.6 Stack Técnica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Renderização | `@shopify/react-native-skia` | Canvas 2D para desenho em tempo real com captura de traço |
| Gestos | `react-native-gesture-handler` | Acesso a `force`, `x`, `y`, `velocityX`, `velocityY` por evento |
| Pressão | API nativa (iOS: `force`, Android: `pressure`) | Captura de 0–1 quando disponível |
| Fallback web | Velocidade de traço como proxy de pressão | Para dispositivos sem suporte a force |
| Timestamps | `performance.now()` | Precisão ±1 ms por segmento de traço |

**Diretrizes de implementação:**

- Em dispositivos **sem suporte a pressure** (ex.: web via mouse), a variável de pressão é substituída pela velocidade de traço como proxy
- A área de desenho deve ter **bordas visualmente destacadas**
- A figura-modelo é exibida com **escala e proporções idênticas** à área de reprodução (sem demanda de transformação mental de escala)

---

## 10. Quadro Consolidado

| Dinâmica | Construto Primário | Métrica Principal | Unidade | Engine |
|----------|-------------------|-------------------|---------|--------|
| Go/No-Go | Controle inibitório | Taxa de Erros de Comissão (TEC) | % | Skia |
| Lince | Atenção seletiva visual | Tempo de Reação por Rodada (TRR) | ms | Skia |
| Jogo da Bomba | Velocidade de processamento | Tempo de Resposta Semântico (TRS) | ms | Reanimated |
| Uno | Flexibilidade cognitiva | Latência de Decisão por Turno (LDT) | ms | XState |
| Stop | Velocidade de busca semântica | Tempo de Acesso Lexical (TAL) | ms | XState |
| Cara a Cara | Raciocínio lógico / Planejamento | Eficiência de Eliminação Média (EEM) | % | XState |
| Quebra-Cabeça | Percepção visuoespacial | Índice de Encaixe Preciso (IEP) | % | Skia |
| Jogo do Desenho | Controle motor / Impulsividade motora | Taxa de Cruzamentos de Limite (TCL) | ev/s | Skia |

---

## 11. Stack Técnica Global

### 11.1 Visão em Camadas

```
┌─────────────────────────────────────────────────────┐
│                   INTERFACE CLÍNICA                  │
│         React Native + Expo Router + victory-native  │
├────────────────────┬────────────────────────────────┤
│   ENGINE DE JOGO   │        JOGOS DE TURNO           │
│  React Native Skia │        XState v5                │
│  + Game Engine     │  (Uno, Stop, Cara a Cara)       │
├────────────────────┴────────────────────────────────┤
│                  CAMADA DE TELEMETRIA                │
│     performance.now() + useTelemetry() hook          │
│     async-storage (fila local) + expo-secure-store   │
├─────────────────────────────────────────────────────┤
│                     BACKEND                          │
│         Supabase (PostgreSQL + Auth + RLS)           │
├─────────────────────────────────────────────────────┤
│                  PIPELINE DE ML                      │
│   FastAPI + scikit-learn + pandas + numpy            │
├─────────────────────────────────────────────────────┤
│               GERAÇÃO DE RELATÓRIO                   │
│              Claude API (Anthropic)                   │
└─────────────────────────────────────────────────────┘
```

### 11.2 Tabela de Dependências

| Camada | Tecnologia / Biblioteca | Versão | Finalidade |
|--------|------------------------|--------|-----------|
| Base | Expo SDK | 51+ | Plataforma cross-platform (iOS, Android, Web) |
| Base | TypeScript | — | Contrato de tipos para eventos de telemetria |
| Navegação | expo-router | 3.0+ | Roteamento baseado em arquivos |
| Engine 2D | @shopify/react-native-skia | 1.0+ | Renderização precisa para Go/No-Go, Lince, Quebra-Cabeça, Desenho |
| Game Loop | react-native-game-engine | 1.0+ | Loop 60fps para jogos contínuos |
| Estado/Turno | XState | v5 | Máquinas de estado para Uno, Stop, Cara a Cara |
| Gestos | react-native-gesture-handler | 2.0+ | Toque com pressão, posição e velocidade |
| Animações | react-native-reanimated | 3.0+ | Animações no UI thread (timer, feedback visual) |
| Timestamps | `performance.now()` nativo | — | Precisão ±1 ms, imune a ajustes de relógio |
| Voz | expo-speech-recognition | — | Onset de resposta verbal para Stop e Bomba |
| Armazenamento | @react-native-async-storage | — | Fila de eventos de telemetria |
| Segurança | expo-secure-store | — | Tokens de autenticação com criptografia nativa |
| Backend | Supabase | — | PostgreSQL + Auth + Row Level Security (LGPD) |
| Client SDK | @supabase/supabase-js | — | Upload de eventos e autenticação |
| Cache | react-query / SWR | — | Sincronização local/backend com retry automático |
| Pipeline ML | FastAPI + scikit-learn | — | Classificação de perfis neurocognitivos |
| Processamento | pandas / numpy | — | Normalização de eventos brutos de telemetria |
| Relatório | Claude API (Anthropic) | — | Geração de narrativa clínica em linguagem natural |
| Visualização | victory-native | 40.0+ | Gráficos de scores no dashboard do profissional |

### 11.3 Schema Universal de Evento de Telemetria

Todos os eventos gerados pelos oito jogos seguem o schema abaixo para garantir interoperabilidade com o pipeline de ML:

```typescript
interface TelemetryEvent {
  sessionId: string;       // UUID da sessão de avaliação
  gameId: string;          // Identificador do jogo (ex: "gonogo", "lince")
  eventType: string;       // Tipo do evento (específico por jogo)
  timestamp: number;       // performance.now() — ms desde início da sessão
  payload: Record<string, unknown>; // Dados específicos do evento
}
```

### 11.4 Compatibilidade por Jogo

| Jogo | Web | Android | iOS | Observação |
|------|-----|---------|-----|-----------|
| Go/No-Go | ✅ | ✅ | ✅ | — |
| Lince | ✅ | ✅ | ✅ | — |
| Jogo da Bomba | ✅¹ | ✅ | ✅ | ¹ Requer microfone no navegador |
| Uno | ✅ | ✅ | ✅ | — |
| Stop | ✅¹ | ✅ | ✅ | ¹ Requer microfone ou teclado |
| Cara a Cara | ✅ | ✅ | ✅ | — |
| Quebra-Cabeça | ✅ | ✅ | ✅ | — |
| Jogo do Desenho | ⚠️² | ✅ | ✅ | ² Sem pressure via mouse; usa velocidade como proxy |

---

*Documento elaborado com base no Protocolo de Implementação Telemétrica v1.0 — TekoPorã (Teko), FECAP, 2026.*
*Referência principal: Miyake et al. (2000). The unity and diversity of executive functions. Cognitive Psychology, 41(1), 49–100.*
