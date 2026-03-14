'use client'

import { useRef, useState, useMemo } from 'react'
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { exportChartToPng, generateExportFilename, ChartExportError } from '@/lib/utils/download-utils'
import type {
  Hipotesis2MBoxplotVarianceData,
  Hipotesis2MBoxplotMeansData,
  Hipotesis2MBoxplotSample,
  Hipotesis2MBoxplotMeansSample,
} from '@/types/analysis'

type BoxplotMode = 'variance' | 'means'

interface BoxplotChartProps {
  mode: BoxplotMode
  data: Hipotesis2MBoxplotVarianceData | Hipotesis2MBoxplotMeansData
}

interface BoxplotDataPoint {
  name: string
  value: number // max value for bar height
  min: number
  q1: number
  median: number
  q3: number
  max: number
  mean: number
  outliers: number[]
  ciLower?: number
  ciUpper?: number
}

function formatNumber(value: number): string {
  if (Math.abs(value) >= 1) {
    return value.toFixed(2)
  }
  return value.toPrecision(2)
}

// Custom BoxPlot shape for rendering inside Recharts Bar
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const BoxPlotShape = (props: any) => {
  const { x, width, payload, yScale, mode } = props
  if (!payload || !yScale) return null

  const { min, q1, median, q3, max, mean, outliers, ciLower, ciUpper } = payload

  const minY = yScale(min)
  const q1Y = yScale(q1)
  const medianY = yScale(median)
  const q3Y = yScale(q3)
  const maxY = yScale(max)
  const meanY = yScale(mean)

  const cx = x + width / 2
  const boxWidth = Math.min(width * 0.6, 40)
  const halfWidth = boxWidth / 2
  const whiskerWidth = boxWidth * 0.4

  return (
    <g>
      {/* Box (IQR: Q1 to Q3) */}
      <rect
        x={cx - halfWidth}
        y={q3Y}
        width={boxWidth}
        height={Math.max(q1Y - q3Y, 1)}
        fill="#3B82F6"
        stroke="#2563EB"
        strokeWidth={1}
        rx={2}
      />
      {/* Median line (red) */}
      <line
        x1={cx - halfWidth}
        y1={medianY}
        x2={cx + halfWidth}
        y2={medianY}
        stroke="#EF4444"
        strokeWidth={2}
      />
      {/* Mean indicator (diamond, green) */}
      <polygon
        points={`${cx},${meanY - 5} ${cx + 5},${meanY} ${cx},${meanY + 5} ${cx - 5},${meanY}`}
        fill="#10B981"
        stroke="#059669"
        strokeWidth={1}
      />
      {/* Lower whisker: Q1 to min */}
      <line x1={cx} y1={q1Y} x2={cx} y2={minY} stroke="#64748B" strokeWidth={2} />
      <line x1={cx - whiskerWidth} y1={minY} x2={cx + whiskerWidth} y2={minY} stroke="#64748B" strokeWidth={2} />
      {/* Upper whisker: Q3 to max */}
      <line x1={cx} y1={q3Y} x2={cx} y2={maxY} stroke="#64748B" strokeWidth={2} />
      <line x1={cx - whiskerWidth} y1={maxY} x2={cx + whiskerWidth} y2={maxY} stroke="#64748B" strokeWidth={2} />
      {/* Outlier dots */}
      {outliers.map((val: number, idx: number) => {
        const oy = yScale(val)
        return (
          <circle
            key={`outlier-${idx}`}
            cx={cx}
            cy={oy}
            r={4}
            fill="#F97316"
            stroke="#EA580C"
            strokeWidth={1}
          />
        )
      })}
      {/* CI markers (means mode only) */}
      {mode === 'means' && ciLower !== undefined && ciUpper !== undefined && (() => {
        const ciLowerY = yScale(ciLower)
        const ciUpperY = yScale(ciUpper)
        const ciOffset = halfWidth + 8
        const capWidth = 6
        return (
          <g>
            {/* Vertical CI line */}
            <line
              x1={cx + ciOffset}
              y1={ciLowerY}
              x2={cx + ciOffset}
              y2={ciUpperY}
              stroke="#8B5CF6"
              strokeWidth={2}
            />
            {/* Lower cap */}
            <line
              x1={cx + ciOffset - capWidth}
              y1={ciLowerY}
              x2={cx + ciOffset + capWidth}
              y2={ciLowerY}
              stroke="#8B5CF6"
              strokeWidth={2}
            />
            {/* Upper cap */}
            <line
              x1={cx + ciOffset - capWidth}
              y1={ciUpperY}
              x2={cx + ciOffset + capWidth}
              y2={ciUpperY}
              stroke="#8B5CF6"
              strokeWidth={2}
            />
          </g>
        )
      })()}
    </g>
  )
}

