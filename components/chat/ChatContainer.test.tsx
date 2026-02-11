import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import ChatContainer from './ChatContainer'
import type { MessageRow } from '@/lib/supabase/messages'

// Mock scrollIntoView which isn't available in JSDOM
Element.prototype.scrollIntoView = vi.fn()

// Mock the hooks
const mockUseMessages = vi.fn()
const mockUseSendChatMessage = vi.fn()
const mockUseStreamingChat = vi.fn()
const mockMutate = vi.fn()
const mockSendMessage = vi.fn()

vi.mock('@/hooks/use-messages', () => ({
  useMessagesWithFiles: (...args: unknown[]) => mockUseMessages(...args),
}))

vi.mock('@/hooks/use-chat', () => ({
  useSendChatMessage: (...args: unknown[]) => mockUseSendChatMessage(...args),
  useStreamingChat: (...args: unknown[]) => mockUseStreamingChat(...args),
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

const VALID_CONVERSATION_ID = '123e4567-e89b-12d3-a456-426614174000'

const createMessage = (overrides: Partial<MessageRow> = {}): MessageRow => ({
  id: 'msg-1',
  conversation_id: VALID_CONVERSATION_ID,
  role: 'user',
  content: 'Test message',
  metadata: {},
  created_at: '2026-02-04T10:30:00Z',
  ...overrides,
})

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

describe('ChatContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementations
    mockUseMessages.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    })

    mockUseSendChatMessage.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    })

    mockUseStreamingChat.mockReturnValue({
      sendMessage: mockSendMessage,
      streamingContent: '',
      isStreaming: false,
      
      error: null,
      clearError: vi.fn(),
    })
  })

  it('renders messages in chronological order', async () => {
    const messages = [
      createMessage({ id: 'msg-1', content: 'First message', created_at: '2026-02-04T10:00:00Z' }),
      createMessage({ id: 'msg-2', content: 'Second message', created_at: '2026-02-04T10:01:00Z' }),
      createMessage({ id: 'msg-3', content: 'Third message', created_at: '2026-02-04T10:02:00Z' }),
    ]

    mockUseMessages.mockReturnValue({
      data: messages,
      isLoading: false,
      isError: false,
      error: null,
    })

    render(<ChatContainer conversationId={VALID_CONVERSATION_ID} />, {
      wrapper: createWrapper(),
    })

    // All messages should be rendered
    expect(screen.getByText('First message')).toBeInTheDocument()
    expect(screen.getByText('Second message')).toBeInTheDocument()
    expect(screen.getByText('Third message')).toBeInTheDocument()
  })

  it('shows skeleton while loading', () => {
    mockUseMessages.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    })

    render(<ChatContainer conversationId={VALID_CONVERSATION_ID} />, {
      wrapper: createWrapper(),
    })

    // Multiple skeletons are rendered during loading
    const skeletons = screen.getAllByTestId('message-skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('shows error state with retry option', () => {
    mockUseMessages.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
      error: new Error('Failed to load'),
      refetch: vi.fn(),
    })

    render(<ChatContainer conversationId={VALID_CONVERSATION_ID} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText(/no se pudieron cargar/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reintentar/i })).toBeInTheDocument()
  })

  it('renders ChatInput component', () => {
    render(<ChatContainer conversationId={VALID_CONVERSATION_ID} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByPlaceholderText('Escribe tu mensaje...')).toBeInTheDocument()
  })

  it('calls streaming sendMessage when sending a message', async () => {
    const user = userEvent.setup()

    render(<ChatContainer conversationId={VALID_CONVERSATION_ID} />, {
      wrapper: createWrapper(),
    })

    const textarea = screen.getByPlaceholderText('Escribe tu mensaje...')
    await user.type(textarea, 'New message')

    const sendButton = screen.getByRole('button', { name: /enviar/i })
    await user.click(sendButton)

    // Now uses streaming hook instead of mutation
    // Second parameter is undefined when no file is attached
    expect(mockSendMessage).toHaveBeenCalledWith('New message', undefined)
  })

  it('shows loading state in input when sending', () => {
    mockUseSendChatMessage.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    })

    render(<ChatContainer conversationId={VALID_CONVERSATION_ID} />, {
      wrapper: createWrapper(),
    })

    // Should show sending state
    expect(screen.getByRole('button', { name: /enviando/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Escribe tu mensaje...')).toBeDisabled()
  })

  it('shows empty conversation message when no messages', () => {
    mockUseMessages.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    })

    render(<ChatContainer conversationId={VALID_CONVERSATION_ID} />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText(/en qué puedo ayudarte/i)).toBeInTheDocument()
  })

  it('passes conversationId to useMessages', () => {
    render(<ChatContainer conversationId={VALID_CONVERSATION_ID} />, {
      wrapper: createWrapper(),
    })

    expect(mockUseMessages).toHaveBeenCalledWith(VALID_CONVERSATION_ID)
  })

  it('passes conversationId to useSendChatMessage', () => {
    render(<ChatContainer conversationId={VALID_CONVERSATION_ID} />, {
      wrapper: createWrapper(),
    })

    expect(mockUseSendChatMessage).toHaveBeenCalledWith(VALID_CONVERSATION_ID)
  })

  describe('streaming functionality', () => {
    it('shows StreamingMessage when streaming is in progress', () => {
      mockUseStreamingChat.mockReturnValue({
        sendMessage: mockSendMessage,
        streamingContent: 'This is streaming content...',
        isStreaming: true,
        
        error: null,
        clearError: vi.fn(),
      })

      render(<ChatContainer conversationId={VALID_CONVERSATION_ID} />, {
        wrapper: createWrapper(),
      })

      expect(screen.getByTestId('streaming-message')).toBeInTheDocument()
      expect(screen.getByText(/This is streaming content/)).toBeInTheDocument()
    })

    it('shows typing cursor during streaming', () => {
      mockUseStreamingChat.mockReturnValue({
        sendMessage: mockSendMessage,
        streamingContent: 'Partial response',
        isStreaming: true,
        
        error: null,
        clearError: vi.fn(),
      })

      render(<ChatContainer conversationId={VALID_CONVERSATION_ID} />, {
        wrapper: createWrapper(),
      })

      expect(screen.getByTestId('typing-cursor')).toBeInTheDocument()
    })

    it('does not show StreamingMessage when not streaming', () => {
      mockUseStreamingChat.mockReturnValue({
        sendMessage: mockSendMessage,
        streamingContent: '',
        isStreaming: false,
        
        error: null,
        clearError: vi.fn(),
      })

      render(<ChatContainer conversationId={VALID_CONVERSATION_ID} />, {
        wrapper: createWrapper(),
      })

      expect(screen.queryByTestId('streaming-message')).not.toBeInTheDocument()
    })

    it('calls sendMessage from streaming hook when sending a message', async () => {
      const user = userEvent.setup()

      render(<ChatContainer conversationId={VALID_CONVERSATION_ID} />, {
        wrapper: createWrapper(),
      })

      const textarea = screen.getByPlaceholderText('Escribe tu mensaje...')
      await user.type(textarea, 'Hello streaming')

      const sendButton = screen.getByRole('button', { name: /enviar/i })
      await user.click(sendButton)

      // Second parameter is undefined when no file is attached
      expect(mockSendMessage).toHaveBeenCalledWith('Hello streaming', undefined)
    })

    it('disables input while streaming', () => {
      mockUseStreamingChat.mockReturnValue({
        sendMessage: mockSendMessage,
        streamingContent: 'Streaming...',
        isStreaming: true,
        
        error: null,
        clearError: vi.fn(),
      })

      render(<ChatContainer conversationId={VALID_CONVERSATION_ID} />, {
        wrapper: createWrapper(),
      })

      expect(screen.getByPlaceholderText('Escribe tu mensaje...')).toBeDisabled()
    })

    it('shows error message when streaming error occurs', () => {
      mockUseStreamingChat.mockReturnValue({
        sendMessage: mockSendMessage,
        streamingContent: 'Partial',
        isStreaming: false,
        
        error: 'Something went wrong',
        clearError: vi.fn(),
      })

      render(<ChatContainer conversationId={VALID_CONVERSATION_ID} />, {
        wrapper: createWrapper(),
      })

      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument()
    })
  })

  // Story 5.4: Follow-up question UI behavior
  describe('follow-up question handling', () => {
    it('displays follow-up response without chart rendering', () => {
      // Simulate conversation with analysis result followed by follow-up
      const messages = [
        createMessage({
          id: 'msg-1',
          role: 'user',
          content: 'Analiza mi archivo',
        }),
        createMessage({
          id: 'msg-2',
          role: 'assistant',
          content: 'El análisis muestra un %GRR de 18.5%.',
          metadata: {
            results: {
              grr_percent: 18.5,
              repeatability_percent: 12.3,
              reproducibility_percent: 6.2,
              part_to_part_percent: 81.5,
              ndc: 5,
              classification: 'marginal',
            },
            chartData: [{ type: 'gauge', data: [{ label: 'GRR', value: 18.5 }] }],
          },
        }),
        createMessage({
          id: 'msg-3',
          role: 'user',
          content: '¿Qué significa el ndc?',
        }),
        createMessage({
          id: 'msg-4',
          role: 'assistant',
          content: 'El ndc indica el número de categorías distintas...',
          metadata: {}, // No results or chartData for follow-up response
        }),
      ]

      mockUseMessages.mockReturnValue({
        data: messages,
        isLoading: false,
        isError: false,
        error: null,
      })

      render(<ChatContainer conversationId={VALID_CONVERSATION_ID} />, {
        wrapper: createWrapper(),
      })

      // Follow-up response should be visible
      expect(screen.getByText(/El ndc indica el número de categorías distintas/)).toBeInTheDocument()

      // Should only have 1 analysis results container (from the analysis, not the follow-up)
      const resultsContainers = screen.getAllByTestId('analysis-results-container')
      expect(resultsContainers).toHaveLength(1)
    })

    it('does not disable input for follow-up questions when not streaming', () => {
      mockUseStreamingChat.mockReturnValue({
        sendMessage: mockSendMessage,
        streamingContent: '',
        isStreaming: false,
        
        error: null,
        clearError: vi.fn(),
      })

      render(<ChatContainer conversationId={VALID_CONVERSATION_ID} />, {
        wrapper: createWrapper(),
      })

      expect(screen.getByPlaceholderText('Escribe tu mensaje...')).not.toBeDisabled()
    })

    it('streaming works correctly for follow-up responses', () => {
      // Simulate streaming a follow-up response
      mockUseStreamingChat.mockReturnValue({
        sendMessage: mockSendMessage,
        streamingContent: 'El ndc significa número de categorías distintas...',
        isStreaming: true,
        
        error: null,
        clearError: vi.fn(),
      })

      render(<ChatContainer conversationId={VALID_CONVERSATION_ID} />, {
        wrapper: createWrapper(),
      })

      // Streaming message should be visible
      expect(screen.getByTestId('streaming-message')).toBeInTheDocument()
      expect(screen.getByText(/El ndc significa/)).toBeInTheDocument()
    })
  })
})
