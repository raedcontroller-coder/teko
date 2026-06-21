# Quebra-Cabeça: Documentação de Design e Engenharia 🧩

Este documento serve como mapa de estado atual do **Jogo Quebra-Cabeça** (Percepção Visuoespacial), mapeando suas telas, necessidades e telemetria para preparar a futura transição visual para a estética "Deep Green / Glassmorphism".

---

## 1. Importância Clínica e Telemetria (Construtos)

O Quebra-Cabeça avalia diretamente:
- **Percepção Visuoespacial:** Capacidade de rotacionar mentalmente, encaixar e associar formas complexas (bordas e cores).
- **Planejamento e Execução Motora:** Medido indiretamente através da coordenação fina do arrastar e soltar (`PanResponder`).
- **Impulsividade:** Se a criança tenta encaixar as peças aleatoriamente sem analisar a imagem antes.

### As Métricas Coletadas (Tela Final)
O jogo possui um sistema robusto de telemetria que exibe três resultados finais vitais:
1. **IEP (Índice de Encaixe de Primeira):** Mostra a porcentagem de peças que a criança soltou perfeitamente no lugar correto *na primeira tentativa*. 
2. **TTC (Tempo Total de Conclusão):** O tempo total gasto para resolver o tabuleiro.
3. **MTP (Média de Tentativas por Peça):** Quantas vezes a criança arrastou e errou a peça antes de acertar.

---

## 2. Telas Atuais e Funcionamento

O jogo é dividido em três estados principais gerenciados pelo React (`gameState: 'menu' | 'playing' | 'finished'`):

### A. Tela de Menu (Pré-Jogo)
- **O que exibe:** Título grande, texto de instrução ("Arraste e solte as peças clássicas..."), uma imagem de preview de `250x250` da foto que será montada.
- **Botão Principal:** Um botão longo azul-roxo (`#6366F1`) para "Começar Montagem".
- **Comportamento:** Ao clicar em começar, o jogo gera a grade de recortes do quebra-cabeça e inicializa a sessão de telemetria.

### B. Tela do Jogo Ativo (Gameplay)
- **Tabuleiro:** Uma caixa com bordas pontilhadas (`dashed`) que serve como alvo (Drop Zone) para os encaixes. Tem tamanho fixo de `320x320`.
- **Peças Aleatórias (Mecânica de Estacionamento):** O tabuleiro é formado por `4 colunas x 3 linhas` (12 peças totais). Elas "nascem" caóticas e espalhadas na parte inferior da tela, para que o paciente as arraste livremente.
- **Referência:** Um pequeno painel superior (ancorado com `top: 50`) contendo a miniatura de `80x80` da imagem completa, servindo como "cola" visual.

### C. Tela de Resultados (Pós-Jogo)
- É ativada automaticamente quando todas as peças estão sinalizadas como `isPlaced = true`.
- **Cartões de Métrica:** Exibe os resultados calculados (IEP verde, TTC azul, MTP amarelo/laranja) através de cartões simples com fundo branco e leve sombra.

---

## 3. Estética Atual vs Oportunidades (Next Steps)

A arquitetura lógica do jogo (matemática de recortes de borda Bezier, detecção de colisões, telemetria) está **perfeita e intocável**. O problema é a estética plana e provisória:

### Como está hoje:
- Fundos cinzas, frios e brancos (`#F8FAFC`, `#E2E8F0`).
- Textos genéricos (`color: '#1E293B'`).
- Botões sem animação tátil profunda.
- Elementos soltos sem envelopamento unificado.

### Como deverá ficar (Visão Deep Green):
1. **Fundo Radial:** Substituir a cor lisa pelo `radial-gradient` escuro floresta.
2. **Tabuleiro de Vidro:** A caixa pontilhada (`dashed`) deve ser substituída por uma área de "Glassmorphism" com a marca d'água da logo ou o formato da grade desenhado sutilmente com bordas translúcidas de `rgba(255, 255, 255, 0.2)`.
3. **Cartões de Métrica (Fim de jogo):** Precisam adotar a tipografia `Plus Jakarta Sans` e cores da paleta oficial (Warning-Gold, Secondary-Purple). 
4. **Referência Flutuante:** O quadro de referência no topo deve ser uma "pílula" de vidro com blur de fundo, em vez de uma caixa branca sólida.
