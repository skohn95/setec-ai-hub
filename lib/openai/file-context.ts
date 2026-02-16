/**
 * File Context Detection for Main Agent
 *
 * This module provides utilities to detect available files in a conversation
 * and build context strings for the Main Agent to use when deciding whether
 * to invoke the analyze tool.
 */

import { getFilesByConversation, type FileRow, type FileStatus } from '@/lib/supabase/files'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Type alias for Supabase client with our database types
type TypedSupabaseClient = SupabaseClient<Database>

/**
 * Simplified file information for the agent
 */
export interface FileInfo {
  id: string
  name: string
  status: FileStatus
}

/**
 * File context result
 */
export interface FileContext {
  /** List of available files (pending or valid status) */
  files: FileInfo[]
  /** Formatted context string to append to system prompt */
  contextString: string
  /** Whether there are multiple files available */
  hasMultipleFiles: boolean
}

/**
 * Statuses that indicate a file is available for analysis
 * - 'pending': Just uploaded, not yet validated
 * - 'valid': Validated but not yet processed
 */
const AVAILABLE_STATUSES: FileStatus[] = ['pending', 'valid']

/**
 * Build file context for the Main Agent
 *
 * Fetches all files in the conversation and returns only those that
 * are available for analysis (not yet processed).
 *
 * @param conversationId - UUID of the conversation
 * @param client - Optional authenticated Supabase client (required for Edge runtime)
 * @param currentFileId - Optional fileId from current request (ensures just-uploaded file is included)
 * @returns FileContext with available files and formatted context string
 */
export async function buildFileContext(
  conversationId: string,
  client?: TypedSupabaseClient,
  currentFileId?: string
): Promise<FileContext> {
  // First attempt to fetch files using the auth client
  let result = await getFilesByConversation(conversationId, client)

  // If auth-based query returns empty, use admin client as fallback
  // This handles RLS timing issues where the session might not be fully propagated
  // Safe because the chat route has already verified the user is authenticated
  // and owns the conversation (implicitly, by having access to send messages)
  if (!result.error && result.data && result.data.length === 0) {
    console.log('[buildFileContext] Auth query returned empty, trying admin client fallback...')
    try {
      const adminClient = createAdminClient()
      const { data: adminData, error: adminError } = await adminClient
        .from('files')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (!adminError && adminData && adminData.length > 0) {
        console.log('[buildFileContext] Admin fallback found', adminData.length, 'files')
        result = { data: adminData, error: null }
      }
    } catch (adminErr) {
      console.error('[buildFileContext] Admin fallback failed:', adminErr)
    }
  }

  // Handle errors gracefully - return empty context
  if (result.error || !result.data) {
    console.error('Error fetching files for context:', result.error)

    // If we have a currentFileId but query failed, try to fetch just that file
    if (currentFileId) {
      console.log('[buildFileContext] Query failed but currentFileId provided, trying admin fetch')
      try {
        const adminClient = createAdminClient()
        const { data: singleFile, error: singleError } = await adminClient
          .from('files')
          .select('*')
          .eq('id', currentFileId)
          .single()

        if (!singleError && singleFile && AVAILABLE_STATUSES.includes(singleFile.status)) {
          const file: FileInfo = {
            id: singleFile.id,
            name: singleFile.original_name,
            status: singleFile.status,
          }
          return {
            files: [file],
            contextString: `\n\nARCHIVOS DISPONIBLES PARA ANÁLISIS:\n- ID: ${file.id}, Nombre: ${file.name}\n`,
            hasMultipleFiles: false,
          }
        }
      } catch (err) {
        console.error('[buildFileContext] Admin single file fetch failed:', err)
      }
    }

    return {
      files: [],
      contextString: '',
      hasMultipleFiles: false,
    }
  }

  // Filter to only available files
  let availableFiles = result.data.filter((file: FileRow) =>
    AVAILABLE_STATUSES.includes(file.status)
  )

  // Ensure currentFileId is included if provided and not already in the list
  // This handles edge cases where the file was just uploaded and might not appear in the query
  if (currentFileId && !availableFiles.some((f) => f.id === currentFileId)) {
    console.log('[buildFileContext] Current file not in query results, fetching directly:', currentFileId)
    try {
      const adminClient = createAdminClient()
      const { data: singleFile, error: singleError } = await adminClient
        .from('files')
        .select('*')
        .eq('id', currentFileId)
        .single()

      if (!singleError && singleFile && AVAILABLE_STATUSES.includes(singleFile.status)) {
        availableFiles = [...availableFiles, singleFile]
      }
    } catch (err) {
      console.error('[buildFileContext] Admin currentFileId fetch failed:', err)
    }
  }

  // Map to simplified info
  const files: FileInfo[] = availableFiles.map((file: FileRow) => ({
    id: file.id,
    name: file.original_name,
    status: file.status,
  }))

  // Build context string
  let contextString = ''
  if (files.length > 0) {
    contextString = '\n\nARCHIVOS DISPONIBLES PARA ANÁLISIS:\n'
    files.forEach((file) => {
      contextString += `- ID: ${file.id}, Nombre: ${file.name}\n`
    })
  }

  return {
    files,
    contextString,
    hasMultipleFiles: files.length > 1,
  }
}
