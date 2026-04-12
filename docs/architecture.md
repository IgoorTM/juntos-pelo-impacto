# Arquitetura e Estrutura de Pastas — MVP Juntos pelo Impacto

> Documento vivo. Descreve a estrutura **inicial** adotada para o desenvolvimento do MVP. Escopo funcional e requisitos estão em [spech-delivery.md](spech-delivery.md).

## 1. Abordagem geral

O projeto é um **monorepo leve**, gerenciado com **npm workspaces**. Um único repositório Git contém duas aplicações (frontend e backend) e, opcionalmente, pacotes internos compartilhados.

Decisões estruturantes:

- **Gerenciador de pacotes:** `npm` (sem pnpm/yarn).
- **Coordenação de workspaces:** `npm workspaces` nativo.
- **Sem ferramentas extras de monorepo:** nada de Nx, Turborepo, Lerna, Moon ou Bazel.
- **Orquestração de execução:** `Docker Compose` (sobe frontend + backend + Postgres juntos).
- **Comunicação entre apps:** HTTP (frontend → API REST do backend).

### Por que npm workspaces e não Nx/Turborepo?

| Benefício de Nx/Turborepo | Relevância no MVP |
|---|---|
| Cache remoto de builds | Baixa — time pequeno, builds rápidos |
| Graph de dependências rico | Baixa — poucos pacotes |
| Execução paralela coordenada | Supre-se com scripts npm |
| Geradores de código | Não necessários |
| Curva de aprendizado | **Custo real** para 2 meses de prazo |

`npm workspaces` entrega o essencial — lockfile único, symlinks entre pacotes internos, `npm install` centralizado — sem custo adicional de aprendizado.

## 2. Stack técnica

| Camada | Tecnologia | Motivo |
|---|---|---|
| Frontend | Vite + React 19 + Tailwind CSS v4 | Já inicializado, stack moderna e leve |
| Backend | NestJS (Node.js) | Estruturado, modular, bom para RBAC + JWT |
| ORM | Prisma | Migrações simples, tipagem automática |
| Banco | PostgreSQL 16 | Requisito da spec, relacional, maduro |
| Auth | JWT (JSON Web Tokens) | Requisito da spec |
| Workspace | npm workspaces | Simples e nativo |
| Orquestração local | Docker + Docker Compose | Ambiente reproduzível com um comando |
| Versão do Node | 24 LTS | Gerenciado via `mise` |

## 3. Estrutura de pastas — visão geral

```
juntos-pelo-impacto/
├── apps/
│   ├── frontend/              # Aplicação React (workspace)
│   └── backend/               # API NestJS (workspace)
├── packages/                  # Pacotes internos compartilhados (workspace)
│   └── shared-types/          # Enums e tipos de contrato (OscStatus, UserRole…)
├── docker/
│   └── postgres/              # Scripts de init do Postgres (se necessário)
├── docs/
│   ├── spech-delivery.md      # Especificação técnica do MVP
│   ├── architecture.md        # Este documento
│   └── assets/                # Imagens e diagramas
├── .env.example               # Variáveis consumidas pelo docker-compose
├── .gitignore
├── docker-compose.yml         # Orquestra frontend + backend + postgres
├── mise.toml                  # Versão do Node para desenvolvimento local
├── package.json               # Raiz do workspace (scripts + lista de workspaces)
├── package-lock.json          # Lockfile único do monorepo
├── README.md                  # Quick-start
└── CLAUDE.md                  # Contexto de alto nível para assistentes de IA
```

Pontos a notar:

- Existe **um único** `package.json` na raiz declarando os workspaces. Cada app/pacote também tem o seu próprio `package.json` com suas dependências.
- Existe **um único** `package-lock.json` e **um único** `node_modules`, ambos na raiz. Subpastas `node_modules` só aparecem quando há conflito de versão entre pacotes.
- A pasta `packages/` é opcional no arranque e pode ser criada apenas quando surgir a primeira necessidade concreta de compartilhar código (ex: enum `OscStatus` usado nos dois lados).
- `docs/assets/` já existe e guarda os mockups das telas referenciados em `spech-delivery.md`.

## 4. Workspaces — convenções

- **Naming scope:** todos os pacotes internos usam o prefixo `@juntos/`.
  - `@juntos/frontend`
  - `@juntos/backend`
  - `@juntos/shared-types`
