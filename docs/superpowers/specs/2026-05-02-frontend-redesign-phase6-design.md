# Frontend Redesign + Fase 6 — Coordenador

**Data:** 2026-05-02
**Branch alvo:** fase-6-frontend-coordinator
**Referência de design:** `~/www/juntos pelo impacto/uploads/` (login.png, dashboard.png, list-osc.png, osc-manager.png)

## Contexto

O design atual do frontend é funcional mas genérico. O Claude Design gerou quatro telas de referência que estabelecem a linguagem visual alvo. Esta spec cobre:

1. Atualização visual do shell autenticado e das páginas já existentes (fases 4.5–5) para seguir os mockups.
2. Implementação das telas de fase 6 (coordenador): `/projects`.
3. Correção de regra de negócio no backend: OSC nunca vai para `BLOCKED`.

Funcionalidades existentes são preservadas; apenas visual e layout mudam, salvo onde explicitamente indicado.

---

## 1. Shell autenticado (`AuthenticatedLayout`)

### Header

- **Esquerda:** label "Semestre em curso" + valor do semestre atual em destaque (ex: `2026.1`). Visual: fundo branco, borda inferior, sem o pill atual.
- **Direita:** nome do usuário em font-medium, cargo abaixo em text-muted-foreground (ex: "Coordenador"), seguido de botão "Sair" outline.
- Remove o botão de "Notificações" (sem funcionalidade no MVP).
- Remove o avatar circular de iniciais — informação de identidade migra para o bloco nome/cargo.

### Sidebar

- Mantém fundo dark navy (`--color-sidebar`) e funcionalidade de colapso.
- Estado **expandido**: nav items exibem apenas texto (sem ícone ao lado do label), espaçamento generoso, item ativo com fundo branco e texto navy.
- Estado **colapsado** (largura 3.5rem): exibe apenas o ícone centralizado, sem texto.
- Nav items para COORDINATOR: Dashboard, OSCs, Projetos. Placeholders desabilitados visualmente (opacidade reduzida, cursor not-allowed): Equipes, Formulários, Relatórios.
- Nav items para STUDENT: Projetos apenas.
- Brand: "Juntos pelo Impacto" em bold + "Sistema de gestão" como sublabel. No estado colapsado, exibe apenas a inicial "J".

---

## 2. Página de Login (`SignInPage`)

Mudanças leves — estrutura já está correta:

- Título do card: peso `font-semibold` → `font-bold`, tamanho `text-lg` → `text-xl`.
- Botão "Entrar": mantém dark navy (já correto).
- Sem adição de radio buttons de perfil (sem correspondência funcional no backend).
- Sem outras alterações estruturais.

---

## 3. Dashboard (`DashboardPage`)

### Metric cards

- **Mantém ícones** em cada card.
- Substitui o 4º card `blockedOscs` / "OSCs Bloqueadas" por `pendingProjects` / "Projetos pendentes".
- Layout dos cards: número grande em destaque + ícone no canto superior direito + label abaixo. Mantém grid 1→2→4 colunas.

### Alerta de pendências

- Card de alerta permanece quando `pendingProjects > 0`. Sem mudança de comportamento.

### Seção de cadastro (toggle `signUpEnabled`)

- Mantém layout e comportamento atuais.
- Atualiza paleta se os tokens sofrerem ajuste global (nenhuma mudança específica aqui).

---

## 4. Página de OSCs (`OscsPage`)

### Layout

- Substitui a tabela por **card grid de 2 colunas** (1 coluna em mobile).
- Cada card exibe:
  - Nome da OSC (font-semibold)
  - Descrição truncada (1 linha, `truncate`)
  - E-mail e telefone quando presentes (text-muted-foreground, text-sm)
  - Status badge com cores: verde (AVAILABLE), azul (IN_PROGRESS), vermelho (BLOCKED — exibido se existir no banco, mas nunca mais gerado)
  - Botão de edição (ícone lápis, ghost, canto superior direito do card)

### Filtros (client-side)

- Input de busca: filtra por nome da OSC (case-insensitive, local).
- Dropdown de status: filtra por AVAILABLE / IN_PROGRESS / BLOCKED / Todos.
- Ambos ficam numa barra acima do grid, à esquerda, com o botão "+ Nova OSC" à direita.

