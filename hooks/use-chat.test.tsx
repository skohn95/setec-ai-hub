import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useSendChatMessage, useStreamingChat } from './use-chat'

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock toast for notifications
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useSendChatMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sends message to API and returns response', async () => {
    const mockResponse = {
      data: {
        userMessage: {
          id: 'user-msg-id',
          conversation_id: 'conv-123',
          role: 'user',
          content: 'Test message',
          created_at: new Date().toISOString(),
        },
        assistantMessage: {
          id: 'assistant-msg-id',
          conversation_id: 'conv-123',
          role: 'assistant',
          content: 'Response',
          created_at: new Date().toISOString(),
        },
        filtered: false,
      },
      error: null,
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { result } = renderHook(() => useSendChatMessage('conv-123'), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ content: 'Test message' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: 'conv-123', content: 'Test message' }),
    })
  })

  it('handles API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () =>
        Promise.resolve({
          data: null,
          error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
        }),
    })

    const { result } = renderHook(() => useSendChatMessage('conv-123'), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ content: 'Test message' })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useSendChatMessage('conv-123'), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ content: 'Test message' })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })

  it('updates isPending while sending', async () => {
    // Create a promise we can control
    let resolvePromise: (value: unknown) => void
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    mockFetch.mockImplementationOnce(() => pendingPromise)

    const { result } = renderHook(() => useSendChatMessage('conv-123'), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(false)

    result.current.mutate({ content: 'Test message' })

    await waitFor(() => {
      expect(result.current.isPending).toBe(true)
    })

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            userMessage: { id: '1' },
            assistantMessage: { id: '2' },
            filtered: false,
          },
          error: null,
        }),
    })

    await waitFor(() => {
      expect(result.current.isPending).toBe(false)
    })
  })
})

