// Analysis types (MSA, Capacidad de Proceso, Hipotesis 2 Muestras, Tamaño de Muestra)

export type AnalysisType = 'gage_rr' | 'capacidad_proceso' | 'hipotesis_2_muestras' | 'tamano_muestra'

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
  fileId: string | null
  analysisType: AnalysisType
  results: GageRRResults | CapacidadProcesoResult | Hipotesis2MuestrasResult | TamanoMuestraResult
  chartData: ChartData[] | CapacidadProcesoChartDataItem[] | Hipotesis2MChartDataItem[]
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
    fitted_distribution: FittedDistributionCurve | null
  }
}

// =============================================================================
// Story 8.2: Normality Plot Types
// =============================================================================

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
  | NormalityPlotData

// ============================================
// Hipotesis 2 Muestras Types
// ============================================

export interface Hipotesis2MuestrasOutliers {
  q1: number
  q3: number
  iqr: number
  lower_fence: number
  upper_fence: number
  outlier_count: number
  outlier_values: number[]
  outlier_percentage: number
}

export interface Hipotesis2MuestrasDescriptive {
  sample_name: string
  n: number
  mean: number
  median: number
  std_dev: number
  skewness: number
  outliers: Hipotesis2MuestrasOutliers
}

export interface Hipotesis2MuestrasSampleSizeEntry {
  n: number
  tcl_applies: boolean
  small_sample_warning: boolean
  note: string
}

export interface Hipotesis2MuestrasSampleSize {
  a: Hipotesis2MuestrasSampleSizeEntry
  b: Hipotesis2MuestrasSampleSizeEntry
}

export interface Hipotesis2MuestrasNormality {
  is_normal: boolean
  ad_statistic: number
  p_value: number
  alpha: number
  is_robust: boolean | null
  robustness_details: string | null
}

export interface Hipotesis2MuestrasBoxCox {
  applied: boolean
  lambda_a: number | null
  lambda_b: number | null
  normality_improved: boolean | null
  using_transformed_data: boolean
  warning: string | null
}

export interface Hipotesis2MuestrasVarianceTest {
  method: string
  f_statistic: number
  p_value: number
  df1: number
  df2: number
  alpha: number
  equal_variances: boolean
  conclusion: string
}

export interface Hipotesis2MuestrasMeansTest {
  method: string
  t_statistic: number
  degrees_of_freedom: number
  p_value: number
  ci_lower: number | null
  ci_upper: number | null
  difference: number
  alpha: number
  confidence_level: number
  alternative_hypothesis: 'two-sided' | 'greater' | 'less'
  equal_variances: boolean
  conclusion: string
}

export interface Hipotesis2MuestrasResult {
  descriptive_a: Hipotesis2MuestrasDescriptive
  descriptive_b: Hipotesis2MuestrasDescriptive
  sample_size: Hipotesis2MuestrasSampleSize
  normality_a: Hipotesis2MuestrasNormality
  normality_b: Hipotesis2MuestrasNormality
  box_cox: Hipotesis2MuestrasBoxCox
  variance_test: Hipotesis2MuestrasVarianceTest
  means_test: Hipotesis2MuestrasMeansTest
  warnings: string[]
}

// Chart Data Types for Hipotesis 2 Muestras

export interface Hipotesis2MHistogramBin {
  start: number
  end: number
  count: number
}

export interface Hipotesis2MHistogramData {
  type: 'histogram_a' | 'histogram_b'
  data: {
    bins: Hipotesis2MHistogramBin[]
    mean: number
    sampleName: string
    outliers: number[]
  }
}

export interface Hipotesis2MBoxplotSample {
  name: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
  outliers: number[]
  mean: number
}

export interface Hipotesis2MBoxplotMeansSample extends Hipotesis2MBoxplotSample {
  ciLower: number
  ciUpper: number
}

export interface Hipotesis2MBoxplotVarianceData {
  type: 'boxplot_variance'
  data: {
    samples: [Hipotesis2MBoxplotSample, Hipotesis2MBoxplotSample]
    leveneTestPValue: number
    leveneConclusion: string
  }
}

export interface Hipotesis2MBoxplotMeansData {
  type: 'boxplot_means'
  data: {
    samples: [Hipotesis2MBoxplotMeansSample, Hipotesis2MBoxplotMeansSample]
    tTestPValue: number
    tTestConclusion: string
  }
}

export type Hipotesis2MChartDataItem =
  | Hipotesis2MHistogramData
  | Hipotesis2MBoxplotVarianceData
  | Hipotesis2MBoxplotMeansData

// ============================================
// Tamaño de Muestra Types
// ============================================

export interface TamanoMuestraResult {
  input_parameters: {
    current_mean: number | null
    expected_mean: number | null
    delta: number
    sigma: number
    alpha: number
    power: number
    alternative_hypothesis: 'two-sided' | 'greater' | 'less'
  }
  sample_size: {
    n_per_group: number
    z_alpha: number
    z_beta: number
    formula_used: 'bilateral' | 'unilateral'
  }
  classification: {
    category: 'adequate' | 'verify_normality' | 'weak'
    message: string
  }
  sensitivity: Array<{
    scenario: string
    label: string
    parameters: {
      delta: number
      sigma: number
      alpha: number
      power: number
    }
    n_per_group: number
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
