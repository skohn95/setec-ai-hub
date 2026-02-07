'use client'

import { Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface StreamingMessageProps {
  content: string
  isComplete: boolean
}

/**
 * StreamingMessage component displays a message that is being streamed
 * Shows a typing cursor animation while streaming is in progress
 * Matches ChatMessage styling for assistant messages
 */
export default function StreamingMessage({ content, isComplete }: StreamingMessageProps) {
  return (
    <div
      data-testid="streaming-message"
      role="listitem"
      className="flex items-end gap-2 px-4 py-2 justify-start"
    >
      {/* Avatar for assistant */}
      <Avatar size="sm" data-testid="bot-avatar">
        <AvatarFallback className="bg-muted">
          <Bot className="h-4 w-4 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>

      {/* Message bubble */}
      <div
        data-testid="message-bubble"
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2 text-sm',
          'bg-muted text-foreground rounded-bl-md'
        )}
      >
        {/* Message content with cursor */}
        <p className="whitespace-pre-wrap break-words">
          {content}
          {!isComplete && (
            <span
              data-testid="typing-cursor"
              className="inline-block w-2 h-4 ml-0.5 bg-foreground/70 animate-pulse"
              aria-label="Typing..."
            />
          )}
        </p>
      </div>
    </div>
  )
}
