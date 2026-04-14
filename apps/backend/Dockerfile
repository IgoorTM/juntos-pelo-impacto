# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS deps
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/backend/package.json apps/backend/package.json
COPY apps/backend/prisma apps/backend/prisma

RUN npm ci --workspace @juntos/backend --include-workspace-root

FROM deps AS build
WORKDIR /repo

COPY apps/backend apps/backend
RUN npm run build --workspace @juntos/backend

FROM node:24-alpine AS prod-deps
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/backend/package.json apps/backend/package.json
COPY apps/backend/prisma apps/backend/prisma

RUN npm ci --workspace @juntos/backend --include-workspace-root --omit=dev

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S nodejs && adduser -S nestjs -G nodejs

COPY --from=prod-deps --chown=nestjs:nodejs /repo/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /repo/apps/backend/dist ./dist
COPY --from=build --chown=nestjs:nodejs /repo/apps/backend/package.json ./package.json
COPY --from=build --chown=nestjs:nodejs /repo/apps/backend/prisma ./prisma

USER nestjs
EXPOSE 3000

CMD ["node", "dist/main.js"]
