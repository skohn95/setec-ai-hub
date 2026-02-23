'use client'

import { useRef, useState, useMemo } from 'react'
import {
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Download, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { exportChartToPng, generateExportFilename, ChartExportError } from '@/lib/utils/download-utils'
import type { NormalityPlotData, NormalityPlotPoint } from '@/types/analysis'

interface NormalityPlotProps {
  data: NormalityPlotData
}

/**
 * Chart point data for rendering (combines data point with confidence bands)
 */
interface ChartPointData {
  expected: number        // Theoretical normal quantile (x-axis)
  actual: number          // Observed value (y-axis)
  fit: number             // Fitted value on regression line
  lower: number           // Lower confidence band
  upper: number           // Upper confidence band
  index: number           // Original point index
}

/**
 * Format number: 2 decimals if >= 1, 2 significant figures if < 1
 */
function formatNumber(value: number): string {
  if (Math.abs(value) >= 1) {
    return value.toFixed(2)
  }
  return value.toPrecision(2)
}

/**
 * Format p-value with special handling for very small values
 */
function formatPValue(pValue: number): string {
  if (pValue < 0.005) {
    return '< 0.005'
  }
  return pValue.toFixed(4)
}

/**
 * NormalityPlot Legend component
 */
function NormalityPlotLegend() {
  return (
    <div
      data-testid="normality-plot-legend"
      className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mt-2"
    >
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-[#3B82F6]" />
        <span>Datos</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-4 h-0.5 bg-[#3B82F6]" />
        <span>Línea de Ajuste</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-4 h-0.5 bg-[#3B82F6] border-dashed border-t border-[#3B82F6]" style={{ borderStyle: 'dashed' }} />
        <span>Bandas de Confianza 95%</span>
      </div>
    </div>
  )
}

/**
 * Anderson-Darling stats display component
 */
function ADStatsDisplay({
  statistic,
  pValue,
  isNormal,
}: {
  statistic: number
  pValue: number
  isNormal: boolean
}) {
  return (
    <div
      data-testid="ad-stats-display"
      className="flex items-center justify-between mb-3 p-2 bg-muted/50 rounded-md text-xs"
    >
      <div className="flex items-center gap-4 font-mono">
        <span>A² = {statistic.toFixed(4)}</span>
        <span>p-value = {formatPValue(pValue)}</span>
      </div>
      <div className="flex items-center gap-1">
        {isNormal ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-green-600 font-medium">Normal</span>
          </>
        ) : (
          <>
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-red-600 font-medium">No Normal</span>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * NormalityPlot component displays a Normal Q-Q probability plot
 * for Capacidad de Proceso analysis.
 * Shows data points plotted against theoretical normal quantiles
 * with a fit line and 95% confidence bands.
 */
export default function NormalityPlot({ data }: NormalityPlotProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Transform data for chart rendering
  const chartData = useMemo(() => {
    if (!data?.data?.points || data.data.points.length === 0) {
      return []
    }

    const { points, fit_line, confidence_bands } = data.data
    const { slope, intercept } = fit_line

    return points.map((point: NormalityPlotPoint, idx: number): ChartPointData => ({
      expected: point.expected,
      actual: point.actual,
      fit: slope * point.expected + intercept,
      lower: confidence_bands.lower[idx] ?? (slope * point.expected + intercept),
      upper: confidence_bands.upper[idx] ?? (slope * point.expected + intercept),
      index: point.index,
    }))
  }, [data])

  if (chartData.length === 0) {
    return null
  }

  const { anderson_darling } = data.data

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const filename = generateExportFilename('normalidad')
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

  // Calculate axis domains
  const expectedValues = chartData.map((d: ChartPointData) => d.expected)
  const actualValues = chartData.map((d: ChartPointData) => d.actual)
  const xMin = Math.min(...expectedValues)
  const xMax = Math.max(...expectedValues)
  const yMin = Math.min(...actualValues, ...chartData.map((d: ChartPointData) => d.lower))
  const yMax = Math.max(...actualValues, ...chartData.map((d: ChartPointData) => d.upper))
  const xPadding = (xMax - xMin) * 0.1
  const yPadding = (yMax - yMin) * 0.1

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
      <div ref={chartRef} data-testid="normality-plot" className="mb-4 bg-card rounded-lg border p-4">
        <h4 className="text-sm font-medium mb-2 text-foreground">Gráfico de Probabilidad Normal</h4>
        <ADStatsDisplay
          statistic={anderson_darling.statistic}
          pValue={anderson_darling.p_value}
          isNormal={anderson_darling.is_normal}
        />
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 30, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="expected"
              type="number"
              domain={[xMin - xPadding, xMax + xPadding]}
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              tickFormatter={(v) => v.toFixed(1)}
              label={{ value: 'Cuantil Teórico', position: 'insideBottom', offset: -20, fontSize: 11 }}
            />
            <YAxis
              dataKey="actual"
              type="number"
              domain={[yMin - yPadding, yMax + yPadding]}
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              tickFormatter={formatNumber}
              label={{ value: 'Valor Observado', angle: -90, position: 'insideLeft', offset: -5, fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null
                const point = payload[0].payload as ChartPointData
                return (
                  <div style={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                      Punto {point.index + 1}
                    </div>
                    <div>Valor Observado: {formatNumber(point.actual)}</div>
                    <div>Cuantil Teórico: {point.expected.toFixed(3)}</div>
                    <div className="text-muted-foreground mt-1">
                      Valor Ajustado: {formatNumber(point.fit)}
                    </div>
                  </div>
                )
              }}
            />
            {/* Confidence bands - render as dashed lines for upper and lower bounds */}
            <Line
              type="monotone"
              dataKey="upper"
              stroke="#3B82F6"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="lower"
              stroke="#3B82F6"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            {/* Fit line */}
            <Line
              type="linear"
              dataKey="fit"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
            {/* Data points */}
            <Scatter
              dataKey="actual"
              fill="#3B82F6"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <NormalityPlotLegend />
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {anderson_darling.is_normal
            ? 'Los datos siguen una distribución normal (p ≥ 0.05)'
            : 'Los datos NO siguen una distribución normal (p < 0.05)'
          }
        </p>
      </div>
    </div>
  )
}
