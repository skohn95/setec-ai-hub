'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useConversations, useDeleteConversation, useUpdateConversationTitle } from '@/hooks/use-conversations'
import { ConversationItem } from './ConversationItem'
import { DeleteConversationDialog } from './DeleteConversationDialog'

const SKELETON_COUNT = 4

interface ConversationListProps {
  selectedConversationId?: string | null
  onNavigate?: () => void // Called when user navigates (for mobile sidebar close)
}

export function ConversationList({ selectedConversationId, onNavigate }: ConversationListProps) {
  const router = useRouter()
  const { data: conversations, isLoading, isError, refetch } = useConversations()
  const deleteConversationMutation = useDeleteConversation()
  const updateTitleMutation = useUpdateConversationTitle()
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)

  const handleTitleUpdate = (id: string, title: string) => {
    updateTitleMutation.mutate({ id, title })
  }

  const handleDeleteRequest = (id: string) => {
    setConversationToDelete(id)
  }

  const handleDeleteConfirm = () => {
    if (conversationToDelete) {
      // Navigate to home if deleting currently viewed conversation
      const isDeletingCurrentConversation = conversationToDelete === selectedConversationId

      deleteConversationMutation.mutate(conversationToDelete, {
        onSuccess: () => {
          if (isDeletingCurrentConversation) {
            router.push('/')
          }
        },
      })
      setConversationToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setConversationToDelete(null)
  }

  // Loading state - adapted for dark sidebar
  if (isLoading) {
    return (
      <div className="space-y-2 p-2" data-testid="conversations-loading">
        {[...Array(SKELETON_COUNT)].map((_, i) => (
          <div key={i} className="px-3 py-2">
            <Skeleton className="h-4 w-3/4 mb-2 bg-sidebar-hover" />
            <Skeleton className="h-3 w-1/2 bg-sidebar-hover" />
          </div>
        ))}
      </div>
    )
  }

  // Error state - adapted for dark sidebar
  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center p-4 text-center"
        data-testid="conversations-error"
      >
        <p className="text-sm text-red-400 mb-2">
          Error al cargar conversaciones
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="border-sidebar-border text-sidebar-foreground hover:bg-sidebar-hover"
        >
          Reintentar
        </Button>
      </div>
    )
  }

  // Empty state - adapted for dark sidebar
  if (!conversations || conversations.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center p-6 text-center"
        data-testid="conversations-empty"
      >
        <MessageSquare className="h-8 w-8 text-sidebar-muted mb-3" />
        <p className="text-sm font-medium text-sidebar-foreground mb-1">
          No tienes conversaciones aún
        </p>
        <p className="text-xs text-sidebar-muted">
          Inicia una nueva para comenzar tu análisis
        </p>
      </div>
    )
  }

  // Conversations list
  return (
    <>
      <div className="flex-1 overflow-y-auto overscroll-contain sidebar-scrollbar">
        <div className="space-y-1 p-2" data-testid="conversations-list">
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedConversationId === conversation.id}
              onDelete={handleDeleteRequest}
              onTitleUpdate={handleTitleUpdate}
              isUpdating={updateTitleMutation.isPending}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </div>

      <DeleteConversationDialog
        open={!!conversationToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={deleteConversationMutation.isPending}
      />
    </>
  )
}
