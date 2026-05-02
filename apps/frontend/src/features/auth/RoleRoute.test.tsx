import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { AuthContext } from './AuthContext'
import type { AuthContextValue } from './AuthContext'
import { RoleRoute } from './RoleRoute'

function authContext(role: 'COORDINATOR' | 'STUDENT'): AuthContextValue {
  return {
    user: { id: '1', name: 'Test', email: 't@t.com', role },
    accessToken: 'tok',
    isAuthenticated: true,
    isLoading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }
}

function renderRoute(role: 'COORDINATOR' | 'STUDENT') {
  return render(
    <AuthContext.Provider value={authContext(role)}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<RoleRoute allowedRoles={['COORDINATOR']} />}>
            <Route path="/dashboard" element={<div>dashboard</div>} />
          </Route>
          <Route path="/projects" element={<div>projects</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

describe('RoleRoute', () => {
  it('renders outlet when role is allowed', () => {
    renderRoute('COORDINATOR')
    expect(screen.getByText('dashboard')).toBeInTheDocument()
  })

  it('redirects STUDENT to /projects when trying COORDINATOR route', () => {
    renderRoute('STUDENT')
    expect(screen.getByText('projects')).toBeInTheDocument()
    expect(screen.queryByText('dashboard')).not.toBeInTheDocument()
  })
})
