# Fase 3 — Projects e Teams (Backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar os endpoints de Projects e Teams conforme o design revisado em `docs/superpowers/specs/2026-04-30-fase3-projects-teams-design.md`, incluindo a simplificacao do enum `ProjectStatus`.

**Architecture:** Dois modulos separados (`ProjectsModule` + `TeamsModule`). `TeamsService` expoe `generateUniqueCode()` (funcao pura) e `joinTeam()`. `ProjectsService` importa `TeamsService` e gerencia a transacao completa de criacao de projeto. Nenhum efeito automatico de status de projeto no status de OSC.

**Tech Stack:** NestJS, Prisma (PostgreSQL), class-validator, class-transformer, Jest (testes unitarios com PrismaService mockado), Swagger.

---

## Mapa de arquivos

**Novos:**
- `apps/backend/src/teams/teams.service.ts`
- `apps/backend/src/teams/teams.service.spec.ts`
- `apps/backend/src/teams/teams.controller.ts`
- `apps/backend/src/teams/teams.module.ts`
- `apps/backend/src/teams/dtos/join-team.dto.ts`
- `apps/backend/src/projects/projects.service.ts`
- `apps/backend/src/projects/projects.service.spec.ts`
- `apps/backend/src/projects/projects.controller.ts`
- `apps/backend/src/projects/projects.module.ts`
- `apps/backend/src/projects/dtos/create-project.dto.ts`
- `apps/backend/src/projects/dtos/update-project-status.dto.ts`

**Modificados:**
- `apps/backend/prisma/schema.prisma` — remove `ONGOING` e `INCOMPLETE` do enum `ProjectStatus`
- `apps/backend/src/app.module.ts` — registra `ProjectsModule` e `TeamsModule`
- `docs/data-model.md` — atualiza enum e remove regras de liberacao automatica de OSC
- `docs/api.md` — atualiza contratos de Projects e Teams
- `docs/rbac.md` — atualiza matriz de permissoes

---

## Task 1: Atualizar schema Prisma e gerar migration

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`

- [ ] **Step 1: Remover ONGOING e INCOMPLETE do enum ProjectStatus**

Em `apps/backend/prisma/schema.prisma`, substituir:

```prisma
enum ProjectStatus {
  IN_PROGRESS
  COMPLETED
  ABANDONED
  INCOMPLETE
  ONGOING
}
```

por:

```prisma
enum ProjectStatus {
  IN_PROGRESS
  COMPLETED
  ABANDONED
}
```

- [ ] **Step 2: Gerar e aplicar a migration**

```bash
cd apps/backend && npx prisma migrate dev --name remove-ongoing-incomplete-from-project-status
```

Esperado: migration criada e aplicada com sucesso. O Prisma vai gerar SQL para remover os valores do enum no PostgreSQL.

- [ ] **Step 3: Verificar que o cliente foi regenerado**

```bash
cd apps/backend && npx prisma generate
```

Esperado: sem erros. O tipo `ProjectStatus` em `@prisma/client` agora so tem `IN_PROGRESS`, `COMPLETED`, `ABANDONED`.

- [ ] **Step 4: Commitar**

```bash
git add apps/backend/prisma/schema.prisma apps/backend/prisma/migrations/
git commit -m "chore: remove ONGOING and INCOMPLETE from ProjectStatus enum"
```

---

## Task 2: TeamsService — generateUniqueCode (TDD)

**Files:**
- Create: `apps/backend/src/teams/teams.service.ts`
- Create: `apps/backend/src/teams/teams.service.spec.ts`

- [ ] **Step 1: Criar o arquivo de teste com o caso de generateUniqueCode**

Criar `apps/backend/src/teams/teams.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TeamsService', () => {
  let service: TeamsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        {
          provide: PrismaService,
          useValue: {
            team: { findUnique: jest.fn() },
            teamMember: { create: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateUniqueCode', () => {
    const VALID_CHARSET = new Set('ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
    const INVALID_CHARS = new Set('IO01');

    it('returns a string of exactly 6 characters', () => {
      expect(service.generateUniqueCode()).toHaveLength(6);
    });

    it('uses only characters from the valid charset', () => {
      for (let i = 0; i < 50; i++) {
        const code = service.generateUniqueCode();
        for (const char of code) {
          expect(VALID_CHARSET.has(char)).toBe(true);
        }
      }
    });

    it('never includes ambiguous characters (I, O, 0, 1)', () => {
      for (let i = 0; i < 50; i++) {
        const code = service.generateUniqueCode();
        for (const char of code) {
          expect(INVALID_CHARS.has(char)).toBe(false);
        }
      }
    });
  });
});
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
cd apps/backend && npx jest src/teams/teams.service.spec.ts --no-coverage
```

Esperado: FAIL — `TeamsService` nao existe.

- [ ] **Step 3: Criar TeamsService com generateUniqueCode**

Criar `apps/backend/src/teams/teams.service.ts`:

```typescript
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  generateUniqueCode(): string {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_CHARSET[Math.floor(Math.random() * CODE_CHARSET.length)];
    }
    return code;
  }
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

