'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { CHAT_MESSAGES } from '@/constants/messages'

/**
 * MessageSkeleton component displays a loading placeholder
 * that matches the ChatMessage layout for assistant messages
 */
export default function MessageSkeleton() {
  return (
    <div
      data-testid="message-skeleton"
      aria-busy="true"
      aria-label={CHAT_MESSAGES.LOADING}
      className="flex items-end gap-2 px-4 py-2 justify-start"
    >
      {/* Avatar skeleton */}
      <Skeleton
        data-testid="skeleton-avatar"
        className="h-6 w-6 rounded-full shrink-0"
      />

      {/* Message bubble skeleton */}
      <Skeleton
        data-testid="skeleton-message"
        className="h-16 w-48 rounded-2xl rounded-bl-md"
      />
    </div>
  )
}
