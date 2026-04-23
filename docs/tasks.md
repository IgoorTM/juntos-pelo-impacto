# Quebra Tecnica do MVP — Juntos pelo Impacto

> Ordem de implementacao recomendada. Cada fase e um conjunto coeso de tarefas que pode ser entregue e testado de forma independente. Backend precede frontend em cada dominio.
>
> Este documento e o mapa das tarefas por fase. **Progresso concreto vive em PRs/issues** — nao marcar itens aqui.

## Fase 0 — Fundacao de dados

Pre-requisito de tudo. Nenhum modulo pode ser implementado sem o schema e o seed.

- Escrever `prisma/schema.prisma` com as entidades: `User`, `Project`, `Team`, `TeamMember`, `Osc`, `AppConfig`
- Declarar politicas de `onDelete` em todas as FKs: `Restrict` para `Project.oscId`, `Team.projectId`, `Team.createdBy`, `TeamMember.userId`; `Cascade` para `TeamMember.teamId`
- Rodar primeira migracao: `npx prisma migrate dev --name init`
- Editar a migration gerada para incluir o indice parcial:
  `CREATE UNIQUE INDEX "project_osc_active_unique" ON "Project" ("oscId") WHERE status NOT IN ('COMPLETED','ABANDONED')`
- Criar todos os indices na migration (alem do parcial): `User.email UNIQUE`, `Project.name UNIQUE`, `Project.status` (index), `Team.code UNIQUE`, `Team(projectId, createdAt DESC)` (composite), `Osc.name UNIQUE`, `Osc.status` (index), `TeamMember.userId` (index)
- Escrever `prisma/seed.ts` — cria coordenadores iniciais lidos de variaveis de ambiente ou de uma lista hardcoded configuravel
- Verificar que `AppConfig` e inicializado com `signUpEnabled = false` no seed
- Implementar funcao utilitaria `getCurrentSemester(date: Date): string` em `src/common/` (RF013) — usada nas Fases 3 e 4

## Fase 1 — Auth (backend)

Base de seguranca. Todos os outros modulos dependem de JWT e guards funcionando.

- Instalar dependencias: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `class-validator`, `class-transformer`
- Criar `AuthModule` com `JwtStrategy` e configuracao do `JwtModule`
- Implementar `JwtAuthGuard` (guard padrao para rotas autenticadas)
- Implementar `RolesGuard` + decorator `@Roles()`
- Implementar decorator `@Public()` para rotas sem JWT
- Configurar `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`) com retorno de validacao alinhado ao contrato (`422`)
- Endpoint `POST /auth/sign-in` — valida credenciais, retorna JWT
- Endpoint `POST /auth/sign-up` — cria conta `STUDENT`, verifica `AppConfig.signUpEnabled`
- Endpoint `GET /auth/me` — retorna usuario autenticado
- Endpoint `PATCH /auth/sign-up/toggle` — alterna `signUpEnabled` (COORDINATOR)
- Aplicar `JwtAuthGuard` globalmente; usar `@Public()` nas rotas abertas
- Payload do JWT: `{ sub: userId, email, role }` (conforme `rbac.md` §3)
- Erros especificos de `POST /auth/sign-up`: `403` quando cadastro desabilitado, `409` quando email duplicado

## Fase 2 — OSCs (backend)

Nucleo do sistema. RF003, RF004, RF005.

- Criar `OscsModule` com controller, service e DTOs
- Endpoint `POST /oscs` — cadastra OSC com status `AVAILABLE` (COORDINATOR)
- Endpoint `GET /oscs` — lista OSCs; COORDINATOR ve todas, STUDENT ve apenas `AVAILABLE`
- Endpoint `GET /oscs/:id` — detalhe de OSC (autenticado)
- Endpoint `PATCH /oscs/:id` — altera status (COORDINATOR); ao receber `IN_PROGRESS -> AVAILABLE`, validar se existe projeto ativo vinculado e retornar `409` (nao zerar `Project.oscId`)
- Erro `409` no `POST /oscs` quando nome de OSC ja cadastrado

## Fase 3 — Projects e Teams (backend)

