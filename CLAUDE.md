# CLAUDE.md — Juntos pelo Impacto

Sistema de gestao que substitui planilhas na coordenacao entre alunos universitarios, equipes e OSCs (Organizacoes da Sociedade Civil) parceiras. Monorepo npm workspaces com NestJS + Prisma (backend) e Vite + React (frontend), orquestrado via Docker Compose. Prazo do MVP: **2 meses**.

## Documentos de referencia

Leia o documento relevante antes de implementar. Se uma instrucao conflitar com eles, pare e pergunte.

| Documento | O que contem |
|---|---|
| [docs/spech-delivery.md](docs/spech-delivery.md) | Requisitos funcionais (RF001-RF014), escopo do MVP, telas |
| [docs/architecture.md](docs/architecture.md) | Stack, estrutura de pastas, workspaces, convencoes, idioma |
| [docs/data-model.md](docs/data-model.md) | Entidades, relacoes, enums, regras de negocio, indices |
| [docs/docker.md](docs/docker.md) | Dockerfiles, Compose, variaveis de ambiente |
| [docs/rbac.md](docs/rbac.md) | Matriz de permissoes por perfil e endpoint |
| [docs/api.md](docs/api.md) | Endpoints, request/response por modulo |
| [docs/tasks.md](docs/tasks.md) | Quebra tecnica do MVP em fases ordenadas |

## Como trabalhar com IA neste projeto

### Principio central

Descreva o problema, nao a solucao. Deixe a IA explorar opcoes e justificar escolhas antes de implementar. Questione decisoes tecnicas mesmo que funcionem — pair programming real, nao ditado de codigo.

### Ciclo de trabalho

1. **Antes de codar:** leia os docs relevantes, confirme que a abordagem bate com `docs/architecture.md`. Se algo estiver ambiguo, pergunte — nao assuma.
2. **Durante:** itere em ciclos pequenos (features completas, nao parciais). Valide cada mudanca antes de seguir para a proxima.
3. **Depois:** rode testes, revise o diff, documente mudancas estruturais na mesma entrega.

### Documentar mudancas estruturais

Toda mudanca estrutural deve ser documentada **na mesma entrega** — antes de considerar a tarefa concluida:

| Tipo de mudanca | Onde documentar |
|---|---|
| Stack, bibliotecas, runtime | `docs/architecture.md` §2 |
| Estrutura de pastas | `docs/architecture.md` §3, §§5-7 |
| Convencoes (workspaces, naming, scripts) | `docs/architecture.md` §4 |
| Docker, servicos, variaveis de ambiente | `docs/docker.md` |
| Modelo de dados (entidades, enums, relacoes) | `docs/data-model.md` |
| Permissoes e RBAC | `docs/rbac.md` |
| Contratos de API | `docs/api.md` |
| Escopo do MVP | `docs/spech-delivery.md` + confirmar com usuario |
| Regras operacionais para a IA | Este arquivo (`CLAUDE.md`) |

Padronizacao que nao esta nos documentos **nao existe**. Se voce aplicou uma convencao que nao esta documentada, documente-a na mesma resposta.

### O que a IA NAO deve fazer

- Adicionar dependencias sem autorizacao.
- Propor refatoracoes fora da tarefa em andamento.
- Criar componentes "genericos" antes de casos concretos — prefira simplicidade.
- Especular sobre requisitos nao confirmados — pergunte.
- Deixar codigo sem testes "para depois".
- Esconder problemas — sinalize imediatamente.
- Usar emojis em codigo, commits ou documentacao.
- Introduzir pnpm, yarn, Nx, Turborepo, Lerna ou ORMs que nao sejam Prisma.
- Implementar itens fora do escopo do MVP (`docs/spech-delivery.md` §5).
- Criar novos arquivos `.md` — atualize os existentes.

### Commits e qualidade

- Commits atomicos: uma feature ou fix por commit, mensagem descritiva em ingles (conventional commits).
- **Nunca commitar diretamente na branch `main`.** Todo trabalho (codigo e docs) vai em uma branch separada e entra via PR.
- Divergencia entre doc e codigo: trate a documentacao como verdade; ajuste o codigo ou pergunte.
- Confiabilidade sobre velocidade — melhor uma feature bem testada do que um prototipo quebrado.

### Documentacao Swagger (obrigatoria)

Todo controller NestJS deve ter decoradores Swagger em cada endpoint: `@ApiTags`, `@ApiBearerAuth` (rotas autenticadas), `@ApiOperation` e `@ApiResponse` (para cada status code relevante). Todo DTO deve ter `@ApiProperty` ou `@ApiPropertyOptional` em cada campo. O setup do `SwaggerModule` ja existe em `apps/backend/src/main.ts` — nao duplicar.

## Estado atual

Fase: **planejamento concluido — pronto para implementacao**. Scaffold de backend e frontend existentes. Docker Compose configurado. Proximo passo: **Fase 0** de `docs/tasks.md`.
