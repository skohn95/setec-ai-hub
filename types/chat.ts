// Chat and conversation types

export type MessageRole = 'user' | 'assistant' | 'system'

// File status type matching database enum
export type FileStatus = 'pending' | 'validating' | 'valid' | 'invalid' | 'processed'

/**
 * File attached to a message, stored in Supabase Storage
 */
export interface MessageFile {
  id: string
  conversation_id: string
  message_id: string | null
  storage_path: string
  original_name: string
  mime_type: string
  size_bytes: number
  status: FileStatus
  validation_errors?: unknown | null
  validated_at?: string | null
  processed_at?: string | null
  created_at: string
}

/**
 * Result of a file upload operation
 */
export interface FileUploadResult {
  fileId: string | null
  storagePath: string | null
  error: string | null
}

export interface FileAttachment {
  id?: string
  name: string
  size: number
  type: string
  file?: File
}

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  metadata: MessageMetadata
  createdAt: Date
  files?: MessageFile[]
}

export interface MessageMetadata {
  analysisId?: string
  fileId?: string
  chartData?: unknown
  tokenUsage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface Conversation {
  id: string
  userId: string
  title: string | null
  createdAt: Date
  updatedAt: Date
  messages?: Message[]
}

export interface CreateMessageInput {
  conversationId: string
  role: MessageRole
  content: string
  metadata?: Partial<MessageMetadata>
}

export interface CreateConversationInput {
  title?: string
}

export interface UpdateConversationInput {
  title?: string
}
