import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { AuthenticatedLayout } from './AuthenticatedLayout'

function renderLayout(role: 'COORDINATOR' | 'STUDENT') {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthenticatedLayout user={{ name: 'Test User', role }} onSignOut={() => {}} />
    </MemoryRouter>
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

  it('calls onSignOut when logout button is clicked', async () => {
    const onSignOut = vi.fn()
    render(
      <MemoryRouter>
        <AuthenticatedLayout user={{ name: 'Test User', role: 'COORDINATOR' }} onSignOut={onSignOut} />
      </MemoryRouter>
    )
    await userEvent.click(screen.getByRole('button', { name: /sair/i }))
    expect(onSignOut).toHaveBeenCalledOnce()
  })

  it('toggles sidebar collapse when toggle button is clicked', async () => {
    renderLayout('COORDINATOR')
    const toggle = screen.getByRole('button', { name: /retrair sidebar/i })
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveTextContent('Dashboard')
    await userEvent.click(toggle)
    expect(screen.getByRole('button', { name: /expandir sidebar/i })).toBeInTheDocument()
  })
})
