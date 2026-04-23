# Contexto de projeto para assistentes de IA — Juntos pelo Impacto

Este arquivo é a fonte operacional de contexto e regras para IA neste repositório.

## Documentos de referência

| Documento | Responsabilidade |
|---|---|
| [docs/spech-delivery.md](docs/spech-delivery.md) | O QUÊ — requisitos funcionais, não funcionais, telas, escopo do MVP |
| [docs/architecture.md](docs/architecture.md) | COMO — stack, estrutura de pastas, workspaces, convenções |
| [docs/data-model.md](docs/data-model.md) | DADOS — entidades, relações, enums, regras derivadas do modelo |
| [docs/docker.md](docs/docker.md) | INFRA — Dockerfiles, Compose, variáveis de ambiente, fluxos |
| [docs/rbac.md](docs/rbac.md) | SEGURANÇA — matriz de permissões por perfil e endpoint |
| [docs/api.md](docs/api.md) | CONTRATO — endpoints, request/response por módulo |
| [docs/tasks.md](docs/tasks.md) | EXECUÇÃO — quebra técnica do MVP em tarefas ordenadas por fase |

Se uma instrução conflitar com esses documentos, pare e pergunte antes de prosseguir.

## Contexto do produto

Sistema de gestão para o programa **Juntos pelo Impacto**, cujo objetivo é substituir a gestão manual via planilhas do relacionamento entre alunos universitários, equipes e Organizações da Sociedade Civil (OSCs) parceiras. O sistema atual é descentralizado, gera duplicidade de seleção de OSCs e não dá visibilidade do progresso dos projetos.

### Perfis de usuário
- **Coordenador** — cadastra OSCs, altera status, gerencia projetos, acompanha dashboard. Criado via `prisma/seed.ts`.
- **Aluno** — cria/entra em projetos e continua projetos existentes. Cadastra-se via `/sign-up` quando habilitado.

### Entidades de domínio
- **User** — coordenador ou aluno, autenticado via JWT.
- **Project** — vínculo persistente com uma OSC. Persiste entre semestres; equipes diferentes podem executar o mesmo projeto em semestres distintos. Tem `status` (`ProjectStatus`).
- **Team** — equipe de alunos em um semestre específico. Tem `code` (6 chars, charset `A-Z`+`2-9`) e `createdBy` (líder da equipe).
- **TeamMember** — relação muitos-para-muitos entre User e Team. Um aluno pode estar em múltiplas equipes simultaneamente.
- **Osc** — organização parceira. Status: `AVAILABLE`, `IN_PROGRESS` ou `BLOCKED`.
- **AppConfig** — singleton de configuração global. Controla `signUpEnabled`.

### Regras de negócio críticas (da spec)
- **RF007 — Remoção automática:** ao criar um projeto com OSC `AVAILABLE`, a OSC muda para `IN_PROGRESS` e sai da lista de disponíveis. O criador da equipe é o líder (`Team.createdBy`).
- **RF008 — Disponibilidade manual:** o Coordenador define o status das OSCs manualmente via painel. A única transição bloqueada automaticamente é `IN_PROGRESS -> AVAILABLE` quando há projeto ativo vinculado (retorna `409`). OSCs `IN_PROGRESS` ou `BLOCKED` não aparecem para alunos.
- **RF010 — Cadastro controlado:** `/sign-up` só funciona quando `AppConfig.signUpEnabled = true`. O Coordenador controla esse flag.
- **RF014 — Status do projeto:** ao encerrar semestre, Coordenador define `COMPLETED`, `ABANDONED`, `ONGOING` ou `INCOMPLETE`. `COMPLETED`/`ABANDONED` liberam a OSC para `AVAILABLE` automaticamente.
- **RBAC:** separação rígida por perfil — detalhes em [docs/rbac.md](docs/rbac.md).

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
| Node | 24 LTS (via mise) |

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
| Plano de Docker, serviços, variáveis de ambiente | `docs/docker.md` |
| Modelo de dados (entidades, enums, relações, regras) | `docs/data-model.md` |
| Permissões e controle de acesso (RBAC) | `docs/rbac.md` |
| Contratos de API (endpoints, request, response) | `docs/api.md` |
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
- Cadastro público de alunos via `/sign-up`, controlado por flag no banco.
- CRUD de OSCs com gestão manual de status pelo Coordenador.
- Criação de projeto + equipe; entrada em equipe por código; continuação de projeto em novo semestre.
- Seleção de OSC pelo líder da equipe + remoção automática da lista (RF007).
- Definição de status do projeto ao encerrar semestre + liberação automática da OSC quando aplicável (RF014).
- Dashboard único do Coordenador com métricas, alerta de projetos pendentes de fechamento e controle do toggle `signUpEnabled`.

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

Fase: **planejamento concluído — pronto para implementação**. Toda a documentação está definida. Scaffold de backend (NestJS + Prisma) e frontend (Vite + React + Tailwind) existentes. Docker Compose configurado. Próximo passo: **Fase 0** de `docs/tasks.md` — escrever o schema Prisma e o seed.