### Dialogs

- Sem mudança em `OscFormDialog`. Apenas herda ajustes de paleta global se houver.

---

## 5. Página de Projetos do Coordenador (`ProjectsPage`) — nova

### Layout

Listagem agrupada por semestre, em ordem cronológica reversa (semestre atual no topo).

Cada grupo "semestre" tem um cabeçalho com o label do semestre (ex: "2026.1") e uma contagem de projetos.

Cada projeto é exibido em um card com:
- Nome do projeto (font-semibold)
- Nome da OSC vinculada (text-muted-foreground)
- Status badge
- Equipes: lista das equipes do projeto com semestre e contagem de membros
- Botão "Alterar status" (outline, canto superior direito do card) — abre o modal de status

Projetos `IN_PROGRESS` de semestres **anteriores** ao atual recebem um indicador visual de pendência: borda esquerda colorida (amarelo/laranja) + label "Pendente de encerramento".

### Modal de status

- Dropdown com as 5 opções: `IN_PROGRESS`, `COMPLETED`, `ABANDONED`, `ONGOING`, `INCOMPLETE`.
- Ao selecionar `COMPLETED`, exibe aviso inline abaixo do dropdown: "A OSC [nome] será liberada para disponível."
- Ao selecionar `ABANDONED`, exibe o mesmo aviso.
- Botões: "Cancelar" (outline) e "Confirmar" (default).
- Em caso de sucesso, atualiza o projeto na lista sem reload de página.
- Em caso de erro `409`, exibe mensagem de erro no modal.

### Estados

- Loading: skeletons por card.
- Erro: mensagem + botão "Tentar novamente".
- Empty: mensagem "Nenhum projeto cadastrado."

---

## 6. Mudança de regra de negócio — OSC nunca vai para `BLOCKED`

**Arquivo:** `apps/backend/src/projects/projects.service.ts`

Regra atual: ao encerrar um projeto com status `INCOMPLETE` ou `ABANDONED`, o serviço move a OSC associada para `BLOCKED`.

**Nova regra (confirmada pelo usuário):**
- `COMPLETED` → OSC vai para `AVAILABLE`.
- `ABANDONED` → OSC **permanece** `IN_PROGRESS` (mudança em relação ao comportamento anterior que liberava a OSC).
- `INCOMPLETE` → OSC **permanece** `IN_PROGRESS`.
- `ONGOING` / `IN_PROGRESS` → sem mudança na OSC.

O status `BLOCKED` permanece no enum do Prisma (preserva dados existentes no banco), mas nenhum endpoint o atribui a partir desta mudança.

**Dashboard:** o campo `blockedOscs` no endpoint `GET /dashboard` é removido da resposta; o frontend deixa de consumi-lo. O campo `pendingProjects` já existe e passa a ocupar o 4º metric card.

---

## Arquivos afetados

| Arquivo | Tipo de mudança |
|---|---|
| `apps/frontend/src/layouts/AuthenticatedLayout.tsx` | Header + sidebar visual |
| `apps/frontend/src/pages/SignInPage.tsx` | Tipografia leve |
| `apps/frontend/src/pages/DashboardPage.tsx` | Trocar blockedOscs por pendingProjects |
| `apps/frontend/src/pages/OscsPage.tsx` | Tabela → card grid + filtros |
| `apps/frontend/src/pages/ProjectsPage.tsx` | Nova tela (fase 6) |
| `apps/frontend/src/features/projects/CoordinatorProjectsView.tsx` | Atualizar ou substituir |
| `apps/frontend/src/features/dashboard/types.ts` | Remover campo blockedOscs |
| `apps/backend/src/projects/projects.service.ts` | Remover transição para BLOCKED |
| `apps/backend/src/dashboard/dashboard.service.ts` | Remover blockedOscs da query/resposta |
| `apps/backend/src/dashboard/*.dto.ts` | Remover campo blockedOscs |

---

## Fora de escopo

- Notificações (placeholder visual apenas, sem funcionalidade).
- Páginas Equipes, Formulários, Relatórios (placeholders desabilitados na sidebar).
- Telas do aluno (fase 7).
- Remoção do status `BLOCKED` do enum Prisma (manter para dados históricos).
