import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router'
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return (first + last).toUpperCase()
}

function formatSemester(raw: string): string {
  return raw.replace('-', '.')
}

interface NavItem {
  label: string
  path: string
  icon: React.ElementType
  roles: UserRole[] | null
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['COORDINATOR', 'ADMIN'] },
  { label: 'OSCs', path: '/oscs', icon: Building2, roles: ['COORDINATOR', 'ADMIN'] },
  { label: 'Projetos', path: '/projects', icon: FolderKanban, roles: null },
]

function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles === null || item.roles.includes(role))
}

function SidebarNav({ role, collapsed }: { role: UserRole; collapsed: boolean }) {
  const location = useLocation()
  const items = navItemsForRole(role)

  return (
    <nav className="flex flex-col gap-1 px-3 py-2">
      {items.map(({ label, path, icon: Icon }) => {
        const isActive = location.pathname.startsWith(path)
        return (
          <Link
            key={path}
            to={path}
            className={[
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-active text-sidebar-active-fg'
                : 'text-sidebar-muted hover:bg-white/10 hover:text-sidebar-foreground',
            ].join(' ')}
            aria-label={collapsed ? label : undefined}
          >
            <Icon size={18} aria-hidden />
            {!collapsed && <span>{label}</span>}
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
          <div className="flex items-center gap-3">
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
            <div className="hidden items-center gap-1.5 rounded-md border border-border bg-muted/50 px-3 py-1.5 sm:flex">
              <span className="text-xs text-muted-foreground">Semestre em curso</span>
              <span className="h-3 w-px bg-border" />
              <span className="text-xs font-semibold tabular-nums text-foreground">
                {formatSemester(getCurrentSemester())}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {getInitials(user.name)}
              </div>
              <div className="hidden flex-col sm:flex">
                <span className="text-sm font-medium leading-tight">{user.name}</span>
                <span className="text-xs leading-tight text-muted-foreground">
                  {ROLE_LABEL[user.role]}
                </span>
              </div>
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
