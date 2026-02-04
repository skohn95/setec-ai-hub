'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useConversations, useDeleteConversation } from '@/hooks/use-conversations'
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
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null)

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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-2 p-2" data-testid="conversations-loading">
        {[...Array(SKELETON_COUNT)].map((_, i) => (
          <div key={i} className="px-3 py-2">
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center p-4 text-center"
        data-testid="conversations-error"
      >
        <p className="text-sm text-destructive mb-2">
          Error al cargar conversaciones
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
        >
          Reintentar
        </Button>
      </div>
    )
  }

  // Empty state
  if (!conversations || conversations.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center p-6 text-center"
        data-testid="conversations-empty"
      >
        <MessageSquare className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-setec-charcoal mb-1">
          No tienes conversaciones aún
        </p>
        <p className="text-xs text-muted-foreground">
          Inicia una nueva para comenzar tu análisis
        </p>
      </div>
    )
  }

  // Conversations list
  return (
    <>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2" data-testid="conversations-list">
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedConversationId === conversation.id}
              onDelete={handleDeleteRequest}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </ScrollArea>

      <DeleteConversationDialog
        open={!!conversationToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={deleteConversationMutation.isPending}
      />
    </>
  )
}
