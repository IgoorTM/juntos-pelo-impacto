import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudentOscCard } from './StudentOscCard'
import type { Osc } from '@/features/oscs/types'

const mockOsc: Osc = {
  id: 'osc-1',
  name: 'Instituto Teste',
  description: 'Organização de teste',
  email: 'contato@test.org',
  phone: '(11) 1234-5678',
  category: 'EDUCACAO',
  status: 'AVAILABLE',
  projectCount: 2,
}

describe('StudentOscCard', () => {
  it('renders OSC name and description', () => {
    render(<StudentOscCard osc={mockOsc} onInitiate={vi.fn()} />)
    expect(screen.getByText('Instituto Teste')).toBeInTheDocument()
    expect(screen.getByText('Organização de teste')).toBeInTheDocument()
  })

  it('renders category label', () => {
    render(<StudentOscCard osc={mockOsc} onInitiate={vi.fn()} />)
    expect(screen.getByText('Educação')).toBeInTheDocument()
  })

  it('renders email and phone', () => {
    render(<StudentOscCard osc={mockOsc} onInitiate={vi.fn()} />)
    expect(screen.getByText('contato@test.org')).toBeInTheDocument()
    expect(screen.getByText('(11) 1234-5678')).toBeInTheDocument()
  })

  it('renders project count', () => {
    render(<StudentOscCard osc={mockOsc} onInitiate={vi.fn()} />)
    expect(screen.getByText(/2 projetos no histórico/)).toBeInTheDocument()
  })

  it('calls onInitiate when button clicked', async () => {
    const onInitiate = vi.fn()
    render(<StudentOscCard osc={mockOsc} onInitiate={onInitiate} />)
    await userEvent.click(screen.getByRole('button', { name: /Iniciar projeto/i }))
    expect(onInitiate).toHaveBeenCalledWith(mockOsc)
  })

  it('renders "Sem histórico" when projectCount is 0', () => {
    const oscNoProjects = { ...mockOsc, projectCount: 0 }
    render(<StudentOscCard osc={oscNoProjects} onInitiate={vi.fn()} />)
    expect(screen.getByText('Sem histórico')).toBeInTheDocument()
  })
})
