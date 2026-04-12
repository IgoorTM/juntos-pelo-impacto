# Contexto de projeto para assistentes de IA — Juntos pelo Impacto

Este arquivo é a fonte operacional de contexto e regras para IA neste repositório.

## Documentos de referência

- [docs/spech-delivery.md](docs/spech-delivery.md) — escopo funcional, requisitos, telas. **Fonte da verdade do que o MVP faz.**
- [docs/architecture.md](docs/architecture.md) — arquitetura, estrutura de pastas, stack, convenções de workspace, plano de Docker. **Fonte da verdade de como o código é organizado.**

Se uma instrução conflitar com esses documentos, pare e pergunte antes de prosseguir.

## Contexto do produto

Sistema de gestão para o programa **Juntos pelo Impacto**, cujo objetivo é substituir a gestão manual via planilhas do relacionamento entre alunos universitários, equipes e Organizações da Sociedade Civil (OSCs) parceiras. O sistema atual é descentralizado, gera duplicidade de seleção de OSCs e não dá visibilidade do progresso dos projetos.

### Perfis de usuário
- **Professor/Coordenador** — cadastra OSCs, altera status, acompanha métricas no dashboard.
- **Aluno** — visualiza OSCs disponíveis e seleciona uma para o projeto da equipe.

### Entidades de domínio
- **User** — coordenador ou aluno, autenticado via JWT.
- **Team** — equipe de alunos que executa um projeto.
- **OSC** (Organização da Sociedade Civil) — organização parceira. Tem status `DISPONIVEL`, `EM_ANDAMENTO` ou `BLOQUEADA`.
- **Project** — vínculo semestral entre uma Team e uma OSC. Tem marcação de finalizado/não finalizado.

### Regras de negócio críticas (da spec)
- **RF007 — Remoção automática:** quando uma equipe seleciona uma OSC, ela sai automaticamente da lista de disponíveis.
- **RF008 — Bloqueio automático:** OSCs que tiveram projeto não finalizado no semestre anterior ficam automaticamente bloqueadas para novas seleções.
- **RBAC:** separação rígida do que cada perfil pode fazer. Coordenador não seleciona OSC; aluno não altera status de OSC.

## Arquitetura em síntese

Monorepo leve com **npm workspaces** (sem Nx/Turborepo). Frontend e backend vivem em `apps/*` e se comunicam via HTTP. Orquestração local via **Docker Compose** com três serviços: `postgres`, `backend`, `frontend`. Detalhes completos em [docs/architecture.md](docs/architecture.md).

### Stack fixada
| Camada | Tecnologia |
|---|---|
| Frontend | Vite + React 19 + Tailwind CSS v4 |
| Backend | NestJS + Prisma |
| Banco | PostgreSQL 16 |
| Auth | JWT |
| Workspace | npm workspaces |
| Execução local | Docker + Docker Compose |
| Node | 20 LTS (via mise) |

Proibido sem discussão prévia: pnpm, yarn, Nx, Turborepo, Lerna, ORM que não seja Prisma, framework backend que não seja NestJS.

### Estrutura de pastas
```
juntos-pelo-impacto/
├── apps/
│   ├── frontend/       # @juntos/frontend — Vite + React
│   └── backend/        # @juntos/backend — NestJS + Prisma
├── packages/           # Pacotes internos (opcional no arranque)
│   └── shared-types/   # @juntos/shared-types — contratos compartilhados
├── docker/             # Scripts auxiliares (ex: init do Postgres)
├── docs/               # spech-delivery.md, architecture.md
└── docker-compose.yml  # Orquestra postgres + backend + frontend
```

