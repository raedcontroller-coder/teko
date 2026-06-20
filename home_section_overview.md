# Visão Geral da Home Section (TekoPorã)

Este documento detalha a arquitetura, a lógica e o propósito da **Tela Inicial (Home Section)** do aplicativo mobile TekoPorã, que serve como uma central de dinâmicas clínicas para avaliação neurocognitiva infantil.

## 1. O Propósito da Home Section

A Home Section foi construída para funcionar como o **painel de controle do avaliador/clínico**. Ao invés do aplicativo iniciar diretamente em um jogo ou avaliação longa e cansativa, ele apresenta um hub visual interativo.

A ideia por trás deste design é:
- **Reduzir a ansiedade da criança:** Apresentar a avaliação como um "catálogo de jogos", tornando a experiência gamificada e convidativa.
- **Autonomia Clínica:** O profissional tem a liberdade de escolher qual construto cognitivo avaliar primeiro de acordo com o nível de fadiga ou engajamento do paciente no momento.
- **Isolamento de Construtos:** Garantir que cada minigame teste uma única via neurológica/cognitiva, evitando testes mistos que dificultam a interpretação dos resultados.

## 2. A Lógica de Navegação

A navegação foi mantida intencionalmente simples, descartando bibliotecas pesadas de roteamento (como `react-navigation` ou `expo-router`).

Tudo é controlado no nível superior (`App.tsx`) através de uma máquina de estados finita básica gerenciada pelo React (`useState`):
- O estado `currentScreen` começa sempre como `'Home'`.
- Ao clicar em um card, a Home Section passa o identificador do jogo selecionado via callback (`onSelectGame`).
- A tela principal (`App.tsx`) reage a essa mudança e renderiza o componente do jogo correspondente, passando a ele a prop `onBack`.
- Quando o jogo termina (ou o jogador clica em voltar), a prop `onBack` restaura o estado para `'Home'`, limpando o jogo da memória e recarregando o menu inicial.

Essa abordagem garante transições instantâneas e elimina o acúmulo de pilhas de navegação (navigation stack), melhorando drasticamente o desempenho no Expo Go.

## 3. Dinâmicas Lúdicas Disponíveis

Atualmente, a Home Section conta com três avaliações totalmente desbloqueadas e funcionais, cada uma focada em um construto específico:

### 🎮 Jogo da Bomba
* **Construto Primário:** Velocidade de Processamento Verbal / Fluência Semântica.
* **Mecânica:** O jogo sorteia uma categoria (ex: Animais, Cores). O clínico e a criança devem alternar turnos falando palavras pertencentes à categoria. Um temporizador simula o pavio de uma bomba que acelera progressivamente.
* **Telemetria / Integração:** O aplicativo utiliza o microfone e um backend de transcrição (via OpenRouter/OpenAI Whisper) para processar o áudio em tempo real e validar se a palavra dita está correta e atende à categoria, concedendo bônus de tempo em caso de acerto.

### 🧩 Go / No-Go
* **Construto Primário:** Controle Inibitório e Atenção Sustentada.
* **Mecânica:** Teste clássico adaptado para celular. A criança deve tocar na tela imediatamente ao ver o estímulo positivo (Cachorro azul) e inibir totalmente a resposta motora ao ver o estímulo negativo (Gato vermelho). 
* **Telemetria / Métrica:** O aplicativo utiliza temporizadores precisos de `performance.now()` e calcula a **Taxa de Erros de Comissão (TEC)**, a **Taxa de Omissões** e o **Tempo de Reação Médio** após um total de 20 rodadas de aparições aleatórias.

### 🖼️ Quebra-Cabeça
* **Construto Primário:** Percepção Visuoespacial.
* **Mecânica:** Uma foto-referência é mostrada à criança. Na base da tela, 12 peças de quebra-cabeça com recortes curvos complexos (gerados matematicamente) nascem espalhadas pela área branca. A criança tem a liberdade de arrastá-las e agrupá-las livremente antes de tentar encaixá-las no quadro final (Snap Zone de 60px).
* **Telemetria / Métrica:** A métrica primordial é o **IEP (Índice de Encaixe de Primeira)**, que rastreia quantas vezes a criança encontrou o lugar correto da peça sem realizar tentativas de acerto-e-erro no tabuleiro.

## 4. Expansão Futura (Locked Cards)

A Home Section foi desenvolvida com escalabilidade em mente. Ela apresenta a lógica visual de `Placeholder Cards` — que são renderizados em cinza e bloqueados com um ícone de cadeado ("Em breve"). 

Isso indica ao usuário que o projeto está vivo e prepara o espaço visual para a futura implementação das outras mecânicas descritas no protocolo técnico (ex: Lince, Uno, Stop, etc.).
