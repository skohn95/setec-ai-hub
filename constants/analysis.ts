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