```bash
cd apps/backend && npx jest src/teams/teams.service.spec.ts --no-coverage
```

Esperado: PASS (3 testes de generateUniqueCode).

- [ ] **Step 5: Commitar**

```bash
git add apps/backend/src/teams/teams.service.ts apps/backend/src/teams/teams.service.spec.ts
git commit -m "feat(teams): add TeamsService with generateUniqueCode"
```

---

## Task 3: TeamsService — joinTeam (TDD)

**Files:**
- Modify: `apps/backend/src/teams/teams.service.ts`
- Modify: `apps/backend/src/teams/teams.service.spec.ts`

- [ ] **Step 1: Adicionar testes de joinTeam ao spec**

Acrescentar dentro de `describe('TeamsService')` em `apps/backend/src/teams/teams.service.spec.ts`:

```typescript
  describe('joinTeam', () => {
    let prisma: PrismaService;

    const mockTeam = {
      id: 'team-1',
      projectId: 'proj-1',
      semester: '2026-1',
      code: 'ABCDEF',
      createdBy: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      project: { id: 'proj-1', name: 'Projeto Test' },
      members: [
        { user: { id: 'user-2', name: 'Outro Aluno' } },
      ],
    };

    beforeEach(() => {
      prisma = module.get<PrismaService>(PrismaService);
    });

    it('throws NotFoundException when team code does not exist', async () => {
      jest.spyOn(prisma.team, 'findUnique').mockResolvedValue(null);

      await expect(service.joinTeam('user-99', 'XXXXXX')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException when user is already a member', async () => {
      jest.spyOn(prisma.team, 'findUnique').mockResolvedValue(mockTeam as any);
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0' },
      );
      jest.spyOn(prisma.teamMember, 'create').mockRejectedValue(prismaError);

      await expect(service.joinTeam('user-1', 'ABCDEF')).rejects.toThrow(
        ConflictException,
      );
    });

    it('returns team with project and updated members on success', async () => {
      const teamWithNewMember = {
        ...mockTeam,
        members: [
          { user: { id: 'user-2', name: 'Outro Aluno' } },
          { user: { id: 'user-99', name: 'Novo Aluno' } },
        ],
      };
      jest
        .spyOn(prisma.team, 'findUnique')
        .mockResolvedValueOnce(mockTeam as any)
        .mockResolvedValueOnce(teamWithNewMember as any);
      jest.spyOn(prisma.teamMember, 'create').mockResolvedValue({
        teamId: 'team-1',
        userId: 'user-99',
        joinedAt: new Date(),
      });

      const result = await service.joinTeam('user-99', 'ABCDEF');

      expect(result.id).toBe('team-1');
      expect(result.code).toBe('ABCDEF');
      expect(result.project).toEqual({ id: 'proj-1', name: 'Projeto Test' });
      expect(result.members).toHaveLength(2);
      expect(result.members).toContainEqual({ id: 'user-99', name: 'Novo Aluno' });
    });
  });
```

Adicionar a declaracao `let module: TestingModule;` antes de `let service: TeamsService;` e ajustar o `beforeEach` para armazenar o modulo:

