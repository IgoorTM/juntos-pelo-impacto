# Juntos pelo Impacto

Sistema de gestão do programa **Juntos pelo Impacto** — MVP.

Monorepo leve com frontend (Vite + React) e backend (NestJS + Prisma + PostgreSQL), gerenciado por **npm workspaces** e orquestrado por **Docker Compose**.

## Documentação

- [Especificação técnica do MVP](docs/spech-delivery.md)
- [Arquitetura e estrutura de pastas](docs/architecture.md)
- [Contexto para assistentes de IA](CLAUDE.md)

## Estrutura

```
juntos-pelo-impacto/
├── apps/
│   ├── frontend/       # Vite + React + Tailwind
│   └── backend/        # NestJS + Prisma + JWT
├── packages/           # Pacotes internos compartilhados (opcional)
├── docker/             # Configs auxiliares
├── docs/               # Documentações
└── docker-compose.yml  # Orquestra frontend + backend + postgres
```

## Pré-requisitos

- Node.js 24 LTS (recomendado usar [mise](https://mise.jdx.dev/))
- npm 10+
- Docker + Docker Compose

## Instalação

```bash
# Na raiz do repositório — nunca dentro de apps/*
npm install
```

O `package-lock.json` é único e vive na raiz. Todos os workspaces compartilham um único `node_modules`.

## Scripts — workspaces

| Comando | Descrição |
|---|---|
| `npm run dev:frontend` | Sobe o frontend Vite em modo dev |
| `npm run dev:backend` | Sobe o backend NestJS em watch mode (quando o scaffold existir) |
| `npm run build` | Build de todos os workspaces que tiverem script `build` |
| `npm run lint` | Lint em todos os workspaces que tiverem script `lint` |
| `npm run typecheck` | Typecheck em todos os workspaces que tiverem script `typecheck` |

Adicionar uma dependência a um workspace específico:

```bash
npm install <pacote> --workspace @juntos/frontend
npm install <pacote> --workspace @juntos/backend
```

## Scripts — Docker

Fluxo recomendado de dev diário: rodar **apenas o Postgres** no Docker e os apps localmente fora do container (HMR mais rápido, menos atrito).

```bash
# Copie o .env.example antes do primeiro up
cp .env.example .env

# Só Postgres (recomendado para dev local)
npm run docker:db

# Stack completa em modo dev (HMR dentro do container, via docker-compose.dev.yml)
npm run docker:dev

# Stack completa em modo produção (Dockerfiles de prod)
npm run docker:prod

# Derrubar tudo
npm run docker:down

# Derrubar e apagar volumes (reseta o banco)
npm run docker:down:volumes

# Logs em tempo real
npm run docker:logs
```

Notas:

- `postgres` sobe por padrão. `backend` e `frontend` estão no profile `full` do compose e só sobem com `--profile full` (já embutido nos scripts `docker:dev` e `docker:prod`).
- O serviço `backend` **só funcionará após o scaffold NestJS** ser criado. Até lá, use apenas `docker:db` no dia-a-dia.
- Em dev com Vite dentro do container, o dev server é iniciado com `--host 0.0.0.0` (necessário para ser acessível a partir do host).

Detalhes completos de arquitetura Docker em [docs/architecture.md](docs/architecture.md) §8.

## Status do setup

Progresso:

### **fase de estruturação inicial**

- [x] Arquitetura definida em [docs/architecture.md](docs/architecture.md)
- [x] `package.json` da raiz com `npm workspaces` configurado
- [x] Frontend renomeado para `@juntos/frontend`
- [x] Placeholder de `@juntos/backend` criado
- [x] `.env.example` da raiz para o `docker-compose.yml`
- [x] Dockerfiles de prod e dev para frontend e backend
- [x] `docker-compose.yml` + `docker-compose.dev.yml` com profile `full`
- [x] `.dockerignore` na raiz
- [ ] Scaffold do backend (NestJS + Prisma)
- [ ] Pacote `@juntos/shared-types` (criar quando surgir a primeira necessidade)
