/**
 * Utility functions for formatting MSA/Gauge R&R analysis results
 * Provides classification, formatting, and recommendation helpers
 */

import {
  GRR_THRESHOLDS,
  GRR_CLASSIFICATIONS,
  type GRRClassification,
} from '@/constants/analysis'

/**
 * Format a number as a percentage string with specified precision
 * @param value - The numeric value to format
 * @param precision - Number of decimal places (default: 1)
 * @returns Formatted string like "18.2%"
 */
export function formatPercentage(value: number, precision = 1): string {
  return `${value.toFixed(precision)}%`
}

/**
 * Format a metric number with specified precision
 * @param value - The numeric value to format
 * @param precision - Number of decimal places (default: 3)
 * @returns Formatted number string
 */
export function formatMetric(value: number, precision = 3): string {
  return value.toFixed(precision)
}

/**
 * Get the full classification object for a given GRR percentage
 * @param grr - The GRR percentage value
 * @returns Classification object with key, label, color, emoji, and description
 */
export function getClassification(grr: number): GRRClassification {
  if (grr < GRR_THRESHOLDS.ACCEPTABLE) {
    return GRR_CLASSIFICATIONS.ACCEPTABLE
  }
  if (grr <= GRR_THRESHOLDS.MARGINAL) {
    return GRR_CLASSIFICATIONS.MARGINAL
  }
  return GRR_CLASSIFICATIONS.UNACCEPTABLE
}

/**
 * Get the classification label text (in Spanish) for a GRR value
 * @param grr - The GRR percentage value
 * @returns Spanish classification label: "Aceptable", "Marginal", or "Inaceptable"
 */
export function getClassificationText(grr: number): string {
  return getClassification(grr).label
}

/**
 * Get the hex color code for a GRR classification
 * @param grr - The GRR percentage value
 * @returns Hex color code (e.g., "#10B981" for green)
 */
export function getClassificationColor(grr: number): string {
  return getClassification(grr).color
}

/**
 * Get the emoji indicator for a GRR classification
 * @param grr - The GRR percentage value
 * @returns Colored circle emoji: "🟢", "🟡", or "🔴"
 */
export function getClassificationEmoji(grr: number): string {
  return getClassification(grr).emoji
}

/**
 * Get actionable recommendations based on the dominant source of variation
 * @param dominant - Either 'repeatability', 'reproducibility', or 'part_to_part'
 * @returns Array of recommendation strings in Spanish
 */
export function getDominantVariationRecommendations(
  dominant: 'repeatability' | 'reproducibility' | 'part_to_part'
): string[] {
  if (dominant === 'repeatability') {
    return [
      'Verificar la calibración del equipo de medición',
      'Revisar el estado y mantenimiento del instrumento',
      'Considerar actualizar o reemplazar el equipo',
      'Estandarizar las condiciones ambientales de medición',
    ]
  }
  if (dominant === 'reproducibility') {
    return [
      'Estandarizar el procedimiento de medición entre operadores',
      'Proporcionar entrenamiento uniforme a todos los operadores',
      'Crear instrucciones visuales paso a paso',
      'Verificar que todos usen la misma técnica de posicionamiento',
    ]
  }
  // part_to_part dominant - this is the ideal case
  return [
    'El sistema de medición está funcionando correctamente',
    'Mantener el programa de calibración actual',
    'Documentar las buenas prácticas actuales',
    'Continuar con los procedimientos establecidos',
  ]
}
