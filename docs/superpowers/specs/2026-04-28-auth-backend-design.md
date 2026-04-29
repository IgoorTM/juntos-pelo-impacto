# Design — Fase 1: Autenticação Backend

**Data:** 2026-04-28  
**Escopo:** Implementação de autenticação JWT com RBAC (Role-Based Access Control) para backend NestJS

## 1. Objetivo

Implementar camada de segurança baseada em JWT e guards de autorização que proteja todos os endpoints da aplicação. Esta fase é pré-requisito para todas as demais (Fases 2–7).

## 2. Requisitos Confirmados

- **JWT armazenado em `.env`** com expiração de **24 horas**
- **ExceptionFilter global** que padroniza respostas de erro (401, 403, 409, 422)
- **Estrutura modular** em `src/auth/` com subpastas: `strategies/`, `guards/`, `decorators/`, `dtos/`, `filters/`
- **Retorno de sign-in:** token + dados do usuário (`{ accessToken, user: { id, email, role, name } }`)
- **4 endpoints:** `POST /auth/sign-in`, `POST /auth/sign-up`, `GET /auth/me`, `PATCH /auth/sign-up/toggle`
- **Validação global** via `ValidationPipe` com `whitelist`, `forbidNonWhitelisted`, `transform`

## 3. Arquitetura

### 3.1 Estrutura de Pastas

```
src/
├── auth/
│   ├── strategies/
│   │   └── jwt.strategy.ts          # Extração e validação de JWT
│   ├── guards/
│   │   ├── jwt-auth.guard.ts        # Verifica token válido
│   │   └── roles.guard.ts           # Verifica role autorizado
│   ├── decorators/
│   │   ├── public.decorator.ts      # Marca rotas públicas
│   │   └── roles.decorator.ts       # Define roles permitidos
│   ├── dtos/
│   │   ├── sign-in.dto.ts
│   │   ├── sign-up.dto.ts
│   │   └── auth-response.dto.ts
│   ├── filters/
│   │   └── http-exception.filter.ts # Padroniza erros HTTP
│   ├── auth.module.ts
│   ├── auth.service.ts
│   └── auth.controller.ts
├── common/
│   └── getCurrentSemester.ts        # Utilitário de Fase 0
└── main.ts                          # Configuração global de pipes/filters/guards
```

### 3.2 Fluxo de Autenticação

```
Requisição → JwtAuthGuard → @Public()? → Sim: passa | Não: valida token
              → Token válido? → Não: 401 | Sim: extrai payload para request.user
              → RolesGuard → role autorizado? → Não: 403 | Sim: executa controller
              → HttpExceptionFilter → formata resposta (sucesso ou erro)
```

### 3.3 Configuração Global (main.ts)

```typescript
// 1. JwtAuthGuard aplicado globalmente (protege todas as rotas)
app.useGlobalGuards(new JwtAuthGuard(...));

// 2. ValidationPipe global (valida DTOs, transforma tipos)
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));

// 3. ExceptionFilter global (padroniza erros)
app.useGlobalFilters(new HttpExceptionFilter());

// 4. RolesGuard é aplicado seletivamente via @Roles() (não global)
```

## 4. Componentes

### 4.1 JwtStrategy

**Arquivo:** `src/auth/strategies/jwt.strategy.ts`

Extrai o token do header `Authorization: Bearer <token>`, valida assinatura e retorna o payload.

**Payload esperado (gerado em sign-in/sign-up):**
```json
{
  "sub": "uuid-do-usuario",
  "email": "usuario@example.com",
  "role": "STUDENT" ou "COORDINATOR"
}
```

**Disponível em controllers como:** `request.user`

---

### 4.2 Guards

#### JwtAuthGuard

**Arquivo:** `src/auth/guards/jwt-auth.guard.ts`

- Verifica se token é válido
- Retorna **401 Unauthorized** se ausente ou inválido
- Permite bypass com `@Public()`
- **Aplicado globalmente** em `main.ts`

#### RolesGuard

**Arquivo:** `src/auth/guards/roles.guard.ts`

- Verifica se `request.user.role` está em `@Roles(...)`
- Retorna **403 Forbidden** se role não autorizado
- **Aplicado seletivamente** via decorator `@Roles(...)`
- Exemplo: `@Roles('COORDINATOR')` — apenas coordenadores

---

### 4.3 Decorators

#### @Public()

**Arquivo:** `src/auth/decorators/public.decorator.ts`

Marca uma rota como acessível sem JWT. Usado em:
- `POST /auth/sign-in`
- `POST /auth/sign-up`

#### @Roles()

**Arquivo:** `src/auth/decorators/roles.decorator.ts`

Define quais roles podem acessar a rota. Usado em:
- `PATCH /auth/sign-up/toggle` → `@Roles('COORDINATOR')`

---

### 4.4 DTOs e Validação

#### SignInDto

```typescript
export class SignInDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

**Validação:** 401 se credenciais inválidas

#### SignUpDto

```typescript
export class SignUpDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

**Validações:**
- 422 se campo falta ou tipo errado
- 403 se `AppConfig.signUpEnabled = false`
- 409 se email duplicado

#### AuthResponseDto

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

---

### 4.5 ExceptionFilter Global

