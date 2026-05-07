import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateProjectModal } from './CreateProjectModal'
import type { Osc } from '@/features/oscs/types'

const mockOsc: Osc = {
  id: 'osc-1',
  name: 'Test OSC',
  description: 'Test',
  email: null,
  phone: null,
  category: 'EDUCACAO',
  status: 'AVAILABLE',
  projectCount: 0,
}

describe('CreateProjectModal', () => {
  it('renders when open prop is true', () => {
    render(
      <CreateProjectModal
        open
        osc={mockOsc}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('does not render when open prop is false', () => {
    render(
      <CreateProjectModal
        open={false}
        osc={null}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('displays OSC name in description', () => {
    render(
      <CreateProjectModal
        open
        osc={mockOsc}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.getByText(mockOsc.name)).toBeInTheDocument()
  })

  it('calls onSubmit with name and description on form submit', async () => {
    const onSubmit = vi.fn()
    render(
      <CreateProjectModal
        open
        osc={mockOsc}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    )
    await userEvent.type(screen.getByLabelText(/Nome do projeto/i), 'My Project')
    await userEvent.type(screen.getByLabelText(/Descrição/i), 'My description')
    await userEvent.click(screen.getByRole('button', { name: /Criar projeto/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'My Project',
      description: 'My description',
      oscId: 'osc-1',
    })
  })

  it('calls onClose when cancel button clicked', async () => {
    const onClose = vi.fn()
    render(
      <CreateProjectModal
        open
        osc={mockOsc}
        onClose={onClose}
        onSubmit={vi.fn()}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Cancelar/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('disables submit button while loading', () => {
    render(
      <CreateProjectModal
        open
        osc={mockOsc}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        loading
      />,
    )
    expect(screen.getByRole('button', { name: /Criar projeto/i })).toBeDisabled()
  })

  it('displays error message when error prop is provided', () => {
    render(
      <CreateProjectModal
        open
        osc={mockOsc}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        error="Project name already exists"
      />,
    )
    expect(screen.getByText('Project name already exists')).toBeInTheDocument()
  })
})
