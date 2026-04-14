# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS build
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/backend/package.json apps/backend/package.json

RUN npm ci --workspace @juntos/frontend --include-workspace-root

COPY apps/frontend apps/frontend
RUN npm run build --workspace @juntos/frontend

FROM nginx:alpine AS runtime

COPY --from=build /repo/apps/frontend/dist /usr/share/nginx/html
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
