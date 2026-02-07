import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import ConversationDetailPage from './page'

// Mock scrollIntoView which isn't available in JSDOM
Element.prototype.scrollIntoView = vi.fn()

// Mock the hooks
const mockUseConversation = vi.fn()
vi.mock('@/hooks/use-conversations', () => ({
  useConversation: (...args: unknown[]) => mockUseConversation(...args),
}))

// Mock useMessages and useSendMessage for ChatContainer
const mockUseMessages = vi.fn()
const mockUseSendMessage = vi.fn()
vi.mock('@/hooks/use-messages', () => ({
  useMessages: (...args: unknown[]) => mockUseMessages(...args),
  useSendMessage: (...args: unknown[]) => mockUseSendMessage(...args),
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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
  Wrapper.displayName = 'TestQueryClientWrapper'
  return Wrapper
}

describe('ConversationDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations for ChatContainer hooks
    mockUseMessages.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    })

    mockUseSendMessage.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })
  })

  describe('Invalid ID', () => {
    it('shows invalid ID message for non-UUID IDs', () => {
      mockUseParams.mockReturnValue({ id: 'not-a-uuid' })
      mockUseConversation.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: false,
      })

      render(<ConversationDetailPage />, { wrapper: createWrapper() })

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

      render(<ConversationDetailPage />, { wrapper: createWrapper() })

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

      render(<ConversationDetailPage />, { wrapper: createWrapper() })

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

      render(<ConversationDetailPage />, { wrapper: createWrapper() })

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

      render(<ConversationDetailPage />, { wrapper: createWrapper() })

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

      render(<ConversationDetailPage />, { wrapper: createWrapper() })

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

      render(<ConversationDetailPage />, { wrapper: createWrapper() })

      expect(screen.getByText('Nueva conversación')).toBeInTheDocument()
    })

    it('renders ChatContainer with conversation ID', () => {
      mockUseParams.mockReturnValue({ id: '123e4567-e89b-12d3-a456-426614174000' })
      mockUseConversation.mockReturnValue({
        data: mockConversation,
        isLoading: false,
        isError: false,
      })

      render(<ConversationDetailPage />, { wrapper: createWrapper() })

      // ChatContainer should call useMessages with the conversation ID
      expect(mockUseMessages).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000')
    })

    it('renders chat input for sending messages', () => {
      mockUseParams.mockReturnValue({ id: '123e4567-e89b-12d3-a456-426614174000' })
      mockUseConversation.mockReturnValue({
        data: mockConversation,
        isLoading: false,
        isError: false,
      })

      render(<ConversationDetailPage />, { wrapper: createWrapper() })

      // ChatInput should be rendered
      expect(screen.getByPlaceholderText('Escribe tu mensaje...')).toBeInTheDocument()
    })
  })
})
