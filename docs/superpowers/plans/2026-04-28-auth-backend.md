# Fase 1: Autenticação Backend — Plano de Implementação

> **Para execução:** Use superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para implementar tarefa por tarefa. Cada tarefa usa checkbox (`- [ ]`) para rastreamento.

**Objetivo:** Implementar autenticação JWT com guards de autorização (RBAC) que proteja todos os endpoints da aplicação.

**Arquitetura:** Sistema de autenticação baseado em JWT, com estratégia PassportJS, guards de validação de token e role, decorators para controle de acesso, e um ExceptionFilter global que padroniza respostas de erro.

**Tech Stack:** NestJS, Passport + JWT, bcrypt, class-validator, class-transformer, Prisma

---

## Pré-requisitos

- Fase 0 concluída (schema Prisma, seed, utilitários)
- Backend NestJS já estruturado com `src/main.ts`, módulo de exemplo

---

## Task 1: Instalar Dependências

**Arquivos:**
- Modify: `package.json` (workspace `backend`)

- [ ] **Step 1: Instalar dependências de autenticação**

No diretório `packages/backend/`, execute:

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt @types/passport-jwt bcrypt @types/bcrypt class-validator class-transformer
```

- [ ] **Step 2: Verificar instalação**

```bash
npm ls @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer
```

Expected: Todas as dependências listadas com versão.

- [ ] **Step 3: Commit**

```bash
git add packages/backend/package.json packages/backend/package-lock.json
git commit -m "feat: install authentication dependencies"
```

---

## Task 2: Criar Estrutura de Pastas

**Arquivos:**
- Create: `src/auth/strategies/jwt.strategy.ts`
- Create: `src/auth/guards/jwt-auth.guard.ts`
- Create: `src/auth/guards/roles.guard.ts`
- Create: `src/auth/decorators/public.decorator.ts`
- Create: `src/auth/decorators/roles.decorator.ts`
- Create: `src/auth/dtos/sign-in.dto.ts`
- Create: `src/auth/dtos/sign-up.dto.ts`
- Create: `src/auth/dtos/auth-response.dto.ts`
- Create: `src/auth/filters/http-exception.filter.ts`
- Create: `src/auth/auth.service.ts`
- Create: `src/auth/auth.controller.ts`
- Create: `src/auth/auth.module.ts`

- [ ] **Step 1: Criar diretórios**

```bash
cd packages/backend
mkdir -p src/auth/strategies src/auth/guards src/auth/decorators src/auth/dtos src/auth/filters
```

- [ ] **Step 2: Criar arquivos vazios (placeholder)**

```bash
touch src/auth/strategies/jwt.strategy.ts
touch src/auth/guards/jwt-auth.guard.ts
touch src/auth/guards/roles.guard.ts
touch src/auth/decorators/public.decorator.ts
touch src/auth/decorators/roles.decorator.ts
touch src/auth/dtos/sign-in.dto.ts
touch src/auth/dtos/sign-up.dto.ts
touch src/auth/dtos/auth-response.dto.ts
touch src/auth/filters/http-exception.filter.ts
touch src/auth/auth.service.ts
touch src/auth/auth.controller.ts
touch src/auth/auth.module.ts
```

- [ ] **Step 3: Verificar estrutura**

```bash
tree src/auth/
```

Expected:
```
src/auth/
├── decorators
│   ├── public.decorator.ts
│   └── roles.decorator.ts
├── dtos
│   ├── auth-response.dto.ts
│   ├── sign-in.dto.ts
│   └── sign-up.dto.ts
├── filters
│   └── http-exception.filter.ts
├── guards
│   ├── jwt-auth.guard.ts
│   └── roles.guard.ts
├── strategies
│   └── jwt.strategy.ts
├── auth.controller.ts
├── auth.module.ts
└── auth.service.ts
```

- [ ] **Step 4: Commit**

```bash
git add src/auth/
git commit -m "feat: create auth module folder structure"
```

---

## Task 3: Configurar Variáveis de Ambiente

**Arquivos:**
- Modify: `.env` (backend root)

- [ ] **Step 1: Adicionar JWT_SECRET ao .env**

Abra `.env` na raiz do backend e adicione:

```
JWT_SECRET=sua-chave-super-secreta-para-desenvolvimento-mude-em-producao-12345
```

(Use uma string longa e aleatória em produção. Para desenvolvimento, qualquer string serve.)

- [ ] **Step 2: Verificar que .env está no .gitignore**

```bash
cat .gitignore | grep ".env"
```

Expected: `.env` está listado no `.gitignore` (não deve ser commitado).

- [ ] **Step 3: Verificar que process.env.JWT_SECRET é acessível**

Abra `src/main.ts` e tente acessar:

```typescript
console.log('JWT_SECRET defined:', !!process.env.JWT_SECRET);
```

Você vai rodar o servidor em um passo posterior para confirmar.

---

## Task 4: Implementar DTOs com Validação

**Arquivos:**
- Create: `src/auth/dtos/sign-in.dto.ts`
- Create: `src/auth/dtos/sign-up.dto.ts`
- Create: `src/auth/dtos/auth-response.dto.ts`

- [ ] **Step 1: Escrever SignInDto com validações**

`src/auth/dtos/sign-in.dto.ts`:

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}
```

