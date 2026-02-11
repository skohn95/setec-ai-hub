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

/**
 * XBarChartByOperator component displays X-bar (mean) chart by operator
 * Shows AVERAGE mean per operator (not individual measurements)
 * Includes UCL, LCL, and center line (X-double-bar)
 */
export default function XBarChartByOperator({ data }: XBarChartByOperatorProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  if (!data || !data.points || data.points.length === 0) {
    return null
  }

  // Aggregate means by operator - calculate average mean per operator
  const operatorMeans: Record<string, number[]> = {}
  data.points.forEach((point) => {
    if (!operatorMeans[point.operator]) {
      operatorMeans[point.operator] = []
    }
    operatorMeans[point.operator].push(point.mean)
  })

  // Calculate average mean per operator
  const chartData = Object.entries(operatorMeans).map(([operator, means]) => ({
    operator,
    avgMean: means.reduce((sum, m) => sum + m, 0) / means.length,
  }))

  // Calculate Y-axis domain with some padding
  const allValues = [...chartData.map((d) => d.avgMean), data.uclXBar, data.lclXBar]
  const yMin = Math.min(...allValues)
  const yMax = Math.max(...allValues)
  const yPadding = (yMax - yMin) * 0.15

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
        <h4 className="text-sm font-medium mb-3 text-foreground">Gráfico X barra (Media) por Operador</h4>
        <p className="text-xs text-muted-foreground mb-2">
          Media promedio por operador. Valores fuera de límites indican diferencias significativas.
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 80, left: 20, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="operator"
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              label={{ value: 'Operador', position: 'insideBottom', offset: -20, fontSize: 11 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              domain={[yMin - yPadding, yMax + yPadding]}
              tickFormatter={formatNumber}
              label={{ value: 'Media', angle: -90, position: 'insideLeft', offset: 5, fontSize: 11 }}
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
              formatter={(value) => [typeof value === 'number' ? value.toFixed(4) : String(value), 'Media Promedio']}
              labelFormatter={(label) => `Operador: ${label}`}
            />
            {/* Reference lines for control limits */}
            <ReferenceLine
              y={data.uclXBar}
              stroke="#EF4444"
              strokeDasharray="5 5"
              label={{ value: `UCL: ${data.uclXBar.toFixed(4)}`, position: 'right', fontSize: 10, fill: '#EF4444' }}
            />
            <ReferenceLine
              y={data.xDoubleBar}
              stroke="#10B981"
              strokeWidth={2}
              label={{ value: `Xbar: ${data.xDoubleBar.toFixed(4)}`, position: 'right', fontSize: 10, fill: '#10B981' }}
            />
            <ReferenceLine
              y={data.lclXBar}
              stroke="#EF4444"
              strokeDasharray="5 5"
              label={{ value: `LCL: ${data.lclXBar.toFixed(4)}`, position: 'right', fontSize: 10, fill: '#EF4444' }}
            />
            {/* Line chart for average mean per operator */}
            <Line
              type="monotone"
              dataKey="avgMean"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ r: 6, fill: '#3B82F6' }}
              activeDot={{ r: 8 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#3B82F6]" />
            <span>Media Promedio</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-[#10B981]" />
            <span>Xbar (Gran Media)</span>
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
