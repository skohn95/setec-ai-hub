'use client'

import { useRef, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { StaticChartDataItem } from '@/types/api'
import { CHART_TYPE_LABELS } from '@/types/api'

interface StaticChartDisplayProps {
  charts: StaticChartDataItem[]
}

/**
 * Download a base64 image as a PNG file
 */
function downloadImage(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Single chart card with download button
 */
function ChartCard({ chart }: { chart: StaticChartDataItem }) {
  const [isDownloading, setIsDownloading] = useState(false)
  const label = CHART_TYPE_LABELS[chart.type] || chart.type

  const handleDownload = () => {
    setIsDownloading(true)
    try {
      const timestamp = new Date().toISOString().slice(0, 10)
      const filename = `msa-${chart.type}-${timestamp}.png`
      downloadImage(chart.image, filename)
      toast.success('Imagen descargada')
    } catch (error) {
      console.error('Download failed:', error)
      toast.error('Error al descargar la imagen')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="relative group">
      <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="outline"
          size="icon"
          onClick={handleDownload}
          disabled={isDownloading}
          title="Descargar como imagen"
          className="bg-white/90 dark:bg-gray-800/90"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
      </div>
      <figure className="bg-card rounded-lg border overflow-hidden">
        <img
          src={chart.image}
          alt={label}
          className="w-full h-auto"
          loading="lazy"
        />
        <figcaption className="sr-only">{label}</figcaption>
      </figure>
    </div>
  )
}

/**
 * StaticChartDisplay renders server-generated chart images
 * Replaces dynamic Recharts components with static PNG images
 */
export default function StaticChartDisplay({ charts }: StaticChartDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isExportingAll, setIsExportingAll] = useState(false)

  if (!charts || charts.length === 0) {
    return null
  }

  const handleExportAll = () => {
    setIsExportingAll(true)
    try {
      const timestamp = new Date().toISOString().slice(0, 10)
      charts.forEach((chart, index) => {
        setTimeout(() => {
          const filename = `msa-${chart.type}-${timestamp}.png`
          downloadImage(chart.image, filename)
        }, index * 200) // Stagger downloads to avoid browser issues
      })
      toast.success(`${charts.length} imágenes descargadas`)
    } catch (error) {
      console.error('Export all failed:', error)
      toast.error('Error al exportar las imágenes')
    } finally {
      setIsExportingAll(false)
    }
  }

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Header with export all button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          Gráficos del Análisis MSA
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportAll}
          disabled={isExportingAll}
          className="text-xs"
        >
          {isExportingAll ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Exportando...
            </>
          ) : (
            <>
              <Download className="h-3 w-3 mr-1" />
              Exportar todos
            </>
          )}
        </Button>
      </div>

      {/* Charts grid */}
      <div className="grid gap-4">
        {charts.map((chart) => (
          <ChartCard key={chart.type} chart={chart} />
        ))}
      </div>
    </div>
  )
}
