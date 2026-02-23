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
import type { IChartData, OutOfControlPoint, RuleViolation } from '@/types/analysis'

interface IChartProps {
  data: IChartData
}

/**
 * Chart point data for rendering
 */
interface ChartPointData {
  index: number          // 1-indexed for user readability
  value: number
  isOOC: boolean
  limit?: 'UCL' | 'LCL'
  violatedRules?: string[]  // Rules violated at this point
}

/**
 * Rule descriptions in Spanish for tooltip display
 */
const RULE_DESCRIPTIONS: Record<string, string> = {
  'rule_1': 'Punto fuera de límites 3σ',
  'rule_2': 'Tendencia (7 consecutivos)',
  'rule_3': 'Estratificación (7 en 1σ)',
  'rule_4': 'Zona superior (7 en 2-3σ)',
  'rule_5': 'Zona inferior (7 en 2-3σ)',
  'rule_6': 'Patrón cíclico',
  'rule_7': 'Un lado del centro (7+)',
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
 * I-Chart Legend component
 */
function IChartLegend() {
  return (
    <div
      data-testid="i-chart-legend"
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
        <span>X̄ (Centro)</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-4 h-0 border-t-2 border-dashed border-[#EF4444]" />
        <span>LCI / LCS</span>
      </div>
    </div>
  )
}

/**
 * IChart component displays an Individual Values control chart
 * for Capacidad de Proceso analysis.
 * Shows data points connected by lines with control limits and
 * highlighted out-of-control points.
 */
export default function IChart({ data }: IChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Create chart data with OOC flag and rule violations
  const chartData = useMemo(() => {
    if (!data?.data?.values || data.data.values.length === 0) {
      return []
    }

    const oocPoints = data.data.ooc_points || []
    const rulesViolations = data.data.rules_violations || []

    // Create a Map for O(1) lookup of OOC point details
    const oocMap = new Map(oocPoints.map((p: OutOfControlPoint) => [p.index, p]))

    // Create a Map of index -> violated rules for points involved in violations
    const violationsMap = new Map<number, Set<string>>()
    rulesViolations.forEach((v: RuleViolation) => {
      // Handle point violations (rule_1)
      if (v.index !== null && v.index !== undefined) {
        if (!violationsMap.has(v.index)) {
          violationsMap.set(v.index, new Set())
        }
        violationsMap.get(v.index)!.add(v.rule)
      }
      // Handle range violations (rule_2, rule_3, etc.)
      if (v.start_index !== null && v.start_index !== undefined &&
          v.end_index !== null && v.end_index !== undefined) {
        for (let i = v.start_index; i <= v.end_index; i++) {
          if (!violationsMap.has(i)) {
            violationsMap.set(i, new Set())
          }
          violationsMap.get(i)!.add(v.rule)
        }
      }
    })

    return data.data.values.map((value: number, index: number): ChartPointData => {
      const oocPoint = oocMap.get(index)
      const violatedRulesSet = violationsMap.get(index)
      return {
        index: index + 1,  // 1-indexed for user readability
        value,
        isOOC: oocMap.has(index),
        limit: oocPoint?.limit,
        violatedRules: violatedRulesSet ? Array.from(violatedRulesSet) : undefined,
      }
    })
  }, [data])

  if (chartData.length === 0) {
    return null
  }

  const { center, ucl, lcl } = data.data

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const filename = generateExportFilename('carta-i')
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
  const yMin = Math.min(lcl, ...allValues)
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
      <div ref={chartRef} data-testid="i-chart" className="mb-4 bg-card rounded-lg border p-4">
        <h4 className="text-sm font-medium mb-3 text-foreground">Carta I (Valores Individuales)</h4>
        <p className="text-xs text-muted-foreground mb-2">
          Comportamiento del proceso a lo largo del tiempo.
          {oocCount > 0 && (
            <span className="text-red-500 ml-1">
              {oocCount} punto{oocCount > 1 ? 's' : ''} fuera de control.
            </span>
          )}
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 80, left: 30, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="index"
              type="number"
              domain={[0.5, chartData.length + 0.5]}
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              label={{ value: 'Observación', position: 'insideBottom', offset: -20, fontSize: 11 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              domain={[yMin - yPadding, yMax + yPadding]}
              tickFormatter={formatNumber}
              label={{ value: 'Valor', angle: -90, position: 'insideLeft', offset: -5, fontSize: 11 }}
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
                      Observación {point.index}
                    </div>
                    <div>Valor: {formatNumber(point.value)}</div>
                    {point.isOOC && (
                      <div style={{ color: '#EF4444', fontWeight: 600 }}>
                        ⚠️ Fuera de control ({point.limit})
                      </div>
                    )}
                    {point.violatedRules && point.violatedRules.length > 0 && (
                      <div style={{ color: '#F97316', fontSize: '11px', marginTop: '4px' }}>
                        {point.violatedRules.map((rule) => (
                          <div key={rule}>• {RULE_DESCRIPTIONS[rule] || rule}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }}
            />
            {/* Center line (X̄) */}
            <ReferenceLine
              y={center}
              stroke="#10B981"
              strokeWidth={2}
              label={{ value: `X̄: ${formatNumber(center)}`, position: 'right', fontSize: 10, fill: '#10B981' }}
            />
            {/* Upper Control Limit (LCS/UCL) */}
            <ReferenceLine
              y={ucl}
              stroke="#EF4444"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ value: `LCS: ${formatNumber(ucl)}`, position: 'right', fontSize: 10, fill: '#EF4444' }}
            />
            {/* Lower Control Limit (LCI/LCL) */}
            <ReferenceLine
              y={lcl}
              stroke="#EF4444"
              strokeDasharray="5 5"
              strokeWidth={2}
              label={{ value: `LCI: ${formatNumber(lcl)}`, position: 'right', fontSize: 10, fill: '#EF4444' }}
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
        <IChartLegend />
      </div>
    </div>
  )
}