Fluxo central do aluno. RF006, RF007, RF012, RF014.

- Criar `ProjectsModule` com controller, service e DTOs
- Criar `TeamsModule` com controller, service e DTOs (ou incorporar no `ProjectsModule` via sub-recursos)
- Implementar gerador de `code` unico de 6 caracteres (charset `A-Z` + `2-9`, exclui `0`, `O`, `I`, `1`)
- Endpoint `POST /projects` — em transacao: cria `Project` (`status = IN_PROGRESS`) com `{ name, oscId }`, cria `Team` do semestre atual, insere criador em `TeamMember` e define `Osc.status = IN_PROGRESS`
- Endpoint `POST /projects/:id/teams` — cria `Team` para o semestre atual em projeto com `status IN (ONGOING, INCOMPLETE)` e reativa `Project.status = IN_PROGRESS`; rejeita com `409` se ja existe equipe para este projeto no semestre atual
- Endpoint `GET /projects` — COORDINATOR ve todos; STUDENT ve A ∪ B (A = projetos em que participa via `TeamMember`, B = projetos continuaveis com `status IN (ONGOING, INCOMPLETE)`)
- Endpoint `GET /projects/:id` — mesma regra de visibilidade da listagem; `404` para STUDENT fora de A ∪ B
- Endpoint `PATCH /projects/:id/status` — aceita `IN_PROGRESS | COMPLETED | ABANDONED | ONGOING | INCOMPLETE`; libera OSC apenas em `COMPLETED/ABANDONED`; traduz conflito de unique parcial para `409`
- Endpoint `POST /teams/join` — busca `Team` pelo `code`, cria `TeamMember`; rejeita se aluno ja e membro (STUDENT)

## Fase 4 — Dashboard (backend)

Painel unico do coordenador: metricas + alertas + config global. RF009.

- Criar `DashboardModule`
- Endpoint `GET /dashboard` (COORDINATOR) — retorna em uma unica chamada:
  - Metricas: `totalOscs`, `activeProjects`, `blockedOscs`, `availableOscs`
  - Alerta operacional: `pendingProjects` — projetos `IN_PROGRESS` cuja equipe mais recente e de semestre anterior ao atual
  - Estado do cadastro publico: `signUp.enabled` e `signUp.updatedAt` (lidos de `AppConfig`)

## Fase 4.5 — Infraestrutura frontend

Estruturacao do frontend antes de qualquer tela. O prototipo atual (`App.jsx`) e descartado e o projeto e reestruturado do zero.

### 4.5.1 — Estruturacao do projeto

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

### 4.5.2 — Dependencias e configuracao

- Instalar `react-router` (roteamento)
- Criar cliente HTTP (`lib/httpClient.ts`) com interceptor que injeta `Authorization: Bearer <token>`
- Configurar aliases de importacao se necessario (`@/` -> `src/`)

### 4.5.3 — Design system minimo

- Definir tokens Tailwind no CSS: paleta de cores (primaria, sucesso, alerta, erro, neutros), tipografia (tamanhos, pesos), espacamento, border-radius
- Criar componentes base reutilizaveis:
  - `Button` — variantes (primary, outline, danger), tamanhos, estado disabled/loading
  - `Input` — com label, mensagem de erro, estado disabled
  - `Card` — container com padding e borda padrao
  - `Badge` — indicador de status com cores por tom (green, yellow, red, blue, slate)
  - `Modal` ou `Dialog` — overlay com titulo, conteudo e acoes

### 4.5.4 — Padroes de UI

- `AuthenticatedLayout` — shell com sidebar de navegacao (itens variam por role) e header com info do usuario
- Padrao de tratamento de estados: componente ou hook para loading (skeleton/spinner), erro (mensagem + retry), empty state (mensagem + acao)

## Fase 5 — Auth (frontend)

Base de navegacao. Sem auth funcional, nenhuma tela protegida funciona.

