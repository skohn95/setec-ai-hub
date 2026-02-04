import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ConfirmarPasswordPage from './page'

// Mock Supabase client
const mockGetSession = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
    },
  }),
}))

// Mock PasswordConfirmForm to avoid testing its internals
vi.mock('@/components/auth', () => ({
  PasswordConfirmForm: () => <div data-testid="password-confirm-form">PasswordConfirmForm</div>,
  AuthHeader: ({ title }: { title?: string }) => (
    <div data-testid="auth-header">
      <h1>SETEC</h1>
      {title && <h2>{title}</h2>}
    </div>
  ),
}))

describe('ConfirmarPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('shows loading spinner while checking session', async () => {
      mockGetSession.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { session: null } }), 100))
      )

      render(<ConfirmarPasswordPage />)

      // Should show loading spinner initially
      const spinner = document.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('shows auth header during loading', async () => {
      mockGetSession.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { session: null } }), 100))
      )

      render(<ConfirmarPasswordPage />)

      expect(screen.getByTestId('auth-header')).toBeInTheDocument()
    })
  })

  describe('Valid Session', () => {
    it('shows password confirm form when session is valid', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: '123' } } },
      })

      render(<ConfirmarPasswordPage />)

      await waitFor(() => {
        expect(screen.getByTestId('password-confirm-form')).toBeInTheDocument()
      })
    })

    it('shows page title "Nueva contraseña" when session is valid', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { user: { id: '123' } } },
      })

      render(<ConfirmarPasswordPage />)

      await waitFor(() => {
        expect(screen.getByText('Nueva contraseña')).toBeInTheDocument()
      })
    })
  })

  describe('Invalid/Expired Session', () => {
    it('shows error message when session is null', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
      })

      render(<ConfirmarPasswordPage />)

      await waitFor(() => {
        expect(
          screen.getByText('Este enlace ha expirado o no es válido. Solicita uno nuevo.')
        ).toBeInTheDocument()
      })
    })

    it('shows link to request new reset email', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
      })

      render(<ConfirmarPasswordPage />)

      await waitFor(() => {
        const link = screen.getByText('Solicitar nuevo enlace')
        expect(link).toHaveAttribute('href', '/recuperar-password')
      })
    })

    it('shows error alert with proper role', async () => {
      mockGetSession.mockResolvedValue({
        data: { session: null },
      })

      render(<ConfirmarPasswordPage />)

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toBeInTheDocument()
      })
    })
  })

  describe('Session Check Error', () => {
    it('shows error state when getSession throws', async () => {
      mockGetSession.mockRejectedValue(new Error('Network error'))

      render(<ConfirmarPasswordPage />)

      await waitFor(() => {
        expect(
          screen.getByText('Este enlace ha expirado o no es válido. Solicita uno nuevo.')
        ).toBeInTheDocument()
      })
    })
  })
})
