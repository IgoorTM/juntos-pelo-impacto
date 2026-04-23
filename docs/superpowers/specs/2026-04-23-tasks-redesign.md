# Spec: Redesign do tasks.md

## Problema

O `docs/tasks.md` atual tem dois tipos de gap:

1. **Backend (Fases 0-3):** pequenas omissoes — detalhes que existem em `api.md`, `data-model.md` e `rbac.md` mas nao estao refletidos nas tarefas.
2. **Frontend (Fases 5-7):** gaps estruturais — assume que o prototipo atual (`App.jsx`) sera reaproveitado, nao define infraestrutura, design system, padroes de UI ou interacoes concretas. O prototipo atual e um arquivo monolitico de 514 linhas em JSX sem TypeScript, sem rotas, sem auth, sem chamadas a API, e inclui telas fora do escopo do MVP.

## Decisoes tomadas

- **Sem Figma.** Design system minimo definido no codigo (tokens Tailwind + componentes base).
- **Frontend reescrito do zero.** O `App.jsx` atual e descartado. Estrutura de pastas criada conforme `architecture.md` §5.
- **Nova fase intermediaria (Fase 4.5)** entre backend e frontend para estruturacao, dependencias, design system e padroes de UI.
- **Backend revisado** para explicitar o que ja esta nos docs mas faltava no tasks.

## Mudancas por fase

### Fase 0 — Fundacao de dados

Adicionar:
- Declarar politicas de `onDelete` em todas as FKs conforme `data-model.md` §6 (Restrict para Project.oscId, Team.projectId, Team.createdBy, TeamMember.userId; Cascade para TeamMember.teamId)
- Criar todos os indices definidos em `data-model.md` §5 na migration, nao apenas o parcial: `User.email UNIQUE`, `Project.name UNIQUE`, `Project.status`, `Team.code UNIQUE`, `Team(projectId, createdAt DESC)`, `Osc.name UNIQUE`, `Osc.status`, `TeamMember.userId`

Sem mudanca:
- Seed com `AppConfig.signUpEnabled = false` ja esta listado

### Fase 1 — Auth (backend)

Adicionar:
- Payload do JWT: `{ sub: userId, email, role }` (conforme `rbac.md` §3)
- Erros especificos de `POST /auth/sign-up`: `403` quando cadastro desabilitado, `409` quando email duplicado (conforme `api.md`)

### Fase 2 — OSCs (backend)

Adicionar:
- Erro `409` no `POST /oscs` quando nome duplicado (conforme `api.md`)

Mover:
- `getCurrentSemester()` sai da Fase 2 e vai para Fase 0 como utilitario em `src/common/` — e usada na Fase 3 (criacao de Team) e Fase 4 (calculo de pendingProjects), nao na Fase 2

### Fase 3 — Projects e Teams (backend)

Adicionar:
- `POST /projects/:id/teams` rejeita com `409` se ja existe equipe no semestre atual
- Visibilidade de `GET /projects` e `GET /projects/:id` para STUDENT segue regra A ∪ B (A = projetos em que e membro via TeamMember; B = projetos continuaveis com status ONGOING/INCOMPLETE)

### Fase 4 — Dashboard (backend)

Sem mudanca. Ja alinhado com `api.md`.

### Fase 4.5 — Infraestrutura frontend (NOVA)

Fase inteiramente nova. Pre-requisito de todas as fases de frontend.

**4.5.1 — Estruturacao do projeto:**
- Deletar `App.jsx`, `App.css` e assets do prototipo (`hero.png`, `react.svg`, `vite.svg`)
- Criar `App.tsx` e `main.tsx` (migrar entrypoint para TSX)
- Criar estrutura de pastas conforme `architecture.md` §5:
  ```
  src/
  ├── components/       # Button, Input, Card, Badge, Modal
  ├── features/
  │   ├── auth/
  │   ├── oscs/
  │   ├── projects/
  │   ├── teams/
  │   └── dashboard/
  ├── layouts/          # AuthenticatedLayout (shell com sidebar/header)
  ├── pages/            # componentes de rota
  ├── lib/              # httpClient, helpers, config
  ├── App.tsx
  └── main.tsx
  ```

**4.5.2 — Dependencias e configuracao:**
- Instalar react-router (roteamento)
- Criar cliente HTTP (`lib/httpClient.ts`) com interceptor que injeta `Authorization: Bearer <token>`
- Configurar aliases de importacao se necessario (`@/` -> `src/`)

**4.5.3 — Design system minimo:**
- Definir tokens Tailwind no CSS ou `tailwind.config`: paleta de cores (primaria, sucesso, alerta, erro, neutros), tipografia (tamanhos, pesos), espacamento, border-radius
- Criar componentes base reutilizaveis:
  - `Button` — variantes (primary, outline, danger), tamanhos, estado disabled/loading
  - `Input` — com label, mensagem de erro, estado disabled
  - `Card` — container com padding e borda padrao
  - `Badge` — indicador de status com cores por tom (green, yellow, red, blue, slate)
  - `Modal` ou `Dialog` — overlay com titulo, conteudo e acoes

**4.5.4 — Padroes de UI:**
- `AuthenticatedLayout` — shell com sidebar de navegacao (itens variam por role) e header com info do usuario
- Padrao de tratamento de estados: componente ou hook para loading (skeleton/spinner), erro (mensagem + retry), empty state (mensagem + acao)

