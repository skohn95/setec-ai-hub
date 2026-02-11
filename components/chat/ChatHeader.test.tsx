import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ChatHeader from './ChatHeader'
import type { ConversationRow } from '@/lib/supabase/conversations'

const mockConversation: ConversationRow = {
  id: 'conv-123',
  user_id: 'user-1',
  title: 'Test Conversation',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('ChatHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Title display', () => {
    it('renders conversation title', () => {
      render(
        <ChatHeader
          conversation={mockConversation}
          onTitleUpdate={vi.fn()}
        />
      )

      expect(screen.getByTestId('chat-header-title')).toHaveTextContent('Test Conversation')
    })

    it('renders "Nueva conversacion" when title is null', () => {
      const conversationWithoutTitle = { ...mockConversation, title: null }

      render(
        <ChatHeader
          conversation={conversationWithoutTitle}
          onTitleUpdate={vi.fn()}
        />
      )

      expect(screen.getByTestId('chat-header-title')).toHaveTextContent('Nueva conversacion')
    })
  })

  describe('Edit button', () => {
    it('shows edit button on hover', async () => {
      const user = userEvent.setup()

      render(
        <ChatHeader
          conversation={mockConversation}
          onTitleUpdate={vi.fn()}
        />
      )

      const header = screen.getByTestId('chat-header')
      await user.hover(header)

      expect(screen.getByTestId('chat-header-edit-btn')).toBeInTheDocument()
    })

    it('disables edit button when isUpdating is true', () => {
      render(
        <ChatHeader
          conversation={mockConversation}
          onTitleUpdate={vi.fn()}
          isUpdating={true}
        />
      )

      expect(screen.getByTestId('chat-header-edit-btn')).toBeDisabled()
    })
  })

  describe('Edit mode', () => {
    it('enters edit mode when edit button is clicked', async () => {
      const user = userEvent.setup()

      render(
        <ChatHeader
          conversation={mockConversation}
          onTitleUpdate={vi.fn()}
        />
      )

      await user.click(screen.getByTestId('chat-header-edit-btn'))

      expect(screen.getByTestId('chat-header-title-input')).toBeInTheDocument()
      expect(screen.getByTestId('chat-header-title-input')).toHaveValue('Test Conversation')
    })

    it('shows save and cancel buttons in edit mode', async () => {
      const user = userEvent.setup()

      render(
        <ChatHeader
          conversation={mockConversation}
          onTitleUpdate={vi.fn()}
        />
      )

      await user.click(screen.getByTestId('chat-header-edit-btn'))

      expect(screen.getByTestId('chat-header-save-btn')).toBeInTheDocument()
      expect(screen.getByTestId('chat-header-cancel-btn')).toBeInTheDocument()
    })

    it('calls onTitleUpdate and exits edit mode on save', async () => {
      const onTitleUpdate = vi.fn()
      const user = userEvent.setup()

      render(
        <ChatHeader
          conversation={mockConversation}
          onTitleUpdate={onTitleUpdate}
        />
      )

      await user.click(screen.getByTestId('chat-header-edit-btn'))
      await user.clear(screen.getByTestId('chat-header-title-input'))
      await user.type(screen.getByTestId('chat-header-title-input'), 'New Title')
      await user.click(screen.getByTestId('chat-header-save-btn'))

      expect(onTitleUpdate).toHaveBeenCalledWith('New Title')
      expect(screen.queryByTestId('chat-header-title-input')).not.toBeInTheDocument()
    })

    it('saves on Enter key press', async () => {
      const onTitleUpdate = vi.fn()
      const user = userEvent.setup()

      render(
        <ChatHeader
          conversation={mockConversation}
          onTitleUpdate={onTitleUpdate}
        />
      )

      await user.click(screen.getByTestId('chat-header-edit-btn'))
      await user.clear(screen.getByTestId('chat-header-title-input'))
      await user.type(screen.getByTestId('chat-header-title-input'), 'New Title{Enter}')

      expect(onTitleUpdate).toHaveBeenCalledWith('New Title')
    })

    it('cancels on Escape key press', async () => {
      const onTitleUpdate = vi.fn()
      const user = userEvent.setup()

      render(
        <ChatHeader
          conversation={mockConversation}
          onTitleUpdate={onTitleUpdate}
        />
      )

      await user.click(screen.getByTestId('chat-header-edit-btn'))
      await user.type(screen.getByTestId('chat-header-title-input'), 'New Title{Escape}')

      expect(onTitleUpdate).not.toHaveBeenCalled()
      expect(screen.queryByTestId('chat-header-title-input')).not.toBeInTheDocument()
    })

    it('cancels on cancel button click', async () => {
      const onTitleUpdate = vi.fn()
      const user = userEvent.setup()

      render(
        <ChatHeader
          conversation={mockConversation}
          onTitleUpdate={onTitleUpdate}
        />
      )

      await user.click(screen.getByTestId('chat-header-edit-btn'))
      await user.type(screen.getByTestId('chat-header-title-input'), 'New Title')
      await user.click(screen.getByTestId('chat-header-cancel-btn'))

      expect(onTitleUpdate).not.toHaveBeenCalled()
      expect(screen.queryByTestId('chat-header-title-input')).not.toBeInTheDocument()
    })

    it('does not call onTitleUpdate if title is unchanged', async () => {
      const onTitleUpdate = vi.fn()
      const user = userEvent.setup()

      render(
        <ChatHeader
          conversation={mockConversation}
          onTitleUpdate={onTitleUpdate}
        />
      )

      await user.click(screen.getByTestId('chat-header-edit-btn'))
      // Don't change the title, just save
      await user.click(screen.getByTestId('chat-header-save-btn'))

      expect(onTitleUpdate).not.toHaveBeenCalled()
    })

    it('does not call onTitleUpdate if title is empty', async () => {
      const onTitleUpdate = vi.fn()
      const user = userEvent.setup()

      render(
        <ChatHeader
          conversation={mockConversation}
          onTitleUpdate={onTitleUpdate}
        />
      )

      await user.click(screen.getByTestId('chat-header-edit-btn'))
      await user.clear(screen.getByTestId('chat-header-title-input'))
      await user.click(screen.getByTestId('chat-header-save-btn'))

      expect(onTitleUpdate).not.toHaveBeenCalled()
    })
  })
})
