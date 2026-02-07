import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

// Mock dependencies
const mockFilterMessage = vi.fn()
const mockCreateMessage = vi.fn()
const mockFetchMessages = vi.fn()
const mockUpdateMessageMetadata = vi.fn()
const mockGetUser = vi.fn()
const mockStreamMainAgentWithTools = vi.fn()
const mockUpdateConversationTimestamp = vi.fn()
const mockBuildFileContext = vi.fn()
const mockInvokeAnalysisTool = vi.fn()

vi.mock('@/lib/openai/filter-agent', () => {
  // FilterError mock class defined inside factory to avoid hoisting issues
  class MockFilterError extends Error {
    code: string
    isRetryable: boolean
    constructor(message: string, code: string, isRetryable: boolean) {
      super(message)
      this.name = 'FilterError'
      this.code = code
      this.isRetryable = isRetryable
    }
  }
  return {
    filterMessage: (...args: unknown[]) => mockFilterMessage(...args),
    FilterError: MockFilterError,
  }
})

vi.mock('@/lib/supabase/messages', () => ({
  createMessage: (...args: unknown[]) => mockCreateMessage(...args),
  fetchMessages: (...args: unknown[]) => mockFetchMessages(...args),
  updateMessageMetadata: (...args: unknown[]) => mockUpdateMessageMetadata(...args),
}))

vi.mock('@/lib/supabase/conversations', () => ({
  updateConversationTimestamp: (...args: unknown[]) => mockUpdateConversationTimestamp(...args),
}))

vi.mock('@/lib/openai/main-agent', () => ({
  streamMainAgentWithTools: (...args: unknown[]) => mockStreamMainAgentWithTools(...args),
}))

vi.mock('@/lib/openai/file-context', () => ({
  buildFileContext: (...args: unknown[]) => mockBuildFileContext(...args),
}))

vi.mock('@/lib/api/analyze', () => ({
  invokeAnalysisTool: (...args: unknown[]) => mockInvokeAnalysisTool(...args),
}))

vi.mock('@/lib/openai/rejection-messages', () => ({
  REJECTION_MESSAGE:
    'Soy un asistente especializado en análisis estadístico para Lean Six Sigma.',
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: () => mockGetUser(),
    },
  })),
}))

function createRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/chat', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

// Valid UUID for testing
const VALID_CONVERSATION_ID = '123e4567-e89b-12d3-a456-426614174000'
const MOCK_USER = { id: 'user-123', email: 'test@example.com' }

