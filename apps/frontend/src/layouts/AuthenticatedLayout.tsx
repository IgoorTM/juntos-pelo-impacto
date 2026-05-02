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
import type { UserRole } from '@/lib/types'

interface NavItem {
  label: string
  path: string
  icon: React.ElementType
  roles: UserRole[] | null
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['COORDINATOR'] },
  { label: 'OSCs', path: '/oscs', icon: Building2, roles: ['COORDINATOR'] },
  { label: 'Projetos', path: '/projects', icon: FolderKanban, roles: null },
]

function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles === null || item.roles.includes(role))
}

function SidebarNav({ role, collapsed }: { role: UserRole; collapsed: boolean }) {
  const location = useLocation()
  const items = navItemsForRole(role)

  return (
    <nav className="flex flex-col gap-1 p-2">
      {items.map(({ label, path, icon: Icon }) => {
        const isActive = location.pathname.startsWith(path)
        return (
          <Link
            key={path}
            to={path}
            className={[
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
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
    <div className={`px-4 pt-5 pb-4 ${collapsed ? 'px-2' : ''}`}>
      {collapsed ? (
        <span className="block text-center text-lg font-bold text-sidebar-foreground">J</span>
      ) : (
        <>
          <p className="text-sm font-bold leading-tight text-sidebar-foreground">Juntos pelo Impacto</p>
          <p className="mt-0.5 text-xs text-sidebar-muted">Sistema de gestão</p>
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
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center justify-between border-b bg-card px-4">
        <div className="flex items-center gap-2">
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
          <span className="font-semibold text-foreground md:hidden">Juntos pelo Impacto</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{user.name}</span>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair">
            <LogOut size={16} />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
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

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
