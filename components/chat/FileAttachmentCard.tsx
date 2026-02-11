'use client'

import { FileSpreadsheet, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/utils/file-validation'
import type { MessageFile } from '@/types/chat'

interface FileAttachmentCardProps {
  file: MessageFile
  onDownload: (fileId: string) => void
  isDownloading?: boolean
}

/**
 * FileAttachmentCard displays a file attachment in the chat
 * Shows file name, size, upload time, and download button
 * Follows Setec brand colors: charcoal, orange accents
 */
export default function FileAttachmentCard({
  file,
  onDownload,
  isDownloading = false,
}: FileAttachmentCardProps) {
  const handleDownload = () => {
    if (!isDownloading) {
      onDownload(file.id)
    }
  }


  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border border-border max-w-sm">
      {/* File icon */}
      <div
        className="flex-shrink-0 p-2 bg-green-100 dark:bg-green-900/30 rounded-md"
        data-testid="file-icon"
      >
        <FileSpreadsheet className="h-5 w-5 text-green-600 dark:text-green-400" />
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {file.original_name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size_bytes)}
        </p>
      </div>

      {/* Download button */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex-shrink-0 cursor-pointer bg-setec-orange/10 border-setec-orange/30 text-setec-orange hover:bg-setec-orange hover:text-white hover:border-setec-orange transition-colors"
        aria-label={isDownloading ? 'Descargando...' : `Descargar ${file.original_name}`}
      >
        {isDownloading ? (
          <Loader2 className="h-4 w-4 animate-spin" data-testid="download-spinner" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