- **`"private": true`** em todos os `package.json` (raiz e workspaces) — impede publicação acidental no registry público.
- **Dependência entre pacotes internos:** declarada como `"@juntos/shared-types": "*"` nas `dependencies` do workspace consumidor. O npm resolve como symlink local.
- **Instalação:** sempre rodar `npm install` na raiz do projeto. Nunca dentro de `apps/frontend` ou `apps/backend`.
- **Scripts orquestradores** ficam na raiz e delegam para os workspaces via `--workspace` ou `--workspaces --if-present`. Exemplos conceituais:
  - `npm run dev:frontend` → `npm run dev --workspace @juntos/frontend`
  - `npm run build` → `npm run build --workspaces --if-present`

## 5. Estrutura interna — `apps/frontend`

Projeto Vite + React já existente. Organização planejada para o MVP:

```
apps/frontend/
├── public/                    # Arquivos estáticos servidos como estão
├── src/
│   ├── assets/                # Imagens, ícones, fontes
│   ├── components/            # Componentes reutilizáveis (Button, Input, Card…)
│   ├── features/              # Código organizado por domínio
│   │   ├── auth/              # Login, contexto de autenticação
│   │   ├── oscs/              # Listagem, cadastro, seleção
│   │   └── dashboard/         # Painel do coordenador
│   ├── layouts/               # Layouts de página (ex: layout autenticado)
│   ├── pages/                 # Páginas/rotas
│   ├── lib/                   # Cliente HTTP, helpers, config
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example               # VITE_API_URL e afins
├── Dockerfile                 # Imagem para o compose
├── eslint.config.js
├── index.html
├── package.json
└── vite.config.js
```

**Organização por feature, não por tipo.** Dentro de `features/oscs` ficam juntos os componentes, hooks e chamadas de API daquela feature. Reduz navegação entre pastas e é o padrão que melhor escala para o tamanho do MVP.

## 6. Estrutura interna — `apps/backend`

Projeto NestJS (ainda a ser inicializado). Organização planejada:

```
apps/backend/
├── prisma/
│   ├── schema.prisma          # Modelo de dados (User, Team, Osc, Project)
│   ├── migrations/            # Histórico de migrações versionadas
│   └── seed.ts                # Dados iniciais para desenvolvimento
├── src/
│   ├── modules/               # Módulos NestJS por domínio
│   │   ├── auth/              # Login, JWT strategy, guards, RBAC
│   │   ├── users/             # CRUD básico de usuários
│   │   ├── oscs/              # Cadastro, listagem, status, seleção
│   │   └── dashboard/         # Métricas agregadas
│   ├── common/                # Decorators, filters, interceptors, pipes
│   ├── config/                # Carregamento e validação de env vars
│   ├── prisma/                # PrismaService (injetável)
│   ├── app.module.ts
│   └── main.ts
├── test/                      # Testes e2e
├── .env.example
├── Dockerfile                 # Imagem para o compose
├── nest-cli.json
├── package.json
└── tsconfig.json
```

**Organização por módulo NestJS.** Cada módulo encapsula seu próprio controller, service, DTOs e (quando aplicável) guards. É a convenção do NestJS e dá fronteiras claras ao código — facilita tanto revisão humana quanto navegação por assistentes de IA.

## 7. Pacote compartilhado — `packages/shared-types`

Propósito: concentrar contratos que precisam ser idênticos nos dois lados — enums de status, roles de usuário e tipos de request/response usados tanto pela API (NestJS) quanto pelo cliente HTTP do frontend.

Exemplos de conteúdo planejado (apenas ilustrativo):

- `UserRole` — `COORDENADOR` | `ALUNO`
- `OscStatus` — `DISPONIVEL` | `EM_ANDAMENTO` | `BLOQUEADA`
- Interfaces de request/response do endpoint de login e da listagem de OSCs

Este pacote é **opcional no arranque**. Pode ser criado só quando surgir a primeira duplicação real entre frontend e backend. No momento em que existir, ele:

- Vira um workspace sob `packages/shared-types`
- Expõe os tipos via `src/index.ts`
- É consumido via `import { OscStatus } from '@juntos/shared-types'`

## 8. Docker — plano de containerização

Cada app terá seu próprio `Dockerfile`, e a raiz terá um `docker-compose.yml` que sobe os três serviços juntos.

### 8.1. Serviços do `docker-compose.yml`

| Serviço | Imagem base | Porta exposta | Depende de |
|---|---|---|---|
| `postgres` | `postgres:16-alpine` | 5432 | — |
| `backend` | build de `apps/backend/Dockerfile` | 3000 | `postgres` |
| `frontend` | build de `apps/frontend/Dockerfile` | 5173 | `backend` |

