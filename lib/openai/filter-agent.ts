import { getOpenAIClient } from './client'
import { FILTER_SYSTEM_PROMPT } from './prompts'
import { classifyOpenAIError } from '@/lib/utils/error-utils'

export interface FilterResult {
  allowed: boolean
}

/**
 * Error thrown when OpenAI filter fails
 * Contains classification info for proper error handling
 */
export class FilterError extends Error {
  code: string
  isRetryable: boolean

  constructor(message: string, code: string, isRetryable: boolean) {
    super(message)
    this.name = 'FilterError'
    this.code = code
    this.isRetryable = isRetryable
  }
}

/**
 * Conversation context for filter decisions
 * Used to determine if short responses are valid follow-ups
 */
export interface FilterContext {
  lastAssistantMessage?: string
  /** Flag indicating analysis results were just presented */
  analysisJustPerformed?: boolean
  /** Type of analysis performed (e.g., 'msa') */
  analysisType?: string
}

/**
 * Filter a user message using the Filter Agent (gpt-4o-mini)
 * Uses structured output to guarantee JSON response format
 *
 * @param content - The user's message content to filter
 * @param context - Optional conversation context (last assistant message)
 * @returns Promise<FilterResult> - { allowed: boolean }
 * @throws FilterError if OpenAI API call fails with classified error
 */
export async function filterMessage(content: string, context?: FilterContext): Promise<FilterResult> {
  const openai = getOpenAIClient()

  // Build system prompt with analysis context if applicable
  let systemPrompt = FILTER_SYSTEM_PROMPT
  if (context?.analysisJustPerformed) {
    systemPrompt += `

MODO POST-ANÁLISIS ACTIVADO:
El usuario acaba de recibir resultados de un análisis ${context.analysisType?.toUpperCase() || 'estadístico'}.

En este modo, sé MUY PERMISIVO. PERMITE (allowed: true) CUALQUIER mensaje que:
- Pregunte sobre los resultados, métricas, o gráficos
- Pida explicaciones o clarificaciones ("¿qué significa?", "no entiendo", "¿por qué?")
- Pregunte sobre acciones a tomar ("¿qué hago?", "¿cómo mejoro?", "¿cuál es el siguiente paso?")
- Mencione operadores, piezas, mediciones, o cualquier elemento del análisis
- Sea una respuesta corta o ambigua que podría relacionarse con los resultados
- Exprese confusión, sorpresa, o emoción sobre los resultados ("wow", "está mal", "no puede ser")

SOLO RECHAZA (allowed: false) mensajes CLARAMENTE fuera de tema como:
- Recetas de cocina, entretenimiento, deportes
- Temas completamente no relacionados con trabajo/calidad/estadística

En caso de DUDA, PERMITE el mensaje (allowed: true).`
  }

  // Build messages array with optional context
  const messages: { role: 'system' | 'assistant' | 'user'; content: string }[] = [
    { role: 'system', content: systemPrompt },
  ]

  // Include last assistant message as context if provided
  // This helps the filter understand that short responses might be answers to questions
  if (context?.lastAssistantMessage) {
    messages.push({ role: 'assistant', content: context.lastAssistantMessage })
  }

  messages.push({ role: 'user', content })

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'filter_response',
          schema: {
            type: 'object',
            properties: {
              allowed: { type: 'boolean' },
            },
            required: ['allowed'],
            additionalProperties: false,
          },
        },
      },
    })

    const messageContent = response.choices[0]?.message?.content
    if (!messageContent) {
      throw new Error('No response content from OpenAI')
    }

    const result = JSON.parse(messageContent) as FilterResult
    return result
  } catch (error) {
    // Classify OpenAI error and throw with proper info
    const classification = classifyOpenAIError(error)
    throw new FilterError(
      classification.message,
      classification.code,
      classification.isRetryable
    )
  }
}
