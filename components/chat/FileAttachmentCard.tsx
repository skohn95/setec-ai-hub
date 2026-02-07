'use client'

import { FileSpreadsheet, Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/utils/file-validation'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
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

  // Format the upload timestamp
  const uploadTime = formatDistanceToNow(new Date(file.created_at), {
    addSuffix: true,
    locale: es,
  })

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
          {formatFileSize(file.size_bytes)} · {uploadTime}
        </p>
      </div>

      {/* Download button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleDownload}
        disabled={isDownloading}
        className="flex-shrink-0 text-muted-foreground hover:text-foreground hover:bg-orange-100 dark:hover:bg-orange-900/30"
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
