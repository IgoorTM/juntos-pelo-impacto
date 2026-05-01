# Modelo de Dados — MVP Juntos pelo Impacto

> Documento vivo. Define entidades, relações e regras de negócio derivadas do modelo. O schema definitivo do Prisma é gerado a partir deste documento.

## 1. Entidades

### User
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String` (cuid) | Identificador único |
| `name` | `String` | Nome completo |
| `email` | `String` (único) | E-mail de login |
| `passwordHash` | `String` | Hash bcrypt — salt embutido no próprio hash |
| `role` | `UserRole` | Perfil de acesso |
| `createdAt` | `DateTime` | Data de criação |
| `updatedAt` | `DateTime` | Data da última atualização |

### Project
Representa o engajamento com uma OSC. Persiste entre semestres — equipes diferentes podem trabalhar no mesmo projeto em semestres distintos. O projeto não guarda referência direta a um criador/dono: a liderança vive em `Team.createdBy` e existe por semestre.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String` (cuid) | Identificador único |
| `name` | `String` (único) | Nome do projeto |
| `oscId` | `String` (FK, unique parcial) | OSC engajada pelo projeto. Definida na criação e **nunca zerada** — preserva o histórico de qual OSC cada projeto engajou. Unicidade parcial garante no máximo um `Project` ativo por OSC — ver §5. |
| `status` | `ProjectStatus` | Status atual do projeto (default `IN_PROGRESS`) |
| `createdAt` | `DateTime` | Data de criação |
| `updatedAt` | `DateTime` | Data da última atualização |

### Team
Grupo de alunos trabalhando em um projeto em um semestre específico. Um mesmo projeto pode ter múltiplas equipes ao longo dos semestres.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String` (cuid) | Identificador único |
| `projectId` | `String` (FK) | Projeto ao qual a equipe pertence |
| `semester` | `String` | Semestre da equipe (ex: `2025-1`) |
| `code` | `String` (único, 6 chars) | Código para entrada — charset `A-Z` + `2-9` (exclui `0`, `O`, `I`, `1`) |
| `createdBy` | `String` (FK → User) | Líder da equipe — aluno que criou a Team (fluxo A ou B, ver §4) |
| `createdAt` | `DateTime` | Data de criação |
| `updatedAt` | `DateTime` | Data da última atualização |

### TeamMember
Tabela de junção da relação muitos-para-muitos entre `User` e `Team`.

| Campo | Tipo | Descrição |
|---|---|---|
| `teamId` | `String` (FK) | Referência ao Team |
| `userId` | `String` (FK) | Referência ao User |
| `joinedAt` | `DateTime` | Data de entrada na equipe |

Chave primária composta: `(teamId, userId)`.

### Osc
| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `String` (cuid) | Identificador único |
| `name` | `String` (único) | Nome da organização |
| `description` | `String` | Descrição da OSC |
| `email` | `String?` | E-mail de contato (opcional) |
| `phone` | `String?` | Telefone de contato (opcional) |
| `status` | `OscStatus` | Status atual da OSC |
| `createdAt` | `DateTime` | Data de cadastro |
| `updatedAt` | `DateTime` | Data da última atualização |

### AppConfig
Configuração global da aplicação. Existe sempre como registro único (singleton).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `Int` (fixo em `1`) | Sempre `1` — singleton |
| `signUpEnabled` | `Boolean` | Controla se `/sign-up` está acessível (default `false`) |
| `updatedAt` | `DateTime` | Data da última atualização da configuração |

## 2. Enums

```
UserRole
  ADMIN
  COORDINATOR
  STUDENT

OscStatus
  AVAILABLE
  IN_PROGRESS
  BLOCKED

ProjectStatus
  IN_PROGRESS  — projeto ativo no semestre atual
  COMPLETED    — concluido com sucesso
  ABANDONED    — abandonado pela equipe
```

## 3. Diagrama de relações

```
User ──────────────── TeamMember ──────────────── Team ─────── Project
 │                    (muitos-para-muitos)          │               │
 │                                                  │          oscId (FK)
 └── createdBy (1-para-muitos) ────────────────────┘               │
                                                                    ▼
                                                                   Osc
                                                       status: AVAILABLE | IN_PROGRESS | BLOCKED

