import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import ConversationDetailPage from './page'

// Mock scrollIntoView which isn't available in JSDOM
Element.prototype.scrollIntoView = vi.fn()

// Mock the hooks
const mockUseConversation = vi.fn()
const mockUseUpdateConversationTitle = vi.fn()
vi.mock('@/hooks/use-conversations', () => ({
  useConversation: (...args: unknown[]) => mockUseConversation(...args),
  useUpdateConversationTitle: () => mockUseUpdateConversationTitle(),
}))

// Mock useMessages and useSendMessage for ChatContainer
const mockUseMessagesWithFiles = vi.fn()
const mockUseSendMessage = vi.fn()
vi.mock('@/hooks/use-messages', () => ({
  useMessagesWithFiles: (...args: unknown[]) => mockUseMessagesWithFiles(...args),
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
    mockUseMessagesWithFiles.mockReturnValue({
      messages: [],
      files: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })

    mockUseSendMessage.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })

    // Default mock for useUpdateConversationTitle
    mockUseUpdateConversationTitle.mockReturnValue({
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
    it('renders conversation detail container', () => {
      mockUseParams.mockReturnValue({ id: '123e4567-e89b-12d3-a456-426614174000' })
      mockUseConversation.mockReturnValue({
        data: mockConversation,
        isLoading: false,
        isError: false,
      })

      render(<ConversationDetailPage />, { wrapper: createWrapper() })

      expect(screen.getByTestId('conversation-detail')).toBeInTheDocument()
    })

    it('renders chat interface when conversation exists', () => {
      mockUseParams.mockReturnValue({ id: '123e4567-e89b-12d3-a456-426614174000' })
      mockUseConversation.mockReturnValue({
        data: { ...mockConversation, title: null },
        isLoading: false,
        isError: false,
      })

      render(<ConversationDetailPage />, { wrapper: createWrapper() })

      // ChatContainer should be rendered (title is shown in sidebar, not on page)
      expect(screen.getByTestId('conversation-detail')).toBeInTheDocument()
    })

    it('renders ChatContainer with conversation ID', () => {
      mockUseParams.mockReturnValue({ id: '123e4567-e89b-12d3-a456-426614174000' })
      mockUseConversation.mockReturnValue({
        data: mockConversation,
        isLoading: false,
        isError: false,
      })

      render(<ConversationDetailPage />, { wrapper: createWrapper() })

      // ChatContainer should call useMessagesWithFiles with the conversation ID
      expect(mockUseMessagesWithFiles).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000')
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

    it('renders ChatHeader with conversation title', () => {
      mockUseParams.mockReturnValue({ id: '123e4567-e89b-12d3-a456-426614174000' })
      mockUseConversation.mockReturnValue({
        data: mockConversation,
        isLoading: false,
        isError: false,
      })

      render(<ConversationDetailPage />, { wrapper: createWrapper() })

      expect(screen.getByTestId('chat-header')).toBeInTheDocument()
      expect(screen.getByTestId('chat-header-title')).toHaveTextContent('Test Conversation')
    })

    it('renders ChatHeader with fallback title when conversation title is null', () => {
      mockUseParams.mockReturnValue({ id: '123e4567-e89b-12d3-a456-426614174000' })
      mockUseConversation.mockReturnValue({
        data: { ...mockConversation, title: null },
        isLoading: false,
        isError: false,
      })

      render(<ConversationDetailPage />, { wrapper: createWrapper() })

      expect(screen.getByTestId('chat-header-title')).toHaveTextContent('Nueva conversacion')
    })
  })
})
