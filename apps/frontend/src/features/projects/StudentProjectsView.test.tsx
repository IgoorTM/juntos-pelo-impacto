import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { StudentProjectsView } from './StudentProjectsView'

vi.mock('./api', () => ({
  fetchStudentProjects: vi.fn(),
}))

vi.mock('@/features/teams/api', () => ({
  joinTeam: vi.fn(),
}))

function renderView() {
  return render(
    <MemoryRouter>
      <StudentProjectsView />
    </MemoryRouter>,
  )
}

describe('StudentProjectsView', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { fetchStudentProjects } = await import('./api')
    vi.mocked(fetchStudentProjects).mockResolvedValue([])
  })

  it('renders header', () => {
    renderView()
    expect(screen.getByText('Seus projetos')).toBeInTheDocument()
  })

  it('renders 3 action cards', () => {
    renderView()
    expect(screen.getByText('Criar novo projeto')).toBeInTheDocument()
    expect(screen.getByText('Entrar em equipe')).toBeInTheDocument()
    expect(screen.getByText('Continuar projeto')).toBeInTheDocument()
  })

  it('renders "Meus projetos" section', async () => {
    renderView()
    await waitFor(() => {
      expect(
        screen.getByText(/Meus projetos neste semestre/i),
      ).toBeInTheDocument()
    })
  })
})
