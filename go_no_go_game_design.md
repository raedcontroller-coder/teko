# Go / No-Go: Documentação de Design e Engenharia 🐕🐈

Este documento serve como mapa de estado atual do **Jogo Go / No-Go** (Avaliação de Controle Inibitório), mapeando suas mecânicas científicas, métricas e telemetria para preparar a futura transição visual para a estética definitiva da TekoPorã ("Deep Green / Glassmorphism").

---

## 1. Importância Clínica e Telemetria (Construtos)

O Go / No-Go é um paradigma neuropsicológico clássico utilizado para medir:
- **Controle Inibitório (Impulsividade):** A capacidade do cérebro de frear uma resposta motora que já está engatilhada e pronta para ser executada.
- **Atenção Sustentada:** Manter o foco contínuo aguardando o estímulo.
- **Tempo de Reação:** A velocidade de processamento visual-motor.

### As Métricas Coletadas (Tela Final)
O sistema conta com um logger milimétrico (`performance.now()`) para garantir precisão científica nas respostas:
1. **TEC (Taxa de Erros de Comissão):** O paciente não conseguiu se segurar e **tocou na tela quando apareceu o Gato (No-Go)**.
2. **TO (Taxa de Omissões):** O paciente se distraiu e **deixou de tocar na tela quando apareceu o Cachorro (Go)**.
3. **Tempo de Reação Médio:** Qual foi a velocidade média (em milissegundos) dos acertos.

---

## 2. Funcionamento Matemático e Mecânicas

### Motor de Tentativas
- O jogo possui exatas **20 tentativas (Trials)**.
- **Proporção:** 70% de estímulos Go (14 Cachorros) e 30% de estímulos No-Go (6 Gatos). Essa disparidade de 70/30 é proposital para "viciar" o cérebro a apertar a tela, tornando o esforço inibitório de não apertar muito maior.
- A ordem é embaralhada algoritmicamente a cada sessão (Fisher-Yates Shuffle).

### Os Estados do Jogo (Game Loop)
O loop principal transita por 4 telas gerenciadas pelo React Native:
1. **Menu:** Instruções e botão de iniciar.
2. **ISI (Inter-Stimulus Interval):** A tela fica completamente vazia. Duração randômica entre **500ms e 1500ms**. (Evita que o paciente adivinhe o ritmo).
3. **Stimulus:** O animal aparece na tela. A tela aguarda o toque por um máximo de **1000ms**. Se o paciente tocar, avança imediatamente. Se o tempo expirar sem toque, avança sozinho registrando Miss (omissão) ou Correct Rejection.
4. **Finished:** Mostra o relatório final da sessão com os três cards de métricas (TEC, TO e Tempo de Reação).

---

## 3. Estética Atual vs Oportunidades (Next Steps)

Assim como o Quebra-Cabeça e a Bomba antes das refatorações, a base de código do Go/No-Go está com um design provisório e plano, precisando ser envelopado na identidade premium do app.

### Como está hoje (Provisório):
- Fundo cinza/branco frio de laboratório clínico (`#F8FAFC`).
- Botão "Começar Sessão" em roxo liso (`#6366F1`).
- Instruções e contadores com tipografia escura sem tratamento visual.
- Tela de Game Over com cartões brancos e rígidos estilo Material Design.

### Visão Deep Green e Glassmorphism (A Refatorar):
Para harmonizar o Go / No-Go com os jogos que já finalizamos, precisaremos adaptar o componente no futuro da seguinte maneira:
1. **Fundo Imersivo:** Substituir a base cinza pelo verde escuro (`#084D48`). A tela do jogo em si deve ser extremamente limpa, pois o Go/No-Go depende de 100% da atenção da criança.
2. **Pílulas e Painéis de Vidro:** O menu inicial e as instruções devem habitar as caixas de vidro fosco (`rgba(255, 246, 227, 0.1)`) que criamos para o aplicativo.
3. **Métricas Finais Impactantes:** Os resultados de "Omissão" e "Comissão" devem aparecer dentro de `glassPanels` neon no final, trocando as antigas caixas brancas com sombra de elevação.
4. **O Estímulo Central:** Os ícones do Cachorro e Gato precisarão "saltar" na tela. Quando a tela estiver no estado `isi` (vazia), ela mostrará apenas o verde escuro floresta. Quando o estímulo aparecer, deve ser o único ponto de foco da tela inteira, sem distrações.
