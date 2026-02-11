'use client'

import { useRef, useState } from 'react'
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ErrorBar,
  ReferenceLine,
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

/**
 * MeasurementsByPart component displays box plot of measurements grouped by part
 * Shows min, Q1, median, Q3, max for each part (candle chart style)
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
    return {
      part: String(item.part),
      median: quartiles.median,
      q1: quartiles.q1,
      q3: quartiles.q3,
      min: quartiles.min,
      max: quartiles.max,
      // For error bars: distance from median to min/max
      errorLow: quartiles.median - quartiles.min,
      errorHigh: quartiles.max - quartiles.median,
      // IQR bar height
      iqrLow: quartiles.median - quartiles.q1,
      iqrHigh: quartiles.q3 - quartiles.median,
    }
  })

  // Calculate overall mean for reference line
  const overallMean = data.reduce((sum, item) => sum + item.mean, 0) / data.length

  // Calculate Y-axis domain
  const allMins = data.map((d) => d.min)
  const allMaxs = data.map((d) => d.max)
  const yMin = Math.min(...allMins)
  const yMax = Math.max(...allMaxs)
  const yPadding = (yMax - yMin) * 0.1

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
        <h4 className="text-sm font-medium mb-3 text-foreground">Mediciones por Pieza</h4>
        <p className="text-xs text-muted-foreground mb-2">
          Diagrama de caja mostrando min, Q1, mediana, Q3 y max por pieza.
        </p>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="part"
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              domain={[yMin - yPadding, yMax + yPadding]}
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
              formatter={(value, name) => {
                const val = typeof value === 'number' ? value.toFixed(4) : String(value)
                const labels: Record<string, string> = {
                  median: 'Mediana',
                  min: 'Mínimo',
                  max: 'Máximo',
                  q1: 'Q1 (25%)',
                  q3: 'Q3 (75%)',
                }
                return [val, labels[String(name)] || String(name)]
              }}
              labelFormatter={(label) => `Pieza: ${label}`}
            />
            {/* Overall mean reference line */}
            <ReferenceLine
              y={overallMean}
              stroke="#10B981"
              strokeDasharray="5 5"
              label={{ value: `Media=${overallMean.toFixed(4)}`, position: 'right', fontSize: 10, fill: '#10B981' }}
            />
            {/* Box plot bars */}
            <Bar dataKey="median" fill="#3B82F6" radius={[2, 2, 2, 2]} barSize={30}>
              <ErrorBar
                dataKey="errorHigh"
                direction="y"
                width={15}
                strokeWidth={2}
                stroke="#64748B"
              />
              <ErrorBar
                dataKey="errorLow"
                direction="y"
                width={15}
                strokeWidth={2}
                stroke="#64748B"
              />
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-[#3B82F6]" />
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