Layout conceitual (os valores reais virão em um passo posterior):

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
    ports:
      - "3000:3000"

  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
    environment:
      VITE_API_URL: http://localhost:3000
    depends_on:
      - backend
    ports:
      - "5173:5173"

volumes:
  postgres_data:
```

**Observação importante sobre monorepo + Docker:** como o lockfile e o `node_modules` vivem na raiz do workspace, o `context` do build de cada Dockerfile deve ser a **raiz do repositório** (não a pasta do app). Assim o build tem acesso ao `package.json` da raiz e ao `package-lock.json` único, o que permite `npm ci` reproduzível dentro do container.

### 8.2. Padrão dos Dockerfiles (multi-stage)

Ambos os Dockerfiles seguirão o mesmo padrão de **multi-stage build**:

1. **Stage `deps`** — copia `package.json` da raiz + `package.json` do workspace em questão + `package-lock.json` e roda `npm ci`. Essa camada é cacheada e só invalida quando dependências mudam.
2. **Stage `build`** — copia o código-fonte e roda `npm run build --workspace @juntos/<nome>`.
3. **Stage `runtime`** — imagem mínima (`node:20-alpine` ou `nginx:alpine` para o frontend servindo estáticos) contendo apenas os artefatos necessários para rodar.

Esse padrão reduz o tamanho final da imagem e acelera rebuilds durante desenvolvimento.

**Dev vs produção:** para o MVP, a abordagem mais simples é:
- **Desenvolvimento:** rodar `npm run dev:frontend` e `npm run dev:backend` localmente (fora do container) e deixar apenas o **Postgres no Docker**. Isso dá o melhor HMR e o ciclo mais rápido.
- **Validação / demonstração:** rodar o stack completo via `docker-compose up` para testar como tudo se integra.

Um `docker-compose.override.yml` com montagem de volume e modo watch pode ser adicionado depois, se a equipe preferir desenvolver totalmente dentro do container.

### 8.3. Variáveis de ambiente

Existem dois níveis de `.env`:

| Arquivo | Quem lê | Conteúdo típico |
|---|---|---|
| `.env` na raiz | `docker-compose.yml` | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `JWT_SECRET`, portas |
| `apps/backend/.env` | NestJS em dev local | `DATABASE_URL` apontando para `localhost:5432`, `JWT_SECRET` |
| `apps/frontend/.env` | Vite em dev local | `VITE_API_URL=http://localhost:3000` |

Cada um tem seu `.env.example` versionado. Os `.env` reais ficam no `.gitignore`.

## 9. Modelo de dados (esboço inicial)

Derivado dos requisitos da spec. Serve apenas para orientar a estrutura de pastas do Prisma — o schema definitivo será escrito na fase de implementação.

- **User** — `id`, `name`, `email`, `passwordHash`, `role` (`COORDENADOR` | `ALUNO`)
- **Team** — `id`, `name`, membros (relação com User)
- **Osc** — `id`, `name`, `description`, `contactEmail`, `status` (`DISPONIVEL` | `EM_ANDAMENTO` | `BLOQUEADA`), `selectedByTeamId` (FK nullable)
- **Project** — `id`, `teamId`, `oscId`, `semestre`, `finalizado` (bool)

A regra de bloqueio automático (RF008) será implementada como lógica no service da OSC ao listar disponíveis (ou como coluna derivada — decidir na implementação).

## 10. Convenções transversais

- **Idioma:** código em inglês, documentação em português.
- **Commits:** conventional commits (`feat:`, `fix:`, `docs:`, `chore:`…).
- **Branches:** `main` protegida; trabalho em `feat/…`, `fix/…`.
- **Lint/format:** cada workspace configura o seu. Frontend já tem ESLint; backend adicionará ao ser inicializado.
- **TypeScript:** obrigatório no backend (NestJS). Frontend hoje é JSX puro; migração para TSX é decisão da equipe.

## 11. O que **não** está nesta arquitetura (e por quê)

| Item | Motivo |
|---|---|
| Nx, Turborepo, Lerna | Complexidade desnecessária no prazo de 2 meses |
| CI/CD, deploy, load balancer | Fora do escopo do MVP (vide spec, seção 6) |
| Observabilidade, logging estruturado | Fora do escopo do MVP |
| Testes E2E full-stack | Fora do escopo do MVP |
| Cache Redis, filas | Não há necessidade no fluxo do MVP |

Estes itens são revisitados em iterações pós-MVP, conforme o projeto amadurecer.
