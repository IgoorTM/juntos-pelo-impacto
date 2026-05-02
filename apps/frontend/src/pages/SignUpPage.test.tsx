import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { AuthContext } from '@/features/auth/AuthContext'
import type { AuthContextValue } from '@/features/auth/AuthContext'
import type { ApiError } from '@/lib/types'
import { SignUpPage } from './SignUpPage'

function renderSignUp(signUp: AuthContextValue['signUp'] = vi.fn()) {
  const value: AuthContextValue = {
    user: null, accessToken: null, isAuthenticated: false, isLoading: false,
    signIn: vi.fn(), signUp, signOut: vi.fn(),
  }
  return render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/sign-up']}>
        <Routes>
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/sign-in" element={<div>sign in page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  )
}

describe('SignUpPage', () => {
  it('renders name, email and password fields', () => {
    renderSignUp()
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
  })

  it('shows validation errors when submitting empty form', async () => {
    renderSignUp()
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }))
    expect(screen.getByText(/nome obrigatório/i)).toBeInTheDocument()
    expect(screen.getByText(/e-mail obrigatório/i)).toBeInTheDocument()
    expect(screen.getByText(/senha obrigatória/i)).toBeInTheDocument()
  })

  it('redirects to /sign-in on success', async () => {
    const signUp = vi.fn().mockResolvedValue(undefined)
    renderSignUp(signUp)
    await userEvent.type(screen.getByLabelText(/nome/i), 'Ana')
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'ana@b.com')
    await userEvent.type(screen.getByLabelText(/senha/i), 'senha123')
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }))
    await waitFor(() => expect(screen.getByText('sign in page')).toBeInTheDocument())
  })

  it('shows 403 as "Cadastro desabilitado no momento"', async () => {
    const err: ApiError = { status: 403, message: 'Forbidden' }
    const signUp = vi.fn().mockRejectedValue(err)
    renderSignUp(signUp)
    await userEvent.type(screen.getByLabelText(/nome/i), 'Ana')
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'ana@b.com')
    await userEvent.type(screen.getByLabelText(/senha/i), 'senha123')
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }))
    await waitFor(() => expect(screen.getByText(/cadastro desabilitado no momento/i)).toBeInTheDocument())
  })

  it('shows 409 as "E-mail já cadastrado"', async () => {
    const err: ApiError = { status: 409, message: 'Conflict' }
    const signUp = vi.fn().mockRejectedValue(err)
    renderSignUp(signUp)
    await userEvent.type(screen.getByLabelText(/nome/i), 'Ana')
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'ana@b.com')
    await userEvent.type(screen.getByLabelText(/senha/i), 'senha123')
    await userEvent.click(screen.getByRole('button', { name: /criar conta/i }))
    await waitFor(() => expect(screen.getByText(/e-mail já cadastrado/i)).toBeInTheDocument())
  })
})
