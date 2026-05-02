import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthenticatedLayout } from '@/layouts/AuthenticatedLayout'

// Public pages — implemented in Phase 5
const SignInPage = () => <p>Sign In</p>
const SignUpPage = () => <p>Sign Up</p>

// Protected pages — implemented in Phases 6 and 7
const DashboardPage = () => <p>Dashboard</p>
const OscsPage = () => <p>OSCs</p>
const ProjectsPage = () => <p>Projects</p>

// AuthProvider wraps this tree in Phase 5
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />

        {/* PrivateRoute + RoleRoute guards added in Phase 5 */}
        <Route element={<AuthenticatedLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/oscs" element={<OscsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/sign-in" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
