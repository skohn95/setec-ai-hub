import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './LoginForm'

// Mock next/navigation
let mockSearchParams = new URLSearchParams()
vi.mock('next/navigation', () => ({
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

// Mock window.location
const originalLocation = window.location
beforeEach(() => {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: { href: '' },
  })
})

afterAll(() => {
  Object.defineProperty(window, 'location', {
    writable: true,
    value: originalLocation,
  })
})

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams()
  })

  describe('Rendering', () => {
    it('renders the login form with all required elements', () => {
      render(<LoginForm />)

      // Check for email input
      expect(screen.getByLabelText('Correo Electrónico')).toBeInTheDocument()

      // Check for password input
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()

      // Check for submit button
      expect(
        screen.getByRole('button', { name: 'Iniciar Sesión' })
      ).toBeInTheDocument()

      // Check for forgot password link
      expect(
        screen.getByText('¿Olvidaste tu contraseña?')
      ).toBeInTheDocument()
    })

    it('renders success message when URL param is password-reset-success', () => {
      mockSearchParams = new URLSearchParams('message=password-reset-success')
      render(<LoginForm />)

      expect(
        screen.getByText(/Contraseña restablecida exitosamente/i)
      ).toBeInTheDocument()
    })
  })

  describe('Password Visibility Toggle', () => {
    it('renders password field with toggle button', () => {
      render(<LoginForm />)

      const toggleButton = screen.getByRole('button', {
        name: 'Mostrar contraseña',
      })
      expect(toggleButton).toBeInTheDocument()
    })

    it('toggles password visibility when toggle is clicked', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const passwordInput = screen.getByLabelText('Contraseña')
      expect(passwordInput).toHaveAttribute('type', 'password')

      const toggleButton = screen.getByRole('button', {
        name: 'Mostrar contraseña',
      })
      await user.click(toggleButton)

      expect(passwordInput).toHaveAttribute('type', 'text')
    })
  })

  describe('Form Validation', () => {
    it('shows error when email is empty', async () => {
      const user = userEvent.setup()
      render(<LoginForm />)

      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' })
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

      const emailInput = screen.getByLabelText('Correo Electrónico')
      await user.type(emailInput, 'test@example.com')

      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' })
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

      const emailInput = screen.getByLabelText('Correo Electrónico')
      await user.type(emailInput, 'invalid-email')

      const passwordInput = screen.getByLabelText('Contraseña')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('Por favor ingresa un correo electrónico válido.')
        ).toBeInTheDocument()
      })
    })
  })

  describe('Successful Login', () => {
    it('redirects to homepage on successful login', async () => {
      mockSignInWithPassword.mockResolvedValue({ data: { user: {} }, error: null })

      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Correo Electrónico')
      await user.type(emailInput, 'test@example.com')

      const passwordInput = screen.getByLabelText('Contraseña')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockSignInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
        expect(window.location.href).toBe('/')
      })
    })

    it('shows loading state during submission', async () => {
      mockSignInWithPassword.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ error: null }), 100)
          )
      )

      const user = userEvent.setup()
      render(<LoginForm />)

      const emailInput = screen.getByLabelText('Correo Electrónico')
      await user.type(emailInput, 'test@example.com')

      const passwordInput = screen.getByLabelText('Contraseña')
      await user.type(passwordInput, 'password123')

      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' })
      await user.click(submitButton)

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText('Iniciando sesión...')).toBeInTheDocument()
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

      const emailInput = screen.getByLabelText('Correo Electrónico')
      await user.type(emailInput, 'test@example.com')

      const passwordInput = screen.getByLabelText('Contraseña')
      await user.type(passwordInput, 'wrongpassword')

      const submitButton = screen.getByRole('button', { name: 'Iniciar Sesión' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText('Correo electrónico o contraseña incorrectos')
        ).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper label associations', () => {
      render(<LoginForm />)

      expect(screen.getByLabelText('Correo Electrónico')).toBeInTheDocument()
      expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    })

    it('forgot password link navigates to recuperar-password', () => {
      render(<LoginForm />)

      const link = screen.getByText('¿Olvidaste tu contraseña?')
      expect(link).toHaveAttribute('href', '/recuperar-password')
    })
  })
})
