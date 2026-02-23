// MSA Analysis types

export type AnalysisType = 'gage_rr' | 'bias' | 'linearity' | 'stability' | 'capacidad_proceso'

// FileStatus is imported from chat.ts (exported from there)
import type { FileStatus } from './chat'

export interface AnalysisFile {
  id: string
  conversationId: string
  messageId: string | null
  storagePath: string
  originalName: string
  mimeType: string
  sizeBytes: number
  status: FileStatus
  validationErrors: FileValidationError[] | null
  validatedAt: Date | null
  processedAt: Date | null
  createdAt: Date
}

export interface FileValidationError {
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
  results: GageRRResults | BiasResults | LinearityResults | StabilityResults | CapacidadProcesoResult
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

// Capacidad de Proceso (Process Capability) types
export interface CapacidadProcesoBasicStats {
  mean: number
  median: number
  mode: number | number[] | null
  std_dev: number
  min: number
  max: number
  range: number
  count: number
}

// Story 7.2: Normality Testing types
export interface NormalityTestResult {
  is_normal: boolean
  ad_statistic: number
  p_value: number
  conclusion: 'Normal' | 'No Normal'
}

export interface TransformationResult {
  applied: boolean
  type: 'box_cox' | 'johnson' | null
  lambda?: number
  shift?: number | null
  family?: string
  params?: Record<string, number>
  normalized_after: boolean
}

export interface DistributionFitResult {
  name: string
  params: Record<string, number>
  ad_statistic: number
  aic: number
}

export interface PPMResult {
  ppm_below_lei: number
  ppm_above_les: number
  ppm_total: number
}

export interface NormalityAnalysis extends NormalityTestResult {
  transformation?: TransformationResult | null
  fitted_distribution?: DistributionFitResult | null
  ppm?: PPMResult | null
}

// Story 7.3: Stability Analysis types
export interface IChartLimits {
  center: number  // X̄ - Center line
  ucl: number     // Upper Control Limit
  lcl: number     // Lower Control Limit
  mr_bar: number  // Mean of moving ranges
}

export interface MRChartLimits {
  center: number  // MR̄ - Center line
  ucl: number     // Upper Control Limit
  lcl: number     // Always 0 for MR chart
}

export interface OutOfControlPoint {
  index: number       // 0-based index in data array (API returns 0-indexed; markdown instructions show 1-indexed for user readability)
  value: number       // The actual value
  limit?: 'UCL' | 'LCL'  // Which limit was violated (I-Chart only)
}

export interface StabilityRuleResult {
  cumple: boolean  // CUMPLE (true) or NO CUMPLE (false)
  violations: Array<{
    start?: number    // 0-based start index (API returns 0-indexed)
    end?: number      // 0-based end index (API returns 0-indexed)
    index?: number    // 0-based index (API returns 0-indexed)
    value?: number
    direction?: 'up' | 'down'
    side?: 'above' | 'below'
    limit?: 'UCL' | 'LCL'
    pattern?: string
  }>
}

export interface StabilityAnalysisResult {
  is_stable: boolean
  conclusion: 'Proceso Estable' | 'Proceso Inestable'
  i_chart: IChartLimits & { ooc_points: OutOfControlPoint[] }
  mr_chart: MRChartLimits & { ooc_points: OutOfControlPoint[] }
  rules: {
    rule_1: StabilityRuleResult
    rule_2: StabilityRuleResult
    rule_3: StabilityRuleResult
    rule_4: StabilityRuleResult
    rule_5: StabilityRuleResult
    rule_6: StabilityRuleResult
    rule_7: StabilityRuleResult
  }
  sigma: number  // Within-subgroup std dev (MR̄/d2)
}

// Story 7.4: Capability Indices types
export interface CapabilityIndices {
  cp: number | null
  cpk: number | null
  pp: number | null
  ppk: number | null
  cpu: number | null   // Upper capability (short-term)
  cpl: number | null   // Lower capability (short-term)
  ppu: number | null   // Upper performance (long-term)
  ppl: number | null   // Lower performance (long-term)
}

export interface CapabilityClassification {
  classification: 'Excelente' | 'Capaz' | 'Marginalmente Capaz' | 'No Capaz' | 'Muy Deficiente' | 'No Calculable'
  color: 'green' | 'yellow' | 'red' | 'gray'
  level: 'excellent' | 'adequate' | 'marginal' | 'inadequate' | 'poor' | 'unknown'
}

export interface PPMBreakdown {
  ppm_below_lei: number
  ppm_above_les: number
  ppm_total: number
}

/**
 * Capability Analysis Result
 *
 * API Response Structure:
 * - When valid=true: All fields are present with calculated values
 * - When valid=false: Only valid, errors, and null indices are returned
 *
 * The API always returns `valid` field to indicate calculation success.
 */
export interface CapabilityAnalysisResult {
  /** Always present - indicates if calculation was successful */
  valid: boolean
  /** Present when valid=false - Spanish error messages */
  errors?: string[]
  /** Cp index - null if sigma_within is zero or invalid */
  cp: number | null
  /** Cpk index - null if sigma_within is zero or invalid */
  cpk: number | null
  /** Pp index - null if sigma_overall is zero */
  pp: number | null
  /** Ppk index - null if sigma_overall is zero */
  ppk: number | null
  /** Upper capability (short-term) - null if sigma_within is zero */
  cpu: number | null
  /** Lower capability (short-term) - null if sigma_within is zero */
  cpl: number | null
  /** Upper performance (long-term) - null if sigma_overall is zero */
  ppu: number | null
  /** Lower performance (long-term) - null if sigma_overall is zero */
  ppl: number | null
  /** Within-subgroup std dev from MR̄/d2 - only present when valid=true */
  sigma_within?: number
  /** Overall sample std dev (ddof=1) - only present when valid=true */
  sigma_overall?: number
  /** Lower specification limit - only present when valid=true */
  lei?: number
  /** Upper specification limit - only present when valid=true */
  les?: number
  /** Process mean - only present when valid=true */
  mean?: number
  /** Cpk classification with color and level - only present when valid=true */
  cpk_classification?: CapabilityClassification
  /** Ppk classification with color and level - only present when valid=true */
  ppk_classification?: CapabilityClassification
  /** PPM breakdown - only present when valid=true */
  ppm?: PPMBreakdown
  /** Calculation method used - only present when valid=true */
  method?: 'normal' | 'non_normal'
  /** Non-normal calculation details - only present when method='non_normal' */
  non_normal?: NonNormalCapabilityResult
}

export interface NonNormalCapabilityResult {
  method: 'non_normal'
  distribution?: string
  pp?: number | null
  ppk?: number | null
  percentiles?: {
    p0_135: number
    p50: number
    p99_865: number
  }
  ppm?: PPMBreakdown
  ppk_classification?: CapabilityClassification
}

export interface CapacidadProcesoResult {
  basic_statistics: CapacidadProcesoBasicStats
  normality?: NormalityAnalysis
  stability?: StabilityAnalysisResult  // Story 7.3
  capability?: CapabilityAnalysisResult  // Story 7.4
  sample_size: number
  warnings: string[]
}

// Note: SpecLimits is defined in api.ts and re-exported from index.ts

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

// =============================================================================
// Story 8.1: Capacidad de Proceso Chart Data Types
// =============================================================================

/**
 * Fitted distribution curve data for histogram overlay
 */
export interface FittedDistributionCurve {
  name: string
  params: Record<string, number>
}

/**
 * Histogram chart data for Capacidad de Proceso visualization
 */
export interface HistogramChartData {
  type: 'histogram'
  data: {
    values: number[]
    lei: number
    les: number
    mean: number
    std: number
    lcl: number | null
    ucl: number | null
    fitted_distribution: FittedDistributionCurve | null
  }
}

/**
 * I-Chart (Individual Values Control Chart) data
 */
export interface IChartData {
  type: 'i_chart'
  data: {
    values: number[]
    center: number
    ucl: number
    lcl: number
    ooc_points: OutOfControlPoint[]
    rules_violations: RuleViolation[]
  }
}

/**
 * Rule violation data for I-Chart instability indicators
 */
export interface RuleViolation {
  rule: string
  start_index?: number | null
  end_index?: number | null
  index?: number | null
  direction?: 'up' | 'down' | null
  side?: 'above' | 'below' | null
  limit?: 'UCL' | 'LCL' | null
}

/**
 * Chart point data for I-Chart visualization
 */
export interface ChartPoint {
  index: number
  value: number
  isOOC: boolean
  limit?: 'UCL' | 'LCL'
}

// =============================================================================
// Story 8.2: MR-Chart and Normality Plot Types
// =============================================================================

/**
 * MR-Chart (Moving Range Control Chart) data
 */
export interface MRChartData {
  type: 'mr_chart'
  data: {
    values: number[]         // Moving range values (n-1 points for n observations)
    center: number           // MR̄ (mean of moving ranges)
    ucl: number              // Upper control limit (3.267 × MR̄)
    lcl: number              // Lower control limit (always 0)
    ooc_points: OutOfControlPoint[]  // Points exceeding UCL
  }
}

/**
 * Normality Plot point data (Q-Q plot)
 */
export interface NormalityPlotPoint {
  actual: number             // Actual (observed) sorted value
  expected: number           // Expected normal quantile (z-score)
  index: number              // Point index (0-based)
}

/**
 * Fit line for normality plot
 */
export interface FitLine {
  slope: number              // Regression slope (≈ σ for normal data)
  intercept: number          // Regression intercept (≈ μ for normal data)
}

/**
 * Confidence bands for normality plot
 */
export interface ConfidenceBands {
  lower: number[]            // Lower 95% confidence band values
  upper: number[]            // Upper 95% confidence band values
}

/**
 * Anderson-Darling test result for normality plot annotation
 */
export interface AndersonDarlingResult {
  statistic: number          // A² statistic value
  p_value: number            // p-value for the test
  is_normal: boolean         // true if p_value >= 0.05
}

/**
 * Normality Plot (Q-Q Probability Plot) data
 */
export interface NormalityPlotData {
  type: 'normality_plot'
  data: {
    points: NormalityPlotPoint[]
    fit_line: FitLine
    confidence_bands: ConfidenceBands
    anderson_darling: AndersonDarlingResult
  }
}

/**
 * Union type for Capacidad de Proceso chart data items
 */
export type CapacidadProcesoChartDataItem =
  | HistogramChartData
  | IChartData
  | MRChartData
  | NormalityPlotData

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
