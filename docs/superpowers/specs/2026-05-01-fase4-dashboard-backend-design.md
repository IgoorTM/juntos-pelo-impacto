# Fase 4 — Dashboard Backend Design

**Date:** 2026-05-01
**Scope:** `DashboardModule` — endpoint único `GET /dashboard` para COORDINATOR (RF009)

---

## 1. Contexto

Fases 0–3 estão implementadas (schema, auth, OSCs, projects, teams). A Fase 4 é o último módulo de backend do MVP: um painel de métricas e alertas operacionais para o coordenador, consumido diretamente pela Fase 6 (frontend do coordenador).

Sem input do usuário, sem mutations — apenas leitura.

---

## 2. Estrutura de arquivos

```
apps/backend/src/dashboard/
├── dtos/
│   └── dashboard-response.dto.ts
├── dashboard.controller.ts
├── dashboard.module.ts
├── dashboard.service.ts
└── dashboard.service.spec.ts
```

Segue o layout dos módulos existentes (`projects/`, `teams/`). O `DashboardModule` é importado no `AppModule`.

---

## 3. Contrato da API

`GET /dashboard` — COORDINATOR only.

Response `200`:
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

Erros: `401` (token ausente/inválido), `403` (role STUDENT).

---

## 4. DTOs

### `SignUpStatusDto`
```ts
enabled: boolean       // @ApiProperty
updatedAt: Date        // @ApiProperty
```

### `DashboardResponseDto`
```ts
totalOscs: number      // @ApiProperty
activeProjects: number // @ApiProperty
blockedOscs: number    // @ApiProperty
availableOscs: number  // @ApiProperty
pendingProjects: number // @ApiProperty
signUp: SignUpStatusDto // @ApiProperty({ type: SignUpStatusDto })
```

Classe aninhada para que o Swagger descreva o shape de `signUp` corretamente.

---

## 5. Controller

Sem lógica de negócio — delega tudo ao service.

Decoradores obrigatórios:
- `@ApiTags('dashboard')`
- `@ApiBearerAuth()`
- `@ApiOperation({ summary: '...' })`
- `@ApiResponse({ status: 200, type: DashboardResponseDto })`
- `@ApiResponse({ status: 401, description: 'Unauthenticated' })`
- `@ApiResponse({ status: 403, description: 'Forbidden' })`
- `@ApiResponse({ status: 500, description: 'AppConfig missing in database' })`
- `@Roles('COORDINATOR')` — guards (`JwtAuthGuard`, `RolesGuard`) são registrados globalmente em `main.ts`; não usar `@UseGuards()` no controller

---

## 6. Service — `getDashboard()`

Seis queries em paralelo via `Promise.all`, sem transaction (leitura pura):

```ts
const currentSemester = getCurrentSemester();

const [totalOscs, activeProjects, blockedOscs, availableOscs, rawProjects, appConfig] =
  await Promise.all([
    prisma.osc.count(),
    prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.osc.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.osc.count({ where: { status: 'AVAILABLE' } }),
    prisma.project.findMany({
      where: { status: 'IN_PROGRESS' },
      include: { teams: { orderBy: { createdAt: 'desc' }, take: 1 } },
    }),
    prisma.appConfig.findFirst(),
  ]);

const pendingProjects = rawProjects.filter(
  p => p.teams.length > 0 && p.teams[0].semester !== currentSemester,
).length;
```

`getCurrentSemester()` vem de `src/common/get-current-semester.ts` (já implementado na Fase 0).

`appConfig` é sempre presente no banco (seed garante a linha). O service pode lançar `InternalServerErrorException` se `appConfig` for nulo (nunca deve ocorrer em produção, mas evita crash silencioso).

---

## 7. Testes (`dashboard.service.spec.ts`)

Apenas o service é testado — nenhuma lógica de negócio no controller.

Mock do `PrismaService`. Três casos:

| Caso | Descrição |
|---|---|
| Caso normal | Projeto `IN_PROGRESS` com equipe de semestre anterior → `pendingProjects = 1` |
| Sem pendentes | Projeto `IN_PROGRESS` com equipe do semestre atual → `pendingProjects = 0` |
| Sem projetos ativos | Nenhum projeto `IN_PROGRESS` → `pendingProjects = 0`, `activeProjects = 0` |

---

## 8. Decisões de design

| Decisão | Escolha | Motivo |
|---|---|---|
| Cálculo de `pendingProjects` | Filtro em JS após `findMany` | Simplicidade; volume MVP não justifica raw SQL |
| Paralelismo | `Promise.all` | Leitura pura, sem necessidade de transaction |
| DTO aninhado para `signUp` | Classe separada `SignUpStatusDto` | Swagger precisa de classe concreta para descrever objetos aninhados |
