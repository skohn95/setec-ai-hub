'use client'

import { useRef, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ErrorBar,
} from 'recharts'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type {
  ChartDataItem,
  VariationBreakdownDataItem,
  OperatorComparisonDataItem,
} from '@/types/api'
import { getClassification } from '@/lib/utils/results-formatting'
import { GRR_THRESHOLDS, GRR_CLASSIFICATIONS } from '@/constants/analysis'
import { toast } from 'sonner'
import { exportChartToPng, generateExportFilename, ChartExportError } from '@/lib/utils/download-utils'

interface GaugeRRChartProps {
  data: ChartDataItem[]
}

// Re-export types for external use (using imported types from @/types/api)
export type { VariationBreakdownDataItem, OperatorComparisonDataItem }

/**
 * GRR Classification Badge component
 * Displays the total GRR value with classification color and label
 */
function GRRClassificationBadge({ grrTotal }: { grrTotal: number }) {
  const classification = getClassification(grrTotal)

  return (
    <div
      data-testid="grr-classification-badge"
      className="flex items-center gap-2 mt-3 p-2 rounded-md bg-muted/50 border"
    >
      <div
        data-testid="classification-color"
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: classification.color }}
      />
      <span className="text-sm font-medium">
        GRR Total: {grrTotal.toFixed(1)}% - {classification.label}
      </span>
    </div>
  )
}

/**
 * Threshold Legend component
 * Shows classification thresholds explanation
 */
function ThresholdLegend() {
  return (
    <div
      data-testid="threshold-legend"
      className="flex flex-wrap gap-4 text-xs text-muted-foreground mt-2 mb-3"
    >
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GRR_CLASSIFICATIONS.ACCEPTABLE.color }} />
        <span>&lt;10% Aceptable</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GRR_CLASSIFICATIONS.MARGINAL.color }} />
        <span>10-30% Marginal</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GRR_CLASSIFICATIONS.UNACCEPTABLE.color }} />
        <span>&gt;30% Inaceptable</span>
      </div>
    </div>
  )
}

/**
 * Render variation breakdown horizontal bar chart
 * Includes reference lines at 10% and 30% thresholds and GRR classification badge
 */
function VariationBreakdownChart({ data }: { data: VariationBreakdownDataItem[] }) {
  // Separate GRR Total from other variation sources
  const grrTotalItem = data.find((item) => item.source === 'GRR Total')
  const variationItems = data.filter((item) => item.source !== 'GRR Total')

  return (
    <div data-testid="variation-breakdown-chart" className="mb-6">
      <h4 className="text-sm font-medium mb-3 text-foreground">Desglose de Variación</h4>
      <ThresholdLegend />
      <div className="space-y-2 relative">
        {/* Reference lines at 10% and 30% thresholds - positioned relative to bar container */}
        {/* These are positioned using the bar area offset: label(7rem) + gap(0.75rem) = ~7.75rem start */}
        <div
          data-testid="reference-line-10"
          className="absolute top-0 bottom-0 border-l-2 border-dashed z-10 pointer-events-none"
          style={{
            left: `calc(7rem + 0.75rem + (100% - 7rem - 0.75rem - 3rem) * ${GRR_THRESHOLDS.ACCEPTABLE} / 100)`,
            borderColor: GRR_CLASSIFICATIONS.ACCEPTABLE.color,
          }}
        />
        <div
          data-testid="reference-line-30"
          className="absolute top-0 bottom-0 border-l-2 border-dashed z-10 pointer-events-none"
          style={{
            left: `calc(7rem + 0.75rem + (100% - 7rem - 0.75rem - 3rem) * ${GRR_THRESHOLDS.MARGINAL} / 100)`,
            borderColor: GRR_CLASSIFICATIONS.UNACCEPTABLE.color,
          }}
        />

        {variationItems.map((item) => (
          <div key={item.source} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-28 shrink-0">{item.source}</span>
            <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
              {/* Progress bar */}
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(item.percentage, 100)}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
            <span className="text-xs font-medium w-12 text-right">{item.percentage.toFixed(1)}%</span>
          </div>
        ))}
      </div>

      {/* GRR Classification Badge */}
      {grrTotalItem && <GRRClassificationBadge grrTotal={grrTotalItem.percentage} />}
    </div>
  )
}

/**
 * Render operator comparison bar chart
 */
function OperatorComparisonChart({ data }: { data: OperatorComparisonDataItem[] }) {
  // Transform data to include error bars
  const chartData = data.map((item) => ({
    ...item,
    errorLow: item.stdDev,
    errorHigh: item.stdDev,
  }))

  return (
    <div data-testid="operator-comparison-chart" className="mb-4">
      <h4 className="text-sm font-medium mb-3 text-foreground">Comparación de Operadores</h4>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="operator"
            tick={{ fontSize: 12 }}
            className="fill-muted-foreground"
            label={{ value: 'Operador', position: 'insideBottom', offset: -20, fontSize: 11 }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            className="fill-muted-foreground"
            domain={['dataMin - 0.5', 'dataMax + 0.5']}
            tickFormatter={(value: number) => value.toFixed(2)}
            label={{ value: 'Media', angle: -90, position: 'insideLeft', offset: 5, fontSize: 11 }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload[0]) return null
              const data = payload[0].payload
              return (
                <div style={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  fontSize: '12px',
                  padding: '8px 12px',
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>Operador: {label}</div>
                  <div>Media: {typeof data.mean === 'number' ? data.mean.toFixed(4) : '0.0000'}</div>
                  <div>Desv. Std: {typeof data.stdDev === 'number' ? data.stdDev.toFixed(4) : '0.0000'}</div>
                </div>
              )
            }}
          />
          <Bar dataKey="mean" fill="#3B82F6" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill="#3B82F6" />
            ))}
            <ErrorBar dataKey="errorHigh" width={8} strokeWidth={2} stroke="#EF4444" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-2">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-[#3B82F6]" />
          <span>Media</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-[#EF4444]" />
          <span>±1 Desv. Std.</span>
        </div>
      </div>
    </div>
  )
}

/**
 * GaugeRRChart component renders MSA analysis charts
 * Supports two chart types:
 * - variationBreakdown: Horizontal bars showing variation sources
 * - operatorComparison: Bar chart comparing operator means with error bars
 */
export default function GaugeRRChart({ data }: GaugeRRChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  if (!data || data.length === 0) {
    return null
  }

  const variationData = data.find((d) => d.type === 'variationBreakdown')
  const operatorData = data.find((d) => d.type === 'operatorComparison')

  // If no recognized chart types, render nothing
  if (!variationData && !operatorData) {
    return null
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const filename = generateExportFilename('msa')
      await exportChartToPng(chartRef, filename)
      toast.success('Gráfico exportado correctamente')
    } catch (error) {
      console.error('Chart export failed:', error)
      const message = error instanceof ChartExportError
        ? 'Error al exportar el gráfico'
        : 'Error inesperado al exportar'
      toast.error(message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={handleExport}
          disabled={isExporting}
          title="Descargar como imagen"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div ref={chartRef} className="bg-card rounded-lg border p-4 my-3">
        {variationData && (
          <VariationBreakdownChart data={variationData.data as VariationBreakdownDataItem[]} />
        )}
        {operatorData && (
          <OperatorComparisonChart data={operatorData.data as OperatorComparisonDataItem[]} />
        )}
      </div>
    </div>
  )
}
