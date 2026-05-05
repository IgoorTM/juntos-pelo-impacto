import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TeamCodeModal } from './TeamCodeModal'

function stubClipboard() {
  const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue()
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  })
  return writeText
}

describe('TeamCodeModal', () => {
  it('renders when open prop is true', () => {
    render(
      <TeamCodeModal open code="ABC234" semester="2026.1" onClose={vi.fn()} />,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('displays code and semester', () => {
    render(
      <TeamCodeModal open code="ABC234" semester="2026.1" onClose={vi.fn()} />,
    )
    expect(screen.getByText('ABC234')).toBeInTheDocument()
    expect(screen.getByText('2026.1')).toBeInTheDocument()
  })

  it('copies code to clipboard when copy button clicked', async () => {
    const writeText = stubClipboard()
    render(
      <TeamCodeModal open code="ABC234" semester="2026.1" onClose={vi.fn()} />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Copiar/i }))
    expect(writeText).toHaveBeenCalledWith('ABC234')
  })

  it('calls onClose when main button clicked', async () => {
    const onClose = vi.fn()
    render(
      <TeamCodeModal open code="ABC234" semester="2026.1" onClose={onClose} />,
    )
    await userEvent.click(
      screen.getByRole('button', { name: /Voltar aos meus projetos/i }),
    )
    expect(onClose).toHaveBeenCalled()
  })
})
