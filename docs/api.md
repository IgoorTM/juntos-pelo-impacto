# Contratos de API — MVP Juntos pelo Impacto

> Documento vivo. Define rotas, métodos, autenticação, request e response de cada endpoint. Fonte de alinhamento entre frontend e backend. Permissões detalhadas em [rbac.md](rbac.md).

## Convenções

- Base URL: `http://localhost:3000` (dev local)
- Autenticação: `Authorization: Bearer <token>` em todas as rotas não públicas
- Erros seguem o padrão NestJS: `{ statusCode, message, error }`
- Em conflitos de regra de negócio, a resposta pode incluir `details` com dados extras (ex.: `projectId`, `projectName` em `PATCH /oscs/:id`).
- `signUpEnabled` (auth toggle) e `signUp.enabled` (dashboard) representam o mesmo estado (`AppConfig.signUpEnabled`), com shape adaptado ao endpoint.
- Datas em ISO 8601: `"2025-06-15T10:00:00.000Z"`
- Semestre em formato `"YYYY-N"`: `"2025-1"`, `"2025-2"`

### Erros globais

| Código | Condição |
|---|---|
| `401` | Token ausente, malformado ou expirado (rotas autenticadas) |
| `403` | Token válido, mas `role` sem permissão para a rota |
| `422` | Payload inválido na validação de DTO |

---

## Auth

### POST /auth/sign-in
Autentica um usuário e retorna o token JWT.

**Público.** Request:
```json
{ "email": "string", "password": "string" }
```
Response `200`:
```json
{
  "accessToken": "string",
  "user": { "id": "string", "name": "string", "email": "string", "role": "COORDINATOR | STUDENT" }
}
```
Erros: `401` credenciais inválidas.

---

### POST /auth/sign-up
Cria uma conta com perfil `STUDENT`.

**Público**, mas bloqueado quando `AppConfig.signUpEnabled = false`. Request:
```json
{ "name": "string", "email": "string", "password": "string" }
```
Response `201`:
```json
{ "id": "string", "name": "string", "email": "string", "role": "STUDENT" }
```
Erros: `403` cadastro desabilitado; `409` e-mail já cadastrado.

---

### GET /auth/me
Retorna o usuário autenticado.

**Autenticado.** Response `200`:
```json
{ "id": "string", "name": "string", "email": "string", "role": "COORDINATOR | STUDENT" }
```

---

### PATCH /auth/sign-up/toggle
Habilita ou desabilita o cadastro público de alunos.

**COORDINATOR.** Request:
```json
{ "enabled": true }
```
Response `200`:
```json
{ "signUpEnabled": true }
```

---

## OSCs

### GET /oscs
Lista OSCs.

**Autenticado.**
- `COORDINATOR`: retorna todas as OSCs (qualquer status).
- `STUDENT`: retorna apenas OSCs com `status = AVAILABLE`.

Response `200`:
```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string",
    "email": "string | null",
    "phone": "string | null",
    "status": "AVAILABLE | IN_PROGRESS | BLOCKED"
  }
]
```

---

### POST /oscs
Cadastra uma nova OSC.

**COORDINATOR.** Request:
```json
{ "name": "string", "description": "string", "email": "string (opcional)", "phone": "string (opcional)" }
```
Response `201`:
```json
{ "id": "string", "name": "string", "description": "string", "email": "string | null", "phone": "string | null", "status": "AVAILABLE" }
```
Erros: `409` nome já cadastrado.

---

### GET /oscs/:id
Retorna detalhes de uma OSC.

**Autenticado.** Response `200`:
```json
{ "id": "string", "name": "string", "description": "string", "email": "string | null", "phone": "string | null", "status": "AVAILABLE | IN_PROGRESS | BLOCKED" }
```
Erros: `404` não encontrada.

---

### PATCH /oscs/:id
Atualiza o status de uma OSC.

**COORDINATOR.** Request:
```json
{ "status": "AVAILABLE | IN_PROGRESS | BLOCKED" }
```
Response `200`: OSC atualizada (mesmo shape de `GET /oscs/:id`).

Regra de negócio: ao tentar `IN_PROGRESS -> AVAILABLE`, se existir projeto ativo vinculado à OSC, retorna `409` com:
```json
{
  "statusCode": 409,
  "message": "OSC possui projeto ativo vinculado",
  "error": "Conflict",
  "details": { "projectId": "string", "projectName": "string" }
}
```
`Project.oscId` nunca é zerado automaticamente.

