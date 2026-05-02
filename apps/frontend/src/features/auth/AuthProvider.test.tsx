import { render, screen, waitFor, act } from '@testing-library/react'
import MockAdapter from 'axios-mock-adapter'
import { httpClient } from '@/lib/httpClient'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './AuthContext'

const mock = new MockAdapter(httpClient)

function TestConsumer() {
  const { user, isAuthenticated, isLoading } = useAuth()
  if (isLoading) return <div>loading</div>
  return <div>{isAuthenticated ? `user:${user!.name}` : 'anonymous'}</div>
}

function SignInConsumer() {
  const { signIn } = useAuth()
  return (
    <button onClick={() => signIn('a@b.com', 'pass')}>signin</button>
  )
}

function SignOutConsumer() {
  const { signOut, isAuthenticated } = useAuth()
  return (
    <>
      <span>{isAuthenticated ? 'in' : 'out'}</span>
      <button onClick={signOut}>signout</button>
    </>
  )
}

afterEach(() => {
  mock.reset()
  localStorage.clear()
})

describe('AuthProvider', () => {
  it('boots as anonymous when no token in localStorage', async () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument())
  })

  it('boots as authenticated when token is valid', async () => {
    localStorage.setItem('accessToken', 'valid-token')
    mock.onGet('/auth/me').reply(200, { id: '1', name: 'Igor', email: 'i@b.com', role: 'COORDINATOR' })

    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('user:Igor')).toBeInTheDocument())
  })

  it('clears token and boots as anonymous when GET /auth/me fails', async () => {
    localStorage.setItem('accessToken', 'expired-token')
    mock.onGet('/auth/me').reply(401)

    render(<AuthProvider><TestConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument())
    expect(localStorage.getItem('accessToken')).toBeNull()
  })

  it('signIn sets user and persists token', async () => {
    mock.onPost('/auth/sign-in').reply(200, {
      accessToken: 'tok123',
      user: { id: '2', name: 'Ana', email: 'a@b.com', role: 'STUDENT' },
    })

    render(<AuthProvider><TestConsumer /><SignInConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('anonymous')).toBeInTheDocument())

    await act(async () => {
      screen.getByRole('button', { name: 'signin' }).click()
    })

    await waitFor(() => expect(screen.getByText('user:Ana')).toBeInTheDocument())
    expect(localStorage.getItem('accessToken')).toBe('tok123')
  })

  it('signOut clears user and removes token', async () => {
    localStorage.setItem('accessToken', 'tok')
    mock.onGet('/auth/me').reply(200, { id: '1', name: 'Igor', email: 'i@b.com', role: 'COORDINATOR' })

    render(<AuthProvider><SignOutConsumer /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('in')).toBeInTheDocument())

    await act(async () => {
      screen.getByRole('button', { name: 'signout' }).click()
    })

    expect(screen.getByText('out')).toBeInTheDocument()
    expect(localStorage.getItem('accessToken')).toBeNull()
  })
})
