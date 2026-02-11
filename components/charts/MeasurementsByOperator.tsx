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
 * MeasurementsByOperator component displays all measurements grouped by operator
 * Shows individual measurement points with operator-specific colors
 * Helps visualize reproducibility (between-operator variation)
 */
export default function MeasurementsByOperator({ data }: MeasurementsByOperatorProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  if (!data || data.length === 0) {
    return null
  }

  // Get operator list
  const operators = data.map((d) => d.operator)

  // Transform data for scatter plot - flatten all measurements with operator info
  const scatterData: { operatorIndex: number; operator: string; value: number; measurementIndex: number }[] = []
  data.forEach((item, operatorIndex) => {
    item.measurements.forEach((value, measurementIndex) => {
      scatterData.push({
        operatorIndex,
        operator: item.operator,
        value,
        measurementIndex,
      })
    })
  })

  // Calculate overall mean for reference line
  const overallMean = data.reduce((sum, item) => sum + item.mean, 0) / data.length

  // Calculate Y-axis domain
  const allValues = scatterData.map((d) => d.value)
  const yMin = Math.min(...allValues)
  const yMax = Math.max(...allValues)
  const yPadding = (yMax - yMin) * 0.1

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
          Todas las mediciones agrupadas por operador. La dispersión vertical muestra la variación de cada operador.
        </p>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={scatterData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="operator"
              type="category"
              allowDuplicatedCategory={false}
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              domain={[yMin - yPadding, yMax + yPadding]}
              tickFormatter={(value: number) => value.toFixed(3)}
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
                if (name === 'value') return [val, 'Medición']
                return [val, String(name)]
              }}
              labelFormatter={(label) => `Operador: ${label}`}
            />
            {/* Overall mean reference line */}
            <ReferenceLine
              y={overallMean}
              stroke="#10B981"
              strokeDasharray="5 5"
              label={{ value: `Media General=${overallMean.toFixed(4)}`, position: 'right', fontSize: 10, fill: '#10B981' }}
            />
            {/* Scatter points colored by operator */}
            <Scatter
              dataKey="value"
              fill="#3B82F6"
              shape={(props) => {
                const { cx, cy, payload } = props as { cx?: number; cy?: number; payload?: { operator: string } }
                if (cx === undefined || cy === undefined || !payload) return null
                const operatorIndex = operators.indexOf(payload.operator)
                const color = OPERATOR_COLORS[operatorIndex % OPERATOR_COLORS.length]
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill={color}
                    fillOpacity={0.6}
                    stroke={color}
                    strokeWidth={1}
                  />
                )
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        {/* Legend for operators */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mt-2">
          {operators.map((op, index) => (
            <div key={op} className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: OPERATOR_COLORS[index % OPERATOR_COLORS.length], opacity: 0.6 }}
              />
              <span>{op}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-[#10B981]" style={{ borderStyle: 'dashed' }} />
            <span>Media General</span>
          </div>
        </div>
      </div>
    </div>
  )
}
