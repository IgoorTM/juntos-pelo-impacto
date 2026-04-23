# Reconciliação dos documentos-guia — Design Spec

> Data: 2026-04-22
> Escopo: contradições e lacunas nos documentos que orientam a implementação do MVP Juntos pelo Impacto.
> Estado: aprovado; pronto para virar plano de implementação.

## 1. Contexto

O MVP tem prazo de 2 meses e a implementação ainda não começou (Fase 0 de `docs/tasks.md` está para ser iniciada). Uma análise dos documentos-guia (`CLAUDE.md`, `README.md`, `docs/spech-delivery.md`, `docs/architecture.md`, `docs/data-model.md`, `docs/docker.md`, `docs/rbac.md`, `docs/api.md`, `docs/tasks.md`, `docs/monorepo.md`) revelou 16 inconsistências entre docs, lacunas que viram bug garantido e um arquivo órfão desalinhado da stack real. Devs e agentes de IA leem docs diferentes e chegam a comportamentos diferentes para o mesmo endpoint.

Este spec consolida as decisões para reconciliar os documentos antes que a implementação comece. Nenhum código é produzido por este spec — apenas mudanças nos documentos e em `docs/tasks.md` (para refletir consequências nas Fases 0–7).

## 2. Escopo

### 2.1 Incluído

- **Críticos** (contradições que fazem endpoints divergirem entre docs):
  - C1 — endpoint de seleção de OSC
  - C2 — mutabilidade de `Project.oscId`
  - C3 — body de `POST /projects` (decorrência de C1)
  - C4 — visibilidade de `GET /projects` para `STUDENT`
  - C5 — reativação de status em `POST /projects/:id/teams`
- **Altos** (gaps que viram bug ou desorientam agentes de IA):
  - A1 — `docs/monorepo.md` órfão e desalinhado
  - A2 — migration SQL bruta para unique parcial (consequência de C2)
  - A3 — comparador de semestres
  - A4 — CORS
- **Médios / Baixos** (editorial / hygiene):
  - M1+B4 — erros HTTP em `api.md`
  - M2 — JSX vs TSX no frontend
  - M3 — validação de DTO
  - M4 — autoria de team de continuação
  - M5 — semântica do `IN_PROGRESS` no `PATCH /projects/:id/status`
  - B1 — `README.md` cortado
  - B2 — checkboxes em `tasks.md`
  - B3 — "cadeira de extensão" no `CLAUDE.md` e `data-model.md`

### 2.2 Fora do escopo

- Implementação de código (schema.prisma, endpoints, telas).
- Mudanças de produto que não sejam reconciliação dos docs existentes.
- Ativação do workspace `packages/shared-types` — fica para quando surgir a 2ª duplicação real.
- Endurecer CORS (restrição por origem específica) — item pós-MVP.

## 3. Decisões

### 3.1 Fluxo de seleção de OSC — Modelo X (resolve C1, C3)

A seleção de OSC é **atômica com a criação/continuação do projeto**. Não existe endpoint separado de seleção.

**Fluxo A — novo projeto.** `POST /projects` body `{ name, oscId }`. Em uma transação: verifica `Osc.status = AVAILABLE`; cria `Project` com `oscId` e `status = IN_PROGRESS`; cria `Team` com semestre atual, `createdBy = user`, `code` gerado; insere criador em `TeamMember`; atualiza `Osc.status = IN_PROGRESS`.

**Fluxo B — continuação.** `POST /projects/:id/teams` sem body. O projeto precisa ter `status ∈ {ONGOING, INCOMPLETE}`. A OSC é **herdada** do `Project` — não é escolhida. Em uma transação: cria `Team` com semestre atual, `createdBy = user`, `code` gerado; insere criador em `TeamMember`; atualiza `Project.status = IN_PROGRESS`.

**Consequência:** a restrição "apenas o líder seleciona OSC" (RF007) é satisfeita por construção — quem submete vira o líder da `Team`. Nenhum guard adicional precisa checar `Team.createdBy` em runtime.

