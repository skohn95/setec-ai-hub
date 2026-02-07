'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/constants/query-keys'
import { CHAT_MESSAGES } from '@/constants/messages'
import {
  fetchMessages,
  fetchMessagesWithFiles,
  createMessage,
  type MessageRow,
  type MessageRowWithFiles,
} from '@/lib/supabase/messages'

/**
 * Hook to fetch all messages for a conversation (without files)
 */
export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: conversationId
      ? queryKeys.messages.list(conversationId)
      : ['messages', 'list', 'disabled'],
    queryFn: async (): Promise<MessageRow[]> => {
      if (!conversationId) {
        throw new Error('Conversation ID is required')
      }

      const { data, error } = await fetchMessages(conversationId)

      if (error) {
        throw error
      }

      return data || []
    },
    enabled: !!conversationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  })
}

/**
 * Hook to fetch all messages for a conversation including file attachments
 */
export function useMessagesWithFiles(conversationId: string | null) {
  return useQuery({
    queryKey: conversationId
      ? queryKeys.messages.list(conversationId)
      : ['messages', 'list', 'disabled'],
    queryFn: async (): Promise<MessageRowWithFiles[]> => {
      if (!conversationId) {
        throw new Error('Conversation ID is required')
      }

      const { data, error } = await fetchMessagesWithFiles(conversationId)

      if (error) {
        throw error
      }

      return data || []
    },
    enabled: !!conversationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  })
}

interface SendMessageParams {
  content: string
}

/**
 * Hook to send a message to a conversation with optimistic updates
 */
export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ content }: SendMessageParams) => {
      const { data, error } = await createMessage(conversationId, 'user', content)

      if (error || !data) {
        throw error || new Error('Failed to send message')
      }

      return data
    },

    // Optimistic update - add message to list immediately
    onMutate: async ({ content }: SendMessageParams) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.messages.list(conversationId),
      })

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<MessageRow[]>(
        queryKeys.messages.list(conversationId)
      )

      // Create optimistic message
      const optimisticMessage: MessageRow = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        role: 'user',
        content,
        metadata: {},
        created_at: new Date().toISOString(),
      }

      // Optimistically add the message to the list
      if (previousMessages) {
        queryClient.setQueryData<MessageRow[]>(
          queryKeys.messages.list(conversationId),
          [...previousMessages, optimisticMessage]
        )
      } else {
        queryClient.setQueryData<MessageRow[]>(
          queryKeys.messages.list(conversationId),
          [optimisticMessage]
        )
      }

      return { previousMessages, optimisticMessage }
    },

    // Rollback on error
    onError: (_error, _variables, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          queryKeys.messages.list(conversationId),
          context.previousMessages
        )
      }
      toast.error(CHAT_MESSAGES.SEND_ERROR)
    },

    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.list(conversationId),
      })
    },
  })
}

// Re-export types for convenience
export type { MessageRow, MessageRowWithFiles } from '@/lib/supabase/messages'
