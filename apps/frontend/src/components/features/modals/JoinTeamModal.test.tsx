import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { JoinTeamModal } from './JoinTeamModal'

describe('JoinTeamModal', () => {
  it('renders when open prop is true', () => {
    render(<JoinTeamModal open onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('focuses code input on open', async () => {
    render(<JoinTeamModal open onClose={vi.fn()} onSubmit={vi.fn()} />)
    await waitFor(() =>
      expect(screen.getByLabelText(/Código/i)).toHaveFocus(),
    )
  })

  it('enforces 6 character limit', async () => {
    render(<JoinTeamModal open onClose={vi.fn()} onSubmit={vi.fn()} />)
    const input = screen.getByLabelText(/Código/i)
    await userEvent.type(input, 'ABCDEFGHIJ')
    expect(input).toHaveValue('ABCDEF')
  })

  it('disables submit button until exactly 6 characters', async () => {
    render(<JoinTeamModal open onClose={vi.fn()} onSubmit={vi.fn()} />)
    const submitButton = screen.getByRole('button', { name: /Entrar/i })
    expect(submitButton).toBeDisabled()

    const input = screen.getByLabelText(/Código/i)
    await userEvent.type(input, 'ABC23')
    expect(submitButton).toBeDisabled()

    await userEvent.type(input, '4')
    expect(submitButton).not.toBeDisabled()
  })

  it('calls onSubmit with code on button click', async () => {
    const onSubmit = vi.fn()
    render(<JoinTeamModal open onClose={vi.fn()} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText(/Código/i), 'ABC234')
    await userEvent.click(screen.getByRole('button', { name: /Entrar/i }))
    expect(onSubmit).toHaveBeenCalledWith('ABC234')
  })

  it('calls onClose when cancel button clicked', async () => {
    const onClose = vi.fn()
    render(<JoinTeamModal open onClose={onClose} onSubmit={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /Cancelar/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('displays error message when error prop is provided', () => {
    render(
      <JoinTeamModal
        open
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        error="Código não encontrado"
      />,
    )
    expect(screen.getByText('Código não encontrado')).toBeInTheDocument()
  })

  it('disables input and submit while loading', () => {
    render(
      <JoinTeamModal open onClose={vi.fn()} onSubmit={vi.fn()} loading />,
    )
    expect(screen.getByLabelText(/Código/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeDisabled()
  })
})
