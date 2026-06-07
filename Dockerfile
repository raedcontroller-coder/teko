FROM docker.io/library/node:20-alpine AS builder

# Instalar dependencias do sistema necessarias
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar os arquivos de lock e package.json
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/

# Usamos npm ci para ser rápido e economizar RAM. 
# O tailwindcss/node e postcss estão nas "dependencies" então ele vai baixar.
RUN npm ci --include=dev

# Copiar o resto do código
COPY . .

# Fazer o build do Next.js
RUN npm run build --workspace=@teko/web

# Fase final super leve
FROM docker.io/library/node:20-alpine AS runner
WORKDIR /app

# Adicionar usuario nao-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar build e dependencias standalone
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
