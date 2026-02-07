/**
 * Main Agent service for generating streaming responses
 * Uses gpt-4o model for quality conversational responses
 *
 * Story 4.4: Added tool calling support for MSA analysis
 * Story 5.4: Enhanced for follow-up question handling
 *
 * Follow-up Question Handling (Story 5.4):
 * - getConversationContext includes analysis metadata for follow-up context
 * - getLastAnalysisResults extracts most recent analysis for reference
 * - hasRecentAnalysisInContext checks if analysis is within context window
 *
 * Edge Cases:
 * - No previous analysis: Agent explains concepts generally, suggests uploading file
 * - Context overflow (>MAX_CONTEXT_MESSAGES): Old messages truncated, agent may ask to re-upload
 * - Multiple analyses: Agent references most recent by default, clarifies if ambiguous
 */

import type OpenAI from 'openai'
import { getOpenAIClient } from './client'
import { MAIN_SYSTEM_PROMPT } from './prompts'
import { AVAILABLE_TOOLS } from './tools'
import type { MessageRow } from '@/lib/supabase/messages'

/**
 * Maximum number of conversation messages to include in context
 * This limits token usage while maintaining relevant context
 */
export const MAX_CONTEXT_MESSAGES = 10

/**
 * Event types yielded by streamMainAgentWithTools
 */
export type MainAgentEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_call'; name: string; callId: string; arguments: Record<string, unknown> }
  | { type: 'done' }

/**
 * Options for streamMainAgentWithTools
 */
export interface StreamWithToolsOptions {
  conversationHistory: MessageRow[]
  userMessage: string
  fileContext: string
}

/**
 * Convert database messages to OpenAI chat completion format
 * Takes the last N messages to fit within context limits
 * Story 5.4: Includes analysis results metadata for follow-up context
 */
export function getConversationContext(
  messages: MessageRow[]
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  // Get last N messages for context
  const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES)

  // Convert to OpenAI format, including analysis results when available
  return recentMessages.map((msg) => {
    let content = msg.content

    // If message has analysis results in metadata, append summary for follow-up context
    // Note: Check both 'analysisResults' and 'results' keys for compatibility
    // metadata is typed as Json which needs casting for property access
    const metadata = msg.metadata as Record<string, unknown> | null
    const analysisResults = (metadata?.analysisResults ||
      metadata?.results) as Record<string, unknown> | undefined
    if (analysisResults) {
      content += `\n[Resultados del análisis: ${JSON.stringify(analysisResults)}]`
    }

    return {
      role: msg.role as 'user' | 'assistant',
      content,
    }
  })
}

/**
 * Extract the most recent analysis results from conversation history
 * Story 5.4: Helper for follow-up question handling
 *
 * Note: Checks both 'analysisResults' and 'results' metadata keys for compatibility
 * with different message sources.
 *
 * @param messages - Conversation messages to search
 * @returns The most recent analysis results metadata (containing grr_percentage, ndc, etc.),
 *          or undefined if no analysis exists in the conversation
 *
 * @example
 * const lastAnalysis = getLastAnalysisResults(messages)
 * if (lastAnalysis) {
 *   console.log(`Last GRR: ${lastAnalysis.grr_percentage}%`)
 * }
 */
export function getLastAnalysisResults(
  messages: MessageRow[]
): Record<string, unknown> | undefined {
  // Search from the end to find the most recent analysis
  // Note: Check both 'analysisResults' and 'results' keys for compatibility
  for (let i = messages.length - 1; i >= 0; i--) {
    // metadata is typed as Json which needs casting for property access
    const metadata = messages[i].metadata as Record<string, unknown> | null
    const analysisResults = (metadata?.analysisResults ||
      metadata?.results) as Record<string, unknown> | undefined
    if (analysisResults) {
      return analysisResults
    }
  }
  return undefined
}

/**
 * Check if there is a recent analysis within the context window
 * Story 5.4: Helps detect when analysis results may be truncated
 *
 * This utility is useful for:
 * - API routes to detect if context may be stale
 * - UI components to prompt for file re-upload when needed
 * - Testing edge cases around context truncation
 *
 * Edge Case Handling:
 * - Returns true if analysis exists within MAX_CONTEXT_MESSAGES
 * - Returns false if no analysis or if analysis is beyond context window
 * - When false and user asks follow-up, agent should ask for file re-upload
 *
 * @param messages - Full conversation messages (all messages, not just recent)
 * @returns {boolean} true if analysis exists within context window, false otherwise
 *
 * @example
 * if (!hasRecentAnalysisInContext(messages)) {
 *   // Suggest user re-upload their file for follow-up questions
 * }
 */
