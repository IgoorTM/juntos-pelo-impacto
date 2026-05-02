import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { AuthContext } from '@/features/auth/AuthContext'
import type { AuthContextValue } from '@/features/auth/AuthContext'
import { AuthenticatedLayout } from './AuthenticatedLayout'
import type { UserRole } from '@/lib/types'

function mockAuthValue(role: UserRole, signOut = vi.fn()): AuthContextValue {
  return {
    user: { id: '1', name: 'Test User', email: 'test@example.com', role },
    accessToken: 'token',
    isAuthenticated: true,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut,
  }
}

function renderLayout(role: UserRole, signOut = vi.fn()) {
  return render(
    <AuthContext.Provider value={mockAuthValue(role, signOut)}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthenticatedLayout />
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

describe('AuthenticatedLayout', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows app name in header', () => {
    renderLayout('COORDINATOR')
    expect(screen.getByText('Juntos pelo Impacto')).toBeInTheDocument()
  })

  it('shows user name in header', () => {
    renderLayout('COORDINATOR')
    expect(screen.getByText('Test User')).toBeInTheDocument()
  })

  it('renders Dashboard, OSCs and Projetos links for COORDINATOR', () => {
    renderLayout('COORDINATOR')
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /oscs/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /projetos/i })).toBeInTheDocument()
  })

  it('renders only Projetos link for STUDENT', () => {
    renderLayout('STUDENT')
    expect(screen.queryByRole('link', { name: /dashboard/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /oscs/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /projetos/i })).toBeInTheDocument()
  })

  it('calls signOut when logout button is clicked', async () => {
    const signOut = vi.fn()
    renderLayout('COORDINATOR', signOut)
    await userEvent.click(screen.getByRole('button', { name: /sair/i }))
    expect(signOut).toHaveBeenCalledOnce()
  })

  it('toggles sidebar collapse when toggle button is clicked', async () => {
    renderLayout('COORDINATOR')
    const toggle = screen.getByRole('button', { name: /retrair sidebar/i })
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveTextContent('Dashboard')
    await userEvent.click(toggle)
    expect(screen.getByRole('button', { name: /expandir sidebar/i })).toBeInTheDocument()
  })
})
