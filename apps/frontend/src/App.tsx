import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { PrivateRoute } from '@/features/auth/PrivateRoute'
import { RoleRoute } from '@/features/auth/RoleRoute'
import { AuthenticatedLayout } from '@/layouts/AuthenticatedLayout'
import { SignInPage } from '@/pages/SignInPage'
import { SignUpPage } from '@/pages/SignUpPage'

const DashboardPage = () => <p>Dashboard (Fase 6)</p>
const OscsPage = () => <p>OSCs (Fase 6)</p>
const ProjectsPage = () => <p>Projects (Fase 6/7)</p>

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />

          <Route element={<PrivateRoute />}>
            <Route element={<AuthenticatedLayout />}>
              <Route element={<RoleRoute allowedRoles={['COORDINATOR']} />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/oscs" element={<OscsPage />} />
              </Route>
              <Route path="/projects" element={<ProjectsPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/sign-in" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
