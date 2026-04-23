# Tasks.md Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `docs/tasks.md` so every phase is clear, complete, and aligned with `api.md`, `data-model.md`, `rbac.md`, and `architecture.md`.

**Architecture:** Single-file documentation rewrite. No code changes, no tests. The spec at `docs/superpowers/specs/2026-04-23-tasks-redesign.md` defines all changes.

**Tech Stack:** Markdown

---

### Task 1: Rewrite docs/tasks.md

**Files:**
- Modify: `docs/tasks.md`

**Spec reference:** `docs/superpowers/specs/2026-04-23-tasks-redesign.md`

- [ ] **Step 1: Rewrite the file**

Apply all changes from the spec:

**Fase 0 — add:**
- Declarar politicas de `onDelete` em todas as FKs conforme `data-model.md` §6
- Criar todos os indices de `data-model.md` §5 na migration (nao apenas o parcial)
- Implementar `getCurrentSemester()` como utilitario em `src/common/` (movido da Fase 2)

**Fase 1 — add:**
- Payload do JWT: `{ sub: userId, email, role }`
- Erros especificos de sign-up: `403` cadastro desabilitado, `409` email duplicado

**Fase 2 — changes:**
- Remover `getCurrentSemester()` (movido para Fase 0)
- Adicionar erro `409` no `POST /oscs` (nome duplicado)

**Fase 3 — add:**
- `POST /projects/:id/teams` rejeita com `409` se ja existe equipe no semestre atual
- Visibilidade de `GET /projects` e `GET /projects/:id` para STUDENT: regra A ∪ B

**Fase 4 — no changes.**

**Fase 4.5 — new phase (infraestrutura frontend):**
- 4.5.1: Deletar prototipo, migrar para TSX, criar estrutura de pastas
- 4.5.2: Instalar react-router, criar cliente HTTP, configurar aliases
- 4.5.3: Design system minimo (tokens Tailwind + componentes base)
- 4.5.4: AuthenticatedLayout + padroes de loading/erro/empty state

**Fase 5 — rewrite:**
- AuthContext/AuthProvider com persistencia em localStorage
- Telas sign-in e sign-up com validacao, loading, feedback de erros
- PrivateRoute e RoleRoute com anti-flash
- Arvore de rotas em App.tsx

**Fase 6 — rewrite:**
- Dashboard com metricas, alerta de pendentes, toggle signUpEnabled
- OSCs com listagem, cadastro (modal), alteracao de status, feedback de 409
- Projects com separacao por semestre, destaque de pendentes, modal de status com aviso de consequencia na OSC

**Fase 7 — rewrite:**
- Tela /projects do aluno com secoes "Meus projetos" e "Projetos continuaveis"
- Tres acoes: criar novo (formulario + exibir code), entrar em equipe (code 6 chars), continuar projeto (exibir code)
- Feedback de erros por acao (404, 409)

**Dependencias — update:**
- Fase 4.5 entre Fase 4 e Fase 5
- Fase 4.5 pode comecar em paralelo com backend (4.5.1 e 4.5.3 sem dependencias; 4.5.2 depende de Fase 1)

- [ ] **Step 2: Verify alignment**

Cross-check the rewritten file against:
- `docs/api.md` — every endpoint mentioned in tasks maps to a defined contract
- `docs/data-model.md` §5-§6 — indices and onDelete policies referenced in Fase 0
- `docs/rbac.md` — permissions match role restrictions in each task
- `docs/architecture.md` §5 — frontend folder structure in Fase 4.5 matches

- [ ] **Step 3: Commit**

```bash
git add docs/tasks.md
git commit -m "docs(tasks): rewrite task breakdown aligned with API, data model and RBAC contracts

Adds missing backend details (JWT payload, error codes, indices, onDelete policies).
Adds Fase 4.5 for frontend infrastructure (TSX migration, design system, routing, HTTP client).
Rewrites frontend phases (5-7) with concrete interactions, error handling and UI states."
```
