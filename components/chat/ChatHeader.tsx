'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ConversationRow } from '@/lib/supabase/conversations'

interface ChatHeaderProps {
  conversation: ConversationRow
  onTitleUpdate: (title: string) => void
  isUpdating?: boolean
}

export default function ChatHeader({
  conversation,
  onTitleUpdate,
  isUpdating,
}: ChatHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Display title or fallback
  const displayTitle = conversation.title || 'Nueva conversacion'

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleEditClick = () => {
    setEditValue(conversation.title || '')
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    const trimmedValue = editValue.trim()
    if (trimmedValue && trimmedValue !== conversation.title) {
      onTitleUpdate(trimmedValue)
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

  const handleBlur = (e: React.FocusEvent) => {
    // Don't save if clicking Save/Cancel buttons (they handle it themselves)
    const relatedTarget = e.relatedTarget as HTMLElement | null
    if (relatedTarget?.closest('[data-testid="chat-header-save-btn"], [data-testid="chat-header-cancel-btn"]')) {
      return
    }
    handleSaveEdit()
  }

  return (
    <div
      className="flex items-center gap-2 px-4 py-3 border-b border-border bg-background min-h-[56px]"
      data-testid="chat-header"
    >
      {isEditing ? (
        <div className="flex items-center gap-2 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            className="flex-1 text-lg font-semibold text-setec-charcoal bg-muted px-2 py-0 h-7 rounded border border-border focus:outline-none focus:ring-2 focus:ring-setec-orange"
            data-testid="chat-header-title-input"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100 cursor-pointer"
            onClick={handleSaveEdit}
            aria-label="Guardar"
            data-testid="chat-header-save-btn"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
            onClick={handleCancelEdit}
            aria-label="Cancelar"
            data-testid="chat-header-cancel-btn"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 group flex-1 min-w-0">
          <h1
            className="text-lg font-semibold text-setec-charcoal truncate"
            data-testid="chat-header-title"
          >
            {displayTitle}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-setec-charcoal cursor-pointer"
            onClick={handleEditClick}
            disabled={isUpdating}
            aria-label="Editar nombre"
            data-testid="chat-header-edit-btn"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
