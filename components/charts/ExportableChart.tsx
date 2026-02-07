'use client'

import { useRef, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportChartToPng, generateExportFilename } from '@/lib/utils/download-utils'

interface ExportableChartProps {
  children: React.ReactNode
  title?: string
  analysisType: string
  className?: string
}

/**
 * ExportableChart wrapper component
 * Provides PNG export functionality for any chart content
 * Includes download button with loading state
 */
export default function ExportableChart({
  children,
  title,
  analysisType,
  className = '',
}: ExportableChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const filename = generateExportFilename(analysisType)
      await exportChartToPng(chartRef, filename)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="relative" data-testid="exportable-chart">
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
      <div ref={chartRef} className={`bg-white p-4 ${className}`}>
        {title && <h4 className="text-sm font-medium mb-3">{title}</h4>}
        {children}
      </div>
    </div>
  )
}
