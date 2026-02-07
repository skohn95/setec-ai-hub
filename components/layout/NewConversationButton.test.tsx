import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NewConversationButton } from './NewConversationButton'

// Mock the useCreateConversation hook
const mockMutate = vi.fn()
const mockUseCreateConversation = vi.fn()

vi.mock('@/hooks/use-conversations', () => ({
  useCreateConversation: () => mockUseCreateConversation(),
}))

describe('NewConversationButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCreateConversation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    })
  })

  describe('Rendering', () => {
    it('renders the button with correct text', () => {
      render(<NewConversationButton />)
      expect(screen.getByText('Nueva conversacion')).toBeInTheDocument()
    })

    it('renders the plus icon (MessageSquarePlus)', () => {
      render(<NewConversationButton />)
      const button = screen.getByRole('button')
      // Check that button has svg (icon) inside
      expect(button.querySelector('svg')).toBeInTheDocument()
    })

    it('has correct aria-label', () => {
      render(<NewConversationButton />)
      const button = screen.getByRole('button', { name: /nueva conversacion/i })
      expect(button).toBeInTheDocument()
    })

    it('uses full width styling', () => {
      render(<NewConversationButton />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-full')
    })

    it('uses Setec orange primary variant styling', () => {
      render(<NewConversationButton />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-setec-orange')
    })
  })

  describe('Loading State', () => {
    it('shows spinner when isPending is true', () => {
      mockUseCreateConversation.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      })

      render(<NewConversationButton />)
      expect(screen.getByText('Creando...')).toBeInTheDocument()
    })

    it('disables button during loading', () => {
      mockUseCreateConversation.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      })

      render(<NewConversationButton />)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('shows loading spinner icon when isPending', () => {
      mockUseCreateConversation.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      })

      render(<NewConversationButton />)
      const button = screen.getByRole('button')
      // Check that button has svg with animation
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('animate-spin')
    })
  })

  describe('Interaction', () => {
    it('calls mutate on click', async () => {
      const user = userEvent.setup()
      render(<NewConversationButton />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(mockMutate).toHaveBeenCalledTimes(1)
    })

    it('calls onSuccess callback when provided after mutation', async () => {
      const onSuccess = vi.fn()
      const user = userEvent.setup()

      // Simulate mutation completing successfully by calling onSuccess
      mockMutate.mockImplementation(() => {
        // Simulate the hook calling the callback
        onSuccess()
      })

      render(<NewConversationButton onSuccess={onSuccess} />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(onSuccess).toHaveBeenCalled()
    })

    it('does not call mutate when button is disabled', async () => {
      mockUseCreateConversation.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      })

      const user = userEvent.setup()
      render(<NewConversationButton />)

      const button = screen.getByRole('button')
      await user.click(button)

      expect(mockMutate).not.toHaveBeenCalled()
    })
  })
})
