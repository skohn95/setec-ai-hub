/**
 * Story 5.4: Follow-up Question Integration Tests
 *
 * Tests follow-up question handling scenarios to ensure:
 * - Agent uses conversation context (no tool calls for follow-ups)
 * - Agent references specific values from previous analysis
 * - Agent handles multiple analyses correctly
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  streamMainAgentWithTools,
  getConversationContext,
  getLastAnalysisResults,
  type MainAgentEvent,
} from './main-agent'
import { MAIN_SYSTEM_PROMPT } from './prompts'
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

describe('Follow-up Questions Integration Tests (Story 5.4)', () => {
  // Helper to create mock streaming response
  function createMockStreamResponse(content: string, hasToolCall = false) {
    if (hasToolCall) {
      return {
        [Symbol.asyncIterator]: async function* () {
          yield {
            choices: [{
              delta: {
                tool_calls: [{
                  index: 0,
                  id: 'call_123',
                  function: {
                    name: 'analyze',
                    arguments: '{"analysis_type":"msa","file_id":"file-456"}',
                  },
                }],
              },
              finish_reason: 'tool_calls',
            }],
          }
        },
      }
    }

    return {
      [Symbol.asyncIterator]: async function* () {
        yield { choices: [{ delta: { content } }] }
        yield { choices: [{ delta: {}, finish_reason: 'stop' }] }
      },
    }
  }

  // Sample conversation history with analysis results
  const historyWithAnalysis: MessageRow[] = [
    {
      id: '1',
      conversation_id: 'conv-1',
      role: 'user',
      content: 'Analiza mi archivo datos_msa.xlsx',
      metadata: {},
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      conversation_id: 'conv-1',
      role: 'assistant',
      content: `## Resultados del Análisis Gauge R&R

El análisis de tu archivo **datos_msa.xlsx** muestra los siguientes resultados:

- **%GRR: 18.5%** - Clasificación: MARGINAL
- **Repetibilidad:** 12.3%
- **Reproducibilidad:** 6.2%
- **ndc (número de categorías distintas):** 5.2

### Interpretación
Con un GRR de 18.5%, aproximadamente 1 de cada 5 unidades de variación proviene del sistema de medición.`,
      metadata: {
        analysisResults: {
          grr_percentage: 18.5,
          repeatability: 12.3,
          reproducibility: 6.2,
          ndc: 5.2,
          classification: 'MARGINAL',
        },
        chartData: {
          type: 'gauge_rr',
          filename: 'datos_msa.xlsx',
        },
      },
      created_at: '2024-01-01T00:00:01Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('AC#1: Follow-up without tool invocation', () => {
    it('answers "¿Qué puedo hacer para mejorar?" without tool call', async () => {
      const mockCreate = vi.fn().mockReturnValue(
        createMockStreamResponse(
          'Dado que tu repetibilidad (12.3%) es mayor que tu reproducibilidad (6.2%), te recomiendo enfocarte en el equipo de medición: calibración, mantenimiento preventivo y verificar el estado del instrumento.'
        )
      )

      vi.mocked(getOpenAIClient).mockReturnValue({
        chat: { completions: { create: mockCreate } },
      } as unknown as ReturnType<typeof getOpenAIClient>)

      const generator = streamMainAgentWithTools({
        conversationHistory: historyWithAnalysis,
        userMessage: '¿Qué puedo hacer para mejorar?',
        fileContext: '',
      })

      const events: MainAgentEvent[] = []
      for await (const event of generator) {
        events.push(event)
      }

      // Verify no tool calls
      const toolCalls = events.filter((e) => e.type === 'tool_call')
      expect(toolCalls).toHaveLength(0)

      // Verify we got text response
      const textEvents = events.filter((e) => e.type === 'text')
      expect(textEvents.length).toBeGreaterThan(0)
    })

    it('uses conversation context for follow-up response', async () => {
      const mockCreate = vi.fn().mockReturnValue(
        createMockStreamResponse('Respuesta contextual basada en tu análisis.')
      )

      vi.mocked(getOpenAIClient).mockReturnValue({
        chat: { completions: { create: mockCreate } },
      } as unknown as ReturnType<typeof getOpenAIClient>)

      const generator = streamMainAgentWithTools({
        conversationHistory: historyWithAnalysis,
        userMessage: '¿Por qué salió marginal?',
        fileContext: '',
      })

      // Consume generator - explicit void to indicate intentional discard
      for await (const event of generator) {
        void event
      }

      // Verify OpenAI was called with conversation context
      const callArgs = mockCreate.mock.calls[0][0]
      expect(callArgs.messages.length).toBeGreaterThan(2) // system + history + user
    })
  })

  describe('AC#2: Metric clarification questions', () => {
    it('handles "¿Qué significa el ndc?" with educational explanation', async () => {
      const mockCreate = vi.fn().mockReturnValue(
        createMockStreamResponse(
          'El ndc (número de categorías distintas) de 5.2 en tu análisis indica que tu sistema de medición puede distinguir aproximadamente 5 niveles diferentes de variación del producto. Un ndc ≥5 es generalmente aceptable según AIAG.'
        )
      )

      vi.mocked(getOpenAIClient).mockReturnValue({
        chat: { completions: { create: mockCreate } },
      } as unknown as ReturnType<typeof getOpenAIClient>)

      const generator = streamMainAgentWithTools({
        conversationHistory: historyWithAnalysis,
        userMessage: '¿Qué significa el ndc?',
        fileContext: '',
      })

      const events: MainAgentEvent[] = []
      for await (const event of generator) {
        events.push(event)
      }

      // Verify no tool calls - this is a clarification, not a new analysis
      expect(events.filter((e) => e.type === 'tool_call')).toHaveLength(0)
      expect(events.filter((e) => e.type === 'text').length).toBeGreaterThan(0)
    })

    it('passes analysis metadata in context for specific value reference', async () => {
      const mockCreate = vi.fn().mockReturnValue(
        createMockStreamResponse('Tu ndc de 5.2 indica...')
      )

      vi.mocked(getOpenAIClient).mockReturnValue({
        chat: { completions: { create: mockCreate } },
      } as unknown as ReturnType<typeof getOpenAIClient>)

      const generator = streamMainAgentWithTools({
        conversationHistory: historyWithAnalysis,
        userMessage: '¿Qué es la repetibilidad?',
        fileContext: '',
      })

      for await (const event of generator) {
        void event
      }

      // Verify context includes analysis results
      const callArgs = mockCreate.mock.calls[0][0]
      const messagesJson = JSON.stringify(callArgs.messages)
      expect(messagesJson).toContain('18.5') // GRR percentage from metadata
    })
  })

  describe('AC#3: Methodology questions', () => {
    it('handles "¿Por qué Gauge R&R?" without tool call', async () => {
      const mockCreate = vi.fn().mockReturnValue(
        createMockStreamResponse(
          'Gauge R&R es el estándar AIAG para evaluar sistemas de medición en manufactura. Permite separar la variación del proceso de la variación del sistema de medición, identificando si los problemas vienen del equipo (repetibilidad) o de los operadores (reproducibilidad).'
        )
      )

      vi.mocked(getOpenAIClient).mockReturnValue({
        chat: { completions: { create: mockCreate } },
      } as unknown as ReturnType<typeof getOpenAIClient>)

      const generator = streamMainAgentWithTools({
        conversationHistory: historyWithAnalysis,
        userMessage: '¿Por qué usaste Gauge R&R?',
        fileContext: '',
      })

      const events: MainAgentEvent[] = []
      for await (const event of generator) {
        events.push(event)
      }

      expect(events.filter((e) => e.type === 'tool_call')).toHaveLength(0)
    })
  })

  describe('AC#4: Next steps questions', () => {
    it('handles "¿Qué hago ahora?" with practical guidance', async () => {
      const mockCreate = vi.fn().mockReturnValue(
        createMockStreamResponse(
          'Con tu GRR de 18.5% (MARGINAL) y repetibilidad dominante (12.3% vs 6.2%), te recomiendo: 1) Calibrar el instrumento, 2) Verificar el estado del equipo, 3) Establecer un programa de mantenimiento preventivo.'
        )
      )

      vi.mocked(getOpenAIClient).mockReturnValue({
        chat: { completions: { create: mockCreate } },
      } as unknown as ReturnType<typeof getOpenAIClient>)

      const generator = streamMainAgentWithTools({
        conversationHistory: historyWithAnalysis,
        userMessage: '¿Qué hago ahora?',
        fileContext: '',
      })

      const events: MainAgentEvent[] = []
      for await (const event of generator) {
        events.push(event)
      }

      // Should NOT trigger new analysis
      expect(events.filter((e) => e.type === 'tool_call')).toHaveLength(0)
      expect(events.filter((e) => e.type === 'text').length).toBeGreaterThan(0)
    })
  })

  describe('AC#5: Multiple analyses handling', () => {
    it('correctly references most recent analysis when multiple exist', () => {
      const multipleAnalyses: MessageRow[] = [
        {
          id: '1',
          conversation_id: 'conv-1',
          role: 'assistant',
          content: 'First analysis results',
          metadata: {
            analysisResults: { grr_percentage: 25.0, ndc: 3.5 },
          },
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          conversation_id: 'conv-1',
          role: 'user',
          content: 'Analiza otro archivo',
          metadata: {},
          created_at: '2024-01-01T00:00:01Z',
        },
        {
          id: '3',
          conversation_id: 'conv-1',
          role: 'assistant',
          content: 'Second analysis results',
          metadata: {
            analysisResults: { grr_percentage: 12.0, ndc: 6.8 },
          },
          created_at: '2024-01-01T00:00:02Z',
        },
      ]

      // Use helper to get last analysis
      const lastAnalysis = getLastAnalysisResults(multipleAnalyses)
      expect(lastAnalysis).toEqual({ grr_percentage: 12.0, ndc: 6.8 })
    })

    it('includes multiple analysis context in conversation for clarification', async () => {
      const multipleAnalyses: MessageRow[] = [
        {
          id: '1',
          conversation_id: 'conv-1',
          role: 'assistant',
          content: 'Análisis de archivo1.xlsx: GRR 25%',
          metadata: {
            analysisResults: { grr_percentage: 25.0, filename: 'archivo1.xlsx' },
          },
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          conversation_id: 'conv-1',
          role: 'assistant',
          content: 'Análisis de archivo2.xlsx: GRR 12%',
          metadata: {
            analysisResults: { grr_percentage: 12.0, filename: 'archivo2.xlsx' },
          },
          created_at: '2024-01-01T00:00:01Z',
        },
      ]

      const context = getConversationContext(multipleAnalyses)

      // Both analyses should be in context
      expect(context.length).toBe(2)
      expect(context[0].content).toContain('25')
      expect(context[1].content).toContain('12')
    })
  })

  describe('System prompt verification', () => {
    it('prompt contains follow-up handling instructions', () => {
      const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()

      // Key follow-up instructions from Story 5.4
      expect(prompt).toContain('preguntas de seguimiento')
      expect(prompt).toContain('no re-invoques')
      expect(prompt).toContain('contexto')
      expect(prompt).toContain('valores específicos')
    })

    it('prompt instructs educational explanations', () => {
      const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
      expect(prompt).toContain('educativo')
      expect(prompt).toContain('pedagógic')
    })
  })
})