**Endpoint removido:** `POST /projects/:id/select-osc` sai de `api.md`, `rbac.md`, `tasks.md` e `CLAUDE.md`.

### 3.2 `Project.oscId` imutável + unique parcial (resolve C2, A2)

`Project.oscId` é gravado na criação e **nunca é alterado depois**. Garante histórico: cada projeto preserva a OSC que engajou, mesmo após fechamento.

**Unique parcial** no Postgres:

```sql
CREATE UNIQUE INDEX "project_osc_active_unique"
  ON "Project" ("oscId")
  WHERE status NOT IN ('COMPLETED', 'ABANDONED');
```

Expressa a invariante de negócio: em qualquer instante, no máximo um `Project` está "vivo" em uma mesma OSC. Prisma não expressa unique parcial nativamente — a migration gerada por `prisma migrate dev --name init` precisa ser editada manualmente para incluir o índice acima antes do commit.

**Consequência em `PATCH /oscs/:id`:** tentativa de transição `IN_PROGRESS → AVAILABLE` com projeto ativo na OSC retorna `409` com a identificação do projeto pendente. O service **não** zera `Project.oscId`. O coordenador precisa fechar o projeto primeiro via `PATCH /projects/:id/status` (→ `COMPLETED` ou `ABANDONED`), o que libera a OSC automaticamente.

**Consequência em `PATCH /projects/:id/status`:** se o coordenador reabrir um projeto para `IN_PROGRESS` e já existir outro projeto ativo na mesma OSC, a constraint do banco rejeita — o service traduz para `409`.

### 3.3 Visibilidade de `GET /projects` e novo `GET /projects/:id` (resolve C4)

#### `GET /projects` — listagem

- **COORDINATOR**: todos os projetos.
- **STUDENT**: A ∪ B, onde:
  - A = projetos em que o aluno é `TeamMember` (qualquer status, qualquer semestre)
  - B = projetos com `status ∈ {ONGOING, INCOMPLETE}` (continuáveis)

Consequência deliberada: alunos não veem projetos `COMPLETED`/`ABANDONED` de outras equipes. Histórico público é privilégio do Coordenador.

#### `GET /projects/:id` — detalhe (novo endpoint)

Não existe hoje em `api.md`. É adicionado para suportar telas de detalhe no frontend. Mesma regra de visibilidade da listagem:

- **COORDINATOR**: qualquer projeto, retorna `200`.
- **STUDENT**: se o projeto está em A ∪ B, retorna `200` com o mesmo shape do item da listagem; caso contrário, retorna `404` (não vazar existência).

### 3.4 `POST /projects/:id/teams` reativa status (resolve C5)

Na mesma transação da criação da Team de continuação, o service atualiza `Project.status = IN_PROGRESS`. Documentado em `api.md`.

Consequência: `pendingProjects` do dashboard e `activeProjects` refletem automaticamente o novo semestre. O coordenador não precisa de ação administrativa para "abrir" o projeto.

### 3.5 RF008 — bloqueio automático pontual (derivação de C2)

`CLAUDE.md` afirmava *"Não há bloqueio automático"*. A regra real, consolidada:

> **RF008 — Gestão manual da OSC.** O Coordenador define o status da OSC livremente via `PATCH /oscs/:id`. Única transição bloqueada automaticamente: `IN_PROGRESS → AVAILABLE` quando existe projeto ativo (status ∉ `COMPLETED`, `ABANDONED`) vinculado à OSC. Nesse caso retorna `409` com a identificação do projeto pendente. Todas as outras transições (`AVAILABLE ↔ BLOCKED`, `IN_PROGRESS → BLOCKED`, `BLOCKED → IN_PROGRESS`, etc.) são livres.

### 3.6 Deletar `docs/monorepo.md` (resolve A1)

