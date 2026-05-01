# Fase 4 — Dashboard Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar `DashboardModule` com endpoint `GET /dashboard` (COORDINATOR) que retorna métricas, alertas operacionais e estado do cadastro público.

**Architecture:** `Promise.all` com seis queries paralelas no service; filtro em JS para `pendingProjects`; guards aplicados globalmente via `main.ts` (controller usa apenas `@Roles`). Segue o mesmo layout dos módulos `projects/` e `teams/`.

**Tech Stack:** NestJS, Prisma, Jest (TDD), Swagger (`@nestjs/swagger`)

---

## File Map

| Ação | Arquivo |
|---|---|
| Criar | `apps/backend/src/dashboard/dtos/dashboard-response.dto.ts` |
| Criar | `apps/backend/src/dashboard/dashboard.service.ts` |
| Criar | `apps/backend/src/dashboard/dashboard.service.spec.ts` |
| Criar | `apps/backend/src/dashboard/dashboard.controller.ts` |
| Criar | `apps/backend/src/dashboard/dashboard.module.ts` |
| Modificar | `apps/backend/src/app.module.ts` |

---

## Task 1: DTOs de resposta

**Files:**
- Create: `apps/backend/src/dashboard/dtos/dashboard-response.dto.ts`

DTOs são classes de dados sem lógica — não há teste unitário a escrever aqui.

- [ ] **Step 1: Criar o arquivo de DTOs**

Criar `apps/backend/src/dashboard/dtos/dashboard-response.dto.ts` com o conteúdo:

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class SignUpStatusDto {
  @ApiProperty({ example: true, description: 'Whether public sign-up is enabled' })
  enabled!: boolean;

  @ApiProperty({ example: '2025-03-01T10:00:00.000Z', description: 'Last toggle timestamp' })
  updatedAt!: Date;
}

export class DashboardResponseDto {
  @ApiProperty({ example: 12, description: 'Total number of registered OSCs' })
  totalOscs!: number;

  @ApiProperty({ example: 3, description: 'Projects with status IN_PROGRESS' })
  activeProjects!: number;

  @ApiProperty({ example: 3, description: 'OSCs with status IN_PROGRESS (in use by an active project)' })
  blockedOscs!: number;

  @ApiProperty({ example: 9, description: 'OSCs with status AVAILABLE' })
  availableOscs!: number;

  @ApiProperty({ example: 1, description: 'IN_PROGRESS projects whose latest team belongs to a previous semester' })
  pendingProjects!: number;