### Convenções
- **Scope:** todo pacote interno usa prefixo `@juntos/*`.
- **Install:** `npm install` sempre na raiz. Nunca dentro de `apps/*`. Adicionar dep a um workspace: `npm install <pkg> --workspace @juntos/<nome>`.
- **Dep entre workspaces internos:** declarada como `"@juntos/<nome>": "*"`.
- **Frontend:** organizado por feature (`src/features/oscs`, `src/features/auth`…), não por tipo.
- **Backend:** organizado por módulo NestJS (`src/modules/auth`, `src/modules/oscs`…).
- **Idioma:** código em inglês; documentação e mensagens ao usuário em português; commits em inglês seguindo conventional commits.
- **Private:** todo `package.json` com `"private": true`.

## Regra crítica — documentar mudanças estruturais

**Toda vez que o usuário definir, alterar ou aprovar um dos itens abaixo, atualize o documento apropriado na mesma entrega — antes de considerar a tarefa concluída:**

| Tipo de mudança | Onde documentar |
|---|---|
| Stack, bibliotecas, versões de runtime | `docs/architecture.md` §2 |
| Estrutura de pastas (raiz, apps, packages) | `docs/architecture.md` §3 e §§5–7 |
| Convenções de workspaces, naming, scripts | `docs/architecture.md` §4 |
| Padrões de organização interna (feature-based, módulo NestJS…) | `docs/architecture.md` §5 ou §6 |
| Plano de Docker, serviços, variáveis de ambiente | `docs/architecture.md` §8 |
| Modelo de dados (entidades, enums, relações) | `docs/architecture.md` §9 |
| Convenções de commit, branch, lint, idioma | `docs/architecture.md` §10 |
| Mudança de escopo do MVP (incluir/excluir feature) | `docs/spech-delivery.md` + confirmar com usuário |
| Novas regras operacionais para a IA | Este arquivo (`CLAUDE.md`) |

Padronização que não está nos documentos **não existe**. Se você aplicou uma convenção que não está documentada, documente-a na mesma resposta.

## Fluxo de trabalho esperado

1. Antes de qualquer implementação não-trivial, confirme que a abordagem bate com o que está em `docs/architecture.md`.
2. Antes de criar nova convenção, nova pasta ou novo arquivo de config, verifique se já existe algo documentado. Se não, alinhe com o usuário antes.
3. Ao alterar estrutura, aplique a mudança **e** atualize `docs/architecture.md` na mesma entrega.
4. Divergência entre doc e código: trate a documentação como verdade; ajuste o código ou pergunte.
5. Não crie novos arquivos `.md` de documentação sem autorização — atualize os existentes.

## Escopo — o que fazer e o que não fazer

### Dentro do escopo do MVP
- Autenticação JWT com dois perfis (Coordenador, Aluno) e RBAC.
- CRUD de OSCs com gestão de status.
- Fluxo de seleção de OSC por equipe + remoção automática.
- Bloqueio automático de OSCs com projetos pendentes.
- Dashboard simplificado (contagem de OSCs e projetos ativos).

### Fora do escopo (não implementar, não propor)
- Ferramentas de monorepo pesadas (Nx, Turborepo, Lerna).
- CI/CD, deploy em servidor, load balancer.
- Formulários avançados, relatórios exportáveis, notificações complexas.
- Registro detalhado de projetos não concluídos.
- Observabilidade, logging estruturado, cache, filas.
- Testes E2E full-stack.

Prazo do MVP: **2 meses**. Prefira simplicidade a abstração especulativa. Não refatore código fora do que foi pedido.

## Guardrails de ação

- **Não** adicione dependências sem autorização.
- **Não** proponha refatorações oportunistas em código fora da tarefa.
- **Não** use emojis em código, commits ou documentação a menos que explicitamente solicitado.

## Estado atual

Fase: **estruturação inicial**. Arquitetura definida em `docs/architecture.md`. Pendente: `package.json` da raiz com workspaces, scaffold do backend NestJS, Dockerfiles, `docker-compose.yml`. O frontend já tem Vite + React + Tailwind em `apps/frontend/`; o backend em `apps/backend/` está vazio.