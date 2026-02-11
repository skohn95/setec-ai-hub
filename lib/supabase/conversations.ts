import { createClient } from './client'
import { logSupabaseError } from '@/lib/utils/error-utils'
import type { Database } from '@/types/database'
import type { MessageRow } from './messages'
import type { SupabaseClient } from '@supabase/supabase-js'

// Type alias for Supabase client with our database types
type TypedSupabaseClient = SupabaseClient<Database>

// Type aliases for cleaner code
export type ConversationRow = Database['public']['Tables']['conversations']['Row']

// UUID v4 regex pattern for validation
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id)
}

export interface ConversationWithMessages extends ConversationRow {
  messages: MessageRow[]
}

export interface ConversationsResult {
  data: ConversationRow[] | null
  error: Error | null
}

export interface ConversationResult {
  data: ConversationWithMessages | null
  error: Error | null
}

export interface DeleteResult {
  success: boolean
  error: Error | null
}

export interface CreateConversationResult {
  data: ConversationRow | null
  error: Error | null
}

/**
 * Fetch all conversations for a user, sorted by updated_at descending
 * RLS policies ensure users only see their own conversations
 */
export async function getConversations(userId: string): Promise<ConversationsResult> {
  // Validate userId format
  if (!userId || !isValidUUID(userId)) {
    return { data: null, error: new Error('Invalid user ID format') }
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    logSupabaseError(error, 'getConversations', 'conversations')
    return { data: null, error: new Error(error.message) }
  }

  return { data, error: null }
}

/**
 * Fetch a single conversation with all its messages using a single query
 * RLS policies ensure users can only access their own conversations
 */
export async function getConversation(id: string): Promise<ConversationResult> {
  // Validate conversation ID format
  if (!id || !isValidUUID(id)) {
    return { data: null, error: new Error('Invalid conversation ID format') }
  }

  const supabase = createClient()

  // Use single query with join to fetch conversation and messages together
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      messages (
        id,
        conversation_id,
        role,
        content,
        metadata,
        created_at
      )
    `)
    .eq('id', id)
    .order('created_at', { referencedTable: 'messages', ascending: true })
    .single()

  if (error) {
    logSupabaseError(error, 'getConversation', 'conversations')
    return { data: null, error: new Error(error.message) }
  }

  if (!data) {
    return { data: null, error: new Error('Conversation not found') }
  }

  // Cast the join result to proper type
  // Using unknown to bridge Supabase's inferred type with our expected type
  const conversationData = data as unknown as ConversationRow & { messages?: MessageRow[] }

  return {
    data: {
      ...conversationData,
      messages: conversationData.messages || [],
    },
    error: null,
  }
}

/**
 * Generate default conversation title
 * Returns null so the UI can display "Nueva conversación" and
 * the title can be updated later based on the first message
 */
function generateDefaultTitle(): null {
  return null
}

/**
 * Create a new conversation for a user
 * RLS policies ensure users can only create conversations for themselves
 */
export async function createConversation(
  userId: string,
  title?: string
): Promise<CreateConversationResult> {
  // Validate userId format
  if (!userId || !isValidUUID(userId)) {
    return { data: null, error: new Error('Invalid user ID format') }
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      title: title ?? generateDefaultTitle(),
    })
    .select()
    .single()

  if (error) {
    logSupabaseError(error, 'createConversation', 'conversations')
    return { data: null, error: new Error(error.message) }
  }

  return { data, error: null }
}

/**
 * Delete a conversation and all its messages (cascade delete handled by database)
 * RLS policies ensure users can only delete their own conversations
 */
export async function deleteConversation(id: string): Promise<DeleteResult> {
  // Validate conversation ID format
  if (!id || !isValidUUID(id)) {
    return { success: false, error: new Error('Invalid conversation ID format') }
  }

  const supabase = createClient()

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', id)

  if (error) {
    logSupabaseError(error, 'deleteConversation', 'conversations')
    return { success: false, error: new Error(error.message) }
  }

  return { success: true, error: null }
}

export interface UpdateTimestampResult {
  success: boolean
  error: Error | null
}

/**
 * Update the updated_at timestamp of a conversation
 * Called after new messages are added to keep conversation list sorted correctly
 * @param id - UUID of the conversation
 * @param client - Optional authenticated Supabase client (required for Edge runtime)
 */
export async function updateConversationTimestamp(
  id: string,
  client?: TypedSupabaseClient
): Promise<UpdateTimestampResult> {
  // Validate conversation ID format
  if (!id || !isValidUUID(id)) {
    return { success: false, error: new Error('Invalid conversation ID format') }
  }

  const supabase = client ?? createClient()

  const { error } = await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    logSupabaseError(error, 'updateConversationTimestamp', 'conversations')
    return { success: false, error: new Error(error.message) }
  }

  return { success: true, error: null }
}

/**
 * Update conversation title
 * Used to set a meaningful title after the first message
 * @param id - UUID of the conversation
 * @param title - New title for the conversation
 * @param client - Optional authenticated Supabase client (required for Edge runtime)
 */
export async function updateConversationTitle(
  id: string,
  title: string,
  client?: TypedSupabaseClient
): Promise<UpdateTimestampResult> {
  // Validate conversation ID format
  if (!id || !isValidUUID(id)) {
    return { success: false, error: new Error('Invalid conversation ID format') }
  }

  // Truncate title if too long
  const truncatedTitle = title.length > 100 ? title.slice(0, 97) + '...' : title

  const supabase = client ?? createClient()

  const { error } = await supabase
    .from('conversations')
    .update({ title: truncatedTitle })
    .eq('id', id)

  if (error) {
    logSupabaseError(error, 'updateConversationTitle', 'conversations')
    return { success: false, error: new Error(error.message) }
  }

  return { success: true, error: null }
}
