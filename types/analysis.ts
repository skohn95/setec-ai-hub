// MSA Analysis types

export type AnalysisType = 'gage_rr' | 'bias' | 'linearity' | 'stability'

export type FileStatus = 'pending' | 'validating' | 'valid' | 'invalid' | 'processed'

export interface AnalysisFile {
  id: string
  conversationId: string
  messageId: string | null
  storagePath: string
  originalName: string
  mimeType: string
  sizeBytes: number
  status: FileStatus
  validationErrors: ValidationError[] | null
  validatedAt: Date | null
  processedAt: Date | null
  createdAt: Date
}

export interface ValidationError {
  row?: number
  column?: string
  message: string
  type: 'missing_column' | 'invalid_data' | 'format_error'
}

export interface AnalysisResult {
  id: string
  messageId: string
  fileId: string
  analysisType: AnalysisType
  results: GageRRResults | BiasResults | LinearityResults | StabilityResults
  chartData: ChartData
  instructions: string
  pythonVersion: string | null
  computedAt: Date
}

// Gage R&R specific results
export interface GageRRResults {
  repeatability: number
  reproducibility: number
  gageRR: number
  partToPartVariation: number
  totalVariation: number
  ndc: number // Number of Distinct Categories
  percentContribution: {
    repeatability: number
    reproducibility: number
    partToPart: number
  }
  acceptability: 'acceptable' | 'marginal' | 'unacceptable'
}

// Bias analysis results
export interface BiasResults {
  bias: number
  biasPercent: number
  referenceValue: number
  averageMeasured: number
  tStatistic: number
  pValue: number
  significant: boolean
}

// Linearity analysis results
export interface LinearityResults {
  slope: number
  intercept: number
  rSquared: number
  biasAtPoints: Array<{
    reference: number
    bias: number
    biasPercent: number
  }>
  linearityPercent: number
}

// Stability analysis results
export interface StabilityResults {
  mean: number
  stdDev: number
  ucl: number // Upper Control Limit
  lcl: number // Lower Control Limit
  outOfControlPoints: number[]
  stable: boolean
}

// Chart data for Recharts
export interface ChartData {
  type: 'bar' | 'line' | 'scatter' | 'control_chart'
  title: string
  xAxis: {
    label: string
    key: string
  }
  yAxis: {
    label: string
    key: string
  }
  data: Array<Record<string, unknown>>
  referenceLines?: Array<{
    y: number
    label: string
    color: string
  }>
}

export interface TokenUsage {
  id: string
  conversationId: string
  messageId: string | null
  model: string
  promptTokens: number
  completionTokens: number
  totalTokens: number
  estimatedCostUsd: number | null
  createdAt: Date
}
