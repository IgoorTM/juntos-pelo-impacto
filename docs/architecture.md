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
├── docker-compose.yml         # Stack dev completa (default)
├── docker-compose.prod.yml    # Stack prod (opt-in via -f)
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

Projeto NestJS inicializado via `@nestjs/cli` e ajustado para o monorepo (sem lockfile próprio, sem scripts/deps de teste, com Prisma integrado via módulo global). Organização atual e planejada:

```
apps/backend/
├── prisma/
│   ├── schema.prisma          # Datasource + generator (modelos a adicionar)
│   ├── migrations/            # [futuro] Histórico de migrações versionadas
│   └── seed.ts                # [futuro] Dados iniciais para desenvolvimento
├── src/
│   ├── modules/               # [futuro] Módulos NestJS por domínio
│   │   ├── auth/              # Login, JWT strategy, guards, RBAC
│   │   ├── users/             # CRUD básico de usuários
│   │   ├── oscs/              # Cadastro, listagem, status, seleção
│   │   └── dashboard/         # Métricas agregadas
│   ├── common/                # [futuro] Decorators, filters, interceptors
│   ├── prisma/                # PrismaModule + PrismaService (Global)
│   ├── app.controller.ts      # Endpoint raiz (gerado pelo CLI)
│   ├── app.service.ts
│   ├── app.module.ts          # Importa PrismaModule
│   └── main.ts                # Bootstrap com bind em 0.0.0.0
├── .env.example
├── .prettierrc
├── Dockerfile                 # Produção — multi-stage + prisma generate
├── Dockerfile.dev             # Desenvolvimento — nest start --watch
├── eslint.config.mjs          # Flat config (typescript-eslint + prettier)
├── nest-cli.json
├── package.json
├── tsconfig.build.json
└── tsconfig.json
```

**Pastas marcadas como `[futuro]`** serão criadas sob demanda conforme os módulos de domínio forem implementados. O scaffold inicial só contém o `PrismaModule` + o `AppController` padrão do CLI, seguindo o princípio de não criar estrutura especulativa.

**Testes e2e (`test/`) estão fora do escopo do MVP** e por isso não foram gerados. Quando surgir necessidade, adicionar junto com `@nestjs/testing` + `jest`.

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

Cada app tem **dois Dockerfiles** — um de produção e um de desenvolvimento — e a raiz tem **dois arquivos Compose auto-contidos**, um por ambiente. **Não usamos overlays** (`-f base -f override`) nem `profiles` para separar dev e prod: cada arquivo define a stack completa do seu ambiente. Isso evita o merge de listas (`ports`, `volumes`) entre arquivos, que é fonte comum de bugs silenciosos no Compose.

### 8.1. Arquivos criados

| Arquivo | Papel |
|---|---|
| `apps/frontend/Dockerfile` | Produção — build Vite + nginx servindo estáticos |
| `apps/frontend/Dockerfile.dev` | Desenvolvimento — Vite dev server com HMR |
| `apps/frontend/nginx.conf` | Config nginx (SPA fallback + cache de assets) |
| `apps/backend/Dockerfile` | Produção — multi-stage com `prod-deps` isolado e usuário non-root |
| `apps/backend/Dockerfile.dev` | Desenvolvimento — `nest start --watch` com Prisma Client pré-gerado |
| `docker-compose.yml` | **Default — stack dev completa** (postgres + backend watch + frontend Vite) |
| `docker-compose.prod.yml` | Stack de produção, opt-in explícito via `-f` |
| `.dockerignore` | Exclui `node_modules`, `.git`, docs etc. do contexto de build |

### 8.2. Serviços

Ambos os arquivos sobem os três serviços (`postgres`, `backend`, `frontend`) na mesma rede default criada pelo Compose. Os serviços se resolvem por nome (`postgres`, `backend`) sem precisar de `host.docker.internal`.

