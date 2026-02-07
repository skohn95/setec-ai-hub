import {
  ALLOWED_MIME_TYPES,
  ALLOWED_FILE_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  FILE_VALIDATION_ERRORS,
} from '@/constants/files'

export interface FileValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validates if a file is a valid Excel file within size limits
 * @param file - The file to validate
 * @returns Validation result with valid flag and optional error message in Spanish
 */
export function validateExcelFile(file: File): FileValidationResult {
  // Check file size first (most likely rejection reason)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: FILE_VALIDATION_ERRORS.TOO_LARGE,
    }
  }

  // Check MIME type
  const isValidMimeType = ALLOWED_MIME_TYPES.includes(
    file.type as (typeof ALLOWED_MIME_TYPES)[number]
  )

  // Fallback to file extension check
  const fileName = file.name.toLowerCase()
  const isValidExtension = ALLOWED_FILE_EXTENSIONS.some((ext) => fileName.endsWith(ext))

  if (!isValidMimeType && !isValidExtension) {
    return {
      valid: false,
      error: FILE_VALIDATION_ERRORS.INVALID_TYPE,
    }
  }

  return { valid: true }
}

/**
 * Formats file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "245 KB", "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
