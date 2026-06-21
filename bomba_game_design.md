# Jogo da Bomba: Documentação de Design e Engenharia 💣

Este documento serve como base técnica e arquitetural para o **Jogo da Bomba** (Velocidade de Processamento Verbal), mapeando seu estado atual para preparar o terreno para a reformulação visual e estética imersiva ("Deep Green / Glassmorphism").

---

## 1. Importância Clínica (Construtos)

O Jogo da Bomba não é apenas um minigame; é uma ferramenta clínica disfarçada. Ele avalia e estimula:
- **Velocidade de Processamento:** Quão rápido a criança consegue recuperar uma informação sob demanda.
- **Fluência Semântica / Acesso Lexical:** A capacidade de vasculhar o "dicionário mental" buscando itens que pertençam a uma categoria específica (ex: Animais, Cores).
- **Tolerância à Pressão / Ansiedade:** O tempo correndo atua como um estressor natural, medindo a estabilidade cognitiva da criança sob pressão de tempo.

## 2. Funcionalidades e Mecânica Core

A mecânica do jogo ocorre em 3 estados principais gerenciados pelo React (`useState`):

### A. Pré-Jogo (Menu do Jogo)
- O usuário visualiza o título e as instruções básicas.
- **Mecânica:** Aguarda o clínico pressionar "Começar" para inicializar os cronômetros e sortear a primeira Categoria Semântica.

### B. Durante o Jogo (Gameplay)
- **Temporizador Dinâmico:** Inicia com 15 segundos (`INITIAL_TIME = 15000ms`).
- **Aceleração do Relógio:** A cada acerto, o jogador ganha **+5 segundos** de bônus, porém, a velocidade de queima do relógio aumenta em 25% (`setTickSpeed(prev * 1.25)`). Isso cria um efeito "Bola de Neve", onde o jogo fica progressivamente mais difícil.
- **Alternância de Turnos:** A vez alterna estritamente entre "Psicólogo" e "Criança".
- **Inteligência Artificial (O coração do jogo):** 
  - Ao segurar o botão, o microfone grava a voz do jogador.
  - O áudio é enviado para o backend, transcrito pelo OpenAI Whisper.
  - O texto é enviado ao OpenRouter para **validação semântica** (ex: "Baleia" pertence à categoria "Animais"?).
  - Se estiver incorreto, a vez não passa. O jogador recebe um aviso visual/sonoro e precisa tentar novamente com outra palavra.

### C. Pós-Jogo (Game Over)
- Quando o tempo zera, o relógio é interrompido.
- A tela exibe um grande "KABOOM!".
- Mostra na mão de qual jogador a bomba "estourou", o que gera risadas e alivia a tensão clínica antes de recomeçar.

---

## 3. Proporções e UI Atual (A ser refatorada)

O código base em `BombaGame.tsx` foi montado para ser puramente funcional durante os testes lógicos, utilizando proporções básicas e cores nativas planas. O layout atual dita o seguinte mapeamento (que devemos melhorar):

### Container Geral
- Fundo plano: `#F5F5F5` (Off-white).
- Alinhamento centralizado com preenchimento em toda a margem (`padding: 20`).
- **Botão Voltar:** Posicionado de forma absoluta no topo esquerdo (`top: 50, left: 20`), o que pode conflitar com barras de status dependendo do celular.

### Área de Informação (Topo/Centro)
- **Turno:** Texto em negrito (24px, `#333`).
- **Categoria:** Texto em destaque azul (28px, `#2563EB`, Peso 900).

### O Componente da Bomba
- Atualmente reside em um componente separado `BombTimer`. O layout reserva a porção central da tela para a visualização gráfica (barra de tempo ou círculo).

### Controles (Rodapé)
- Distanciados `marginTop: 40` do centro.
- **Botão de Microfone:** Um grande botão arredondado (`borderRadius: 50`, fundo cinza escuro `#4B5563` ou vermelho escuro `#DC2626` durante a gravação).
- **Textos de Validação:** Quando a IA está processando o áudio, os botões desaparecem e surge o texto "Analisando áudio..." (18px, cor de alerta laranja).

---

## 4. Oportunidades para o Novo Gráfico (Next Steps)

Para alinhar com a nova **HomeScreen Deep Green**:
1. **Tema Global:** Substituir o fundo claro por uma estética escura/verde (como o `#064b46`) para dar contraste aos botões flutuantes.
2. **Safe Area:** Implementar os mesmos cálculos seguros de cabeçalho (`StatusBar.currentHeight`) no botão "Voltar".
3. **Glassmorphism:** Envelopar as informações de Categoria e Turno em cartões de vidro translúcido para parecerem widgets flutuantes.
4. **Animações da Bomba:** O `BombTimer` precisa ganhar peso estético (vibração na tela quando a velocidade aumenta, ou pulsações vermelhas nas bordas).
5. **Botão de Gravação:** Usar os tons de destaque amarelos (`#FFC857`) ou lilás (`#7B61FF`) com feedback háptico (vibração celular) ao segurar e soltar.