| Serviço | Imagem (dev) | Imagem (prod) | Porta (host) |
|---|---|---|---|
| `postgres` | `postgres:16-alpine` | `postgres:16-alpine` | `POSTGRES_PORT` (5432) |
| `backend` | build `Dockerfile.dev` | build `Dockerfile` | `BACKEND_PORT` (3000) |
| `frontend` | build `Dockerfile.dev` | build `Dockerfile` | `FRONTEND_PORT` (5173 dev, 8080 prod) |

**Healthcheck do Postgres:** `pg_isready` em loop. O `backend` só inicia após o healthcheck passar (`condition: service_healthy`).

### 8.3. Fluxos de execução

| Objetivo | Comando |
|---|---|
| Subir só o Postgres (dev local com apps fora do container) | `npm run docker:db` |
| Stack completa em modo dev (HMR) | `npm run docker:dev` |
| Stack completa em modo dev forçando rebuild | `npm run docker:dev:build` |
| Stack completa em modo produção | `npm run docker:prod` |
| Derrubar stack default (dev) | `npm run docker:down` |
| Derrubar e apagar volumes | `npm run docker:down:volumes` |

**Recomendação de dev diário:** `docker:db` + `npm run dev:frontend` / `dev:backend` rodando localmente. O ciclo mais rápido é com os apps fora do container, apontando para o Postgres do compose via `localhost:5432`. O `docker:dev` é útil quando você precisa validar o comportamento completo dentro dos containers.

### 8.4. Padrão dos Dockerfiles

**Produção — multi-stage:**
1. **`deps`** — instala todas as dependências (dev + prod) necessárias para o build. Copia o schema Prisma antes do `npm ci` porque o `postinstall` do backend roda `prisma generate`.
2. **`build`** — compila TypeScript e gera `dist/`.
3. **`prod-deps`** — reinstala com `--omit=dev` para reduzir o tamanho da imagem final.
4. **`runtime`** — imagem mínima (`node:24-alpine` ou `nginx:alpine`). Backend roda como usuário non-root `nestjs` (princípio do menor privilégio).

**Desenvolvimento — single-stage:**
- `node:24-alpine`, copia apenas manifestos de workspace e (no backend) o schema Prisma, roda `npm ci`. **Não copia código-fonte** — o compose faz bind mount de `./apps/<app>` em runtime, e volumes nomeados (`backend_node_modules`, `frontend_node_modules`, `root_node_modules`) preservam os `node_modules` instalados na build, impedindo que o bind mount apague as dependências.

**Ponto crítico sobre context:** o build context de todos os Dockerfiles é a **raiz do repositório**, não a pasta do app. Isso é obrigatório porque o lockfile e o `node_modules` vivem na raiz do workspace npm. O `.dockerignore` na raiz evita que `node_modules`, `.git`, `docs/` e outros itens pesados entrem no contexto de build.

**Vite dentro do container:** o dev server precisa ser iniciado com `--host 0.0.0.0`. Sem isso, o Vite escuta apenas em `127.0.0.1` *dentro* do container e fica inacessível a partir do host. Já está embutido no `CMD` do `Dockerfile.dev`.

### 8.5. Variáveis de ambiente

Existem dois níveis de `.env`:

| Arquivo | Quem lê | Conteúdo típico |
|---|---|---|
| `.env` na raiz | `docker-compose.yml` e `docker-compose.prod.yml` | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT`, `BACKEND_PORT`, `FRONTEND_PORT`, `JWT_SECRET`, `VITE_API_URL` |
| `apps/backend/.env` | NestJS em dev local (fora do container) | `DATABASE_URL=postgresql://...@localhost:5432/...`, `JWT_SECRET` |
| `apps/frontend/.env` | Vite em dev local (fora do container) | `VITE_API_URL=http://localhost:3000` |

O `.env.example` da raiz está versionado. Os `.env` reais ficam no `.gitignore`. Cada valor no compose tem **default via sintaxe `${VAR:-fallback}`** para funcionar mesmo sem `.env` local (útil para um `up` rápido de avaliação). A única exceção é `JWT_SECRET` no arquivo de produção, que usa `${VAR:?mensagem}` para falhar explicitamente se não estiver definido.

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
