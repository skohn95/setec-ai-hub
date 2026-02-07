/**
 * File Context Detection for Main Agent
 *
 * This module provides utilities to detect available files in a conversation
 * and build context strings for the Main Agent to use when deciding whether
 * to invoke the analyze tool.
 */

import { getFilesByConversation, type FileRow, type FileStatus } from '@/lib/supabase/files'

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
 * @returns FileContext with available files and formatted context string
 */
export async function buildFileContext(conversationId: string): Promise<FileContext> {
  const result = await getFilesByConversation(conversationId)

  // Handle errors gracefully - return empty context
  if (result.error || !result.data) {
    console.error('Error fetching files for context:', result.error)
    return {
      files: [],
      contextString: '',
      hasMultipleFiles: false,
    }
  }

  // Filter to only available files
  const availableFiles = result.data.filter((file: FileRow) =>
    AVAILABLE_STATUSES.includes(file.status)
  )

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
