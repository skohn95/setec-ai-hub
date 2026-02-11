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
    expect(screen.getByText(/bienvenido a/i)).toBeInTheDocument()
    expect(screen.getByText('Setec AI')).toBeInTheDocument()
  })

  it('renders the guidance text', () => {
    render(<DashboardPage />)
    expect(
      screen.getByText(/tu asistente inteligente para análisis estadístico/i)
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

  it('renders capability cards', () => {
    render(<DashboardPage />)
    expect(screen.getByText('Análisis MSA')).toBeInTheDocument()
    expect(screen.getByText('Control Charts')).toBeInTheDocument()
    expect(screen.getByText('Interpretación')).toBeInTheDocument()
  })
})