```typescript
let module: TestingModule;
let service: TeamsService;

beforeEach(async () => {
  module = await Test.createTestingModule({
    providers: [
      TeamsService,
      {
        provide: PrismaService,
        useValue: {
          team: { findUnique: jest.fn() },
          teamMember: { create: jest.fn() },
        },
      },
    ],
  }).compile();

  service = module.get<TeamsService>(TeamsService);
});
```

- [ ] **Step 2: Rodar os novos testes e confirmar que falham**

```bash
cd apps/backend && npx jest src/teams/teams.service.spec.ts --no-coverage
```

Esperado: FAIL — `joinTeam` nao existe.

- [ ] **Step 3: Implementar joinTeam em TeamsService**

Adicionar o metodo em `apps/backend/src/teams/teams.service.ts` (apos `generateUniqueCode`):

```typescript
  async joinTeam(userId: string, code: string) {
    const team = await this.prisma.team.findUnique({
      where: { code },
      include: {
        project: { select: { id: true, name: true } },
        members: { include: { user: { select: { id: true, name: true } } } },
      },
    });
    if (!team) throw new NotFoundException('Team not found');

    try {
      await this.prisma.teamMember.create({ data: { teamId: team.id, userId } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Already a member of this team');
      }
      throw e;
    }

    const updated = await this.prisma.team.findUnique({
      where: { id: team.id },
      include: {
        project: { select: { id: true, name: true } },
        members: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    return {
      id: updated.id,
      semester: updated.semester,
      code: updated.code,
      project: updated.project,
      members: updated.members.map((m) => ({ id: m.user.id, name: m.user.name })),
    };
  }
```

- [ ] **Step 4: Rodar todos os testes e confirmar que passam**

```bash
cd apps/backend && npx jest src/teams/teams.service.spec.ts --no-coverage
```

Esperado: PASS (6 testes).

- [ ] **Step 5: Commitar**

```bash
git add apps/backend/src/teams/teams.service.ts apps/backend/src/teams/teams.service.spec.ts
git commit -m "feat(teams): add joinTeam to TeamsService"
```

---

## Task 4: JoinTeamDto + TeamsController + TeamsModule

**Files:**
- Create: `apps/backend/src/teams/dtos/join-team.dto.ts`
- Create: `apps/backend/src/teams/teams.controller.ts`
- Create: `apps/backend/src/teams/teams.module.ts`

- [ ] **Step 1: Criar JoinTeamDto**

Criar `apps/backend/src/teams/dtos/join-team.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class JoinTeamDto {
  @ApiProperty({
    example: 'ABCDEF',
    description: 'Team code — 6 characters, charset A-Z (no I/O) and 2-9 (no 0/1)',
  })
  @IsString()
  @Length(6, 6)
  code: string;
}
```

- [ ] **Step 2: Criar TeamsController**

Criar `apps/backend/src/teams/teams.controller.ts`:

```typescript
import { Body, Controller, Post, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { TeamsService } from './teams.service';
import { JoinTeamDto } from './dtos/join-team.dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string; role: string };
}

@ApiTags('teams')
@ApiBearerAuth()
@Controller('teams')
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Post('join')
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Aluno entra em equipe existente pelo codigo de 6 caracteres' })
  @ApiResponse({ status: 200, description: 'Entrada na equipe realizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Equipe nao encontrada' })
  @ApiResponse({ status: 409, description: 'Aluno ja e membro desta equipe' })
  @ApiResponse({ status: 422, description: 'Validacao falhou' })
  joinTeam(
    @Request() req: AuthenticatedRequest,
    @Body() dto: JoinTeamDto,
  ) {
    return this.teamsService.joinTeam(req.user.userId, dto.code);
  }
}
```

- [ ] **Step 3: Criar TeamsModule**

Criar `apps/backend/src/teams/teams.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';

@Module({
  imports: [PrismaModule],
  providers: [TeamsService],
  controllers: [TeamsController],
  exports: [TeamsService],
})
export class TeamsModule {}
```

- [ ] **Step 4: Commitar**

```bash
git add apps/backend/src/teams/
git commit -m "feat(teams): add TeamsController and TeamsModule"
```

