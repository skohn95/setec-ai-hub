'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/constants/query-keys'
import {
  getConversations,
  getConversation,
  deleteConversation,
  type ConversationRow,
  type ConversationWithMessages,
} from '@/lib/supabase/conversations'
import { useAuth } from '@/lib/providers/AuthProvider'

/**
 * Hook to fetch all conversations for the current user
 */
export function useConversations() {
  const { user } = useAuth()

  return useQuery({
    queryKey: queryKeys.conversations.lists(),
    queryFn: async (): Promise<ConversationRow[]> => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await getConversations(user.id)

      if (error) {
        throw error
      }

      return data || []
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  })
}

/**
 * Hook to fetch a single conversation with its messages
 */
export function useConversation(id: string | null) {
  return useQuery({
    queryKey: id ? queryKeys.conversations.detail(id) : ['conversations', 'detail', 'disabled'],
    queryFn: async (): Promise<ConversationWithMessages> => {
      if (!id) {
        throw new Error('Conversation ID is required')
      }

      const { data, error } = await getConversation(id)

      if (error) {
        throw error
      }

      if (!data) {
        throw new Error('Conversation not found')
      }

      return data
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  })
}

/**
 * Hook to delete a conversation with optimistic updates
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { success, error } = await deleteConversation(id)

      if (error || !success) {
        throw error || new Error('Failed to delete conversation')
      }

      return id
    },

    // Optimistic update
    onMutate: async (id: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.conversations.lists() })

      // Snapshot the previous value
      const previousConversations = queryClient.getQueryData<ConversationRow[]>(
        queryKeys.conversations.lists()
      )

      // Optimistically remove the conversation from the list
      if (previousConversations) {
        queryClient.setQueryData<ConversationRow[]>(
          queryKeys.conversations.lists(),
          previousConversations.filter((c) => c.id !== id)
        )
      }

      // Return a context object with the snapshotted value
      return { previousConversations }
    },

    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (_error, _id, context) => {
      if (context?.previousConversations) {
        queryClient.setQueryData(
          queryKeys.conversations.lists(),
          context.previousConversations
        )
      }
      toast.error('No se pudo eliminar la conversacion')
    },

    // Always refetch after error or success
    onSuccess: (id: string) => {
      // Invalidate and refetch conversations list
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.lists() })
      // Remove the conversation detail from cache
      queryClient.removeQueries({ queryKey: queryKeys.conversations.detail(id) })
      toast.success('Conversacion eliminada')
    },
  })
}

// Re-export types for convenience
export type { ConversationRow, ConversationWithMessages } from '@/lib/supabase/conversations'
