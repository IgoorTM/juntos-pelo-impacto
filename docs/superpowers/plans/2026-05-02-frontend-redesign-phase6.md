# Frontend Redesign + Fase 6 — Coordenador

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atualizar o visual do frontend para seguir o design de referência (Claude Design), implementar a tela de projetos do coordenador e corrigir a regra de liberação de OSC no backend.

**Architecture:** Sete tarefas independentes em sequência: duas de backend (projects service + dashboard service), cinco de frontend (tipos, layout, login, dashboard, OSCs). Cada tarefa termina com validação e commit.

**Spec:** `docs/superpowers/specs/2026-05-02-frontend-redesign-phase6-design.md`

**Tech Stack:** NestJS + Prisma (backend), React + Vite + Tailwind + shadcn/ui (frontend), Vitest, React Testing Library

---

## File Map

| Arquivo | Mudança |
|---|---|
| `apps/backend/src/projects/projects.service.ts` | Adiciona liberação de OSC em COMPLETED |
| `apps/backend/src/projects/projects.service.spec.ts` | Testes para nova lógica de OSC |
| `apps/backend/src/dashboard/dtos/dashboard-response.dto.ts` | Remove campo `blockedOscs` |
| `apps/backend/src/dashboard/dashboard.service.ts` | Remove `blockedOscs` da query e resposta |
| `apps/backend/src/dashboard/dashboard.service.spec.ts` | Remove assertions de `blockedOscs` |
| `apps/frontend/src/features/dashboard/types.ts` | Remove campo `blockedOscs` |
| `apps/frontend/src/pages/DashboardPage.tsx` | Troca 4º card por `pendingProjects` |
| `apps/frontend/src/features/projects/CoordinatorProjectsView.tsx` | Corrige `willReleaseOsc` para só COMPLETED |
| `apps/frontend/src/layouts/AuthenticatedLayout.tsx` | Redesign header + sidebar |
| `apps/frontend/src/pages/SignInPage.tsx` | Ajuste tipográfico no título |
| `apps/frontend/src/pages/OscsPage.tsx` | Tabela → card grid + barra de filtro |

---

## Task 1: Backend — Liberação de OSC ao concluir projeto

**Files:**
- Modify: `apps/backend/src/projects/projects.service.ts`
- Modify: `apps/backend/src/projects/projects.service.spec.ts`

- [ ] **Step 1: Escrever os testes novos para `updateStatus`**

Substituir o `describe('updateStatus', ...)` existente em `projects.service.spec.ts` por:

```typescript
describe('updateStatus', () => {
  beforeEach(() => {
    (prisma.$transaction as jest.Mock).mockImplementation(
      (fn: (tx: PrismaService) => Promise<unknown>) => fn(prisma),
    );
  });

  it('updates project status and returns the mapped project', async () => {
    const updated = { ...mockProjectFull, status: 'COMPLETED' as const };
    jest.spyOn(prisma.project, 'update').mockResolvedValue(updated as any);
    jest.spyOn(prisma.osc, 'update').mockResolvedValue({ ...mockOsc, status: 'AVAILABLE' as const });

    const result = await service.updateStatus('proj-1', ProjectStatus.COMPLETED);

    expect(result.status).toBe('COMPLETED');
  });

  it('updates OSC to AVAILABLE when project is set to COMPLETED', async () => {
    const updated = { ...mockProjectFull, status: 'COMPLETED' as const };
    jest.spyOn(prisma.project, 'update').mockResolvedValue(updated as any);
    jest.spyOn(prisma.osc, 'update').mockResolvedValue({ ...mockOsc, status: 'AVAILABLE' as const });

    await service.updateStatus('proj-1', ProjectStatus.COMPLETED);

    expect(prisma.osc.update).toHaveBeenCalledWith({
      where: { id: 'osc-1' },
      data: { status: 'AVAILABLE' },
    });
  });

  it('does not update OSC when project is set to ABANDONED', async () => {
    const updated = { ...mockProjectFull, status: 'ABANDONED' as const };
    jest.spyOn(prisma.project, 'update').mockResolvedValue(updated as any);
    const oscUpdateSpy = jest.spyOn(prisma.osc, 'update');

    await service.updateStatus('proj-1', ProjectStatus.ABANDONED);

    expect(oscUpdateSpy).not.toHaveBeenCalled();
  });

  it('does not update OSC when project is set to INCOMPLETE', async () => {
    const updated = { ...mockProjectFull, status: 'INCOMPLETE' as const };
    jest.spyOn(prisma.project, 'update').mockResolvedValue(updated as any);
    const oscUpdateSpy = jest.spyOn(prisma.osc, 'update');

    await service.updateStatus('proj-1', ProjectStatus.INCOMPLETE);

    expect(oscUpdateSpy).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when project does not exist', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Record not found',
      { code: 'P2025', clientVersion: '6.0.0' },
    );
    jest.spyOn(prisma.project, 'update').mockRejectedValue(prismaError);

    await expect(
      service.updateStatus('nope', ProjectStatus.COMPLETED),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws ConflictException on partial unique index violation', async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: '6.0.0' },
    );
    jest.spyOn(prisma.project, 'update').mockRejectedValue(prismaError);

    await expect(
      service.updateStatus('proj-1', ProjectStatus.IN_PROGRESS),
    ).rejects.toThrow(ConflictException);
  });
});
```

