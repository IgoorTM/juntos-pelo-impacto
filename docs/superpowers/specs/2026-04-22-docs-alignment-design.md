# Alinhamento documental (ajustes dirigidos) — Design Spec

> Data: 2026-04-22  
> Escopo: corrigir inconsistências documentais priorizadas pelo usuário sem alterar implementação.

## 1. Contexto

O projeto está em fase de definição/estrutura. Portanto, documentos devem distinguir claramente o que é regra de domínio já definida do que ainda é etapa de implementação futura, sem assumir estado já implementado no código.

## 2. Escopo desta rodada

### Incluído

1. Corrigir contrato de `Project` para não permitir OSC nula.
2. Corrigir `docs/tasks.md` no ponto de validação/erros para reduzir ambiguidade.
3. Ajustar `docs/docker.md` para reforçar política de `.env` não versionado e estratégia por ambiente.
4. Corrigir inconsistências de precisão documental em Docker (volumes descritos vs compose real).
5. Padronizar terminologia de perfil (Coordenador/Aluno) em RBAC.
6. Reescrever `README.md` para papel de onboarding, movendo detalhes extensos para `docs/*`.

### Excluído

- Mudanças de código de aplicação.
- Refatoração ampla de todos os docs fora dos pontos acima.

## 3. Abordagem escolhida

Abordagem cirúrgica: editar somente `docs/api.md`, `docs/tasks.md`, `docs/docker.md`, `docs/rbac.md` e `README.md`, mantendo a estrutura atual e removendo ambiguidades.

## 4. Design de consistência (fonte de verdade)

Ordem de validação textual para evitar contradições:

1. `docs/data-model.md` (domínio)
2. `docs/api.md` (contrato)
3. `docs/rbac.md` (permissão)
4. `docs/tasks.md` (execução)
5. `docs/docker.md` (operação)
6. `README.md` (entrada)

## 5. Decisões de conteúdo

### 5.1 Contrato de Project com OSC não nula

Em `docs/api.md`, o retorno de `Project` deixa de aceitar `osc: null` e passa a refletir vínculo obrigatório, alinhado ao modelo de dados.

### 5.2 Tasks com semântica de validação explícita

Em `docs/tasks.md`, a fase de Auth deixa explícito o comportamento esperado da validação de DTO e o código de erro contratual, evitando leitura ambígua.

### 5.3 Política de `.env` por ambiente

Em `docs/docker.md`, manter:

- `.env.example` versionado na raiz para referência de Compose.
- `.env` real não versionado.
- configuração por ambiente como recurso local de cada ambiente.

### 5.4 Precisão Docker

Em `docs/docker.md`, alinhar descrição de volumes com o que está no `docker-compose.yml` atual (sem afirmar volumes nomeados onde não existem).

### 5.5 Terminologia RBAC

Em `docs/rbac.md`, padronizar nomenclatura para evitar alternância inconsistente de papéis.

### 5.6 README orientado a onboarding

Em `README.md`, manter apenas:

- visão rápida do projeto
- pré-requisitos
- setup essencial
- comandos principais
- mapa curto para `docs/*`

Detalhes de arquitetura, modelo, API, RBAC e Docker ficam centralizados em seus documentos específicos.

## 6. Critérios de aceite

1. Nenhum trecho alterado contradiz `docs/data-model.md`.
2. `docs/api.md` não mostra `Project.osc` como nulo.
3. `docs/docker.md` deixa clara a política de `.env` (example versionado, real não versionado).
4. `README.md` fica enxuto e direciona responsabilidades para `docs/*`.
5. `docs/rbac.md` fica consistente em terminologia.
6. `docs/tasks.md` deixa explícito o comportamento esperado de validação.
