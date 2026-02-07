'use client'

import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { queryKeys } from '@/constants/query-keys'
import type { MessageFile } from '@/types/chat'

// File error messages in Spanish
const FILE_MESSAGES = {
  UPLOAD_ERROR: 'No se pudo subir el archivo. Intenta de nuevo.',
  DOWNLOAD_ERROR: 'No se pudo descargar el archivo.',
  FETCH_ERROR: 'No se pudieron cargar los archivos.',
}

interface UploadFileParams {
  userId: string
  conversationId: string
  file: File
}

interface ApiResponse<T> {
  data: T | null
  error: { code: string; message: string } | null
}

/**
 * Hook to upload a file to Supabase Storage via API
 */
export function useUploadFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      conversationId,
      file,
    }: UploadFileParams): Promise<{ fileId: string; storagePath: string }> => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('conversationId', conversationId)

      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      })

      const result: ApiResponse<{ fileId: string; storagePath: string }> =
        await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || FILE_MESSAGES.UPLOAD_ERROR)
      }

      if (!result.data) {
        throw new Error(FILE_MESSAGES.UPLOAD_ERROR)
      }

      return result.data
    },

    onError: () => {
      toast.error(FILE_MESSAGES.UPLOAD_ERROR)
    },

    onSuccess: (_data, variables) => {
      // Invalidate files query for this conversation
      queryClient.invalidateQueries({
        queryKey: queryKeys.files.list(variables.conversationId),
      })
    },
  })
}

/**
 * Hook to fetch all files for a conversation
 */
export function useFilesByConversation(conversationId: string) {
  return useQuery({
    queryKey: queryKeys.files.list(conversationId),
    queryFn: async (): Promise<MessageFile[]> => {
      const response = await fetch(
        `/api/conversations/${conversationId}/files`
      )

      const result: ApiResponse<MessageFile[]> = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error?.message || FILE_MESSAGES.FETCH_ERROR)
      }

      return result.data || []
    },
    enabled: !!conversationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to download a file - returns a function that triggers download
 */
export function useDownloadFile() {
  return useCallback((downloadUrl: string) => {
    if (!downloadUrl) return
    window.open(downloadUrl, '_blank')
  }, [])
}

/**
 * Hook to get download URL for a file via API
 */
export function useFileDownloadUrl(fileId: string) {
  return useQuery({
    queryKey: queryKeys.files.detail(fileId),
    queryFn: async (): Promise<string> => {
      // The API redirects to the signed URL
      return `/api/files/${fileId}`
    },
    enabled: !!fileId,
    staleTime: 1000 * 60 * 55, // 55 minutes (signed URLs expire in 1 hour)
  })
}
