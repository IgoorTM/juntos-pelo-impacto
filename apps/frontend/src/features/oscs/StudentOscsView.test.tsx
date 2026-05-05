import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { StudentOscsView } from './StudentOscsView'
import type { OscListPage } from './types'

vi.mock('./api', () => ({
  fetchOscs: vi.fn(),
}))

vi.mock('@/features/projects/api', () => ({
  createProject: vi.fn(),
}))

const emptyPage: OscListPage = {
  data: [],
  total: 0,
  page: 1,
  limit: 50,
  totalPages: 0,
}

function renderView() {
  return render(
    <MemoryRouter>
      <StudentOscsView />
    </MemoryRouter>,
  )
}

describe('StudentOscsView', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { fetchOscs } = await import('./api')
    vi.mocked(fetchOscs).mockResolvedValue(emptyPage)
  })

  it('renders header', () => {
    renderView()
    expect(screen.getByText('OSCs disponíveis')).toBeInTheDocument()
  })

  it('renders search input', () => {
    renderView()
    expect(screen.getByPlaceholderText(/Buscar OSC/i)).toBeInTheDocument()
  })
})
