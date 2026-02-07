import { createClient } from './client'
import { logSupabaseError } from '@/lib/utils/error-utils'
import type { Database, Json } from '@/types/database'
import type { MessageFile } from '@/types/chat'

// Type aliases for cleaner code
export type MessageRow = Database['public']['Tables']['messages']['Row']
export type MessageRole = 'user' | 'assistant' | 'system'

// Extended message type with file attachments
export interface MessageRowWithFiles extends MessageRow {
  files?: MessageFile[]
}

// UUID v4 regex pattern for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id)
}

export interface MessagesResult {
  data: MessageRow[] | null
  error: Error | null
}

export interface MessagesWithFilesResult {
  data: MessageRowWithFiles[] | null
  error: Error | null
}

export interface MessageResult {
  data: MessageRow | null
  error: Error | null
}

/**
 * Fetch all messages for a conversation, sorted by created_at ascending
 * RLS policies ensure users can only access messages in their own conversations
 */
export async function fetchMessages(conversationId: string): Promise<MessagesResult> {
  // Validate conversationId format
  if (!conversationId || !isValidUUID(conversationId)) {
    return { data: null, error: new Error('Invalid conversation ID format') }
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    logSupabaseError(error, 'fetchMessages', 'messages')
    return { data: null, error: new Error(error.message) }
  }

  return { data: data || [], error: null }
}

/**
 * Fetch all messages for a conversation with their attached files
 * Uses a join to include files linked to each message
 */
export async function fetchMessagesWithFiles(
  conversationId: string
): Promise<MessagesWithFilesResult> {
  // Validate conversationId format
  if (!conversationId || !isValidUUID(conversationId)) {
    return { data: null, error: new Error('Invalid conversation ID format') }
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      files(*)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    logSupabaseError(error, 'fetchMessagesWithFiles', 'messages')
    return { data: null, error: new Error(error.message) }
  }

  // Map the response to ensure files is always an array
  const messagesWithFiles: MessageRowWithFiles[] = (data || []).map((msg) => ({
    ...msg,
    files: Array.isArray(msg.files) ? msg.files : [],
  }))

  return { data: messagesWithFiles, error: null }
}

/**
 * Create a new message in a conversation
 * RLS policies ensure users can only create messages in their own conversations
 * Optionally links an existing file to the message via metadata
 */
export async function createMessage(
  conversationId: string,
  role: MessageRole,
  content: string,
  fileId?: string
): Promise<MessageResult> {
  // Validate conversationId format
  if (!conversationId || !isValidUUID(conversationId)) {
    return { data: null, error: new Error('Invalid conversation ID format') }
  }

  // Validate content is not empty
  if (!content || content.trim() === '') {
    return { data: null, error: new Error('Message content cannot be empty') }
  }

  const supabase = createClient()

  // Build metadata with optional fileId
  const metadata = fileId ? { fileId } : {}

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role,
      content,
      metadata,
    })
    .select()
    .single()

  if (error) {
    logSupabaseError(error, 'createMessage', 'messages')
    return { data: null, error: new Error(error.message) }
  }

  // If fileId provided, link the file to this message
  if (fileId && data) {
    await supabase
      .from('files')
      .update({ message_id: data.id })
      .eq('id', fileId)
  }

  return { data, error: null }
}

/**
 * Update the metadata of an existing message
 * Used for adding analysis results, chartData, etc. to assistant messages
 */
export async function updateMessageMetadata(
  messageId: string,
  metadata: Record<string, unknown>
): Promise<MessageResult> {
  // Validate messageId format
  if (!messageId || !isValidUUID(messageId)) {
    return { data: null, error: new Error('Invalid message ID format') }
  }

  const supabase = createClient()

  // First fetch the current metadata
  const { data: currentMsg, error: fetchError } = await supabase
    .from('messages')
    .select('metadata')
    .eq('id', messageId)
    .single()

  if (fetchError) {
    logSupabaseError(fetchError, 'updateMessageMetadata:fetch', 'messages')
    return { data: null, error: new Error(fetchError.message) }
  }

  // Merge new metadata with existing
  const existingMetadata = (currentMsg?.metadata as Record<string, unknown>) || {}
  const mergedMetadata = { ...existingMetadata, ...metadata }

  // Update with merged metadata
  // Cast to Json type for Supabase compatibility
  const { data, error } = await supabase
    .from('messages')
    .update({ metadata: mergedMetadata as unknown as Json })
    .eq('id', messageId)
    .select()
    .single()

  if (error) {
    logSupabaseError(error, 'updateMessageMetadata:update', 'messages')
    return { data: null, error: new Error(error.message) }
  }

  return { data, error: null }
}