export function hasRecentAnalysisInContext(messages: MessageRow[]): boolean {
  // Only check messages that will be included in context
  const contextMessages = messages.slice(-MAX_CONTEXT_MESSAGES)

  // Check if any of these messages have analysis results
  // metadata is typed as Json which needs casting for property access
  return contextMessages.some((msg) => {
    const metadata = msg.metadata as Record<string, unknown> | null
    return metadata?.analysisResults !== undefined || metadata?.results !== undefined
  })
}

/**
 * Stream response from the Main Agent (gpt-4o)
 * Yields text chunks as they arrive from OpenAI
 *
 * @param conversationHistory - Previous messages in the conversation
 * @param userMessage - The new user message to respond to
 * @yields Text chunks as they are received from OpenAI
 *
 * @deprecated Use streamMainAgentWithTools for new code
 */
export async function* streamMainAgentResponse(
  conversationHistory: MessageRow[],
  userMessage: string
): AsyncGenerator<string, void, unknown> {
  const openai = getOpenAIClient()

  // Build messages array: system prompt + conversation history + new user message
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: MAIN_SYSTEM_PROMPT },
    ...getConversationContext(conversationHistory),
    { role: 'user', content: userMessage },
  ]

  // Create streaming completion
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    stream: true,
  })

  // Yield chunks as they arrive
  for await (const chunk of response) {
    const content = chunk.choices[0]?.delta?.content
    if (content) {
      yield content
    }
  }
}

/**
 * Stream response from the Main Agent with tool calling support
 * Yields structured events for text, tool calls, and completion
 *
 * @param options - Configuration including history, message, and file context
 * @yields MainAgentEvent for text chunks and tool calls
 */
export async function* streamMainAgentWithTools(
  options: StreamWithToolsOptions
): AsyncGenerator<MainAgentEvent, void, unknown> {
  const { conversationHistory, userMessage, fileContext } = options
  const openai = getOpenAIClient()

  // Build system prompt with file context
  const systemPrompt = MAIN_SYSTEM_PROMPT + fileContext

  // Build messages array: system prompt + conversation history + new user message
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...getConversationContext(conversationHistory),
    { role: 'user', content: userMessage },
  ]

  // Create streaming completion with tools
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    stream: true,
    tools: AVAILABLE_TOOLS,
  })

  // Track tool call accumulation (streamed in chunks)
  const toolCalls: Map<
    number,
    { id: string; name: string; arguments: string }
  > = new Map()

  // Process stream chunks
  for await (const chunk of response) {
    const choice = chunk.choices[0]
    if (!choice) continue

    // Handle regular text content
    const content = choice.delta?.content
    if (content) {
      yield { type: 'text', content }
    }

    // Handle tool calls (streamed incrementally)
    const deltaToolCalls = choice.delta?.tool_calls
    if (deltaToolCalls) {
      for (const toolCall of deltaToolCalls) {
        const index = toolCall.index

        // Initialize or update tool call accumulator
        if (!toolCalls.has(index)) {
          toolCalls.set(index, {
            id: toolCall.id || '',
            name: toolCall.function?.name || '',
            arguments: '',
          })
        }

        const accumulated = toolCalls.get(index)!

        // Update ID if provided (usually in first chunk)
        if (toolCall.id) {
          accumulated.id = toolCall.id
        }

        // Update name if provided (usually in first chunk)
        if (toolCall.function?.name) {
          accumulated.name = toolCall.function.name
        }

        // Accumulate arguments (streamed in chunks)
        if (toolCall.function?.arguments) {
          accumulated.arguments += toolCall.function.arguments
        }
      }
    }

    // Check for finish reason
    if (choice.finish_reason === 'tool_calls') {
      // Yield accumulated tool calls
      for (const [, toolCall] of toolCalls) {
        try {
          const args = JSON.parse(toolCall.arguments)
          yield {
            type: 'tool_call',
            name: toolCall.name,
            callId: toolCall.id,
            arguments: args,
          }
        } catch (e) {
          console.error('Failed to parse tool call arguments:', e)
        }
      }
    }
  }

  yield { type: 'done' }
}
