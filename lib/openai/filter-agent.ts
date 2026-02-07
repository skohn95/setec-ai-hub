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
 * Filter a user message using the Filter Agent (gpt-4o-mini)
 * Uses structured output to guarantee JSON response format
 *
 * @param content - The user's message content to filter
 * @returns Promise<FilterResult> - { allowed: boolean }
 * @throws FilterError if OpenAI API call fails with classified error
 */
export async function filterMessage(content: string): Promise<FilterResult> {
  const openai = getOpenAIClient()

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: FILTER_SYSTEM_PROMPT },
        { role: 'user', content },
      ],
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
