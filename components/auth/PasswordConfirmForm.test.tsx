import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordConfirmForm } from './PasswordConfirmForm'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock window.location.search and history.replaceState
const mockReplaceState = vi.fn()
beforeEach(() => {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { search: '', origin: 'http://localhost:3000' },
  })
  Object.defineProperty(window, 'history', {
    writable: true,
    value: { replaceState: mockReplaceState },
  })
})

// Mock Supabase client
const mockGetSession = vi.fn()
const mockUpdateUser = vi.fn()
const mockSignOut = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: mockGetSession,
      updateUser: mockUpdateUser,
      signOut: mockSignOut,
    },
  }),
}))

describe('PasswordConfirmForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: session exists
    mockGetSession.mockResolvedValue({ data: { session: { user: {} } } })
    mockSignOut.mockResolvedValue({})
  })

  describe('Initialization', () => {
    it('shows loading state while initializing', () => {
      mockGetSession.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )
      render(<PasswordConfirmForm />)

      expect(screen.getByText('Verificando enlace...')).toBeInTheDocument()
    })

    it('shows error when no session found', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })
      render(<PasswordConfirmForm />)

      await waitFor(() => {
        expect(
          screen.getByText(/No se encontró una sesión válida/i)
        ).toBeInTheDocument()
      })
    })

    it('shows error when URL has error parameter', async () => {
      window.location.search = '?error=access_denied&error_description=Link+expired'
      render(<PasswordConfirmForm />)

      await waitFor(() => {
        expect(
          screen.getByText(/El enlace ha expirado o es inválido/i)
        ).toBeInTheDocument()
      })
    })

    it('shows request new link button on init error', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })
      render(<PasswordConfirmForm />)

      await waitFor(() => {
        expect(screen.getByText('Solicitar Nuevo Enlace')).toBeInTheDocument()
      })
    })
  })

  describe('Rendering', () => {
    it('renders the password confirm form with all required elements', async () => {
      render(<PasswordConfirmForm />)

      await waitFor(() => {
        // Check for password input
        expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument()

        // Check for confirm password input
        expect(screen.getByLabelText('Confirmar Contraseña')).toBeInTheDocument()

        // Check for submit button
        expect(
          screen.getByRole('button', { name: 'Restablecer Contraseña' })
        ).toBeInTheDocument()
      })
    })

    it('renders submit button with Setec orange styling', async () => {
      render(<PasswordConfirmForm />)

      await waitFor(() => {
        const button = screen.getByRole('button', { name: 'Restablecer Contraseña' })
        expect(button).toHaveClass('bg-setec-orange')
      })
    })
  })

  describe('Form Validation', () => {
    it('shows error when password is too short', async () => {
      const user = userEvent.setup()
      render(<PasswordConfirmForm />)

      await waitFor(() => {
        expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText('Nueva Contraseña')
      await user.type(passwordInput, '12345')

      const confirmInput = screen.getByLabelText('Confirmar Contraseña')
      await user.type(confirmInput, '12345')

      const submitButton = screen.getByRole('button', { name: 'Restablecer Contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('La contraseña debe tener al menos 6 caracteres.')
        ).toBeInTheDocument()
      })
    })

    it('shows error when passwords do not match', async () => {
      const user = userEvent.setup()
      render(<PasswordConfirmForm />)

      await waitFor(() => {
        expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText('Nueva Contraseña')
      await user.type(passwordInput, 'password123')

      const confirmInput = screen.getByLabelText('Confirmar Contraseña')
      await user.type(confirmInput, 'password456')

      const submitButton = screen.getByRole('button', { name: 'Restablecer Contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('Las contraseñas no coinciden.')
        ).toBeInTheDocument()
      })
    })

    it('shows error when confirm password is empty', async () => {
      const user = userEvent.setup()
      render(<PasswordConfirmForm />)

      await waitFor(() => {
        expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText('Nueva Contraseña')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: 'Restablecer Contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('Debes confirmar la contraseña.')
        ).toBeInTheDocument()
      })
    })

    it('does not call API when validation fails', async () => {
      const user = userEvent.setup()
      render(<PasswordConfirmForm />)

      await waitFor(() => {
        expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument()
      })

      const submitButton = screen.getByRole('button', { name: 'Restablecer Contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateUser).not.toHaveBeenCalled()
      })
    })
  })

  describe('Success Flow', () => {
    it('calls Supabase updateUser with correct password', async () => {
      mockUpdateUser.mockResolvedValue({ error: null })

      const user = userEvent.setup()
      render(<PasswordConfirmForm />)

      await waitFor(() => {
        expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText('Nueva Contraseña')
      await user.type(passwordInput, 'newpassword123')

      const confirmInput = screen.getByLabelText('Confirmar Contraseña')
      await user.type(confirmInput, 'newpassword123')

      const submitButton = screen.getByRole('button', { name: 'Restablecer Contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({
          password: 'newpassword123',
        })
      })
    })

    it('signs out user and redirects to login on success', async () => {
      mockUpdateUser.mockResolvedValue({ error: null })

      const user = userEvent.setup()
      render(<PasswordConfirmForm />)

      await waitFor(() => {
        expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText('Nueva Contraseña')
      await user.type(passwordInput, 'newpassword123')

      const confirmInput = screen.getByLabelText('Confirmar Contraseña')
      await user.type(confirmInput, 'newpassword123')

      const submitButton = screen.getByRole('button', { name: 'Restablecer Contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
        expect(mockPush).toHaveBeenCalledWith('/login?message=password-reset-success')
      })
    })
  })

  describe('Error Handling', () => {
    it('shows error message when update fails', async () => {
      mockUpdateUser.mockResolvedValue({
        error: { message: 'Invalid session' },
      })

      const user = userEvent.setup()
      render(<PasswordConfirmForm />)

      await waitFor(() => {
        expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText('Nueva Contraseña')
      await user.type(passwordInput, 'newpassword123')

      const confirmInput = screen.getByLabelText('Confirmar Contraseña')
      await user.type(confirmInput, 'newpassword123')

      const submitButton = screen.getByRole('button', { name: 'Restablecer Contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('El enlace de restablecimiento ha expirado o es inválido')
        ).toBeInTheDocument()
      })
    })

    it('shows specific error when new password matches old password', async () => {
      mockUpdateUser.mockResolvedValue({
        error: { message: 'New password should be different from the old password' },
      })

      const user = userEvent.setup()
      render(<PasswordConfirmForm />)

      await waitFor(() => {
        expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText('Nueva Contraseña')
      await user.type(passwordInput, 'samepassword')

      const confirmInput = screen.getByLabelText('Confirmar Contraseña')
      await user.type(confirmInput, 'samepassword')

      const submitButton = screen.getByRole('button', { name: 'Restablecer Contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('La nueva contraseña debe ser diferente a la contraseña actual.')
        ).toBeInTheDocument()
      })
    })

    it('displays error alert with proper role for screen readers', async () => {
      mockUpdateUser.mockResolvedValue({
        error: { message: 'Invalid session' },
      })

      const user = userEvent.setup()
      render(<PasswordConfirmForm />)

      await waitFor(() => {
        expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText('Nueva Contraseña')
      await user.type(passwordInput, 'newpassword123')

      const confirmInput = screen.getByLabelText('Confirmar Contraseña')
      await user.type(confirmInput, 'newpassword123')

      const submitButton = screen.getByRole('button', { name: 'Restablecer Contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('shows loading state during submission', async () => {
      mockUpdateUser.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      )

      const user = userEvent.setup()
      render(<PasswordConfirmForm />)

      await waitFor(() => {
        expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText('Nueva Contraseña')
      await user.type(passwordInput, 'newpassword123')

      const confirmInput = screen.getByLabelText('Confirmar Contraseña')
      await user.type(confirmInput, 'newpassword123')

      const submitButton = screen.getByRole('button', { name: 'Restablecer Contraseña' })
      await user.click(submitButton)

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText('Restableciendo...')).toBeInTheDocument()
      })
    })

    it('disables form inputs during submission', async () => {
      mockUpdateUser.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      )

      const user = userEvent.setup()
      render(<PasswordConfirmForm />)

      await waitFor(() => {
        expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText('Nueva Contraseña')
      await user.type(passwordInput, 'newpassword123')

      const confirmInput = screen.getByLabelText('Confirmar Contraseña')
      await user.type(confirmInput, 'newpassword123')

      const submitButton = screen.getByRole('button', { name: 'Restablecer Contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(passwordInput).toBeDisabled()
        expect(confirmInput).toBeDisabled()
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper label associations via htmlFor', async () => {
      render(<PasswordConfirmForm />)

      await waitFor(() => {
        expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument()
        expect(screen.getByLabelText('Confirmar Contraseña')).toBeInTheDocument()
      })
    })

    it('has proper form structure with noValidate', async () => {
      render(<PasswordConfirmForm />)

      await waitFor(() => {
        const form = screen.getByRole('button', { name: 'Restablecer Contraseña' }).closest('form')
        expect(form).toHaveAttribute('noValidate')
      })
    })
  })

  describe('Password Visibility Toggle', () => {
    it('renders password fields with toggle buttons', async () => {
      render(<PasswordConfirmForm />)

      await waitFor(() => {
        const toggleButtons = screen.getAllByRole('button', { name: 'Mostrar contraseña' })
        expect(toggleButtons).toHaveLength(2)
      })
    })

    it('toggles password visibility when toggle is clicked', async () => {
      const user = userEvent.setup()
      render(<PasswordConfirmForm />)

      await waitFor(() => {
        expect(screen.getByLabelText('Nueva Contraseña')).toBeInTheDocument()
      })

      const passwordInput = screen.getByLabelText('Nueva Contraseña')
      expect(passwordInput).toHaveAttribute('type', 'password')

      const toggleButtons = screen.getAllByRole('button', { name: 'Mostrar contraseña' })
      await user.click(toggleButtons[0])

      expect(passwordInput).toHaveAttribute('type', 'text')
    })
  })
})