---

## Task 5: ProjectsService — create (TDD)

**Files:**
- Create: `apps/backend/src/projects/projects.service.ts`
- Create: `apps/backend/src/projects/projects.service.spec.ts`

- [ ] **Step 1: Criar o spec com testes de create**

Criar `apps/backend/src/projects/projects.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';
import { TeamsService } from '../teams/teams.service';

describe('ProjectsService', () => {
  let module: TestingModule;
  let service: ProjectsService;
  let prisma: PrismaService;
  let teamsService: TeamsService;

  const mockOsc = {
    id: 'osc-1',
    name: 'OSC Test',
    description: 'Desc',
    email: null,
    phone: null,
    status: 'AVAILABLE' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProject = {
    id: 'proj-1',
    name: 'Projeto Test',
    oscId: 'osc-1',
    status: 'IN_PROGRESS' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTeam = {
    id: 'team-1',
    projectId: 'proj-1',
    semester: '2026-1',
    code: 'ABCDEF',
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreator = {
    id: 'user-1',
    name: 'Aluno Test',
    email: 'aluno@test.com',
    role: 'STUDENT' as const,
    passwordHash: 'hash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        ProjectsService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn() },
            osc: { findUnique: jest.fn(), update: jest.fn() },
            project: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            team: { create: jest.fn() },
            teamMember: { create: jest.fn() },
            $transaction: jest.fn(),
          },
        },
        {
          provide: TeamsService,
          useValue: { generateUniqueCode: jest.fn().mockReturnValue('ABCDEF') },
        },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = module.get<PrismaService>(PrismaService);
    teamsService = module.get<TeamsService>(TeamsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    beforeEach(() => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockCreator);
      (prisma.$transaction as jest.Mock).mockImplementation((fn) => fn(prisma));
    });

    it('throws NotFoundException when OSC does not exist', async () => {
      jest.spyOn(prisma.osc, 'findUnique').mockResolvedValue(null);

      await expect(
        service.create('user-1', { name: 'Proj', oscId: 'osc-1' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when OSC is not AVAILABLE', async () => {
      jest
        .spyOn(prisma.osc, 'findUnique')
        .mockResolvedValue({ ...mockOsc, status: 'IN_PROGRESS' as const });

      await expect(
        service.create('user-1', { name: 'Proj', oscId: 'osc-1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when project name is already registered', async () => {
      jest.spyOn(prisma.osc, 'findUnique').mockResolvedValue(mockOsc);
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0', meta: { target: ['name'] } },
      );
      jest.spyOn(prisma.project, 'create').mockRejectedValue(prismaError);

      await expect(
        service.create('user-1', { name: 'Duplicado', oscId: 'osc-1' }),
      ).rejects.toThrow(ConflictException);
    });

    it('returns created project with osc, team, and creator as member on success', async () => {
      jest.spyOn(prisma.osc, 'findUnique').mockResolvedValue(mockOsc);
      jest.spyOn(prisma.project, 'create').mockResolvedValue(mockProject);
      jest.spyOn(prisma.team, 'create').mockResolvedValue(mockTeam);
      jest
        .spyOn(prisma.teamMember, 'create')
        .mockResolvedValue({ teamId: 'team-1', userId: 'user-1', joinedAt: new Date() });
      jest
        .spyOn(prisma.osc, 'update')
        .mockResolvedValue({ ...mockOsc, status: 'IN_PROGRESS' as const });

      const result = await service.create('user-1', {
        name: 'Projeto Test',
        oscId: 'osc-1',
      });

      expect(result.id).toBe('proj-1');
      expect(result.status).toBe('IN_PROGRESS');
      expect(result.osc).toEqual({ id: 'osc-1', name: 'OSC Test' });
      expect(result.teams).toHaveLength(1);
      expect(result.teams[0].code).toBe('ABCDEF');
      expect(result.teams[0].members).toEqual([
        { id: 'user-1', name: 'Aluno Test' },
      ]);
    });
  });
});
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
cd apps/backend && npx jest src/projects/projects.service.spec.ts --no-coverage
```

