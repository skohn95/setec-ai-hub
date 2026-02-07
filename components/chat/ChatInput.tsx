'use client'

import { useCallback, useRef, useEffect, KeyboardEvent, useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CHAT_MESSAGES } from '@/constants/messages'
import { cn } from '@/lib/utils'
import FileUpload from './FileUpload'
import FilePreview from './FilePreview'
import { PrivacyTooltip } from '@/components/common'

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSend: (content: string, file?: File) => void
  disabled?: boolean
  isLoading?: boolean
  initialFile?: File | null
  onFileChange?: (file: File | null) => void
}

/**
 * ChatInput component for typing and sending messages
 * Supports Enter to send and Shift+Enter for new line
 * Uses controlled value/onChange pattern for retry support on failure
 * Includes file upload functionality with preview
 */
export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  isLoading = false,
  initialFile = null,
  onFileChange,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(initialFile)

  const isDisabled = disabled || isLoading

  // Sync initialFile with selectedFile when it changes (for drag and drop)
  useEffect(() => {
    if (initialFile !== selectedFile) {
      setSelectedFile(initialFile)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFile])

  /**
   * Auto-resize textarea based on content (up to 5 lines)
   */
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto'

    // Calculate the line height and max height (5 lines)
    const lineHeight = 24 // Approximate line height in pixels
    const maxHeight = lineHeight * 5

    // Set the height, respecting the max
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
  }, [])

  // Adjust height when value changes
  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  /**
   * Handle form submission
   * Note: Parent component is responsible for clearing input on success
   * This allows retry on failure (input keeps content if send fails)
   * Can send message with optional file attachment
   */
  const handleSend = useCallback(() => {
    const trimmedContent = value.trim()
    // Allow sending with just a file or just a message or both
    if (!trimmedContent && !selectedFile) return
    if (isDisabled) return

    onSend(trimmedContent, selectedFile ?? undefined)
    setSelectedFile(null)
    onFileChange?.(null)
  }, [value, isDisabled, onSend, selectedFile, onFileChange])

  /**
   * Handle file selection from FileUpload component
   */
  const handleFileSelect = useCallback((file: File | null) => {
    setSelectedFile(file)
    onFileChange?.(file)
  }, [onFileChange])

  /**
   * Handle keyboard events for Enter to send
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Enter without Shift sends the message
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
      // Shift+Enter adds a new line (default behavior)
    },
    [handleSend]
  )

  return (
    <div className="p-4 border-t bg-background">
      {/* File preview when file is selected */}
      {selectedFile && (
        <FilePreview file={selectedFile} onRemove={() => {
          setSelectedFile(null)
          onFileChange?.(null)
        }} />
      )}

      {/* Input row with file upload, textarea, and send button */}
      <div className="flex items-end gap-2">
        <PrivacyTooltip>
          <FileUpload
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            disabled={isDisabled}
          />
        </PrivacyTooltip>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={CHAT_MESSAGES.PLACEHOLDER}
          disabled={isDisabled}
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-lg border border-input bg-background px-4 py-3',
            'text-sm placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'overflow-y-auto'
          )}
          style={{ minHeight: '48px', maxHeight: '120px' }}
        />
        <Button
          onClick={handleSend}
          disabled={isDisabled || (!value.trim() && !selectedFile)}
          size="lg"
          className="shrink-0"
          aria-label={isLoading ? CHAT_MESSAGES.SENDING : CHAT_MESSAGES.SEND_BUTTON}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              {CHAT_MESSAGES.SENDING}
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              {CHAT_MESSAGES.SEND_BUTTON}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
