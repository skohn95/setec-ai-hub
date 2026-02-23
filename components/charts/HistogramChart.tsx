'use client'

import { useRef, useState, useMemo } from 'react'
import {
  ComposedChart,
  Bar,
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
import type { HistogramChartData } from '@/types/analysis'

interface HistogramChartProps {
  data: HistogramChartData
}

/**
 * Bin data structure for histogram visualization
 */
interface BinData {
  bin: string
  count: number
  binStart: number
  binEnd: number
  binMidpoint: number
  curveValue?: number  // Expected frequency from fitted distribution
}

/**
 * Calculate normal distribution PDF value
 * f(x) = (1 / (σ * sqrt(2π))) * exp(-0.5 * ((x - μ) / σ)^2)
 */
function normalPDF(x: number, mean: number, std: number): number {
  if (std === 0) return 0
  const coefficient = 1 / (std * Math.sqrt(2 * Math.PI))
  const exponent = -0.5 * Math.pow((x - mean) / std, 2)
  return coefficient * Math.exp(exponent)
}

/**
 * Calculate lognormal distribution PDF value
 * f(x) = (1 / (x * σ * sqrt(2π))) * exp(-0.5 * ((ln(x) - μ) / σ)^2)
 */
function lognormalPDF(x: number, mu: number, sigma: number): number {
  if (x <= 0 || sigma === 0) return 0
  const coefficient = 1 / (x * sigma * Math.sqrt(2 * Math.PI))
  const exponent = -0.5 * Math.pow((Math.log(x) - mu) / sigma, 2)
  return coefficient * Math.exp(exponent)
}

/**
 * Calculate histogram bins using Sturges' rule
 * k = ceil(log2(n) + 1)
 */
function calculateBins(values: number[]): BinData[] {
  if (values.length === 0) return []

  const n = values.length
  const numBins = Math.ceil(Math.log2(n) + 1)

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  const binWidth = range / numBins

  // Handle edge case where all values are the same
  if (range === 0) {
    return [{
      bin: `${min.toFixed(2)}`,
      count: n,
      binStart: min,
      binEnd: min,
      binMidpoint: min,
    }]
  }

  const bins: BinData[] = []
  for (let i = 0; i < numBins; i++) {
    const binStart = min + i * binWidth
    const binEnd = min + (i + 1) * binWidth
    const count = values.filter(v =>
      i === numBins - 1
        ? v >= binStart && v <= binEnd  // Include right edge for last bin
        : v >= binStart && v < binEnd
    ).length
    bins.push({
      bin: `${binStart.toFixed(2)}-${binEnd.toFixed(2)}`,
      count,
      binStart,
      binEnd,
      binMidpoint: (binStart + binEnd) / 2,
    })
  }
  return bins
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
 * Histogram Legend component for specification and control limits
 */
function HistogramLegend({ showCurve, distributionName }: { showCurve?: boolean; distributionName?: string }) {
  // Map distribution names to Spanish display names
  const distNameMap: Record<string, string> = {
    'normal': 'Normal',
    'lognormal': 'Lognormal',
    'weibull': 'Weibull',
    'gamma': 'Gamma',
    'exponential': 'Exponencial',
  }
  const displayName = distributionName
    ? distNameMap[distributionName.toLowerCase()] || distributionName
    : 'Normal'

  return (
    <div
      data-testid="histogram-legend"
      className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mt-2"
    >
      <div className="flex items-center gap-1">
        <div className="w-4 h-0.5 bg-[#EF4444]" />
        <span>LEI / LES (Especificación)</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-4 h-0.5 bg-[#3B82F6]" />
        <span>Media (μ)</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-4 h-0 border-t-2 border-dashed border-[#10B981]" />
        <span>LCI / LCS (Control)</span>
      </div>
      {showCurve && (
        <div className="flex items-center gap-1">
          <div className="w-4 h-0.5 bg-[#F97316]" />
          <span>Curva {displayName}</span>
        </div>
      )}
    </div>
  )
}

/**
 * HistogramChart component displays a histogram with specification limits,
 * control limits, and mean line for Capacidad de Proceso analysis.
 */
export default function HistogramChart({ data }: HistogramChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Calculate bins from raw values with optional distribution curve
  const binData = useMemo(() => {
    if (!data?.data?.values || data.data.values.length === 0) {
      return []
    }

    const bins = calculateBins(data.data.values)
    const n = data.data.values.length
    const { mean, std, fitted_distribution } = data.data

    // Calculate bin width for scaling PDF to histogram
    const binWidth = bins.length > 1 ? bins[1].binMidpoint - bins[0].binMidpoint : 1

    // Add distribution curve values to each bin
    return bins.map(bin => {
      let curveValue: number | undefined

      if (fitted_distribution) {
        // Use fitted distribution (non-normal case)
        if (fitted_distribution.name === 'lognormal' && fitted_distribution.params) {
          const { mu, sigma } = fitted_distribution.params as { mu?: number; sigma?: number }
          if (mu !== undefined && sigma !== undefined) {
            curveValue = lognormalPDF(bin.binMidpoint, mu, sigma) * n * binWidth
          }
        }
        // For other distributions, we could add more PDFs here
        // For now, fall back to normal approximation
        if (curveValue === undefined && std > 0) {
          curveValue = normalPDF(bin.binMidpoint, mean, std) * n * binWidth
        }
      } else if (std > 0) {
        // Use normal distribution (when data is normal or as default)
        curveValue = normalPDF(bin.binMidpoint, mean, std) * n * binWidth
      }

      return { ...bin, curveValue }
    })
  }, [data])

  // Check if we should show the distribution curve
  const showCurve = binData.some(b => b.curveValue !== undefined && b.curveValue > 0)

  if (binData.length === 0) {
    return null
  }

  const { lei, les, mean, lcl, ucl, fitted_distribution } = data.data

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const filename = generateExportFilename('histograma')
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

  // Calculate Y-axis max
  const maxCount = Math.max(...binData.map(b => b.count))
  const yMax = Math.ceil(maxCount * 1.2)

  // Calculate X-axis domain to include all reference lines
  const allXValues = [
    ...binData.map(b => b.binStart),
    ...binData.map(b => b.binEnd),
    lei,
    les,
    mean,
    lcl,
    ucl,
  ].filter((v): v is number => v !== null && v !== undefined)
  const xMin = Math.min(...allXValues)
  const xMax = Math.max(...allXValues)
  const xPadding = (xMax - xMin) * 0.05

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
      <div ref={chartRef} data-testid="histogram-chart" className="mb-4 bg-card rounded-lg border p-4">
        <h4 className="text-sm font-medium mb-3 text-foreground">Histograma de Datos</h4>
        <p className="text-xs text-muted-foreground mb-2">
          Distribución de frecuencias con límites de especificación y control.
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart
            data={binData}
            margin={{ top: 20, right: 80, left: 30, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="binMidpoint"
              type="number"
              domain={[xMin - xPadding, xMax + xPadding]}
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
              tickFormatter={formatNumber}
              label={{ value: 'Valor', position: 'insideBottom', offset: -20, fontSize: 11 }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
              domain={[0, yMax]}
              label={{ value: 'Frecuencia', angle: -90, position: 'insideLeft', offset: -5, fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload[0]) return null
                const bin = payload[0].payload as BinData
                return (
                  <div style={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>Intervalo: {bin.bin}</div>
                    <div>Frecuencia: {bin.count}</div>
                    {bin.curveValue !== undefined && (
                      <div style={{ color: '#F97316' }}>
                        Esperada: {bin.curveValue.toFixed(1)}
                      </div>
                    )}
                  </div>
                )
              }}
            />
            {/* LEI - Lower Specification Limit */}
            <ReferenceLine
              x={lei}
              stroke="#EF4444"
              strokeWidth={2}
              label={{ value: 'LEI', position: 'top', fontSize: 10, fill: '#EF4444' }}
            />
            {/* LES - Upper Specification Limit */}
            <ReferenceLine
              x={les}
              stroke="#EF4444"
              strokeWidth={2}
              label={{ value: 'LES', position: 'top', fontSize: 10, fill: '#EF4444' }}
            />
            {/* Mean */}
            <ReferenceLine
              x={mean}
              stroke="#3B82F6"
              strokeWidth={2}
              label={{ value: 'μ', position: 'top', fontSize: 10, fill: '#3B82F6' }}
            />
            {/* LCI - Lower Control Limit */}
            {lcl !== null && lcl !== undefined && (
              <ReferenceLine
                x={lcl}
                stroke="#10B981"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ value: 'LCI', position: 'top', fontSize: 10, fill: '#10B981' }}
              />
            )}
            {/* LCS - Upper Control Limit */}
            {ucl !== null && ucl !== undefined && (
              <ReferenceLine
                x={ucl}
                stroke="#10B981"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ value: 'LCS', position: 'top', fontSize: 10, fill: '#10B981' }}
              />
            )}
            {/* Histogram bars */}
            <Bar
              dataKey="count"
              fill="rgba(59, 130, 246, 0.6)"
              stroke="#3B82F6"
              strokeWidth={1}
            />
            {/* Distribution curve overlay */}
            {showCurve && (
              <Line
                type="monotone"
                dataKey="curveValue"
                stroke="#F97316"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name={fitted_distribution ? fitted_distribution.name : 'Normal'}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
        <HistogramLegend
          showCurve={showCurve}
          distributionName={fitted_distribution?.name}
        />
      </div>
    </div>
  )
}
