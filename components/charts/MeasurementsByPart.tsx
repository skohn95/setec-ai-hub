'use client'

import { useRef, useState } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { exportChartToPng, generateExportFilename, ChartExportError } from '@/lib/utils/download-utils'

interface MeasurementsByPartItem {
  part: string
  measurements: number[]
  mean: number
  min: number
  max: number
}

interface MeasurementsByPartProps {
  data: MeasurementsByPartItem[]
}

// Format number: 2 decimals if >= 1, 2 significant figures if < 1
function formatNumber(value: number): string {
  if (Math.abs(value) >= 1) {
    return value.toFixed(2)
  }
  return value.toPrecision(2)
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

// Custom bar shape that renders a box plot with mean indicator
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BoxPlotBar = (props: any) => {
  const { x, width, payload, yScale } = props
  if (!payload || !yScale) return null

  const { min, q1, median, q3, max, mean } = payload

  const minY = yScale(min)
  const q1Y = yScale(q1)
  const medianY = yScale(median)
  const q3Y = yScale(q3)
  const maxY = yScale(max)
  const meanY = mean !== undefined ? yScale(mean) : null

  const cx = x + width / 2
  const boxWidth = Math.min(width * 0.6, 30)
  const halfWidth = boxWidth / 2
  const whiskerWidth = boxWidth * 0.4

  return (
    <g>
      {/* Box (IQR: Q1 to Q3) */}
      <rect
        x={cx - halfWidth}
        y={q3Y}
        width={boxWidth}
        height={Math.max(q1Y - q3Y, 1)}
        fill="#3B82F6"
        stroke="#2563EB"
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
      {/* Mean indicator (diamond) */}
      {meanY !== null && (
        <polygon
          points={`${cx},${meanY - 5} ${cx + 5},${meanY} ${cx},${meanY + 5} ${cx - 5},${meanY}`}
          fill="#10B981"
          stroke="#059669"
          strokeWidth={1}
        />
      )}
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
 * MeasurementsByPart component displays box plot (candle chart) of measurements grouped by part
 * Shows min, Q1, median, Q3, max for each part
 */
export default function MeasurementsByPart({ data }: MeasurementsByPartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  if (!data || data.length === 0) {
    return null
  }

  // Transform data for box plot visualization
  const chartData = data.map((item) => {
    const quartiles = calculateQuartiles(item.measurements)
    // Calculate mean from measurements
    const mean = item.measurements.reduce((sum, m) => sum + m, 0) / item.measurements.length
    return {
      part: String(item.part),
      // Use max as the bar value to ensure full height rendering
      value: quartiles.max,
      // Quartile values for the custom shape
      min: quartiles.min,
      q1: quartiles.q1,
      median: quartiles.median,
      q3: quartiles.q3,
      max: quartiles.max,
      mean,
    }
  })

  // Calculate Y-axis domain based on actual data
  const allMins = chartData.map((d) => d.min)
  const allMaxs = chartData.map((d) => d.max)
  const yMin = Math.min(...allMins)
  const yMax = Math.max(...allMaxs)
  const yPadding = (yMax - yMin) * 0.15

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const filename = generateExportFilename('measurements-part')
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

  // Get yScale from the chart for custom rendering
  const yDomain = [yMin - yPadding, yMax + yPadding]

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
      <div ref={chartRef} data-testid="measurements-by-part" className="mb-4 bg-card rounded-lg border p-4">
        <h4 className="text-sm font-medium mb-3 text-foreground">Mediciones por Parte</h4>
        <p className="text-xs text-muted-foreground mb-2">
          Diagrama de caja: caja = IQR (Q1-Q3), línea roja = mediana, bigotes = min/max.
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 30, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="part"
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              label={{ value: 'Parte', position: 'insideBottom', offset: -20, fontSize: 11 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              domain={yDomain}
              tickFormatter={formatNumber}
              label={{ value: 'Medición', angle: -90, position: 'insideLeft', offset: -5, fontSize: 11 }}
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
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>Parte: {Number.isInteger(Number(label)) ? Math.round(Number(label)) : label}</div>
                    <div>Máx: {formatNumber(data.max)}</div>
                    <div>Q3: {formatNumber(data.q3)}</div>
                    <div>Mediana: {formatNumber(data.median)}</div>
                    <div style={{ color: '#10B981' }}>Media: {formatNumber(data.mean)}</div>
                    <div>Q1: {formatNumber(data.q1)}</div>
                    <div>Mín: {formatNumber(data.min)}</div>
                  </div>
                )
              }}
            />
            <Bar
              dataKey="value"
              shape={(props) => {
                // Create a linear scale for Y values
                const { background } = props
                if (!background || background.height == null || background.y == null) return null
                const chartHeight = background.height
                const chartY = background.y
                const [domainMin, domainMax] = yDomain
                const yScale = (val: number) => {
                  const ratio = (val - domainMin) / (domainMax - domainMin)
                  return (chartY as number) + chartHeight * (1 - ratio)
                }
                return <BoxPlotBar {...props} yScale={yScale} />
              }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill="transparent" />
              ))}
            </Bar>
            <Line
              type="linear"
              dataKey="mean"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
              activeDot={false}
              legendType="none"
            />
          </ComposedChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 rounded bg-[#3B82F6]" />
            <span>IQR (Q1-Q3)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-[#EF4444]" />
            <span>Mediana</span>
          </div>
          <div className="flex items-center gap-1">
            <svg width="24" height="12" viewBox="0 0 24 12">
              <line x1="0" y1="6" x2="24" y2="6" stroke="#10B981" strokeWidth="2" />
              <polygon points="12,1 17,6 12,11 7,6" fill="#10B981" stroke="#059669" strokeWidth="1" />
            </svg>
            <span>Media</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-[#64748B]" />
            <span>Min/Max</span>
          </div>
        </div>
      </div>
    </div>
  )
}
