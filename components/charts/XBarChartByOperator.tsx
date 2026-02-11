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

interface XBarChartPoint {
  operator: string
  part: string
  mean: number
}

interface XBarChartData {
  points: XBarChartPoint[]
  xDoubleBar: number
  uclXBar: number
  lclXBar: number
}

interface XBarChartByOperatorProps {
  data: XBarChartData
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
 * XBarChartByOperator component displays X-bar (mean) chart by operator
 * Shows subgroup means for each part measured by each operator
 * Includes UCL, LCL, and center line (X-double-bar)
 */
export default function XBarChartByOperator({ data }: XBarChartByOperatorProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  if (!data || !data.points || data.points.length === 0) {
    return null
  }

  // Get unique operators for coloring
  const operators = [...new Set(data.points.map((p) => p.operator))]

  // Transform data for chart - create sequential index for x-axis
  const chartData = data.points.map((point, index) => ({
    ...point,
    index,
    label: `${point.operator}-${point.part}`,
  }))

  // Calculate Y-axis domain with some padding
  const allValues = [...data.points.map((p) => p.mean), data.uclXBar, data.lclXBar]
  const yMin = Math.min(...allValues)
  const yMax = Math.max(...allValues)
  const yPadding = (yMax - yMin) * 0.1

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const filename = generateExportFilename('xbar')
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
      <div ref={chartRef} data-testid="xbar-chart-by-operator" className="mb-4 bg-card rounded-lg border p-4">
        <h4 className="text-sm font-medium mb-3 text-foreground">Gráfico X̄ (Media) por Operador</h4>
        <p className="text-xs text-muted-foreground mb-2">
          Promedios por pieza para cada operador. Puntos fuera de límites indican diferencias significativas.
        </p>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10 }}
              className="fill-muted-foreground"
              angle={-45}
              textAnchor="end"
              height={60}
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
              labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
              formatter={(value, name) => [typeof value === 'number' ? value.toFixed(4) : String(value), name === 'mean' ? 'Media' : String(name)]}
              labelFormatter={(label) => `${label}`}
            />
            {/* Reference lines for control limits */}
            <ReferenceLine
              y={data.uclXBar}
              stroke="#EF4444"
              strokeDasharray="5 5"
              label={{ value: `UCL=${data.uclXBar.toFixed(4)}`, position: 'right', fontSize: 10, fill: '#EF4444' }}
            />
            <ReferenceLine
              y={data.xDoubleBar}
              stroke="#3B82F6"
              strokeWidth={2}
              label={{ value: `X̿=${data.xDoubleBar.toFixed(4)}`, position: 'right', fontSize: 10, fill: '#3B82F6' }}
            />
            <ReferenceLine
              y={data.lclXBar}
              stroke="#EF4444"
              strokeDasharray="5 5"
              label={{ value: `LCL=${data.lclXBar.toFixed(4)}`, position: 'right', fontSize: 10, fill: '#EF4444' }}
            />
            {/* Scatter points colored by operator */}
            <Scatter
              dataKey="mean"
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
                style={{ backgroundColor: OPERATOR_COLORS[index % OPERATOR_COLORS.length] }}
              />
              <span>{op}</span>
            </div>
          ))}
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-[#3B82F6]" />
            <span>X̿ (Gran Media)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-[#EF4444]" style={{ borderStyle: 'dashed' }} />
            <span>Límites de Control</span>
          </div>
        </div>
      </div>
    </div>
  )
}
