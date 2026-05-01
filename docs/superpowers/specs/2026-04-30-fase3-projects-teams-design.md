# Fase 3 — Projects e Teams (Backend): Design

**Data:** 2026-04-30
**Escopo:** RF006, RF007, RF012 (parcial), RF014

## Contexto

Fase 3 implementa o fluxo central do aluno: criar um projeto vinculado a uma OSC disponivel e entrar em equipes pelo codigo. O design foi revisado em relacao ao spec original para simplificar a relacao entre status de OSC e status de projeto.

## Mudancas em relacao ao spec original

| Item | Spec original | Design revisado |
|---|---|---|
| `GET /projects` | COORDINATOR + STUDENT (A U B) | COORDINATOR only |
| `GET /projects/:id` | COORDINATOR | Autenticado (qualquer role) |
| `POST /projects/:id/continue` | STUDENT | Removido do MVP |
| OSC ao fechar projeto | Auto `AVAILABLE` em COMPLETED/ABANDONED | Sem efeito automatico |
| `ProjectStatus` enum | 5 valores | 3: `IN_PROGRESS`, `COMPLETED`, `ABANDONED` |
| Aluno lista projetos | Sim | Nao |

**Motivacao das mudancas:**
- O fluxo do aluno e centrado em OSCs, nao em projetos. Alunos interagem com `GET /oscs` para ver o que esta disponivel.
- Status de OSC e status de projeto sao geridos independentemente pelo coordenador. Nenhuma transicao de status de projeto altera automaticamente a OSC.
- A unica operacao que bloqueia uma OSC para outros alunos e o ato de criar um projeto (`POST /projects` seta `Osc.status = IN_PROGRESS`).
- O fluxo de continuar projeto (`POST /projects/:id/continue`) foi removido do MVP para simplificar. Continuacao pode ser tratada manualmente pelo coordenador via gestao de OSC.

## Estrutura de modulos

```
src/
├── projects/
│   ├── dtos/
│   │   ├── create-project.dto.ts
│   │   └── update-project-status.dto.ts
│   ├── projects.controller.ts
│   ├── projects.module.ts            # imports TeamsModule
│   └── projects.service.ts
└── teams/
    ├── dtos/
    │   └── join-team.dto.ts
    ├── teams.controller.ts
    ├── teams.module.ts               # exports TeamsService
    └── teams.service.ts
```

`TeamsModule` exporta `TeamsService`. `ProjectsModule` importa `TeamsModule` para usar `generateUniqueCode()` em `ProjectsService`. A transacao de criacao de projeto vive inteira em `ProjectsService`.

## Gerador de codigo de equipe

`TeamsService.generateUniqueCode()` e uma funcao pura (sem acesso ao banco). Sorteia 6 caracteres do charset `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (A-Z sem `I` e `O`; digitos 2-9 sem `0` e `1`).

A unicidade e garantida pelo constraint `Team.code UNIQUE` no banco. Em caso de colisao (`P2002` no campo `code`), `ProjectsService.create()` regenera e tenta novamente — ate 5 vezes. Apos 5 falhas consecutivas por colisao de codigo, lanca `500`.

## Endpoints

### POST /projects — STUDENT

Cria projeto e equipe em uma unica transacao.

**Request:** `{ name: string, oscId: string }`

**Transacao:**
1. Busca OSC pelo `oscId` — lanca `404` se nao encontrar
2. Valida `Osc.status === AVAILABLE` — lanca `409` se nao
3. Cria `Project` com `status = IN_PROGRESS`
4. Gera codigo unico (com retry em colisao)
5. Cria `Team` com `semester = getCurrentSemester()`, `code`, `createdBy = userId`
6. Cria `TeamMember` vinculando criador a equipe
7. Atualiza `Osc.status = IN_PROGRESS`

**Response 201:**
```json
{
  "id": "string",
  "name": "string",
  "status": "IN_PROGRESS",
  "osc": { "id": "string", "name": "string" },
  "teams": [
    {
      "id": "string",
      "semester": "string",
      "code": "string",
      "members": [{ "id": "string", "name": "string" }]
    }
  ]
}
```

**Erros:** `404` OSC nao encontrada; `409` OSC nao esta `AVAILABLE`; `409` nome de projeto ja cadastrado.

---

### GET /projects — COORDINATOR

Lista todos os projetos com OSC, equipes (ordenadas por `createdAt DESC`) e membros de cada equipe.

**Response 200:** array com o mesmo shape de `POST /projects`.

---

### GET /projects/:id — Autenticado (qualquer role)

Retorna detalhe de um projeto. `404` se nao encontrar.

**Response 200:** mesmo shape de um item de `GET /projects`.

---

### PATCH /projects/:id/status — COORDINATOR

Define o status de um projeto. Sem efeito automatico na OSC.

**Request:** `{ status: "IN_PROGRESS" | "COMPLETED" | "ABANDONED" }`

**Response 200:** projeto atualizado.

**Erros:** `404` projeto nao encontrado; `409` conflito no indice parcial `project_osc_active_unique` (ex: tentar reativar projeto enquanto outro projeto ativo ja ocupa a mesma OSC).

---

### POST /teams/join — STUDENT

Aluno entra em equipe existente pelo codigo de 6 caracteres.

**Request:** `{ code: string }`

**Response 200:**
```json
{
  "id": "string",
  "semester": "string",
  "code": "string",
  "project": { "id": "string", "name": "string" },
  "members": [{ "id": "string", "name": "string" }]
}
```

**Erros:** `404` codigo nao encontrado; `409` aluno ja e membro desta equipe.

---

## Enum ProjectStatus (revisado)

Remove `ONGOING` e `INCOMPLETE`. O enum passa a ter apenas:

```
IN_PROGRESS  — projeto ativo no semestre atual
COMPLETED    — concluido com sucesso
ABANDONED    — abandonado pela equipe
```

Esta mudanca requer:
- Atualizar `prisma/schema.prisma`
- Gerar nova migration
- Atualizar `docs/data-model.md` e `docs/api.md`

## Testes

Cada service ganha arquivo `.spec.ts` com testes unitarios (`PrismaService` mockado):

**TeamsService:**
- `generateUniqueCode()` retorna string de 6 chars exclusivamente do charset correto
- `joinTeam()` lanca `404` para codigo inexistente
- `joinTeam()` lanca `409` para membro duplicado

**ProjectsService:**
- `create()` lanca `404` para OSC inexistente
- `create()` lanca `409` para OSC nao `AVAILABLE`
- `create()` lanca `409` para nome de projeto duplicado
- `create()` retorna shape correto em caso de sucesso
- `updateStatus()` lanca `404` para projeto inexistente

## Documentacao a atualizar na mesma entrega

| Documento | O que atualizar |
|---|---|
| `docs/data-model.md` | Remover `ONGOING` e `INCOMPLETE` do enum `ProjectStatus`; remover regra de liberacao automatica de OSC |
| `docs/api.md` | Atualizar `GET /projects` (COORDINATOR only); atualizar `GET /projects/:id` (autenticado); remover `POST /projects/:id/continue`; atualizar erros de `PATCH /projects/:id/status`; remover mencoes a ONGOING/INCOMPLETE |
| `docs/rbac.md` | Atualizar matriz de permissoes para refletir acesso revisado |
| `docs/tasks.md` | Nao alterar — e um mapa de fases, nao a fonte de verdade do design |
