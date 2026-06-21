# TekoPorã 🌿

**TekoPorã** é um aplicativo voltado para a **avaliação neurocognitiva infantil**. Ele foi projetado para substituir os testes em papel tradicionais por um ambiente gamificado, imersivo e amigável. Seu principal objetivo é reduzir a ansiedade clínica das crianças e fornecer aos avaliadores/clínicos métricas precisas (telemetria) de diferentes construtos neurológicos e cognitivos.

A Home Section do aplicativo funciona como um "Catálogo de Jogos", garantindo autonomia para o clínico escolher qual dinâmica aplicar com base no nível de engajamento do paciente no momento.

---

## 🎮 Jogos Atuais (Dinâmicas)

Atualmente, o TekoPorã conta com três avaliações totalmente funcionais. Cada jogo foca em isolar uma via neurológica específica para garantir que a testagem seja precisa:

### 💣 Jogo da Bomba
* **Construto Clínico:** Velocidade de Processamento Verbal / Fluência Semântica.
* **Mecânica:** O sistema sorteia uma categoria (ex: Animais, Cores). O paciente e o clínico se revezam falando palavras dessa categoria enquanto um "pavio" de bomba queima cada vez mais rápido.
* **Telemetria:** O app captura o áudio em tempo real, transcreve e valida semanticamente as palavras ditas. Acertos concedem bônus de tempo.

### 🎯 Go / No-Go
* **Construto Clínico:** Controle Inibitório e Atenção Sustentada.
* **Mecânica:** Um teste clássico adaptado de forma gamificada. O paciente deve tocar rapidamente na tela ao ver um estímulo "Go" (ex: Cachorro azul) e frear seu impulso motor (inibir a resposta) ao ver um estímulo "No-Go" (ex: Gato vermelho).
* **Telemetria:** Medição ultra-precisa da *Taxa de Erros de Comissão (TEC)*, *Taxa de Omissões* e do *Tempo de Reação Médio (TRM)*.

### 🧩 Quebra-Cabeça
* **Construto Clínico:** Percepção Visuoespacial.
* **Mecânica:** A criança deve organizar e montar uma imagem fragmentada em peças de recortes complexos. As peças nascem espalhadas e o aplicativo possui uma "mecânica de estacionamento", onde o paciente pode agrupar peças fora do tabuleiro antes de tentar os encaixes.
* **Telemetria:** Rastreia o **IEP (Índice de Encaixe de Primeira)**, penalizando tentativas de acerto e erro desenfreadas diretamente no tabuleiro final.

---

## 🚀 Como Executar e Visualizar o Projeto

O projeto utiliza o ecossistema do **Expo** para unificar a experiência Mobile e Web a partir de uma mesma base de código React Native.

### Pré-requisitos
- [Node.js](https://nodejs.org/en/) instalado (versão LTS recomendada).
- [Expo Go](https://expo.dev/client) instalado no seu celular (iOS ou Android) para testes físicos.

### Instalação
Na raiz do projeto (ou dentro dos diretórios dos apps, caso seja um monorepo estruturado com `apps/mobile` e `apps/api`), instale as dependências:
```bash
# Na pasta principal ou pasta do mobile
npm install
```

### Visualizando no Mobile (iOS / Android)
Navegue até a pasta do aplicativo e inicie o servidor do Expo com o cache limpo:
```bash
cd apps/mobile
npx expo start -c
```
1. Um QR Code aparecerá no seu terminal.
2. **No iPhone:** Abra a câmera do celular e aponte para o QR Code (ele abrirá no app Expo Go).
3. **No Android:** Abra o app Expo Go e escaneie o QR Code diretamente por lá.

### Visualizando na Web
Se o projeto web estiver configurado via Expo Web, no mesmo terminal onde o `npx expo start` está rodando, basta pressionar a tecla `w`.
O aplicativo será compilado e aberto em uma nova aba do seu navegador (geralmente em `http://localhost:8081`).

*(Nota: Caso a interface Web seja um dashboard separado em Next.js localizado na pasta `apps/api` ou raiz, basta rodar `npm run dev` na respectiva pasta e acessar `localhost:3000`).*

---

## 🛠️ Stack Técnica do Projeto

A arquitetura do projeto foi escolhida para entregar máxima fluidez de UI/UX (como a estética Glassmorphism "Deep Green" atual) sem sacrificar performance de telemetria.

**Frontend / Mobile:**
- **[React Native](https://reactnative.dev/):** Framework base para a construção das interfaces nativas.
- **[Expo](https://expo.dev/):** Ferramental de build, roteamento de dependências nativas e visualização rápida (Expo Go).
- **React Native Reanimated / Animated API:** Para micro-interações, efeitos de fade-up escalonado (stagger) e arraste (PanResponder) de peças de quebra-cabeça.
- **Lucide React Native:** Biblioteca para os ícones modernos utilizados na UI.
- **Estilização Customizada (StyleSheet):** Tokens e padrões de design diretamente mapeados de protótipos de Tailwind.

**Backend / Inteligência:**
- **[Next.js](https://nextjs.org/) (API Routes):** Utilizado para construir endpoints robustos (presente na pasta `apps/api`).
- **OpenAI Whisper / OpenRouter:** Motores de IA integrados no backend para realizar a transcrição de áudio ultrarrápida e validação semântica em tempo real para as dinâmicas de voz.
- **Matemática Vetorial (SVG):** Lógica complexa e manual implementada em TypeScript nativo para a geração aleatória de encaixes de quebra-cabeça sem depender de bibliotecas gráficas pesadas (como Skia).
