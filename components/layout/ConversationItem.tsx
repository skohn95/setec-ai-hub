'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils/date-utils'
import type { ConversationRow } from '@/lib/supabase/conversations'

interface ConversationItemProps {
  conversation: ConversationRow
  isSelected: boolean
  onDelete: (id: string) => void
  onNavigate?: () => void // Called when item is clicked (for mobile sidebar close)
}

const MAX_TITLE_LENGTH = 30

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

export function ConversationItem({
  conversation,
  isSelected,
  onDelete,
  onNavigate,
}: ConversationItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  const displayTitle = conversation.title
    ? truncateText(conversation.title, MAX_TITLE_LENGTH)
    : 'Nueva conversación'

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete(conversation.id)
  }

  const handleClick = () => {
    // Call onNavigate for mobile sidebar close
    onNavigate?.()
  }

  return (
    <Link
      onClick={handleClick}
      href={`/conversacion/${conversation.id}`}
      className={`
        block rounded-md transition-colors
        ${isSelected
          ? 'bg-white border-l-4 border-l-setec-orange'
          : 'hover:bg-white/50'
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`conversation-item-${conversation.id}`}
    >
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-setec-charcoal truncate">
            {displayTitle}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(conversation.updated_at)}
          </p>
        </div>

        {(isHovered || isSelected) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
            onClick={handleDeleteClick}
            aria-label="Eliminar conversacion"
            data-testid={`delete-conversation-${conversation.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Link>
  )
}
