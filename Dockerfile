FROM docker.io/library/node:20-bookworm-slim AS builder

# O Bookworm já possui suporte completo à glibc, dispensando o libc6-compat
WORKDIR /app

# Copiar os arquivos de lock e package.json
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/

# Usamos npm ci para ser rápido, previsível e economizar RAM. 
# A base Debian (Bookworm) evita os erros nativos (ETXTBSY e Exit 255) do Alpine.
# Configurações de rede máximas adicionadas para tolerar VPS com internet instável no Coolify.
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm ci --prefer-offline

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