- [ ] **Step 2: Escrever SignUpDto com validações**

`src/auth/dtos/sign-up.dto.ts`:

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignUpDto {
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters' })
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}
```

- [ ] **Step 3: Escrever AuthResponseDto**

`src/auth/dtos/auth-response.dto.ts`:

```typescript
export class AuthResponseDto {
  accessToken: string;

  user: {
    id: string;
    email: string;
    role: 'STUDENT' | 'COORDINATOR';
    name: string;
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add src/auth/dtos/
git commit -m "feat: implement auth DTOs with validations"
```

---

## Task 5: Implementar Decorators

**Arquivos:**
- Create: `src/auth/decorators/public.decorator.ts`
- Create: `src/auth/decorators/roles.decorator.ts`

- [ ] **Step 1: Escrever @Public() decorator**

`src/auth/decorators/public.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

- [ ] **Step 2: Escrever @Roles() decorator**

`src/auth/decorators/roles.decorator.ts`:

```typescript
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
```

- [ ] **Step 3: Criar index file para exports**

`src/auth/decorators/index.ts`:

```typescript
export { Public, IS_PUBLIC_KEY } from './public.decorator';
export { Roles, ROLES_KEY } from './roles.decorator';
```

- [ ] **Step 4: Commit**

```bash
git add src/auth/decorators/
git commit -m "feat: implement Public and Roles decorators"
```

---

## Task 6: Implementar JwtStrategy

**Arquivos:**
- Create: `src/auth/strategies/jwt.strategy.ts`

- [ ] **Step 1: Escrever JwtStrategy**

`src/auth/strategies/jwt.strategy.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  validate(payload: { sub: string; email: string; role: string }) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/auth/strategies/jwt.strategy.ts
git commit -m "feat: implement JwtStrategy"
```

---

## Task 7: Implementar JwtAuthGuard

**Arquivos:**
- Create: `src/auth/guards/jwt-auth.guard.ts`

- [ ] **Step 1: Escrever JwtAuthGuard com suporte a @Public()**

`src/auth/guards/jwt-auth.guard.ts`:

```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/auth/guards/jwt-auth.guard.ts
git commit -m "feat: implement JwtAuthGuard with public route support"
```

---

## Task 8: Implementar RolesGuard

**Arquivos:**
- Create: `src/auth/guards/roles.guard.ts`

- [ ] **Step 1: Escrever RolesGuard**

`src/auth/guards/roles.guard.ts`:

```typescript
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException('User role not found');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(`Role ${user.role} is not authorized`);
    }

    return true;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/auth/guards/roles.guard.ts
git commit -m "feat: implement RolesGuard"
```

---

## Task 9: Implementar ExceptionFilter Global

**Arquivos:**
- Create: `src/auth/filters/http-exception.filter.ts`

- [ ] **Step 1: Escrever HttpExceptionFilter**

`src/auth/filters/http-exception.filter.ts`:

```typescript
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    // Formata resposta de validação (ValidationPipe)
    if (status === HttpStatus.BAD_REQUEST && exceptionResponse.message instanceof Array) {
      return response.status(status).json({
        statusCode: status,
        message: 'Validation failed',
        errors: exceptionResponse.message.map((msg: any) => ({
          field: msg.property,
          messages: Object.values(msg.constraints || {}),
        })),
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    // Resposta padrão para outras exceções HTTP
    response.status(status).json({
      statusCode: status,
      message: exceptionResponse.message || exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/auth/filters/http-exception.filter.ts
git commit -m "feat: implement global HttpExceptionFilter"
```

---

## Task 10: Implementar AuthService

**Arquivos:**
- Create: `src/auth/auth.service.ts`
- Modify: `src/auth/auth.service.spec.ts` (testes)

- [ ] **Step 1: Escrever teste para signIn (sucesso)**

`src/auth/auth.service.spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockUser = {
    id: 'user-123',
    email: 'user@test.com',
    password: await bcrypt.hash('password123', 10),
    name: 'Test User',
    role: 'STUDENT',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            appConfig: {
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    it('should return accessToken and user on valid credentials', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare' as any).mockResolvedValue(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue('fake-token');

      const result = await service.signIn('user@test.com', 'password123');

      expect(result).toEqual({
        accessToken: 'fake-token',
        user: {
          id: 'user-123',
          email: 'user@test.com',
          name: 'Test User',
          role: 'STUDENT',
        },
      });
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      jest.spyOn(prismaService.user, 'findUnique').mockResolvedValue(null);

      await expect(service.signIn('nonexistent@test.com', 'password')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
```

- [ ] **Step 2: Rodar teste para verificar que falha**

```bash
npm test -- auth.service.spec.ts
```

Expected: FAIL — AuthService not found, signIn method not defined

- [ ] **Step 3: Implementar AuthService**

`src/auth/auth.service.ts`:

```typescript
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SignInDto } from './dtos/sign-in.dto';
import { SignUpDto } from './dtos/sign-up.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signIn(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateAuthResponse(user);
  }

  async signUp(name: string, email: string, password: string) {
    const appConfig = await this.prisma.appConfig.findFirst();

    if (!appConfig?.signUpEnabled) {
      throw new ForbiddenException('Sign up is currently disabled');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'STUDENT',
      },
    });

    return this.generateAuthResponse(user);
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return user;
  }

  async toggleSignUp() {
    const appConfig = await this.prisma.appConfig.findFirst();

    const updated = await this.prisma.appConfig.update({
      where: { id: appConfig.id },
      data: {
        signUpEnabled: !appConfig.signUpEnabled,
      },
    });

    return {
      signUpEnabled: updated.signUpEnabled,
      updatedAt: updated.updatedAt,
    };
  }

  private generateAuthResponse(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
```

- [ ] **Step 4: Rodar teste para verificar que passa**

```bash
npm test -- auth.service.spec.ts
```

Expected: PASS (ou ajustar mocks se necessário)

- [ ] **Step 5: Commit**

```bash
git add src/auth/auth.service.ts src/auth/auth.service.spec.ts
git commit -m "feat: implement AuthService with sign-in, sign-up, getCurrentUser, toggleSignUp"
```

---

## Task 11: Implementar AuthController

**Arquivos:**
- Create: `src/auth/auth.controller.ts`

- [ ] **Step 1: Escrever AuthController com 4 endpoints**

`src/auth/auth.controller.ts`:

```typescript
import { Body, Controller, Get, Patch, Post, Request, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignInDto } from './dtos/sign-in.dto';
import { SignUpDto } from './dtos/sign-up.dto';
import { AuthResponseDto } from './dtos/auth-response.dto';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('sign-in')
  @HttpCode(200)
  async signIn(@Body() signInDto: SignInDto): Promise<AuthResponseDto> {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Public()
  @Post('sign-up')
  @HttpCode(201)
  async signUp(@Body() signUpDto: SignUpDto): Promise<AuthResponseDto> {
    return this.authService.signUp(signUpDto.name, signUpDto.email, signUpDto.password);
  }

  @Get('me')
  async getMe(@Request() req: any) {
    return this.authService.getCurrentUser(req.user.userId);
  }

  @Roles('COORDINATOR')
  @Patch('sign-up/toggle')
  async toggleSignUp() {
    return this.authService.toggleSignUp();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/auth/auth.controller.ts
git commit -m "feat: implement AuthController with 4 endpoints"
```

---

## Task 12: Implementar AuthModule

**Arquivos:**
- Create: `src/auth/auth.module.ts`
- Modify: `src/app.module.ts` (importar AuthModule)

- [ ] **Step 1: Escrever AuthModule**

`src/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
    PrismaModule,
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

- [ ] **Step 2: Importar AuthModule em AppModule**

Abra `src/app.module.ts` e adicione `AuthModule` ao array `imports`:

```typescript
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // ... outros módulos
    AuthModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 3: Commit**

```bash
git add src/auth/auth.module.ts src/app.module.ts
git commit -m "feat: implement AuthModule and import in AppModule"
```

---

## Task 13: Configurar Guards, Pipes e Filters Globalmente em main.ts

**Arquivos:**
- Modify: `src/main.ts`

- [ ] **Step 1: Adicionar configuração global em main.ts**

Abra `src/main.ts` e atualize a função `bootstrap()`:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { HttpExceptionFilter } from './auth/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Aplicar ValidationPipe globalmente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Aplicar ExceptionFilter globalmente
  app.useGlobalFilters(new HttpExceptionFilter());

  // Aplicar JwtAuthGuard globalmente (protege todas as rotas por padrão)
  app.useGlobalGuards(new JwtAuthGuard(app.get('Reflector')));

  // Aplicar RolesGuard globalmente (verifica roles quando @Roles() decorador é usado)
  app.useGlobalGuards(new RolesGuard(app.get('Reflector')));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
```

- [ ] **Step 2: Testar se a aplicação inicia sem erros**

```bash
npm run start:dev
```

Expected: Servidor inicia sem erros, mensagem "Application is running on: http://localhost:3000"

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "feat: configure global guards, pipes, and filters in main.ts"
```

---

## Task 14: Testes E2E para AuthController

**Arquivos:**
- Create: `test/auth.e2e-spec.ts`

- [ ] **Step 1: Escrever testes e2e para POST /auth/sign-in**

`test/auth.e2e-spec.ts`:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('Auth E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();

    // Cleanup database before tests
    await prisma.user.deleteMany();
    await prisma.appConfig.deleteMany();

    // Create test user
    await prisma.user.create({
      data: {
        id: 'user-123',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        name: 'Test User',
        role: 'STUDENT',
      },
    });

    // Create AppConfig with signUpEnabled = true
    await prisma.appConfig.create({
      data: {
        signUpEnabled: true,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/sign-in', () => {
    it('should return 200 with accessToken and user on valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'STUDENT',
      });
    });

    it('should return 401 on invalid email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 on invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid credentials');
    });
  });

  describe('POST /auth/sign-up', () => {
    it('should return 201 with accessToken and user on valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password456',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe('newuser@example.com');
      expect(response.body.user.role).toBe('STUDENT');
    });

    it('should return 409 on duplicate email', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          name: 'Duplicate User',
          email: 'test@example.com',
          password: 'password789',
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe('Email already registered');
    });

    it('should return 403 when signUpEnabled is false', async () => {
      await prisma.appConfig.updateMany({
        data: { signUpEnabled: false },
      });

      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          name: 'Another User',
          email: 'another@example.com',
          password: 'password999',
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Sign up is currently disabled');

      // Reset for other tests
      await prisma.appConfig.updateMany({
        data: { signUpEnabled: true },
      });
    });

    it('should return 422 on missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/sign-up')
        .send({
          name: 'Incomplete User',
          // Missing email and password
        });

      expect(response.status).toBe(422);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /auth/me', () => {
    let validToken: string;

    beforeAll(async () => {
      const signInResponse = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      validToken = signInResponse.body.accessToken;
    });

    it('should return 200 with user data when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'STUDENT',
      });
    });

    it('should return 401 when no token provided', async () => {
      const response = await request(app.getHttpServer()).get('/auth/me');

      expect(response.status).toBe(401);
    });

    it('should return 401 when invalid token provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /auth/sign-up/toggle', () => {
    let coordinatorToken: string;
    let studentToken: string;

    beforeAll(async () => {
      // Create coordinator user
      await prisma.user.create({
        data: {
          id: 'coordinator-123',
          email: 'coordinator@example.com',
          password: await bcrypt.hash('password123', 10),
          name: 'Coordinator User',
          role: 'COORDINATOR',
        },
      });

      // Get coordinator token
      const coordinatorResponse = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({
          email: 'coordinator@example.com',
          password: 'password123',
        });

      coordinatorToken = coordinatorResponse.body.accessToken;

      // Get student token
      const studentResponse = await request(app.getHttpServer())
        .post('/auth/sign-in')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      studentToken = studentResponse.body.accessToken;
    });

    it('should return 200 when COORDINATOR toggles sign-up', async () => {
      const response = await request(app.getHttpServer())
        .patch('/auth/sign-up/toggle')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('signUpEnabled');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should return 403 when STUDENT tries to toggle sign-up', async () => {
      const response = await request(app.getHttpServer())
        .patch('/auth/sign-up/toggle')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });
  });
});
```

- [ ] **Step 2: Rodar testes e2e**

```bash
npm run test:e2e -- auth.e2e-spec.ts
```

Expected: Todos os testes passam (ou ajustar se houver problemas com setup)

- [ ] **Step 3: Commit**

```bash
git add test/auth.e2e-spec.ts
git commit -m "test: add comprehensive e2e tests for AuthController"
```

---

## Task 15: Validar Contra docs/rbac.md

**Arquivos:**
- Check: `docs/rbac.md` (se existir)

- [ ] **Step 1: Verificar se docs/rbac.md existe**

```bash
cat docs/rbac.md
```

Se não existir, você pode criar um placeholder ou pular para o próximo passo.

- [ ] **Step 2: Se docs/rbac.md existir, validar que a matriz de permissões bate com a implementação**

Verificar:
- STUDENT pode fazer: sign-in, sign-up, GET /auth/me
- COORDINATOR pode fazer: sign-in, sign-up, GET /auth/me, PATCH /auth/sign-up/toggle
- @Public() permite bypass em sign-in e sign-up

Se houver divergências, ajustar a implementação ou documentação.

- [ ] **Step 3: Commit (se houver mudanças)**

```bash
git add docs/rbac.md
git commit -m "docs: validate RBAC matrix matches auth implementation"
```

---

## Task 16: Atualizar docs/architecture.md

**Arquivos:**
- Modify: `docs/architecture.md`

- [ ] **Step 1: Abrir docs/architecture.md e adicionar seção sobre autenticação**

Localize a seção "Stack" ou "Arquitetura" e adicione:

```markdown
## Autenticação

