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
  ReferenceLine,
} from 'recharts'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { exportChartToPng, generateExportFilename, ChartExportError } from '@/lib/utils/download-utils'
import type { Hipotesis2MHistogramData } from '@/types/analysis'

interface Hipotesis2MHistogramChartProps {
  data: Hipotesis2MHistogramData
}

interface BinData {
  bin: string
  count: number
  binStart: number
  binEnd: number
  binMidpoint: number
}

function formatNumber(value: number): string {
  if (Math.abs(value) >= 1) {
    return value.toFixed(2)
  }
  return value.toPrecision(2)
}

export default function Hipotesis2MHistogramChart({ data }: Hipotesis2MHistogramChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  const binData = useMemo((): BinData[] => {
    if (!data?.data?.bins || data.data.bins.length === 0) return []

    return data.data.bins.map(bin => ({
      bin: `${formatNumber(bin.start)}-${formatNumber(bin.end)}`,
      count: bin.count,
      binStart: bin.start,
      binEnd: bin.end,
      binMidpoint: (bin.start + bin.end) / 2,
    }))
  }, [data])

  if (binData.length === 0) return null

  const { mean, sampleName, outliers } = data.data

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const filename = generateExportFilename(`histograma-${sampleName.toLowerCase().replace(/\s+/g, '-')}`)
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

  const maxCount = Math.max(...binData.map(b => b.count))
  const yMax = Math.ceil(maxCount * 1.2)

  const allXValues = [
    ...binData.map(b => b.binStart),
    ...binData.map(b => b.binEnd),
    mean,
    ...outliers,
  ]
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
      <div ref={chartRef} data-testid="hipotesis-2m-histogram-chart" className="mb-4 bg-card rounded-lg border p-4">
        <h4 className="text-sm font-medium mb-3 text-foreground">
          Histograma - {sampleName}
        </h4>
        <p className="text-xs text-muted-foreground mb-2">
          Distribución de frecuencias con media.
          {outliers.length > 0 && ` Valores atípicos: ${outliers.length}`}
        </p>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart
            data={binData}
            margin={{ top: 20, right: 20, left: 30, bottom: 30 }}
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
                const item = payload[0].payload as BinData
                return (
                  <div style={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>Intervalo: {item.bin}</div>
                    <div>Frecuencia: {item.count}</div>
                  </div>
                )
              }}
            />
            {/* Mean reference line */}
            <ReferenceLine
              x={mean}
              stroke="#10B981"
              strokeWidth={2}
              label={{ value: 'Media', position: 'top', fontSize: 10, fill: '#10B981' }}
            />
            {/* Outlier reference lines */}
            {outliers.map((outlier, idx) => (
              <ReferenceLine
                key={`outlier-${idx}`}
                x={outlier}
                stroke="#F97316"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            ))}
            {/* Histogram bars */}
            <Bar
              dataKey="count"
              fill="rgba(59, 130, 246, 0.6)"
              stroke="#3B82F6"
              strokeWidth={1}
            />
          </ComposedChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-[#10B981]" />
            <span>Media</span>
          </div>
          {outliers.length > 0 && (
            <div className="flex items-center gap-1">
              <svg width="16" height="2" viewBox="0 0 16 2">
                <line x1="0" y1="1" x2="16" y2="1" stroke="#F97316" strokeWidth="2" strokeDasharray="4 2" />
              </svg>
              <span>Valores Atípicos</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
