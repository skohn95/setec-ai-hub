import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Sidebar } from './Sidebar'

// Mock Next.js navigation
const mockUsePathname = vi.fn()
vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}))

// Mock the ConversationList component to avoid needing providers
vi.mock('./ConversationList', () => ({
  ConversationList: ({ selectedConversationId }: { selectedConversationId?: string }) => (
    <div data-testid="conversation-list" data-selected={selectedConversationId || ''}>
      Mocked Conversation List
    </div>
  ),
}))

// Mock the NewConversationButton component
vi.mock('./NewConversationButton', () => ({
  NewConversationButton: ({ onSuccess }: { onSuccess?: () => void }) => (
    <button data-testid="new-conversation-button" onClick={onSuccess}>
      Nueva conversacion
    </button>
  ),
}))

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePathname.mockReturnValue('/')
  })

  describe('Rendering', () => {
    it('renders the sidebar with proper testid', () => {
      render(<Sidebar />)
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    })

    it('renders NewConversationButton component', () => {
      render(<Sidebar />)
      expect(screen.getByTestId('new-conversation-button')).toBeInTheDocument()
    })

    it('NewConversationButton receives onClose callback', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()

      render(<Sidebar isOpen={true} onClose={onClose} />)

      // The mocked button triggers onSuccess which should be onClose
      await user.click(screen.getByTestId('new-conversation-button'))
      expect(onClose).toHaveBeenCalled()
    })

    it('renders Plantillas navigation link', () => {
      render(<Sidebar />)
      expect(screen.getByText('Plantillas')).toBeInTheDocument()
    })

    it('Plantillas link has correct href', () => {
      render(<Sidebar />)
      const link = screen.getByText('Plantillas').closest('a')
      expect(link).toHaveAttribute('href', '/plantillas')
    })

    it('Plantillas link shows active state when on plantillas page', () => {
      mockUsePathname.mockReturnValue('/plantillas')
      render(<Sidebar />)
      const link = screen.getByText('Plantillas').closest('a')
      expect(link).toHaveAttribute('aria-current', 'page')
      expect(link?.className).toMatch(/setec-orange/)
    })

    it('Plantillas link shows inactive state when not on plantillas page', () => {
      mockUsePathname.mockReturnValue('/')
      render(<Sidebar />)
      const link = screen.getByText('Plantillas').closest('a')
      expect(link).not.toHaveAttribute('aria-current')
      expect(link?.className).toMatch(/setec-charcoal/)
    })

    it('renders privacy link at bottom', () => {
      render(<Sidebar />)
      expect(screen.getByText('Privacidad')).toBeInTheDocument()
    })

    it('renders ConversationList component', () => {
      render(<Sidebar />)
      expect(screen.getByTestId('conversation-list')).toBeInTheDocument()
    })

    it('passes selectedConversationId to ConversationList', () => {
      render(<Sidebar selectedConversationId="test-id-123" />)
      const list = screen.getByTestId('conversation-list')
      expect(list).toHaveAttribute('data-selected', 'test-id-123')
    })
  })

  describe('Styling', () => {
    it('has correct width and background color', () => {
      render(<Sidebar />)
      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).toHaveClass('w-[280px]', 'bg-[#F5F5F5]')
    })

    it('has border on the right', () => {
      render(<Sidebar />)
      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).toHaveClass('border-r')
    })
  })

  describe('Mobile behavior', () => {
    it('is hidden on mobile by default when isOpen is false', () => {
      render(<Sidebar isOpen={false} />)
      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).toHaveClass('-translate-x-full')
    })

    it('is visible when isOpen is true', () => {
      render(<Sidebar isOpen={true} />)
      const sidebar = screen.getByTestId('sidebar')
      expect(sidebar).toHaveClass('translate-x-0')
    })

    it('shows backdrop overlay when isOpen is true', () => {
      const { container } = render(<Sidebar isOpen={true} />)
      const backdrop = container.querySelector('[aria-hidden="true"]')
      expect(backdrop).toBeInTheDocument()
    })

    it('calls onClose when backdrop is clicked', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()

      const { container } = render(<Sidebar isOpen={true} onClose={onClose} />)
      const backdrop = container.querySelector('[aria-hidden="true"]')

      await user.click(backdrop!)
      expect(onClose).toHaveBeenCalled()
    })
  })
})
