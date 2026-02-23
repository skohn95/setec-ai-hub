/**
 * Constants for MSA/Gauge R&R analysis classification thresholds
 * Based on AIAG (Automotive Industry Action Group) guidelines
 */

/**
 * GRR percentage thresholds for classification
 * - Values below ACCEPTABLE are considered acceptable
 * - Values between ACCEPTABLE and MARGINAL are marginal
 * - Values above MARGINAL are unacceptable
 */
export const GRR_THRESHOLDS = {
  ACCEPTABLE: 10,  // <10% is acceptable
  MARGINAL: 30,    // 10-30% is marginal, >30% is unacceptable
} as const

/**
 * Classification metadata including labels, colors, and descriptions
 * All labels are in Spanish for consistency with the application
 */
export const GRR_CLASSIFICATIONS = {
  ACCEPTABLE: {
    key: 'acceptable',
    label: 'Aceptable',
    color: '#10B981',  // green-500
    emoji: '🟢',
    description: 'El sistema de medición es confiable para el proceso',
  },
  MARGINAL: {
    key: 'marginal',
    label: 'Marginal',
    color: '#F59E0B',  // amber-500
    emoji: '🟡',
    description: 'Usar con precaución, considerar mejoras',
  },
  UNACCEPTABLE: {
    key: 'unacceptable',
    label: 'Inaceptable',
    color: '#EF4444',  // red-500
    emoji: '🔴',
    description: 'El sistema necesita mejoras antes de usarse para decisiones',
  },
} as const

export type GRRClassificationKey = 'acceptable' | 'marginal' | 'unacceptable'
export type GRRClassification = typeof GRR_CLASSIFICATIONS[keyof typeof GRR_CLASSIFICATIONS]

/**
 * Chart color constants for consistent styling across chart components
 */
export const CHART_COLORS = {
  DEFAULT_BAR: '#3B82F6',       // blue-500 - standard bar color
  HIGHLIGHT_BAR: '#EF4444',     // red-500 - highlighted/warning bar color
  EQUIPMENT: '#3B82F6',         // blue-500 - repeatability/equipment variation
  OPERATOR: '#F97316',          // orange-500 - reproducibility/operator variation
  PART: '#10B981',              // green-500 - part-to-part variation
} as const

/**
 * Supported analysis types
 */
export const ANALYSIS_TYPES = {
  MSA: 'msa',
  CAPACIDAD_PROCESO: 'capacidad_proceso',
} as const

export type AnalysisTypeValue = typeof ANALYSIS_TYPES[keyof typeof ANALYSIS_TYPES]

/**
 * Story 7.4: Capability Indices Thresholds
 * Based on industry standards (AIAG, Six Sigma)
 */
export const CAPABILITY_THRESHOLDS = {
  EXCELLENT: 1.67,    // Cpk >= 1.67: Excellent capability
  ADEQUATE: 1.33,     // 1.33 <= Cpk < 1.67: Adequate/capable
  MARGINAL: 1.00,     // 1.00 <= Cpk < 1.33: Marginal
  INADEQUATE: 0.67,   // 0.67 <= Cpk < 1.00: Inadequate/not capable
  // < 0.67: Very deficient
} as const

/**
 * d2 constant for n=2 moving range (AIAG SPC Manual)
 * Used to estimate sigma_within from MR̄: σ = MR̄ / d2
 */
export const D2_CONSTANT = 1.128

/**
 * Capability classification metadata
 * All labels in Spanish for consistency
 */
export const CAPABILITY_CLASSIFICATIONS = {
  EXCELLENT: {
    key: 'excellent',
    label: 'Excelente',
    color: '#10B981',  // green-500
    emoji: '🟢',
    description: 'El proceso supera ampliamente los requisitos de capacidad',
  },
  ADEQUATE: {
    key: 'adequate',
    label: 'Capaz',
    color: '#10B981',  // green-500
    emoji: '🟢',
    description: 'El proceso cumple con los requisitos de capacidad',
  },
  MARGINAL: {
    key: 'marginal',
    label: 'Marginalmente Capaz',
    color: '#F59E0B',  // amber-500
    emoji: '🟡',
    description: 'El proceso apenas cumple los requisitos mínimos',
  },
  INADEQUATE: {
    key: 'inadequate',
    label: 'No Capaz',
    color: '#EF4444',  // red-500
    emoji: '🔴',
    description: 'El proceso no cumple con los requisitos de capacidad',
  },
  POOR: {
    key: 'poor',
    label: 'Muy Deficiente',
    color: '#EF4444',  // red-500
    emoji: '🔴',
    description: 'El proceso requiere acción inmediata',
  },
} as const

export type CapabilityClassificationKey = 'excellent' | 'adequate' | 'marginal' | 'inadequate' | 'poor'
export type CapabilityClassification = typeof CAPABILITY_CLASSIFICATIONS[keyof typeof CAPABILITY_CLASSIFICATIONS]