export default function BoxplotChart({ mode, data }: BoxplotChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  const chartData = useMemo((): BoxplotDataPoint[] => {
    if (!data?.data?.samples || data.data.samples.length < 2) return []

    return data.data.samples.map((sample: Hipotesis2MBoxplotSample | Hipotesis2MBoxplotMeansSample) => {
      const point: BoxplotDataPoint = {
        name: sample.name,
        value: sample.max, // For bar height calculation
        min: sample.min,
        q1: sample.q1,
        median: sample.median,
        q3: sample.q3,
        max: sample.max,
        mean: sample.mean,
        outliers: sample.outliers,
      }
      if (mode === 'means' && 'ciLower' in sample) {
        const meansSample = sample as Hipotesis2MBoxplotMeansSample
        point.ciLower = meansSample.ciLower
        point.ciUpper = meansSample.ciUpper
      }
      return point
    })
  }, [data, mode])

  if (chartData.length === 0) return null

  // Build title with p-value and conclusion
  let title: string
  let subtitle: string
  if (mode === 'variance') {
    const vData = data as Hipotesis2MBoxplotVarianceData
    const pVal = vData.data.leveneTestPValue
    title = `Boxplot - Comparación de Varianzas`
    subtitle = `Levene p=${formatNumber(pVal)}: ${vData.data.leveneConclusion}`
  } else {
    const mData = data as Hipotesis2MBoxplotMeansData
    const pVal = mData.data.tTestPValue
    title = `Boxplot - Comparación de Medias`
    subtitle = `t-test p=${formatNumber(pVal)}: ${mData.data.tTestConclusion}`
  }

  // Calculate Y domain including outliers and CI if present
  const allValues: number[] = []
  chartData.forEach(d => {
    allValues.push(d.min, d.max, d.mean)
    d.outliers.forEach(o => allValues.push(o))
    if (d.ciLower !== undefined) allValues.push(d.ciLower)
    if (d.ciUpper !== undefined) allValues.push(d.ciUpper)
  })
  const yMin = Math.min(...allValues)
  const yMax = Math.max(...allValues)
  const yPadding = (yMax - yMin) * 0.15
  const yDomain: [number, number] = [yMin - yPadding, yMax + yPadding]

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const chartType = mode === 'variance' ? 'boxplot-varianzas' : 'boxplot-medias'
      const filename = generateExportFilename(chartType)
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
      <div ref={chartRef} data-testid={`boxplot-chart-${mode}`} className="mb-4 bg-card rounded-lg border p-4">
        <h4 className="text-sm font-medium mb-1 text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground mb-3">{subtitle}</p>
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart data={chartData} margin={{ top: 20, right: 40, left: 30, bottom: 30 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              domain={yDomain}
              tickFormatter={formatNumber}
              label={{ value: 'Valor', angle: -90, position: 'insideLeft', offset: -5, fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null
                const d = payload[0].payload as BoxplotDataPoint
                return (
                  <div style={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{d.name}</div>
                    <div>Max: {formatNumber(d.max)}</div>
                    <div>Q3: {formatNumber(d.q3)}</div>
                    <div style={{ color: '#EF4444' }}>Mediana: {formatNumber(d.median)}</div>
                    <div style={{ color: '#10B981' }}>Media: {formatNumber(d.mean)}</div>
                    <div>Q1: {formatNumber(d.q1)}</div>
                    <div>Min: {formatNumber(d.min)}</div>
                    {d.outliers.length > 0 && (
                      <div style={{ color: '#F97316' }}>
                        Atípicos: {d.outliers.map(o => formatNumber(o)).join(', ')}
                      </div>
                    )}
                    {mode === 'means' && d.ciLower !== undefined && d.ciUpper !== undefined && (
                      <div style={{ color: '#8B5CF6' }}>
                        IC 95%: [{formatNumber(d.ciLower)}, {formatNumber(d.ciUpper)}]
                      </div>
                    )}
                  </div>
                )
              }}
            />
            <Bar
              dataKey="value"
              shape={(props) => {
                const { background } = props
                if (!background || background.height == null || background.y == null) return null
                const chartHeight = background.height
                const chartY = background.y
                const [domainMin, domainMax] = yDomain
                const yScale = (val: number) => {
                  const ratio = (val - domainMin) / (domainMax - domainMin)
                  return (chartY as number) + chartHeight * (1 - ratio)
                }
                return <BoxPlotShape {...props} yScale={yScale} mode={mode} />
              }}
            >
              {chartData.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill="transparent" />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 rounded bg-[#3B82F6]" />
            <span>IQR (Q1-Q3)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-[#EF4444]" />
            <span>Mediana</span>
          </div>
          <div className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <polygon points="6,1 11,6 6,11 1,6" fill="#10B981" stroke="#059669" strokeWidth="1" />
            </svg>
            <span>Media</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-[#64748B]" />
            <span>Min/Max</span>
          </div>
          {chartData.some(d => d.outliers.length > 0) && (
            <div className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 12 12">
                <circle cx="6" cy="6" r="4" fill="#F97316" stroke="#EA580C" strokeWidth="1" />
              </svg>
              <span>Atípicos</span>
            </div>
          )}
          {mode === 'means' && (
            <div className="flex items-center gap-1">
              <div className="w-4 h-0.5 bg-[#8B5CF6]" />
              <span>IC 95%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
