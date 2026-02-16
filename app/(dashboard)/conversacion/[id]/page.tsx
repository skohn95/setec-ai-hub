'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useConversation, useUpdateConversationTitle } from '@/hooks/use-conversations'
import { ChatContainer, ChatHeader } from '@/components/chat'

// UUID v4 regex pattern for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default function ConversationDetailPage() {
  const params = useParams()
  const conversationId = params.id as string

  // Validate UUID format
  const isValidUUID = UUID_REGEX.test(conversationId)

  const { data: conversation, isLoading, isError } = useConversation(
    isValidUUID ? conversationId : null
  )
  const updateTitleMutation = useUpdateConversationTitle()

  // Invalid ID format
  if (!isValidUUID) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full p-8 text-center"
        data-testid="conversation-invalid"
      >
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-setec-charcoal mb-2">
          ID de conversación inválido
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          El formato del ID no es válido.
        </p>
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-4" data-testid="conversation-loading">
        <div className="border-b pb-4 mb-4">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex-1 space-y-4">
          <div className="flex justify-end">
            <Skeleton className="h-16 w-3/4 rounded-lg" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-24 w-3/4 rounded-lg" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-12 w-2/3 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  // Error or not found state
  if (isError || !conversation) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full p-8 text-center"
        data-testid="conversation-not-found"
      >
        <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-setec-charcoal mb-2">
          Conversación no encontrada
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Esta conversación no existe o no tienes acceso a ella.
        </p>
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    )
  }

  // Success - show chat interface
  return (
    <div className="flex-1 flex flex-col min-h-0" data-testid="conversation-detail">
      <ChatHeader
        conversation={conversation}
        onTitleUpdate={(title) => updateTitleMutation.mutate({ id: conversationId, title })}
        isUpdating={updateTitleMutation.isPending}
      />
      <div className="flex-1 min-h-0">
        <ChatContainer conversationId={conversationId} />
      </div>
    </div>
  )
}
