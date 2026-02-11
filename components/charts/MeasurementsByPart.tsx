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

interface MeasurementsByPartItem {
  part: string
  measurements: number[]
  mean: number
  min: number
  max: number
}

interface MeasurementsByPartProps {
  data: MeasurementsByPartItem[]
}

/**
 * MeasurementsByPart component displays all measurements grouped by part
 * Shows individual measurement points and mean line per part
 * Helps visualize part-to-part variation
 */
export default function MeasurementsByPart({ data }: MeasurementsByPartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  if (!data || data.length === 0) {
    return null
  }

  // Transform data for scatter plot - flatten all measurements with part index
  const scatterData: { partIndex: number; part: string; value: number; measurementIndex: number }[] = []
  data.forEach((item, partIndex) => {
    item.measurements.forEach((value, measurementIndex) => {
      scatterData.push({
        partIndex,
        part: item.part,
        value,
        measurementIndex,
      })
    })
  })

  // Calculate overall mean for reference line
  const overallMean = data.reduce((sum, item) => sum + item.mean, 0) / data.length

  // Calculate Y-axis domain
  const allValues = scatterData.map((d) => d.value)
  const yMin = Math.min(...allValues)
  const yMax = Math.max(...allValues)
  const yPadding = (yMax - yMin) * 0.1

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const filename = generateExportFilename('measurements-part')
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
      <div ref={chartRef} data-testid="measurements-by-part" className="mb-4 bg-card rounded-lg border p-4">
        <h4 className="text-sm font-medium mb-3 text-foreground">Mediciones por Pieza</h4>
        <p className="text-xs text-muted-foreground mb-2">
          Todas las mediciones agrupadas por pieza. La dispersión vertical muestra la variación total del sistema.
        </p>
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={scatterData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="part"
              type="category"
              allowDuplicatedCategory={false}
              tick={{ fontSize: 11 }}
              className="fill-muted-foreground"
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
              formatter={(value, name) => {
                const val = typeof value === 'number' ? value.toFixed(4) : String(value)
                if (name === 'value') return [val, 'Medición']
                if (name === 'mean') return [val, 'Media']
                return [val, String(name)]
              }}
              labelFormatter={(label) => `Pieza: ${label}`}
            />
            {/* Overall mean reference line */}
            <ReferenceLine
              y={overallMean}
              stroke="#10B981"
              strokeDasharray="5 5"
              label={{ value: `Media General=${overallMean.toFixed(4)}`, position: 'right', fontSize: 10, fill: '#10B981' }}
            />
            {/* Scatter points for individual measurements */}
            <Scatter
              dataKey="value"
              fill="#3B82F6"
              shape={(props) => {
                const { cx, cy } = props as { cx?: number; cy?: number }
                if (cx === undefined || cy === undefined) return null
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={4}
                    fill="#3B82F6"
                    fillOpacity={0.6}
                    stroke="#3B82F6"
                    strokeWidth={1}
                  />
                )
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground mt-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-[#3B82F6] opacity-60" />
            <span>Mediciones individuales</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-0.5 bg-[#10B981]" style={{ borderStyle: 'dashed' }} />
            <span>Media General</span>
          </div>
        </div>
      </div>
    </div>
  )
}
