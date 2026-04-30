# Design — Fase 2: OSCs (backend)

Data: 2026-04-29

## Escopo

Implementar o `OscsModule` no backend NestJS, expondo 4 endpoints para gerenciamento de OSCs (Organizações da Sociedade Civil). Esta fase depende da Fase 1 (auth backend) e é pré-requisito das Fases 3 e 4.

## Endpoints

### GET /oscs
- Autenticado (qualquer role)
- COORDINATOR e ADMIN: retornam todas as OSCs (qualquer status)
- STUDENT: retorna apenas OSCs com `status = AVAILABLE`
- Response `200`: array de OSCs

### POST /oscs
- COORDINATOR e ADMIN
- Cria OSC com `status = AVAILABLE`
- Body: `{ name, description, email?, phone? }`
- Response `201`: OSC criada
- Erro `409`: nome já cadastrado

### GET /oscs/:id
- Autenticado (qualquer role)
- Retorna OSC independente de status
- Response `200`: OSC
- Erro `404`: não encontrada

### PATCH /oscs/:id
- COORDINATOR e ADMIN
- Atualiza qualquer campo da OSC (`name`, `description`, `email`, `phone`, `status`); todos opcionais
- Body: `{ name?, description?, email?, phone?, status? }`
- Response `200`: OSC atualizada
- Erro `409`: nome duplicado
- Erro `404`: não encontrada
- Sem restrição de transição de status — o coordenador define livremente

## Decisões de design

**PATCH livre de regras de transição de status:** a restrição de integridade vive em `POST /projects`, que só aceita OSCs com `status = AVAILABLE`. O coordenador tem controle total sobre o status da OSC e decide o estado correto após encerrar um projeto.

**ADMIN passa por todas as rotas:** o `RolesGuard` já implementa isso (linha 41 de `roles.guard.ts`) — qualquer rota com `@Roles()` libera automaticamente para ADMIN.

## Estrutura de arquivos

```
src/oscs/
├── oscs.module.ts
├── oscs.controller.ts
├── oscs.service.ts
├── oscs.service.spec.ts
└── dtos/
    ├── create-osc.dto.ts
    └── update-osc.dto.ts
```

Segue o mesmo padrão do `AuthModule`.

## Testes

`oscs.service.spec.ts` com PrismaService mockado, cobrindo:
- `GET /oscs`: filtragem por role (COORDINATOR vs STUDENT)
- `POST /oscs`: criação com sucesso e nome duplicado (409)
- `GET /oscs/:id`: encontrada e não encontrada (404)
- `PATCH /oscs/:id`: update parcial, nome duplicado (409), não encontrada (404)
