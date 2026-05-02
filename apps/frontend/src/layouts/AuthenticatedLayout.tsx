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
      {items.map(({ label, path, icon: Icon }) => (
        <Link
          key={path}
          to={path}
          className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-100 ${
            location.pathname.startsWith(path)
              ? 'bg-primary-100 text-primary-700'
              : 'text-neutral-900'
          }`}
          aria-label={collapsed ? label : undefined}
        >
          <Icon size={18} aria-hidden />
          {!collapsed && <span>{label}</span>}
        </Link>
      ))}
    </nav>
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
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger
              render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu" />}
            >
              <Menu size={18} />
            </SheetTrigger>
            <SheetContent side="left" className="w-56 p-0 pt-14">
              <SidebarNav role={user.role} collapsed={false} />
            </SheetContent>
          </Sheet>
          <span className="font-semibold text-primary-700">Juntos pelo Impacto</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-900">{user.name}</span>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair">
            <LogOut size={16} />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`hidden flex-col border-r transition-all duration-200 md:flex ${
            collapsed ? 'w-14' : 'w-56'
          }`}
        >
          <SidebarNav role={user.role} collapsed={collapsed} />
          <div className="mt-auto p-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed((c) => !c)}
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
