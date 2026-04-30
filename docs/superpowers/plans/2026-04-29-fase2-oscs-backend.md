# Fase 2 — OSCs Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `OscsModule` in the NestJS backend exposing 4 endpoints for OSC management (GET /oscs, POST /oscs, GET /oscs/:id, PATCH /oscs/:id).

**Architecture:** Standard NestJS module following the same pattern as `AuthModule`. Service handles all business logic and Prisma interactions; controller handles HTTP wiring and role guards. DTOs use `class-validator` for input validation.

**Tech Stack:** NestJS, Prisma (OscStatus enum), class-validator, @nestjs/testing + jest for tests.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `apps/backend/src/oscs/dtos/create-osc.dto.ts` | Create | Validates POST /oscs body |
| `apps/backend/src/oscs/dtos/update-osc.dto.ts` | Create | Validates PATCH /oscs/:id body (all fields optional) |
| `apps/backend/src/oscs/oscs.service.ts` | Create | Business logic: findAll, create, findOne, update |
| `apps/backend/src/oscs/oscs.service.spec.ts` | Create | Unit tests with mocked PrismaService |
| `apps/backend/src/oscs/oscs.controller.ts` | Create | HTTP routing, role decorators |
| `apps/backend/src/oscs/oscs.module.ts` | Create | Module declaration |
| `apps/backend/src/app.module.ts` | Modify | Register OscsModule |

---

## Task 1: Create DTOs

**Files:**
- Create: `apps/backend/src/oscs/dtos/create-osc.dto.ts`
- Create: `apps/backend/src/oscs/dtos/update-osc.dto.ts`

- [ ] **Step 1: Create `create-osc.dto.ts`**

```typescript
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOscDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
```

- [ ] **Step 2: Create `update-osc.dto.ts`**

```typescript
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OscStatus } from '@prisma/client';

export class UpdateOscDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(OscStatus)
  status?: OscStatus;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/oscs/dtos/create-osc.dto.ts apps/backend/src/oscs/dtos/update-osc.dto.ts
git commit -m "feat(oscs): add CreateOscDto and UpdateOscDto"
```

---

## Task 2: OscsService skeleton + spec setup

**Files:**
- Create: `apps/backend/src/oscs/oscs.service.ts`
- Create: `apps/backend/src/oscs/oscs.service.spec.ts`

- [ ] **Step 1: Create `oscs.service.ts` skeleton**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOscDto } from './dtos/create-osc.dto';
import { UpdateOscDto } from './dtos/update-osc.dto';

@Injectable()
export class OscsService {
  constructor(private prisma: PrismaService) {}

  async findAll(role: string) {
    return [];
  }

  async create(dto: CreateOscDto) {
    return null;
  }

  async findOne(id: string) {
    return null;
  }

  async update(id: string, dto: UpdateOscDto) {
    return null;
  }
}
```

- [ ] **Step 2: Create `oscs.service.spec.ts` with test module setup**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { OscsService } from './oscs.service';
import { PrismaService } from '../prisma/prisma.service';

const mockOsc = {
  id: 'osc-123',
  name: 'OSC Test',
  description: 'A test OSC',
  email: 'osc@test.com',
  phone: null,
  status: 'AVAILABLE' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('OscsService', () => {
  let service: OscsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OscsService,
        {
          provide: PrismaService,
          useValue: {
            osc: {
              findMany: jest.fn(),
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<OscsService>(OscsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

- [ ] **Step 3: Run test to verify setup passes**

Run from the repo root:
```bash
npm run test --workspace @juntos/backend -- --testPathPattern=oscs.service.spec
```

Expected: `PASS` with `OscsService > should be defined`.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/oscs/oscs.service.ts apps/backend/src/oscs/oscs.service.spec.ts
git commit -m "feat(oscs): add OscsService skeleton and spec setup"
```

---

## Task 3: TDD — findAll

**Files:**
- Modify: `apps/backend/src/oscs/oscs.service.spec.ts`
- Modify: `apps/backend/src/oscs/oscs.service.ts`

- [ ] **Step 1: Add failing tests for `findAll`**

Add inside the `describe('OscsService')` block in `oscs.service.spec.ts`, after the `should be defined` test:

```typescript
  describe('findAll', () => {
    it('should return all OSCs for COORDINATOR', async () => {
      jest.spyOn(prisma.osc, 'findMany').mockResolvedValue([mockOsc]);

      const result = await service.findAll('COORDINATOR');

      expect(prisma.osc.findMany).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual([mockOsc]);
    });

    it('should return all OSCs for ADMIN', async () => {
      jest.spyOn(prisma.osc, 'findMany').mockResolvedValue([mockOsc]);

      const result = await service.findAll('ADMIN');

      expect(prisma.osc.findMany).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual([mockOsc]);
    });

    it('should return only AVAILABLE OSCs for STUDENT', async () => {
      jest.spyOn(prisma.osc, 'findMany').mockResolvedValue([mockOsc]);

      const result = await service.findAll('STUDENT');

      expect(prisma.osc.findMany).toHaveBeenCalledWith({ where: { status: 'AVAILABLE' } });
      expect(result).toEqual([mockOsc]);
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test --workspace @juntos/backend -- --testPathPattern=oscs.service.spec
```

