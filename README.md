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

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev:frontend` | Sobe o frontend Vite em modo dev |
| `npm run dev:backend` | Sobe o backend NestJS em watch mode (quando scaffold estiver pronto) |
| `npm run build` | Build de todos os workspaces que tiverem script `build` |
| `npm run lint` | Lint em todos os workspaces que tiverem script `lint` |
| `npm run typecheck` | Typecheck em todos os workspaces que tiverem script `typecheck` |

Adicionar uma dependência a um workspace específico:

```bash
npm install <pacote> --workspace @juntos/frontend
npm install <pacote> --workspace @juntos/backend
```

## Status do setup

Este repositório está em **fase de estruturação inicial**. Progresso:

- [x] Arquitetura definida em [docs/architecture.md](docs/architecture.md)
- [x] `package.json` da raiz com `npm workspaces` configurado
- [x] Frontend renomeado para `@juntos/frontend`
- [x] Placeholder de `@juntos/backend` criado
- [x] `.env.example` da raiz para o futuro `docker-compose.yml`
- [ ] Scaffold do backend (NestJS + Prisma)
- [ ] `Dockerfile` de cada app + `docker-compose.yml`
- [ ] Pacote `@juntos/shared-types` (criar quando surgir a primeira necessidade)
