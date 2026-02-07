'use client'

import { cn } from '@/lib/utils'
import type { MSAResults } from '@/types/api'

interface ResultsDisplayProps {
  results: MSAResults
  className?: string
}

/**
 * Classification styling configuration
 */
const classificationStyles = {
  aceptable: {
    badge: 'bg-green-100 text-green-800 border-green-300',
    label: 'Aceptable',
    emoji: '🟢',
  },
  marginal: {
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    label: 'Marginal',
    emoji: '🟡',
  },
  inaceptable: {
    badge: 'bg-red-100 text-red-800 border-red-300',
    label: 'Inaceptable',
    emoji: '🔴',
  },
} as const

/**
 * Format a number as a percentage with one decimal
 */
function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

/**
 * ResultsDisplay component shows key MSA analysis metrics
 * with a visual classification indicator (colored badge)
 */
export default function ResultsDisplay({ results, className }: ResultsDisplayProps) {
  // Validate classification value, fallback to 'marginal' if invalid or missing
  const classification = (results.classification && results.classification in classificationStyles)
    ? results.classification
    : 'marginal'
  const style = classificationStyles[classification]

  return (
    <div
      data-testid="results-display"
      className={cn(
        'rounded-lg border bg-card p-4 space-y-3',
        className
      )}
    >
      {/* Classification Badge */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Clasificación del Sistema
        </span>
        <span
          data-testid="classification-badge"
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border',
            style.badge
          )}
        >
          <span>{style.emoji}</span>
          <span>{style.label}</span>
        </span>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* GRR Total - Most important metric */}
        <div className="col-span-2 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">%GRR Total</span>
            <span className="text-2xl font-bold">
              {formatPercent(results.grr_percent)}
            </span>
          </div>
        </div>

        {/* Repeatability */}
        <div className="p-2 rounded bg-muted/30">
          <div className="text-xs text-muted-foreground">Repetibilidad</div>
          <div className="text-sm font-semibold">
            {formatPercent(results.repeatability_percent)}
          </div>
        </div>

        {/* Reproducibility */}
        <div className="p-2 rounded bg-muted/30">
          <div className="text-xs text-muted-foreground">Reproducibilidad</div>
          <div className="text-sm font-semibold">
            {formatPercent(results.reproducibility_percent)}
          </div>
        </div>

        {/* Part-to-Part */}
        <div className="p-2 rounded bg-muted/30">
          <div className="text-xs text-muted-foreground">Parte a Parte</div>
          <div className="text-sm font-semibold">
            {formatPercent(results.part_to_part_percent)}
          </div>
        </div>

        {/* ndc */}
        <div className="p-2 rounded bg-muted/30">
          <div className="text-xs text-muted-foreground">ndc</div>
          <div className="text-sm font-semibold">{results.ndc}</div>
        </div>
      </div>
    </div>
  )
}
