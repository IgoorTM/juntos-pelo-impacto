import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ActionCard } from './ActionCard'

describe('ActionCard', () => {
  it('renders title and description', () => {
    render(
      <ActionCard
        title="Test Title"
        description="Test description"
        buttonLabel="Click me"
        onClick={vi.fn()}
      />,
    )
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('calls onClick when button is clicked', async () => {
    const onClick = vi.fn()
    render(
      <ActionCard
        title="Test"
        description="Test"
        buttonLabel="Click"
        onClick={onClick}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: /Click/i }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('disables button when disabled prop is true', () => {
    render(
      <ActionCard
        title="Test"
        description="Test"
        buttonLabel="Click"
        onClick={vi.fn()}
        disabled
      />,
    )
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('renders with reduced opacity when disabled', () => {
    const { container } = render(
      <ActionCard
        title="Test"
        description="Test"
        buttonLabel="Click"
        onClick={vi.fn()}
        disabled
      />,
    )
    const card = container.firstChild
    expect(card).toHaveClass('opacity-50')
  })
})
