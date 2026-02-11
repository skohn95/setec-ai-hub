'use client'

import { useRef, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { exportChartToPng, generateExportFilename, ChartExportError } from '@/lib/utils/download-utils'

interface OperatorPartMeans {
  operator: string
  partMeans: Record<string, number>
}

interface InteractionPlotData {
  operators: OperatorPartMeans[]
  parts: string[]
}

interface InteractionPlotProps {
  data: InteractionPlotData
}

// Define colors for different operators
const OPERATOR_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F97316', // orange
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
]

/**
 * InteractionPlot component displays Operator×Part interaction
 * Each line represents one operator, showing how their measurements vary across parts
 * Parallel lines indicate no interaction; crossing lines indicate significant interaction
 */
export default function InteractionPlot({ data }: InteractionPlotProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  if (!data || !data.operators || data.operators.length === 0 || !data.parts || data.parts.length === 0) {
    return null
  }

  // Transform data for line chart - one data point per part, with columns for each operator
  const chartData = data.parts.map((part) => {
    const dataPoint: Record<string, string | number> = { part }
    data.operators.forEach((op) => {
      dataPoint[op.operator] = op.partMeans[part] ?? 0
    })
    return dataPoint
  })

  // Calculate Y-axis domain
  const allValues: number[] = []
  data.operators.forEach((op) => {
    Object.values(op.partMeans).forEach((v) => allValues.push(v))
  })
  const yMin = Math.min(...allValues)
  const yMax = Math.max(...allValues)
  const yPadding = (yMax - yMin) * 0.1

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const filename = generateExportFilename('interaction')
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
      <div ref={chartRef} data-testid="interaction-plot" className="mb-4 bg-card rounded-lg border p-4">
        <h4 className="text-sm font-medium mb-3 text-foreground">Gráfico de Interacción (Operador×Pieza)</h4>
        <p className="text-xs text-muted-foreground mb-2">
          Líneas paralelas = sin interacción. Líneas que se cruzan = interacción significativa entre operador y pieza.
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="part"
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              label={{ value: 'Pieza', position: 'insideBottom', offset: -5, fontSize: 11 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              domain={[yMin - yPadding, yMax + yPadding]}
              tickFormatter={(value: number) => value.toFixed(3)}
              label={{ value: 'Media', angle: -90, position: 'insideLeft', fontSize: 11 }}
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
                return [val, String(name)]
              }}
              labelFormatter={(label) => `Pieza: ${label}`}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="line"
              wrapperStyle={{ fontSize: '11px' }}
            />
            {/* One line per operator */}
            {data.operators.map((op, index) => (
              <Line
                key={op.operator}
                type="monotone"
                dataKey={op.operator}
                stroke={OPERATOR_COLORS[index % OPERATOR_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4, fill: OPERATOR_COLORS[index % OPERATOR_COLORS.length] }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
