import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FileAttachmentCard from './FileAttachmentCard'
import type { MessageFile } from '@/types/chat'

// Mock the formatFileSize function
vi.mock('@/lib/utils/file-validation', () => ({
  formatFileSize: vi.fn((bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }),
}))

// Mock formatDistanceToNow from date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => 'hace 2 horas'),
}))

vi.mock('date-fns/locale', () => ({
  es: {},
}))

describe('FileAttachmentCard', () => {
  const mockFile: MessageFile = {
    id: 'file-123',
    conversation_id: 'conv-456',
    message_id: 'msg-789',
    storage_path: 'user/conv/file.xlsx',
    original_name: 'plantilla-msa.xlsx',
    mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size_bytes: 250880, // ~245 KB
    status: 'pending',
    created_at: '2024-01-15T10:30:00Z',
  }

  const mockOnDownload = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render file name', () => {
    render(<FileAttachmentCard file={mockFile} onDownload={mockOnDownload} />)

    expect(screen.getByText('plantilla-msa.xlsx')).toBeInTheDocument()
  })

  it('should render formatted file size', () => {
    render(<FileAttachmentCard file={mockFile} onDownload={mockOnDownload} />)

    // Size should be formatted - 250880 bytes = ~245 KB
    expect(screen.getByText(/245/)).toBeInTheDocument()
  })

  it('should render upload timestamp', () => {
    render(<FileAttachmentCard file={mockFile} onDownload={mockOnDownload} />)

    // Should show relative time in Spanish
    expect(screen.getByText(/hace 2 horas/i)).toBeInTheDocument()
  })

  it('should call onDownload when download button is clicked', () => {
    render(<FileAttachmentCard file={mockFile} onDownload={mockOnDownload} />)

    const downloadButton = screen.getByRole('button', { name: /descargar/i })
    fireEvent.click(downloadButton)

    expect(mockOnDownload).toHaveBeenCalledWith('file-123')
  })

  it('should show loading state when isDownloading is true', () => {
    render(
      <FileAttachmentCard
        file={mockFile}
        onDownload={mockOnDownload}
        isDownloading
      />
    )

    const downloadButton = screen.getByRole('button', { name: /descargando/i })
    expect(downloadButton).toBeDisabled()
    // Check for spinner (Loader2 icon with animate-spin class)
    expect(screen.getByTestId('download-spinner')).toBeInTheDocument()
  })

  it('should disable download button when isDownloading is true', () => {
    render(
      <FileAttachmentCard
        file={mockFile}
        onDownload={mockOnDownload}
        isDownloading
      />
    )

    const downloadButton = screen.getByRole('button')
    expect(downloadButton).toBeDisabled()

    fireEvent.click(downloadButton)
    expect(mockOnDownload).not.toHaveBeenCalled()
  })

  it('should render file icon (FileSpreadsheet)', () => {
    render(<FileAttachmentCard file={mockFile} onDownload={mockOnDownload} />)

    expect(screen.getByTestId('file-icon')).toBeInTheDocument()
  })

  it('should format KB correctly', () => {
    const smallFile = { ...mockFile, size_bytes: 1024 } // 1 KB
    render(<FileAttachmentCard file={smallFile} onDownload={mockOnDownload} />)

    expect(screen.getByText(/1\.0 KB/)).toBeInTheDocument()
  })

  it('should format MB correctly', () => {
    const largeFile = { ...mockFile, size_bytes: 5 * 1024 * 1024 } // 5 MB
    render(<FileAttachmentCard file={largeFile} onDownload={mockOnDownload} />)

    expect(screen.getByText(/5\.0 MB/)).toBeInTheDocument()
  })

  it('should be accessible with proper aria-label', () => {
    render(<FileAttachmentCard file={mockFile} onDownload={mockOnDownload} />)

    const downloadButton = screen.getByRole('button')
    expect(downloadButton).toHaveAttribute('aria-label', 'Descargar plantilla-msa.xlsx')
  })
})