- `AuthContext` + `AuthProvider`: armazena `user` (id, name, email, role) e `accessToken`; persiste token em `localStorage`; carrega no boot via `GET /auth/me`; expoe `signIn()`, `signUp()`, `signOut()`, `isAuthenticated`, `user`
- Tela `/sign-in`: formulario com email + senha; validacao de campos obrigatorios; feedback de erro para credenciais invalidas (`401`); loading state no botao durante requisicao; redirect pos-login por role (`COORDINATOR -> /dashboard`, `STUDENT -> /projects`)
- Tela `/sign-up`: formulario com nome + email + senha; nao existe endpoint publico para checar `signUpEnabled` — o formulario e exibido sempre e o erro `403` e tratado como feedback ("Cadastro desabilitado no momento"); feedback de erros: email duplicado (`409`), validacao (`422`); redirect para `/sign-in` apos sucesso
- `PrivateRoute`: redireciona para `/sign-in` se nao autenticado; evita flash de conteudo (mostrar loading enquanto verifica token)
- `RoleRoute`: redireciona para home do perfil se role incorreto (`STUDENT` tentando acessar `/dashboard` -> `/projects`)
- Configurar arvore de rotas em `App.tsx`

## Fase 6 — Frontend do Coordenador

Telas restritas a `COORDINATOR`. Cada tela consome endpoints definidos em `api.md` e respeita as permissoes de `rbac.md`.

- Tela `/dashboard` — painel unico com tres secoes:
  - Bloco de metricas: cards com `totalOscs`, `activeProjects`, `blockedOscs`, `availableOscs`
  - Card de alerta: quando `pendingProjects > 0`, exibe contagem e link para `/projects` com filtro de pendentes
  - Secao de controle do cadastro: toggle `signUpEnabled`, indicador visual ("Cadastro aberto" / "Cadastro fechado"), data da ultima alteracao (`signUp.updatedAt`)
- Tela `/oscs`:
  - Listagem de todas as OSCs com status (Badge por cor)
  - Botao "Nova OSC" que abre modal com campos: nome, descricao, email (opcional), phone (opcional)
  - Feedback de erro: nome duplicado (`409`)
  - Acao de alterar status: dropdown inline ou modal com selecao de novo status
  - Feedback de erro ao tentar `IN_PROGRESS -> AVAILABLE` com projeto ativo: exibir `409` com nome do projeto pendente (campo `details.projectName` do erro)
- Tela `/projects`:
  - Listagem separada visualmente por semestre (atual vs. anteriores)
  - Projetos `IN_PROGRESS` de semestres anteriores destacados como pendentes de fechamento
  - Cada projeto exibe: nome, OSC vinculada, equipes com membros
  - Acao de definir status: modal com selecao (`IN_PROGRESS`, `COMPLETED`, `ABANDONED`, `ONGOING`, `INCOMPLETE`)
  - Feedback de consequencia automatica: ao selecionar `COMPLETED` ou `ABANDONED`, exibir aviso "A OSC [nome] sera liberada para disponivel" antes de confirmar

## Fase 7 — Frontend do Aluno

Telas restritas a `STUDENT`. Todas as acoes do aluno passam pela tela `/projects`.

- Tela `/projects` (visao do aluno):
  - Secao "Meus projetos": projetos em que participa (via `TeamMember`), com equipe, OSC e status
  - Secao "Projetos continuaveis": projetos com `status IN (ONGOING, INCOMPLETE)` disponiveis para continuacao
  - Tres acoes principais:
    - **Criar novo projeto:** formulario com nome do projeto + selecao de OSC disponivel (lista de `GET /oscs` filtrada por `AVAILABLE`). Apos sucesso, exibir modal de confirmacao com o `code` da equipe gerada (destaque visual + botao copiar)
    - **Entrar em equipe:** formulario com campo de codigo de 6 caracteres (`POST /teams/join`). Feedback: equipe nao encontrada (`404`), ja e membro (`409`), sucesso com dados da equipe e projeto
    - **Continuar projeto:** seleciona projeto da lista de continuaveis, confirma (`POST /projects/:id/teams`). Apos sucesso, exibir `code` da nova equipe gerada (mesmo padrao de "Criar novo projeto")

## Dependencias entre fases

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
