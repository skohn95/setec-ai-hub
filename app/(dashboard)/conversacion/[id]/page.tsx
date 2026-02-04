'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useConversation } from '@/hooks/use-conversations'

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

  // Success - show placeholder chat area (full implementation in Story 2.3)
  return (
    <div className="flex flex-col h-full" data-testid="conversation-detail">
      {/* Header with conversation title */}
      <div className="border-b p-4">
        <h1 className="text-lg font-semibold text-setec-charcoal truncate">
          {conversation.title || 'Nueva conversación'}
        </h1>
      </div>

      {/* Messages area placeholder */}
      <div className="flex-1 overflow-y-auto p-4">
        {conversation.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No hay mensajes en esta conversación
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversation.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-setec-orange text-white'
                      : 'bg-gray-100 text-setec-charcoal'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input area placeholder (functional in Story 2.3) */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-100 rounded-lg px-4 py-2 text-sm text-muted-foreground">
            El area de mensajes estara disponible proximamente...
          </div>
        </div>
      </div>
    </div>
  )
}
