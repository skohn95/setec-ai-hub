import { createClient } from './client'
import type { Database } from '@/types/database'

// Type aliases for cleaner code
export type ConversationRow = Database['public']['Tables']['conversations']['Row']
export type MessageRow = Database['public']['Tables']['messages']['Row']

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
    return { data: null, error: new Error(error.message) }
  }

  if (!data) {
    return { data: null, error: new Error('Conversation not found') }
  }

  return {
    data: {
      ...data,
      messages: data.messages || [],
    },
    error: null,
  }
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
    return { success: false, error: new Error(error.message) }
  }

  return { success: true, error: null }
}
