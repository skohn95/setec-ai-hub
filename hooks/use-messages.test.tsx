import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

// Valid UUID for testing
const VALID_CONVERSATION_ID = '123e4567-e89b-12d3-a456-426614174000'

// Mock the messages service
const mockFetchMessages = vi.fn()
const mockCreateMessage = vi.fn()

vi.mock('@/lib/supabase/messages', () => ({
  fetchMessages: (...args: unknown[]) => mockFetchMessages(...args),
  createMessage: (...args: unknown[]) => mockCreateMessage(...args),
}))

// Import after mocks are set up
import { useMessages, useSendMessage } from './use-messages'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
  Wrapper.displayName = 'TestQueryClientWrapper'
  return Wrapper
}

describe('useMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns data in correct format', async () => {
    const mockMessages = [
      {
        id: 'msg-1',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'user',
        content: 'Hello',
        metadata: {},
        created_at: '2026-02-04T00:00:00Z',
      },
      {
        id: 'msg-2',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'assistant',
        content: 'Hi there!',
        metadata: {},
        created_at: '2026-02-04T00:01:00Z',
      },
    ]
    mockFetchMessages.mockResolvedValue({ data: mockMessages, error: null })

    const { result } = renderHook(() => useMessages(VALID_CONVERSATION_ID), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockMessages)
    expect(mockFetchMessages).toHaveBeenCalledWith(VALID_CONVERSATION_ID)
  })

  it('returns empty array when no messages exist', async () => {
    mockFetchMessages.mockResolvedValue({ data: [], error: null })

    const { result } = renderHook(() => useMessages(VALID_CONVERSATION_ID), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual([])
  })

  it('handles error correctly', async () => {
    mockFetchMessages.mockResolvedValue({ data: null, error: new Error('Database error') })

    const { result } = renderHook(() => useMessages(VALID_CONVERSATION_ID), {
      wrapper: createWrapper(),
    })

    await waitFor(
      () => {
        expect(result.current.isError).toBe(true)
      },
      { timeout: 3000 }
    )

    expect(result.current.error).toBeInstanceOf(Error)
    expect((result.current.error as Error).message).toBe('Database error')
  })

  it('does not fetch when conversationId is null', async () => {
    const { result } = renderHook(() => useMessages(null), {
      wrapper: createWrapper(),
    })

    expect(result.current.isFetching).toBe(false)
    expect(mockFetchMessages).not.toHaveBeenCalled()
  })

  it('shows loading state while fetching', async () => {
    mockFetchMessages.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: [], error: null }), 100)
        )
    )

    const { result } = renderHook(() => useMessages(VALID_CONVERSATION_ID), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })
})

describe('useSendMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls createMessage with correct parameters', async () => {
    const mockMessage = {
      id: 'msg-new',
      conversation_id: VALID_CONVERSATION_ID,
      role: 'user',
      content: 'New message',
      metadata: {},
      created_at: '2026-02-04T00:00:00Z',
    }
    mockCreateMessage.mockResolvedValue({ data: mockMessage, error: null })

    const { result } = renderHook(() => useSendMessage(VALID_CONVERSATION_ID), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ content: 'New message' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockCreateMessage).toHaveBeenCalledWith(VALID_CONVERSATION_ID, 'user', 'New message')
  })

  it('handles error correctly', async () => {
    mockCreateMessage.mockResolvedValue({ data: null, error: new Error('Send failed') })

    const { result } = renderHook(() => useSendMessage(VALID_CONVERSATION_ID), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ content: 'New message' })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error).toBeInstanceOf(Error)
  })

  it('shows pending state during mutation', async () => {
    mockCreateMessage.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: {
                  id: 'msg-new',
                  conversation_id: VALID_CONVERSATION_ID,
                  role: 'user',
                  content: 'New message',
                  metadata: {},
                  created_at: '2026-02-04T00:00:00Z',
                },
                error: null,
              }),
            100
          )
        )
    )

    const { result } = renderHook(() => useSendMessage(VALID_CONVERSATION_ID), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ content: 'New message' })

    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
  })

  it('performs optimistic update on mutation', async () => {
    const existingMessages = [
      {
        id: 'msg-1',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'user' as const,
        content: 'Existing message',
        metadata: {},
        created_at: '2026-02-04T00:00:00Z',
      },
    ]
    mockFetchMessages.mockResolvedValue({ data: existingMessages, error: null })

    const newMessage = {
      id: 'msg-new',
      conversation_id: VALID_CONVERSATION_ID,
      role: 'user' as const,
      content: 'Optimistic message',
      metadata: {},
      created_at: '2026-02-04T00:01:00Z',
    }
    mockCreateMessage.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: newMessage, error: null }), 200)
        )
    )

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    // First fetch messages
    const { result: messagesResult } = renderHook(
      () => useMessages(VALID_CONVERSATION_ID),
      { wrapper }
    )

    await waitFor(() => {
      expect(messagesResult.current.isSuccess).toBe(true)
    })

    // Then send a message
    const { result: sendResult } = renderHook(
      () => useSendMessage(VALID_CONVERSATION_ID),
      { wrapper }
    )

    sendResult.current.mutate({ content: 'Optimistic message' })

    // Should optimistically add the message immediately
    await waitFor(() => {
      const cachedData = queryClient.getQueryData(['messages', 'list', { conversationId: VALID_CONVERSATION_ID }])
      expect(cachedData).toBeDefined()
      expect(Array.isArray(cachedData)).toBe(true)
      expect((cachedData as unknown[]).length).toBeGreaterThan(1)
    })
  })
})
