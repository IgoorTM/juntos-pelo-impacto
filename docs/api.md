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
Cria uma conta com perfil `STUDENT` ou `COORDINATOR`.

**Para `STUDENT` (padrão):** Público, mas bloqueado quando `AppConfig.signUpEnabled = false`. Request:
```json
{ "name": "string", "email": "string", "password": "string" }
```

**Para `COORDINATOR`:** Autenticado, apenas `ADMIN`. Request:
```json
{ "name": "string", "email": "string", "password": "string", "role": "COORDINATOR" }
```

Response `201`:
```json
{ "id": "string", "name": "string", "email": "string", "role": "STUDENT | COORDINATOR" }
```

Erros: `400` role inválido; `403` cadastro de STUDENT desabilitado ou permissão negada para criar COORDINATOR; `409` e-mail já cadastrado.

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
Lista OSCs com filtros e paginação.

**Autenticado.**
- `COORDINATOR`: retorna todas as OSCs (qualquer status). Parâmetro `status` é aplicado se presente.
- `STUDENT`: retorna apenas OSCs com `status = AVAILABLE`. O parâmetro `status` é ignorado.

Query params:

| Param | Tipo | Default | Validação |
|---|---|---|---|
| `page` | integer | 1 | mínimo 1 |
| `limit` | integer | 10 | mínimo 1, máximo 50 |
| `search` | string | — | opcional, busca parcial em `name` (case-insensitive) |
| `status` | enum | — | opcional, `AVAILABLE \| IN_PROGRESS \| BLOCKED` |

Response `200`:
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "email": "string | null",
      "phone": "string | null",
      "category": "EDUCACAO | CULTURA | ASSISTENCIA_SOCIAL | SAUDE | MEIO_AMBIENTE | OUTROS",
      "status": "AVAILABLE | IN_PROGRESS | BLOCKED",
      "projectCount": 0
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

---

### POST /oscs
Cadastra uma nova OSC.

**COORDINATOR, ADMIN.** Request:
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
Atualiza dados de uma OSC.

**COORDINATOR, ADMIN.** Todos os campos são opcionais. Request:
```json
{ "name": "string (opcional)", "description": "string (opcional)", "email": "string (opcional)", "phone": "string (opcional)", "status": "AVAILABLE | IN_PROGRESS | BLOCKED (opcional)" }
```
Response `200`: OSC atualizada (mesmo shape de `GET /oscs/:id`).

Erros: `404` não encontrada; `409` nome já cadastrado.

Sem restrição de transição de status — o coordenador define o status livremente. A restrição de integridade vive em `POST /projects`, que só aceita OSCs com `status = AVAILABLE`.

---

## Projects

### GET /projects
Lista projetos com filtros e paginação.

**COORDINATOR, STUDENT.**
- COORDINATOR: retorna todos os projetos.
- STUDENT: retorna apenas projetos onde o aluno é membro via `TeamMember`.

Query params:

| Param | Tipo | Default | Validação |
|---|---|---|---|
| `page` | integer | 1 | mínimo 1 |
| `limit` | integer | 10 | mínimo 1, máximo 50 |
| `search` | string | — | opcional, busca parcial em `project.name` (case-insensitive) |
| `oscSearch` | string | — | opcional, busca parcial em `osc.name` (case-insensitive) |
| `status` | enum | — | opcional, `IN_PROGRESS \| COMPLETED \| ABANDONED` |

Response `200`:
```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "status": "IN_PROGRESS | COMPLETED | ABANDONED",
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
  ],
  "total": 18,
  "page": 1,
  "limit": 10,
  "totalPages": 2
}
```

---

### GET /projects/:id
Retorna detalhe de um projeto.

**Autenticado.** Qualquer usuário autenticado pode acessar qualquer projeto.

Response `200`: mesmo shape de um item de `GET /projects`.
Erros: `404` projeto não encontrado.

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

### PATCH /projects/:id/status
Define o status de um projeto.

**COORDINATOR.** Sem efeito automático no status da OSC — o coordenador gerencia a OSC manualmente via `PATCH /oscs/:id`.

Request:
```json
{ "status": "IN_PROGRESS | COMPLETED | ABANDONED" }
```
Response `200`: projeto atualizado.

Erros: `404` projeto não encontrado.

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
