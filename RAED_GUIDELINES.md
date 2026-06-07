# Diretrizes Gerais de Desenvolvimento e Deploy no Coolify 🚀

Este documento serve como guia técnico oficial para futuros agentes de IA e desenvolvedores. Ele detalha as melhores práticas de arquitetura, banco de dados, ORM, segurança e containerização aplicadas e testadas na infraestrutura do ecossistema **Raed** rodando sob o **Coolify**.

Qualquer nova aplicação construída para esta infraestrutura **deve** seguir estritamente as orientações abaixo para garantir consistência, baixo consumo de recursos e segurança no deploy.

---

## 🎯 1. Modelos de Arquitetura de Aplicação (Patterns)

Dependendo do escopo do projeto, adote um dos três padrões arquiteturais validados e otimizados:

### A. Next.js Standalone (Recomendado para Portais e WebApps Fullstack)
* **Estrutura:** Next.js 13+ utilizando **App Router** (pasta `src/app`).
* **ORM:** Prisma ORM.
* **Deploy:** Compilação otimizada no modo `standalone` via Docker multi-stage (Alpine Linux).
* **Vantagens:** SEO otimizado, rotas de API embutidas, SSR/ISR nativos e imagens Docker ultra-reduzidas (~150MB).

### B. Monorepo Unificado Fastify + SPA (Recomendado para Sistemas de Alto Tráfego/WebSockets)
* **Estrutura:** Frontend (`/client`) compilado como SPA (React/Vite) e Backend (`/server`) em Node.js com **Fastify**.
* **ORM:** Drizzle ORM.
* **Servidor Estático:** O Fastify gerencia as APIs nas rotas normais e serve os arquivos estáticos compilados do frontend na raiz (`/`) usando o plugin `@fastify/static`.
* **SPA Fallback:** Implementação de `setNotFoundHandler` apontando para o `index.html` do frontend, permitindo que o React Router controle as páginas sem dar HTTP 404 no recarregamento.
* **Vantagens:** Suporte performático a WebSockets (ex: conexões persistentes para IA Realtime) e deploy em container único simplificado.

### C. Microsserviço Slim Stateless (Recomendado para Assistentes e Chatbots de IA)
* **Estrutura:** Servidor simplificado em Node.js com **Express**.
* **Persistência:** Stateless (sem banco de dados). O histórico de diálogo é mantido pelo cliente e transitado nas requisições.
* **RAG local:** Informações estáticas (bases de conhecimento) são mantidas em arquivos `.txt` ou `.json` locais e carregadas em memória RAM na inicialização (`fs.readFileSync`), sendo acopladas diretamente ao prompt do sistema da OpenAI.
* **Vantagens:** Arquitetura sem custos de infraestrutura de banco de dados, tempo de resposta baixíssimo e imagem Docker `slim` extremamente enxuta.

---

## 🗄️ 2. Arquitetura de Banco de Dados & ORMs

A infraestrutura padrão adota o **PostgreSQL** hospedado em containers internos gerenciados pelo Coolify.

### Padrão Drizzle ORM (Recomendado para Node/Fastify)
* **Driver:** `node-postgres` gerenciado via `Pool` do `pg` com controle estrito de conexões ociosas.
* **Configuração do Pool:**
  ```typescript
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,                 // Limite de conexões concorrentes por container
    idleTimeoutMillis: 30000, // Fecha conexões ociosas após 30 segundos
    connectionTimeoutMillis: 2000,
  });
  ```
* **Migrações:** Utilização do `drizzle-kit` para gerenciar alterações através do arquivo `drizzle.config.ts` na raiz do backend, salvando scripts SQL na pasta `./drizzle` e lendo a estrutura física a partir de `/db/schema.ts`.

### Padrão Prisma ORM (Recomendado para Next.js)
* **Prevenção de Conexões Duplicadas:** O Next.js recria instâncias em Hot Reload no desenvolvimento. Utilize obrigatoriamente o padrão Singleton em `src/lib/prisma.ts`:
  ```typescript
  import { PrismaClient } from "@prisma/client";
  const globalForPrisma = global as unknown as { prisma: PrismaClient };
  export const prisma = globalForPrisma.prisma || new PrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
  export default prisma;
  ```