- [ ] **Step 2: Rodar os testes novos e confirmar que falham**

```bash
cd apps/backend && npx jest projects.service.spec --no-coverage 2>&1 | tail -20
```

Esperado: falha em "updates OSC to AVAILABLE" e "does not update OSC".

- [ ] **Step 3: Implementar a mudança em `projects.service.ts`**

Substituir a interface `ProjectRow` para incluir `oscId`:

```typescript
interface ProjectRow {
  id: string;
  name: string;
  status: ProjectStatus;
  oscId: string;
  osc: { id: string; name: string };
  teams: Array<{
    id: string;
    semester: string;
    code: string;
    members: Array<{ user: { id: string; name: string } }>;
  }>;
}
```

Substituir o método `updateStatus` completo:

```typescript
async updateStatus(id: string, status: ProjectStatus) {
  try {
    return await this.prisma.$transaction(async (tx) => {
      const project = await tx.project.update({
        where: { id },
        data: { status },
        include: this.projectInclude,
      }) as unknown as ProjectRow;

      if (status === ProjectStatus.COMPLETED) {
        await tx.osc.update({
          where: { id: project.oscId },
          data: { status: 'AVAILABLE' },
        });
      }

      return this.mapProject(project);
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === 'P2025')
        throw new NotFoundException('Project not found');
      if (e.code === 'P2002')
        throw new ConflictException('Unique constraint violation');
    }
    throw e;
  }
}
```

- [ ] **Step 4: Rodar os testes e confirmar que passam**

```bash
cd apps/backend && npx jest projects.service.spec --no-coverage 2>&1 | tail -20
```

Esperado: todos os testes em `projects.service.spec` passando.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/projects/projects.service.ts apps/backend/src/projects/projects.service.spec.ts
git commit -m "feat(backend): release OSC to AVAILABLE when project is completed"
```

---

## Task 2: Backend — Remover `blockedOscs` do dashboard

**Files:**
- Modify: `apps/backend/src/dashboard/dtos/dashboard-response.dto.ts`
- Modify: `apps/backend/src/dashboard/dashboard.service.ts`
- Modify: `apps/backend/src/dashboard/dashboard.service.spec.ts`

- [ ] **Step 1: Atualizar o teste para não exigir `blockedOscs`**

Em `dashboard.service.spec.ts`, atualizar o `beforeEach` do `getDashboard` para remover o mock de IN_PROGRESS:

```typescript
beforeEach(() => {
  jest.spyOn(prisma.osc, 'count').mockImplementation(((args?: {
    where?: { status?: string };
  }) => {
    if (!args?.where) return Promise.resolve(12);
    return Promise.resolve(9);
  }) as any);
  jest.spyOn(prisma.project, 'count').mockResolvedValue(3);
  jest
    .spyOn(prisma.appConfig, 'findFirst')
    .mockResolvedValue(mockAppConfig);
});
```

E na asserção do teste `'returns all metrics and signUp state'`, remover a linha `expect(result.blockedOscs).toBe(3)`:

```typescript
it('returns all metrics and signUp state', async () => {
  jest.spyOn(prisma.project, 'findMany').mockResolvedValue([]);

  const result = await service.getDashboard();

  expect(result.totalOscs).toBe(12);
  expect(result.activeProjects).toBe(3);
  expect(result.availableOscs).toBe(9);
  expect(result.signUp.enabled).toBe(false);
  expect(result.signUp.updatedAt).toEqual(mockAppConfig.updatedAt);
});
```

- [ ] **Step 2: Rodar os testes para confirmar que falham (pois o service ainda retorna blockedOscs)**

```bash
cd apps/backend && npx jest dashboard.service.spec --no-coverage 2>&1 | tail -20
```

Se os testes já passarem (campo extra ignorado pelo jest), pular para Step 3. Se falharem por TypeScript, continuar.

- [ ] **Step 3: Remover `blockedOscs` do DTO**

Em `dashboard-response.dto.ts`, remover os campos:

```typescript
export class DashboardResponseDto {
  @ApiProperty({ example: 12, description: 'Total number of registered OSCs' })
  totalOscs!: number;