### Fase 5 — Auth (frontend) — reescrita

Substituir a fase atual por:

- `AuthContext` + `AuthProvider`:
  - Armazena `user` (id, name, email, role) e `accessToken`
  - Persiste token em `localStorage`; carrega no boot via `GET /auth/me`
  - Expoe `signIn()`, `signUp()`, `signOut()`, `isAuthenticated`, `user`
- Tela `/sign-in`:
  - Formulario com email + senha
  - Validacao de campos obrigatorios
  - Feedback de erro: credenciais invalidas (`401`)
  - Loading state no botao durante requisicao
  - Redirect pos-login por role: COORDINATOR -> `/dashboard`, STUDENT -> `/projects`
- Tela `/sign-up`:
  - Nao existe endpoint publico para checar `signUpEnabled`; o formulario e exibido sempre e o erro `403` e tratado como feedback ("Cadastro desabilitado no momento")
  - Formulario com nome + email + senha
  - Feedback de erros: cadastro desabilitado (`403`), email duplicado (`409`), validacao (`422`)
  - Redirect para `/sign-in` apos sucesso
- `PrivateRoute`:
  - Redireciona para `/sign-in` se nao autenticado
  - Evita flash de conteudo (mostrar loading enquanto verifica token)
- `RoleRoute`:
  - Redireciona para home do perfil se role incorreto (STUDENT tentando acessar `/dashboard` -> `/projects`)
- Configurar arvore de rotas em `App.tsx`

### Fase 6 — Frontend do Coordenador — com interacoes

Substituir a fase atual por:

- Tela `/dashboard`:
  - Bloco de metricas: cards com `totalOscs`, `activeProjects`, `blockedOscs`, `availableOscs`
  - Card de alerta: quando `pendingProjects > 0`, exibe contagem e link para `/projects` com filtro de pendentes
  - Secao de controle do cadastro: toggle `signUpEnabled`, indicador visual ("Cadastro aberto"/"Cadastro fechado"), data da ultima alteracao (`signUp.updatedAt`)
- Tela `/oscs`:
  - Listagem de todas as OSCs com status (Badge por cor)
  - Botao "Nova OSC" que abre modal/formulario com campos: nome, descricao, email (opcional), phone (opcional)
  - Feedback de erro: nome duplicado (`409`)
  - Acao de alterar status: dropdown inline ou modal com selecao de novo status
  - Feedback de erro ao tentar `IN_PROGRESS -> AVAILABLE` com projeto ativo: exibir `409` com nome do projeto pendente (campo `details.projectName` do erro)
- Tela `/projects`:
  - Listagem separada visualmente por semestre (atual vs. anteriores)
  - Projetos `IN_PROGRESS` de semestres anteriores destacados como pendentes de fechamento
  - Cada projeto exibe: nome, OSC vinculada, equipes com membros
  - Acao de definir status: modal com selecao (IN_PROGRESS, COMPLETED, ABANDONED, ONGOING, INCOMPLETE)
  - Feedback de consequencia automatica: ao selecionar COMPLETED ou ABANDONED, exibir aviso "A OSC [nome] sera liberada para disponivel" antes de confirmar

### Fase 7 — Frontend do Aluno — com interacoes

Substituir a fase atual por:

- Tela `/projects` (visao do aluno):
  - Secao "Meus projetos": projetos em que participa (via TeamMember), com equipe, OSC e status
  - Secao "Projetos continuaveis": projetos com status ONGOING/INCOMPLETE disponiveis para continuacao
  - Tres acoes principais (botoes ou cards):
    - **Criar novo projeto:** abre formulario com nome do projeto + selecao de OSC disponivel (lista carregada de `GET /oscs` filtrada por AVAILABLE). Apos sucesso, exibir tela/modal de confirmacao com o `code` da equipe gerada (destaque visual + botao copiar)
    - **Entrar em equipe:** formulario com campo de codigo de 6 caracteres. Feedback: equipe nao encontrada (`404`), ja e membro (`409`), sucesso com dados da equipe e projeto
    - **Continuar projeto:** seleciona projeto da lista de continuaveis, confirma. Apos sucesso, exibir `code` da nova equipe gerada (mesmo padrao de "Criar novo projeto")

### Dependencias entre fases (atualizado)

```
Fase 0 (schema + seed + utilitarios)
  └── Fase 1 (auth backend)
        ├── Fase 2 (oscs backend)
        ├── Fase 3 (projects + teams backend)
        │     └── Fase 4 (dashboard backend)
        └── Fase 4.5 (infraestrutura frontend)
              └── Fase 5 (auth frontend)
                    ├── Fase 6 (frontend coordenador)
                    └── Fase 7 (frontend aluno)
```

Fases 2, 3 podem ser desenvolvidas em paralelo apos Fase 1. Fase 4 depende de Fase 3. Fase 4.5 pode comecar em paralelo com o backend — a estruturacao (4.5.1) e design system (4.5.3) nao dependem de nenhuma fase, e o cliente HTTP (4.5.2) so precisa do contrato de auth (Fase 1) para configurar o interceptor. Fases 6 e 7 podem ser desenvolvidas em paralelo apos Fase 5.
