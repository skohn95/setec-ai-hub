import { createClient } from './client'
import { logSupabaseError } from '@/lib/utils/error-utils'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

// Type alias for Supabase client with our database types
type TypedSupabaseClient = SupabaseClient<Database>

// Type aliases for cleaner code
export type FileRow = Database['public']['Tables']['files']['Row']
export type FileStatus = FileRow['status']

// Storage bucket name
const STORAGE_BUCKET = 'analysis-files'

// Signed URL expiry time in seconds (1 hour)
const SIGNED_URL_EXPIRY = 3600

export interface FileUploadResult {
  fileId: string | null
  storagePath: string | null
  error: string | null
}

export interface FileDeleteResult {
  success: boolean
  error: string | null
}

export interface FilesResult {
  data: FileRow[] | null
  error: Error | null
}

export interface FileResult {
  data: FileRow | null
  error: Error | null
}

export interface LinkFileResult {
  success: boolean
  error: string | null
}

/**
 * Upload a file to Supabase Storage and create a database record
 * Storage path follows pattern: {user_id}/{conversation_id}/{file_id}.xlsx
 * @param userId - User ID for storage path
 * @param conversationId - Conversation ID to attach file to
 * @param file - File to upload
 * @param client - Optional authenticated Supabase client (required for server-side uploads)
 */
export async function uploadFile(
  userId: string,
  conversationId: string,
  file: File,
  client?: TypedSupabaseClient
): Promise<FileUploadResult> {
  const supabase = client ?? createClient()
  const fileId = crypto.randomUUID()
  const storagePath = `${userId}/${conversationId}/${fileId}.xlsx`

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    logSupabaseError(uploadError, 'uploadFile (storage)', 'files')
    return { fileId: null, storagePath: null, error: uploadError.message }
  }

  // Create database record
  const { error: dbError } = await supabase
    .from('files')
    .insert({
      id: fileId,
      conversation_id: conversationId,
      storage_path: storagePath,
      original_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      status: 'pending',
    })
    .select()
    .single()

  if (dbError) {
    // Rollback storage upload on database error
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])
    logSupabaseError(dbError, 'uploadFile (database)', 'files')
    return { fileId: null, storagePath: null, error: dbError.message }
  }

  return { fileId, storagePath, error: null }
}

/**
 * Generate a signed URL for downloading a file from storage
 * URLs expire after 1 hour
 */
export async function getFileDownloadUrl(storagePath: string): Promise<string | null> {
  const supabase = createClient()

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY)

  if (error) {
    logSupabaseError(error, 'getFileDownloadUrl', 'storage')
    return null
  }

  return data.signedUrl
}

/**
 * Get a download URL for a file by its ID
 * Returns null if file not found or URL generation fails
 */
export async function downloadFile(fileId: string): Promise<string | null> {
  const supabase = createClient()

  // Get file record to retrieve storage path
  const { data: file, error } = await supabase
    .from('files')
    .select('storage_path')
    .eq('id', fileId)
    .single()

  if (error || !file) {
    logSupabaseError(error, 'downloadFile', 'files')
    return null
  }

  return getFileDownloadUrl(file.storage_path)
}

/**
 * Delete all files associated with a conversation from storage
 * Note: Database records are cascade deleted via FK constraints
 */
export async function deleteFilesByConversation(
  conversationId: string
): Promise<FileDeleteResult> {
  const supabase = createClient()

  // Get all file storage paths for this conversation
  const { data: files, error: fetchError } = await supabase
    .from('files')
    .select('storage_path')
    .eq('conversation_id', conversationId)

  if (fetchError) {
    logSupabaseError(fetchError, 'deleteFilesByConversation (fetch)', 'files')
    return { success: false, error: fetchError.message }
  }

  // If no files, nothing to delete from storage
  if (!files || files.length === 0) {
    return { success: true, error: null }
  }

  // Delete from storage
  const paths = files.map((f) => f.storage_path)
  const { error: deleteError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove(paths)

  if (deleteError) {
    logSupabaseError(deleteError, 'deleteFilesByConversation (storage)', 'storage')
    return { success: false, error: deleteError.message }
  }

  return { success: true, error: null }
}

/**
 * Get all files for a conversation, ordered by created_at ascending
 */
/**
 * Get all files for a conversation, ordered by created_at ascending
 * @param conversationId - UUID of the conversation
 * @param client - Optional authenticated Supabase client (required for Edge runtime)
 */
export async function getFilesByConversation(
  conversationId: string,
  client?: TypedSupabaseClient
): Promise<FilesResult> {
  const supabase = client ?? createClient()

  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    logSupabaseError(error, 'getFilesByConversation', 'files')
    return { data: null, error: new Error(error.message) }
  }

  return { data: data || [], error: null }
}

/**
 * Get a single file by its ID
 */
export async function getFileById(fileId: string): Promise<FileResult> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', fileId)
    .single()

  if (error) {
    logSupabaseError(error, 'getFileById', 'files')
    return { data: null, error: new Error(error.message) }
  }

  return { data, error: null }
}

/**
 * Link a file to a message after the message is created
 */
export async function linkFileToMessage(
  fileId: string,
  messageId: string
): Promise<LinkFileResult> {
  const supabase = createClient()

  const { error } = await supabase
    .from('files')
    .update({ message_id: messageId })
    .eq('id', fileId)
    .select()
    .single()

  if (error) {
    logSupabaseError(error, 'linkFileToMessage', 'files')
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}