Fase 1 implementa JWT com PassportJS, armazenado em variáveis de ambiente.

- **JWT Strategy**: Extrai token do header `Authorization: Bearer <token>`
- **JwtAuthGuard**: Aplicado globalmente, protege todas as rotas por padrão
- **@Public()**: Marca rotas públicas (bypass de autenticação)
- **RolesGuard**: Verifica role via @Roles() decorator
- **ExceptionFilter global**: Padroniza respostas de erro (401, 403, 409, 422)

Payload do JWT: `{ sub: userId, email, role }`
Expiração: 24 horas
Secret: armazenado em `.env` via `JWT_SECRET`
```

- [ ] **Step 2: Commit**

```bash
git add docs/architecture.md
git commit -m "docs: document authentication architecture in architecture.md"
```

---

## Task 17: Atualizar docs/api.md

**Arquivos:**
- Modify: `docs/api.md`

- [ ] **Step 1: Abrir docs/api.md e adicionar seção de endpoints de autenticação**

Adicione uma seção `/auth` com:

```markdown
## POST /auth/sign-in

**Public endpoint** — sem autenticação

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "User Name",
    "role": "STUDENT"
  }
}
```

**Errors:**
- 401: Invalid credentials
- 422: Validation failed

---

## POST /auth/sign-up

**Public endpoint** — sem autenticação

**Request:**
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password456"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "new-user-id",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "STUDENT"
  }
}
```

