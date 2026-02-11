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

interface RChartPoint {
  operator: string
  part: string
  range: number
}

interface RChartData {
  points: RChartPoint[]
  rBar: number
  uclR: number
  lclR: number
}

interface RChartByOperatorProps {
  data: RChartData
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
 * RChartByOperator component displays Range chart by operator
 * Shows individual ranges for each part measured by each operator
 * Includes UCL and center line (R-bar)
 */
export default function RChartByOperator({ data }: RChartByOperatorProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  if (!data || !data.points || data.points.length === 0) {
    return null
  }

  // Transform data for chart - create sequential index for x-axis
  // Group points by operator for different series
  const operators = [...new Set(data.points.map((p) => p.operator))]

  // Create data with sequential index
  const chartData = data.points.map((point, index) => ({
    ...point,
    index,
    label: `${point.operator}-${point.part}`,
  }))

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const filename = generateExportFilename('rchart')
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
      <div ref={chartRef} data-testid="r-chart-by-operator" className="mb-4 bg-card rounded-lg border p-4">
        <h4 className="text-sm font-medium mb-3 text-foreground">Gráfico R por Operador</h4>
        <p className="text-xs text-muted-foreground mb-2">
          Rangos por pieza para cada operador. Puntos fuera de UCL indican variación excesiva.
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
              domain={[0, Math.max(data.uclR * 1.1, Math.max(...data.points.map((p) => p.range)) * 1.1)]}
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
              formatter={(value, name) => [typeof value === 'number' ? value.toFixed(4) : String(value), name === 'range' ? 'Rango' : String(name)]}
              labelFormatter={(label) => `${label}`}
            />
            {/* Reference lines for control limits */}
            <ReferenceLine
              y={data.uclR}
              stroke="#EF4444"
              strokeDasharray="5 5"
              label={{ value: `UCL=${data.uclR.toFixed(4)}`, position: 'right', fontSize: 10, fill: '#EF4444' }}
            />
            <ReferenceLine
              y={data.rBar}
              stroke="#3B82F6"
              strokeWidth={2}
              label={{ value: `R̄=${data.rBar.toFixed(4)}`, position: 'right', fontSize: 10, fill: '#3B82F6' }}
            />
            {data.lclR > 0 && (
              <ReferenceLine
                y={data.lclR}
                stroke="#EF4444"
                strokeDasharray="5 5"
                label={{ value: `LCL=${data.lclR.toFixed(4)}`, position: 'right', fontSize: 10, fill: '#EF4444' }}
              />
            )}
            {/* Scatter points colored by operator */}
            <Scatter
              dataKey="range"
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
            <span>R̄ (Promedio)</span>
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
