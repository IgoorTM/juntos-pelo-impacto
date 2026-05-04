import { useAuth } from '@/features/auth/AuthContext'
import { CoordinatorProjectsView } from '@/features/projects/CoordinatorProjectsView'
import { StudentProjectsView } from '@/features/projects/StudentProjectsView'

export function ProjectsPage() {
  const { user } = useAuth()

  if (user?.role === 'COORDINATOR' || user?.role === 'ADMIN') return <CoordinatorProjectsView />
  return <StudentProjectsView />
}
