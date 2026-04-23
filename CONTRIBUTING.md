# Contribuindo com o Juntos pelo Impacto

## Pre-requisitos

- Node.js 24 LTS (gerenciado via `mise`)
- npm 10+
- Docker + Docker Compose

## Configuracao do ambiente

```bash
git clone <url-do-repositorio>
cd juntos-pelo-impacto
npm install            # sempre na raiz, nunca dentro de apps/*
cp .env.example .env   # opcional — sobrescreve valores do Docker
```

Para subir o ambiente completo:

```bash
npm run docker:dev
```

Detalhes em [`docs/docker.md`](docs/docker.md).

## Estrutura do repositorio

Monorepo com npm workspaces. Dois apps (`@juntos/frontend`, `@juntos/backend`) e um pacote compartilhado opcional (`@juntos/shared-types`). Arquitetura completa em [`docs/architecture.md`](docs/architecture.md).

## Branches

- `main` e protegida.
- Crie branches a partir de `main` seguindo o padrao: `feat/...`, `fix/...`, `docs/...`, `chore/...`.

## Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/) com a seguinte estrutura:

```
<tipo>(<escopo>): <titulo curto>

<Paragrafo resumindo o que foi feito e por que.>

<Area 1>:
- Detalhe da mudanca
- Detalhe da mudanca

<Area 2>:
- Detalhe da mudanca
```

**Exemplo real** (commit [`99bb605`](https://github.com/igortargino/juntos-pelo-impacto/commit/99bb605a3e3f53415f80619961a418ca5164fa64)):

```
chore: add api nestjs

Bootstrap NestJS backend with Prisma integration and development Docker Compose setup.

Backend:
- Add NestJS application entrypoint (main.ts) binding to 0.0.0.0:PORT
- Add root AppModule importing ConfigModule (global) and PrismaModule
- Add PrismaService extending PrismaClient with onModuleInit/onModuleDestroy lifecycle hooks

Docker:
- Switch docker-compose.yml from production to development mode (Dockerfile.dev, volumes for HMR)
- Remove `profiles: ["full"]` so backend and frontend start by default
```

### Regras

- **Titulo:** tipo + escopo opcional + descricao curta em ingles, imperativo (`add`, `fix`, `remove` — nao `added`, `fixes`).
- **Corpo:** paragrafo de contexto seguido de bullets agrupadas por area afetada.
- **Tipos comuns:** `feat`, `fix`, `docs`, `chore`, `refactor`, `test`.
- **Idioma:** commits em ingles; documentacao e mensagens ao usuario em portugues.

## Dependencias

Nunca instale dependencias diretamente dentro de `apps/*`. Use:

```bash
npm install <pacote> --workspace @juntos/<nome>
```

Novas dependencias precisam de aprovacao previa.

## Qualidade

Antes de abrir um PR:

```bash
npm run lint
npm run typecheck
npm run build
```

## Documentacao

Mudancas estruturais (stack, modelo de dados, API, RBAC, Docker) devem ser documentadas **na mesma entrega**. Consulte a tabela em [`CLAUDE.md`](CLAUDE.md) para saber qual documento atualizar.

Nao crie novos arquivos `.md` — atualize os existentes.

## Trabalho com IA

Se estiver usando Claude Code ou outro assistente de IA, leia [`CLAUDE.md`](CLAUDE.md) antes. Ele contem as regras operacionais, proibicoes e o ciclo de trabalho esperado.