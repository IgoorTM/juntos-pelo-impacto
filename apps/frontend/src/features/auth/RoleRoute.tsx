import { Navigate, Outlet } from 'react-router'
import { useAuth } from './AuthContext'
import type { UserRole } from '@/lib/types'

interface RoleRouteProps {
  allowedRoles: UserRole[]
}

const roleHome: Record<UserRole, string> = {
  COORDINATOR: '/dashboard',
  STUDENT: '/projects',
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/sign-in" replace />
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={roleHome[user.role]} replace />
  }
  return <Outlet />
}