Esperado: FAIL — `ProjectsService` nao existe.

- [ ] **Step 3: Criar ProjectsService com o metodo create**

Criar `apps/backend/src/projects/projects.service.ts`:

```typescript
import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TeamsService } from '../teams/teams.service';
import { getCurrentSemester } from '../common/get-current-semester';
import { CreateProjectDto } from './dtos/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private teamsService: TeamsService,
  ) {}

  async create(userId: string, dto: CreateProjectDto) {
    const MAX_CODE_ATTEMPTS = 5;

    const creator = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    });

    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const code = this.teamsService.generateUniqueCode();
      const semester = getCurrentSemester();

      try {
        return await this.prisma.$transaction(async (tx) => {
          const osc = await tx.osc.findUnique({ where: { id: dto.oscId } });
          if (!osc) throw new NotFoundException('OSC not found');
          if (osc.status !== 'AVAILABLE') {
            throw new ConflictException('OSC is not available');
          }

          const project = await tx.project.create({
            data: { name: dto.name, oscId: dto.oscId },
          });

          const team = await tx.team.create({
            data: {
              projectId: project.id,
              semester,
              code,
              createdBy: userId,
            },
          });

          await tx.teamMember.create({ data: { teamId: team.id, userId } });
          await tx.osc.update({
            where: { id: dto.oscId },
            data: { status: 'IN_PROGRESS' },
          });

          return {
            id: project.id,
            name: project.name,
            status: project.status,
            osc: { id: osc.id, name: osc.name },
            teams: [
              {
                id: team.id,
                semester: team.semester,
                code: team.code,
                members: [{ id: creator.id, name: creator.name }],
              },
            ],
          };
        });
      } catch (e) {
        if (e instanceof NotFoundException || e instanceof ConflictException) {
          throw e;
        }
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          const targets = ([] as string[]).concat(
            (e.meta?.target as string | string[]) ?? [],
          );
          if (targets.some((t) => t.includes('code'))) {
            continue;
          }
          throw new ConflictException('Project name already registered');
        }
        throw e;
      }
    }

    throw new InternalServerErrorException(
      'Failed to generate a unique team code',
    );
  }
}
```

- [ ] **Step 4: Criar CreateProjectDto (necessario para compilar)**

Criar `apps/backend/src/projects/dtos/create-project.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Projeto Solidario 2026-1', description: 'Project name (must be unique)' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'cuid-da-osc', description: 'ID of the OSC (must be AVAILABLE)' })
  @IsString()
  @IsNotEmpty()
  oscId: string;
}
```

- [ ] **Step 5: Rodar testes e confirmar que passam**

```bash
cd apps/backend && npx jest src/projects/projects.service.spec.ts --no-coverage
```

Esperado: PASS (4 testes de create).

- [ ] **Step 6: Commitar**

```bash
git add apps/backend/src/projects/
git commit -m "feat(projects): add ProjectsService with create and CreateProjectDto"
```

---

## Task 6: ProjectsService — findAll, findOne, updateStatus (TDD)

**Files:**
- Modify: `apps/backend/src/projects/projects.service.ts`
- Modify: `apps/backend/src/projects/projects.service.spec.ts`
- Create: `apps/backend/src/projects/dtos/update-project-status.dto.ts`

- [ ] **Step 1: Criar UpdateProjectStatusDto**

