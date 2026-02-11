'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { Trash2, Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatRelativeTime, formatDisplayTime } from '@/lib/utils/date-utils'
import type { ConversationRow } from '@/lib/supabase/conversations'

interface ConversationItemProps {
  conversation: ConversationRow
  isSelected: boolean
  onDelete: (id: string) => void
  onTitleUpdate?: (id: string, title: string) => void
  isUpdating?: boolean
  onNavigate?: () => void // Called when item is clicked (for mobile sidebar close)
}

const MAX_TITLE_LENGTH = 30

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

function formatConversationDate(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDate()
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const year = date.getFullYear()
  const time = formatDisplayTime(date)
  return `${day} ${month} ${year}, ${time}`
}

export function ConversationItem({
  conversation,
  isSelected,
  onDelete,
  onTitleUpdate,
  isUpdating,
  onNavigate,
}: ConversationItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Show title if available, otherwise show formatted creation date
  const displayTitle = conversation.title
    ? truncateText(conversation.title, MAX_TITLE_LENGTH)
    : formatConversationDate(conversation.created_at)

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onDelete(conversation.id)
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditValue(conversation.title || '')
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    const trimmedValue = editValue.trim()
    if (trimmedValue && trimmedValue !== conversation.title && onTitleUpdate) {
      onTitleUpdate(conversation.id, trimmedValue)
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelEdit()
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    // Prevent navigation when in edit mode
    if (isEditing) {
      e.preventDefault()
      return
    }
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
          ? 'bg-setec-orange text-white'
          : 'hover:bg-sidebar-hover'
        }
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`conversation-item-${conversation.id}`}
    >
      <div className="flex items-center justify-between px-3 py-2.5 min-h-[52px]">
        <div className="flex-1 min-w-0 flex items-center">
          {isEditing ? (
            <div className="flex items-center gap-1 w-full" onClick={(e) => e.preventDefault()}>
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSaveEdit}
                className="flex-1 text-sm font-medium bg-sidebar-hover text-sidebar-foreground px-1.5 py-0.5 rounded border border-sidebar-border focus:outline-none focus:ring-1 focus:ring-setec-orange min-w-0"
                data-testid={`edit-title-input-${conversation.id}`}
              />
            </div>
          ) : (
            <div className="min-w-0">
              <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-sidebar-foreground'}`}>
                {displayTitle}
              </p>
              {/* Only show relative time when conversation has a title (not showing date as title) */}
              {conversation.title && (
                <p className={`text-[10px] ${isSelected ? 'text-white/70' : 'text-white/50'}`}>
                  {formatRelativeTime(conversation.updated_at)}
                </p>
              )}
            </div>
          )}
        </div>

        <div className={`flex items-center shrink-0 ${isEditing ? 'invisible' : ''}`}>
          {onTitleUpdate && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 transition-all cursor-pointer ${
                isHovered || isSelected ? 'opacity-100' : 'opacity-0'
              } ${
                isSelected ? 'text-white/80' : 'text-white/70'
              } hover:text-white hover:bg-sidebar-hover`}
              onClick={handleEditClick}
              disabled={isUpdating}
              aria-label="Editar nombre"
              data-testid={`edit-conversation-${conversation.id}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 transition-all cursor-pointer ${
              isHovered || isSelected ? 'opacity-100' : 'opacity-0'
            } ${
              isSelected ? 'text-white/80' : 'text-white/70'
            } hover:text-white hover:bg-red-500/80`}
            onClick={handleDeleteClick}
            aria-label="Eliminar conversacion"
            data-testid={`delete-conversation-${conversation.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Link>
  )
}