O arquivo recomenda pnpm, Turborepo, TypeScript no frontend, `packages/database` com Prisma — contradiz a stack real. Também é órfão (não referenciado por `CLAUDE.md` nem `README.md`). O conteúdo autoritário sobre monorepo vive em `architecture.md` §§1–4.

**Ação:** `git rm docs/monorepo.md`. Histórico preserva o texto.

### 3.7 Comparador de semestres (resolve A3)

Formato canônico: `"YYYY-N"` com `N ∈ {1, 2}` (ex.: `"2025-1"`, `"2025-2"`).

**Funções utilitárias (parser estruturado):**

```ts
// signatures
getCurrentSemester(date: Date): string            // "2026-1"
parseSemester(s: string): { year: number; half: 1 | 2 }
compareSemesters(a: string, b: string): -1 | 0 | 1
```

Implementação: `parseSemester` faz `split('-')`, valida `half ∈ {1, 2}`, e joga erro em formato inválido. `compareSemesters` compara primeiro `year`, depois `half`. `getCurrentSemester` usa mês 1–6 → half 1; mês 7–12 → half 2.

**Localização (duplicação controlada):**

- Backend: `apps/backend/src/common/semester.ts`
- Frontend: `apps/frontend/src/lib/semester.ts`

Não ativar `packages/shared-types` agora — custo de setup do workspace supera o ganho de não duplicar 10 linhas. Quando surgir a 2ª duplicação (provável candidato: enums `UserRole`/`OscStatus`), o pacote é ativado e os utils de semestre migram junto.

**Documentar em:** `data-model.md` §"Cálculo de semestre" passa a incluir as assinaturas acima e a nota sobre duplicação. `architecture.md` §10 menciona a duplicação intencional.

### 3.8 CORS permissivo no MVP (resolve A4)

`apps/backend/src/main.ts` passa a chamar `app.enableCors()` sem argumentos — libera qualquer origem, sem `credentials`. JWT viaja no header `Authorization`, que não é credencial CORS — `credentials: true` seria desnecessário e ainda impediria `Access-Control-Allow-Origin: *`.

**Documentar em:** `architecture.md` §6 (backend) com a chamada exata; `docker.md` §6 não precisa de variável nova. Adicionar item em §11 ("o que não está nesta arquitetura") explicitando que endurecer CORS é pós-MVP.

### 3.9 Convenção de erros HTTP em `api.md` (resolve M1, B4)

Reescrever a seção "Convenções" no topo de `api.md` para incluir uma tabela de **erros globais** — códigos que qualquer endpoint autenticado pode retornar:

| Código | Condição |
|---|---|
| `401 Unauthorized` | Token ausente, malformado ou expirado (em qualquer rota autenticada) |
| `403 Forbidden` | Token válido, mas `role` não autoriza a rota |
| `422 Unprocessable Entity` | Payload falha na validação do DTO (formato, tipos, regras de `class-validator`) |

Cada endpoint passa a listar apenas os **erros específicos de domínio** (`404`, `409`, `422` derivados de regra de negócio, `400` para semântica incorreta). Listagem tem que ser exaustiva no escopo específico; globais ficam implícitos.

**Buracos explícitos a preencher no passo de aplicação:**

- `PATCH /oscs/:id`: adicionar `409` (shape `{ projectId, projectName }`) para conflito de projeto ativo.
- `POST /oscs`: manter `409` (nome duplicado).
- `GET /oscs/:id`: manter `404`.
- `POST /projects`: adicionar `404` (OSC inexistente), `409` (OSC não está `AVAILABLE` — já `IN_PROGRESS` ou `BLOCKED`) e `409` (nome de projeto duplicado). OSC com status incorreto é conflito de estado (`409`), não erro de validação (`422`).
- `POST /projects/:id/teams`: manter `404` (projeto) e `409` (já existe Team no semestre); adicionar `400` se projeto está em status ≠ `ONGOING`/`INCOMPLETE`.
- `POST /teams/join`: manter `404` e `409`.
- `PATCH /projects/:id/status`: manter `404`; adicionar `409` (conflito de unique parcial ao reabrir).
- `POST /auth/sign-up`: manter `403` (desabilitado) e `409` (e-mail duplicado).