describe('useStreamingChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // Helper to create a mock SSE response
  function createSSEResponse(chunks: string[]) {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk))
          await new Promise((resolve) => setTimeout(resolve, 10))
        }
        controller.close()
      },
    })

    return {
      ok: true,
      headers: new Headers({ 'Content-Type': 'text/event-stream' }),
      body: stream,
    }
  }

  it('starts with idle state', () => {
    const { result } = renderHook(() => useStreamingChat('conv-123'), {
      wrapper: createWrapper(),
    })

    expect(result.current.streamingContent).toBe('')
    expect(result.current.isStreaming).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('sets isStreaming to true when sending', async () => {
    // Create a promise we can control
    let resolvePromise: (value: unknown) => void
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    mockFetch.mockImplementationOnce(() => pendingPromise)

    const { result } = renderHook(() => useStreamingChat('conv-123'), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.sendMessage('Hello')
    })

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(true)
    })

    // Resolve the promise with a non-streaming response to clean up
    resolvePromise!({
      ok: true,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: () =>
        Promise.resolve({
          data: { filtered: true },
          error: null,
        }),
    })

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(false)
    })
  })

  it('accumulates text chunks from SSE stream', async () => {
    const sseChunks = [
      'data: {"type":"text","content":"Hola, "}\n\n',
      'data: {"type":"text","content":"soy tu "}\n\n',
      'data: {"type":"text","content":"asistente."}\n\n',
      'data: {"type":"done"}\n\n',
    ]

    mockFetch.mockResolvedValueOnce(createSSEResponse(sseChunks))

    const { result } = renderHook(() => useStreamingChat('conv-123'), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.sendMessage('Hola')
    })

    await waitFor(() => {
      expect(result.current.streamingContent).toBe('Hola, soy tu asistente.')
    })

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(false)
    })
  })

  it('handles error events in stream', async () => {
    const sseChunks = [
      'data: {"type":"text","content":"Partial "}\n\n',
      'data: {"type":"error","content":"Something went wrong"}\n\n',
    ]

    mockFetch.mockResolvedValueOnce(createSSEResponse(sseChunks))

    const { result } = renderHook(() => useStreamingChat('conv-123'), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.sendMessage('Test')
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Something went wrong')
    })

    // Content should still have the partial
    expect(result.current.streamingContent).toBe('Partial ')
  })

  it('handles JSON response for filtered messages', async () => {
    const jsonResponse = {
      data: {
        userMessage: { id: '1' },
        assistantMessage: { id: '2', content: 'Filtered response' },
        filtered: true,
      },
      error: null,
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: () => Promise.resolve(jsonResponse),
    })

    const { result } = renderHook(() => useStreamingChat('conv-123'), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.sendMessage('Dame una receta')
    })

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(false)
    })

    // No streaming content for filtered messages
    expect(result.current.streamingContent).toBe('')
  })

  it('clears error with clearError', async () => {
    const sseChunks = ['data: {"type":"error","content":"Error message"}\n\n']

    mockFetch.mockResolvedValueOnce(createSSEResponse(sseChunks))

    const { result } = renderHook(() => useStreamingChat('conv-123'), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.sendMessage('Test')
    })

    await waitFor(() => {
      expect(result.current.error).toBe('Error message')
    })

    act(() => {
      result.current.clearError()
    })

    expect(result.current.error).toBeNull()
  })

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useStreamingChat('conv-123'), {
      wrapper: createWrapper(),
    })

    act(() => {
      result.current.sendMessage('Test')
    })

    await waitFor(() => {
      expect(result.current.error).not.toBeNull()
      expect(result.current.isStreaming).toBe(false)
    })
  })

  // Story 4.4: Tool call event handling tests
  describe('tool call events', () => {
    it('sets isAnalyzing when tool_call processing event received', async () => {
      const sseChunks = [
        'data: {"type":"text","content":"Analizando..."}\n\n',
        'data: {"type":"tool_call","name":"analyze","status":"processing"}\n\n',
        'data: {"type":"tool_result","data":{"results":{},"chartData":[{"type":"test","data":[]}],"instructions":"Test"}}\n\n',
        'data: {"type":"tool_call","name":"analyze","status":"complete"}\n\n',
        'data: {"type":"done"}\n\n',
      ]

      mockFetch.mockResolvedValueOnce(createSSEResponse(sseChunks))

      const { result } = renderHook(() => useStreamingChat('conv-123'), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.sendMessage('Analiza el archivo')
      })

      // Should be analyzing after processing event
      await waitFor(() => {
        expect(result.current.chartData).not.toBeNull()
      })

      // Should finish analyzing after complete
      await waitFor(() => {
        expect(result.current.isAnalyzing).toBe(false)
      })
    })

    it('stores chartData from tool_result event', async () => {
      const mockChartData = [
        { type: 'variationBreakdown', data: [{ source: 'Test', percentage: 50 }] },
      ]

      const sseChunks = [
        'data: {"type":"tool_call","name":"analyze","status":"processing"}\n\n',
        `data: {"type":"tool_result","data":{"results":{},"chartData":${JSON.stringify(mockChartData)},"instructions":"Test"}}\n\n`,
        'data: {"type":"tool_call","name":"analyze","status":"complete"}\n\n',
        'data: {"type":"done"}\n\n',
      ]

      mockFetch.mockResolvedValueOnce(createSSEResponse(sseChunks))

      const { result } = renderHook(() => useStreamingChat('conv-123'), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.sendMessage('Analiza')
      })

      await waitFor(() => {
        expect(result.current.chartData).toEqual(mockChartData)
      })
    })

    it('clears chartData with clearChartData', async () => {
      const mockChartData = [{ type: 'test', data: [] }]

      const sseChunks = [
        `data: {"type":"tool_result","data":{"results":{},"chartData":${JSON.stringify(mockChartData)},"instructions":"Test"}}\n\n`,
        'data: {"type":"done"}\n\n',
      ]

      mockFetch.mockResolvedValueOnce(createSSEResponse(sseChunks))

      const { result } = renderHook(() => useStreamingChat('conv-123'), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.sendMessage('Test')
      })

      await waitFor(() => {
        expect(result.current.chartData).not.toBeNull()
      })

      act(() => {
        result.current.clearChartData()
      })

      expect(result.current.chartData).toBeNull()
    })

    // Story 5.1: Analysis results handling tests
    it('stores analysisResults from tool_result event', async () => {
      const mockResults = {
        grr_percent: 18.2,
        repeatability_percent: 12.5,
        reproducibility_percent: 13.2,
        part_to_part_percent: 98.3,
        ndc: 4,
        classification: 'marginal',
      }

      const sseChunks = [
        'data: {"type":"tool_call","name":"analyze","status":"processing"}\n\n',
        `data: {"type":"tool_result","data":{"results":${JSON.stringify(mockResults)},"chartData":[],"instructions":"Test"}}\n\n`,
        'data: {"type":"tool_call","name":"analyze","status":"complete"}\n\n',
        'data: {"type":"done"}\n\n',
      ]

      mockFetch.mockResolvedValueOnce(createSSEResponse(sseChunks))

      const { result } = renderHook(() => useStreamingChat('conv-123'), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.sendMessage('Analiza')
      })

      await waitFor(() => {
        expect(result.current.analysisResults).toEqual(mockResults)
      })
    })

    it('clears analysisResults with clearAnalysisResults', async () => {
      const mockResults = {
        grr_percent: 10,
        repeatability_percent: 5,
        reproducibility_percent: 5,
        part_to_part_percent: 90,
        ndc: 5,
        classification: 'aceptable',
      }

      const sseChunks = [
        `data: {"type":"tool_result","data":{"results":${JSON.stringify(mockResults)},"chartData":[],"instructions":"Test"}}\n\n`,
        'data: {"type":"done"}\n\n',
      ]

      mockFetch.mockResolvedValueOnce(createSSEResponse(sseChunks))

      const { result } = renderHook(() => useStreamingChat('conv-123'), {
        wrapper: createWrapper(),
      })

      act(() => {
        result.current.sendMessage('Test')
      })

      await waitFor(() => {
        expect(result.current.analysisResults).not.toBeNull()
      })

      act(() => {
        result.current.clearAnalysisResults()
      })

      expect(result.current.analysisResults).toBeNull()
    })
  })
})
