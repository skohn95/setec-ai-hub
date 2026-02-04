// Chat and conversation types

export type MessageRole = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  metadata: MessageMetadata
  createdAt: Date
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