* **Compilação de Tipos:** O schema do prisma em `/prisma/schema.prisma` deve conter `binaryTargets` específicos para compatibilidade com containers de produção baseados em musl (Alpine Linux):
  ```prisma
  generator client {
    provider      = "prisma-client-js"
    binaryTargets = ["native", "linux-musl", "linux-musl-openssl-3.0.x"]
  }
  ```

---

## 🔒 3. Conexão Segura e Ambiente de Desenvolvimento

Para garantir a máxima proteção do banco de dados na produção, a porta física do PostgreSQL (`5432`) **nunca** deve ser aberta publicamente na VPS. O acesso local para desenvolvimento e auditorias deve ser realizado de forma encapsulada.

### O Túnel SSH local (`db-tunnel.bat`):
Crie um arquivo `.bat` na raiz do seu projeto local para iniciar um túnel SSH seguro e persistente com Keep-Alive ativo:
```bat
@echo off
echo Iniciando tunel SSH seguro com o Banco de Dados (VPS)...
ssh -o ServerAliveInterval=60 -o ServerAliveCountMax=3 -L 5450:IP_INTERNO_DOCKER_BANCO:5432 root@IP_PUBLICO_VPS
```
* **`5450`:** Porta local onde o banco ficará disponível.
* **`IP_INTERNO_DOCKER_BANCO`:** O IP interno do container do PostgreSQL fornecido pelo Coolify na rede Docker (ex: `10.0.1.17`).
* **`IP_PUBLICO_VPS`:** O endereço de IP da sua VPS física.
* **`DATABASE_URL` local:** `postgresql://usuario:senha@localhost:5450/nome_do_banco`

---

## 🐳 4. Otimização de Containerização (Dockerfiles de Alta Performance)

Utilize os templates multi-stage a seguir para garantir builds ultra-rápidas baseadas em cache e redução drástica do tamanho dos containers no Coolify.

### Template A: Next.js Standalone (`Dockerfile`)
```dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache openssl libc6-compat

# Estágio 1: Instalação de dependências limpas
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Estágio 2: Geração de build estática
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npx prisma generate
RUN npm run build

# Estágio 3: Runtime de produção mínimo
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
RUN mkdir .next && chown nextjs:nodejs .next

# Copia apenas os rastreios estáticos standalone gerados pelo Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```
> **Nota:** Certifique-se de definir `output: 'standalone'` em seu `next.config.ts`.

### Template B: Backend Fastify / Node Estático (`Dockerfile`)
```dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache openssl

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# Caso possua frontend estático integrado:
# COPY --from=builder /app/client/dist ./client/dist 

EXPOSE 3001
ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

CMD ["node", "dist/index.js"]
```

### Template C: Microsserviço Express Slim (`Dockerfile`)
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### `.dockerignore` Obrigatório (Adicione na raiz de cada projeto):
```text
node_modules
.next
.git
dist
build
.env
.env.local
*.log
```

---

## ⚙️ 5. Melhores Práticas de Segurança e Produção no Coolify

1. **Votos/Operações Públicas sem Login:** Implemente obrigatoriamente dupla validação. Sete cookies seguros HTTP-Only (`response.cookies.set('name', 'val', { httpOnly: true, maxAge: ... })`) no navegador do cliente e valide de forma cruzada o IP real (`x-forwarded-for` filtrando pelo `.split(',')[0]`) e `user-agent` contra o banco de dados.
2. **Variáveis de Ambiente:** Nunca comite arquivos `.env` preenchidos no repositório Git. Adicione as credenciais confidenciais diretamente na aba **Environment Variables** da aplicação no painel do Coolify.
3. **Persistência de Arquivos Temporários:** Evite gravar dados importantes em disco direto no container (pois eles são efêmeros e somem a cada deploy). Se precisar de arquivos locais persistentes, configure um **Volume Persistente** nas configurações de armazenamento do Coolify mapeando a pasta da aplicação (ex: `/app/storage`).
4. **CORS:** Restrinja as origens de CORS apenas para os domínios mapeados da sua infraestrutura quando em produção.

---

## 🎨 6. Design System Componentizado (UI Primitives)

