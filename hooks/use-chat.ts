'use client'

import { useState, useCallback, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/constants/query-keys'
import { CHAT_MESSAGES, STREAMING_MESSAGES, TOAST_DURATIONS } from '@/constants/messages'
import { FILE_UPLOAD_ERROR_MESSAGE } from '@/constants/files'
import type { MessageRow } from '@/lib/supabase/messages'
import type {
  ChatResponse,
  StreamChunk,
  SSEToolCallEvent,
  SSEToolResultEvent,
  SSEEvent,
  ChartDataItem,
  MSAResults,
} from '@/types/api'

interface SendChatMessageParams {
  content: string
}

/**
 * Hook to send a chat message via the API
 * Handles the full flow: user message → filter → assistant response
 */
export function useSendChatMessage(conversationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ content }: SendChatMessageParams): Promise<ChatResponse['data']> => {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content }),
      })

      const result: ChatResponse = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || 'Error al enviar el mensaje')
      }

      return result.data
    },

    // Optimistic update - add user message to list immediately
    onMutate: async ({ content }: SendChatMessageParams) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.messages.list(conversationId),
      })

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<MessageRow[]>(
        queryKeys.messages.list(conversationId)
      )

      // Create optimistic user message
      const optimisticUserMessage: MessageRow = {
        id: `temp-user-${Date.now()}`,
        conversation_id: conversationId,
        role: 'user',
        content,
        metadata: {},
        created_at: new Date().toISOString(),
      }

      // Create optimistic loading message for assistant
      const optimisticAssistantMessage: MessageRow = {
        id: `temp-assistant-${Date.now()}`,
        conversation_id: conversationId,
        role: 'assistant',
        content: '...',
        metadata: { loading: true },
        created_at: new Date().toISOString(),
      }

      // Optimistically add both messages
      queryClient.setQueryData<MessageRow[]>(
        queryKeys.messages.list(conversationId),
        (old) => [...(old || []), optimisticUserMessage, optimisticAssistantMessage]
      )

      return { previousMessages }
    },

    // Rollback on error
    onError: (_error, _variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages.list(conversationId),
          context.previousMessages
        )
      }
      toast.error(CHAT_MESSAGES.SEND_ERROR, { duration: TOAST_DURATIONS.ERROR })
    },

    // On success, replace optimistic messages with real ones
    onSuccess: (data) => {
      if (data) {
        // Replace optimistic messages with actual server response
        queryClient.setQueryData<MessageRow[]>(
          queryKeys.messages.list(conversationId),
          (old) => {
            if (!old) return [data.userMessage, data.assistantMessage]
            // Remove temp messages and add real ones
            const withoutTemp = old.filter((msg) => !msg.id.startsWith('temp-'))
            return [...withoutTemp, data.userMessage, data.assistantMessage]
          }
        )
      }
    },

    // Always invalidate after the mutation
    onSettled: () => {
      // Invalidate conversations to update the "updated_at" timestamp
      queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all,
      })
    },
  })
}

/**
 * Hook to send a chat message and receive streaming response
 * Handles SSE streams for allowed messages and JSON for filtered messages
 * Supports optional file upload before sending message
 * MSAResults type is imported from @/types/api
 */
