FROM node:20-alpine AS base

# Fase 1: Instalando dependencias
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copia package.json do root e o package-lock
COPY package.json package-lock.json ./

# Copia package.json dos workspaces para o npm install funcionar direito
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/

# Força o ambiente de desenvolvimento apenas para baixar as dependencias de Build (como o Tailwind)
RUN NODE_ENV=development npm ci

# Fase 2: Construindo o projeto
FROM base AS builder
WORKDIR /app
# Copia tudo do deps (incluindo node_modules raiz E os node_modules dos workspaces)
COPY --from=deps /app ./
# Agora copia o codigo fonte. O .dockerignore ja impede de sobrescrever os node_modules
COPY . .

# Desabilita telemetria no momento do build
ENV NEXT_TELEMETRY_DISABLED 1

# O Next.js precisa das variáveis de ambiente na hora do build (para standalone)
# Mas no Docker isso será passado pelo Coolify, então não se preocupe
RUN npm run build --workspace=@teko/web

# Fase 3: Imagem final super leve apenas com o que o Next.js precisa
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public

# Cria pasta .next com permissão
RUN mkdir -p apps/web/.next
RUN chown nextjs:nodejs apps/web/.next

# Copia o build standalone gerado pelo Next.js
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Executa o server.js gerado pelo standalone
CMD ["node", "apps/web/server.js"]
