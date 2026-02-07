import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  streamMainAgentResponse,
  streamMainAgentWithTools,
  getConversationContext,
  getLastAnalysisResults,
  hasRecentAnalysisInContext,
  MAX_CONTEXT_MESSAGES,
  type MainAgentEvent,
} from './main-agent'
import { MAIN_SYSTEM_PROMPT } from './prompts'
import { AVAILABLE_TOOLS } from './tools'
import type { MessageRow } from '@/lib/supabase/messages'

// Mock the OpenAI client
vi.mock('./client', () => ({
  getOpenAIClient: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}))

import { getOpenAIClient } from './client'

describe('main-agent', () => {
  const mockMessages: MessageRow[] = [
    {
      id: '1',
      conversation_id: 'conv-1',
      role: 'user',
      content: '¿Qué es MSA?',
      metadata: {},
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      conversation_id: 'conv-1',
      role: 'assistant',
      content: 'MSA significa Análisis del Sistema de Medición.',
      metadata: {},
      created_at: '2024-01-01T00:00:01Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('getConversationContext', () => {
    it('converts messages to OpenAI format', () => {
      const context = getConversationContext(mockMessages)
      expect(context).toHaveLength(2)
      expect(context[0]).toEqual({ role: 'user', content: '¿Qué es MSA?' })
      expect(context[1]).toEqual({ role: 'assistant', content: 'MSA significa Análisis del Sistema de Medición.' })
    })

    it('limits messages to MAX_CONTEXT_MESSAGES', () => {
      // Create more messages than the limit
      const manyMessages: MessageRow[] = Array.from({ length: MAX_CONTEXT_MESSAGES + 5 }, (_, i) => ({
        id: String(i),
        conversation_id: 'conv-1',
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        metadata: {},
        created_at: new Date(i).toISOString(),
      })) as MessageRow[]

      const context = getConversationContext(manyMessages)
      expect(context).toHaveLength(MAX_CONTEXT_MESSAGES)
      // Should have the LAST messages, not the first
      expect(context[0].content).toBe(`Message ${manyMessages.length - MAX_CONTEXT_MESSAGES}`)
    })

    it('returns empty array for empty messages', () => {
      const context = getConversationContext([])
      expect(context).toEqual([])
    })
  })

  describe('streamMainAgentResponse', () => {
    it('calls OpenAI with gpt-4o model', async () => {
      const mockCreate = vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: 'Test' } }] }
        },
      })

      vi.mocked(getOpenAIClient).mockReturnValue({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as unknown as ReturnType<typeof getOpenAIClient>)

      const generator = streamMainAgentResponse(mockMessages, '¿Qué es Gauge R&R?')
      // Consume the generator
      const chunks: string[] = []
      for await (const chunk of generator) {
        chunks.push(chunk)
      }

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o',
          stream: true,
        })
      )
    })

    it('includes MAIN_SYSTEM_PROMPT in messages', async () => {
      const mockCreate = vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: 'Test' } }] }
        },
      })

      vi.mocked(getOpenAIClient).mockReturnValue({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as unknown as ReturnType<typeof getOpenAIClient>)

      const generator = streamMainAgentResponse([], '¿Qué es MSA?')
      // Consume the generator
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _chunk of generator) {
        // consume
      }

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            { role: 'system', content: MAIN_SYSTEM_PROMPT },
          ]),
        })
      )
    })

    it('includes conversation history in messages', async () => {
      const mockCreate = vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: 'Test' } }] }
        },
      })

      vi.mocked(getOpenAIClient).mockReturnValue({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as unknown as ReturnType<typeof getOpenAIClient>)

      const generator = streamMainAgentResponse(mockMessages, '¿Puedes explicar más?')
      // Consume the generator
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _chunk of generator) {
        // consume
      }

      const callArgs = mockCreate.mock.calls[0][0]
      // System prompt + 2 history messages + user message = 4
      expect(callArgs.messages).toHaveLength(4)
    })

    it('yields text chunks as they arrive', async () => {
      const mockCreate = vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: 'Hola, ' } }] }
          yield { choices: [{ delta: { content: 'soy tu ' } }] }
          yield { choices: [{ delta: { content: 'asistente.' } }] }
        },
      })

      vi.mocked(getOpenAIClient).mockReturnValue({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as unknown as ReturnType<typeof getOpenAIClient>)

      const generator = streamMainAgentResponse([], 'Hola')
      const chunks: string[] = []
      for await (const chunk of generator) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Hola, ', 'soy tu ', 'asistente.'])
    })

    it('handles empty chunks gracefully', async () => {
      const mockCreate = vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: 'Hello' } }] }
          yield { choices: [{ delta: {} }] } // No content
          yield { choices: [{ delta: { content: '' } }] } // Empty content
          yield { choices: [{ delta: { content: ' World' } }] }
        },
      })

      vi.mocked(getOpenAIClient).mockReturnValue({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as unknown as ReturnType<typeof getOpenAIClient>)

      const generator = streamMainAgentResponse([], 'Test')
      const chunks: string[] = []
      for await (const chunk of generator) {
        chunks.push(chunk)
      }

      expect(chunks).toEqual(['Hello', ' World'])
    })
  })

  // Story 4.4: Tool-enabled streaming tests
  describe('streamMainAgentWithTools', () => {
    it('includes tools in the OpenAI call', async () => {
      const mockCreate = vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: 'Hello' } }] }
        },
      })

      vi.mocked(getOpenAIClient).mockReturnValue({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as unknown as ReturnType<typeof getOpenAIClient>)

      const generator = streamMainAgentWithTools({
        conversationHistory: [],
        userMessage: 'Analiza este archivo',
        fileContext: '',
      })

      // Consume generator
      const events: MainAgentEvent[] = []
      for await (const event of generator) {
        events.push(event)
      }

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o',
          stream: true,
          tools: AVAILABLE_TOOLS,
        })
      )
    })

    it('appends file context to system prompt', async () => {
      const mockCreate = vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: 'Test' } }] }
        },
      })

      vi.mocked(getOpenAIClient).mockReturnValue({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as unknown as ReturnType<typeof getOpenAIClient>)

      const fileContext = '\n\nARCHIVOS DISPONIBLES:\n- ID: file-123, Nombre: test.xlsx'

      const generator = streamMainAgentWithTools({
        conversationHistory: [],
        userMessage: 'Test',
        fileContext,
      })

      // Consume generator - explicit void to indicate intentional discard
      for await (const event of generator) {
        void event
      }

      const callArgs = mockCreate.mock.calls[0][0]
      const systemMessage = callArgs.messages.find((m: { role: string }) => m.role === 'system')
      expect(systemMessage.content).toContain('ARCHIVOS DISPONIBLES')
      expect(systemMessage.content).toContain('file-123')
    })

    it('yields text events for regular content', async () => {
      const mockCreate = vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: 'Hola ' } }] }
          yield { choices: [{ delta: { content: 'mundo' } }] }
        },
      })

      vi.mocked(getOpenAIClient).mockReturnValue({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as unknown as ReturnType<typeof getOpenAIClient>)

      const generator = streamMainAgentWithTools({
        conversationHistory: [],
        userMessage: 'Test',
        fileContext: '',
      })

      const events: MainAgentEvent[] = []
      for await (const event of generator) {
        events.push(event)
      }

      expect(events).toContainEqual({ type: 'text', content: 'Hola ' })
      expect(events).toContainEqual({ type: 'text', content: 'mundo' })
    })

    it('yields tool_call event when tool is invoked', async () => {
      const mockCreate = vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield {
            choices: [{
              delta: {
                tool_calls: [{
                  index: 0,
                  id: 'call_123',
                  function: {
                    name: 'analyze',
                    arguments: '',
                  },
                }],
              },
            }],
          }
          yield {
            choices: [{
              delta: {
                tool_calls: [{
                  index: 0,
                  function: {
                    arguments: '{"analysis_type":"msa","file_id":"file-456"}',
                  },
                }],
              },
              finish_reason: 'tool_calls',
            }],
          }
        },
      })

      vi.mocked(getOpenAIClient).mockReturnValue({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as unknown as ReturnType<typeof getOpenAIClient>)

      const generator = streamMainAgentWithTools({
        conversationHistory: [],
        userMessage: 'Analiza el archivo',
        fileContext: '\n\nARCHIVOS DISPONIBLES:\n- ID: file-456, Nombre: datos.xlsx',
      })

      const events: MainAgentEvent[] = []
      for await (const event of generator) {
        events.push(event)
      }

      const toolCallEvent = events.find((e) => e.type === 'tool_call')
      expect(toolCallEvent).toBeDefined()
      expect(toolCallEvent).toMatchObject({
        type: 'tool_call',
        name: 'analyze',
        arguments: {
          analysis_type: 'msa',
          file_id: 'file-456',
        },
      })
    })
  })

  // Story 5.4: Follow-up context handling
  describe('getConversationContext - analysis metadata handling', () => {
    it('includes analysis results summary in context when metadata contains analysisResults', () => {
      const messagesWithAnalysis: MessageRow[] = [
        {
          id: '1',
          conversation_id: 'conv-1',
          role: 'user',
          content: 'Analiza mi archivo',
          metadata: {},
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          conversation_id: 'conv-1',
          role: 'assistant',
          content: 'El análisis muestra un %GRR de 18.5%.',
          metadata: {
            analysisResults: {
              grr_percentage: 18.5,
              ndc: 5.2,
              repeatability: 12.3,
              reproducibility: 6.2,
            },
          },
          created_at: '2024-01-01T00:00:01Z',
        },
      ]

      const context = getConversationContext(messagesWithAnalysis)
      expect(context).toHaveLength(2)
      // The assistant message should include analysis results reference
      const assistantMessage = context[1]
      expect(assistantMessage.content).toContain('grr_percentage')
      expect(assistantMessage.content).toContain('18.5')
    })

    it('preserves original content when no metadata exists', () => {
      const context = getConversationContext(mockMessages)
      expect(context[1].content).toBe('MSA significa Análisis del Sistema de Medición.')
    })
  })

  // Story 5.4: Helper for extracting last analysis results
  describe('getLastAnalysisResults', () => {
    it('returns undefined when no analysis results exist', () => {
      const result = getLastAnalysisResults(mockMessages)
      expect(result).toBeUndefined()
    })

    it('returns the most recent analysis results', () => {
      const messagesWithAnalysis: MessageRow[] = [
        {
          id: '1',
          conversation_id: 'conv-1',
          role: 'assistant',
          content: 'First analysis',
          metadata: {
            analysisResults: { grr_percentage: 15.0 },
          },
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          conversation_id: 'conv-1',
          role: 'assistant',
          content: 'Second analysis',
          metadata: {
            analysisResults: { grr_percentage: 22.5 },
          },
          created_at: '2024-01-01T00:00:01Z',
        },
      ]

      const result = getLastAnalysisResults(messagesWithAnalysis)
      expect(result).toEqual({ grr_percentage: 22.5 })
    })

    it('skips messages without analysisResults metadata', () => {
      const messagesWithMixed: MessageRow[] = [
        {
          id: '1',
          conversation_id: 'conv-1',
          role: 'assistant',
          content: 'Analysis result',
          metadata: {
            analysisResults: { grr_percentage: 18.5 },
          },
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          conversation_id: 'conv-1',
          role: 'assistant',
          content: 'No analysis here',
          metadata: {},
          created_at: '2024-01-01T00:00:01Z',
        },
      ]

      const result = getLastAnalysisResults(messagesWithMixed)
      expect(result).toEqual({ grr_percentage: 18.5 })
    })
  })

  // Story 5.4: Edge cases for follow-up questions
  describe('hasRecentAnalysisInContext', () => {
    it('returns false when no messages', () => {
      const result = hasRecentAnalysisInContext([])
      expect(result).toBe(false)
    })

    it('returns false when no analysis results in messages', () => {
      const result = hasRecentAnalysisInContext(mockMessages)
      expect(result).toBe(false)
    })

    it('returns true when analysis results exist within context window', () => {
      const messagesWithAnalysis: MessageRow[] = [
        ...mockMessages,
        {
          id: '3',
          conversation_id: 'conv-1',
          role: 'assistant',
          content: 'Analysis results',
          metadata: { analysisResults: { grr_percentage: 18.5 } },
          created_at: '2024-01-01T00:00:02Z',
        },
      ]
      const result = hasRecentAnalysisInContext(messagesWithAnalysis)
      expect(result).toBe(true)
    })

    it('returns true when results metadata exists (alternative key)', () => {
      const messagesWithResults: MessageRow[] = [
        {
          id: '1',
          conversation_id: 'conv-1',
          role: 'assistant',
          content: 'Analysis',
          metadata: { results: { grr_percent: 15.0 } },
          created_at: '2024-01-01T00:00:00Z',
        },
      ]
      const result = hasRecentAnalysisInContext(messagesWithResults)
      expect(result).toBe(true)
    })

    it('returns false when analysis is beyond context window', () => {
      // Create many messages to push analysis out of context window
      const oldAnalysis: MessageRow = {
        id: '0',
        conversation_id: 'conv-1',
        role: 'assistant',
        content: 'Old analysis',
        metadata: { analysisResults: { grr_percentage: 20.0 } },
        created_at: '2024-01-01T00:00:00Z',
      }

      // Add more than MAX_CONTEXT_MESSAGES regular messages after analysis
      const manyMessages: MessageRow[] = [oldAnalysis]
      for (let i = 1; i <= MAX_CONTEXT_MESSAGES + 1; i++) {
        manyMessages.push({
          id: String(i),
          conversation_id: 'conv-1',
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `Message ${i}`,
          metadata: {},
          created_at: new Date(i * 1000).toISOString(),
        })
      }

      const result = hasRecentAnalysisInContext(manyMessages)
      expect(result).toBe(false)
    })
  })

  // Story 5.4: Verify tool non-invocation for follow-ups (AC#1)
  describe('Tool non-invocation for follow-up questions', () => {
    it('yields only text events for follow-up question without new file', async () => {
      // Mock OpenAI to return text response (no tool calls)
      const mockCreate = vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield {
            choices: [{
              delta: {
                content: 'El número de categorías distintas (ndc) de 5.2 indica que tu sistema de medición puede distinguir aproximadamente 5 niveles diferentes de variación.',
              },
            }],
          }
          yield {
            choices: [{
              delta: {},
              finish_reason: 'stop', // NOT 'tool_calls'
            }],
          }
        },
      })

      vi.mocked(getOpenAIClient).mockReturnValue({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as unknown as ReturnType<typeof getOpenAIClient>)

      // Simulate conversation with previous analysis
      const historyWithAnalysis: MessageRow[] = [
        {
          id: '1',
          conversation_id: 'conv-1',
          role: 'user',
          content: 'Analiza mi archivo',
          metadata: {},
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          conversation_id: 'conv-1',
          role: 'assistant',
          content: 'El análisis muestra un %GRR de 18.5%.',
          metadata: {
            analysisResults: { grr_percentage: 18.5, ndc: 5.2 },
          },
          created_at: '2024-01-01T00:00:01Z',
        },
      ]

      const generator = streamMainAgentWithTools({
        conversationHistory: historyWithAnalysis,
        userMessage: '¿Qué significa el ndc?', // Follow-up question
        fileContext: '', // No new file
      })

      const events: MainAgentEvent[] = []
      for await (const event of generator) {
        events.push(event)
      }

      // Should have text events and done, NO tool_call events
      const toolCallEvents = events.filter((e) => e.type === 'tool_call')
      expect(toolCallEvents).toHaveLength(0)

      const textEvents = events.filter((e) => e.type === 'text')
      expect(textEvents.length).toBeGreaterThan(0)
    })

    it('yields tool_call event when new file is uploaded with analysis request', async () => {
      // Mock OpenAI to return tool call response
      const mockCreate = vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield {
            choices: [{
              delta: {
                tool_calls: [{
                  index: 0,
                  id: 'call_new_analysis',
                  function: {
                    name: 'analyze',
                    arguments: '',
                  },
                }],
              },
            }],
          }
          yield {
            choices: [{
              delta: {
                tool_calls: [{
                  index: 0,
                  function: {
                    arguments: '{"analysis_type":"msa","file_id":"file-new-789"}',
                  },
                }],
              },
              finish_reason: 'tool_calls',
            }],
          }
        },
      })

      vi.mocked(getOpenAIClient).mockReturnValue({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as unknown as ReturnType<typeof getOpenAIClient>)

      const generator = streamMainAgentWithTools({
        conversationHistory: [],
        userMessage: 'Analiza este nuevo archivo',
        fileContext: '\n\nARCHIVOS DISPONIBLES:\n- ID: file-new-789, Nombre: nuevo_datos.xlsx', // New file available
      })

      const events: MainAgentEvent[] = []
      for await (const event of generator) {
        events.push(event)
      }

      // Should have tool_call event
      const toolCallEvents = events.filter((e) => e.type === 'tool_call')
      expect(toolCallEvents).toHaveLength(1)
      expect(toolCallEvents[0]).toMatchObject({
        type: 'tool_call',
        name: 'analyze',
      })
    })

    it('conversation context includes analysis metadata for LLM reference', async () => {
      const mockCreate = vi.fn().mockReturnValue({
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: 'Respuesta' } }] }
        },
      })

      vi.mocked(getOpenAIClient).mockReturnValue({
        chat: {
          completions: {
            create: mockCreate,
          },
        },
      } as unknown as ReturnType<typeof getOpenAIClient>)

      const historyWithAnalysis: MessageRow[] = [
        {
          id: '1',
          conversation_id: 'conv-1',
          role: 'assistant',
          content: 'Resultado del análisis.',
          metadata: {
            analysisResults: { grr_percentage: 15.0, ndc: 4.8 },
          },
          created_at: '2024-01-01T00:00:00Z',
        },
      ]

      const generator = streamMainAgentWithTools({
        conversationHistory: historyWithAnalysis,
        userMessage: '¿Cómo interpreto esto?',
        fileContext: '',
      })

      // Consume generator - explicit void to indicate intentional discard
      for await (const event of generator) {
        void event
      }

      // Verify the messages sent to OpenAI include analysis metadata
      const callArgs = mockCreate.mock.calls[0][0]
      const assistantMessage = callArgs.messages.find(
        (m: { role: string; content: string }) =>
          m.role === 'assistant' && m.content.includes('grr_percentage')
      )
      expect(assistantMessage).toBeDefined()
      expect(assistantMessage.content).toContain('15')
    })
  })

  // Story 5.1: Integration tests for AI Results Interpretation
  describe('AI Results Interpretation Guidelines (Story 5.1)', () => {
    describe('AC#1: Agent follows tool instructions', () => {
      it('prompt instructs to follow instructions field from tool response', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('instructions')
        expect(prompt).toContain('sigue')
      })

      it('prompt instructs to adapt to conversation context', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('contexto')
        expect(prompt).toContain('conversación')
      })
    })

    describe('AC#2: Methodology explanation guidelines', () => {
      it('includes Gauge R&R purpose explanation', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('gauge r&r')
        expect(prompt).toContain('variación')
        expect(prompt).toContain('sistema de medición')
      })

      it('defines repeatability in plain terms', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('repetibilidad')
        expect(prompt).toContain('mismo operador')
        expect(prompt).toContain('misma pieza')
      })

      it('defines reproducibility in plain terms', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('reproducibilidad')
        expect(prompt).toContain('diferentes operadores')
      })
    })

    describe('AC#3: Interpretation guidelines with classification', () => {
      it('includes all classification levels in Spanish', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('aceptable')
        expect(prompt).toContain('marginal')
        expect(prompt).toContain('inaceptable')
      })

      it('includes classification thresholds', () => {
        expect(MAIN_SYSTEM_PROMPT).toContain('10%')
        expect(MAIN_SYSTEM_PROMPT).toContain('30%')
      })

      it('instructs to contextualize GRR percentage', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('%grr')
        expect(prompt).toContain('impacto')
      })
    })

    describe('AC#4: Recommendation guidelines', () => {
      it('instructs to provide recommendations', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('recomendaciones')
      })

      it('differentiates recommendations by dominant variation source', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        // For repeatability-dominant
        expect(prompt).toContain('repetibilidad')
        expect(prompt).toContain('calibración') // equipment focus
        // For reproducibility-dominant
        expect(prompt).toContain('reproducibilidad')
        expect(prompt).toContain('entrenamiento') // operator focus
      })

      it('instructs to provide actionable suggestions', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('acciones')
      })
    })

    describe('AC#5: Formatting guidelines', () => {
      it('instructs to use bold for key metrics', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('negritas')
      })

      it('instructs to use markdown formatting', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('formato')
      })

      it('instructs to include classification indicator', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('clasificación')
      })
    })
  })
})
