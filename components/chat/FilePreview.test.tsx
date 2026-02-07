import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FilePreview from './FilePreview'
import { FILE_UPLOAD_LABELS } from '@/constants/files'

// Helper to create mock files
function createMockFile(name: string, size: number, type: string): File {
  const content = new Array(Math.min(size, 1024)).fill('a').join('')
  const blob = new Blob([content], { type })
  const file = new File([blob], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('FilePreview', () => {
  const mockOnRemove = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays file name', () => {
    const file = createMockFile('plantilla-msa.xlsx', 1024, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    render(<FilePreview file={file} onRemove={mockOnRemove} />)

    expect(screen.getByText('plantilla-msa.xlsx')).toBeInTheDocument()
  })

  it('displays file size in bytes', () => {
    const file = createMockFile('test.xlsx', 512, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    render(<FilePreview file={file} onRemove={mockOnRemove} />)

    expect(screen.getByText('(512 B)')).toBeInTheDocument()
  })

  it('displays file size in KB', () => {
    const file = createMockFile('test.xlsx', 245 * 1024, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    render(<FilePreview file={file} onRemove={mockOnRemove} />)

    expect(screen.getByText('(245.0 KB)')).toBeInTheDocument()
  })

  it('displays file size in MB', () => {
    const file = createMockFile('test.xlsx', 1.5 * 1024 * 1024, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    render(<FilePreview file={file} onRemove={mockOnRemove} />)

    expect(screen.getByText('(1.5 MB)')).toBeInTheDocument()
  })

  it('calls onRemove when X button clicked', async () => {
    const user = userEvent.setup()
    const file = createMockFile('test.xlsx', 1024, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    render(<FilePreview file={file} onRemove={mockOnRemove} />)

    const removeButton = screen.getByRole('button', { name: FILE_UPLOAD_LABELS.REMOVE_FILE })
    await user.click(removeButton)

    expect(mockOnRemove).toHaveBeenCalledTimes(1)
  })

  it('renders remove button with correct aria-label', () => {
    const file = createMockFile('test.xlsx', 1024, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    render(<FilePreview file={file} onRemove={mockOnRemove} />)

    const removeButton = screen.getByRole('button', { name: FILE_UPLOAD_LABELS.REMOVE_FILE })
    expect(removeButton).toBeInTheDocument()
  })
})