Expected: 3 new tests failing (skeleton returns `[]` but assertions check call args).

- [ ] **Step 3: Implement `findAll` in `oscs.service.ts`**

Replace the `findAll` skeleton:

```typescript
  async findAll(role: string) {
    const where = role === 'STUDENT' ? { status: 'AVAILABLE' as const } : {};
    return this.prisma.osc.findMany({ where });
  }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test --workspace @juntos/backend -- --testPathPattern=oscs.service.spec
```

Expected: all 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/oscs/oscs.service.ts apps/backend/src/oscs/oscs.service.spec.ts
git commit -m "feat(oscs): implement and test findAll with role-based filtering"
```

---

## Task 4: TDD — create

**Files:**
- Modify: `apps/backend/src/oscs/oscs.service.spec.ts`
- Modify: `apps/backend/src/oscs/oscs.service.ts`

- [ ] **Step 1: Add failing tests for `create`**

Add after the `findAll` describe block in `oscs.service.spec.ts`. Also add this import at the top of the file:

```typescript
import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
```

Then add the describe block:

```typescript
  describe('create', () => {
    it('should create and return an OSC', async () => {
      jest.spyOn(prisma.osc, 'create').mockResolvedValue(mockOsc);

      const result = await service.create({
        name: 'OSC Test',
        description: 'A test OSC',
        email: 'osc@test.com',
      });

      expect(result).toEqual(mockOsc);
    });

    it('should throw ConflictException when name already exists', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0' },
      );
      jest.spyOn(prisma.osc, 'create').mockRejectedValue(prismaError);

      await expect(
        service.create({ name: 'OSC Test', description: 'A test OSC' }),
      ).rejects.toThrow(ConflictException);
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test --workspace @juntos/backend -- --testPathPattern=oscs.service.spec
```

Expected: 2 new tests failing.

- [ ] **Step 3: Implement `create` in `oscs.service.ts`**

Update the `@nestjs/common` import at the top of `oscs.service.ts` and add the `Prisma` import:

```typescript
import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
```

Replace the `create` skeleton:

```typescript
  async create(dto: CreateOscDto) {
    try {
      return await this.prisma.osc.create({ data: dto });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('OSC name already registered');
      }
      throw e;
    }
  }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test --workspace @juntos/backend -- --testPathPattern=oscs.service.spec
```

Expected: all 6 tests passing.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/oscs/oscs.service.ts apps/backend/src/oscs/oscs.service.spec.ts
git commit -m "feat(oscs): implement and test create with duplicate name guard"
```

---

## Task 5: TDD — findOne

**Files:**
- Modify: `apps/backend/src/oscs/oscs.service.spec.ts`
- Modify: `apps/backend/src/oscs/oscs.service.ts`

- [ ] **Step 1: Add failing tests for `findOne`**

Add after the `create` describe block in `oscs.service.spec.ts`. Update the existing `@nestjs/common` import at the top to include `NotFoundException`:

```typescript
import { ConflictException, NotFoundException } from '@nestjs/common';
```

Add the describe block:

```typescript
  describe('findOne', () => {
    it('should return an OSC by id', async () => {
      jest.spyOn(prisma.osc, 'findUnique').mockResolvedValue(mockOsc);

      const result = await service.findOne('osc-123');

      expect(prisma.osc.findUnique).toHaveBeenCalledWith({ where: { id: 'osc-123' } });
      expect(result).toEqual(mockOsc);
    });

    it('should throw NotFoundException when OSC does not exist', async () => {
      jest.spyOn(prisma.osc, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test --workspace @juntos/backend -- --testPathPattern=oscs.service.spec
```

Expected: 2 new tests failing.

- [ ] **Step 3: Implement `findOne` in `oscs.service.ts`**

Update the `@nestjs/common` import to add `NotFoundException`:

```typescript
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
```

Replace the `findOne` skeleton:

```typescript
  async findOne(id: string) {
    const osc = await this.prisma.osc.findUnique({ where: { id } });
    if (!osc) throw new NotFoundException('OSC not found');
    return osc;
  }
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test --workspace @juntos/backend -- --testPathPattern=oscs.service.spec
```

Expected: all 8 tests passing.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/oscs/oscs.service.ts apps/backend/src/oscs/oscs.service.spec.ts
git commit -m "feat(oscs): implement and test findOne with 404 guard"
```

---

## Task 6: TDD — update

**Files:**
- Modify: `apps/backend/src/oscs/oscs.service.spec.ts`
- Modify: `apps/backend/src/oscs/oscs.service.ts`

- [ ] **Step 1: Add failing tests for `update`**

Add after the `findOne` describe block in `oscs.service.spec.ts`:

```typescript
  describe('update', () => {
    it('should update and return the OSC', async () => {
      const updated = { ...mockOsc, name: 'Updated Name' };
      jest.spyOn(prisma.osc, 'update').mockResolvedValue(updated);

      const result = await service.update('osc-123', { name: 'Updated Name' });

      expect(prisma.osc.update).toHaveBeenCalledWith({
        where: { id: 'osc-123' },
        data: { name: 'Updated Name' },
      });
      expect(result).toEqual(updated);
    });

    it('should throw NotFoundException when OSC does not exist', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        { code: 'P2025', clientVersion: '6.0.0' },
      );
      jest.spyOn(prisma.osc, 'update').mockRejectedValue(prismaError);

      await expect(
        service.update('nonexistent', { status: 'BLOCKED' as const }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when name already exists', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '6.0.0' },
      );
      jest.spyOn(prisma.osc, 'update').mockRejectedValue(prismaError);

      await expect(
        service.update('osc-123', { name: 'Duplicate Name' }),
      ).rejects.toThrow(ConflictException);
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test --workspace @juntos/backend -- --testPathPattern=oscs.service.spec
```

Expected: 3 new tests failing.

- [ ] **Step 3: Implement `update` in `oscs.service.ts`**

Replace the `update` skeleton:

```typescript
  async update(id: string, dto: UpdateOscDto) {
    try {
      return await this.prisma.osc.update({ where: { id }, data: dto });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') throw new NotFoundException('OSC not found');
        if (e.code === 'P2002') throw new ConflictException('OSC name already registered');
      }
      throw e;
    }
  }
```

- [ ] **Step 4: Run all tests to verify everything passes**

```bash
npm run test --workspace @juntos/backend -- --testPathPattern=oscs.service.spec
```

Expected: all 11 tests passing.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/oscs/oscs.service.ts apps/backend/src/oscs/oscs.service.spec.ts
git commit -m "feat(oscs): implement and test update with 404 and duplicate name guards"
```

---

## Task 7: Controller, Module, and AppModule registration

**Files:**
- Create: `apps/backend/src/oscs/oscs.controller.ts`
- Create: `apps/backend/src/oscs/oscs.module.ts`
- Modify: `apps/backend/src/app.module.ts`

- [ ] **Step 1: Create `oscs.controller.ts`**

```typescript
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';
import { OscsService } from './oscs.service';
import { CreateOscDto } from './dtos/create-osc.dto';
import { UpdateOscDto } from './dtos/update-osc.dto';
import { Roles } from '../auth/decorators/roles.decorator';

interface AuthenticatedRequest extends ExpressRequest {
  user: { userId: string; email: string; role: string };
}

@ApiTags('oscs')
@ApiBearerAuth()
@Controller('oscs')
export class OscsController {
  constructor(private oscsService: OscsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista OSCs (STUDENT vê apenas AVAILABLE)' })
  @ApiResponse({ status: 200, description: 'Lista de OSCs' })
  findAll(@Request() req: AuthenticatedRequest) {
    return this.oscsService.findAll(req.user.role);
  }

  @Post()
  @Roles('COORDINATOR')
  @ApiOperation({ summary: 'Cadastra nova OSC (COORDINATOR, ADMIN)' })
  @ApiResponse({ status: 201, description: 'OSC criada' })
  @ApiResponse({ status: 409, description: 'Nome já cadastrado' })
  @ApiResponse({ status: 422, description: 'Validação falhou' })
  create(@Body() dto: CreateOscDto) {
    return this.oscsService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna detalhes de uma OSC' })
  @ApiResponse({ status: 200, description: 'OSC encontrada' })
  @ApiResponse({ status: 404, description: 'Não encontrada' })
  findOne(@Param('id') id: string) {
    return this.oscsService.findOne(id);
  }

  @Patch(':id')
  @Roles('COORDINATOR')
  @ApiOperation({ summary: 'Atualiza dados de uma OSC (COORDINATOR, ADMIN)' })
  @ApiResponse({ status: 200, description: 'OSC atualizada' })
  @ApiResponse({ status: 404, description: 'Não encontrada' })
  @ApiResponse({ status: 409, description: 'Nome já cadastrado' })
  @ApiResponse({ status: 422, description: 'Validação falhou' })
  update(@Param('id') id: string, @Body() dto: UpdateOscDto) {
    return this.oscsService.update(id, dto);
  }
}
```

- [ ] **Step 2: Create `oscs.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { OscsService } from './oscs.service';
import { OscsController } from './oscs.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [OscsService],
  controllers: [OscsController],
  exports: [OscsService],
})
export class OscsModule {}
```

- [ ] **Step 3: Register OscsModule in `app.module.ts`**

Replace the contents of `apps/backend/src/app.module.ts`:

```typescript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { OscsModule } from './oscs/oscs.module';
import { LoggerMiddleware } from './common/logger.middleware';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, OscsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
```

- [ ] **Step 4: Run typecheck**

```bash
npm run typecheck --workspace @juntos/backend
```

Expected: no errors.

- [ ] **Step 5: Run all backend tests**

```bash
npm run test --workspace @juntos/backend
```

Expected: all tests pass (including auth suite).

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/oscs/oscs.controller.ts apps/backend/src/oscs/oscs.module.ts apps/backend/src/app.module.ts
git commit -m "feat(oscs): wire up OscsController, OscsModule and register in AppModule"
```