export function useStreamingChat(conversationId: string, userId?: string) {
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [chartData, setChartData] = useState<ChartDataItem[] | null>(null)
  const [analysisResults, setAnalysisResults] = useState<MSAResults | null>(null)
  const [error, setError] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Store pending file for retry on failure
  const pendingFileRef = useRef<File | null>(null)

  /**
   * Upload file to storage and return fileId
   */
  const uploadFile = async (file: File): Promise<string | null> => {
    if (!userId) {
      console.error('User ID required for file upload')
      return null
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('conversationId', conversationId)

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || FILE_UPLOAD_ERROR_MESSAGE)
      }

      return result.data?.fileId || null
    } catch (err) {
      console.error('File upload error:', err)
      toast.error(FILE_UPLOAD_ERROR_MESSAGE, { duration: TOAST_DURATIONS.ERROR })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const sendMessage = useCallback(
    async (content: string, file?: File) => {
      setIsStreaming(true)
      setStreamingContent('')
      setError(null)

      // Store file for potential retry
      pendingFileRef.current = file || null

      // Optimistic update - show user message immediately (with or without file)
      const hasContent = content.trim().length > 0
      const hasFile = !!file

      if (hasContent || hasFile) {
        const optimisticUserMessage = {
          id: `temp-user-${Date.now()}`,
          conversation_id: conversationId,
          role: 'user' as const,
          content: hasContent ? content.trim() : '[Archivo adjunto]',
          metadata: {},
          created_at: new Date().toISOString(),
          // Include file info for immediate display
          files: hasFile ? [{
            id: `temp-file-${Date.now()}`,
            conversation_id: conversationId,
            message_id: null,
            original_name: file.name,
            storage_path: '',
            mime_type: file.type,
            size_bytes: file.size,
            created_at: new Date().toISOString(),
          }] : [],
        }
        queryClient.setQueryData(
          queryKeys.messages.list(conversationId),
          (old: unknown[]) => [...(old || []), optimisticUserMessage]
        )
      }

      // Upload file first if provided
      let fileId: string | null = null
      if (file) {
        fileId = await uploadFile(file)
        if (!fileId) {
          // File upload failed, preserve file for retry
          setIsStreaming(false)
          return
        }
        // Clear pending file on successful upload
        pendingFileRef.current = null
      }

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId, content, fileId }),
        })

        // Check if it's a streaming response
        const contentType = response.headers.get('Content-Type')

        if (contentType?.includes('text/event-stream')) {
          // Handle SSE stream
          const reader = response.body?.getReader()
          if (!reader) {
            throw new Error('No response body')
          }

          const decoder = new TextDecoder()
          let accumulatedContent = ''

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const text = decoder.decode(value, { stream: true })
            const lines = text.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6)) as SSEEvent

                  // Handle text events
                  if (data.type === 'text' && 'content' in data && data.content) {
                    accumulatedContent += data.content
                    setStreamingContent(accumulatedContent)
                  }
                  // Handle done events
                  else if (data.type === 'done') {
                    // Invalidate messages query to get final message from DB
                    queryClient.invalidateQueries({
                      queryKey: queryKeys.messages.list(conversationId),
                    })
                  }
                  // Handle error events
                  else if (data.type === 'error' && 'content' in data && data.content) {
                    setError(data.content)
                  }
                  // Handle tool call events (Story 4.4)
                  else if (data.type === 'tool_call') {
                    const toolEvent = data as SSEToolCallEvent
                    if (toolEvent.status === 'processing') {
                      setIsAnalyzing(true)
                    } else if (toolEvent.status === 'complete' || toolEvent.status === 'error') {
                      setIsAnalyzing(false)
                    }
                  }
                  // Handle tool result events (Story 4.4, enhanced in 5.1)
                  else if (data.type === 'tool_result') {
                    const resultEvent = data as SSEToolResultEvent
                    if (resultEvent.data?.chartData) {
                      setChartData(resultEvent.data.chartData)
                    }
                    // Store analysis results for ResultsDisplay (Story 5.1)
                    if (resultEvent.data?.results) {
                      setAnalysisResults(resultEvent.data.results as unknown as MSAResults)
                    }
                  }
                } catch {
                  // Ignore parsing errors for incomplete lines
                }
              }
            }
          }
        } else {
          // Handle JSON response (filtered messages)
          const json = (await response.json()) as ChatResponse
          if (json.error) {
            setError(json.error.message)
          } else {
            // Invalidate to refresh messages list with filtered response
            queryClient.invalidateQueries({
              queryKey: queryKeys.messages.list(conversationId),
            })
          }
        }
      } catch {
        setError(STREAMING_MESSAGES.CONNECTION_ERROR)
      } finally {
        setIsStreaming(false)
        // Clear streaming content immediately - ChatMessage takes over from refetch
        setStreamingContent('')
        // Always invalidate conversations to update timestamps
        queryClient.invalidateQueries({
          queryKey: queryKeys.conversations.all,
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversationId, queryClient, userId]
  )

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Get pending file for retry
  const getPendingFile = useCallback(() => pendingFileRef.current, [])

  // Clear chart data when starting new message
  const clearChartData = useCallback(() => {
    setChartData(null)
  }, [])

  // Clear analysis results (Story 5.1)
  const clearAnalysisResults = useCallback(() => {
    setAnalysisResults(null)
  }, [])

  return {
    sendMessage,
    streamingContent,
    isStreaming,
    isUploading,
    isAnalyzing,
    chartData,
    analysisResults,
    error,
    clearError,
    clearChartData,
    clearAnalysisResults,
    getPendingFile,
  }
}
