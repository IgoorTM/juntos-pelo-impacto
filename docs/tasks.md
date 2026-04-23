# Quebra Técnica do MVP — Juntos pelo Impacto

> Ordem de implementação recomendada. Cada fase é um conjunto coeso de tarefas que pode ser entregue e testado de forma independente. Backend precede frontend em cada domínio.
>
> Este documento é o mapa das tarefas por fase. **Progresso concreto vive em PRs/issues** — não marcar itens aqui.

## Fase 0 — Fundação de dados

Pré-requisito de tudo. Nenhum módulo pode ser implementado sem o schema e o seed.

- Escrever `prisma/schema.prisma` com as entidades: `User`, `Project`, `Team`, `TeamMember`, `Osc`, `AppConfig`
- Rodar primeira migração: `npx prisma migrate dev --name init`
- Editar a migration gerada para incluir o índice parcial:
  `CREATE UNIQUE INDEX "project_osc_active_unique" ON "Project" ("oscId") WHERE status NOT IN ('COMPLETED','ABANDONED')`
- Escrever `prisma/seed.ts` — cria coordenadores iniciais lidos de variáveis de ambiente ou de uma lista hardcoded configurável
- Verificar que `AppConfig` é inicializado com `signUpEnabled = false` no seed

## Fase 1 — Auth (backend)

Base de segurança. Todos os outros módulos dependem de JWT e guards funcionando.

- Instalar dependências: `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcrypt`, `class-validator`, `class-transformer`
- Criar `AuthModule` com `JwtStrategy` e configuração do `JwtModule`
- Implementar `JwtAuthGuard` (guard padrão para rotas autenticadas)
- Implementar `RolesGuard` + decorator `@Roles()`
- Implementar decorator `@Public()` para rotas sem JWT
- Configurar `ValidationPipe` global (`whitelist`, `forbidNonWhitelisted`, `transform`) com retorno de validação alinhado ao contrato (`422`)
- Endpoint `POST /auth/sign-in` — valida credenciais, retorna JWT
- Endpoint `POST /auth/sign-up` — cria conta `STUDENT`, verifica `AppConfig.signUpEnabled`
- Endpoint `GET /auth/me` — retorna usuário autenticado
- Endpoint `PATCH /auth/sign-up/toggle` — alterna `signUpEnabled` (COORDINATOR)
- Aplicar `JwtAuthGuard` globalmente; usar `@Public()` nas rotas abertas

## Fase 2 — OSCs (backend)

Núcleo do sistema. RF003, RF004, RF005.

- Criar `OscsModule` com controller, service e DTOs
- Endpoint `POST /oscs` — cadastra OSC com status `AVAILABLE` (COORDINATOR)
- Endpoint `GET /oscs` — lista OSCs; COORDINATOR vê todas, STUDENT vê apenas `AVAILABLE`
- Implementar função utilitária `getCurrentSemester(date: Date): string` (RF013)
- Endpoint `GET /oscs/:id` — detalhe de OSC (autenticado)
- Endpoint `PATCH /oscs/:id` — altera status (COORDINATOR); ao receber `IN_PROGRESS -> AVAILABLE`, validar se existe projeto ativo vinculado e retornar `409` (não zerar `Project.oscId`)

## Fase 3 — Projects e Teams (backend)

Fluxo central do aluno. RF006, RF007, RF012, RF014.

- Criar `ProjectsModule` com controller, service e DTOs
- Criar `TeamsModule` com controller, service e DTOs (ou incorporar no `ProjectsModule` via sub-recursos)
- Implementar gerador de `code` único de 6 caracteres (charset `A-Z` + `2-9`, exclui `0`, `O`, `I`, `1`)
- Endpoint `POST /projects` — em transação: cria `Project` (`status = IN_PROGRESS`) com `{ name, oscId }`, cria `Team` do semestre atual, insere criador em `TeamMember` e define `Osc.status = IN_PROGRESS`
- Endpoint `POST /projects/:id/teams` — cria `Team` para o semestre atual em projeto com `status IN (ONGOING, INCOMPLETE)` e reativa `Project.status = IN_PROGRESS`; rejeita se já existe equipe no semestre
- Endpoint `GET /projects` — COORDINATOR vê todos; STUDENT vê A ∪ B (A = projetos em que participa, B = projetos continuáveis `ONGOING/INCOMPLETE`)
- Endpoint `GET /projects/:id` — mesma regra de visibilidade da listagem; `404` para STUDENT fora de A ∪ B
- Endpoint `PATCH /projects/:id/status` — aceita `IN_PROGRESS | COMPLETED | ABANDONED | ONGOING | INCOMPLETE`; libera OSC apenas em `COMPLETED/ABANDONED`; traduz conflito de unique parcial para `409`
- Endpoint `POST /teams/join` — busca `Team` pelo `code`, cria `TeamMember`; rejeita se aluno já é membro (STUDENT)

