# Docker — Plano de Containerização

> Documento vivo. Descreve os Dockerfiles, serviços do Compose, variáveis de ambiente e fluxos de execução. Visão geral da arquitetura em [architecture.md](architecture.md).

## 1. Filosofia

Cada app tem **dois Dockerfiles** — produção e desenvolvimento — e a raiz tem **dois arquivos Compose auto-contidos**, um por ambiente.

**Não usamos overlays** (`-f base -f override`) nem `profiles`: cada arquivo define a stack completa do seu ambiente. Isso evita o merge implícito de listas (`ports`, `volumes`) entre arquivos, que é fonte comum de bugs silenciosos no Compose.

## 2. Arquivos

| Arquivo | Papel |
|---|---|
| `apps/frontend/Dockerfile` | Produção — build Vite + nginx servindo estáticos |
| `apps/frontend/Dockerfile.dev` | Desenvolvimento — Vite dev server com HMR |
| `apps/frontend/nginx.conf` | Config nginx (SPA fallback + cache de assets) |
| `apps/backend/Dockerfile` | Produção — multi-stage + usuário non-root |
| `apps/backend/Dockerfile.dev` | Desenvolvimento — `nest start --watch` + Prisma Client |
| `docker-compose.yml` | **Default — stack dev completa** |
| `docker-compose.prod.yml` | Stack de produção, opt-in explícito via `-f` |
| `.dockerignore` | Exclui `node_modules`, `.git`, `docs/` do contexto de build |

## 3. Serviços

Ambos os arquivos Compose sobem três serviços na mesma rede default. Os serviços se resolvem por nome (`postgres`, `backend`) sem `host.docker.internal`.

| Serviço | Imagem (dev) | Imagem (prod) | Porta (host) |
|---|---|---|---|
| `postgres` | `postgres:16-alpine` | `postgres:16-alpine` | `POSTGRES_PORT` (5432) |
| `backend` | build `Dockerfile.dev` | build `Dockerfile` | `BACKEND_PORT` (3000) |
| `frontend` | build `Dockerfile.dev` | build `Dockerfile` | `FRONTEND_PORT` (5173 dev / 8080 prod) |

**Healthcheck do Postgres:** `pg_isready` em loop com `interval: 5s`, `retries: 10`. O `backend` só inicia após `condition: service_healthy`.

## 4. Fluxos de execução

| Objetivo | Comando |
|---|---|
| Só o Postgres (dev local com apps fora do container) | `npm run docker:db` |
| Stack completa em modo dev (HMR) | `npm run docker:dev` |
| Stack completa em modo dev forçando rebuild | `npm run docker:dev:build` |
| Stack completa em modo produção | `npm run docker:prod` |
| Derrubar stack dev | `npm run docker:down` |
| Derrubar e apagar volumes (reseta o banco) | `npm run docker:down:volumes` |
| Logs em tempo real | `npm run docker:logs` |

**Recomendação de dev diário:** `docker:db` + apps rodando localmente (`npm run dev:frontend` / `dev:backend`). Ciclo mais rápido, sem atrito de rebuild de container. O `docker:dev` é útil para validar o comportamento completo containerizado.

## 5. Padrão dos Dockerfiles

### Produção — multi-stage

1. **`deps`** — instala todas as dependências. Copia o schema Prisma antes do `npm ci` porque o `postinstall` do backend roda `prisma generate`.
2. **`build`** — compila TypeScript, gera `dist/`.
3. **`prod-deps`** — reinstala com `--omit=dev` para reduzir a imagem final.
4. **`runtime`** — imagem mínima (`node:24-alpine` ou `nginx:alpine`). Backend roda como usuário non-root `nestjs`.

### Desenvolvimento — single-stage

- `node:24-alpine`, copia apenas manifestos de workspace e o schema Prisma, roda `npm ci`.
- **Não copia código-fonte** — o Compose faz bind mount de `./apps/<app>` em runtime.
- Montagens anônimas em `/repo/apps/<app>/node_modules` e `/repo/node_modules` preservam os `node_modules` do container, impedindo que o bind mount do código sobrescreva essas pastas.

### Ponto crítico — build context

O build context de todos os Dockerfiles é a **raiz do repositório**, não a pasta do app. Obrigatório porque o `package-lock.json` e `node_modules` vivem na raiz do workspace npm. O `.dockerignore` evita que `node_modules`, `.git` e `docs/` entrem no contexto.

### Vite dentro do container

O dev server precisa de `--host 0.0.0.0`. Sem isso, o Vite escuta em `127.0.0.1` *dentro* do container e fica inacessível do host. Já está embutido no `CMD` do `Dockerfile.dev`.

## 6. Variáveis de ambiente

Arquivos de ambiente:

| Arquivo | Quem lê | Variáveis |
|---|---|---|
| `.env` (raiz, local) | `docker-compose.yml` e `docker-compose.prod.yml` | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`, `BACKEND_PORT`, `FRONTEND_PORT`, `JWT_SECRET`, `VITE_API_URL` |
| `apps/backend/.env` | NestJS em dev local | `DATABASE_URL`, `JWT_SECRET` |
| `apps/frontend/.env` (opcional) | Vite em dev local | `VITE_API_URL` |

- `.env.example` da raiz é a referência versionada das variáveis usadas pelo Compose.
- `.env` da raiz é local, não versionado e fica no `.gitignore`.
- `apps/frontend/.env` é opcional para execução local do Vite fora de container.
- Valores do Compose usam `${VAR:-fallback}` — funcionam sem `.env` local.
- Exceção: `JWT_SECRET` no arquivo de produção usa `${VAR:?mensagem}` — falha explicitamente se não definido.
