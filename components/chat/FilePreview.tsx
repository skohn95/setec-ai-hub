'use client'

import { FileSpreadsheet, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FILE_UPLOAD_LABELS } from '@/constants/files'
import { formatFileSize } from '@/lib/utils/file-validation'

interface FilePreviewProps {
  file: File
  onRemove: () => void
}

/**
 * FilePreview component displays selected file info as a chip/badge
 * Shows file name, size, and a remove button
 */
export default function FilePreview({ file, onRemove }: FilePreviewProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 mb-2 bg-muted/50 border rounded-lg">
      <FileSpreadsheet className="h-5 w-5 text-green-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium truncate block">{file.name}</span>
        <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="shrink-0 h-6 w-6 text-muted-foreground hover:text-destructive"
        aria-label={FILE_UPLOAD_LABELS.REMOVE_FILE}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
