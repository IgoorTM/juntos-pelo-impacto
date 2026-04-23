# Juntos pelo Impacto

Sistema de gestão do programa **Juntos pelo Impacto** para substituir o controle manual em planilhas. O MVP centraliza gestão de OSCs, projetos, equipes e acompanhamento pelo coordenador em um monorepo com frontend (React + Vite) e backend (NestJS + Prisma).

## Pré-requisitos

- Node.js 24 LTS
- npm 10+
- Docker + Docker Compose

## Instalação

```bash
# sempre na raiz do repositório
npm install
```

Se quiser sobrescrever valores locais do Docker, copie as variáveis antes do primeiro `up`:

```bash
cp .env.example .env
```

## Comandos principais

### Desenvolvimento local

```bash
npm run dev:frontend
npm run dev:backend
```

### Qualidade e build

```bash
npm run lint
npm run typecheck
npm run build
```

### Docker

```bash
npm run docker:db
npm run docker:dev
npm run docker:prod
npm run docker:down
npm run docker:logs
```

## Mapa rápido da documentação

- [`docs/spech-delivery.md`](docs/spech-delivery.md): requisitos e escopo do MVP.
- [`docs/architecture.md`](docs/architecture.md): stack, estrutura e convenções de desenvolvimento.
- [`docs/data-model.md`](docs/data-model.md): entidades, enums e regras de dados.
- [`docs/api.md`](docs/api.md): contrato dos endpoints.
- [`docs/rbac.md`](docs/rbac.md): permissões por perfil.
- [`docs/docker.md`](docs/docker.md): serviços, variáveis de ambiente e fluxos Docker.
- [`docs/tasks.md`](docs/tasks.md): roadmap técnico por fases.
- [`CLAUDE.md`](CLAUDE.md): contexto operacional para assistentes de IA.
- [`CONTRIBUTING.md`](CONTRIBUTING.md): guia de contribuicao (branches, commits, dependencias).