Toda aplicação deve possuir um **Design System próprio** com componentes base reutilizáveis armazenados em `client/src/components/ui/`. Isso garante consistência visual, acelera o desenvolvimento e facilita a manutenção de longo prazo.

### Componentes Obrigatórios Mínimos

| Componente | Arquivo | Responsabilidade |
|---|---|---|
| **Button** | `ui/Button.tsx` | Botões com variants (`primary`, `outline`, `ghost`, `accent`), sizes (`sm`, `md`, `lg`, `xl`), estado `loading` e suporte a ícone. |
| **Card** | `ui/Card.tsx` | Container com variants (`default`, `glass`, `brutalist`, `accent`), níveis de padding e detalhes decorativos (corner accents). |
| **Typography** | `ui/Typography.tsx` | Wrapper tipográfico com variants (`h1`–`h4`, `body`, `small`, `mono`) que renderiza o elemento HTML semântico correto. |
| **Input** | `ui/Input.tsx` | Campo de input com suporte a `label`, `error`, `icon`, estilização via Design System. |

### Princípios de Construção

1. **Variants via Props:** Cada componente deve aceitar uma prop `variant` com estilos pré-definidos em um objeto map (nunca classes inline ad-hoc):
   ```tsx
   const variants = {
     primary: "bg-white text-black hover:bg-accent",
     accent: "bg-accent text-black hover:bg-white accent-glow",
     outline: "bg-transparent border border-border text-text hover:border-accent",
     ghost: "bg-transparent text-text/40 hover:text-text",
   };
   ```
2. **Composição por `className`:** Todos os componentes devem aceitar uma prop `className` para extensão pontual sem quebrar o estilo base.
3. **Semântica Automática:** O componente `Typography` deve renderizar a tag HTML correta automaticamente (`h1`, `h2`, `p`, etc.) baseado no `variant`.
4. **Estados de Loading:** O `Button` deve ter um spinner integrado via prop `loading` que desabilita o clique e substitui o conteúdo.

---

## 🏠 7. Landing Page como Vitrine do Projeto (Padrão Index)

A rota raiz (`/`) de toda aplicação web **não deve** abrir diretamente no dashboard ou login. Ela deve servir como uma **Landing Page de apresentação** do produto, similar a uma vitrine institucional.

### Estrutura Padrão da Landing Page

A página `Landing.tsx` deve seguir esta anatomia de seções:

```
┌─────────────────────────────────────────────┐
│ ① Navbar Fixa (blur + transparente)         │
│    Logo + Links âncora + CTA (Login/Signup) │
├─────────────────────────────────────────────┤
│ ② Hero Section                              │
│    Badge + Título impactante + Subtítulo +  │
│    Botões de ação primário/secundário       │
├─────────────────────────────────────────────┤
│ ③ Separador Visual (Animação/Efeito)        │
│    Wave, gradiente ou elemento decorativo    │
├─────────────────────────────────────────────┤
│ ④ Seção de Ciência/Diferenciais             │
│    Cards com ícones + listas de features     │
├─────────────────────────────────────────────┤
│ ⑤ Métricas/Social Proof                     │
│    Grid de números impactantes (KPIs)        │
├─────────────────────────────────────────────┤
│ ⑥ Planos/Pricing                            │
│    Cards comparativos com badge "Recomendado"│
├─────────────────────────────────────────────┤
│ ⑦ Footer                                    │
│    Logo + Copyright + Créditos Raed Digital  │
└─────────────────────────────────────────────┘
```

### Regras da Landing

1. **Navbar com `backdrop-blur`:** Use `bg-surface/20 backdrop-blur-md` para transparência elegante.
2. **Hero com Badge:** Um pill/badge animado (`animate-in fade-in`) acima do título principal com micro-copy que posiciona o produto.
3. **Tipografia do Hero:** `text-5xl md:text-8xl`, `tracking-tighter`, `leading-[0.9]` para títulos massivos e impactantes.
4. **Separação por Efeitos Visuais:** Utilize separadores dinâmicos entre seções (ex: partículas Three.js, gradientes CSS, etc.) em vez de linhas simples.
5. **Seção de Pricing com Destaque:** O plano recomendado deve ter borda accent, badge "Recomendado", e background diferenciado.
6. **Footer com Créditos Raed:** Sempre incluir o logo Raed com link para `https://raed.world` no footer.
7. **Roteamento:** A Landing fica em `/`, Login em `/login`, Register em `/register`, Dashboard em `/dashboard`. Use `react-router-dom` com `BrowserRouter`.

