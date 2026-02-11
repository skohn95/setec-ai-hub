import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { filterMessage, FilterError, type FilterContext } from '@/lib/openai/filter-agent'
import { streamMainAgentWithTools, type MainAgentEvent } from '@/lib/openai/main-agent'
import { buildFileContext } from '@/lib/openai/file-context'
import { createMessage, fetchMessages, updateMessageMetadata, updateMessageContent } from '@/lib/supabase/messages'
import { updateConversationTimestamp } from '@/lib/supabase/conversations'
import { encodeSSEMessage, createSSEResponse } from '@/lib/openai/streaming'
import { REJECTION_MESSAGE } from '@/lib/openai/rejection-messages'
import { invokeAnalysisTool } from '@/lib/api/analyze'
import { API_ERRORS, STREAMING_MESSAGES } from '@/constants/messages'
import { classifyOpenAIError } from '@/lib/utils/error-utils'
import type { ApiResponse, SSEToolCallEvent, SSEToolResultEvent } from '@/types/api'
import type { MessageRow } from '@/lib/supabase/messages'
import type { Database } from '@/types/database'

// Use Node.js runtime for better compatibility with Python serverless functions
export const runtime = 'nodejs'

// UUID v4 regex pattern for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

// Maximum message length to prevent abuse
const MAX_MESSAGE_LENGTH = 10000

interface ChatRequestBody {
  conversationId: string
  content: string
  fileId?: string  // Optional file attachment
}

interface ChatResponseData {
  userMessage: MessageRow
  assistantMessage: MessageRow
  filtered: boolean
}

type ChatApiResponse = ApiResponse<ChatResponseData>

/**
 * POST /api/chat
 * Send a message to a conversation.
 * The message is first filtered by the Filter Agent.
 * If rejected, returns a contextual rejection message.
 * If allowed, returns a placeholder response (Main Agent in Story 2.5).
 */
