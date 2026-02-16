'use client'

import { useRef, useState } from 'react'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
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

// Format number: 2 decimals if >= 1, 2 significant figures if < 1
function formatNumber(value: number): string {
  if (Math.abs(value) >= 1) {
    return value.toFixed(2)
  }
  return value.toPrecision(2)
}

// Colors for alternating operator backgrounds
const OPERATOR_COLORS = ['rgba(59, 130, 246, 0.08)', 'rgba(59, 130, 246, 0.02)']

/**
 * XBarChartByOperator component displays X-bar (mean) chart by operator
 * Shows ALL individual mean measurements sequentially within each operator section
 * Includes UCL, LCL, and center line (X-double-bar)
 */
export default function XBarChartByOperator({ data }: XBarChartByOperatorProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  if (!data || !data.points || data.points.length === 0) {
    return null
  }

  // Get unique operators in order
  const operators = [...new Set(data.points.map((p) => p.operator))]

  // Group points by operator while maintaining order
  const pointsByOperator: Record<string, XBarChartPoint[]> = {}
  operators.forEach((op) => {
    pointsByOperator[op] = data.points.filter((p) => p.operator === op)
  })

  // Create sequential chart data with measurement index as x-axis
  let globalIndex = 0
  const chartData: Array<{
    index: number
    mean: number
    operator: string
    part: string
    measurementNum: number
  }> = []

  // Track operator boundaries for reference areas
  const operatorBoundaries: Array<{ operator: string; start: number; end: number }> = []

  operators.forEach((operator) => {
    const startIndex = globalIndex
    pointsByOperator[operator].forEach((point, localIndex) => {
      chartData.push({
        index: globalIndex,
        mean: point.mean,
        operator: point.operator,
        part: point.part,
        measurementNum: localIndex + 1,
      })
      globalIndex++
    })
    operatorBoundaries.push({
      operator,
      start: startIndex,
      end: globalIndex - 1,
    })
  })

  // Calculate Y-axis domain with some padding
  const allValues = [...chartData.map((d) => d.mean), data.uclXBar, data.lclXBar]
  const yMin = Math.min(...allValues)
  const yMax = Math.max(...allValues)
  const yPadding = (yMax - yMin) * 0.15

  // Calculate tick positions for operator labels (center of each operator section)
  const operatorTicks = operatorBoundaries.map((b) => ({
    position: (b.start + b.end) / 2,
    label: b.operator,
  }))

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
          Todas las mediciones de media por operador. Valores fuera de límites indican diferencias significativas.
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 80, left: 30, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            {/* Alternating background colors for operator sections */}
            {operatorBoundaries.map((boundary, idx) => (
              <ReferenceArea
                key={boundary.operator}
                x1={boundary.start - 0.5}
                x2={boundary.end + 0.5}
                fill={OPERATOR_COLORS[idx % 2]}
                fillOpacity={1}
              />
            ))}
            <XAxis
              dataKey="index"
              type="number"
              domain={[-0.5, chartData.length - 0.5]}
              ticks={operatorTicks.map((t) => t.position)}
              tickFormatter={(value) => {
                const tick = operatorTicks.find((t) => Math.abs(t.position - value) < 0.5)
                return tick?.label || ''
              }}
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              label={{ value: 'Operador', position: 'insideBottom', offset: -20, fontSize: 11 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              domain={[yMin - yPadding, yMax + yPadding]}
              tickFormatter={formatNumber}
              label={{ value: 'Media', angle: -90, position: 'insideLeft', offset: -5, fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null
                const point = payload[0].payload
                return (
                  <div style={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>Operador: {point.operator}</div>
                    <div>Parte: {point.part}</div>
                    <div>Medición #{point.measurementNum}</div>
                    <div>Media: {formatNumber(point.mean)}</div>
                  </div>
                )
              }}
            />
            {/* Reference lines for control limits */}
            <ReferenceLine
              y={data.uclXBar}
              stroke="#EF4444"
              strokeDasharray="5 5"
              label={{ value: `UCL: ${formatNumber(data.uclXBar)}`, position: 'right', fontSize: 10, fill: '#EF4444' }}
            />
            <ReferenceLine
              y={data.xDoubleBar}
              stroke="#10B981"
              strokeWidth={2}
              label={{ value: `X̄: ${formatNumber(data.xDoubleBar)}`, position: 'right', fontSize: 10, fill: '#10B981' }}
            />
            <ReferenceLine
              y={data.lclXBar}
              stroke="#EF4444"
              strokeDasharray="5 5"
              label={{ value: `LCL: ${formatNumber(data.lclXBar)}`, position: 'right', fontSize: 10, fill: '#EF4444' }}
            />
            {/* Line chart connecting all measurements */}
            <Line
              type="linear"
              dataKey="mean"
              stroke="#3B82F6"
              strokeWidth={1.5}
              dot={{ r: 4, fill: '#3B82F6' }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#3B82F6]" />
            <span>Media (por parte)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-[#10B981]" />
            <span>X̄ (Gran Media)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-[#EF4444]" style={{ borderTop: '2px dashed #EF4444' }} />
            <span>Límites de Control</span>
          </div>
        </div>
      </div>
    </div>
  )
}