---

## Projects

### GET /projects
Lista projetos.

**Autenticado.**
- `COORDINATOR`: todos os projetos.
- `STUDENT`: A ∪ B, onde:
  - A = projetos em que é membro (`TeamMember`)
  - B = projetos continuáveis (`status IN (ONGOING, INCOMPLETE)`)

Response `200`:
```json
[
  {
    "id": "string",
    "name": "string",
    "status": "IN_PROGRESS | COMPLETED | ABANDONED | INCOMPLETE | ONGOING",
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
]
```

---

### GET /projects/:id
Retorna detalhe de um projeto.

**Autenticado.**
- `COORDINATOR`: acessa qualquer projeto.
- `STUDENT`: acessa somente se o projeto estiver em A ∪ B (mesma regra da listagem).

Response `200`: mesmo shape de um item de `GET /projects`.
Erros: `404` projeto não encontrado ou sem visibilidade para STUDENT.

---

### POST /projects
Cria um novo projeto e a equipe do semestre atual.

**STUDENT.** Em transação: valida OSC disponível, cria `Project` (`status = IN_PROGRESS`, com `oscId`), cria `Team`, insere criador em `TeamMember` e define `Osc.status = IN_PROGRESS`.

Request:
```json
{ "name": "string", "oscId": "string" }
```
Response `201`:
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
Erros: `404` OSC não encontrada; `409` OSC não está `AVAILABLE`; `409` nome de projeto já cadastrado.

---

### POST /projects/:id/teams
Cria uma nova equipe para um projeto existente (continuação em novo semestre — RF012).

**STUDENT.** Em transação: cria `Team` com semestre atual e `createdBy` do aluno criador, insere criador em `TeamMember` e atualiza `Project.status = IN_PROGRESS`.

Request: sem body.

Response `201`:
```json
{
  "id": "string",
  "semester": "string",
  "code": "string",
  "members": [{ "id": "string", "name": "string" }]
}
```
Erros: `404` projeto não encontrado; `400` projeto não está em `ONGOING`/`INCOMPLETE`; `409` já existe equipe para este projeto no semestre atual.

---

### PATCH /projects/:id/status
Define o status de um projeto.

**COORDINATOR.** Impactos automáticos na OSC:

| Status | Ação na OSC |
|---|---|
| `IN_PROGRESS` | Sem ação automática |
| `COMPLETED` | `Osc.status -> AVAILABLE` (mesma transação) |
| `ABANDONED` | `Osc.status -> AVAILABLE` (mesma transação) |
| `ONGOING` | Sem ação automática |
| `INCOMPLETE` | Sem ação automática |

Request:
```json
{ "status": "IN_PROGRESS | COMPLETED | ABANDONED | ONGOING | INCOMPLETE" }
```
Response `200`: projeto atualizado.

Erros: `404` projeto não encontrado; `409` conflito de unicidade parcial (`project_osc_active_unique`) ao reabrir projeto.

---

## Teams

### POST /teams/join
Aluno entra em uma equipe existente pelo código (RF012).

**STUDENT.** Busca a `Team` pelo código único de 6 caracteres e cria um registro em `TeamMember`. Request:
```json
{ "code": "string" }
```
Response `200`:
```json
{
  "id": "string",
  "semester": "string",
  "code": "string",
  "project": { "id": "string", "name": "string" },
  "members": [{ "id": "string", "name": "string" }]
}
```
Erros: `404` equipe não encontrada; `409` aluno já é membro desta equipe.

---

## Dashboard

### GET /dashboard
Retorna métricas, alertas operacionais e estado da configuração global para o painel do coordenador (RF009).

**COORDINATOR.** Response `200`:
```json
{
  "totalOscs": 0,
  "activeProjects": 0,
  "blockedOscs": 0,
  "availableOscs": 0,
  "pendingProjects": 0,
  "signUp": {
    "enabled": false,
    "updatedAt": "2025-03-01T10:00:00.000Z"
  }
}
```

Campos:
- `totalOscs` — total de OSCs cadastradas.
- `activeProjects` — projetos com `oscId IS NOT NULL` e `status = IN_PROGRESS`.
- `blockedOscs` / `availableOscs` — contagens por status.
- `pendingProjects` — projetos com `status = IN_PROGRESS` cuja equipe mais recente pertence a um semestre anterior ao atual.
- `signUp` — estado atual do toggle de cadastro público (`AppConfig.signUpEnabled` + `AppConfig.updatedAt`).