### 3.10 Migrar frontend para TSX (resolve M2)

O frontend hoje é JSX puro. Migração completa para TSX:

- Adicionar `typescript`, `@types/react`, `@types/react-dom` como dev dependencies no workspace.
- Criar `tsconfig.json` em `apps/frontend/` alinhado com o preset `react-ts` do Vite.
- Ajustar `vite.config.js` → `vite.config.ts`.
- Ajustar `eslint.config.js` para flat config de TypeScript.
- Converter arquivos `.jsx` existentes para `.tsx`.

O frontend existente será refatorado de qualquer jeito conforme as Fases 5–7 são executadas — a migração de TSX aproveita esse momento. Não há risco significativo de perda de trabalho.

**Documentar em:** `architecture.md` §5 (estrutura interna do frontend) remove a nota *"Frontend hoje é JSX puro; migração para TSX é decisão da equipe"*; substituir por *"TypeScript obrigatório no frontend"*.

### 3.11 Validação de DTO com `class-validator` (resolve M3)

Convenção oficial do NestJS, calibração natural para agentes de IA.

- Instalar `class-validator` e `class-transformer`.
- Registrar `ValidationPipe` globalmente em `main.ts`:

```ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // remove propriedades não declaradas
  forbidNonWhitelisted: true,// rejeita propriedades não declaradas
  transform: true,           // coerce tipos conforme tipagem do DTO
  exceptionFactory: (errors) => new UnprocessableEntityException(...),
}));
```

- DTOs vivem em `apps/backend/src/modules/<domain>/dto/*.dto.ts`.

**Documentar em:** `architecture.md` §6 adiciona item em "convenções do backend" mencionando `class-validator` + `ValidationPipe` global + `422` em erro. `tasks.md` Fase 1 ganha tarefa de instalar e configurar.

### 3.12 Continuação de projeto — qualquer STUDENT (resolve M4)

Qualquer aluno pode criar Team de continuação em qualquer projeto elegível (status ∈ `ONGOING`, `INCOMPLETE`). Não há restrição a membros da Team anterior. É a semântica que `api.md`, `rbac.md` e `data-model.md` já implicam; agora fica explícita.

**Documentar em:** `data-model.md` §4 Fluxo B adiciona a nota *"Qualquer aluno pode submeter — não é exigida participação em equipes anteriores do projeto."* `rbac.md` idem.

### 3.13 `PATCH /projects/:id/status` aceita `IN_PROGRESS` (resolve M5 revisado)

O endpoint aceita **os cinco valores** do enum `ProjectStatus`. O `400` anterior é removido.

Efeitos automáticos na OSC:

| Novo status | Ação na OSC |
|---|---|
| `COMPLETED` | `Osc.status → AVAILABLE` (mesma transação) |
| `ABANDONED` | `Osc.status → AVAILABLE` (mesma transação) |
| `IN_PROGRESS` | Nenhum — coordenador ajusta `Osc.status` via `PATCH /oscs/:id` se quiser |
| `ONGOING` | Nenhum — `Osc.status` permanece |
| `INCOMPLETE` | Nenhum — `Osc.status` permanece |

A reabertura para `IN_PROGRESS` esbarra no unique parcial se já houver outro projeto ativo na mesma OSC — erro do banco, traduzido para `409`.

**Documentar em:** `api.md` `PATCH /projects/:id/status` remove o `400`, adiciona a linha `IN_PROGRESS` na tabela de efeitos e o caso de `409`. `tasks.md` Fase 3 idem.

### 3.14 `README.md` reescrito (resolve B1)

O `README.md` atual está cortado na seção "Status do setup" e mistura conteúdo de planejamento com quick-start. Reescrita completa:

Conteúdo do novo `README.md`:

1. **Título + descrição curta** — o que é o programa Juntos pelo Impacto e o que o sistema resolve.
2. **Stack** — tabela enxuta.
3. **Pré-requisitos** — Node 24 (via mise), npm 10+, Docker + Compose.
4. **Quick-start** — 3 passos: clonar, `cp .env.example .env`, `npm install` + `npm run docker:db` (ou `docker:dev` para stack completa).
5. **Estrutura de pastas** — diagrama de 5–8 linhas (apps, docs, docker-compose).
6. **Scripts principais** — tabela curta (`dev:frontend`, `dev:backend`, `docker:db`, `docker:dev`, `docker:down`).
7. **Documentação** — tabela apontando para cada arquivo em `docs/` com uma linha de hook cada.

Remover todo conteúdo de "Status do setup" e qualquer outra seção de planejamento — nada de `[x] scaffold pronto`. Progresso vive em issues/PRs.

### 3.15 `tasks.md` sem checkboxes (resolve B2)

Os `[ ]`/`[x]` do `tasks.md` são armadilha de conflito de merge — cada PR que marcar um item gera um diff competindo com outro. Trocar por bullets simples (`-`).

Adicionar ao cabeçalho:

> Este documento é o mapa das tarefas por fase. **Progresso concreto vive em PRs/issues** — não marcar itens aqui. Itens só mudam quando o escopo muda.

### 3.16 Remover "cadeira de extensão" (resolve B3 revisado)

Em `CLAUDE.md`:

- **Antes:** *"Um aluno pode estar em múltiplas equipes (uma por cadeira de extensão)."*
- **Depois:** *"Um aluno pode pertencer a múltiplas equipes simultaneamente."*

Em `data-model.md` §1 TeamMember — aplicar a mesma reescrita.

## 4. Mudanças por documento

Esta seção é o roteiro concreto da aplicação. Cada documento lista os ajustes pontuais.

### 4.1 `CLAUDE.md`

- **Regras de negócio críticas — RF007:** reescrever para refletir Modelo X (sem endpoint separado de seleção; a OSC é escolhida atomicamente na criação/continuação; a restrição de liderança é trivial).
- **Regras de negócio críticas — RF008:** reescrever conforme §3.5 deste spec (bloqueio pontual em `IN_PROGRESS → AVAILABLE`).
- **Entidades de domínio → TeamMember:** remover menção a "cadeira de extensão" conforme §3.16.
- **Estado atual:** atualizar para "planejamento consolidado via spec de 2026-04-22; próximo passo: Fase 0".

### 4.2 `README.md`

- Reescrita completa conforme §3.14.

### 4.3 `docs/spech-delivery.md`

- RF012: remover a frase *"(uma por cadeira de extensão)"* na descrição.

### 4.4 `docs/architecture.md`

- §5 (frontend): remover nota de JSX; afirmar TypeScript obrigatório.
- §6 (backend): adicionar CORS (`app.enableCors()` no `main.ts`) e validação global (`ValidationPipe` + `class-validator`).
- §10: manter "Frontend: TypeScript" (substitui a menção a "decisão da equipe"); adicionar *"Utils de semestre duplicados entre backend (`apps/backend/src/common/semester.ts`) e frontend (`apps/frontend/src/lib/semester.ts`) — spec de 2026-04-22 §3.7."*
- §11: adicionar linha *"Endurecer CORS — pós-MVP."*

### 4.5 `docs/data-model.md`

- §1 TeamMember: remover menção a "cadeira de extensão".
- §4 "Fluxo B": remover a frase *"Ao submeter (OSC escolhida)"*; explicitar que o submit é `POST /projects/:id/teams` sem body e a OSC é herdada do projeto. Adicionar nota *"Qualquer aluno pode submeter."*
- §4 "Cálculo de semestre": adicionar assinaturas das funções `getCurrentSemester`, `parseSemester`, `compareSemesters` conforme §3.7 deste spec.
- §4 "Gestão manual de OSC": já reflete o Modelo X / P1a; revisar apenas para garantir consistência com §3.2 e §3.5 deste spec.
- §5 Índices: ajustar o comentário do unique parcial de `Project.oscId` para incluir o SQL exato (texto ilustrativo, não normativo).

