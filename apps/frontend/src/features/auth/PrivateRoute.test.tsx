import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { AuthContext } from './AuthContext'
import type { AuthContextValue } from './AuthContext'
import { PrivateRoute } from './PrivateRoute'

function authContext(overrides: Partial<AuthContextValue>): AuthContextValue {
  return {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  }
}

function renderRoute(value: AuthContextValue) {
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/protected" element={<div>protected content</div>} />
          </Route>
          <Route path="/sign-in" element={<div>sign in page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

describe('PrivateRoute', () => {
  it('shows loading spinner while booting', () => {
    renderRoute(authContext({ isLoading: true }))
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })

  it('redirects to /sign-in when not authenticated', () => {
    renderRoute(authContext({ isAuthenticated: false }))
    expect(screen.getByText('sign in page')).toBeInTheDocument()
    expect(screen.queryByText('protected content')).not.toBeInTheDocument()
  })

  it('renders outlet when authenticated', () => {
    renderRoute(authContext({
      isAuthenticated: true,
      user: { id: '1', name: 'Igor', email: 'i@b.com', role: 'COORDINATOR' },
    }))
    expect(screen.getByText('protected content')).toBeInTheDocument()
  })
})
