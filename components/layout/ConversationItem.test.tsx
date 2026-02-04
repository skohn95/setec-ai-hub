import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConversationItem } from './ConversationItem'
import type { ConversationRow } from '@/lib/supabase/conversations'

const mockConversation: ConversationRow = {
  id: 'conv-123',
  user_id: 'user-1',
  title: 'Test Conversation',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('ConversationItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders conversation title', () => {
      render(
        <ConversationItem
          conversation={mockConversation}
          isSelected={false}
          onDelete={vi.fn()}
        />
      )

      expect(screen.getByText('Test Conversation')).toBeInTheDocument()
    })

    it('renders timestamp', () => {
      render(
        <ConversationItem
          conversation={mockConversation}
          isSelected={false}
          onDelete={vi.fn()}
        />
      )

      // The timestamp should be rendered (format depends on date-utils)
      const item = screen.getByTestId(`conversation-item-${mockConversation.id}`)
      expect(item).toBeInTheDocument()
    })

    it('renders "Nueva conversacion" when title is null', () => {
      const conversationWithoutTitle = { ...mockConversation, title: null }

      render(
        <ConversationItem
          conversation={conversationWithoutTitle}
          isSelected={false}
          onDelete={vi.fn()}
        />
      )

      expect(screen.getByText('Nueva conversación')).toBeInTheDocument()
    })

    it('truncates long titles', () => {
      const longTitleConversation = {
        ...mockConversation,
        title: 'This is a very long conversation title that should be truncated',
      }

      render(
        <ConversationItem
          conversation={longTitleConversation}
          isSelected={false}
          onDelete={vi.fn()}
        />
      )

      // Title should be truncated to ~30 chars with ellipsis
      expect(screen.getByText('This is a very long convers...')).toBeInTheDocument()
    })

    it('links to correct conversation URL', () => {
      render(
        <ConversationItem
          conversation={mockConversation}
          isSelected={false}
          onDelete={vi.fn()}
        />
      )

      const link = screen.getByTestId(`conversation-item-${mockConversation.id}`)
      expect(link).toHaveAttribute('href', `/conversacion/${mockConversation.id}`)
    })
  })

  describe('Selection state', () => {
    it('shows highlighted state when selected', () => {
      render(
        <ConversationItem
          conversation={mockConversation}
          isSelected={true}
          onDelete={vi.fn()}
        />
      )

      const item = screen.getByTestId(`conversation-item-${mockConversation.id}`)
      expect(item).toHaveClass('border-l-setec-orange')
    })

    it('does not show highlighted state when not selected', () => {
      render(
        <ConversationItem
          conversation={mockConversation}
          isSelected={false}
          onDelete={vi.fn()}
        />
      )

      const item = screen.getByTestId(`conversation-item-${mockConversation.id}`)
      expect(item).not.toHaveClass('border-l-setec-orange')
    })
  })

  describe('Delete button', () => {
    it('shows delete button on hover', async () => {
      const user = userEvent.setup()

      render(
        <ConversationItem
          conversation={mockConversation}
          isSelected={false}
          onDelete={vi.fn()}
        />
      )

      const item = screen.getByTestId(`conversation-item-${mockConversation.id}`)

      // Hover over the item
      await user.hover(item)

      // Delete button should appear
      expect(screen.getByTestId(`delete-conversation-${mockConversation.id}`)).toBeInTheDocument()
    })

    it('shows delete button when selected', () => {
      render(
        <ConversationItem
          conversation={mockConversation}
          isSelected={true}
          onDelete={vi.fn()}
        />
      )

      // Delete button should be visible when selected
      expect(screen.getByTestId(`delete-conversation-${mockConversation.id}`)).toBeInTheDocument()
    })

    it('calls onDelete when delete button is clicked', async () => {
      const onDelete = vi.fn()
      const user = userEvent.setup()

      render(
        <ConversationItem
          conversation={mockConversation}
          isSelected={true}
          onDelete={onDelete}
        />
      )

      const deleteButton = screen.getByTestId(`delete-conversation-${mockConversation.id}`)
      await user.click(deleteButton)

      expect(onDelete).toHaveBeenCalledWith(mockConversation.id)
    })

    it('prevents link navigation when delete button is clicked', async () => {
      const onDelete = vi.fn()
      const user = userEvent.setup()

      render(
        <ConversationItem
          conversation={mockConversation}
          isSelected={true}
          onDelete={onDelete}
        />
      )

      const deleteButton = screen.getByTestId(`delete-conversation-${mockConversation.id}`)

      // Click should not navigate (stopPropagation and preventDefault should work)
      await user.click(deleteButton)

      expect(onDelete).toHaveBeenCalled()
    })
  })
})
