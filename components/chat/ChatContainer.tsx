'use client'

import { useRef, useEffect, useCallback, useState, DragEvent } from 'react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useMessages } from '@/hooks/use-messages'
import { useSendChatMessage, useStreamingChat } from '@/hooks/use-chat'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CHAT_MESSAGES } from '@/constants/messages'
import { FILE_UPLOAD_LABELS } from '@/constants/files'
import { validateExcelFile } from '@/lib/utils/file-validation'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import MessageSkeleton from './MessageSkeleton'
import StreamingMessage from './StreamingMessage'

interface ChatContainerProps {
  conversationId: string
}

/**
 * ChatContainer component - main chat interface
 * Integrates message list, input, and handles data fetching
 * Supports drag and drop file upload
 */
export default function ChatContainer({ conversationId }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [droppedFile, setDroppedFile] = useState<File | null>(null)

  // Fetch messages for this conversation
  const {
    data: messages,
    isLoading,
    isError,
    refetch,
  } = useMessages(conversationId)

  // Send message mutation via API (includes filter agent) - kept for isPending state
  const { isPending: isSending } = useSendChatMessage(conversationId)

  // Streaming chat hook for real-time responses
  const {
    sendMessage: sendStreamingMessage,
    streamingContent,
    isStreaming,
    error: streamingError,
    clearError,
  } = useStreamingChat(conversationId)

  /**
   * Scroll to bottom of messages list
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Scroll to bottom on initial load, when messages change, or during streaming
  useEffect(() => {
    if ((messages && messages.length > 0) || streamingContent) {
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
      className="relative flex flex-col h-full"
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

      {/* Messages area */}
      <ScrollArea className="flex-1">
        <div role="list" className="py-4">
          {isEmpty && !isStreaming ? (
            <div className="flex items-center justify-center h-full min-h-[200px] p-4">
              <p className="text-muted-foreground text-center">
                {CHAT_MESSAGES.EMPTY_CONVERSATION}
              </p>
            </div>
          ) : (
            <>
              {messages?.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {/* Show streaming message while receiving response */}
              {isStreaming && (
                <StreamingMessage
                  content={streamingContent}
                  isComplete={false}
                />
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
      </ScrollArea>

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