---

## 🌗 8. Sistema de Temas (Dark/Light Mode com CSS Variables)

Todo projeto **deve** suportar obrigatoriamente dois temas visuais (Dark e Light) desde o início, controlados por **CSS Custom Properties** no `:root` (dark) e uma classe toggle (`.light`) no `<html>`.

### ⚠️ INSTRUÇÃO PARA O AGENTE DE IA

**Antes de iniciar qualquer implementação de frontend**, pergunte ao usuário:

1. **Cor Accent principal** — A cor vibrante de destaque da marca (ex: verde neon, azul elétrico, roxo, laranja, etc.)
2. **Estética geral** — Dark-first? Light-first? Minimalista? Futurista? Corporativo?

Com base na resposta do usuário, **gere automaticamente** a paleta completa de 5 tokens semânticos para **ambos os temas** (Dark e Light), seguindo estas regras de derivação:

| Token | Dark Mode | Light Mode |
|---|---|---|
| `--background` | Preto profundo ou quase-preto (`#000000`–`#0A0A0A`) | Cinza claro/branco (`#F3F4F6`–`#FAFAFA`) |
| `--accent` | A cor accent escolhida pelo usuário (vibrante, saturada) | Versão mais escura/sóbria da accent (para legibilidade em fundo claro) |
| `--surface` | Preto ligeiramente mais claro que o background (`+5–10` luminosidade) | Branco puro ou quase-branco |
| `--border` | Grafite escuro com baixo contraste (`#1A1A1A`–`#2A2A2A`) | Cinza claro (`#E2E8F0`–`#E5E7EB`) |
| `--text` | Branco puro (`#FFFFFF`) | Grafite profundo (`#0F172A`–`#1A1A1A`) |

### Implementação via CSS Variables

No `index.css`, defina os tokens em variáveis CSS. **Nunca use cores hardcoded** nos componentes — sempre referencie os tokens:

```css
:root {
  --background: /* preto profundo */;
  --accent: /* cor escolhida pelo usuário — vibrante */;
  --surface: /* preto superfície */;
  --border: /* grafite escuro */;
  --text: /* branco */;
}

.light {
  --background: /* cinza claro */;
  --accent: /* versão sóbria da accent do usuário */;
  --surface: /* branco */;
  --border: /* cinza claro */;
  --text: /* grafite profundo */;
}
```

### Integração com Tailwind CSS v4 (`@theme`)

Ao usar Tailwind CSS v4+, mapeie as variáveis no bloco `@theme` para gerar classes utilitárias automaticamente:

```css
@import "tailwindcss";

@theme {
  --color-background: var(--background);
  --color-accent: var(--accent);
  --color-surface: var(--surface);
  --color-border: var(--border);
  --color-text: var(--text);

  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'Space Mono', monospace;
  --font-display: /* fonte display escolhida para o projeto */;
}
```

Isso habilita classes como `bg-background`, `text-accent`, `border-border` que mudam automaticamente com o tema.

### Toggle de Tema no React

```tsx
const toggleTheme = () => {
  const newTheme = !isLight;
  setIsLight(newTheme);
  if (newTheme) {
    document.documentElement.classList.add('light');
    localStorage.setItem('app_theme', 'light');
  } else {
    document.documentElement.classList.remove('light');
    localStorage.setItem('app_theme', 'dark');
  }
};
```

### Persistência do Tema

No componente raiz (`App.tsx`), restaure a preferência do usuário via `useEffect` na montagem:

```tsx
useEffect(() => {
  const savedTheme = localStorage.getItem('app_theme');
  if (savedTheme === 'light') {
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.remove('light');
  }
}, []);
```

---

## ✨ 9. Componentes Visuais Avançados e Efeitos

Para elevar a qualidade visual do produto a um nível premium, utilize componentes de efeito com moderação e consistência.

### A. Efeito Scanline (CRT Retro-Futurista)

Overlay CSS posicionado como `fixed inset-0 pointer-events-none z-50` com gradiente linear repetido de 4px que simula linhas de varredura de monitor CRT. Adapte a opacidade/cor por tema:

