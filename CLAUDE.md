# CLAUDE.md — Juntos pelo Impacto

Sistema de gestao que substitui planilhas na coordenacao entre alunos universitarios, equipes e OSCs (Organizacoes da Sociedade Civil) parceiras. Monorepo npm workspaces com NestJS + Prisma (backend) e Vite + React (frontend), orquestrado via Docker Compose. Prazo do MVP: **2 meses**.

## Documentos de referencia

Leia o documento relevante antes de implementar. Se uma instrucao conflitar com eles, pare e pergunte.

| Documento | O que contem |
|---|---|
| [docs/spech-delivery.md](docs/spech-delivery.md) | Requisitos funcionais (RF001-RF014), escopo do MVP, telas |
| [docs/architecture.md](docs/architecture.md) | Stack, estrutura de pastas, workspaces, convencoes, idioma |
| [docs/data-model.md](docs/data-model.md) | Entidades, relacoes, enums, regras de negocio, indices |
| [docs/rbac.md](docs/rbac.md) | Matriz de permissoes por perfil e endpoint |
| [docs/api.md](docs/api.md) | Endpoints, request/response por modulo |
| [docs/tasks.md](docs/tasks.md) | Quebra tecnica do MVP em fases ordenadas |

## Regras operacionais

### Documentar mudancas

Toda mudanca estrutural deve ser documentada **na mesma entrega**: stack/pastas/convencoes → `docs/architecture.md`; modelo de dados → `docs/data-model.md`; RBAC → `docs/rbac.md`; API → `docs/api.md`; escopo MVP → `docs/spech-delivery.md` + confirmar com usuario; regras para IA → este arquivo.

Padronizacao que nao esta nos documentos **nao existe**. Se aplicou convencao nao documentada, documente-a na mesma resposta.

### Proibido

- Adicionar dependencias sem autorizacao.
- Propor refatoracoes fora da tarefa em andamento.
- Criar componentes "genericos" antes de casos concretos.
- Especular sobre requisitos nao confirmados — pergunte.
- Deixar codigo sem testes "para depois".
- Esconder problemas — sinalize imediatamente.
- Usar emojis em codigo, commits ou documentacao.
- Introduzir pnpm, yarn, Nx, Turborepo, Lerna ou ORMs que nao sejam Prisma.
- Implementar itens fora do escopo do MVP (`docs/spech-delivery.md` §5).
- Criar novos arquivos `.md` — atualize os existentes.

### Commits

- Atomicos: uma feature ou fix por commit, mensagem em ingles (conventional commits).
- **Nunca commitar diretamente na `main`.** Todo trabalho vai em branch separada e entra via PR.
- Divergencia entre doc e codigo: trate a documentacao como verdade; ajuste o codigo ou pergunte.

### Swagger (obrigatorio)

Todo controller NestJS: `@ApiTags`, `@ApiBearerAuth` (rotas autenticadas), `@ApiOperation` e `@ApiResponse` por status code relevante. Todo DTO: `@ApiProperty` ou `@ApiPropertyOptional` em cada campo. Setup ja existe em `apps/backend/src/main.ts` — nao duplicar.

## Qualidade de codigo

### Estilo

- Funcoes: 4-20 linhas. Divida se passar disso.
- Arquivos: menos de 500 linhas. Divida por responsabilidade.
- Uma responsabilidade por funcao, um dominio por modulo (SRP).
- Nomes especificos e unicos. Evite `data`, `handler`, `Manager`. Prefira nomes com menos de 5 hits de grep no codebase.
- Tipos explícitos em todo lugar. Proibido `any` ou funcoes sem tipagem.
- Zero duplicacao de logica. Extraia para funcao ou modulo compartilhado.
- Early returns em vez de ifs aninhados. Maximo 2 niveis de indentacao.
- Mensagens de excecao devem incluir o valor recebido e o formato esperado.

### Comentarios

- Nao apague comentarios existentes em refatoracoes — eles carregam intencao e proveniencia.
- Escreva POR QUE, nao O QUE.
- Docstrings em funcoes publicas: intencao + um exemplo de uso.
- Referencie numero de issue ou SHA de commit quando uma linha existe por causa de bug especifico ou restricao externa.

### Testes

- Testes rodam com `npm test` (unitarios) e `npm run test:e2e` (integracao).
- Toda funcao nova tem teste. Correcoes de bug tem teste de regressao.
- Mock apenas I/O externo (API, DB, filesystem) com fake classes nomeadas — sem stubs inline.
- Testes devem ser F.I.R.S.T: fast, independent, repeatable, self-validating, timely.
- Nao deixar testes com `.skip` ou comentados sem remover na mesma entrega.

### Dependencias e injecao

- Injete dependencias via constructor (NestJS DI), nunca via import global ou singleton estatico.
- Envolva libs de terceiros atras de uma interface propria antes de usá-las em mais de um modulo.

### Estrutura

- Convencoes NestJS: module/controller/service/dto por dominio.
- Caminhos previsiveis: `src/<dominio>/<dominio>.module.ts`, `.controller.ts`, `.service.ts`.
- Prefira modulos focados em vez de arquivos-deus.
- Formatacao: Prettier para todo TS/JS.

### Robustez

Adicione explicitamente quando o contexto exigir:

- **Retry com backoff** em chamadas a APIs externas e ao banco.
- **Timeout** em todo I/O externo — nunca espere indefinidamente.
- **Graceful degradation** — falha parcial nao deve derrubar o fluxo inteiro.
- **Rate limit** em endpoints publicos ou semi-publicos.

Se o ponto de falha nao estiver mapeado, pergunte.
