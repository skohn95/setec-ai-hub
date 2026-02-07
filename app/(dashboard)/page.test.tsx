import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardPage from './page'

// Mock the NewConversationButton component
vi.mock('@/components/layout/NewConversationButton', () => ({
  NewConversationButton: () => (
    <button data-testid="new-conversation-button">Nueva conversacion</button>
  ),
}))

describe('DashboardPage', () => {
  it('renders the welcome title', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Bienvenido a Setec AI Hub')).toBeInTheDocument()
  })

  it('renders the guidance text', () => {
    render(<DashboardPage />)
    expect(
      screen.getByText('Inicia una nueva conversacion para comenzar tu analisis')
    ).toBeInTheDocument()
  })

  it('renders NewConversationButton', () => {
    render(<DashboardPage />)
    expect(screen.getByTestId('new-conversation-button')).toBeInTheDocument()
  })

  it('centers the content', () => {
    const { container } = render(<DashboardPage />)
    const wrapper = container.firstChild
    expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center')
  })

  it('uses Setec charcoal color for title', () => {
    render(<DashboardPage />)
    const title = screen.getByText('Bienvenido a Setec AI Hub')
    expect(title).toHaveClass('text-setec-charcoal')
  })
})
