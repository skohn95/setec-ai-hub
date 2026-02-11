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

/**
 * RChartByOperator component displays Range chart by operator
 * Shows AVERAGE range per operator (not individual measurements)
 * Includes UCL and center line (R-bar)
 */
export default function RChartByOperator({ data }: RChartByOperatorProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  if (!data || !data.points || data.points.length === 0) {
    return null
  }

  // Aggregate ranges by operator - calculate average range per operator
  const operatorRanges: Record<string, number[]> = {}
  data.points.forEach((point) => {
    if (!operatorRanges[point.operator]) {
      operatorRanges[point.operator] = []
    }
    operatorRanges[point.operator].push(point.range)
  })

  // Calculate average range per operator
  const chartData = Object.entries(operatorRanges).map(([operator, ranges]) => ({
    operator,
    avgRange: ranges.reduce((sum, r) => sum + r, 0) / ranges.length,
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
          Rango promedio por operador. Valores fuera de UCL indican variación excesiva.
        </p>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 80, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="operator"
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              domain={[0, Math.max(data.uclR * 1.2, Math.max(...chartData.map((d) => d.avgRange)) * 1.2)]}
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
              labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
              formatter={(value) => [typeof value === 'number' ? value.toFixed(4) : String(value), 'Rango Promedio']}
              labelFormatter={(label) => `Operador: ${label}`}
            />
            {/* Reference lines for control limits */}
            <ReferenceLine
              y={data.uclR}
              stroke="#EF4444"
              strokeDasharray="5 5"
              label={{ value: `UCL: ${data.uclR.toFixed(4)}`, position: 'right', fontSize: 10, fill: '#EF4444' }}
            />
            <ReferenceLine
              y={data.rBar}
              stroke="#10B981"
              strokeWidth={2}
              label={{ value: `R̄: ${data.rBar.toFixed(4)}`, position: 'right', fontSize: 10, fill: '#10B981' }}
            />
            {data.lclR > 0 && (
              <ReferenceLine
                y={data.lclR}
                stroke="#EF4444"
                strokeDasharray="5 5"
                label={{ value: `LCL: ${data.lclR.toFixed(4)}`, position: 'right', fontSize: 10, fill: '#EF4444' }}
              />
            )}
            {/* Line chart for average range per operator */}
            <Line
              type="monotone"
              dataKey="avgRange"
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
            <span>Rango Promedio</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-[#10B981]" />
            <span>R̄ (Media)</span>
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