Criar `apps/backend/src/projects/dtos/update-project-status.dto.ts`:

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class UpdateProjectStatusDto {
  @ApiProperty({
    enum: ProjectStatus,
    description: 'New status for the project',
  })
  @IsEnum(ProjectStatus)
  status: ProjectStatus;
}
```

- [ ] **Step 2: Adicionar testes de findAll, findOne e updateStatus ao spec**

Acrescentar dentro de `describe('ProjectsService')` em `apps/backend/src/projects/projects.service.spec.ts`:

```typescript
  const mockProjectFull = {
    id: 'proj-1',
    name: 'Projeto Test',
    oscId: 'osc-1',
    status: 'IN_PROGRESS' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    osc: { id: 'osc-1', name: 'OSC Test' },
    teams: [
      {
        id: 'team-1',
        semester: '2026-1',
        code: 'ABCDEF',
        createdBy: 'user-1',
        projectId: 'proj-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [{ user: { id: 'user-1', name: 'Aluno Test' } }],
      },
    ],
  };

  describe('findAll', () => {
    it('returns all projects with osc, teams and members', async () => {
      jest.spyOn(prisma.project, 'findMany').mockResolvedValue([mockProjectFull] as any);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(result[0].osc).toEqual({ id: 'osc-1', name: 'OSC Test' });
      expect(result[0].teams[0].members).toEqual([{ id: 'user-1', name: 'Aluno Test' }]);
    });
  });

  describe('findOne', () => {
    it('returns a project by id', async () => {
      jest.spyOn(prisma.project, 'findUnique').mockResolvedValue(mockProjectFull as any);

      const result = await service.findOne('proj-1');

      expect(result.id).toBe('proj-1');
      expect(result.teams[0].code).toBe('ABCDEF');
    });

    it('throws NotFoundException when project does not exist', async () => {
      jest.spyOn(prisma.project, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('updates and returns the project', async () => {
      const updated = { ...mockProjectFull, status: 'COMPLETED' as const };
      jest.spyOn(prisma.project, 'update').mockResolvedValue(updated as any);

      const result = await service.updateStatus('proj-1', 'COMPLETED' as any);

      expect(result.status).toBe('COMPLETED');
    });

    it('throws NotFoundException when project does not exist', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '6.0.0' },
      );
      jest.spyOn(prisma.project, 'update').mockRejectedValue(prismaError);

      await expect(service.updateStatus('nope', 'COMPLETED' as any)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException on partial unique index violation', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0' },
      );
      jest.spyOn(prisma.project, 'update').mockRejectedValue(prismaError);

      await expect(
        service.updateStatus('proj-1', 'IN_PROGRESS' as any),
      ).rejects.toThrow(ConflictException);
    });
  });
```

- [ ] **Step 3: Rodar e confirmar que os novos testes falham**

```bash
cd apps/backend && npx jest src/projects/projects.service.spec.ts --no-coverage
```

Esperado: FAIL — `findAll`, `findOne`, `updateStatus` nao existem.

- [ ] **Step 4: Implementar findAll, findOne, updateStatus em ProjectsService**

Adicionar os metodos em `apps/backend/src/projects/projects.service.ts` (apos o construtor e antes de `create`, ou ao final da classe):

```typescript
  private readonly projectInclude = {
    osc: { select: { id: true, name: true } },
    teams: {
      orderBy: { createdAt: 'desc' as const },
      include: {
        members: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    },
  } as const;

  private mapProject(project: any) {
    return {
      id: project.id,
      name: project.name,
      status: project.status,
      osc: project.osc,
      teams: project.teams.map((team: any) => ({
        id: team.id,
        semester: team.semester,
        code: team.code,
        members: team.members.map((m: any) => ({
          id: m.user.id,
          name: m.user.name,
        })),
      })),
    };
  }

  async findAll() {
    const projects = await this.prisma.project.findMany({
      include: this.projectInclude,
    });
    return projects.map((p) => this.mapProject(p));
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: this.projectInclude,
    });
    if (!project) throw new NotFoundException('Project not found');
    return this.mapProject(project);
  }

  async updateStatus(id: string, status: ProjectStatus) {
    try {
      const project = await this.prisma.project.update({
        where: { id },
        data: { status },
        include: this.projectInclude,
      });
      return this.mapProject(project);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') throw new NotFoundException('Project not found');
        if (e.code === 'P2002') {
          throw new ConflictException(
            'Status conflict: another active project already occupies this OSC',
          );
        }
      }
      throw e;
    }
  }
