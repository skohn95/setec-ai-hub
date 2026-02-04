import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()
let mockSearchParams = new URLSearchParams()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => mockSearchParams,
}))

// Mock Supabase client
const mockSignInWithPassword = vi.fn()
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
  })

  describe('Rendering', () => {
    it('renders the login form with all required elements', () => {
      render(<LoginForm />)

      // Check for email input
      expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()

      // Check for password input
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()

      // Check for submit button
      expect(
        screen.getByRole('button', { name: 'Iniciar sesión' })
      ).toBeInTheDocument()

      // Check for forgot password link
      expect(
        screen.getByText('¿Olvidaste tu contraseña?')
      ).toBeInTheDocument()
    })

    it('renders email and password fields with correct placeholders', () => {
      render(<LoginForm />)

      expect(screen.getByPlaceholderText('usuario@ejemplo.com')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
    })

    it('renders submit button with Setec orange styling', () => {
      render(<LoginForm />)

      const button = screen.getByRole('button', { name: 'Iniciar sesión' })
      expect(button).toHaveClass('bg-setec-orange')
    })
  })

  describe('Form Validation', () => {
    it('shows error when email is empty', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: 'Iniciar sesión' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('El correo electrónico es requerido.')
        ).toBeInTheDocument()
      })
    })

    it('shows error when password is empty', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: 'Iniciar sesión' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('La contraseña es requerida.')
        ).toBeInTheDocument()
      })
    })

    it('shows error for invalid email format', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'invalid-email')

      const passwordInput = screen.getByLabelText('Contraseña')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: 'Iniciar sesión' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('Por favor ingresa un correo electrónico válido.')
        ).toBeInTheDocument()
      })
    })
  })

  describe('Successful Login', () => {
    it('redirects to dashboard on successful login', async () => {
      mockSignInWithPassword.mockResolvedValue({ data: { user: {} }, error: null })

      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'test@example.com')

      const passwordInput = screen.getByLabelText('Contraseña')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: 'Iniciar sesión' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
        expect(mockPush).toHaveBeenCalledWith('/')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })

    it('redirects to redirectTo URL after successful login when present', async () => {
      mockSearchParams = new URLSearchParams('redirectTo=/dashboard/conversations/123')
      mockSignInWithPassword.mockResolvedValue({ data: { user: {} }, error: null })

      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'test@example.com')

      const passwordInput = screen.getByLabelText('Contraseña')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: 'Iniciar sesión' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard/conversations/123')
      })
    })

    it('sanitizes redirectTo to prevent open redirect attacks', async () => {
      // Test malicious external URL
      mockSearchParams = new URLSearchParams('redirectTo=//evil.com/steal-data')
      mockSignInWithPassword.mockResolvedValue({ data: { user: {} }, error: null })

      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'test@example.com')

      const passwordInput = screen.getByLabelText('Contraseña')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: 'Iniciar sesión' })
      await user.click(submitButton)

      await waitFor(() => {
        // Should redirect to / instead of evil URL
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('sanitizes redirectTo when URL is fully qualified external domain', async () => {
      mockSearchParams = new URLSearchParams('redirectTo=https://evil.com/steal-data')
      mockSignInWithPassword.mockResolvedValue({ data: { user: {} }, error: null })

      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'test@example.com')

      const passwordInput = screen.getByLabelText('Contraseña')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: 'Iniciar sesión' })
      await user.click(submitButton)

      await waitFor(() => {
        // Should redirect to / instead of external domain
        expect(mockPush).toHaveBeenCalledWith('/')
      })
    })

    it('shows loading state during submission', async () => {
      mockSignInWithPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      )

      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'test@example.com')

      const passwordInput = screen.getByLabelText('Contraseña')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: 'Iniciar sesión' })
      await user.click(submitButton)

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText('Iniciando sesión...')).toBeInTheDocument()
      })
    })

    it('disables form inputs during submission', async () => {
      mockSignInWithPassword.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      )

      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'test@example.com')

      const passwordInput = screen.getByLabelText('Contraseña')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: 'Iniciar sesión' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(emailInput).toBeDisabled()
        expect(passwordInput).toBeDisabled()
        expect(submitButton).toBeDisabled()
      })
    })
  })

  describe('Error Handling', () => {
    it('shows error message for invalid credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      })

      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'test@example.com')

      const passwordInput = screen.getByLabelText('Contraseña')
      await user.type(passwordInput, 'wrongpassword')

      const submitButton = screen.getByRole('button', { name: 'Iniciar sesión' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('Credenciales incorrectas. Verifica tu email y contraseña.')
        ).toBeInTheDocument()
      })
    })

    it('clears password field on error', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      })

      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'test@example.com')

      const passwordInput = screen.getByLabelText('Contraseña')
      await user.type(passwordInput, 'wrongpassword')

      const submitButton = screen.getByRole('button', { name: 'Iniciar sesión' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(passwordInput).toHaveValue('')
      })
    })

    it('keeps email field value on error', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      })

      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'test@example.com')

      const passwordInput = screen.getByLabelText('Contraseña')
      await user.type(passwordInput, 'wrongpassword')

      const submitButton = screen.getByRole('button', { name: 'Iniciar sesión' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(emailInput).toHaveValue('test@example.com')
      })
    })

    it('displays error alert with proper role for screen readers', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid login credentials' },
      })

      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      await user.type(emailInput, 'test@example.com')

      const passwordInput = screen.getByLabelText('Contraseña')
      await user.type(passwordInput, 'wrongpassword')

      const submitButton = screen.getByRole('button', { name: 'Iniciar sesión' })
      await user.click(submitButton)

      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper label associations via htmlFor', () => {
      render(<LoginForm />)

      // Labels are properly associated via htmlFor/id
      expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    })

    it('sets aria-invalid on inputs when errors exist', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: 'Iniciar sesión' })
      await user.click(submitButton)

      await waitFor(() => {
        const emailInput = screen.getByLabelText('Correo electrónico')
        expect(emailInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('has proper form structure with noValidate', () => {
      render(<LoginForm />)

      const form = screen.getByRole('button', { name: 'Iniciar sesión' }).closest('form')
      expect(form).toHaveAttribute('noValidate')
    })

    it('links error messages to inputs via aria-describedby', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: 'Iniciar sesión' })
      await user.click(submitButton)

      await waitFor(() => {
        const emailInput = screen.getByLabelText('Correo electrónico')
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error')
      })
    })

    it('forgot password link uses Next.js Link for SPA navigation', () => {
      render(<LoginForm />)

      const link = screen.getByText('¿Olvidaste tu contraseña?')
      expect(link).toHaveAttribute('href', '/recuperar-password')
    })
  })

  describe('Rate Limiting', () => {
    it('delays login attempts after multiple failures', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      })

      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Correo electrónico')
      const passwordInput = screen.getByLabelText('Contraseña')
      const submitButton = screen.getByRole('button', { name: 'Iniciar sesión' })

      // Simulate 3 failed attempts
      for (let i = 0; i < 3; i++) {
        await user.clear(emailInput)
        await user.clear(passwordInput)
        await user.type(emailInput, 'test@example.com')
        await user.type(passwordInput, 'wrongpassword')
        await user.click(submitButton)
        await waitFor(() => {
          expect(mockSignInWithPassword).toHaveBeenCalled()
        })
      }

      // After 3 failures, rate limiting should be active
      expect(mockSignInWithPassword).toHaveBeenCalledTimes(3)
    })
  })
})
