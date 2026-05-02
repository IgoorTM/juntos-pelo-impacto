import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { AuthContext } from '@/features/auth/AuthContext'
import type { AuthContextValue, AuthUser } from '@/features/auth/AuthContext'
import type { ApiError } from '@/lib/types'
import { SignInPage } from './SignInPage'

const coordinatorUser: AuthUser = { id: '1', name: 'Igor', email: 'i@b.com', role: 'COORDINATOR' }
const studentUser: AuthUser = { id: '2', name: 'Ana', email: 'a@b.com', role: 'STUDENT' }

function renderSignIn(signIn: AuthContextValue['signIn'] = vi.fn()) {
  const value: AuthContextValue = {
    user: null, accessToken: null, isAuthenticated: false, isLoading: false,
    signIn, signUp: vi.fn(), signOut: vi.fn(),
  }
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/sign-in']}>
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/dashboard" element={<div>dashboard</div>} />
          <Route path="/projects" element={<div>projects</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

describe('SignInPage', () => {
  it('renders email and password fields', () => {
    renderSignIn()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
  })

  it('shows validation errors when submitting empty form', async () => {
    renderSignIn()
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    expect(screen.getByText(/e-mail obrigatório/i)).toBeInTheDocument()
    expect(screen.getByText(/senha obrigatória/i)).toBeInTheDocument()
  })

  it('shows error for invalid email format', async () => {
    renderSignIn()
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'invalido')
    await userEvent.type(screen.getByLabelText(/senha/i), '123456')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    expect(screen.getByText(/e-mail inválido/i)).toBeInTheDocument()
  })

  it('redirects COORDINATOR to /dashboard on success', async () => {
    const signIn = vi.fn().mockResolvedValue(coordinatorUser)
    renderSignIn(signIn)
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'i@b.com')
    await userEvent.type(screen.getByLabelText(/senha/i), 'senha123')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    await waitFor(() => expect(screen.getByText('dashboard')).toBeInTheDocument())
  })

  it('redirects STUDENT to /projects on success', async () => {
    const signIn = vi.fn().mockResolvedValue(studentUser)
    renderSignIn(signIn)
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'a@b.com')
    await userEvent.type(screen.getByLabelText(/senha/i), 'senha123')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    await waitFor(() => expect(screen.getByText('projects')).toBeInTheDocument())
  })

  it('shows 401 error as credential feedback', async () => {
    const err: ApiError = { status: 401, message: 'Unauthorized' }
    const signIn = vi.fn().mockRejectedValue(err)
    renderSignIn(signIn)
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'i@b.com')
    await userEvent.type(screen.getByLabelText(/senha/i), 'errada')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    await waitFor(() => expect(screen.getByText(/e-mail ou senha incorretos/i)).toBeInTheDocument())
  })

  it('disables button during loading', async () => {
    let resolve!: (u: AuthUser) => void
    const signIn = vi.fn(() => new Promise<AuthUser>(r => { resolve = r }))
    renderSignIn(signIn)
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'i@b.com')
    await userEvent.type(screen.getByLabelText(/senha/i), 'senha123')
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }))
    expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled()
    resolve(coordinatorUser)
  })
})
