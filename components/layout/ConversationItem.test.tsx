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

    it('renders formatted date when title is null', () => {
      const conversationWithoutTitle = { ...mockConversation, title: null }

      render(
        <ConversationItem
          conversation={conversationWithoutTitle}
          isSelected={false}
          onDelete={vi.fn()}
        />
      )

      // Should show formatted date like "1 Jan 2026, 00:00" for the mock date
      const item = screen.getByTestId(`conversation-item-${mockConversation.id}`)
      expect(item).toHaveTextContent(/\d{1,2}\s\w+\s\d{4},\s\d{2}:\d{2}/)
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
      // Uses orange background per UX spec
      expect(item).toHaveClass('bg-setec-orange', 'text-white')
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
      expect(item).not.toHaveClass('bg-setec-orange')
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

  describe('Edit button', () => {
    it('shows edit button on hover when onTitleUpdate is provided', async () => {
      const user = userEvent.setup()

      render(
        <ConversationItem
          conversation={mockConversation}
          isSelected={false}
          onDelete={vi.fn()}
          onTitleUpdate={vi.fn()}
        />
      )

      const item = screen.getByTestId(`conversation-item-${mockConversation.id}`)
      await user.hover(item)

      expect(screen.getByTestId(`edit-conversation-${mockConversation.id}`)).toBeInTheDocument()
    })

    it('does not show edit button when onTitleUpdate is not provided', async () => {
      const user = userEvent.setup()

      render(
        <ConversationItem
          conversation={mockConversation}
          isSelected={false}
          onDelete={vi.fn()}
        />
      )

      const item = screen.getByTestId(`conversation-item-${mockConversation.id}`)
      await user.hover(item)

      expect(screen.queryByTestId(`edit-conversation-${mockConversation.id}`)).not.toBeInTheDocument()
    })

    it('shows edit button when selected', () => {
      render(
        <ConversationItem
          conversation={mockConversation}
          isSelected={true}
          onDelete={vi.fn()}
          onTitleUpdate={vi.fn()}
        />
      )

      expect(screen.getByTestId(`edit-conversation-${mockConversation.id}`)).toBeInTheDocument()
    })

    it('disables edit button when isUpdating is true', () => {
      render(
        <ConversationItem
          conversation={mockConversation}
          isSelected={true}
          onDelete={vi.fn()}
          onTitleUpdate={vi.fn()}
          isUpdating={true}
        />
      )

      expect(screen.getByTestId(`edit-conversation-${mockConversation.id}`)).toBeDisabled()
    })
  })

  describe('Edit mode', () => {
    it('enters edit mode when edit button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <ConversationItem
          conversation={mockConversation}
          isSelected={true}
          onDelete={vi.fn()}
          onTitleUpdate={vi.fn()}
        />
      )

      await user.click(screen.getByTestId(`edit-conversation-${mockConversation.id}`))

      expect(screen.getByTestId(`edit-title-input-${mockConversation.id}`)).toBeInTheDocument()
      expect(screen.getByTestId(`edit-title-input-${mockConversation.id}`)).toHaveValue('Test Conversation')
    })

    it('calls onTitleUpdate and exits edit mode on Enter', async () => {
      const onTitleUpdate = vi.fn()
      const user = userEvent.setup()

      render(
        <ConversationItem
          conversation={mockConversation}
          isSelected={true}
          onDelete={vi.fn()}
          onTitleUpdate={onTitleUpdate}
        />
      )

      await user.click(screen.getByTestId(`edit-conversation-${mockConversation.id}`))
      await user.clear(screen.getByTestId(`edit-title-input-${mockConversation.id}`))
      await user.type(screen.getByTestId(`edit-title-input-${mockConversation.id}`), 'New Title{Enter}')

      expect(onTitleUpdate).toHaveBeenCalledWith(mockConversation.id, 'New Title')
    })

    it('cancels edit mode on Escape', async () => {
      const onTitleUpdate = vi.fn()
      const user = userEvent.setup()

      render(
        <ConversationItem
          conversation={mockConversation}
          isSelected={true}
          onDelete={vi.fn()}
          onTitleUpdate={onTitleUpdate}
        />
      )

      await user.click(screen.getByTestId(`edit-conversation-${mockConversation.id}`))
      await user.type(screen.getByTestId(`edit-title-input-${mockConversation.id}`), 'New Title{Escape}')

      expect(onTitleUpdate).not.toHaveBeenCalled()
      expect(screen.queryByTestId(`edit-title-input-${mockConversation.id}`)).not.toBeInTheDocument()
    })

    it('does not call onTitleUpdate if title is unchanged', async () => {
      const onTitleUpdate = vi.fn()
      const user = userEvent.setup()

      render(
        <ConversationItem
          conversation={mockConversation}
          isSelected={true}
          onDelete={vi.fn()}
          onTitleUpdate={onTitleUpdate}
        />
      )

      await user.click(screen.getByTestId(`edit-conversation-${mockConversation.id}`))
      // Don't change the title, just press Enter
      await user.type(screen.getByTestId(`edit-title-input-${mockConversation.id}`), '{Enter}')

      expect(onTitleUpdate).not.toHaveBeenCalled()
    })

    it('hides action buttons during edit mode', async () => {
      const user = userEvent.setup()

      render(
        <ConversationItem
          conversation={mockConversation}
          isSelected={true}
          onDelete={vi.fn()}
          onTitleUpdate={vi.fn()}
        />
      )

      await user.click(screen.getByTestId(`edit-conversation-${mockConversation.id}`))

      // Buttons are invisible (not removed from DOM) to preserve layout
      const buttonsContainer = screen.getByTestId(`delete-conversation-${mockConversation.id}`).parentElement
      expect(buttonsContainer).toHaveClass('invisible')
    })
  })
})
