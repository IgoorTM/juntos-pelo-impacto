# syntax=docker/dockerfile:1.7
#
# Dockerfile de PRODUÇÃO do frontend (@juntos/frontend).
# Build Vite + serve estáticos via nginx.
#
# IMPORTANTE: o build context é a RAIZ do monorepo, não apps/frontend,
# porque o lockfile e o node_modules vivem na raiz do workspace npm.

# ─── Stage: build ──────────────────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /repo

# Manifestos de TODOS os workspaces — o npm precisa enxergar a topologia
# completa antes de rodar `ci`.
COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/backend/package.json apps/backend/package.json

RUN npm ci --workspace @juntos/frontend --include-workspace-root

COPY apps/frontend apps/frontend
RUN npm run build --workspace @juntos/frontend

# ─── Stage: runtime ────────────────────────────────────────────────────────
FROM nginx:alpine AS runtime

COPY --from=build /repo/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