describe('POST /api/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: user is authenticated
    mockGetUser.mockResolvedValue({ data: { user: MOCK_USER }, error: null })
    // Default: timestamp update succeeds
    mockUpdateConversationTimestamp.mockResolvedValue({ success: true, error: null })
    // Default: no files available
    mockBuildFileContext.mockResolvedValue({ files: [], contextString: '', hasMultipleFiles: false })
    // Default: metadata update succeeds
    mockUpdateMessageMetadata.mockResolvedValue({ data: {}, error: null })
  })

  describe('authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null })

      const req = createRequest({
        conversationId: VALID_CONVERSATION_ID,
        content: 'Test message',
      })

      const response = await POST(req)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error.code).toBe('UNAUTHORIZED')
    })

    it('returns 401 when auth error occurs', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: new Error('Auth failed') })

      const req = createRequest({
        conversationId: VALID_CONVERSATION_ID,
        content: 'Test message',
      })

      const response = await POST(req)
      const body = await response.json()

      expect(response.status).toBe(401)
      expect(body.error.code).toBe('UNAUTHORIZED')
    })
  })

  describe('successful on-topic message with streaming', () => {
    it('returns SSE stream when message is allowed', async () => {
      const userMessage = {
        id: 'user-msg-id',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'user',
        content: 'Quiero hacer un análisis MSA',
        metadata: {},
        created_at: new Date().toISOString(),
      }

      mockFilterMessage.mockResolvedValueOnce({ allowed: true })
      mockCreateMessage.mockResolvedValueOnce({ data: userMessage, error: null })
      mockFetchMessages.mockResolvedValueOnce({ data: [], error: null })

      // Mock streaming response with new event-based interface
      mockStreamMainAgentWithTools.mockImplementation(async function* () {
        yield { type: 'text', content: 'Hola, ' }
        yield { type: 'text', content: 'soy tu asistente.' }
        yield { type: 'done' }
      })

      const req = createRequest({
        conversationId: VALID_CONVERSATION_ID,
        content: 'Quiero hacer un análisis MSA',
      })

      const response = await POST(req)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/event-stream')
      expect(response.headers.get('Cache-Control')).toBe('no-cache')
    })

    it('streams text chunks in SSE format', async () => {
      const userMessage = {
        id: 'user-msg-id',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'user',
        content: '¿Qué es MSA?',
        metadata: {},
        created_at: new Date().toISOString(),
      }

      mockFilterMessage.mockResolvedValueOnce({ allowed: true })
      mockCreateMessage
        .mockResolvedValueOnce({ data: userMessage, error: null })
        .mockResolvedValueOnce({ data: { ...userMessage, role: 'assistant', content: 'Hola, soy tu asistente.' }, error: null })
      mockFetchMessages.mockResolvedValueOnce({ data: [], error: null })

      mockStreamMainAgentWithTools.mockImplementation(async function* () {
        yield { type: 'text', content: 'Hola, ' }
        yield { type: 'text', content: 'soy tu asistente.' }
        yield { type: 'done' }
      })

      const req = createRequest({
        conversationId: VALID_CONVERSATION_ID,
        content: '¿Qué es MSA?',
      })

      const response = await POST(req)
      const text = await response.text()

      // Should contain SSE data events
      expect(text).toContain('data: ')
      expect(text).toContain('"type":"text"')
      expect(text).toContain('"type":"done"')
    })

    it('saves complete assistant message after stream completes', async () => {
      const userMessage = {
        id: 'user-msg-id',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'user',
        content: 'Hola',
        metadata: {},
        created_at: new Date().toISOString(),
      }

      mockFilterMessage.mockResolvedValueOnce({ allowed: true })
      mockCreateMessage
        .mockResolvedValueOnce({ data: userMessage, error: null })
        .mockResolvedValueOnce({ data: { ...userMessage, role: 'assistant' }, error: null })
      mockFetchMessages.mockResolvedValueOnce({ data: [], error: null })

      mockStreamMainAgentWithTools.mockImplementation(async function* () {
        yield { type: 'text', content: 'Respuesta ' }
        yield { type: 'text', content: 'completa.' }
        yield { type: 'done' }
      })

      const req = createRequest({
        conversationId: VALID_CONVERSATION_ID,
        content: 'Hola',
      })

      const response = await POST(req)
      // Consume the stream to ensure completion
      await response.text()

      // Second createMessage call should be for assistant with full content
      expect(mockCreateMessage).toHaveBeenCalledTimes(2)
      expect(mockCreateMessage.mock.calls[1]).toEqual([
        VALID_CONVERSATION_ID,
        'assistant',
        'Respuesta completa.',
      ])
    })
  })

  describe('rejected off-topic message', () => {
    it('returns rejection message when filtered', async () => {
      const userMessage = {
        id: 'user-msg-id',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'user',
        content: 'Dame una receta',
        created_at: new Date().toISOString(),
      }
      const rejectionMessage = {
        id: 'rejection-msg-id',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'assistant',
        content: 'Soy un asistente especializado en análisis estadístico para Lean Six Sigma.',
        created_at: new Date().toISOString(),
      }

      mockFilterMessage.mockResolvedValueOnce({ allowed: false })
      mockCreateMessage
        .mockResolvedValueOnce({ data: userMessage, error: null })
        .mockResolvedValueOnce({ data: rejectionMessage, error: null })

      const req = createRequest({
        conversationId: VALID_CONVERSATION_ID,
        content: 'Dame una receta',
      })

      const response = await POST(req)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.data.filtered).toBe(true)
      expect(body.data.assistantMessage.content).toContain('especializado en análisis estadístico')
    })
  })

  describe('saves messages to database', () => {
    it('saves user message before filtering', async () => {
      const userMessage = {
        id: 'msg-id',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'user',
        content: 'Hello',
        metadata: {},
        created_at: new Date().toISOString(),
      }

      mockCreateMessage
        .mockResolvedValueOnce({ data: userMessage, error: null })
        .mockResolvedValueOnce({
          data: { ...userMessage, role: 'assistant' },
          error: null,
        })
      mockFilterMessage.mockResolvedValueOnce({ allowed: true })
      mockFetchMessages.mockResolvedValueOnce({ data: [], error: null })
      mockStreamMainAgentWithTools.mockImplementation(async function* () {
        yield { type: 'text', content: 'Response' }
        yield { type: 'done' }
      })

      const req = createRequest({
        conversationId: VALID_CONVERSATION_ID,
        content: 'Hello',
      })

      const response = await POST(req)
      await response.text() // Consume stream

      expect(mockCreateMessage).toHaveBeenCalledWith(VALID_CONVERSATION_ID, 'user', 'Hello')
    })

    it('saves assistant response after stream completes', async () => {
      const userMessage = {
        id: 'user-id',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'user',
        content: 'Test',
        metadata: {},
        created_at: new Date().toISOString(),
      }

      mockCreateMessage
        .mockResolvedValueOnce({ data: userMessage, error: null })
        .mockResolvedValueOnce({
          data: { ...userMessage, role: 'assistant' },
          error: null,
        })
      mockFilterMessage.mockResolvedValueOnce({ allowed: true })
      mockFetchMessages.mockResolvedValueOnce({ data: [], error: null })
      mockStreamMainAgentWithTools.mockImplementation(async function* () {
        yield { type: 'text', content: 'Streamed response' }
        yield { type: 'done' }
      })

      const req = createRequest({
        conversationId: VALID_CONVERSATION_ID,
        content: 'Test',
      })

      const response = await POST(req)
      await response.text() // Consume stream to trigger completion

      // Second call should be for assistant message with streamed content
      expect(mockCreateMessage).toHaveBeenCalledTimes(2)
      expect(mockCreateMessage.mock.calls[1][1]).toBe('assistant')
      expect(mockCreateMessage.mock.calls[1][2]).toBe('Streamed response')
    })
  })

  describe('error handling', () => {
    it('returns error when user message creation fails', async () => {
      mockCreateMessage.mockResolvedValueOnce({
        data: null,
        error: new Error('Database error'),
      })

      const req = createRequest({
        conversationId: VALID_CONVERSATION_ID,
        content: 'Test',
      })

      const response = await POST(req)
      const body = await response.json()

      expect(response.status).toBe(500)
      expect(body.data).toBeNull()
      expect(body.error).not.toBeNull()
    })

    it('returns error when OpenAI filter fails', async () => {
      const userMessage = {
        id: 'msg-id',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'user',
        content: 'Test',
        created_at: new Date().toISOString(),
      }

      mockCreateMessage.mockResolvedValueOnce({ data: userMessage, error: null })
      mockFilterMessage.mockRejectedValueOnce(new Error('OpenAI unavailable'))

      const req = createRequest({
        conversationId: VALID_CONVERSATION_ID,
        content: 'Test',
      })

      const response = await POST(req)
      const body = await response.json()

      // Returns 503 for service unavailability (Story 6.2: proper status codes)
      expect(response.status).toBe(503)
      expect(body.error).not.toBeNull()
      expect(body.error.code).toBe('OPENAI_UNAVAILABLE')
    })

    it('returns validation error for missing content', async () => {
      const req = createRequest({
        conversationId: VALID_CONVERSATION_ID,
        content: '',
      })

      const response = await POST(req)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('returns validation error for missing conversationId', async () => {
      const req = createRequest({
        content: 'Hello',
      })

      const response = await POST(req)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('returns validation error for invalid UUID format', async () => {
      const req = createRequest({
        conversationId: 'not-a-valid-uuid',
        content: 'Hello',
      })

      const response = await POST(req)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error.code).toBe('VALIDATION_ERROR')
      expect(body.error.message).toContain('inválido')
    })

    it('returns validation error for message exceeding max length', async () => {
      const longContent = 'a'.repeat(10001) // Over 10000 char limit

      const req = createRequest({
        conversationId: VALID_CONVERSATION_ID,
        content: longContent,
      })

      const response = await POST(req)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error.code).toBe('VALIDATION_ERROR')
      expect(body.error.message).toContain('10000')
    })

    it('handles streaming error mid-response and preserves partial content', async () => {
      const userMessage = {
        id: 'msg-id',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'user',
        content: 'Test',
        metadata: {},
        created_at: new Date().toISOString(),
      }

      mockCreateMessage
        .mockResolvedValueOnce({ data: userMessage, error: null })
        .mockResolvedValueOnce({ data: { ...userMessage, role: 'assistant' }, error: null })
      mockFilterMessage.mockResolvedValueOnce({ allowed: true })
      mockFetchMessages.mockResolvedValueOnce({ data: [], error: null })

      // Mock streaming that throws mid-response
      mockStreamMainAgentWithTools.mockImplementation(async function* () {
        yield { type: 'text', content: 'Partial ' }
        throw new Error('Connection lost')
      })

      const req = createRequest({
        conversationId: VALID_CONVERSATION_ID,
        content: 'Test',
      })

      const response = await POST(req)
      const text = await response.text()

      // Should contain the partial content and an error event
      expect(text).toContain('"type":"text"')
      expect(text).toContain('Partial ')
      expect(text).toContain('"type":"error"')
    })
  })

  describe('tool calling integration', () => {
    const MOCK_FILE_ID = '456e7890-e89b-12d3-a456-426614174001'
    const MOCK_MESSAGE_ID = 'assistant-msg-123'

    const mockFileContext = {
      files: [
        {
          id: MOCK_FILE_ID,
          name: 'datos-msa.xlsx',
          status: 'pending',
        },
      ],
      contextString: 'Archivo disponible: datos-msa.xlsx (ID: 456e7890-e89b-12d3-a456-426614174001)',
      hasMultipleFiles: false,
    }

    const mockAnalysisResult = {
      results: {
        grr_percent: 15.5,
        repeatability_percent: 8.2,
        reproducibility_percent: 7.3,
        part_to_part_percent: 84.5,
        ndc: 6,
        classification: 'marginal',
      },
      chartData: [
        {
          type: 'variationBreakdown',
          data: [
            { source: 'Repetibilidad', percentage: 8.2, color: '#3B82F6' },
            { source: 'Reproducibilidad', percentage: 7.3, color: '#F97316' },
            { source: 'Parte a Parte', percentage: 84.5, color: '#10B981' },
          ],
        },
      ],
      instructions: '## Resultados del Análisis MSA...',
    }

    it('invokes tool when agent yields tool_call event', async () => {
      const userMessage = {
        id: 'user-msg-id',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'user',
        content: 'Analiza el archivo para MSA',
        metadata: {},
        created_at: new Date().toISOString(),
      }

      const assistantMessage = {
        id: MOCK_MESSAGE_ID,
        conversation_id: VALID_CONVERSATION_ID,
        role: 'assistant',
        content: '',
        metadata: {},
        created_at: new Date().toISOString(),
      }

      mockFilterMessage.mockResolvedValueOnce({ allowed: true })
      mockCreateMessage
        .mockResolvedValueOnce({ data: userMessage, error: null })
        .mockResolvedValueOnce({ data: assistantMessage, error: null })
      mockFetchMessages.mockResolvedValueOnce({ data: [], error: null })
      mockBuildFileContext.mockResolvedValueOnce(mockFileContext)
      mockInvokeAnalysisTool.mockResolvedValueOnce({
        success: true,
        data: mockAnalysisResult,
        error: null,
      })

      // Mock agent that yields tool call and then continues with results
      mockStreamMainAgentWithTools.mockImplementation(async function* () {
        yield { type: 'text', content: 'Analizando el archivo...\n' }
        yield {
          type: 'tool_call',
          name: 'analyze',
          callId: 'call-123',
          arguments: { analysis_type: 'msa', file_id: MOCK_FILE_ID },
        }
        yield { type: 'text', content: mockAnalysisResult.instructions }
        yield { type: 'done' }
      })

      const req = createRequest({
        conversationId: VALID_CONVERSATION_ID,
        content: 'Analiza el archivo para MSA',
      })

      const response = await POST(req)
      const text = await response.text()

      // Should invoke the analysis tool
      expect(mockInvokeAnalysisTool).toHaveBeenCalledWith('msa', MOCK_FILE_ID, MOCK_MESSAGE_ID)

      // Should contain tool call processing event
      expect(text).toContain('"type":"tool_call"')
      expect(text).toContain('"status":"processing"')

      // Should contain tool result event
      expect(text).toContain('"type":"tool_result"')
    })

    it('streams tool_call status events to frontend', async () => {
      const userMessage = {
        id: 'user-msg-id',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'user',
        content: 'Realiza un análisis MSA',
        metadata: {},
        created_at: new Date().toISOString(),
      }

      mockFilterMessage.mockResolvedValueOnce({ allowed: true })
      mockCreateMessage
        .mockResolvedValueOnce({ data: userMessage, error: null })
        .mockResolvedValueOnce({
          data: { id: MOCK_MESSAGE_ID, role: 'assistant', content: '' },
          error: null,
        })
      mockFetchMessages.mockResolvedValueOnce({ data: [], error: null })
      mockBuildFileContext.mockResolvedValueOnce(mockFileContext)
      mockInvokeAnalysisTool.mockResolvedValueOnce({
        success: true,
        data: mockAnalysisResult,
        error: null,
      })

      mockStreamMainAgentWithTools.mockImplementation(async function* () {
        yield {
          type: 'tool_call',
          name: 'analyze',
          callId: 'call-456',
          arguments: { analysis_type: 'msa', file_id: MOCK_FILE_ID },
        }
        yield { type: 'text', content: 'Resultados listos.' }
        yield { type: 'done' }
      })

      const req = createRequest({
        conversationId: VALID_CONVERSATION_ID,
        content: 'Realiza un análisis MSA',
      })

      const response = await POST(req)
      const text = await response.text()

      // Parse SSE events
      const lines = text.split('\n').filter((l) => l.startsWith('data: '))

      // Should have processing and complete status events
      const toolCallEvents = lines
        .map((l) => {
          try {
            return JSON.parse(l.slice(6))
          } catch {
            return null
          }
        })
        .filter((e) => e?.type === 'tool_call')

      expect(toolCallEvents.length).toBeGreaterThanOrEqual(2)
      expect(toolCallEvents.some((e) => e.status === 'processing')).toBe(true)
      expect(toolCallEvents.some((e) => e.status === 'complete')).toBe(true)
    })

    it('handles analysis tool validation error gracefully', async () => {
      const userMessage = {
        id: 'user-msg-id',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'user',
        content: 'Analiza este archivo',
        metadata: {},
        created_at: new Date().toISOString(),
      }

      mockFilterMessage.mockResolvedValueOnce({ allowed: true })
      mockCreateMessage
        .mockResolvedValueOnce({ data: userMessage, error: null })
        .mockResolvedValueOnce({
          data: { id: MOCK_MESSAGE_ID, role: 'assistant', content: '' },
          error: null,
        })
      mockFetchMessages.mockResolvedValueOnce({ data: [], error: null })
      mockBuildFileContext.mockResolvedValueOnce(mockFileContext)

      // Mock validation error from analysis tool
      mockInvokeAnalysisTool.mockResolvedValueOnce({
        success: false,
        data: null,
        error: {
          code: 'FILE_VALIDATION_ERROR',
          message: 'El archivo tiene errores de validación',
          validationErrors: [
            { row: 2, column: 'Part', error: 'Valor vacío encontrado' },
          ],
        },
      })

      mockStreamMainAgentWithTools.mockImplementation(async function* () {
        yield {
          type: 'tool_call',
          name: 'analyze',
          callId: 'call-err',
          arguments: { analysis_type: 'msa', file_id: MOCK_FILE_ID },
        }
        yield { type: 'text', content: 'Hubo un error.' }
        yield { type: 'done' }
      })

      const req = createRequest({
        conversationId: VALID_CONVERSATION_ID,
        content: 'Analiza este archivo',
      })

      const response = await POST(req)
      const text = await response.text()

      // Should contain error status event
      expect(text).toContain('"type":"tool_call"')
      expect(text).toContain('"status":"error"')
    })

    it('updates message metadata with chartData after successful analysis', async () => {
      const userMessage = {
        id: 'user-msg-id',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'user',
        content: 'Analiza para MSA',
        metadata: {},
        created_at: new Date().toISOString(),
      }

      mockFilterMessage.mockResolvedValueOnce({ allowed: true })
      // First call: user message, Second call: partial assistant (before tool), Third call: final assistant
      mockCreateMessage
        .mockResolvedValueOnce({ data: userMessage, error: null })
        .mockResolvedValueOnce({
          data: { id: MOCK_MESSAGE_ID, role: 'assistant', content: 'Analizando...' },
          error: null,
        })
      mockFetchMessages.mockResolvedValueOnce({ data: [], error: null })
      mockBuildFileContext.mockResolvedValueOnce(mockFileContext)
      mockInvokeAnalysisTool.mockResolvedValueOnce({
        success: true,
        data: mockAnalysisResult,
        error: null,
      })

      // Agent yields some text BEFORE the tool call (so message is created first)
      mockStreamMainAgentWithTools.mockImplementation(async function* () {
        yield { type: 'text', content: 'Analizando...' }
        yield {
          type: 'tool_call',
          name: 'analyze',
          callId: 'call-meta',
          arguments: { analysis_type: 'msa', file_id: MOCK_FILE_ID },
        }
        yield { type: 'text', content: ' Listo!' }
        yield { type: 'done' }
      })

      const req = createRequest({
        conversationId: VALID_CONVERSATION_ID,
        content: 'Analiza para MSA',
      })

      const response = await POST(req)
      await response.text() // Consume stream

      // Should update message metadata with chartData
      expect(mockUpdateMessageMetadata).toHaveBeenCalledWith(
        MOCK_MESSAGE_ID,
        expect.objectContaining({
          chartData: mockAnalysisResult.chartData,
        })
      )
    })

    it('passes file context to agent when files are available', async () => {
      const userMessage = {
        id: 'user-msg-id',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'user',
        content: '¿Qué puedo hacer?',
        metadata: {},
        created_at: new Date().toISOString(),
      }

      mockFilterMessage.mockResolvedValueOnce({ allowed: true })
      mockCreateMessage
        .mockResolvedValueOnce({ data: userMessage, error: null })
        .mockResolvedValueOnce({
          data: { id: 'asst-id', role: 'assistant', content: '' },
          error: null,
        })
      mockFetchMessages.mockResolvedValueOnce({ data: [], error: null })
      mockBuildFileContext.mockResolvedValueOnce(mockFileContext)

      mockStreamMainAgentWithTools.mockImplementation(async function* () {
        yield { type: 'text', content: 'Tienes un archivo disponible.' }
        yield { type: 'done' }
      })

      const req = createRequest({
        conversationId: VALID_CONVERSATION_ID,
        content: '¿Qué puedo hacer?',
      })

      const response = await POST(req)
      await response.text()

      // Should call buildFileContext with conversation ID
      expect(mockBuildFileContext).toHaveBeenCalledWith(VALID_CONVERSATION_ID)

      // Should pass file context STRING (not object) to streamMainAgentWithTools
      expect(mockStreamMainAgentWithTools).toHaveBeenCalledWith(
        expect.objectContaining({
          fileContext: mockFileContext.contextString,
        })
      )
    })

    it('handles multiple files by passing context to agent', async () => {
      const multipleFilesContext = {
        files: [
          { id: 'file-1', name: 'datos1.xlsx', status: 'pending' },
          { id: 'file-2', name: 'datos2.xlsx', status: 'pending' },
        ],
        contextString: 'Archivos disponibles:\n- datos1.xlsx (ID: file-1)\n- datos2.xlsx (ID: file-2)',
        hasMultipleFiles: true,
      }

      const userMessage = {
        id: 'user-msg-id',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'user',
        content: 'Analiza los archivos',
        metadata: {},
        created_at: new Date().toISOString(),
      }

      mockFilterMessage.mockResolvedValueOnce({ allowed: true })
      mockCreateMessage
        .mockResolvedValueOnce({ data: userMessage, error: null })
        .mockResolvedValueOnce({
          data: { id: 'asst-id', role: 'assistant', content: '' },
          error: null,
        })
      mockFetchMessages.mockResolvedValueOnce({ data: [], error: null })
      mockBuildFileContext.mockResolvedValueOnce(multipleFilesContext)

      mockStreamMainAgentWithTools.mockImplementation(async function* () {
        yield { type: 'text', content: 'Tienes varios archivos. ¿Cuál quieres analizar?' }
        yield { type: 'done' }
      })

      const req = createRequest({
        conversationId: VALID_CONVERSATION_ID,
        content: 'Analiza los archivos',
      })

      const response = await POST(req)
      await response.text()

      // Should pass multiple files context STRING to agent
      expect(mockStreamMainAgentWithTools).toHaveBeenCalledWith(
        expect.objectContaining({
          fileContext: multipleFilesContext.contextString,
        })
      )
    })

    it('does not invoke tool when no files available and user asks for analysis', async () => {
      const emptyFileContext = {
        files: [],
        contextString: '',
        hasMultipleFiles: false,
      }

      const userMessage = {
        id: 'user-msg-id',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'user',
        content: 'Realiza un análisis MSA',
        metadata: {},
        created_at: new Date().toISOString(),
      }

      mockFilterMessage.mockResolvedValueOnce({ allowed: true })
      mockCreateMessage
        .mockResolvedValueOnce({ data: userMessage, error: null })
        .mockResolvedValueOnce({
          data: { id: 'asst-id', role: 'assistant', content: '' },
          error: null,
        })
      mockFetchMessages.mockResolvedValueOnce({ data: [], error: null })
      mockBuildFileContext.mockResolvedValueOnce(emptyFileContext)

      // Agent should ask user to upload a file instead of calling tool
      mockStreamMainAgentWithTools.mockImplementation(async function* () {
        yield {
          type: 'text',
          content: 'Para realizar un análisis MSA, primero necesitas subir un archivo Excel.',
        }
        yield { type: 'done' }
      })

      const req = createRequest({
        conversationId: VALID_CONVERSATION_ID,
        content: 'Realiza un análisis MSA',
      })

      const response = await POST(req)
      await response.text()

      // Tool should NOT have been invoked
      expect(mockInvokeAnalysisTool).not.toHaveBeenCalled()
    })
  })
})