AppConfig (singleton — sem relações)
```

## 4. Regras de negócio derivadas do modelo

### Cálculo de semestre (RF013)
Função utilitária no backend — nenhuma coluna armazena o semestre corrente.

```
mês 1–6  → "${ano}-1"   (ex: 2025-1)
mês 7–12 → "${ano}-2"   (ex: 2025-2)
```

### Fluxos de criação e continuação de projeto (RF006 + RF007 + RF012)
Ao iniciar/entrar em um projeto no semestre, o aluno escolhe entre dois caminhos. A escolha filtra a listagem de OSCs exibida.

**A. Iniciar novo projeto**
- Listagem exibida: OSCs com `status = AVAILABLE`.
- Ao submeter (nome do projeto + OSC escolhida), em uma única transação:
  1. Cria `Project` com `status = IN_PROGRESS` e `oscId` = OSC escolhida.
  2. Altera `Osc.status = IN_PROGRESS`.
  3. Cria `Team` com o semestre atual (ver "Cálculo de semestre") e `createdBy = user`.
  4. Insere o criador em `TeamMember`.

Em ambos os fluxos, o criador é líder (`Team.createdBy`) e também membro (`TeamMember`). Após a criação, o líder compartilha o `code` da nova `Team` com os colegas, que entram via `POST /teams/join` (ver "Entrada em equipe por código").

### Entrada em equipe por código (RF012)
O aluno informa o `code` da equipe (6 caracteres). O sistema busca a `Team` pelo código único e cria um registro em `TeamMember`. Se a equipe não existir, retorna `404`. Um aluno pode pertencer a múltiplas equipes simultaneamente.

### Seleção de OSC (RF006 + RF007)
A OSC é escolhida pelo aluno no ato de criar ou continuar o projeto (fluxos A e B acima). Não existe endpoint separado de "selecionar OSC" após a criação. Como quem submete é também o líder (`Team.createdBy` da nova equipe), a restrição "apenas o líder seleciona" é atendida trivialmente.

### Impacto do ProjectStatus na OSC (RF014)
O coordenador atualiza `Project.status` ao final de cada semestre via `PATCH /projects/:id/status`. As mudanças de status do projeto **não alteram automaticamente** o status da OSC:

| ProjectStatus | Acao na OSC |
|---|---|
| `IN_PROGRESS` | Sem acao automatica |
| `COMPLETED` | Sem acao automatica |
| `ABANDONED` | Sem acao automatica |

O coordenador gerencia o status da OSC manualmente via `PATCH /oscs/:id`, de forma independente do status do projeto. A unica operacao que altera o status da OSC automaticamente e `POST /projects`, que seta `Osc.status = IN_PROGRESS` ao criar um projeto.

OSCs com `status = IN_PROGRESS` ou `BLOCKED` não aparecem na listagem de disponíveis para alunos.

### Gestão manual de OSC (RF005)
O coordenador pode definir `Osc.status` para qualquer valor a qualquer momento via `PATCH /oscs/:id`, com uma restrição:

- **`IN_PROGRESS` → `AVAILABLE`** só é permitido se **não existir** um `Project` ativo (status ∉ `COMPLETED`, `ABANDONED`) apontando pra essa OSC. Se existir, o endpoint retorna `409 Conflict` com a identificação do projeto pendente — o Coordenador precisa fechá-lo primeiro via `PATCH /projects/:id/status`.
- Demais transições (`AVAILABLE` ↔ `BLOCKED`, `IN_PROGRESS` → `BLOCKED`, etc.) são livres.

`Project.oscId` **nunca é zerado**: preserva o histórico de qual OSC cada projeto engajou. O vínculo "qual projeto está ativo numa OSC" é resolvido por consulta (`Project.oscId = X AND status NOT IN ('COMPLETED','ABANDONED')`), com unicidade garantida pelo índice parcial (§5).

### Habilitação de cadastro (RF010)
A rota `POST /auth/sign-up` verifica `AppConfig.signUpEnabled` antes de processar. Se `false`, retorna `403`. O coordenador alterna esse flag via `PATCH /auth/sign-up/toggle`.

### Projetos ativos — dashboard (RF009)
`Project` onde `oscId IS NOT NULL` e `status = IN_PROGRESS`.

### Projetos pendentes de fechamento — dashboard (RF009)
`Project` com `status = IN_PROGRESS` cuja `Team` mais recente (ordenação por `Team.createdAt` desc) pertence a um semestre anterior ao atual. Indica que o Coordenador esqueceu de definir o status final (`COMPLETED` ou `ABANDONED`) ao encerrar o semestre anterior. Exibidos como alerta no dashboard e destacados na tela de gestão de projetos.

## 5. Índices

| Tabela/coluna | Índice | Motivo |
|---|---|---|
| `User.email` | `UNIQUE` | Login por e-mail. |
| `Project.name` | `UNIQUE` | Regra de unicidade de projeto. |
| `Project.oscId` | `UNIQUE` **parcial** — `WHERE status NOT IN ('COMPLETED','ABANDONED')` | No máximo um `Project` ativo por OSC. Requer migration SQL bruta (Prisma schema não expressa unique parcial). |
| `Project.status` | índice | Dashboard e filtros por status. |
| `Team.code` | `UNIQUE` | Entrada em equipe por código. |
| `Team (projectId, createdAt DESC)` | índice composto | Query "Team mais recente de um projeto" (RF009). |
| `Osc.name` | `UNIQUE` | Evita duplicata de OSC. |
| `Osc.status` | índice | Listagem filtrada por status (AVAILABLE para novos projetos). |
| `TeamMember (teamId, userId)` | `PRIMARY KEY` composto | Chave natural da tabela de junção. |
| `TeamMember.userId` | índice | "Equipes das quais o aluno participa". |

Demais índices ficam a cargo do Prisma — chaves estrangeiras já geram índice em Postgres.

## 6. Políticas de `onDelete`

O MVP não expõe deleção via API — OSCs mudam de `status`, usuários permanecem, projetos fecham. Mesmo assim o schema declara explicitamente a política de cada FK:

| FK | Política | Razão |
|---|---|---|
| `Project.oscId → Osc.id` | `Restrict` | OSC não é deletada no MVP (apenas muda status). |
| `Team.projectId → Project.id` | `Restrict` | Projeto não é deletado. |
| `Team.createdBy → User.id` | `Restrict` | Líder não é removido enquanto lidera. |
| `TeamMember.teamId → Team.id` | `Cascade` | Se uma Team for removida manualmente, seus membros vão junto. |
| `TeamMember.userId → User.id` | `Restrict` | Usuário só é removido após revisar vínculos. |
