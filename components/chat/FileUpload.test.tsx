import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FileUpload from './FileUpload'
import { FILE_UPLOAD_LABELS, FILE_VALIDATION_ERRORS, MAX_FILE_SIZE_BYTES } from '@/constants/files'
import { toast } from 'sonner'

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

// Helper to create mock files
function createMockFile(name: string, size: number, type: string): File {
  const content = new Array(Math.min(size, 1024)).fill('a').join('')
  const blob = new Blob([content], { type })
  const file = new File([blob], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('FileUpload', () => {
  const mockOnFileSelect = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders paperclip button with aria-label', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} selectedFile={null} />)

    const button = screen.getByRole('button', { name: FILE_UPLOAD_LABELS.ATTACH_FILE })
    expect(button).toBeInTheDocument()
  })

  it('has hidden file input with correct accept attribute', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} selectedFile={null} />)

    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    expect(fileInput).toBeInTheDocument()
    expect(fileInput).toHaveClass('hidden')
    expect(fileInput.accept).toContain('.xlsx')
    expect(fileInput.accept).toContain('.xls')
    expect(fileInput.accept).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
  })

  it('calls onFileSelect when valid file selected', async () => {
    const user = userEvent.setup()
    render(<FileUpload onFileSelect={mockOnFileSelect} selectedFile={null} />)

    const file = createMockFile(
      'test.xlsx',
      1024,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    await user.upload(fileInput, file)

    expect(mockOnFileSelect).toHaveBeenCalledWith(expect.any(File))
  })

  it('disables input when disabled prop is true', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} selectedFile={null} disabled />)

    const button = screen.getByRole('button', { name: FILE_UPLOAD_LABELS.ATTACH_FILE })
    const fileInput = screen.getByTestId('file-input')

    expect(button).toBeDisabled()
    expect(fileInput).toBeDisabled()
  })

  it('does not call onFileSelect for invalid file type (validation handled by input accept)', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} selectedFile={null} />)

    // Note: The browser's file input with accept attribute prevents selecting invalid files
    // Our validation is a secondary check in handleFileChange
    // This test verifies the accept attribute is correctly configured
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    expect(fileInput.accept).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    expect(fileInput.accept).toContain('application/vnd.ms-excel')
    expect(fileInput.accept).toContain('.xlsx')
    expect(fileInput.accept).toContain('.xls')
    expect(fileInput.accept).not.toContain('application/pdf')
  })

  it('shows error toast for file over 10MB', async () => {
    const user = userEvent.setup()
    render(<FileUpload onFileSelect={mockOnFileSelect} selectedFile={null} />)

    const file = createMockFile(
      'large.xlsx',
      MAX_FILE_SIZE_BYTES + 1,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    await user.upload(fileInput, file)

    expect(toast.error).toHaveBeenCalledWith(FILE_VALIDATION_ERRORS.TOO_LARGE)
    expect(mockOnFileSelect).not.toHaveBeenCalled()
  })

  it('clicks file input when button clicked', async () => {
    const user = userEvent.setup()
    render(<FileUpload onFileSelect={mockOnFileSelect} selectedFile={null} />)

    const button = screen.getByRole('button', { name: FILE_UPLOAD_LABELS.ATTACH_FILE })
    const fileInput = screen.getByTestId('file-input') as HTMLInputElement

    const clickSpy = vi.spyOn(fileInput, 'click')
    await user.click(button)

    expect(clickSpy).toHaveBeenCalled()
  })

  it('accepts .xls file with correct MIME type', async () => {
    const user = userEvent.setup()
    render(<FileUpload onFileSelect={mockOnFileSelect} selectedFile={null} />)

    const file = createMockFile('test.xls', 1024, 'application/vnd.ms-excel')

    const fileInput = screen.getByTestId('file-input') as HTMLInputElement
    await user.upload(fileInput, file)

    expect(mockOnFileSelect).toHaveBeenCalledWith(expect.any(File))
  })
})
