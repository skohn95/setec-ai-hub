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
} from 'recharts'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { VariationChartDataItem } from '@/types/api'
import { CHART_COLORS } from '@/constants/analysis'
import { toast } from 'sonner'
import { exportChartToPng, generateExportFilename, ChartExportError } from '@/lib/utils/download-utils'

// Export the props interface for external typing
export interface VariationChartProps {
  data: VariationChartDataItem[]
}

// Re-export the data item type
export type { VariationChartDataItem }

/**
 * VariationChart component displays per-operator variation data
 * Highlights the operator with the highest variation in red
 * Shows standard deviation as the variation metric
 */
export default function VariationChart({ data }: VariationChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Return null for empty/invalid data
  if (!data || data.length === 0) {
    return null
  }

  // Find the maximum variation to highlight
  const maxVariation = Math.max(...data.map((d) => d.variation))

  // Transform data for chart with colors
  const chartData = data.map((item: VariationChartDataItem) => ({
    ...item,
    // Use custom color if provided, otherwise use default/highlight color
    fill: item.color ?? (item.variation === maxVariation ? CHART_COLORS.HIGHLIGHT_BAR : CHART_COLORS.DEFAULT_BAR),
  }))

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const filename = generateExportFilename('variation')
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
      <div ref={chartRef} data-testid="variation-chart" className="mb-4 bg-card rounded-lg border p-4">
        <h4 className="text-sm font-medium mb-3 text-foreground">Variación por Operador</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="operator"
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              domain={[0, 'dataMax + 0.1']}
              tickFormatter={(value: number) => value.toFixed(2)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px',
                padding: '8px 12px',
              }}
              labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
              formatter={(value, name) => {
                const formattedValue = typeof value === 'number' ? value.toFixed(3) : '0.000'
                const displayName = name ?? ''
                const label = displayName === 'variation' ? 'Desv. Std.' : displayName
                return [formattedValue, label]
              }}
            />
            <Bar dataKey="variation" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div
          data-testid="variation-chart-legend"
          className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-2"
        >
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.DEFAULT_BAR }} />
            <span>Desv. Std.</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: CHART_COLORS.HIGHLIGHT_BAR }} />
            <span>Mayor variación</span>
          </div>
        </div>
      </div>
    </div>
  )
}
