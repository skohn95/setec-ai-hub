import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from './Header'

// Mock next/navigation
const mockPush = vi.fn()
const mockRefresh = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

// Mock AuthProvider
const mockUser = { id: '1', email: 'test@example.com' }
vi.mock('@/lib/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}))

// Mock Supabase client
const mockSignOut = vi.fn().mockResolvedValue({})
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}))

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the Setec logo', () => {
      render(<Header />)
      expect(screen.getByText('SETEC')).toBeInTheDocument()
    })

    it('renders the user avatar with initials', () => {
      render(<Header />)
      // Avatar should show first 2 letters of email uppercase
      expect(screen.getByText('TE')).toBeInTheDocument()
    })

    it('renders mobile menu button on mobile', () => {
      render(<Header />)
      expect(screen.getByLabelText('Abrir menú')).toBeInTheDocument()
    })
  })

  describe('User Dropdown Menu', () => {
    it('shows user email in dropdown when opened', async () => {
      const user = userEvent.setup()
      render(<Header />)

      // Click on user menu button
      const menuButton = screen.getByLabelText('Menú de usuario')
      await user.click(menuButton)

      // Should show user email
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('shows logout option in dropdown', async () => {
      const user = userEvent.setup()
      render(<Header />)

      // Click on user menu button
      const menuButton = screen.getByLabelText('Menú de usuario')
      await user.click(menuButton)

      // Should show logout option
      expect(screen.getByText('Cerrar sesión')).toBeInTheDocument()
    })
  })

  describe('Logout functionality', () => {
    it('calls signOut and redirects to login when logout is clicked', async () => {
      const user = userEvent.setup()
      render(<Header />)

      // Open dropdown
      const menuButton = screen.getByLabelText('Menú de usuario')
      await user.click(menuButton)

      // Click logout
      const logoutButton = screen.getByText('Cerrar sesión')
      await user.click(logoutButton)

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled()
        expect(mockPush).toHaveBeenCalledWith('/login')
        expect(mockRefresh).toHaveBeenCalled()
      })
    })
  })

  describe('Mobile menu', () => {
    it('calls onMenuClick when mobile menu button is clicked', async () => {
      const onMenuClick = vi.fn()
      const user = userEvent.setup()

      render(<Header onMenuClick={onMenuClick} />)

      const menuButton = screen.getByLabelText('Abrir menú')
      await user.click(menuButton)

      expect(onMenuClick).toHaveBeenCalled()
    })
  })

  describe('Styling', () => {
    it('has proper header styling with border and background', () => {
      render(<Header />)

      const header = screen.getByTestId('header')
      expect(header).toHaveClass('h-14', 'border-b', 'bg-white')
    })

    it('displays Setec logo with orange color', () => {
      render(<Header />)

      const logo = screen.getByText('SETEC')
      expect(logo).toHaveClass('text-setec-orange')
    })
  })
})
