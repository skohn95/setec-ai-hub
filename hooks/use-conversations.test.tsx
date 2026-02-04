import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useConversations, useConversation, useDeleteConversation } from './use-conversations'
import type { ReactNode } from 'react'

// Mock the Supabase conversations module
const mockGetConversations = vi.fn()
const mockGetConversation = vi.fn()
const mockDeleteConversation = vi.fn()

vi.mock('@/lib/supabase/conversations', () => ({
  getConversations: (...args: unknown[]) => mockGetConversations(...args),
  getConversation: (...args: unknown[]) => mockGetConversation(...args),
  deleteConversation: (...args: unknown[]) => mockDeleteConversation(...args),
}))

// Mock the auth provider
const mockUseAuth = vi.fn()
vi.mock('@/lib/providers/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockConversations = [
  {
    id: 'conv-1',
    user_id: 'user-1',
    title: 'Test Conversation 1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
  {
    id: 'conv-2',
    user_id: 'user-1',
    title: 'Test Conversation 2',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-03T00:00:00Z',
  },
]

const mockConversationWithMessages = {
  ...mockConversations[0],
  messages: [
    {
      id: 'msg-1',
      conversation_id: 'conv-1',
      role: 'user' as const,
      content: 'Hello',
      metadata: {},
      created_at: '2026-01-01T00:00:00Z',
    },
  ],
}

// Create a wrapper for testing hooks
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe('useConversations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns data correctly when user is authenticated', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } })
    mockGetConversations.mockResolvedValue({ data: mockConversations, error: null })

    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockConversations)
    expect(mockGetConversations).toHaveBeenCalledWith('user-1')
  })

  it('handles loading state correctly', () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } })
    mockGetConversations.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('handles error state correctly', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } })
    // Mock returning error in response (hook throws this error)
    mockGetConversations.mockResolvedValue({
      data: null,
      error: new Error('Database error'),
    })

    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    }, { timeout: 3000 })

    expect(result.current.error).toBeDefined()
  })

  it('does not fetch when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null })

    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(true)
    expect(mockGetConversations).not.toHaveBeenCalled()
  })
})

describe('useConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns conversation with messages correctly', async () => {
    mockGetConversation.mockResolvedValue({ data: mockConversationWithMessages, error: null })

    const { result } = renderHook(() => useConversation('conv-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockConversationWithMessages)
    expect(mockGetConversation).toHaveBeenCalledWith('conv-1')
  })

  it('does not fetch when id is null', () => {
    const { result } = renderHook(() => useConversation(null), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(true)
    expect(mockGetConversation).not.toHaveBeenCalled()
  })

  it('handles not found error', async () => {
    mockGetConversation.mockRejectedValue(new Error('Not found'))

    const { result } = renderHook(() => useConversation('conv-invalid'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    }, { timeout: 3000 })
  })
})

describe('useDeleteConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes conversation successfully', async () => {
    mockDeleteConversation.mockResolvedValue({ success: true, error: null })

    const { result } = renderHook(() => useDeleteConversation(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('conv-1')

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockDeleteConversation).toHaveBeenCalledWith('conv-1')
  })

  it('handles delete error', async () => {
    mockDeleteConversation.mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => useDeleteConversation(), {
      wrapper: createWrapper(),
    })

    result.current.mutate('conv-1')

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    }, { timeout: 3000 })
  })

  it('rolls back optimistic update on error', async () => {
    // Create a QueryClient with pre-populated data
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })

    // Pre-populate the cache with conversations
    const { queryKeys } = await import('@/constants/query-keys')
    queryClient.setQueryData(queryKeys.conversations.lists(), mockConversations)

    // Verify initial state
    const initialData = queryClient.getQueryData(queryKeys.conversations.lists())
    expect(initialData).toHaveLength(2)

    // Mock delete to fail
    mockDeleteConversation.mockRejectedValue(new Error('Network error'))

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useDeleteConversation(), { wrapper })

    // Trigger delete
    result.current.mutate('conv-1')

    // Wait for mutation to fail and rollback
    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    }, { timeout: 3000 })

    // Verify data was rolled back - should still have both conversations
    const rolledBackData = queryClient.getQueryData<typeof mockConversations>(
      queryKeys.conversations.lists()
    )
    expect(rolledBackData).toHaveLength(2)
    expect(rolledBackData?.find(c => c.id === 'conv-1')).toBeDefined()
  })
})
