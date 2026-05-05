import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudentProjectCard } from './StudentProjectCard'
import type { Project } from '@/features/projects/types'

const mockProject: Project = {
  id: '1',
  name: 'Test Project',
  status: 'IN_PROGRESS',
  osc: { id: 'osc-1', name: 'Test OSC' },
  teams: [
    {
      id: 'team-1',
      semester: '2026.1',
      code: 'ABC123',
      members: [
        { id: 'user-1', name: 'Alice' },
        { id: 'user-2', name: 'Bob' },
      ],
    },
  ],
}

describe('StudentProjectCard', () => {
  it('renders project name and OSC', () => {
    render(<StudentProjectCard project={mockProject} />)
    expect(screen.getByText('Test Project')).toBeInTheDocument()
    expect(screen.getByText('Test OSC')).toBeInTheDocument()
  })

  it('renders team code', () => {
    render(<StudentProjectCard project={mockProject} />)
    expect(screen.getByText('ABC123')).toBeInTheDocument()
  })

  it('renders semester', () => {
    render(<StudentProjectCard project={mockProject} />)
    expect(screen.getByText('2026.1')).toBeInTheDocument()
  })

  it('renders member count', () => {
    render(<StudentProjectCard project={mockProject} />)
    expect(screen.getByText(/Você \+ 1/)).toBeInTheDocument()
  })

  it('renders copy button for team code', () => {
    render(<StudentProjectCard project={mockProject} />)
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument()
  })

  it('copies code to clipboard when copy button clicked', async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
    })
    render(<StudentProjectCard project={mockProject} />)
    await userEvent.click(screen.getByRole('button', { name: /copy/i }))
    expect(writeText).toHaveBeenCalledWith('ABC123')
  })
})
