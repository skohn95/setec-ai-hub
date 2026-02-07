'use client'

import { useRef, useCallback, ChangeEvent } from 'react'
import { Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  ALLOWED_FILE_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  FILE_UPLOAD_LABELS,
} from '@/constants/files'
import { validateExcelFile } from '@/lib/utils/file-validation'
import { toast } from 'sonner'

interface FileUploadProps {
  onFileSelect: (file: File | null) => void
  selectedFile: File | null
  disabled?: boolean
}

/**
 * FileUpload component for selecting Excel files
 * Provides a paperclip button that triggers a hidden file input
 * Validates files on selection and displays errors via toast
 */
export default function FileUpload({
  onFileSelect,
  // selectedFile kept for future use (e.g., visual indication of selected state)
  disabled = false,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const validation = validateExcelFile(file)
      if (!validation.valid) {
        toast.error(validation.error)
        // Reset file input so the same file can be selected again
        e.target.value = ''
        return
      }

      onFileSelect(file)
      // Reset file input for future selections
      e.target.value = ''
    },
    [onFileSelect]
  )

  // Build accept attribute for file input
  const acceptAttribute = [
    ...ALLOWED_MIME_TYPES,
    ...ALLOWED_FILE_EXTENSIONS,
  ].join(',')

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptAttribute}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
        data-testid="file-input"
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleButtonClick}
            disabled={disabled}
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={FILE_UPLOAD_LABELS.ATTACH_FILE}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <span>{FILE_UPLOAD_LABELS.ATTACH_FILE}</span>
        </TooltipContent>
      </Tooltip>
    </>
  )
}