**Arquivo:** `src/auth/filters/http-exception.filter.ts`

Padroniza todas as respostas de erro HTTP.

**Exemplo de resposta 401:**
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

**Exemplo de resposta 422 (validação):**
```json
{
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "messages": ["email must be an email"]
    }
  ]
}
```

**Exemplo de resposta 409 (email duplicado):**
```json
{
  "statusCode": 409,
  "message": "Email already registered"
}
```

---

### 4.6 AuthService

**Arquivo:** `src/auth/auth.service.ts`

Lógica de negócio de autenticação.

#### Métodos

| Método | Parâmetros | Retorna | Exceções |
|--------|------------|---------|----------|
| `signIn(email, password)` | string, string | `{ accessToken, user }` | 401 (credenciais inválidas) |
| `signUp(name, email, password)` | string, string, string | `{ accessToken, user }` | 403 (cadastro desabilitado), 409 (email duplicado) |
| `getCurrentUser(userId)` | string | `{ id, email, role, name }` | — |
| `toggleSignUp()` | — | `{ signUpEnabled, updatedAt }` | — |

**Detalhes:**

- **signIn:** busca user por email, compara senha com `bcrypt.compare()`, gera JWT
- **signUp:** verifica `AppConfig.signUpEnabled`, hash senha com `bcrypt.hash()`, cria user com role STUDENT, gera JWT
- **getCurrentUser:** retorna dados do usuário autenticado
- **toggleSignUp:** alterna boolean `AppConfig.signUpEnabled` e retorna novo estado

---

### 4.7 AuthController

**Arquivo:** `src/auth/auth.controller.ts`

Endpoints HTTP.

| Método | Rota | Guard | Decorator | Retorna |
|--------|------|-------|-----------|---------|
| POST | `/auth/sign-in` | JwtAuthGuard | @Public() | `AuthResponseDto` |
| POST | `/auth/sign-up` | JwtAuthGuard | @Public() | `AuthResponseDto` |
| GET | `/auth/me` | JwtAuthGuard | — | `{ id, email, role, name }` |
| PATCH | `/auth/sign-up/toggle` | JwtAuthGuard | @Roles('COORDINATOR') | `{ signUpEnabled, updatedAt }` |

---

## 5. Configuração de Variáveis de Ambiente

**Arquivo:** `.env`

```
JWT_SECRET=sua-chave-super-secreta-mude-em-producao
DATABASE_URL=postgresql://...
```

---

## 6. Configuração do AuthModule

**Arquivo:** `src/auth/auth.module.ts`

```typescript
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '24h' },
    }),
    // PrismaModule ou equivalente
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

---

## 7. Dependências

Instaladas em Fase 1 conforme `docs/tasks.md`:

```
@nestjs/jwt
@nestjs/passport
passport
passport-jwt
bcrypt
class-validator
class-transformer
```

---

## 8. Testes

**Testes unitários** para:
- `AuthService.signIn()` — sucesso, credenciais inválidas
- `AuthService.signUp()` — sucesso, cadastro desabilitado, email duplicado
- `AuthService.toggleSignUp()` — alterna estado

**Testes e2e** para:
- `POST /auth/sign-in` — 200 com token, 401 se inválido
- `POST /auth/sign-up` — 201 com token, 403 se desabilitado, 409 se duplicado
- `GET /auth/me` — 200 com dados, 401 se sem token
- `PATCH /auth/sign-up/toggle` — 200 se COORDINATOR, 403 se STUDENT

---

## 9. Fluxo de Desenvolvimento

1. Instalar dependências (`@nestjs/jwt`, `@nestjs/passport`, etc.)
2. Criar estrutura de pastas em `src/auth/`
3. Implementar `JwtStrategy`
4. Implementar `JwtAuthGuard` e `RolesGuard`
5. Implementar decorators `@Public()` e `@Roles()`
6. Implementar DTOs com validações
7. Implementar `HttpExceptionFilter`
8. Implementar `AuthService` com lógica de sign-in, sign-up, getCurrentUser, toggleSignUp
9. Implementar `AuthController` com 4 endpoints
10. Configurar guards, pipes e filters globalmente em `main.ts`
11. Configurar `.env` com JWT_SECRET
12. Testes unitários e e2e
13. Validar contra docs/rbac.md (matriz de permissões)

---

## 10. Alinhar com Documentação

Após implementação, atualizar:
- `docs/architecture.md` — mencionar estrutura de auth, padrão JWT
- `docs/api.md` — documentar contratos dos 4 endpoints
- `docs/rbac.md` — confirmar matriz de permissões (se não existir)

---

## 11. Critérios de Aceitação

- ✅ Todos os 4 endpoints implementados e testados
- ✅ JWT válido por 24 horas, armazenado em `.env`
- ✅ Erros padronizados (401, 403, 409, 422) via ExceptionFilter global
- ✅ `@Public()` permite bypass de autenticação em sign-in/sign-up
- ✅ `@Roles('COORDINATOR')` bloqueia STUDENT em `/auth/sign-up/toggle`
- ✅ Senha hasheada com bcrypt
- ✅ Testes passando (unitários e e2e)
- ✅ `.env` configurado localmente (não commitado)
