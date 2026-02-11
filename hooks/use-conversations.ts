'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { queryKeys } from '@/constants/query-keys'
import { CONVERSATION_MESSAGES, TOAST_DURATIONS } from '@/constants/messages'
import {
  getConversations,
  getConversation,
  deleteConversation,
  createConversation,
  updateConversationTitle,
  type ConversationRow,
  type ConversationWithMessages,
} from '@/lib/supabase/conversations'
import { deleteFilesByConversation } from '@/lib/supabase/files'
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
 * Includes file cleanup from Supabase Storage before deleting conversation
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // First delete files from storage (DB records will cascade delete)
      const fileDeleteResult = await deleteFilesByConversation(id)
      if (!fileDeleteResult.success) {
        // Log but don't fail - the cascade delete will clean up DB records
        console.error('Error deleting files from storage:', fileDeleteResult.error)
      }

      // Then delete the conversation
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
      toast.error(CONVERSATION_MESSAGES.DELETE_ERROR, { duration: TOAST_DURATIONS.ERROR })
    },

    // Always refetch after error or success
    onSuccess: (id: string) => {
      // Invalidate and refetch conversations list
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.lists() })
      // Remove the conversation detail from cache
      queryClient.removeQueries({ queryKey: queryKeys.conversations.detail(id) })
      // Remove files cache for this conversation
      queryClient.removeQueries({ queryKey: queryKeys.files.list(id) })
      toast.success(CONVERSATION_MESSAGES.DELETE_SUCCESS)
    },
  })
}

/**
 * Hook to create a new conversation with navigation, cache invalidation, and optimistic updates
 */
export function useCreateConversation() {
  const { user } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (title?: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await createConversation(user.id, title)

      if (error || !data) {
        throw error || new Error('Failed to create conversation')
      }

      return data
    },

    // Optimistic update - add placeholder conversation to list immediately
    onMutate: async (title?: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.conversations.lists() })

      // Snapshot the previous value
      const previousConversations = queryClient.getQueryData<ConversationRow[]>(
        queryKeys.conversations.lists()
      )

      // Create optimistic conversation (will be replaced by real one on success)
      // Use null title so it shows the formatted date immediately
      const optimisticConversation: ConversationRow = {
        id: `temp-${Date.now()}`,
        user_id: user?.id || '',
        title: title ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Optimistically add the conversation to the top of the list
      if (previousConversations) {
        queryClient.setQueryData<ConversationRow[]>(
          queryKeys.conversations.lists(),
          [optimisticConversation, ...previousConversations]
        )
      }

      // Return context with snapshot for rollback
      return { previousConversations, optimisticId: optimisticConversation.id }
    },

    // Rollback on error
    onError: (_error, _title, context) => {
      if (context?.previousConversations) {
        queryClient.setQueryData(
          queryKeys.conversations.lists(),
          context.previousConversations
        )
      }
      toast.error(CONVERSATION_MESSAGES.CREATE_ERROR, { duration: TOAST_DURATIONS.ERROR })
    },

    onSuccess: (data) => {
      // Invalidate conversations list to get real data from server
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.lists() })
      // Navigate to the new conversation
      router.push(`/conversacion/${data.id}`)
    },
  })
}

/**
 * Hook to update a conversation title with optimistic updates
 */
export function useUpdateConversationTitle() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { success, error } = await updateConversationTitle(id, title)

      if (error || !success) {
        throw error || new Error('Failed to update conversation title')
      }

      return { id, title }
    },

    // Optimistic update
    onMutate: async ({ id, title }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.conversations.lists() })
      await queryClient.cancelQueries({ queryKey: queryKeys.conversations.detail(id) })

      // Snapshot the previous values
      const previousConversations = queryClient.getQueryData<ConversationRow[]>(
        queryKeys.conversations.lists()
      )
      const previousConversation = queryClient.getQueryData<ConversationWithMessages>(
        queryKeys.conversations.detail(id)
      )

      // Optimistically update the conversation in the list
      if (previousConversations) {
        queryClient.setQueryData<ConversationRow[]>(
          queryKeys.conversations.lists(),
          previousConversations.map((c) =>
            c.id === id ? { ...c, title, updated_at: new Date().toISOString() } : c
          )
        )
      }

      // Optimistically update the conversation detail
      if (previousConversation) {
        queryClient.setQueryData<ConversationWithMessages>(
          queryKeys.conversations.detail(id),
          { ...previousConversation, title, updated_at: new Date().toISOString() }
        )
      }

      // Return context with snapshots for rollback
      return { previousConversations, previousConversation }
    },

    // Rollback on error
    onError: (_error, { id }, context) => {
      if (context?.previousConversations) {
        queryClient.setQueryData(
          queryKeys.conversations.lists(),
          context.previousConversations
        )
      }
      if (context?.previousConversation) {
        queryClient.setQueryData(
          queryKeys.conversations.detail(id),
          context.previousConversation
        )
      }
      toast.error(CONVERSATION_MESSAGES.UPDATE_TITLE_ERROR, { duration: TOAST_DURATIONS.ERROR })
    },

    onSuccess: ({ id }) => {
      // Invalidate caches to get fresh data from server
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.lists() })
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.detail(id) })
      toast.success(CONVERSATION_MESSAGES.UPDATE_TITLE_SUCCESS)
    },
  })
}

// Re-export types for convenience
export type { ConversationRow, ConversationWithMessages } from '@/lib/supabase/conversations'