### 4.6 `docs/docker.md`

- §6 Variáveis: não precisa de `FRONTEND_URL` (CORS liberado). Deixar como está.

### 4.7 `docs/rbac.md`

- Projects:
  - `GET /projects` — ajustar recorte do STUDENT para A ∪ B conforme §3.3.
  - Adicionar linha `GET /projects/:id` com a mesma regra.
  - Remover qualquer referência a `POST /projects/:id/select-osc`.
  - `POST /projects` — body `{ name, oscId }`, permanece restrito a STUDENT.
  - `POST /projects/:id/teams` — ajustar nota para incluir reativação de status.
- Seção "Verificação de liderança": confirmar que permanece *"nenhum endpoint é gateado por liderança"* — Modelo X elimina a necessidade.

### 4.8 `docs/api.md`

- Seção "Convenções": adicionar tabela de erros globais conforme §3.9.
- Auth:
  - `POST /auth/sign-up`: manter erros específicos `403`, `409`.
  - `GET /auth/me`: remover listagem de erros — fica nos globais.
  - `PATCH /auth/sign-up/toggle`: idem.
- OSCs:
  - `GET /oscs`: erros só dos globais.
  - `POST /oscs`: manter `409`.
  - `GET /oscs/:id`: manter `404`.
  - `PATCH /oscs/:id`: remover nota *"limpa Project.oscId"*; adicionar `409` (projeto ativo, payload `{ projectId, projectName }`).
- Projects:
  - `GET /projects`: ajustar nota do STUDENT para A ∪ B.
  - Adicionar `GET /projects/:id` com o mesmo shape do item da listagem; erro `404` para STUDENT fora do A ∪ B.
  - `POST /projects`: body `{ name, oscId }`; erros `404` (OSC), `409` (OSC não AVAILABLE ou nome duplicado).
  - `POST /projects/:id/teams`: documentar reativação de `Project.status → IN_PROGRESS`; erros `404`, `409` (Team já existe no semestre), `400` (projeto não está em `ONGOING`/`INCOMPLETE`).
  - **Remover** `POST /projects/:id/select-osc` inteiramente.
  - `PATCH /projects/:id/status`: remover `400` para `IN_PROGRESS`; aceitar os 5 valores do enum; atualizar tabela de efeitos na OSC conforme §3.13; adicionar `409` (conflito unique parcial).
- Teams:
  - `POST /teams/join`: manter `404`, `409`.

### 4.9 `docs/tasks.md`

Consequências (detalhadas em §5).

### 4.10 `docs/monorepo.md`

- **Deletar o arquivo.**

## 5. Consequências para `docs/tasks.md`

Esta seção dita os ajustes na quebra técnica por fase.

### 5.1 Cabeçalho e formato

- Trocar todos os `[ ]`/`[x]` por `-` (bullet simples).
- Adicionar a nota de cabeçalho conforme §3.15.

### 5.2 Fase 0 — Fundação de dados

- Após `npx prisma migrate dev --name init`, adicionar tarefa explícita: *"Editar a migration SQL gerada e adicionar `CREATE UNIQUE INDEX \"project_osc_active_unique\" ON \"Project\" (\"oscId\") WHERE status NOT IN ('COMPLETED','ABANDONED');` antes do commit."*
- Adicionar tarefa: *"Implementar `apps/backend/src/common/semester.ts` com `getCurrentSemester`, `parseSemester`, `compareSemesters`."*

### 5.3 Fase 1 — Auth (backend)