**Errors:**
- 403: Sign up is currently disabled
- 409: Email already registered
- 422: Validation failed

---

## GET /auth/me

**Autenticado** — requer JWT no header `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "user-123",
  "email": "user@example.com",
  "name": "User Name",
  "role": "STUDENT"
}
```

**Errors:**
- 401: Unauthorized (token inválido ou ausente)

---

## PATCH /auth/sign-up/toggle

**Autenticado** — requer JWT
**Roles**: COORDINATOR only

**Response (200):**
```json
{
  "signUpEnabled": true,
  "updatedAt": "2026-04-28T10:30:00Z"
}
```

**Errors:**
- 401: Unauthorized
- 403: Forbidden (role não autorizada)
```

- [ ] **Step 2: Commit**

```bash
git add docs/api.md
git commit -m "docs: document auth endpoints in api.md"
```

---

## Task 18: Commit Final e Validação

**Arquivos:**
- Review: Todos os arquivos criados/modificados

- [ ] **Step 1: Rodar todos os testes (unitários + e2e)**

```bash
npm test
npm run test:e2e
```

Expected: Todos os testes passam

- [ ] **Step 2: Verificar se a aplicação inicia sem warnings**

```bash
npm run start:dev
```

Expected: Aplicação inicia, no console aparece "Application is running on: http://localhost:3000"

- [ ] **Step 3: Validar um endpoint manualmente (opcional)**

```bash
# Em outro terminal:
curl -X POST http://localhost:3000/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Expected: Retorna 200 com `accessToken` e `user`

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "feat: phase 1 auth backend complete - JWT, RBAC, validation, error handling"
```

- [ ] **Step 5: Verificar status do git**

```bash
git status
git log --oneline -10
```

Expected: Working tree clean, últimos 10 commits visíveis com mensagens descritivas

---

## Critérios de Aceitação

- ✅ Todos os 4 endpoints (`/auth/sign-in`, `/auth/sign-up`, `/auth/me`, `/auth/sign-up/toggle`) implementados
- ✅ JWT válido por 24 horas, armazenado em `.env`
- ✅ Erros padronizados (401, 403, 409, 422) via ExceptionFilter global
- ✅ `@Public()` permite bypass de autenticação em sign-in/sign-up
- ✅ `@Roles('COORDINATOR')` bloqueia STUDENT em `/auth/sign-up/toggle`
- ✅ Senha hasheada com bcrypt
- ✅ Testes unitários passando (AuthService)
- ✅ Testes e2e passando (todos os endpoints)
- ✅ `.env` configurado localmente (não commitado)
- ✅ Documentação atualizada (architecture.md, api.md)
