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

  // Auto-focus textarea on mount
  useEffect(() => {
    if (!disabled) {
      textareaRef.current?.focus()
    }
  }, [])

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
   * Focuses the textarea after file selection for immediate typing
   */
  const handleFileSelect = useCallback((file: File | null) => {
    setSelectedFile(file)
    onFileChange?.(file)
    // Focus the textarea after file selection
    if (file) {
      textareaRef.current?.focus()
    }
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
    <div className="shrink-0 border-t bg-white dark:bg-gray-900">
      <div className="py-4 px-8 md:px-12">
        {/* File preview when file is selected */}
        {selectedFile && (
          <FilePreview file={selectedFile} onRemove={() => {
            setSelectedFile(null)
            onFileChange?.(null)
          }} />
        )}

        {/* Input container */}
        <div className="relative flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-2 shadow-sm transition-all focus-within:border-setec-orange focus-within:ring-2 focus-within:ring-setec-orange/20">
          {/* File upload button */}
          <PrivacyTooltip>
            <FileUpload
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              disabled={isDisabled}
            />
          </PrivacyTooltip>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={CHAT_MESSAGES.PLACEHOLDER}
            disabled={isDisabled}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent px-2 py-2.5',
              'text-sm leading-6 text-gray-900 dark:text-gray-100 placeholder:text-gray-400',
              'focus:outline-none',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'overflow-y-auto'
            )}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={isDisabled || (!value.trim() && !selectedFile)}
            size="icon"
            className={cn(
              'shrink-0 h-10 w-10 rounded-xl transition-all cursor-pointer',
              'bg-setec-orange hover:bg-setec-orange/90 text-white',
              'disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed dark:disabled:bg-gray-700'
            )}
            aria-label={isLoading ? CHAT_MESSAGES.SENDING : CHAT_MESSAGES.SEND_BUTTON}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>

      </div>
    </div>
  )
}