- Adicionar tarefa: *"Instalar `class-validator`, `class-transformer`; registrar `ValidationPipe` global em `main.ts` com `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`, `exceptionFactory → 422`."*
- Adicionar tarefa: *"Habilitar CORS via `app.enableCors()` em `main.ts`."*

### 5.4 Fase 2 — OSCs (backend)

- Ajustar a tarefa do `PATCH /oscs/:id`: *"ao receber transição `IN_PROGRESS → AVAILABLE`, verificar se há `Project` com `status NOT IN ('COMPLETED','ABANDONED')` apontando para a OSC; se houver, retornar `409` com `{ projectId, projectName }`. **Não zerar** `Project.oscId` em nenhuma hipótese."*

### 5.5 Fase 3 — Projects e Teams (backend)

- Ajustar `POST /projects` para receber `{ name, oscId }` e executar o Fluxo A em transação (Project + Team + TeamMember + Osc.status → IN_PROGRESS).
- Ajustar `POST /projects/:id/teams` para executar o Fluxo B em transação, incluindo `Project.status = IN_PROGRESS`.
- **Remover** a tarefa de `POST /projects/:id/select-osc`.
- Adicionar tarefa: *"Implementar `GET /projects/:id` com regra de visibilidade A ∪ B para STUDENT."*
- Ajustar `GET /projects` para aplicar A ∪ B quando `role = STUDENT`.
- Ajustar `PATCH /projects/:id/status`: aceitar os 5 valores; aplicar efeitos automáticos na OSC conforme §3.13; traduzir erro de unique parcial em `409`.

### 5.6 Fase 4 — Dashboard (backend)

- Sem mudanças estruturais — o endpoint já considera `pendingProjects` com base em `Team.createdAt` + comparação de semestre (agora reutiliza `compareSemesters` de §5.2).

### 5.7 Fase 5 — Auth (frontend)

- Adicionar tarefa: *"Migrar projeto Vite de JSX para TSX: adicionar `typescript`, `@types/react`, `@types/react-dom`; criar `tsconfig.json`; renomear arquivos existentes para `.tsx`; ajustar ESLint para flat config TS."*
- Adicionar tarefa: *"Implementar `apps/frontend/src/lib/semester.ts` espelhando a lógica do backend."*

### 5.8 Fase 6 — Frontend do Coordenador

- Na tela `/oscs`: remover qualquer botão de "desvincular OSC" — a desvinculação agora exige fechar o projeto primeiro. Na tentativa de transição bloqueada, exibir mensagem do `409` com o projeto pendente e um atalho para fechá-lo.
- Na tela `/projects`: a ação de definir status aceita os 5 valores; destacar consequência automática na OSC conforme §3.13.

### 5.9 Fase 7 — Frontend do Aluno

- Na tela `/projects` (aluno): o formulário de criação de projeto agora **inclui a seleção da OSC** (dropdown de OSCs `AVAILABLE`) — o submit vai para `POST /projects` com `{ name, oscId }`.
- **Remover** qualquer tarefa de "ação de selecionar OSC após criar o projeto" — o fluxo não existe mais.
- A continuação de projeto usa `POST /projects/:id/teams` sem escolha de OSC (é herdada).

## 6. Como este spec é aplicado

1. Este spec vira um plano de implementação via `writing-plans`.
2. O plano produz commits separados por grupo lógico (ex.: 1 commit para `api.md`, 1 para `CLAUDE.md`, 1 para deletar `monorepo.md`, etc.), facilitando revisão.
3. Após aplicação, o `tasks.md` reflete as consequências e Fase 0 pode começar sem divergência entre docs.

## 7. O que fica explicitamente fora

- Ativação de `packages/shared-types`.
- Endurecer CORS (origem específica, cookies, credenciais).
- Cobertura de testes (E2E, integração, unitários) — já fora do escopo do MVP em `architecture.md` §11.
- Logging estruturado, observabilidade — idem.
- Migrar `tasks.md` para issues/board externo — decisão fora do escopo; por ora, `tasks.md` continua sendo o mapa.
