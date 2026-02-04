import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConversationList } from './ConversationList'

// Mock useRouter
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}))

// Mock ResizeObserver for ScrollArea component
class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver

// Mock the hooks
const mockUseConversations = vi.fn()
const mockUseDeleteConversation = vi.fn()

vi.mock('@/hooks/use-conversations', () => ({
  useConversations: () => mockUseConversations(),
  useDeleteConversation: () => mockUseDeleteConversation(),
}))

// Mock the ConversationItem component
vi.mock('./ConversationItem', () => ({
  ConversationItem: ({
    conversation,
    isSelected,
    onDelete,
  }: {
    conversation: { id: string; title: string }
    isSelected: boolean
    onDelete: (id: string) => void
  }) => (
    <div
      data-testid={`conversation-item-${conversation.id}`}
      data-selected={isSelected ? 'true' : 'false'}
    >
      <span>{conversation.title}</span>
      <button onClick={() => onDelete(conversation.id)}>Delete</button>
    </div>
  ),
}))

// Mock the DeleteConversationDialog component
vi.mock('./DeleteConversationDialog', () => ({
  DeleteConversationDialog: ({
    open,
    onConfirm,
    onCancel,
    isDeleting,
  }: {
    open: boolean
    onConfirm: () => void
    onCancel: () => void
    isDeleting: boolean
  }) =>
    open ? (
      <div data-testid="delete-dialog">
        <button onClick={onConfirm} disabled={isDeleting}>
          Confirm
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    ) : null,
}))

const mockConversations = [
  {
    id: 'conv-1',
    user_id: 'user-1',
    title: 'Conversation 1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'conv-2',
    user_id: 'user-1',
    title: 'Conversation 2',
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
]

describe('ConversationList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPush.mockReset()
    mockUseDeleteConversation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })
  })

  describe('Loading state', () => {
    it('shows loading skeletons when loading', () => {
      mockUseConversations.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        refetch: vi.fn(),
      })

      render(<ConversationList />)

      expect(screen.getByTestId('conversations-loading')).toBeInTheDocument()
    })
  })

  describe('Error state', () => {
    it('shows error message when error occurs', () => {
      mockUseConversations.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch: vi.fn(),
      })

      render(<ConversationList />)

      expect(screen.getByTestId('conversations-error')).toBeInTheDocument()
      expect(screen.getByText('Error al cargar conversaciones')).toBeInTheDocument()
    })

    it('shows retry button on error', () => {
      const refetch = vi.fn()
      mockUseConversations.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch,
      })

      render(<ConversationList />)

      expect(screen.getByText('Reintentar')).toBeInTheDocument()
    })

    it('calls refetch when retry button is clicked', async () => {
      const refetch = vi.fn()
      const user = userEvent.setup()
      mockUseConversations.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        refetch,
      })

      render(<ConversationList />)

      await user.click(screen.getByText('Reintentar'))

      expect(refetch).toHaveBeenCalled()
    })
  })

  describe('Empty state', () => {
    it('shows empty state when no conversations', () => {
      mockUseConversations.mockReturnValue({
        data: [],
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      })

      render(<ConversationList />)

      expect(screen.getByTestId('conversations-empty')).toBeInTheDocument()
      expect(screen.getByText('No tienes conversaciones aún')).toBeInTheDocument()
    })
  })

  describe('Conversations list', () => {
    it('renders conversations when data is available', () => {
      mockUseConversations.mockReturnValue({
        data: mockConversations,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      })

      render(<ConversationList />)

      expect(screen.getByTestId('conversations-list')).toBeInTheDocument()
      expect(screen.getByTestId('conversation-item-conv-1')).toBeInTheDocument()
      expect(screen.getByTestId('conversation-item-conv-2')).toBeInTheDocument()
    })

    it('passes selectedConversationId to items', () => {
      mockUseConversations.mockReturnValue({
        data: mockConversations,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      })

      render(<ConversationList selectedConversationId="conv-1" />)

      expect(screen.getByTestId('conversation-item-conv-1')).toHaveAttribute(
        'data-selected',
        'true'
      )
      expect(screen.getByTestId('conversation-item-conv-2')).toHaveAttribute(
        'data-selected',
        'false'
      )
    })
  })

  describe('Delete functionality', () => {
    it('opens delete dialog when delete is requested', async () => {
      const user = userEvent.setup()
      mockUseConversations.mockReturnValue({
        data: mockConversations,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      })

      render(<ConversationList />)

      // Find and click the delete button for conversation 1
      const item1 = screen.getByTestId('conversation-item-conv-1')
      const deleteButton = item1.querySelector('button')
      await user.click(deleteButton!)

      // Dialog should open
      expect(screen.getByTestId('delete-dialog')).toBeInTheDocument()
    })

    it('closes dialog when cancel is clicked', async () => {
      const user = userEvent.setup()
      mockUseConversations.mockReturnValue({
        data: mockConversations,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      })

      render(<ConversationList />)

      // Open dialog
      const item1 = screen.getByTestId('conversation-item-conv-1')
      const deleteButton = item1.querySelector('button')
      await user.click(deleteButton!)

      // Click cancel
      await user.click(screen.getByText('Cancel'))

      // Dialog should be closed
      expect(screen.queryByTestId('delete-dialog')).not.toBeInTheDocument()
    })

    it('calls delete mutation when confirm is clicked', async () => {
      const mutate = vi.fn()
      const user = userEvent.setup()
      mockUseConversations.mockReturnValue({
        data: mockConversations,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      })
      mockUseDeleteConversation.mockReturnValue({
        mutate,
        isPending: false,
      })

      render(<ConversationList />)

      // Open dialog
      const item1 = screen.getByTestId('conversation-item-conv-1')
      const deleteButton = item1.querySelector('button')
      await user.click(deleteButton!)

      // Click confirm
      await user.click(screen.getByText('Confirm'))

      // Check first argument is the conversation id, second is options object with onSuccess
      expect(mutate).toHaveBeenCalledWith('conv-1', expect.objectContaining({
        onSuccess: expect.any(Function),
      }))
    })

    it('navigates to home when deleting currently selected conversation', async () => {
      const mutate = vi.fn((id: string, options?: { onSuccess?: () => void }) => {
        // Simulate success callback
        options?.onSuccess?.()
      })
      const user = userEvent.setup()
      mockUseConversations.mockReturnValue({
        data: mockConversations,
        isLoading: false,
        isError: false,
        refetch: vi.fn(),
      })
      mockUseDeleteConversation.mockReturnValue({
        mutate,
        isPending: false,
      })

      // Render with conv-1 selected
      render(<ConversationList selectedConversationId="conv-1" />)

      // Open dialog for conv-1
      const item1 = screen.getByTestId('conversation-item-conv-1')
      const deleteButton = item1.querySelector('button')
      await user.click(deleteButton!)

      // Click confirm
      await user.click(screen.getByText('Confirm'))

      // Should navigate to home since we deleted the current conversation
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })
})
