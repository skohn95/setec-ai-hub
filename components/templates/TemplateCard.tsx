'use client'

import { Download, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadFile } from '@/lib/utils/download-utils'

export interface TemplateCardProps {
  title: string
  description: string
  filename: string
  downloadPath: string
}

export function TemplateCard({
  title,
  description,
  filename,
  downloadPath,
}: TemplateCardProps) {
  const handleDownload = () => {
    downloadFile(downloadPath, filename)
  }

  return (
    <div
      data-testid="template-card"
      className="group relative flex flex-col p-6 rounded-2xl bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-setec-orange/30 transition-all duration-300"
    >
      {/* Icon badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/20 group-hover:from-setec-orange/20 group-hover:to-orange-100 transition-colors duration-300">
          <FileSpreadsheet className="h-6 w-6 text-setec-orange" />
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
          .xlsx
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>

      {/* Download button */}
      <Button
        onClick={handleDownload}
        className="w-full cursor-pointer bg-gradient-to-r from-setec-orange to-orange-500 hover:from-orange-600 hover:to-setec-orange text-white shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300"
        aria-label={`Descargar ${title}`}
      >
        <Download className="mr-2 h-4 w-4" />
        Descargar Plantilla
      </Button>
    </div>
  )
}
