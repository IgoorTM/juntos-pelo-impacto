# RBAC — Controle de Acesso Baseado em Perfis

> Documento vivo. Define o que cada perfil pode fazer em cada endpoint. Fonte da verdade para implementação de guards no backend e proteção de rotas no frontend.

## 1. Perfis

| Perfil | Enum | Descrição |
|---|---|---|
| Admin | `ADMIN` | Acesso irrestrito a todos os endpoints. Criado via seed. No frontend, compartilha a mesma visão do Coordenador (no MVP). Pode criar coordenadores via `POST /auth/sign-up`. |
| Coordenador | `COORDINATOR` | Coordenador do programa. Criado via `POST /auth/sign-up` com `role: COORDINATOR` (requer autenticação ADMIN). |
| Aluno | `STUDENT` | Participante do programa. Criado via `POST /auth/sign-up` (público quando habilitado). |

> **Regra geral:** `ADMIN` ignora a matriz abaixo — todo endpoint autenticado é permitido para `ADMIN`. As tabelas a seguir descrevem apenas `COORDINATOR` e `STUDENT`; o `RolesGuard` deve liberar automaticamente qualquer rota quando `req.user.role === ADMIN`.

## 2. Matriz de permissões

### Rotas públicas (sem autenticação)

| Rota | Método | Condição |
|---|---|---|
| `/auth/sign-in` | `POST` | Sempre acessível |
| `/auth/sign-up` | `POST` | Somente quando `AppConfig.signUpEnabled = true` |

### Auth

| Rota | Método | Público | Coordenador | Aluno | Observação |
|---|---|---|---|---|---|
| `/auth/sign-up` (role=STUDENT) | `POST` | Sim* | Sim* | Sim* | Público quando `AppConfig.signUpEnabled = true` |
| `/auth/sign-up` (role=COORDINATOR) | `POST` | Não | Não | Não | Apenas ADMIN |
| `/auth/me` | `GET` | Não | Sim | Sim | |
| `/auth/sign-up/toggle` | `PATCH` | Não | Sim | Não | |

### OSCs

| Rota | Método | Coordenador | Aluno | Observação |
|---|---|---|---|---|
| `/oscs` | `GET` | Todas as OSCs | Apenas `AVAILABLE` | Aluno não vê `IN_PROGRESS` nem `BLOCKED` |
| `/oscs` | `POST` | Sim | Não | |
| `/oscs/:id` | `GET` | Sim | Sim | |
| `/oscs/:id` | `PATCH` | Sim (qualquer campo) | Não | Atualiza nome, descricao, email, phone e/ou status livremente. Restrição de integridade vive em `POST /projects` (só aceita OSC `AVAILABLE`) |

### Projects

| Rota | Método | Coordenador | Aluno | Observação |
|---|---|---|---|---|
| `/projects` | `GET` | Todos os projetos | Não tem acesso | |
| `/projects/:id` | `GET` | Sim | Sim | Qualquer usuário autenticado |
| `/projects` | `POST` | Não | Sim | Body `{ name, oscId }` com OSC `AVAILABLE`. Cria Project + Team e move `Osc.status → IN_PROGRESS` em transação |
| `/projects/:id/status` | `PATCH` | Sim | Não | Define status: `IN_PROGRESS`, `COMPLETED` ou `ABANDONED`. Sem efeito automático na OSC |

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
@Roles(UserRole.COORDINATOR)   // restringe a coordenadores (ADMIN passa)
@Roles(UserRole.STUDENT)       // restringe a alunos (ADMIN passa)
@Public()                      // marca rota como pública (sem JWT)
```

`RolesGuard` deve permitir acesso quando `req.user.role === UserRole.ADMIN`, independentemente dos roles declarados em `@Roles`.

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
- `ADMIN` → `/dashboard` (compartilha a mesma visão de `COORDINATOR` no MVP)
- `COORDINATOR` → `/dashboard`
- `STUDENT` → `/projects`
