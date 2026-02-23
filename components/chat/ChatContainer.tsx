'use client'

import { useRef, useEffect, useCallback, useState, useMemo, DragEvent } from 'react'
import { RefreshCw, MessageCircle, Upload, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/lib/providers/AuthProvider'
import { useMessagesWithFiles } from '@/hooks/use-messages'
import { useSendChatMessage, useStreamingChat } from '@/hooks/use-chat'
import { Button } from '@/components/ui/button'
import { CHAT_MESSAGES } from '@/constants/messages'
import { FILE_UPLOAD_LABELS } from '@/constants/files'
import { validateExcelFile } from '@/lib/utils/file-validation'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import MessageSkeleton from './MessageSkeleton'
import StreamingMessage from './StreamingMessage'
import SpecLimitsForm from './SpecLimitsForm'

// Marker pattern for triggering SpecLimitsForm
// Format: <!-- SHOW_SPEC_LIMITS_FORM count=N file_id=UUID -->
const SPEC_LIMITS_MARKER_REGEX = /<!--\s*SHOW_SPEC_LIMITS_FORM\s+count=(\d+)\s+file_id=([a-f0-9-]+)\s*-->/i

interface ChatContainerProps {
  conversationId: string
}

/**
 * ChatContainer component - main chat interface
 * Integrates message list, input, and handles data fetching
 * Supports drag and drop file upload
 */
export default function ChatContainer({ conversationId }: ChatContainerProps) {
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)
  const [downloadingFileIds, setDownloadingFileIds] = useState<string[]>([])
  // Track which message ID had its form dismissed (to allow showing again for new messages)
  const [dismissedFormMessageId, setDismissedFormMessageId] = useState<string | null>(null)


  // Get current user for file uploads
  const { user } = useAuth()

  // Fetch messages for this conversation (with file attachments)
  const {
    data: messages,
    isLoading,
    isError,
    refetch,
  } = useMessagesWithFiles(conversationId)

  // Send message mutation via API (includes filter agent) - kept for isPending state
  const { isPending: isSending } = useSendChatMessage(conversationId)

  // Streaming chat hook for real-time responses (pass userId for file uploads)
  const {
    sendMessage: sendStreamingMessage,
    streamingContent,
    isStreaming,
    error: streamingError,
    clearError,
  } = useStreamingChat(conversationId, user?.id)

  // Track previous message count to detect new messages
  const prevMessageCountRef = useRef(0)
  const wasStreamingRef = useRef(false)

  /**
   * Detect if SpecLimitsForm should be shown based on last assistant message
   * Uses marker pattern: <!-- SHOW_SPEC_LIMITS_FORM count=N file_id=UUID -->
   */
  const specLimitsFormData = useMemo(() => {
    if (isStreaming) return null

    // Find last assistant message
    const lastAssistantMessage = messages
      ?.slice()
      .reverse()
      .find((m) => m.role === 'assistant')

    if (!lastAssistantMessage) return null

    // Don't show if this message's form was dismissed
    if (dismissedFormMessageId === lastAssistantMessage.id) return null

    const match = lastAssistantMessage.content.match(SPEC_LIMITS_MARKER_REGEX)
    if (!match) return null

    return {
      messageId: lastAssistantMessage.id,
      count: parseInt(match[1], 10),
      fileId: match[2],
    }
  }, [messages, dismissedFormMessageId, isStreaming])

  /**
   * Handle SpecLimitsForm submission
   * Sends LEI/LES values as a chat message
   */
  const handleSpecLimitsSubmit = useCallback(
    (limits: { lei: number; les: number }) => {
      const message = `LEI=${limits.lei}, LES=${limits.les}`
      if (specLimitsFormData) {
        setDismissedFormMessageId(specLimitsFormData.messageId)
      }
      sendStreamingMessage(message)
    },
    [sendStreamingMessage, specLimitsFormData]
  )

  /**
   * Handle SpecLimitsForm cancellation
   */
  const handleSpecLimitsCancel = useCallback(() => {
    if (specLimitsFormData) {
      setDismissedFormMessageId(specLimitsFormData.messageId)
    }
  }, [specLimitsFormData])

  /**
   * Scroll to bottom of messages list
   * Uses direct scrollTop manipulation to avoid scrolling parent containers
   */
  const scrollToBottom = useCallback((instant = false) => {
    const container = messagesContainerRef.current
    if (!container) return

    if (instant) {
      container.scrollTop = container.scrollHeight
    } else {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [])

  // Scroll to bottom when new content arrives, but not during stream->complete transition
  useEffect(() => {
    const messageCount = messages?.length ?? 0
    const isNewMessage = messageCount > prevMessageCountRef.current
    const justFinishedStreaming = wasStreamingRef.current && !streamingContent

    // Update refs for next render
    prevMessageCountRef.current = messageCount
    wasStreamingRef.current = !!streamingContent

    // During streaming: scroll smoothly as content grows
    if (streamingContent) {
      scrollToBottom()
      return
    }

    // When streaming just finished and new message appeared: instant scroll (no animation)
    if (justFinishedStreaming && isNewMessage) {
      scrollToBottom(true)
      return
    }

    // New message added (not from streaming): scroll smoothly
    if (isNewMessage) {
      scrollToBottom()
    }
  }, [messages, streamingContent, scrollToBottom])

  /**
   * Handle sending a message
   * Uses streaming for real-time responses
   * Clears input immediately when sending starts
   * Accepts optional file attachment
   */
  const handleSend = useCallback(
    (content: string, file?: File) => {
      clearError() // Clear any previous errors
      setInputValue('')
      setDroppedFile(null)
      sendStreamingMessage(content, file)
    },
    [sendStreamingMessage, clearError]
  )


  /**
   * Handle file download
   * Opens the file download API in a new tab
   */
  const handleDownload = useCallback((fileId: string) => {
    setDownloadingFileIds((prev) => [...prev, fileId])

    // Open download URL in new tab (API redirects to signed URL)
    window.open(`/api/files/${fileId}`, '_blank')

    // Remove from downloading state after a short delay
    setTimeout(() => {
      setDownloadingFileIds((prev) => prev.filter((id) => id !== fileId))
    }, 1000)
  }, [])

  /**
   * Drag and drop event handlers
   */
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set dragging to false if we're leaving the container
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      const validation = validateExcelFile(file)
      if (validation.valid) {
        setDroppedFile(file)
      } else {
        toast.error(validation.error)
      }
    }
  }, [])

  // Combined loading state - consider both initial load and streaming
  const isInputDisabled = isLoading || isStreaming || isSending

  // Loading state (initial load only)
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto p-4">
          <MessageSkeleton />
          <MessageSkeleton />
          <MessageSkeleton />
        </div>
        <ChatInput value={inputValue} onChange={setInputValue} onSend={handleSend} disabled />
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">{CHAT_MESSAGES.LOAD_ERROR}</p>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              {CHAT_MESSAGES.RETRY}
            </Button>
          </div>
        </div>
        <ChatInput value={inputValue} onChange={setInputValue} onSend={handleSend} disabled />
      </div>
    )
  }

  // Empty state
  const isEmpty = !messages || messages.length === 0

  return (
    <div
      className="relative flex flex-col h-full min-h-0"
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag and drop overlay with accessibility */}
      {isDragging && (
        <div
          className="absolute inset-0 bg-orange-50/90 border-2 border-dashed border-orange-400 rounded-lg flex items-center justify-center z-10"
          role="region"
          aria-live="polite"
          aria-label={FILE_UPLOAD_LABELS.DROP_ZONE}
        >
          <p className="text-orange-600 font-medium text-lg">
            {FILE_UPLOAD_LABELS.DROP_ZONE}
          </p>
        </div>
      )}

      {/* Messages area - extra bottom padding when file attached */}
      <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <div role="list" className="py-4 px-4 md:px-6">
          {isEmpty && !streamingContent ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-8">
              <div className="text-center space-y-5 max-w-md">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-setec-orange to-orange-500 text-white shadow-lg shadow-orange-500/20 mb-2">
                  <MessageCircle className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  ¿En qué puedo ayudarte?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Pregúntame sobre análisis estadístico, sube un archivo Excel para obtener resultados, o consulta dudas sobre metodología y control de calidad.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 text-xs text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-setec-orange" />
                    <span>Interpretación con IA</span>
                  </div>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center gap-1.5">
                    <Upload className="h-3.5 w-3.5 text-setec-orange" />
                    <span>Arrastra archivos Excel</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages?.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onDownload={handleDownload}
                  downloadingFileIds={downloadingFileIds}
                />
              ))}
              {/* Show streaming message while receiving response or thinking */}
              {isStreaming && (
                <StreamingMessage content={streamingContent} isThinking={!streamingContent} />
              )}
            </>
          )}
          {/* Streaming error display */}
          {streamingError && (
            <div className="px-4 py-2">
              <p className="text-sm text-destructive">{streamingError}</p>
            </div>
          )}
          {/* Invisible element for scrolling to bottom */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* SpecLimitsForm - shown when agent requests LEI/LES */}
      {specLimitsFormData && (
        <div className="px-4 pb-2">
          <SpecLimitsForm
            detectedCount={specLimitsFormData.count}
            onSubmit={handleSpecLimitsSubmit}
            onCancel={handleSpecLimitsCancel}
            isSubmitting={isStreaming}
          />
        </div>
      )}

      {/* Input area */}
      <ChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={handleSend}
        isLoading={isInputDisabled}
        disabled={isInputDisabled}
        initialFile={droppedFile}
        onFileChange={setDroppedFile}
      />
    </div>
  )
}
