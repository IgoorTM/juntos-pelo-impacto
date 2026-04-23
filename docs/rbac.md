# RBAC — Controle de Acesso Baseado em Perfis

> Documento vivo. Define o que cada perfil pode fazer em cada endpoint. Fonte da verdade para implementação de guards no backend e proteção de rotas no frontend.

## 1. Perfis

| Perfil | Enum | Descrição |
|---|---|---|
| Coordenador | `COORDINATOR` | Coordenador do programa. Criado via seed. |
| Aluno | `STUDENT` | Participante do programa. Criado via `/sign-up`. |

## 2. Matriz de permissões

### Rotas públicas (sem autenticação)

| Rota | Método | Condição |
|---|---|---|
| `/auth/sign-in` | `POST` | Sempre acessível |
| `/auth/sign-up` | `POST` | Somente quando `AppConfig.signUpEnabled = true` |

### Auth

| Rota | Método | Coordenador | Aluno |
|---|---|---|---|
| `/auth/me` | `GET` | Sim | Sim |
| `/auth/sign-up/toggle` | `PATCH` | Sim | Não |

### OSCs

| Rota | Método | Coordenador | Aluno | Observação |
|---|---|---|---|---|
| `/oscs` | `GET` | Todas as OSCs | Apenas `AVAILABLE` | Aluno não vê `IN_PROGRESS` nem `BLOCKED` |
| `/oscs` | `POST` | Sim | Não | |
| `/oscs/:id` | `GET` | Sim | Sim | |
| `/oscs/:id` | `PATCH` | Sim (status) | Não | Mover `IN_PROGRESS → AVAILABLE` bloqueia com `409` se houver `Project` ativo vinculado (RF005 em data-model). `Project.oscId` nunca é zerado |

### Projects

| Rota | Método | Coordenador | Aluno | Observação |
|---|---|---|---|---|
| `/projects` | `GET` | Todos os projetos | Projetos em que é membro (`TeamMember`) **+** projetos continuáveis (`ONGOING`/`INCOMPLETE`) | Regra A ∪ B para Aluno |
| `/projects/:id` | `GET` | Sim | Sim, se o projeto estiver em A ∪ B | Fora de A ∪ B retorna `404` para Aluno |
| `/projects` | `POST` | Não | Sim | Fluxo A — body `{ name, oscId }` com OSC `AVAILABLE`. Cria Project + Team e move `Osc.status → IN_PROGRESS` em uma transação |
| `/projects/:id/teams` | `POST` | Não | Sim | Fluxo B — continuação por qualquer Aluno. Só projetos com `status IN (ONGOING, INCOMPLETE)`. Cria Team, herda OSC e reativa projeto (`status → IN_PROGRESS`) |
| `/projects/:id/status` | `PATCH` | Sim | Não | RF014 — define status ao encerrar semestre |

### Teams

| Rota | Método | Coordenador | Aluno | Observação |
|---|---|---|---|---|
| `/teams/join` | `POST` | Não | Sim | Aluno entra na equipe pelo código de 6 caracteres |

### Dashboard

| Rota | Método | Coordenador | Aluno |
|---|---|---|---|
| `/dashboard` | `GET` | Sim | Não |

## 3. Implementação no backend (NestJS)

### Guards utilizados

| Guard | Função |
|---|---|
| `JwtAuthGuard` | Valida o token JWT em todas as rotas autenticadas |
| `RolesGuard` | Verifica se o `role` do usuário tem acesso ao endpoint |

### Decorators

```ts
@Roles(UserRole.COORDINATOR)   // restringe a coordenadores
@Roles(UserRole.STUDENT)       // restringe a alunos
@Public()                      // marca rota como pública (sem JWT)
```

### Fluxo de autenticação

1. Usuário faz `POST /auth/sign-in` → recebe `accessToken` (JWT).
2. JWT contém payload: `{ sub: userId, email, role }`.
3. Cada requisição autenticada envia `Authorization: Bearer <token>`.
4. `JwtAuthGuard` valida e injeta o usuário no contexto da requisição.
5. `RolesGuard` lê o decorator `@Roles` do endpoint e compara com `req.user.role`.

### Verificação de liderança

Nenhum endpoint do MVP é gateado por liderança. A OSC é escolhida atomicamente na criação/continuação do projeto (quem submete vira o líder), então não há ação pós-criação que exija checar `Team.createdBy`.

## 4. Proteção de rotas no frontend

| Tipo de rota | Componente | Comportamento |
|---|---|---|
| Pública | Sem wrapper | Acessível sem login (`/sign-in`, `/sign-up`) |
| Autenticada | `PrivateRoute` | Redireciona para `/sign-in` se sem token |
| Por perfil | `RoleRoute` | Redireciona para home do perfil se role incorreto |

Após o login, o frontend redireciona baseado no `role`:
- `COORDINATOR` → `/dashboard`
- `STUDENT` → `/projects`