## Fase 4 — Dashboard (backend)

Painel único do coordenador: métricas + alertas + config global. RF009.

- Criar `DashboardModule`
- Endpoint `GET /dashboard` (COORDINATOR) — retorna em uma única chamada:
  - Métricas: `totalOscs`, `activeProjects`, `blockedOscs`, `availableOscs`
  - Alerta operacional: `pendingProjects` — projetos `IN_PROGRESS` cuja equipe mais recente é de semestre anterior ao atual
  - Estado do cadastro público: `signUp.enabled` e `signUp.updatedAt` (lidos de `AppConfig`)

## Fase 5 — Auth (frontend)

Base de navegação. Sem isso, nenhuma tela protegida funciona.

- Criar `AuthContext` com estado do usuário e token JWT
- Implementar cliente HTTP (axios ou fetch wrapper) com interceptor de token
- Tela `/sign-in` — formulário de login, redireciona por `role` após sucesso
- Tela `/sign-up` — formulário de cadastro público (verifica se está habilitado)
- Componente `PrivateRoute` — redireciona para `/sign-in` se sem token
- Componente `RoleRoute` — redireciona se `role` incorreto
- Configurar roteamento base: `COORDINATOR -> /dashboard`, `STUDENT -> /projects`

## Fase 6 — Frontend do Coordenador

Telas restritas a `COORDINATOR`.

- Tela `/dashboard` — painel único com três seções:
  - Bloco de métricas (`totalOscs`, `activeProjects`, `blockedOscs`, `availableOscs`)
  - Card de alerta quando `pendingProjects > 0` — exibe a contagem e leva à tela `/projects` destacando os pendentes
  - Seção de controle do cadastro público — toggle de `signUpEnabled`, indicador visual ("Cadastro aberto" / "Cadastro fechado") e data da última alteração
- Tela `/oscs` — listagem de todas as OSCs com status; botão de cadastro
- Formulário de cadastro de OSC (modal ou página)
- Ação de alterar status de OSC (dropdown ou botões inline)
- Tela `/projects`:
  - Listagem separada visualmente por semestre (atual × anteriores)
  - Destaque para projetos do semestre anterior com `status = IN_PROGRESS` (pendentes de fechamento)
  - Exibir OSC vinculada, equipes e membros de cada projeto
  - Ação de definir status (`IN_PROGRESS`, `COMPLETED`, `ABANDONED`, `ONGOING`, `INCOMPLETE`) via modal/dropdown

## Fase 7 — Frontend do Aluno

Telas restritas a `STUDENT`.

- Tela `/projects` — identifica projetos em que o aluno participa e projetos continuáveis; opções: criar novo, entrar em equipe, continuar projeto existente em novo semestre
- Formulário de criar projeto (nome + OSC disponível) — exibe o `code` gerado após criação
- Formulário de entrar em equipe (código de 6 caracteres via `POST /teams/join`)
- Formulário de continuar projeto (seleciona projeto existente e cria nova equipe via `POST /projects/:id/teams`) — exibe `code` gerado
- Feedback visual após criação/continuação do projeto e vínculo da OSC

## Dependências entre fases

```
Fase 0 (schema)
  └── Fase 1 (auth backend)
        └── Fase 2 (oscs backend)
        └── Fase 3 (projects + teams backend)
              └── Fase 4 (dashboard backend)
                    └── Fase 5 (auth frontend)
                          └── Fase 6 (frontend coordenador)
                          └── Fase 7 (frontend aluno)
```

Fases 2, 3 e 4 do backend podem ser desenvolvidas em paralelo após Fase 1. Fases 6 e 7 do frontend podem ser desenvolvidas em paralelo após Fase 5.
