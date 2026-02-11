'use client'

import { useRef, useState } from 'react'
import {
  ComposedChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ZAxis,
} from 'recharts'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { exportChartToPng, generateExportFilename, ChartExportError } from '@/lib/utils/download-utils'

interface MeasurementsByOperatorItem {
  operator: string
  measurements: number[]
  mean: number
  min: number
  max: number
}

interface MeasurementsByOperatorProps {
  data: MeasurementsByOperatorItem[]
}

// Calculate quartiles for box plot
function calculateQuartiles(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  const q1Index = Math.floor(n * 0.25)
  const q3Index = Math.floor(n * 0.75)
  const medianIndex = Math.floor(n * 0.5)

  return {
    min: sorted[0],
    q1: sorted[q1Index],
    median: sorted[medianIndex],
    q3: sorted[q3Index],
    max: sorted[n - 1],
  }
}

// Custom shape that draws the entire box plot
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BoxPlotShape = (props: any) => {
  const { cx, payload, yAxisMap } = props
  if (!cx || !yAxisMap || !yAxisMap['0'] || !payload) return null

  const scale = yAxisMap['0'].scale
  const minY = scale(payload.min)
  const maxY = scale(payload.max)
  const q1Y = scale(payload.q1)
  const q3Y = scale(payload.q3)
  const medianY = scale(payload.median)

  const boxWidth = 24
  const halfWidth = boxWidth / 2
  const whiskerWidth = 8

  return (
    <g>
      {/* Box (IQR: Q1 to Q3) */}
      <rect
        x={cx - halfWidth}
        y={q3Y}
        width={boxWidth}
        height={q1Y - q3Y}
        fill="#8B5CF6"
        stroke="#7C3AED"
        strokeWidth={1}
        rx={2}
      />
      {/* Median line */}
      <line
        x1={cx - halfWidth}
        y1={medianY}
        x2={cx + halfWidth}
        y2={medianY}
        stroke="#EF4444"
        strokeWidth={2}
      />
      {/* Lower whisker: Q1 to min */}
      <line x1={cx} y1={q1Y} x2={cx} y2={minY} stroke="#64748B" strokeWidth={2} />
      <line x1={cx - whiskerWidth} y1={minY} x2={cx + whiskerWidth} y2={minY} stroke="#64748B" strokeWidth={2} />
      {/* Upper whisker: Q3 to max */}
      <line x1={cx} y1={q3Y} x2={cx} y2={maxY} stroke="#64748B" strokeWidth={2} />
      <line x1={cx - whiskerWidth} y1={maxY} x2={cx + whiskerWidth} y2={maxY} stroke="#64748B" strokeWidth={2} />
    </g>
  )
}

/**
 * MeasurementsByOperator component displays box plot (candle chart) of measurements grouped by operator
 * Shows min, Q1, median, Q3, max for each operator
 */
export default function MeasurementsByOperator({ data }: MeasurementsByOperatorProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  if (!data || data.length === 0) {
    return null
  }

  // Transform data for box plot visualization
  const chartData = data.map((item) => {
    const quartiles = calculateQuartiles(item.measurements)
    return {
      operator: String(item.operator),
      // Use median as the y value for positioning the scatter point
      y: quartiles.median,
      // Quartile values for the custom shape
      min: quartiles.min,
      q1: quartiles.q1,
      median: quartiles.median,
      q3: quartiles.q3,
      max: quartiles.max,
    }
  })

  // Calculate overall mean for reference line
  const overallMean = data.reduce((sum, item) => sum + item.mean, 0) / data.length

  // Calculate Y-axis domain based on actual data
  const allMins = chartData.map((d) => d.min)
  const allMaxs = chartData.map((d) => d.max)
  const yMin = Math.min(...allMins)
  const yMax = Math.max(...allMaxs)
  const yPadding = (yMax - yMin) * 0.15

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const filename = generateExportFilename('measurements-operator')
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
      <div ref={chartRef} data-testid="measurements-by-operator" className="mb-4 bg-card rounded-lg border p-4">
        <h4 className="text-sm font-medium mb-3 text-foreground">Mediciones por Operador</h4>
        <p className="text-xs text-muted-foreground mb-2">
          Diagrama de caja: caja = IQR (Q1-Q3), línea roja = mediana, bigotes = min/max.
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 25, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="operator"
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              domain={[yMin - yPadding, yMax + yPadding]}
              tickFormatter={(value: number) => value.toFixed(2)}
              label={{ value: 'Medición', angle: -90, position: 'insideLeft', offset: 10, fontSize: 11 }}
            />
            <ZAxis range={[0, 0]} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '12px',
                padding: '8px 12px',
              }}
              formatter={(value, name) => {
                const val = typeof value === 'number' ? value.toFixed(4) : String(value)
                const labels: Record<string, string> = {
                  y: 'Mediana',
                  median: 'Mediana',
                  min: 'Mínimo',
                  max: 'Máximo',
                  q1: 'Q1 (25%)',
                  q3: 'Q3 (75%)',
                }
                return [val, labels[String(name)] || String(name)]
              }}
              labelFormatter={(label) => `Operador: ${label}`}
            />
            {/* Overall mean reference line */}
            <ReferenceLine
              y={overallMean}
              stroke="#10B981"
              strokeDasharray="5 5"
              label={{ value: `Media=${overallMean.toFixed(4)}`, position: 'right', fontSize: 10, fill: '#10B981' }}
            />
            {/* Box plot using custom shape */}
            <Scatter
              dataKey="y"
              fill="transparent"
              shape={(props) => <BoxPlotShape {...props} />}
            />
          </ComposedChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 rounded bg-[#8B5CF6]" />
            <span>IQR (Q1-Q3)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-[#EF4444]" />
            <span>Mediana</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-[#64748B]" />
            <span>Min/Max</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-[#10B981]" style={{ borderTop: '2px dashed #10B981' }} />
            <span>Media General</span>
          </div>
        </div>
      </div>
    </div>
  )
}
