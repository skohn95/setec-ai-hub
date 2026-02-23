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

// Static chart data item (server-rendered PNG images)
export interface StaticChartDataItem {
  type: string
  image: string  // base64 data URL
}

// Chart type names for display
export const CHART_TYPE_LABELS: Record<string, string> = {
  variationBreakdown: 'Desglose de Variación',
  operatorComparison: 'Comparación de Operadores',
  rChartByOperator: 'Gráfico R por Operador',
  xBarChartByOperator: 'Gráfico X̄ por Operador',
  measurementsByPart: 'Mediciones por Parte',
  measurementsByOperator: 'Mediciones por Operador',
  interactionPlot: 'Gráfico de Interacción',
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

// Bias/specification information
export interface BiasInfo {
  specification: number
  grand_mean: number
  bias: number
  bias_percent: number
  rep_means?: number[]
}

// Specification limits for capacidad_proceso analysis
export interface SpecLimits {
  lei: number  // Lower Specification Limit (Límite de Especificación Inferior)
  les: number  // Upper Specification Limit (Límite de Especificación Superior)
}

// MSA Analysis Results type (Story 5.1)
// Used for displaying analysis results in chat messages
export interface MSAResults {
  grr_percent: number
  repeatability_percent: number
  reproducibility_percent: number
  part_to_part_percent: number
  ndc: number
  classification: 'aceptable' | 'marginal' | 'inaceptable'
  // Enhanced fields
  anova_table?: ANOVARow[]
  study_info?: StudyInfo
  variance_contributions?: VarianceContribution[]
  operator_stats?: OperatorStats[]
  variance_operator?: number
  variance_interaction?: number
  bias_info?: BiasInfo
}

// ANOVA table row
export interface ANOVARow {
  source: string
  df: number
  ss: number
  ms: number | null
  f_value: number | null
  p_value: number | null
}

// Study design information
export interface StudyInfo {
  n_operators: number
  n_parts: number
  n_trials: number
  n_total: number
}

// Variance contribution breakdown
export interface VarianceContribution {
  source: string
  variance: number
  pct_contribution: number
  pct_study_variation: number
  std_dev: number
}

// Operator statistics with ranking
export interface OperatorStats {
  operator: string
  mean: number
  std_dev: number
  range_avg: number
  consistency_score: number
  rank: number
}

// Dominant variation source from MSA analysis
export type DominantVariation = 'repeatability' | 'reproducibility' | 'part_to_part'

// Chart data types for new MSA charts
export interface RChartPoint {
  operator: string
  part: string
  range: number
}

export interface RChartData {
  points: RChartPoint[]
  rBar: number
  uclR: number
  lclR: number
}

export interface XBarChartPoint {
  operator: string
  part: string
  mean: number
}

export interface XBarChartData {
  points: XBarChartPoint[]
  xDoubleBar: number
  uclXBar: number
  lclXBar: number
}

export interface MeasurementsByPartItem {
  part: string
  measurements: number[]
  mean: number
  min: number
  max: number
}

export interface MeasurementsByOperatorItem {
  operator: string
  measurements: number[]
  mean: number
  min: number
  max: number
}

export interface OperatorPartMeans {
  operator: string
  partMeans: Record<string, number>
}

export interface InteractionPlotData {
  operators: OperatorPartMeans[]
  parts: string[]
}

// =============================================================================
// Story 8.1: Capacidad de Proceso Chart Data Types (re-exported from analysis.ts)
// =============================================================================

// Import from analysis.ts for use in API context
export type {
  HistogramChartData,
  IChartData,
  FittedDistributionCurve,
  RuleViolation,
  ChartPoint,
  CapacidadProcesoChartDataItem,
} from './analysis'
