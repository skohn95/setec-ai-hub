import { describe, it, expect } from 'vitest'
import { validateExcelFile, formatFileSize } from './file-validation'
import { MAX_FILE_SIZE_BYTES, FILE_VALIDATION_ERRORS } from '@/constants/files'

// Helper to create mock files
// Uses Object.defineProperty to set size without actually allocating memory
function createMockFile(
  name: string,
  size: number,
  type: string
): File {
  // Only create small blob content, then override size property
  const content = 'mock-file-content'
  const blob = new Blob([content], { type })
  const file = new File([blob], name, { type })
  // Override the size property to simulate large files without memory allocation
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('validateExcelFile', () => {
  describe('valid files', () => {
    it('accepts valid .xlsx file with correct MIME type', () => {
      const file = createMockFile(
        'test.xlsx',
        1024,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )

      const result = validateExcelFile(file)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('accepts valid .xls file with correct MIME type', () => {
      const file = createMockFile('test.xls', 1024, 'application/vnd.ms-excel')

      const result = validateExcelFile(file)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('accepts file at exactly 10MB size limit', () => {
      const file = createMockFile(
        'test.xlsx',
        MAX_FILE_SIZE_BYTES,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )

      const result = validateExcelFile(file)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('accepts .xlsx file with unknown MIME type (extension fallback)', () => {
      // Some browsers may report different MIME types
      const file = createMockFile('test.xlsx', 1024, 'application/octet-stream')

      const result = validateExcelFile(file)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('accepts .xls file with unknown MIME type (extension fallback)', () => {
      const file = createMockFile('test.xls', 1024, '')

      const result = validateExcelFile(file)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe('invalid file types', () => {
    it('rejects PDF file with Spanish error message', () => {
      const file = createMockFile('document.pdf', 1024, 'application/pdf')

      const result = validateExcelFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE)
    })

    it('rejects CSV file', () => {
      const file = createMockFile('data.csv', 1024, 'text/csv')

      const result = validateExcelFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE)
    })

    it('rejects image file', () => {
      const file = createMockFile('photo.png', 1024, 'image/png')

      const result = validateExcelFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE)
    })

    it('rejects file with no extension and wrong MIME type', () => {
      const file = createMockFile('noextension', 1024, 'text/plain')

      const result = validateExcelFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE)
    })
  })

  describe('file size validation', () => {
    it('rejects file over 10MB with Spanish error message', () => {
      const file = createMockFile(
        'large.xlsx',
        MAX_FILE_SIZE_BYTES + 1,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )

      const result = validateExcelFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toBe(FILE_VALIDATION_ERRORS.TOO_LARGE)
    })

    it('rejects very large file', () => {
      const file = createMockFile(
        'huge.xlsx',
        50 * 1024 * 1024, // 50MB
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )

      const result = validateExcelFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toBe(FILE_VALIDATION_ERRORS.TOO_LARGE)
    })

    it('prioritizes size error over type error', () => {
      // If a file is both too large and wrong type, show size error first
      const file = createMockFile('large.pdf', MAX_FILE_SIZE_BYTES + 1, 'application/pdf')

      const result = validateExcelFile(file)

      expect(result.valid).toBe(false)
      expect(result.error).toBe(FILE_VALIDATION_ERRORS.TOO_LARGE)
    })
  })
})

describe('formatFileSize', () => {
  it('formats bytes correctly', () => {
    expect(formatFileSize(512)).toBe('512 B')
    expect(formatFileSize(0)).toBe('0 B')
    expect(formatFileSize(1023)).toBe('1023 B')
  })

  it('formats kilobytes correctly', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB')
    expect(formatFileSize(1536)).toBe('1.5 KB')
    expect(formatFileSize(245 * 1024)).toBe('245.0 KB')
    expect(formatFileSize(1024 * 1024 - 1)).toBe('1024.0 KB')
  })

  it('formats megabytes correctly', () => {
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB')
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB')
    expect(formatFileSize(10 * 1024 * 1024)).toBe('10.0 MB')
  })
})
