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

# Build do frontend (TanStack/Vite). Nitro emite output/public para SPA.
RUN npm run build

# Backend Express roda direto via tsx em produção (evita problemas de
# resolução ESM de imports sem extensão no output do tsc).

# Descobre onde o build do frontend caiu e normaliza para /app/dist/client e /app/dist/server.
RUN set -eux; \
    if   [ -d "output/public" ];  then mkdir -p dist && cp -r output/public dist/client && cp -r output/server dist/server; \
    elif [ -d ".output/public" ]; then mkdir -p dist && cp -r .output/public dist/client && cp -r .output/server dist/server; \
    elif [ -d "dist/client" ];    then :; \
    elif [ -d "dist" ];           then mv dist dist-tmp && mkdir dist && mv dist-tmp dist/client; \
    else echo "Frontend build output not found" && ls -la && exit 1; fi; \
    ls -la dist/client | head -20

# Remove devDependencies para o runtime.
RUN npm prune --omit=dev

# =========================
# Stage 3: runtime
# =========================
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=America/Sao_Paulo

RUN apk add --no-cache curl tini && \
    addgroup -S app && adduser -S app -G app

COPY --from=build --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/server ./server
COPY --from=build --chown=app:app /app/shared ./shared
COPY --from=build --chown=app:app /app/dist ./dist
COPY --from=build --chown=app:app /app/package.json ./package.json
COPY --from=build --chown=app:app /app/tsconfig.json ./tsconfig.json

USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/healthz || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "PORT=3001 node dist/server/index.mjs & PORT=3000 ./node_modules/.bin/tsx server/src/index.ts"]