  @ApiProperty({ type: SignUpStatusDto, description: 'Current state of public sign-up toggle' })
  signUp!: SignUpStatusDto;
}
```

- [ ] **Step 2: Commit**

```bash
git checkout -b feat/fase4-dashboard
git add apps/backend/src/dashboard/dtos/dashboard-response.dto.ts
git commit -m "feat(dashboard): add response DTOs"
```

---

## Task 2: DashboardService — testes (TDD red phase)

**Files:**
- Create: `apps/backend/src/dashboard/dashboard.service.spec.ts`

- [ ] **Step 1: Criar o arquivo de testes**

Criar `apps/backend/src/dashboard/dashboard.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let module: TestingModule;
  let service: DashboardService;
  let prisma: PrismaService;

  const CURRENT_SEMESTER = (() => {
    const now = new Date();
    const semester = now.getUTCMonth() < 6 ? 1 : 2;
    return `${now.getUTCFullYear()}-${semester}`;
  })();

  const PREVIOUS_SEMESTER = (() => {
    const now = new Date();
    const month = now.getUTCMonth();
    if (month < 6) {
      return `${now.getUTCFullYear() - 1}-2`;
    }
    return `${now.getUTCFullYear()}-1`;
  })();

  const mockAppConfig = {
    id: 1,
    signUpEnabled: false,
    updatedAt: new Date('2025-03-01T10:00:00.000Z'),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: PrismaService,
          useValue: {
            osc: { count: jest.fn() },
            project: { count: jest.fn(), findMany: jest.fn() },
            appConfig: { findFirst: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboard', () => {
    beforeEach(() => {
      jest.spyOn(prisma.osc, 'count').mockResolvedValue(10);
      jest.spyOn(prisma.project, 'count').mockResolvedValue(3);
      jest.spyOn(prisma.appConfig, 'findFirst').mockResolvedValue(mockAppConfig);
    });

    it('returns all metrics and signUp state', async () => {
      jest.spyOn(prisma.project, 'findMany').mockResolvedValue([]);

      const result = await service.getDashboard();

      expect(result.totalOscs).toBe(10);
      expect(result.activeProjects).toBe(3);
      expect(result.signUp.enabled).toBe(false);
      expect(result.signUp.updatedAt).toEqual(mockAppConfig.updatedAt);
    });

    it('counts pendingProjects when latest team semester is before current', async () => {
      jest.spyOn(prisma.project, 'findMany').mockResolvedValue([
        {
          id: 'proj-1',
          name: 'Projeto Antigo',
          oscId: 'osc-1',
          status: 'IN_PROGRESS' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          teams: [
            {
              id: 'team-1',
              projectId: 'proj-1',
              semester: PREVIOUS_SEMESTER,
              code: 'ABCDEF',
              createdBy: 'user-1',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      ] as any);

      const result = await service.getDashboard();

      expect(result.pendingProjects).toBe(1);
    });

    it('does not count as pending when latest team semester is current', async () => {
      jest.spyOn(prisma.project, 'findMany').mockResolvedValue([
        {
          id: 'proj-2',
          name: 'Projeto Atual',
          oscId: 'osc-2',
          status: 'IN_PROGRESS' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          teams: [
            {
              id: 'team-2',
              projectId: 'proj-2',
              semester: CURRENT_SEMESTER,
              code: 'XYZABC',
              createdBy: 'user-1',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        },
      ] as any);

      const result = await service.getDashboard();

      expect(result.pendingProjects).toBe(0);
    });

    it('returns pendingProjects = 0 when there are no IN_PROGRESS projects', async () => {
      jest.spyOn(prisma.project, 'count').mockResolvedValue(0);
      jest.spyOn(prisma.project, 'findMany').mockResolvedValue([]);

      const result = await service.getDashboard();

      expect(result.pendingProjects).toBe(0);
      expect(result.activeProjects).toBe(0);
    });

    it('throws InternalServerErrorException when AppConfig is missing', async () => {
      jest.spyOn(prisma.appConfig, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prisma.project, 'findMany').mockResolvedValue([]);

      await expect(service.getDashboard()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
```

- [ ] **Step 2: Rodar os testes para confirmar que falham**

```bash
cd apps/backend && npx jest --testPathPattern=dashboard.service.spec --no-coverage
```

Esperado: falha com `Cannot find module './dashboard.service'`.

---

## Task 3: DashboardService — implementação (TDD green phase)

**Files:**
- Create: `apps/backend/src/dashboard/dashboard.service.ts`

- [ ] **Step 1: Criar o service**

Criar `apps/backend/src/dashboard/dashboard.service.ts`:

```typescript
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getCurrentSemester } from '../common/get-current-semester';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const currentSemester = getCurrentSemester();

    const [totalOscs, activeProjects, blockedOscs, availableOscs, rawProjects, appConfig] =
      await Promise.all([
        this.prisma.osc.count(),
        this.prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
        this.prisma.osc.count({ where: { status: 'IN_PROGRESS' } }),
        this.prisma.osc.count({ where: { status: 'AVAILABLE' } }),
        this.prisma.project.findMany({
          where: { status: 'IN_PROGRESS' },
          include: {
            teams: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
        }),
        this.prisma.appConfig.findFirst(),
      ]);

    if (!appConfig) {
      throw new InternalServerErrorException('AppConfig not found');
    }

    const pendingProjects = rawProjects.filter(
      (p) => p.teams.length > 0 && p.teams[0].semester !== currentSemester,
    ).length;

    return {
      totalOscs,
      activeProjects,
      blockedOscs,
      availableOscs,
      pendingProjects,
      signUp: {
        enabled: appConfig.signUpEnabled,
        updatedAt: appConfig.updatedAt,
      },
    };
  }
}
```

- [ ] **Step 2: Rodar os testes para confirmar que passam**

```bash
cd apps/backend && npx jest --testPathPattern=dashboard.service.spec --no-coverage
```

Esperado: todos os testes passam (5 passing).

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/dashboard/dashboard.service.ts \
        apps/backend/src/dashboard/dashboard.service.spec.ts
git commit -m "feat(dashboard): add DashboardService with tests"
```

---

## Task 4: Controller, Module e AppModule

**Files:**
- Create: `apps/backend/src/dashboard/dashboard.controller.ts`
- Create: `apps/backend/src/dashboard/dashboard.module.ts`
- Modify: `apps/backend/src/app.module.ts`

`JwtAuthGuard` e `RolesGuard` são globais (registrados em `main.ts`). O controller usa apenas `@Roles('COORDINATOR')`.

- [ ] **Step 1: Criar o controller**

Criar `apps/backend/src/dashboard/dashboard.controller.ts`:

```typescript
import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardResponseDto } from './dtos/dashboard-response.dto';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @Roles('COORDINATOR')
  @ApiOperation({
    summary: 'Painel do coordenador: metricas, alertas e config (COORDINATOR)',
  })
  @ApiResponse({ status: 200, type: DashboardResponseDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getDashboard() {
    return this.dashboardService.getDashboard();
  }
}
```

- [ ] **Step 2: Criar o module**

Criar `apps/backend/src/dashboard/dashboard.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [PrismaModule],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
```

- [ ] **Step 3: Registrar DashboardModule no AppModule**

Editar `apps/backend/src/app.module.ts` — adicionar o import:

```typescript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OscsModule } from './oscs/oscs.module';
import { TeamsModule } from './teams/teams.module';
import { ProjectsModule } from './projects/projects.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { LoggerMiddleware } from './common/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    OscsModule,
    TeamsModule,
    ProjectsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
```

- [ ] **Step 4: Rodar todos os testes para confirmar nenhuma regressão**

```bash
cd apps/backend && npx jest --no-coverage
```

Esperado: todos os testes passam.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/dashboard/dashboard.controller.ts \
        apps/backend/src/dashboard/dashboard.module.ts \
        apps/backend/src/app.module.ts
git commit -m "feat(dashboard): add DashboardController and wire up module"
```

---

## Task 5: Abrir PR

- [ ] **Step 1: Push da branch e abertura do PR**

```bash
git push -u origin feat/fase4-dashboard
gh pr create \
  --title "feat(fase4): add Dashboard module" \
  --body "Implements GET /dashboard (COORDINATOR) returning metrics, operational alerts, and sign-up config state. Closes Fase 4."
```
