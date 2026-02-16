'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteConversationDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}

export function DeleteConversationDialog({
  open,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConversationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent data-testid="delete-conversation-dialog">
        <DialogHeader>
          <DialogTitle>¿Eliminar esta conversación?</DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Se eliminarán todos los mensajes.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            data-testid="confirm-delete-button"
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
