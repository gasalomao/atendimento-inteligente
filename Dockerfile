# syntax=docker/dockerfile:1.7

# =========================
# Stage 1: install deps
# =========================
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json bun.lock* package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm install --no-audit --no-fund --loglevel=error

# =========================
# Stage 2: build (frontend + backend)
# =========================
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build do frontend (TanStack/Vite) com preset node-server para rodar no Docker.
RUN NITRO_PRESET=node-server npm run build

# Verifica se o build gerou a pasta .output
RUN ls -la .output/server/ && ls -la .output/public/ | head -20

# Remove devDependencies para o runtime.
RUN npm prune --omit=dev

# =========================
# Stage 3: runtime
# =========================
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=America/Sao_Paulo

RUN apk add --no-cache curl tini && \
    addgroup -S app && adduser -S app -G app

# Copia .output intacto (Nitro precisa dos paths relativos para servir CSS/JS)
COPY --from=build --chown=app:app /app/.output ./.output

# Express API server + notification worker
COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/server ./server
COPY --from=build --chown=app:app /app/shared ./shared
COPY --from=build --chown=app:app /app/package.json ./package.json
COPY --from=build --chown=app:app /app/tsconfig.json ./tsconfig.json

USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/healthz || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
# Nitro SSR na porta 3000 (principal) | Express API na porta 3001 (interno)
CMD ["sh", "-c", "NITRO_PORT=3000 PORT=3000 HOST=0.0.0.0 node .output/server/index.mjs & PORT=3001 ./node_modules/.bin/tsx server/src/index.ts & wait"]
