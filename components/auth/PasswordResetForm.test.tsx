import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordResetForm } from './PasswordResetForm'

// Mock Supabase client
const mockResetPasswordForEmail = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
    },
  }),
}))

describe('PasswordResetForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the password reset form with all required elements', () => {
      render(<PasswordResetForm />)

      // Check for email input
      expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()

      // Check for submit button
      expect(
        screen.getByRole('button', { name: 'Enviar enlace' })
      ).toBeInTheDocument()

      // Check for back to login link
      expect(
        screen.getByText('Volver a iniciar sesión')
      ).toBeInTheDocument()
    })

    it('renders email field with correct placeholder', () => {
      render(<PasswordResetForm />)

      expect(screen.getByPlaceholderText('usuario@ejemplo.com')).toBeInTheDocument()
    })

    it('renders submit button with Setec orange styling', () => {
      render(<PasswordResetForm />)

      const button = screen.getByRole('button', { name: 'Enviar enlace' })
      expect(button).toHaveClass('bg-setec-orange')
    })
  })

  describe('Form Validation', () => {
    it('shows error when email is empty', async () => {
      const user = userEvent.setup()
      render(<PasswordResetForm />)

      const submitButton = screen.getByRole('button', { name: 'Enviar enlace' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('El correo electrónico es requerido.')
        ).toBeInTheDocument()
      })
    })

    it('shows error for invalid email format', async () => {
      const user = userEvent.setup()
      render(<PasswordResetForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'invalid-email')

      const submitButton = screen.getByRole('button', { name: 'Enviar enlace' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('Por favor ingresa un correo electrónico válido.')
        ).toBeInTheDocument()
      })
    })

    it('does not call API when validation fails', async () => {
      const user = userEvent.setup()
      render(<PasswordResetForm />)

      const submitButton = screen.getByRole('button', { name: 'Enviar enlace' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockResetPasswordForEmail).not.toHaveBeenCalled()
      })
    })
  })

  describe('Success Flow', () => {
    it('shows success message after submitting valid email', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null })

      const user = userEvent.setup()
      render(<PasswordResetForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: 'Enviar enlace' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo.')
        ).toBeInTheDocument()
      })
    })

    it('calls Supabase resetPasswordForEmail with correct parameters', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null })

      const user = userEvent.setup()
      render(<PasswordResetForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: 'Enviar enlace' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
          'test@example.com',
          expect.objectContaining({
            redirectTo: expect.stringContaining('/api/auth/callback?type=recovery'),
          })
        )
      })
    })

    it('shows success message even when API returns error (security: prevent enumeration)', async () => {
      mockResetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: 'User not found' },
      })

      const user = userEvent.setup()
      render(<PasswordResetForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'nonexistent@example.com')

      const submitButton = screen.getByRole('button', { name: 'Enviar enlace' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo.')
        ).toBeInTheDocument()
      })
    })

    it('shows success message even when API throws exception (security: prevent enumeration)', async () => {
      mockResetPasswordForEmail.mockRejectedValue(new Error('Network error'))

      const user = userEvent.setup()
      render(<PasswordResetForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: 'Enviar enlace' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo.')
        ).toBeInTheDocument()
      })
    })

    it('hides form and shows back to login link after success', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null })

      const user = userEvent.setup()
      render(<PasswordResetForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: 'Enviar enlace' })
      await user.click(submitButton)

      await waitFor(() => {
        // Form should be hidden
        expect(screen.queryByLabelText('Correo electrónico')).not.toBeInTheDocument()
        // Back to login link should be visible
        expect(screen.getByText('Volver a iniciar sesión')).toBeInTheDocument()
      })
    })
  })

  describe('Loading State', () => {
    it('shows loading state during submission', async () => {
      mockResetPasswordForEmail.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: {}, error: null }), 100))
      )

      const user = userEvent.setup()
      render(<PasswordResetForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: 'Enviar enlace' })
      await user.click(submitButton)

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText('Enviando...')).toBeInTheDocument()
      })
    })

    it('disables form inputs during submission', async () => {
      mockResetPasswordForEmail.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: {}, error: null }), 100))
      )

      const user = userEvent.setup()
      render(<PasswordResetForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: 'Enviar enlace' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(emailInput).toBeDisabled()
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper label associations via htmlFor', () => {
      render(<PasswordResetForm />)

      expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
    })

    it('sets aria-invalid on input when error exists', async () => {
      const user = userEvent.setup()
      render(<PasswordResetForm />)

      const submitButton = screen.getByRole('button', { name: 'Enviar enlace' })
      await user.click(submitButton)

      await waitFor(() => {
        const emailInput = screen.getByLabelText('Correo electrónico')
        expect(emailInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('has proper form structure with noValidate', () => {
      render(<PasswordResetForm />)

      const form = screen.getByRole('button', { name: 'Enviar enlace' }).closest('form')
      expect(form).toHaveAttribute('noValidate')
    })

    it('links error message to input via aria-describedby', async () => {
      const user = userEvent.setup()
      render(<PasswordResetForm />)

      const submitButton = screen.getByRole('button', { name: 'Enviar enlace' })
      await user.click(submitButton)

      await waitFor(() => {
        const emailInput = screen.getByLabelText('Correo electrónico')
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error')
      })
    })

    it('back to login link uses Next.js Link for SPA navigation', () => {
      render(<PasswordResetForm />)

      const link = screen.getByText('Volver a iniciar sesión')
      expect(link).toHaveAttribute('href', '/login')
    })

    it('success message has proper role for screen readers', async () => {
      mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null })

      const user = userEvent.setup()
      render(<PasswordResetForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: 'Enviar enlace' })
      await user.click(submitButton)

      await waitFor(() => {
        const successMessage = screen.getByRole('status')
        expect(successMessage).toBeInTheDocument()
      })
    })
  })
})
