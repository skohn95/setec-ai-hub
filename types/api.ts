// API Response types
// All API routes MUST return this structure

export interface ApiResponse<T = unknown> {
  data: T | null
  error: ApiError | null
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

// Common error codes
export const ERROR_CODES = {
  // Authentication
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  INVALID_FILE: 'INVALID_FILE',

  // Resources
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Analysis
  ANALYSIS_FAILED: 'ANALYSIS_FAILED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',

  // OpenAI specific
  OPENAI_UNAVAILABLE: 'OPENAI_UNAVAILABLE',
  OPENAI_RATE_LIMIT: 'OPENAI_RATE_LIMIT',
  OPENAI_TIMEOUT: 'OPENAI_TIMEOUT',

  // Network
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

// Chat API Types
export interface ChatRequest {
  conversationId: string
  content: string
}

// Import Json type from database for type compatibility
import type { Json } from './database'

// Message shape as returned by API (matches MessageRow from Supabase)
export interface ChatMessage {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: Json
  created_at: string
}

export interface ChatResponseData {
  userMessage: ChatMessage
  assistantMessage: ChatMessage
  filtered: boolean
}

export interface ChatResponse {
  data: ChatResponseData | null
  error: ApiError | null
}

export interface FilterResult {
  allowed: boolean
}

// Streaming types for SSE responses
export interface StreamChunk {
  type: 'text' | 'error' | 'done'
  content?: string
}

export type StreamState = 'idle' | 'streaming' | 'complete' | 'error'

// Tool call SSE event types (Story 4.4)
export type SSEEventType = 'text' | 'done' | 'error' | 'tool_call' | 'tool_result'

export type ToolCallStatus = 'processing' | 'complete' | 'error'

export interface SSEToolCallEvent {
  type: 'tool_call'
  name: string
  status: ToolCallStatus
}

export interface ValidationError {
  row?: number
  column?: string
  message: string
}

export interface ToolResultData {
  results: Record<string, unknown>
  chartData: ChartDataItem[]
  instructions: string
}

export interface ChartDataItem {
  type: string
  data: unknown[]
}

// Specific chart data types for better type safety (Story 5.2)
export interface VariationBreakdownDataItem {
  source: string
  percentage: number
  color: string
}

export interface OperatorComparisonDataItem {
  operator: string
  mean: number
  stdDev: number
}

export interface VariationChartDataItem {
  operator: string
  variation: number
  color?: string
}

export interface SSEToolResultEvent {
  type: 'tool_result'
  data: ToolResultData | null
  error?: {
    code: string
    message: string
    details?: ValidationError[]
  }
}

// Union type for all SSE events
export type SSEEvent = StreamChunk | SSEToolCallEvent | SSEToolResultEvent

// MSA Analysis Results type (Story 5.1)
// Used for displaying analysis results in chat messages
export interface MSAResults {
  grr_percent: number
  repeatability_percent: number
  reproducibility_percent: number
  part_to_part_percent: number
  ndc: number
  classification: 'aceptable' | 'marginal' | 'inaceptable'
}

// Dominant variation source from MSA analysis
export type DominantVariation = 'repeatability' | 'reproducibility' | 'part_to_part'