```

Tambem adicionar `ProjectStatus` ao import do Prisma no topo do arquivo:

```typescript
import { Prisma, ProjectStatus } from '@prisma/client';
```

- [ ] **Step 5: Rodar todos os testes do service e confirmar que passam**

```bash
cd apps/backend && npx jest src/projects/projects.service.spec.ts --no-coverage
```

Esperado: PASS (9 testes no total).

- [ ] **Step 6: Commitar**

```bash
git add apps/backend/src/projects/
git commit -m "feat(projects): add findAll, findOne, updateStatus to ProjectsService"
```

---

## Task 7: ProjectsController + ProjectsModule

**Files:**
- Create: `apps/backend/src/projects/projects.controller.ts`
- Create: `apps/backend/src/projects/projects.module.ts`

- [ ] **Step 1: Criar ProjectsController**

Criar `apps/backend/src/projects/projects.controller.ts`:

```typescript
import { Body, Controller, Get, Param, Patch, Post, Request } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dtos/create-project.dto';
import { UpdateProjectStatusDto } from './dtos/update-project-status.dto';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string; role: string };
}

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @Roles('STUDENT')
  @ApiOperation({ summary: 'Cria projeto com equipe do semestre atual (STUDENT)' })
  @ApiResponse({ status: 201, description: 'Projeto criado com sucesso' })
  @ApiResponse({ status: 404, description: 'OSC nao encontrada' })
  @ApiResponse({ status: 409, description: 'OSC nao disponivel ou nome duplicado' })
  @ApiResponse({ status: 422, description: 'Validacao falhou' })
  create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(req.user.userId, dto);
  }

  @Get()
  @Roles('COORDINATOR')
  @ApiOperation({ summary: 'Lista todos os projetos (COORDINATOR)' })
  @ApiResponse({ status: 200, description: 'Lista de projetos' })
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna detalhe de um projeto (autenticado)' })
  @ApiResponse({ status: 200, description: 'Projeto encontrado' })
  @ApiResponse({ status: 404, description: 'Nao encontrado' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id/status')
  @Roles('COORDINATOR')
  @ApiOperation({ summary: 'Define status do projeto (COORDINATOR)' })
  @ApiResponse({ status: 200, description: 'Status atualizado' })
  @ApiResponse({ status: 404, description: 'Projeto nao encontrado' })
  @ApiResponse({ status: 409, description: 'Conflito de unicidade parcial' })
  @ApiResponse({ status: 422, description: 'Validacao falhou' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProjectStatusDto,
  ) {
    return this.projectsService.updateStatus(id, dto.status);
  }
}
```

- [ ] **Step 2: Criar ProjectsModule**

Criar `apps/backend/src/projects/projects.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TeamsModule } from '../teams/teams.module';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

@Module({
  imports: [PrismaModule, TeamsModule],
  providers: [ProjectsService],
  controllers: [ProjectsController],
})
export class ProjectsModule {}
```

- [ ] **Step 3: Commitar**

```bash
git add apps/backend/src/projects/projects.controller.ts apps/backend/src/projects/projects.module.ts
git commit -m "feat(projects): add ProjectsController and ProjectsModule"
```

---

## Task 8: Registrar modulos no AppModule

**Files:**
- Modify: `apps/backend/src/app.module.ts`

- [ ] **Step 1: Adicionar ProjectsModule e TeamsModule ao AppModule**

Substituir o conteudo de `apps/backend/src/app.module.ts`:

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
import { LoggerMiddleware } from './common/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    OscsModule,
    TeamsModule,
    ProjectsModule,
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

- [ ] **Step 2: Rodar todos os testes do workspace para confirmar que nada quebrou**

```bash
npm run test --workspace @juntos/backend
```

Esperado: todos os testes passam (auth, oscs, teams, projects).

- [ ] **Step 3: Commitar**

```bash
git add apps/backend/src/app.module.ts
git commit -m "feat: register TeamsModule and ProjectsModule in AppModule"
```

---

## Task 9: Atualizar documentacao

**Files:**
- Modify: `docs/data-model.md`
- Modify: `docs/api.md`
- Modify: `docs/rbac.md`

- [ ] **Step 1: Atualizar docs/data-model.md**

Na secao `## 2. Enums`, substituir o bloco de `ProjectStatus`:

```
ProjectStatus
  IN_PROGRESS  — projeto ativo no semestre atual
  COMPLETED    — concluido com sucesso
  ABANDONED    — abandonado pela equipe
```

Na secao `## 4. Regras de negocio derivadas do modelo`, subsecao "Impacto do ProjectStatus na OSC (RF014)", substituir a tabela por:

```
| ProjectStatus | Acao na OSC |
|---|---|
| `IN_PROGRESS` | Sem acao automatica |
| `COMPLETED` | Sem acao automatica |
| `ABANDONED` | Sem acao automatica |
```

E adicionar apos a tabela:

```
O coordenador gerencia o status da OSC manualmente via `PATCH /oscs/:id`, de forma independente do status do projeto. A unica operacao que altera o status da OSC automaticamente e `POST /projects`, que seta `Osc.status = IN_PROGRESS` ao criar um projeto.
```

Remover a subsecao "Projetos ativos — dashboard (RF009)" e "Projetos pendentes de fechamento — dashboard (RF009)" as referencias a ONGOING/INCOMPLETE.

- [ ] **Step 2: Atualizar docs/api.md — secao Projects**

- `GET /projects`: remover mencao a STUDENT e regra A ∪ B. Anotar: **COORDINATOR.**
- `GET /projects/:id`: mudar de **COORDINATOR** para **Autenticado.** Remover restricao de visibilidade do STUDENT.
- Remover completamente o endpoint `POST /projects/:id/continue`.
- `PATCH /projects/:id/status`: atualizar o request para aceitar apenas `IN_PROGRESS | COMPLETED | ABANDONED`. Remover mencao a ONGOING/INCOMPLETE na tabela de impacto na OSC.
- No response de `GET /projects` e `POST /projects`, remover `INCOMPLETE` e `ONGOING` dos valores de `status`.

- [ ] **Step 3: Atualizar docs/rbac.md — secao Projects**

Substituir a tabela de Projects:

```markdown
| Rota | Metodo | Coordenador | Aluno | Observacao |
|---|---|---|---|---|
| `/projects` | `GET` | Todos os projetos | Nao tem acesso | |
| `/projects/:id` | `GET` | Sim | Sim | Qualquer usuario autenticado |
| `/projects` | `POST` | Nao | Sim | Body `{ name, oscId }` com OSC `AVAILABLE`. Cria Project + Team e move `Osc.status -> IN_PROGRESS` em transacao |
| `/projects/:id/status` | `PATCH` | Sim | Nao | Define status: `IN_PROGRESS`, `COMPLETED` ou `ABANDONED`. Sem efeito automatico na OSC |
```

- [ ] **Step 4: Commitar documentacao**

```bash
git add docs/data-model.md docs/api.md docs/rbac.md
git commit -m "docs: update data-model, api, and rbac to reflect Fase 3 design decisions"
```

---

## Self-Review

**Cobertura do spec:**

| Requisito | Task |
|---|---|
| Remover ONGOING/INCOMPLETE do enum | Task 1 |
| `TeamsService.generateUniqueCode()` pura com charset correto | Task 2 |
| `POST /teams/join` com 404 e 409 | Task 3 + 4 |
| `POST /projects` em transacao com retry em code collision | Task 5 |
| `GET /projects` (COORDINATOR) | Task 6 + 7 |
| `GET /projects/:id` (autenticado) | Task 6 + 7 |
| `PATCH /projects/:id/status` sem efeito automatico na OSC | Task 6 + 7 |
| Swagger em todos os endpoints | Tasks 4 e 7 |
| Testes unitarios para TeamsService | Tasks 2 e 3 |
| Testes unitarios para ProjectsService | Tasks 5 e 6 |
| Docs atualizados | Task 9 |

**Checagem de consistencia de tipos:**
- `ProjectStatus` importado de `@prisma/client` em `UpdateProjectStatusDto` e `ProjectsService` — consistente apos Task 1 regenerar o cliente.
- `mapProject` usa `any` como parametro — aceitavel dado que Prisma inference com `include` aninhado e verbosa; nenhum risco de runtime.
- `generateUniqueCode()` retorna `string` — usado em `ProjectsService.create()` como `code` string — consistente.
- Response de `POST /projects` e response de `GET /projects` tem o mesmo shape — ambos usam `mapProject` ou construcao manual equivalente.
