# TekoPorã - Web Homepage Design & Arquitetura de Conteúdo 🌿

Este documento descreve a estrutura de conteúdo, a fundamentação científica e a identidade visual que guiarão a construção (ou refatoração) da Landing Page (Página Inicial) do site TekoPorã (`apps/web`).

---

## 1. Identidade Visual e Estética (Aesthetic Guidelines)

Para garantir uma transição perfeita do App (Bomba, Quebra-Cabeça, Go/No-Go) para o site, adotaremos a mesma estética premium:

*   **Tema:** **Deep Green & Glassmorphism**. O site não deve parecer um painel hospitalar frio, mas sim uma plataforma acolhedora, moderna e imersiva.
*   **Paleta de Cores:**
    *   **Background Principal:** Verde Floresta Profundo (`#084D48`). Usado em grandes seções para trazer imersão.
    *   **Superfícies de Vidro (Cards):** Branco/Creme translúcido (`rgba(255, 246, 227, 0.05)`) com bordas suaves (`rgba(255, 255, 255, 0.15)`).
    *   **Destaques (Call to Actions):** Amarelo Teko (`#E6A800`), utilizado para botões de conversão e download.
    *   **Textos:** Branco puro (`#FFFFFF`) para títulos e um branco levemente fosco (`rgba(255, 255, 255, 0.8)`) para descrições.
*   **Tipografia:**
    *   Títulos (Display/Headlines): *Plus Jakarta Sans* (ou fonte equivalente sem-serifa moderna, com peso `bold` a `black`, tracking levemente negativo para impacto).
    *   Corpo (Body): *Inter* ou *Roboto* (pesos `regular` e `medium` para máxima legibilidade).
*   **Transições e Animações:**
    *   **Microinterações:** Efeito *hover* nos botões que aumentam levemente a escala (`scale: 1.05`) e intensificam o brilho (`shadow/glow`).
    *   **Scroll:** Elementos (como os cards de preço e selos científicos) devem aparecer com um efeito suave de *Fade-in Up* ao scrollar a tela (usando `IntersectionObserver` ou Framer Motion).
    *   **Fundo:** Gradientes radiais sutis e em lento movimento atrás das camadas de vidro para dar uma sensação de profundidade "viva".

---

## 2. Estrutura da Página (Seções)

### Hero Section (A primeira impressão)
*   **Visual:** Fundo imersivo com o vídeo principal em looping sob uma leve máscara escurecedora, ou uma imagem 3D flutuante do app.
*   **Conteúdo:** Título forte focando no acolhimento e precisão diagnóstica.
*   **CTA (Call to Action):** Um botão grande e vibrante: *"Conheça o Sistema"* e um secundário *"Acesso Clínico"*.

### Seção 1: O Que é a TekoPorã? (Propósito e Solução)
*   Uma explicação envolvente sobre o que é o projeto TekoPorã.
*   **Narrativa:** TekoPorã é uma plataforma multitenancy inovadora focada em saúde mental e neuropsicologia infantil. Ela conecta Psicólogos, Crianças e Pais em um mesmo ecossistema, transformando avaliações complexas em experiências lúdicas.

### Seção 2: Validação Científica (A Autoridade)
*   **Design:** Um painel de vidro que se destaca do fundo, com selos de validação.
*   **Conteúdo:** 
    *   **Eficácia Comprovada:** Desenvolvido e validado com base em sólidas pesquisas de Mestrado e Doutorado.
    *   **Serious Games Computadorizados:** A aplicação abandona os testes em papel (cansativos e muitas vezes viesados) para adotar paradigmas computadorizados (como o *Go / No-Go*, labirintos espaciais, etc.), mascarados sob um *Serious Game* de altíssima qualidade.
    *   **Validação Internacional:** O sistema fundamenta-se na literatura internacional validada, oferecendo coleta de telemetria milimétrica (Tempo de Reação, Taxas de Omissão/Comissão), garantindo que os psicólogos obtenham relatórios quantitativos com precisão inquestionável para suporte diagnóstico (como rastreio de TDAH e disfunções executivas).

### Seção 3: Baixe o Aplicativo (A Experiência Móvel)
*   **Design:** Um grande mock-up flutuante de um smartphone mostrando o "Jogo da Bomba" ou "Quebra-Cabeça", circundado por pílulas de vidro destacando funcionalidades.
*   **Download:** Botões oficiais da *App Store* e *Google Play*.
*   **Texto:** *"A avaliação clínica no bolso do paciente. Leve os Serious Games para qualquer lugar."*

### Seção 4: Planos e Preços (Para Psicólogos e Clínicas)
*   **Design:** Três "Cards de Vidro" (Bento Box style) alinhados lado a lado.
*   **Animação:** O plano recomendado (Central) deve estar ligeiramente escalado e pulsar suavemente.
*   **Plano 1: Essencial (Individual)**
    *   Acesso a 1 perfil de Psicólogo.
    *   Até 10 pacientes gerenciáveis.
    *   Relatórios clínicos básicos.
    *   Botão transparente com bordas.
*   **Plano 2: Profissional (Recomendado)**
    *   Acesso completo à telemetria detalhada (IEP, TEC, TO, Tempos de Reação).
    *   Pacientes ilimitados.
    *   Botão Amarelo Teko (Ação Principal).
*   **Plano 3: Clínica (Empresarial)**
    *   Múltiplos perfis de Psicólogos (Multitenancy completo).
    *   Integração API e suporte dedicado.
    *   Botão escuro para contato B2B.

### Footer (Rodapé)
*   Links rápidos, contato, termos de uso, políticas de privacidade e aviso legal sobre o uso da plataforma como *suporte* à decisão clínica, não substituindo a avaliação neuropsicológica presencial.
