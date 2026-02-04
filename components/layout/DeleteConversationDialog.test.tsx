import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DeleteConversationDialog } from './DeleteConversationDialog'

describe('DeleteConversationDialog', () => {
  describe('Opening and closing', () => {
    it('renders when open is true', () => {
      render(
        <DeleteConversationDialog
          open={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isDeleting={false}
        />
      )

      expect(screen.getByTestId('delete-conversation-dialog')).toBeInTheDocument()
    })

    it('does not render when open is false', () => {
      render(
        <DeleteConversationDialog
          open={false}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isDeleting={false}
        />
      )

      expect(screen.queryByTestId('delete-conversation-dialog')).not.toBeInTheDocument()
    })
  })

  describe('Content', () => {
    it('shows correct Spanish title', () => {
      render(
        <DeleteConversationDialog
          open={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isDeleting={false}
        />
      )

      expect(screen.getByText('¿Eliminar esta conversación?')).toBeInTheDocument()
    })

    it('shows correct Spanish description', () => {
      render(
        <DeleteConversationDialog
          open={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isDeleting={false}
        />
      )

      expect(
        screen.getByText('Esta acción no se puede deshacer. Se eliminarán todos los mensajes.')
      ).toBeInTheDocument()
    })

    it('shows Cancelar button', () => {
      render(
        <DeleteConversationDialog
          open={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isDeleting={false}
        />
      )

      expect(screen.getByText('Cancelar')).toBeInTheDocument()
    })

    it('shows Eliminar button', () => {
      render(
        <DeleteConversationDialog
          open={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isDeleting={false}
        />
      )

      expect(screen.getByText('Eliminar')).toBeInTheDocument()
    })
  })

  describe('Actions', () => {
    it('calls onCancel when Cancelar button is clicked', async () => {
      const onCancel = vi.fn()
      const user = userEvent.setup()

      render(
        <DeleteConversationDialog
          open={true}
          onConfirm={vi.fn()}
          onCancel={onCancel}
          isDeleting={false}
        />
      )

      await user.click(screen.getByText('Cancelar'))

      expect(onCancel).toHaveBeenCalled()
    })

    it('calls onConfirm when Eliminar button is clicked', async () => {
      const onConfirm = vi.fn()
      const user = userEvent.setup()

      render(
        <DeleteConversationDialog
          open={true}
          onConfirm={onConfirm}
          onCancel={vi.fn()}
          isDeleting={false}
        />
      )

      await user.click(screen.getByTestId('confirm-delete-button'))

      expect(onConfirm).toHaveBeenCalled()
    })
  })

  describe('Loading state', () => {
    it('disables buttons when isDeleting is true', () => {
      render(
        <DeleteConversationDialog
          open={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isDeleting={true}
        />
      )

      expect(screen.getByText('Cancelar')).toBeDisabled()
      expect(screen.getByText('Eliminando...')).toBeDisabled()
    })

    it('shows "Eliminando..." text when isDeleting', () => {
      render(
        <DeleteConversationDialog
          open={true}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          isDeleting={true}
        />
      )

      expect(screen.getByText('Eliminando...')).toBeInTheDocument()
    })
  })
})
