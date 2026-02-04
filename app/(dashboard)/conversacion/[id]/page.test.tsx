import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ConversationDetailPage from './page'

// Mock the hooks
const mockUseConversation = vi.fn()
vi.mock('@/hooks/use-conversations', () => ({
  useConversation: (...args: unknown[]) => mockUseConversation(...args),
}))

// Mock useParams
const mockUseParams = vi.fn()
vi.mock('next/navigation', () => ({
  useParams: () => mockUseParams(),
}))

const mockConversation = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  user_id: 'user-1',
  title: 'Test Conversation',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  messages: [
    {
      id: 'msg-1',
      conversation_id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'user' as const,
      content: 'Hello, how are you?',
      metadata: {},
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'msg-2',
      conversation_id: '123e4567-e89b-12d3-a456-426614174000',
      role: 'assistant' as const,
      content: 'I am doing well, thank you!',
      metadata: {},
      created_at: '2026-01-01T00:01:00Z',
    },
  ],
}

describe('ConversationDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Invalid ID', () => {
    it('shows invalid ID message for non-UUID IDs', () => {
      mockUseParams.mockReturnValue({ id: 'not-a-uuid' })
      mockUseConversation.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      })

      render(<ConversationDetailPage />)

      expect(screen.getByTestId('conversation-invalid')).toBeInTheDocument()
      expect(screen.getByText('ID de conversación inválido')).toBeInTheDocument()
    })

    it('shows link to go back to home', () => {
      mockUseParams.mockReturnValue({ id: 'not-a-uuid' })
      mockUseConversation.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      })

      render(<ConversationDetailPage />)

      const backLink = screen.getByText('Volver al inicio')
      expect(backLink.closest('a')).toHaveAttribute('href', '/')
    })
  })

  describe('Loading state', () => {
    it('shows loading skeleton when loading', () => {
      mockUseParams.mockReturnValue({ id: '123e4567-e89b-12d3-a456-426614174000' })
      mockUseConversation.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      })

      render(<ConversationDetailPage />)

      expect(screen.getByTestId('conversation-loading')).toBeInTheDocument()
    })
  })

  describe('Not found state', () => {
    it('shows not found message when conversation does not exist', () => {
      mockUseParams.mockReturnValue({ id: '123e4567-e89b-12d3-a456-426614174000' })
      mockUseConversation.mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
      })

      render(<ConversationDetailPage />)

      expect(screen.getByTestId('conversation-not-found')).toBeInTheDocument()
      expect(screen.getByText('Conversación no encontrada')).toBeInTheDocument()
    })

    it('shows link back to dashboard on not found', () => {
      mockUseParams.mockReturnValue({ id: '123e4567-e89b-12d3-a456-426614174000' })
      mockUseConversation.mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
      })

      render(<ConversationDetailPage />)

      const backLink = screen.getByText('Volver al inicio')
      expect(backLink.closest('a')).toHaveAttribute('href', '/')
    })
  })

  describe('Success state', () => {
    it('shows conversation title', () => {
      mockUseParams.mockReturnValue({ id: '123e4567-e89b-12d3-a456-426614174000' })
      mockUseConversation.mockReturnValue({
        data: mockConversation,
        isLoading: false,
        isError: false,
      })

      render(<ConversationDetailPage />)

      expect(screen.getByTestId('conversation-detail')).toBeInTheDocument()
      expect(screen.getByText('Test Conversation')).toBeInTheDocument()
    })

    it('shows "Nueva conversacion" when title is null', () => {
      mockUseParams.mockReturnValue({ id: '123e4567-e89b-12d3-a456-426614174000' })
      mockUseConversation.mockReturnValue({
        data: { ...mockConversation, title: null },
        isLoading: false,
        isError: false,
      })

      render(<ConversationDetailPage />)

      expect(screen.getByText('Nueva conversación')).toBeInTheDocument()
    })

    it('displays messages from conversation', () => {
      mockUseParams.mockReturnValue({ id: '123e4567-e89b-12d3-a456-426614174000' })
      mockUseConversation.mockReturnValue({
        data: mockConversation,
        isLoading: false,
        isError: false,
      })

      render(<ConversationDetailPage />)

      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument()
      expect(screen.getByText('I am doing well, thank you!')).toBeInTheDocument()
    })

    it('shows empty message state when no messages', () => {
      mockUseParams.mockReturnValue({ id: '123e4567-e89b-12d3-a456-426614174000' })
      mockUseConversation.mockReturnValue({
        data: { ...mockConversation, messages: [] },
        isLoading: false,
        isError: false,
      })

      render(<ConversationDetailPage />)

      expect(screen.getByText('No hay mensajes en esta conversación')).toBeInTheDocument()
    })
  })
})
