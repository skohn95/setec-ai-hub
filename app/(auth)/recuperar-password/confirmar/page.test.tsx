import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConfirmarPasswordPage from './page'

// Mock PasswordConfirmForm to avoid testing its internals
vi.mock('@/components/auth', () => ({
  PasswordConfirmForm: () => (
    <div data-testid="password-confirm-form">PasswordConfirmForm</div>
  ),
}))

describe('ConfirmarPasswordPage', () => {
  describe('Layout', () => {
    it('renders the page with correct structure', () => {
      render(<ConfirmarPasswordPage />)

      // Check for logo
      expect(screen.getByAltText('Setec AI Hub')).toBeInTheDocument()

      // Check for welcome message
      expect(
        screen.getByText('Bienvenido a Setec AI Hub')
      ).toBeInTheDocument()

      // Check for card title
      expect(screen.getByText('Restablecer contraseña')).toBeInTheDocument()
    })

    it('renders the PasswordConfirmForm component', () => {
      render(<ConfirmarPasswordPage />)

      expect(screen.getByTestId('password-confirm-form')).toBeInTheDocument()
    })

    it('renders with centered layout', () => {
      const { container } = render(<ConfirmarPasswordPage />)

      const mainContainer = container.querySelector('.min-h-screen')
      expect(mainContainer).toHaveClass('flex', 'items-center', 'justify-center')
    })

    it('renders card with correct width constraint', () => {
      const { container } = render(<ConfirmarPasswordPage />)

      const cardContainer = container.querySelector('.max-w-md')
      expect(cardContainer).toBeInTheDocument()
    })
  })
})
