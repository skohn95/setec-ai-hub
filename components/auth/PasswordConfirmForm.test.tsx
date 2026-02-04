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

// Mock Supabase client
const mockUpdateUser = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      updateUser: mockUpdateUser,
    },
  }),
}))

describe('PasswordConfirmForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('renders the password confirm form with all required elements', () => {
      render(<PasswordConfirmForm />)

      // Check for password input
      expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument()

      // Check for confirm password input
      expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument()

      // Check for submit button
      expect(
        screen.getByRole('button', { name: 'Guardar nueva contraseña' })
      ).toBeInTheDocument()
    })

    it('renders password fields with correct placeholders', () => {
      render(<PasswordConfirmForm />)

      const passwordPlaceholders = screen.getAllByPlaceholderText('••••••••')
      expect(passwordPlaceholders).toHaveLength(2)
    })

    it('renders submit button with Setec orange styling', () => {
      render(<PasswordConfirmForm />)

      const button = screen.getByRole('button', { name: 'Guardar nueva contraseña' })
      expect(button).toHaveClass('bg-setec-orange')
    })
  })

  describe('Form Validation', () => {
    it('shows error when password is too short', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PasswordConfirmForm />)

      const passwordInput = screen.getByLabelText('Nueva contraseña')
      await user.type(passwordInput, '12345')

      const confirmInput = screen.getByLabelText('Confirmar contraseña')
      await user.type(confirmInput, '12345')

      const submitButton = screen.getByRole('button', { name: 'Guardar nueva contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('La contraseña debe tener al menos 6 caracteres.')
        ).toBeInTheDocument()
      })
    })

    it('shows error when passwords do not match', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PasswordConfirmForm />)

      const passwordInput = screen.getByLabelText('Nueva contraseña')
      await user.type(passwordInput, 'password123')

      const confirmInput = screen.getByLabelText('Confirmar contraseña')
      await user.type(confirmInput, 'password456')

      const submitButton = screen.getByRole('button', { name: 'Guardar nueva contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('Las contraseñas no coinciden.')
        ).toBeInTheDocument()
      })
    })

    it('shows error when confirm password is empty', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PasswordConfirmForm />)

      const passwordInput = screen.getByLabelText('Nueva contraseña')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: 'Guardar nueva contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('Por favor confirma tu contraseña.')
        ).toBeInTheDocument()
      })
    })

    it('does not call API when validation fails', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PasswordConfirmForm />)

      const submitButton = screen.getByRole('button', { name: 'Guardar nueva contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateUser).not.toHaveBeenCalled()
      })
    })
  })

  describe('Success Flow', () => {
    it('shows success message after updating password', async () => {
      mockUpdateUser.mockResolvedValue({ data: { user: {} }, error: null })

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PasswordConfirmForm />)

      const passwordInput = screen.getByLabelText('Nueva contraseña')
      await user.type(passwordInput, 'newpassword123')

      const confirmInput = screen.getByLabelText('Confirmar contraseña')
      await user.type(confirmInput, 'newpassword123')

      const submitButton = screen.getByRole('button', { name: 'Guardar nueva contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('Tu contraseña ha sido actualizada.')
        ).toBeInTheDocument()
      })
    })

    it('calls Supabase updateUser with correct password', async () => {
      mockUpdateUser.mockResolvedValue({ data: { user: {} }, error: null })

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PasswordConfirmForm />)

      const passwordInput = screen.getByLabelText('Nueva contraseña')
      await user.type(passwordInput, 'newpassword123')

      const confirmInput = screen.getByLabelText('Confirmar contraseña')
      await user.type(confirmInput, 'newpassword123')

      const submitButton = screen.getByRole('button', { name: 'Guardar nueva contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({
          password: 'newpassword123',
        })
      })
    })

    it('redirects to login page after 2 seconds on success', async () => {
      mockUpdateUser.mockResolvedValue({ data: { user: {} }, error: null })

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PasswordConfirmForm />)

      const passwordInput = screen.getByLabelText('Nueva contraseña')
      await user.type(passwordInput, 'newpassword123')

      const confirmInput = screen.getByLabelText('Confirmar contraseña')
      await user.type(confirmInput, 'newpassword123')

      const submitButton = screen.getByRole('button', { name: 'Guardar nueva contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Tu contraseña ha sido actualizada.')).toBeInTheDocument()
      })

      // Advance time by 2 seconds
      vi.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login')
      })
    })

    it('shows link to login after success', async () => {
      mockUpdateUser.mockResolvedValue({ data: { user: {} }, error: null })

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PasswordConfirmForm />)

      const passwordInput = screen.getByLabelText('Nueva contraseña')
      await user.type(passwordInput, 'newpassword123')

      const confirmInput = screen.getByLabelText('Confirmar contraseña')
      await user.type(confirmInput, 'newpassword123')

      const submitButton = screen.getByRole('button', { name: 'Guardar nueva contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        const loginLink = screen.getByText('Ir a iniciar sesión')
        expect(loginLink).toHaveAttribute('href', '/login')
      })
    })
  })

  describe('Error Handling', () => {
    it('shows error message when update fails', async () => {
      mockUpdateUser.mockResolvedValue({
        data: null,
        error: { message: 'Invalid session' },
      })

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PasswordConfirmForm />)

      const passwordInput = screen.getByLabelText('Nueva contraseña')
      await user.type(passwordInput, 'newpassword123')

      const confirmInput = screen.getByLabelText('Confirmar contraseña')
      await user.type(confirmInput, 'newpassword123')

      const submitButton = screen.getByRole('button', { name: 'Guardar nueva contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('Este enlace ha expirado o no es válido. Solicita uno nuevo.')
        ).toBeInTheDocument()
      })
    })

    it('displays error alert with proper role for screen readers', async () => {
      mockUpdateUser.mockResolvedValue({
        data: null,
        error: { message: 'Invalid session' },
      })

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PasswordConfirmForm />)

      const passwordInput = screen.getByLabelText('Nueva contraseña')
      await user.type(passwordInput, 'newpassword123')

      const confirmInput = screen.getByLabelText('Confirmar contraseña')
      await user.type(confirmInput, 'newpassword123')

      const submitButton = screen.getByRole('button', { name: 'Guardar nueva contraseña' })
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
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { user: {} }, error: null }), 100))
      )

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PasswordConfirmForm />)

      const passwordInput = screen.getByLabelText('Nueva contraseña')
      await user.type(passwordInput, 'newpassword123')

      const confirmInput = screen.getByLabelText('Confirmar contraseña')
      await user.type(confirmInput, 'newpassword123')

      const submitButton = screen.getByRole('button', { name: 'Guardar nueva contraseña' })
      await user.click(submitButton)

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText('Guardando...')).toBeInTheDocument()
      })
    })

    it('disables form inputs during submission', async () => {
      mockUpdateUser.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: { user: {} }, error: null }), 100))
      )

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PasswordConfirmForm />)

      const passwordInput = screen.getByLabelText('Nueva contraseña')
      await user.type(passwordInput, 'newpassword123')

      const confirmInput = screen.getByLabelText('Confirmar contraseña')
      await user.type(confirmInput, 'newpassword123')

      const submitButton = screen.getByRole('button', { name: 'Guardar nueva contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(passwordInput).toBeDisabled()
        expect(confirmInput).toBeDisabled()
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper label associations via htmlFor', () => {
      render(<PasswordConfirmForm />)

      expect(screen.getByLabelText('Nueva contraseña')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument()
    })

    it('sets aria-invalid on inputs when errors exist', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PasswordConfirmForm />)

      const passwordInput = screen.getByLabelText('Nueva contraseña')
      await user.type(passwordInput, '12345')

      const submitButton = screen.getByRole('button', { name: 'Guardar nueva contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('has proper form structure with noValidate', () => {
      render(<PasswordConfirmForm />)

      const form = screen.getByRole('button', { name: 'Guardar nueva contraseña' }).closest('form')
      expect(form).toHaveAttribute('noValidate')
    })

    it('links error messages to inputs via aria-describedby', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PasswordConfirmForm />)

      const passwordInput = screen.getByLabelText('Nueva contraseña')
      await user.type(passwordInput, '12345')

      const submitButton = screen.getByRole('button', { name: 'Guardar nueva contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(passwordInput).toHaveAttribute('aria-describedby', 'password-error')
      })
    })

    it('success message has proper role for screen readers', async () => {
      mockUpdateUser.mockResolvedValue({ data: { user: {} }, error: null })

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      render(<PasswordConfirmForm />)

      const passwordInput = screen.getByLabelText('Nueva contraseña')
      await user.type(passwordInput, 'newpassword123')

      const confirmInput = screen.getByLabelText('Confirmar contraseña')
      await user.type(confirmInput, 'newpassword123')

      const submitButton = screen.getByRole('button', { name: 'Guardar nueva contraseña' })
      await user.click(submitButton)

      await waitFor(() => {
        const successMessage = screen.getByRole('status')
        expect(successMessage).toBeInTheDocument()
      })
    })
  })
})
