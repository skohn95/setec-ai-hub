'use client'

import { useRef, useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
} from 'recharts'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { exportChartToPng, generateExportFilename, ChartExportError } from '@/lib/utils/download-utils'
import type { MRChartData, OutOfControlPoint } from '@/types/analysis'

interface MRChartProps {
  data: MRChartData
}

/**
 * Chart point data for rendering
 */
interface ChartPointData {
  observation: number    // Observation number (2 to n, since MR[0] is between obs 1 and 2)
  value: number
  isOOC: boolean
}

/**
 * Format number: 2 decimals if >= 1, 2 significant figures if < 1
 */
function formatNumber(value: number): string {
  if (Math.abs(value) >= 1) {
    return value.toFixed(2)
  }
  return value.toPrecision(2)
}

/**
 * Custom dot component for highlighting OOC points
 */
function CustomDot(props: {
  cx?: number
  cy?: number
  payload?: ChartPointData
}) {
  const { cx, cy, payload } = props

  if (cx === undefined || cy === undefined || !payload) {
    return null
  }

  const isOOC = payload.isOOC
  const radius = isOOC ? 6 : 4
  const fill = isOOC ? '#EF4444' : '#3B82F6'
  const stroke = isOOC ? '#EF4444' : '#3B82F6'

  return (
    <Dot
      cx={cx}
      cy={cy}
      r={radius}
      fill={fill}
      stroke={stroke}
      strokeWidth={isOOC ? 2 : 1}
    />
  )
}

/**
 * MR-Chart Legend component
 */
function MRChartLegend() {
  return (
    <div
      data-testid="mr-chart-legend"
      className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mt-2"
    >
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-[#3B82F6]" />
        <span>Punto Normal</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
        <span>Fuera de Control</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-4 h-0.5 bg-[#10B981]" />
        <span>MR̄ (Centro)</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-4 h-0 border-t-2 border-dashed border-[#EF4444]" />
        <span>LCS</span>
      </div>
    </div>
  )
}

/**
 * MRChart component displays a Moving Range control chart
 * for Capacidad de Proceso analysis.
 * Shows MR points connected by lines with control limits and
 * highlighted out-of-control points.
 */
export default function MRChart({ data }: MRChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Create chart data with OOC flag
  const chartData = useMemo(() => {
    if (!data?.data?.values || data.data.values.length === 0) {
      return []
    }

    const oocPoints = data.data.ooc_points || []

    // Create a Map for O(1) lookup of OOC points
    const oocMap = new Map(oocPoints.map((p: OutOfControlPoint) => [p.index, p]))

    return data.data.values.map((value: number, index: number): ChartPointData => ({
      observation: index + 2,  // MR[0] corresponds to observation 2 (between obs 1 and 2)
      value,
      isOOC: oocMap.has(index),
    }))
  }, [data])

  if (chartData.length === 0) {
    return null
  }

  const { center, ucl } = data.data

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const filename = generateExportFilename('carta-mr')
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

  // Calculate Y-axis domain with padding to include control limits
  const allValues = chartData.map((d: ChartPointData) => d.value)
  const yMin = Math.min(0, ...allValues)  // LCL is always 0
  const yMax = Math.max(ucl, ...allValues)
  const yPadding = (yMax - yMin) * 0.15

  // Count OOC points for display
  const oocCount = chartData.filter((d: ChartPointData) => d.isOOC).length

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
      <div ref={chartRef} data-testid="mr-chart" className="mb-4 bg-card rounded-lg border p-4">
        <h4 className="text-sm font-medium mb-3 text-foreground">Carta MR (Rango Móvil)</h4>
        <p className="text-xs text-muted-foreground mb-2">
          Variabilidad entre observaciones consecutivas.
          {oocCount > 0 && (
            <span className="text-red-500 ml-1">
              {oocCount} punto{oocCount > 1 ? 's' : ''} fuera de control.
            </span>
          )}
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 80, left: 30, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="observation"
              type="number"
              domain={[1.5, chartData.length + 1.5]}
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              label={{ value: 'Observación', position: 'insideBottom', offset: -20, fontSize: 11 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              domain={[yMin - yPadding, yMax + yPadding]}
              tickFormatter={formatNumber}
              label={{ value: 'Rango Móvil', angle: -90, position: 'insideLeft', offset: -5, fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null
                const point = payload[0].payload as ChartPointData
                return (
                  <div style={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                      Observación {point.observation}
                    </div>
                    <div>MR: {formatNumber(point.value)}</div>
                    {point.isOOC && (
                      <div style={{ color: '#EF4444', fontWeight: 600 }}>
                        ⚠️ Fuera de control (excede LCS)
                      </div>
                    )}
                  </div>
                )
              }}
            />
            {/* Center line (MR̄) */}
            <ReferenceLine
              y={center}
              stroke="#10B981"
              strokeWidth={2}
              label={{ value: `MR̄: ${formatNumber(center)}`, position: 'right', fontSize: 10, fill: '#10B981' }}
            />
            {/* Upper Control Limit (LCS/UCL) */}
            <ReferenceLine
              y={ucl}
              stroke="#EF4444"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ value: `LCS: ${formatNumber(ucl)}`, position: 'right', fontSize: 10, fill: '#EF4444' }}
            />
            {/* LCL = 0 is shown as the x-axis, optionally add thin reference line */}
            <ReferenceLine
              y={0}
              stroke="#9CA3AF"
              strokeWidth={1}
              strokeOpacity={0.5}
            />
            {/* Line connecting points */}
            <Line
              type="linear"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={1.5}
              dot={<CustomDot />}
              activeDot={{ r: 8 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <MRChartLegend />
      </div>
    </div>
  )
}