export async function POST(req: NextRequest): Promise<NextResponse<ChatApiResponse> | Response> {
  console.log('\n[CHAT-DEBUG] ========== CHAT API REQUEST ==========')
  console.log('[CHAT-DEBUG] Timestamp:', new Date().toISOString())

  try {
    // 0. Verify user authentication
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll() {
            // Edge runtime doesn't support setting cookies in API routes
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Debes iniciar sesión para enviar mensajes.',
          },
        },
        { status: 401 }
      )
    }

    const body = (await req.json()) as Partial<ChatRequestBody>
    const { conversationId, content, fileId } = body

    // Validate conversationId is present and valid UUID format
    if (!conversationId || typeof conversationId !== 'string' || !UUID_REGEX.test(conversationId)) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El ID de conversación es inválido.',
          },
        },
        { status: 400 }
      )
    }

    // Validate content or fileId is present (allow file-only messages)
    const hasContent = content && typeof content === 'string' && content.trim() !== ''
    const hasFile = fileId && typeof fileId === 'string' && UUID_REGEX.test(fileId)

    if (!hasContent && !hasFile) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'El contenido del mensaje o un archivo es requerido.',
          },
        },
        { status: 400 }
      )
    }

    // Use file reference as message if no text content
    const messageContent = hasContent ? content!.trim() : `[Archivo adjunto]`

    if (messageContent.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: `El mensaje excede el límite de ${MAX_MESSAGE_LENGTH} caracteres.`,
          },
        },
        { status: 400 }
      )
    }

    // DEBUG LOGGING - Request validated
    console.log('[CHAT-DEBUG] User ID:', user.id)
    console.log('[CHAT-DEBUG] Conversation ID:', conversationId)
    console.log('[CHAT-DEBUG] Message content:', messageContent)
    console.log('[CHAT-DEBUG] File ID:', fileId || '(none)')
    console.log('[CHAT-DEBUG] Has text content:', hasContent)
    console.log('[CHAT-DEBUG] Has file:', hasFile)
    console.log('[CHAT-DEBUG] ================================================\n')

    // 1. Fetch conversation history FIRST (needed for filter context and main agent)
    const messagesResult = await fetchMessages(conversationId, supabase)
    const existingMessages = messagesResult.data || []

    // Find the last assistant message for filter context
    // This helps the filter understand if user is responding to a question
    const lastAssistantMessage = [...existingMessages]
      .reverse()
      .find((msg) => msg.role === 'assistant')

    // 2. Save user message (ensures persistence even if API fails)
    // Pass authenticated supabase client for Edge runtime RLS compliance
    // Link file to message if fileId provided
    const userMessageResult = await createMessage(conversationId, 'user', messageContent, fileId || undefined, supabase)
    if (userMessageResult.error || !userMessageResult.data) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'No se pudo guardar el mensaje. Intenta de nuevo.',
          },
        },
        { status: 500 }
      )
    }

    // 3. Filter the message with conversation context
    // Check if last assistant message contains analysis results (has metadata with analysisType)
    const lastMessageMetadata = lastAssistantMessage?.metadata as Record<string, unknown> | null
    const analysisJustPerformed = Boolean(lastMessageMetadata?.analysisType)
    const analysisType = lastMessageMetadata?.analysisType as string | undefined

    const filterContext: FilterContext | undefined = lastAssistantMessage
      ? {
          lastAssistantMessage: lastAssistantMessage.content,
          analysisJustPerformed,
          analysisType,
        }
      : undefined

    let filterResult: { allowed: boolean }
    try {
      filterResult = await filterMessage(messageContent, filterContext)
    } catch (error) {
      // Handle classified OpenAI errors with proper status codes
      if (error instanceof FilterError) {
        const status = error.code === 'OPENAI_RATE_LIMIT' ? 429 : 503
        console.error(`[Chat API] Filter error: ${error.code}`, error.message)
        return NextResponse.json(
          {
            data: null,
            error: {
              code: error.code,
              message: error.message,
            },
          },
          { status }
        )
      }

      // Fallback for unexpected errors
      console.error('[Chat API] Unexpected filter error:', error)
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'OPENAI_UNAVAILABLE',
            message: API_ERRORS.OPENAI_UNAVAILABLE,
          },
        },
        { status: 503 }
      )
    }

    // DEBUG LOGGING - Filter result
    console.log('[CHAT-DEBUG] Filter result:', filterResult.allowed ? 'ALLOWED' : 'REJECTED')

    // 3. Handle rejected messages
    if (!filterResult.allowed) {
      console.log('[CHAT-DEBUG] Message rejected by filter, returning rejection response')
      const assistantMessageResult = await createMessage(
        conversationId,
        'assistant',
        REJECTION_MESSAGE,
        undefined,
        supabase
      )

      if (assistantMessageResult.error || !assistantMessageResult.data) {
        return NextResponse.json(
          {
            data: null,
            error: {
              code: 'INTERNAL_ERROR',
              message: 'No se pudo guardar la respuesta. Intenta de nuevo.',
            },
          },
          { status: 500 }
        )
      }

      // Update conversation timestamp for sorting
      await updateConversationTimestamp(conversationId, supabase)

      return NextResponse.json({
        data: {
          userMessage: userMessageResult.data,
          assistantMessage: assistantMessageResult.data,
          filtered: true,
        },
        error: null,
      })
    }

    // 4. For allowed messages, stream response from Main Agent with tool support
    // Use already-fetched messages (don't include the just-added user message)
    const conversationHistory = existingMessages

    // Build file context for the agent (pass authenticated client for Edge runtime)
    const fileContext = await buildFileContext(conversationId, supabase)

    // DEBUG LOGGING - File context
    console.log('\n[CHAT-DEBUG] ========== FILE CONTEXT ==========')
    console.log('[CHAT-DEBUG] Files found:', fileContext.files.length)
    fileContext.files.forEach((f, i) => {
      console.log(`[CHAT-DEBUG]   File ${i + 1}: ID=${f.id}, Name=${f.name}, Status=${f.status}`)
    })
    console.log('[CHAT-DEBUG] Context string length:', fileContext.contextString.length)
    console.log('[CHAT-DEBUG] ================================================\n')

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = ''
        let assistantMessageId: string | null = null
        let analysisMetadata: Record<string, unknown> | null = null

        /**
         * Helper to send SSE event
         */
        const sendEvent = (event: MainAgentEvent | SSEToolCallEvent | SSEToolResultEvent | { type: 'text' | 'done' | 'error'; content?: string }) => {
          controller.enqueue(encoder.encode(encodeSSEMessage(event as Parameters<typeof encodeSSEMessage>[0])))
        }

        try {
          // Stream response from Main Agent with tools
          for await (const event of streamMainAgentWithTools({
            conversationHistory,
            userMessage: messageContent,
            fileContext: fileContext.contextString,
          })) {
            if (event.type === 'text') {
              // Regular text content - accumulate and stream
              fullContent += event.content
              sendEvent({ type: 'text', content: event.content })
            } else if (event.type === 'tool_call') {
              // Tool call detected - handle it
              if (event.name === 'analyze') {
                // Send processing indicator to client
                const toolCallEvent: SSEToolCallEvent = {
                  type: 'tool_call',
                  name: 'analyze',
                  status: 'processing',
                }
                sendEvent(toolCallEvent)

                // Extract arguments
                const args = event.arguments as { analysis_type: string; file_id: string; specification?: number }

                // Ensure assistant message exists before tool call so we can save metadata
                // Create message with current content (may be empty, will be updated later)
                if (!assistantMessageId) {
                  console.log('[CHAT-DEBUG] Creating assistant message for tool call...')
                  const partialResult = await createMessage(conversationId, 'assistant', fullContent || '', undefined, supabase)
                  if (partialResult.data) {
                    assistantMessageId = partialResult.data.id
                    console.log('[CHAT-DEBUG] Assistant message created with ID:', assistantMessageId)
                  } else {
                    console.error('[CHAT-DEBUG] Failed to create assistant message:', partialResult.error)
                  }
                } else {
                  console.log('[CHAT-DEBUG] Assistant message already exists:', assistantMessageId)
                }

                // Call Python analysis endpoint
                console.log('\n[CHAT-DEBUG] ========== INVOKING ANALYSIS TOOL ==========')
                console.log('[CHAT-DEBUG] Analysis type:', args.analysis_type)
                console.log('[CHAT-DEBUG] File ID:', args.file_id)
                console.log('[CHAT-DEBUG] Specification:', args.specification ?? '(none)')
                console.log('[CHAT-DEBUG] Message ID:', assistantMessageId || '(none)')

                const analysisResult = await invokeAnalysisTool(
                  args.analysis_type,
                  args.file_id,
                  assistantMessageId || undefined,
                  args.specification
                )

                console.log('[CHAT-DEBUG] Analysis result:', analysisResult.error ? 'ERROR' : 'SUCCESS')
                if (analysisResult.error) {
                  console.log('[CHAT-DEBUG] Error:', JSON.stringify(analysisResult.error, null, 2))
                } else if (analysisResult.data) {
                  console.log('[CHAT-DEBUG] Results keys:', Object.keys(analysisResult.data.results || {}))
                  console.log('[CHAT-DEBUG] Chart data items:', analysisResult.data.chartData?.length || 0)
                  console.log('[CHAT-DEBUG] Instructions length:', analysisResult.data.instructions?.length || 0)
                }
                console.log('[CHAT-DEBUG] ================================================\n')

                // Send tool result to client
                const toolResultEvent: SSEToolResultEvent = {
                  type: 'tool_result',
                  data: analysisResult.data,
                  error: analysisResult.error || undefined,
                }
                sendEvent(toolResultEvent)

                // Send complete status
                const completeEvent: SSEToolCallEvent = {
                  type: 'tool_call',
                  name: 'analyze',
                  status: analysisResult.error ? 'error' : 'complete',
                }
                sendEvent(completeEvent)

                // Store analysis metadata for later (will be saved with final message)
                if (analysisResult.data) {
                  analysisMetadata = {
                    results: analysisResult.data.results,
                    chartData: analysisResult.data.chartData,
                    analysisType: args.analysis_type,
                    fileId: args.file_id,
                  }
                  console.log('[CHAT-DEBUG] Analysis metadata stored for final save')

                  // Clean and stream the instructions content to the user
                  // Remove agent-only sections wrapped in <!-- AGENT_ONLY --> comments
                  // This pattern works for any analysis type that follows this convention
                  const cleanedInstructions = (analysisResult.data.instructions || '')
                    .replace(/<!--\s*AGENT_ONLY\s*-->[\s\S]*?<!--\s*\/AGENT_ONLY\s*-->/g, '')
                    .trim()

                  if (cleanedInstructions) {
                    // Stream the analysis content to the user
                    sendEvent({ type: 'text', content: '\n\n' + cleanedInstructions })
                    fullContent += '\n\n' + cleanedInstructions
                    console.log('[CHAT-DEBUG] Streamed cleaned instructions to user, length:', cleanedInstructions.length)
                  }
                } else if (analysisResult.error) {
                  // Stream error message to user
                  const errorMsg = `\n\nError en el análisis: ${analysisResult.error.message}`
                  sendEvent({ type: 'text', content: errorMsg })
                  fullContent += errorMsg
                }
              }
            } else if (event.type === 'done') {
              // Streaming complete
            }
          }

          // Save complete assistant message to database
          // Clean any internal markers that shouldn't be shown to users
          let cleanContent = fullContent
            // Remove instruction wrapper (no ^ anchor - match anywhere in string)
            .replace(/\[Resultado del análisis recibido\. Instrucciones:[^\]]*\]/g, '')
            // Remove error wrapper if present
            .replace(/\[Error en el análisis:[^\]]*\]/g, '')
            // Remove agent-only sections wrapped in HTML comments (scalable for all analysis types)
            .replace(/<!--\s*AGENT_ONLY\s*-->[\s\S]*?<!--\s*\/AGENT_ONLY\s*-->/g, '')
            .trim()

          if (assistantMessageId) {
            // Update existing message with final content
            await updateMessageContent(assistantMessageId, cleanContent, supabase)
            // Update metadata if we have analysis results
            if (analysisMetadata) {
              await updateMessageMetadata(assistantMessageId, analysisMetadata, supabase)
            }
          } else {
            // Create new message
            const newMsgResult = await createMessage(conversationId, 'assistant', cleanContent, undefined, supabase)
            // If we have analysis metadata and message was created, update it
            if (analysisMetadata && newMsgResult.data) {
              await updateMessageMetadata(newMsgResult.data.id, analysisMetadata, supabase)
            }
          }

          // Update conversation timestamp for sorting
          await updateConversationTimestamp(conversationId, supabase)

          // Send done event
          sendEvent({ type: 'done' })
        } catch (error) {
          // Classify the streaming error for proper handling
          const classification = classifyOpenAIError(error)
          console.error('[Chat API] Streaming error:', classification.code, error)

          // Save partial content if any was accumulated
          if (fullContent.length > 0) {
            const partialContent =
              fullContent + '\n\n' + STREAMING_MESSAGES.INCOMPLETE_RESPONSE
            if (!assistantMessageId) {
              await createMessage(conversationId, 'assistant', partialContent, undefined, supabase)
            }
            // Update conversation timestamp even for partial content
            await updateConversationTimestamp(conversationId, supabase)
          }

          // Send classified error event to client
          sendEvent({
            type: 'error',
            content: classification.message,
          })
        } finally {
          controller.close()
        }
      },
    })

    return createSSEResponse(stream)
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'No se pudo procesar el mensaje. Intenta de nuevo.',
        },
      },
      { status: 500 }
    )
  }
}