```css
.scanline {
  @apply fixed inset-0 pointer-events-none z-50 overflow-hidden;
  background: linear-gradient(
    to bottom, transparent 50%,
    rgba(180, 255, 0, 0.02) 50%, rgba(180, 255, 0, 0.02) 50.1%,
    transparent 50.1%
  );
  background-size: 100% 4px;
  animation: scan 10s linear infinite;
}
```

### B. Glassmorphism

Use `backdrop-blur-md` + `bg-surface/40` + `border border-border/20` em modais, navbars e cards que devem ter profundidade visual sobre fundos complexos.

### C. Accent Glow

Aplique `box-shadow` com a cor accent em baixa opacidade para destacar elementos ativos ou em hover:

```css
.accent-glow {
  box-shadow: 0 0 20px rgba(180, 255, 0, 0.15);
}
```

### D. Efeitos 3D com Three.js (Partículas/Waves)

Para seções decorativas (separadores entre Hero e conteúdo), encapsule cenas Three.js em componentes React com `useRef` para o container DOM e `useEffect` para lifecycle:

* Crie uma classe encapsulada (ex: `ParticlesSwarm`) com `animate()`, `resize()` e `dispose()`.
* Use `InstancedMesh` para alta performance com milhares de objetos.
* Aplique post-processing (`UnrealBloomPass`) apenas no modo Dark para evitar ruído visual no Light.
* Adicione gradientes de fade (`linear-gradient` via `<div>`) no topo e base da seção para transição suave com as seções adjacentes.

### E. Custom Scrollbar

Personalize a scrollbar para manter a coesão visual:

```css
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { @apply bg-transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  @apply bg-border rounded-full hover:bg-accent/40 transition-colors;
}
```

---

## 📋 10. Padrões Gerais de Organização e Convenções

### A. Hierarquia Tipográfica por Famílias de Fontes

Defina no mínimo **3 famílias de fontes** com funções claras. Carregue-as via Google Fonts no `index.html` com `preconnect`:

| Função | Família | Uso |
|---|---|---|
| **Display** | Syncopate (ou similar futurista) | Títulos `h1`–`h3`, uppercase, `tracking-tighter` |
| **Sans** | Inter (ou similar legível) | Corpo, inputs, labels, buttons |
| **Mono** | Space Mono (ou similar) | Metadados, códigos, elementos decorativos de UI |

No `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&family=Space+Mono&display=swap" rel="stylesheet">
```

### B. Ícones via Lucide React