  @ApiProperty({ example: 3, description: 'Projects with status IN_PROGRESS' })
  activeProjects!: number;

  @ApiProperty({ example: 9, description: 'OSCs with status AVAILABLE' })
  availableOscs!: number;

  @ApiProperty({
    example: 1,
    description:
      'IN_PROGRESS projects whose latest team belongs to a previous semester',
  })
  pendingProjects!: number;

  @ApiProperty({
    type: SignUpStatusDto,
    description: 'Current state of public sign-up toggle',
  })
  signUp!: SignUpStatusDto;
}
```

- [ ] **Step 4: Remover `blockedOscs` do service**

Em `dashboard.service.ts`, substituir o método `getDashboard` completo:

```typescript
async getDashboard(): Promise<DashboardResponseDto> {
  const currentSemester = getCurrentSemester();

  const [
    totalOscs,
    activeProjects,
    availableOscs,
    rawProjects,
    appConfig,
  ] = await Promise.all([
    this.prisma.osc.count(),
    this.prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
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
    availableOscs,
    pendingProjects,
    signUp: {
      enabled: appConfig.signUpEnabled,
      updatedAt: appConfig.updatedAt,
    },
  };
}
```

- [ ] **Step 5: Rodar todos os testes do backend**

```bash
cd apps/backend && npx jest --no-coverage 2>&1 | tail -20
```

Esperado: todos passando.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/dashboard/dtos/dashboard-response.dto.ts \
        apps/backend/src/dashboard/dashboard.service.ts \
        apps/backend/src/dashboard/dashboard.service.spec.ts
git commit -m "feat(backend): remove blockedOscs from dashboard response"
```

---

## Task 3: Frontend — Atualizar tipos do dashboard e 4º metric card

**Files:**
- Modify: `apps/frontend/src/features/dashboard/types.ts`
- Modify: `apps/frontend/src/pages/DashboardPage.tsx`

- [ ] **Step 1: Remover `blockedOscs` do tipo frontend**

Conteúdo completo de `apps/frontend/src/features/dashboard/types.ts`:

```typescript
export interface DashboardData {
  totalOscs: number
  activeProjects: number
  availableOscs: number
  pendingProjects: number
  signUp: {
    enabled: boolean
    updatedAt: string
  }
}
```

- [ ] **Step 2: Trocar o 4º metric card no `DashboardPage.tsx`**

Na seção de métricas do `DashboardPage.tsx`, localizar o card `blockedOscs` e substituir por `pendingProjects`:

```typescript
// Remover este card:
<MetricCard
  title="OSCs Bloqueadas"
  value={data?.blockedOscs ?? 0}
  icon={<Lock className="h-4 w-4" />}
/>

// Adicionar no lugar:
<MetricCard
  title="Projetos pendentes"
  value={data?.pendingProjects ?? 0}
  icon={<AlertTriangle className="h-4 w-4" />}
/>
```

Também remover o import de `Lock` se não for mais usado em outro lugar da mesma linha de import. Adicionar `AlertTriangle` ao import de lucide-react se ainda não estiver lá:

```typescript
import { Building2, FolderKanban, AlertTriangle, TrendingUp, Unlock } from 'lucide-react'
```

- [ ] **Step 3: Rodar os testes do frontend**

```bash
cd apps/frontend && npx vitest run --reporter=verbose 2>&1 | tail -30
```

Esperado: todos passando.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/features/dashboard/types.ts apps/frontend/src/pages/DashboardPage.tsx
git commit -m "feat(frontend): replace blockedOscs metric card with pendingProjects"
```

---

## Task 4: Frontend — Corrigir aviso de liberação de OSC no modal de status

**Files:**
- Modify: `apps/frontend/src/features/projects/CoordinatorProjectsView.tsx`

- [ ] **Step 1: Atualizar `willReleaseOsc` para refletir nova regra de negócio**

Localizar a linha:

```typescript
const willReleaseOsc = selected === 'COMPLETED' || selected === 'ABANDONED'
```

Substituir por:

```typescript
const willReleaseOsc = selected === 'COMPLETED'
```

- [ ] **Step 2: Confirmar que o texto do aviso ainda faz sentido**

O aviso exibido quando `confirming` é:
```
"Ao definir o status como [status], a OSC [nome] será liberada como disponível para novos projetos."
```
Isso só aparece agora para COMPLETED — correto.

- [ ] **Step 3: Rodar os testes do frontend**

```bash
cd apps/frontend && npx vitest run --reporter=verbose 2>&1 | tail -20
```

Esperado: todos passando.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/features/projects/CoordinatorProjectsView.tsx
git commit -m "fix(frontend): show OSC release warning only on COMPLETED status"
```

---

## Task 5: Frontend — Redesign do `AuthenticatedLayout`

**Files:**
- Modify: `apps/frontend/src/layouts/AuthenticatedLayout.tsx`

O objetivo é:
- Header: semestre à esquerda; nome + cargo + botão Sair à direita
- Sidebar expandida: nav items só com texto (sem ícones ao lado do label)
- Sidebar colapsada: apenas ícone centralizado
- Adicionar itens desabilitados ao nav do COORDINATOR: Equipes, Formulários, Relatórios

- [ ] **Step 1: Substituir o conteúdo completo de `AuthenticatedLayout.tsx`**

```typescript
import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router'
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Users,
  FileText,
  BarChart2,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/features/auth/AuthContext'
import { getCurrentSemester } from '@/lib/getCurrentSemester'
import type { UserRole } from '@/lib/types'

const ROLE_LABEL: Record<UserRole, string> = {
  COORDINATOR: 'Coordenador',
  ADMIN: 'Administrador',
  STUDENT: 'Aluno',
}

function formatSemester(raw: string): string {
  return raw.replace('-', '.')
}

interface NavItem {
  label: string
  path: string
  icon: React.ElementType
  roles: UserRole[] | null
  disabled?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['COORDINATOR', 'ADMIN'] },
  { label: 'OSCs', path: '/oscs', icon: Building2, roles: ['COORDINATOR', 'ADMIN'] },
  { label: 'Equipes', path: '/teams', icon: Users, roles: ['COORDINATOR', 'ADMIN'], disabled: true },
  { label: 'Projetos', path: '/projects', icon: FolderKanban, roles: null },
  { label: 'Formulários', path: '/forms', icon: FileText, roles: ['COORDINATOR', 'ADMIN'], disabled: true },
  { label: 'Relatórios', path: '/reports', icon: BarChart2, roles: ['COORDINATOR', 'ADMIN'], disabled: true },
]

function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles === null || item.roles.includes(role))
}

function SidebarNav({ role, collapsed }: { role: UserRole; collapsed: boolean }) {
  const location = useLocation()
  const items = navItemsForRole(role)

  return (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {items.map(({ label, path, icon: Icon, disabled }) => {
        if (disabled) {
          return (
            <div
              key={path}
              className={[
                'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium',
                'cursor-not-allowed select-none opacity-40 text-sidebar-muted',
                collapsed ? 'justify-center' : '',
              ].join(' ')}
              aria-disabled="true"
            >
              {collapsed ? <Icon size={18} aria-hidden /> : <span>{label}</span>}
            </div>
          )
        }

        const isActive = location.pathname.startsWith(path)
        return (
          <Link
            key={path}
            to={path}
            className={[
              'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              collapsed ? 'justify-center' : '',
              isActive
                ? 'bg-sidebar-active text-sidebar-active-fg'
                : 'text-sidebar-muted hover:bg-white/10 hover:text-sidebar-foreground',
            ].join(' ')}
            aria-label={collapsed ? label : undefined}
          >
            {collapsed ? <Icon size={18} aria-hidden /> : <span>{label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={collapsed ? 'px-2 pt-6 pb-5' : 'px-5 pt-6 pb-5'}>
      {collapsed ? (
        <span className="block text-center text-lg font-bold text-sidebar-foreground">J</span>
      ) : (
        <>
          <p className="text-sm font-bold leading-tight text-sidebar-foreground">Juntos pelo Impacto</p>
          <p className="mt-1 text-xs text-sidebar-muted">Sistema de gestão</p>
        </>
      )}
    </div>
  )
}

export function AuthenticatedLayout() {
  const { user, signOut } = useAuth()

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true'
  })

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }, [collapsed])

  if (!user) return null

  return (
    <div className="flex h-screen">
      <aside
        className={[
          'hidden flex-col bg-sidebar transition-all duration-200 md:flex',
          collapsed ? 'w-14' : 'w-56',
        ].join(' ')}
      >
        <SidebarBrand collapsed={collapsed} />
        <SidebarNav role={user.role} collapsed={collapsed} />
        <div className="mt-auto p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((c) => !c)}
            className="text-sidebar-muted hover:bg-white/10 hover:text-sidebar-foreground"
            aria-label={collapsed ? 'Expandir sidebar' : 'Retrair sidebar'}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-6">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger
                render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu" />}
              >
                <Menu size={18} />
              </SheetTrigger>
              <SheetContent side="left" className="w-56 bg-sidebar p-0 pt-5">
                <SidebarBrand collapsed={false} />
                <SidebarNav role={user.role} collapsed={false} />
              </SheetContent>
            </Sheet>
            <div>
              <p className="text-xs text-muted-foreground">Semestre em curso</p>
              <p className="text-sm font-semibold tabular-nums">
                {formatSemester(getCurrentSemester())}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden flex-col items-end sm:flex">
              <span className="text-sm font-medium leading-tight">{user.name}</span>
              <span className="text-xs leading-tight text-muted-foreground">
                {ROLE_LABEL[user.role]}
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={signOut} aria-label="Sair">
              <LogOut size={14} />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Rodar os testes do layout**

```bash
cd apps/frontend && npx vitest run layouts/AuthenticatedLayout --reporter=verbose 2>&1 | tail -30
```

Esperado: todos os 5 testes passando. Se o teste `'shows app name'` falhar porque o sidebar mobile (SheetContent) renderiza fora do DOM visível, investigar antes de continuar.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/layouts/AuthenticatedLayout.tsx
git commit -m "feat(frontend): redesign header and sidebar to match design reference"
```

---

## Task 6: Frontend — Ajuste tipográfico na `SignInPage`

**Files:**
- Modify: `apps/frontend/src/pages/SignInPage.tsx`

- [ ] **Step 1: Atualizar o título do card**

Localizar:

```typescript
<CardTitle className="text-center text-lg font-semibold">
  Projeto Juntos pelo Impacto
</CardTitle>
```

Substituir por:

```typescript
<CardTitle className="text-center text-xl font-bold">
  Projeto Juntos pelo Impacto
</CardTitle>
```

- [ ] **Step 2: Rodar os testes da página de login**

```bash
cd apps/frontend && npx vitest run pages/SignInPage --reporter=verbose 2>&1 | tail -20
```

Esperado: todos os 7 testes passando.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/pages/SignInPage.tsx
git commit -m "style(frontend): increase sign-in title weight and size"
```

---

## Task 7: Frontend — OscsPage: tabela → card grid com filtros

**Files:**
- Modify: `apps/frontend/src/pages/OscsPage.tsx`

A tabela é substituída por cards em grid de 2 colunas. Uma barra de filtros (busca local + dropdown de status) fica acima do grid. Todos os dialogs de criação e edição são mantidos sem alteração.

- [ ] **Step 1: Substituir o conteúdo completo de `OscsPage.tsx`**

```typescript
import { useEffect, useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { fetchOscs, createOsc, updateOsc } from '@/features/oscs/api'
import type { Osc, OscStatus, CreateOscDto, UpdateOscDto } from '@/features/oscs/types'

const OSC_STATUS_LABEL: Record<OscStatus, string> = {
  AVAILABLE: 'Disponível',
  IN_PROGRESS: 'Em andamento',
  BLOCKED: 'Bloqueada',
}

const OSC_STATUS_TONE: Record<OscStatus, 'green' | 'blue' | 'red'> = {
  AVAILABLE: 'green',
  IN_PROGRESS: 'blue',
  BLOCKED: 'red',
}

interface OscFormState {
  name: string
  description: string
  email: string
  phone: string
  status: OscStatus
}

const EMPTY_FORM: OscFormState = {
  name: '',
  description: '',
  email: '',
  phone: '',
  status: 'AVAILABLE',
}

interface OscFormDialogProps {
  open: boolean
  onClose: () => void
  onSave: (form: OscFormState) => Promise<void>
  initial?: OscFormState
  title: string
  saving: boolean
  error: string | null
  showStatus?: boolean
}

function OscFormDialog({
  open,
  onClose,
  onSave,
  initial = EMPTY_FORM,
  title,
  saving,
  error,
  showStatus = false,
}: OscFormDialogProps) {
  const [form, setForm] = useState<OscFormState>(initial)
  const [validationError, setValidationError] = useState<string | null>(null)

  function set(field: keyof OscFormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) {
      setValidationError('Nome é obrigatório.')
      return
    }
    if (!form.description.trim()) {
      setValidationError('Descrição é obrigatória.')
      return
    }
    setValidationError(null)
    await onSave(form)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome"
            value={form.name}
            onChange={set('name')}
            disabled={saving}
            required
          />
          <div className="space-y-1">
            <label className="text-sm font-medium leading-none">Descrição</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              disabled={saving}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              required
            />
          </div>
          <Input
            label="E-mail (opcional)"
            type="email"
            value={form.email}
            onChange={set('email')}
            disabled={saving}
          />
          <Input
            label="Telefone (opcional)"
            value={form.phone}
            onChange={set('phone')}
            disabled={saving}
          />
          {showStatus && (
            <div className="space-y-1">
              <label className="text-sm font-medium leading-none">Status</label>
              <select
                value={form.status}
                onChange={set('status')}
                disabled={saving}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="AVAILABLE">Disponível</option>
                <option value="IN_PROGRESS">Em andamento</option>
                <option value="BLOCKED">Bloqueada</option>
              </select>
            </div>
          )}
          {(validationError || error) && (
            <p className="text-sm text-destructive">{validationError ?? error}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function OscCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-7 w-7 rounded-md" />
        </div>
        <Skeleton className="mt-3 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-3/4" />
      </CardContent>
    </Card>
  )
}

interface OscCardProps {
  osc: Osc
  onEdit: (osc: Osc) => void
}

function OscCard({ osc, onEdit }: OscCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{osc.name}</p>
            <Badge tone={OSC_STATUS_TONE[osc.status]} className="mt-1">
              {OSC_STATUS_LABEL[osc.status]}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(osc)}
            aria-label={`Editar ${osc.name}`}
            className="shrink-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{osc.description}</p>
        {(osc.email || osc.phone) && (
          <div className="mt-3 space-y-0.5 text-xs text-muted-foreground">
            {osc.email && <p>{osc.email}</p>}
            {osc.phone && <p>{osc.phone}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function OscsPage() {
  const [oscs, setOscs] = useState<Osc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<OscStatus | ''>('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const [editTarget, setEditTarget] = useState<Osc | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    fetchOscs()
      .then(setOscs)
      .catch(() => setError('Não foi possível carregar as OSCs.'))
      .finally(() => setLoading(false))
  }, [retryCount])

  function handleRetry() {
    setLoading(true)
    setError(null)
    setRetryCount((c) => c + 1)
  }

  async function handleCreate(form: OscFormState) {
    setCreating(true)
    setCreateError(null)
    const dto: CreateOscDto = {
      name: form.name.trim(),
      description: form.description.trim(),
      ...(form.email.trim() && { email: form.email.trim() }),
      ...(form.phone.trim() && { phone: form.phone.trim() }),
    }
    try {
      const created = await createOsc(dto)
      setOscs((prev) => [...prev, created])
      setCreateOpen(false)
    } catch (err: unknown) {
      const apiErr = err as { status?: number }
      setCreateError(
        apiErr?.status === 409 ? 'Já existe uma OSC com esse nome.' : 'Erro ao criar OSC.',
      )
    } finally {
      setCreating(false)
    }
  }

  async function handleEdit(form: OscFormState) {
    if (!editTarget) return
    setEditing(true)
    setEditError(null)
    const dto: UpdateOscDto = {
      name: form.name.trim(),
      description: form.description.trim(),
      status: form.status,
      ...(form.email.trim() ? { email: form.email.trim() } : { email: undefined }),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : { phone: undefined }),
    }
    try {
      const updated = await updateOsc(editTarget.id, dto)
      setOscs((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
      setEditTarget(null)
    } catch (err: unknown) {
      const apiErr = err as { status?: number }
      setEditError(
        apiErr?.status === 409 ? 'Já existe uma OSC com esse nome.' : 'Erro ao salvar alterações.',
      )
    } finally {
      setEditing(false)
    }
  }

  const filteredOscs = oscs
    .filter((o) => !search || o.name.toLowerCase().includes(search.toLowerCase()))
    .filter((o) => !statusFilter || o.status === statusFilter)

  const editInitial: OscFormState | undefined = editTarget
    ? {
        name: editTarget.name,
        description: editTarget.description,
        email: editTarget.email ?? '',
        phone: editTarget.phone ?? '',
        status: editTarget.status,
      }
    : undefined

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">OSCs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organizações da Sociedade Civil parceiras do programa.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar OSC..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as OscStatus | '')}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Todos os status</option>
          <option value="AVAILABLE">Disponível</option>
          <option value="IN_PROGRESS">Em andamento</option>
          <option value="BLOCKED">Bloqueada</option>
        </select>
        <Button onClick={() => setCreateOpen(true)} className="ml-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova OSC
        </Button>
      </div>

      {error && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-4" onClick={handleRetry}>
            Tentar novamente
          </Button>
        </div>
      )}

      {!error && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <OscCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredOscs.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {oscs.length === 0 ? 'Nenhuma OSC cadastrada.' : 'Nenhuma OSC encontrada para os filtros aplicados.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filteredOscs.map((osc) => (
                <OscCard key={osc.id} osc={osc} onEdit={setEditTarget} />
              ))}
            </div>
          )}
        </>
      )}

      <OscFormDialog
        key={createOpen ? 'create-open' : 'create-closed'}
        open={createOpen}
        onClose={() => {
          setCreateOpen(false)
          setCreateError(null)
        }}
        onSave={handleCreate}
        title="Nova OSC"
        saving={creating}
        error={createError}
      />

      <OscFormDialog
        key={editTarget?.id ?? 'edit-closed'}
        open={!!editTarget}
        onClose={() => {
          setEditTarget(null)
          setEditError(null)
        }}
        onSave={handleEdit}
        initial={editInitial}
        title="Editar OSC"
        saving={editing}
        error={editError}
        showStatus
      />
    </div>
  )
}
```

- [ ] **Step 2: Rodar os testes do frontend**

```bash
cd apps/frontend && npx vitest run --reporter=verbose 2>&1 | tail -20
```

Esperado: todos passando.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/pages/OscsPage.tsx
git commit -m "feat(frontend): replace OSC table with card grid and add search/filter bar"
```

---

## Validação Final

- [ ] **Step 1: Executar validação completa (requer banco rodando)**

Na raiz do monorepo, com o banco Postgres ativo (`npm run docker:db`):

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Esperado: zero erros de tipo, zero warnings de lint, todos os testes passando, builds do frontend e backend concluídos.

- [ ] **Step 2: Subir o ambiente de desenvolvimento e testar visualmente**

```bash
npm run docker:dev
```

Verificar:
1. `/sign-in` — título maior e em bold
2. Login como COORDINATOR → redirect para `/dashboard`
3. Sidebar: itens de texto sem ícones no modo expandido; ícones no modo colapsado; itens desabilitados visíveis mas não clicáveis
4. Header: semestre à esquerda, nome + cargo + "Sair" à direita
5. `/dashboard` — 4 cards: Total OSCs, Projetos Ativos, OSCs Disponíveis, Projetos pendentes
6. `/oscs` — card grid com busca e filtro funcionando
7. `/projects` — card por projeto; modal de status mostra aviso de OSC apenas para COMPLETED
