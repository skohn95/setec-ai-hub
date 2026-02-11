'use client'

import { Button } from '@/components/ui/button'
import { MessageSquarePlus, Loader2 } from 'lucide-react'
import { useCreateConversation } from '@/hooks/use-conversations'

interface NewConversationButtonProps {
  onSuccess?: () => void
}

export function NewConversationButton({ onSuccess }: NewConversationButtonProps) {
  const { mutate, isPending } = useCreateConversation()

  const handleClick = () => {
    mutate(undefined, {
      onSuccess: () => {
        onSuccess?.()
      },
    })
  }

  return (
    <Button
      className="w-full bg-setec-orange hover:bg-setec-orange/90 text-white font-medium cursor-pointer"
      onClick={handleClick}
      disabled={isPending}
      aria-label="Nueva conversacion"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creando...
        </>
      ) : (
        <>
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          Nueva conversacion
        </>
      )}
    </Button>
  )
}
