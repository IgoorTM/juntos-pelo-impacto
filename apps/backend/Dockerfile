# syntax=docker/dockerfile:1.7
#
# Dockerfile de PRODUÇÃO do backend (@juntos/backend) — NestJS.
#
# ATENÇÃO — TEMPLATE:
# Este Dockerfile pressupõe que o scaffold NestJS em apps/backend já
# tenha sido criado (src/, tsconfig.json, scripts "build" e "start:prod"
# no package.json, Prisma Client gerado). Enquanto o scaffold não
# existir, o build deste arquivo vai falhar — por isso o serviço
# `backend` no docker-compose.yml está dentro do profile "full" e não
# sobe por padrão.
#
# Build context: raiz do monorepo (lockfile único + node_modules hoistado).

# ─── Stage: build ──────────────────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/backend/package.json apps/backend/package.json

RUN npm ci --workspace @juntos/backend --include-workspace-root

COPY apps/backend apps/backend

# Gera o Prisma Client antes do build TS.
# (Descomente quando o schema Prisma existir.)
# RUN npm run prisma:generate --workspace @juntos/backend

RUN npm run build --workspace @juntos/backend

# ─── Stage: runtime ────────────────────────────────────────────────────────
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Copia apenas o estritamente necessário para rodar.
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/backend/dist ./dist
COPY --from=build /repo/apps/backend/package.json ./package.json
# COPY --from=build /repo/apps/backend/prisma ./prisma

EXPOSE 3000

CMD ["node", "dist/main.js"]