Utilize a biblioteca [`lucide-react`](https://lucide.dev) como fonte única de ícones. Evite misturar bibliotecas de ícones (FontAwesome, Heroicons, etc.) em um mesmo projeto.

### C. Organização do Frontend (`/client/src`)

```
src/
├── assets/            # Imagens, SVGs, vídeos estáticos
├── components/
│   ├── ui/            # Design System primitivo (Button, Card, Input, Typography)
│   ├── RaedLogo.tsx   # Logo da marca como componente SVG inline
│   ├── WaveSection.tsx # Componentes decorativos visuais
│   └── [Feature].tsx  # Componentes de feature (ex: Simulation, TrainingHistory)
├── pages/
│   ├── Landing.tsx    # Rota "/" — Vitrine do projeto
│   ├── Login.tsx      # Rota "/login"
│   ├── Register.tsx   # Rota "/register"
│   ├── Onboarding.tsx # Rota "/onboarding" (Wizard pós-registro)
│   └── Dashboard.tsx  # Rota "/dashboard" (Área logada)
├── App.tsx            # Router + Theme bootstrap
├── main.tsx           # Entry point React
└── index.css          # Design tokens + @theme + efeitos globais
```

### D. Logo da Marca como Componente SVG Inline

O logo da marca (Raed, ou do projeto) deve ser um componente React com SVG inline, **nunca um arquivo de imagem**. Isso garante:
* Cores dinâmicas via `fill="currentColor"` (muda com tema e classes Tailwind)
* Escalabilidade perfeita via prop `className` (ex: `<RaedLogo className="h-4" />`)
* Zero requisições HTTP extras

### E. Documento DESIGN.md

Todo projeto deve possuir um arquivo `DESIGN.md` na raiz documentando o Design System adotado:
* **Paleta de Cores** (Hex exato para cada modo Dark/Light)
* **Tipografia** (Famílias, pesos e estilos utilizados)
* **Estética e Efeitos** (Scanlines, Glassmorphism, Accent Glow, etc.)
* **Mapeamento Tailwind** (Quais classes utilitárias correspondem a quais tokens)

### F. Autenticação via Google OAuth + JWT

Para projetos com login social, combine **Google Sign-In (One Tap)** no frontend com verificação do token ID via `google-auth-library` no backend. Após validação, emita um **JWT próprio** com `@fastify/jwt` contendo `{ id, email, role, companyId }` para todas as requisições subsequentes.

### G. Onboarding Multi-Etapas Pós-Registro

Após o primeiro login, redirecione usuários novos para um **fluxo de onboarding** em etapas (wizard). O campo `onboardingCompleted` na tabela `companies` controla se o usuário deve ser redirecionado ao onboarding ou ao dashboard.

### H. Seed de Dados Iniciais

Mantenha um script `db/seed.ts` com dados iniciais essenciais (admin padrão, categorias base, etc.) executável via `npm run db:seed`. Isso agiliza o setup de ambientes novos e garante que dados estruturais estejam sempre presentes.

---

## 🚀 11. Tailwind CSS v4 em Monorepos e Docker (Troubleshooting de Binários Nativos)

A versão **v4** do Tailwind CSS trouxe uma mudança estrutural massiva: ela abandonou o JavaScript puro em prol de dois motores nativos escritos em **Rust** para máxima performance (`lightningcss` e `@tailwindcss/oxide`). 

Como motores nativos precisam de binários compilados especificamente para o Sistema Operacional e a Arquitetura do processador, se você desenvolve no Windows e faz deploy em Docker (Alpine Linux), o `package-lock.json` gerado localmente **não incluirá os binários do Linux**, causando a falha fatal de `Cannot find module` durante a etapa de build (`npm run build`). E tentar forçar a instalação no Docker com Múltiplas Etapas (Multi-stage) causa travamentos por falta de Memória RAM na VPS (OOM Killer).

Para garantir que o Docker no Coolify passe direto sem travar:

### 1. Hardcode no `package.json` do Workspace Frontend
Force a inclusão dos binários da biblioteca gráfica do Linux (musl) diretamente no objeto `optionalDependencies` do seu `apps/web/package.json`. Isso obriga o `npm install` local no Windows a registrar as assinaturas do Linux no `package-lock.json`.

```json
  "optionalDependencies": {
    "@next/swc-win32-x64-msvc": "^16.2.7",
    "@next/swc-linux-x64-musl": "^16.2.7",
    "lightningcss-linux-x64-musl": "1.32.0",
    "@tailwindcss/oxide-linux-x64-musl": "4.3.0"
  }
```

> **Atenção às versões:** Mantenha a versão do `lightningcss-linux-x64-musl` perfeitamente alinhada com a versão requerida pelo Tailwind instalado. O mesmo vale para o `@tailwindcss/oxide-linux-x64-musl`.

### 2. Atualize o Lockfile Localmente
Logo após adicionar no `package.json`, rode no seu terminal do Windows:
```bash
npm install
```
Isso vai popular o `package-lock.json` com os links de download de Linux. Commit o lockfile junto com o código.

### 3. Use o Dockerfile Otimizado (Single-stage Builder)
Nunca use Multi-stage para a fase de `deps` em Monorepos com Tailwind v4. O processo de copiar gigabytes da pasta `node_modules` causa pico de disco IO e estouro de RAM. Use o construtor único com `npm ci`:

```dockerfile
# Usa apenas um estágio pesado
FROM docker.io/library/node:20-alpine AS builder

RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/

# Como o lockfile já possui as chaves do Linux, npm ci funciona perfeitamente
RUN npm ci --include=dev

COPY . .
RUN npm run build --workspace=@teko/web

# Extrai os binários standalone leves
FROM docker.io/library/node:20-alpine AS runner
# ...
```
Isso soluciona 100% dos travamentos de RAM no Coolify e quebras no Tailwind v4.
