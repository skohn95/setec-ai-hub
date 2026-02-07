import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import ChatInput from './ChatInput'
import { FILE_UPLOAD_LABELS } from '@/constants/files'

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

// Controlled wrapper component for testing
function ControlledChatInput({
  onSend: externalOnSend,
  disabled,
  isLoading,
  initialValue = '',
  clearOnSend = true,
  initialFile = null,
}: {
  onSend: (content: string, file?: File) => void
  disabled?: boolean
  isLoading?: boolean
  initialValue?: string
  clearOnSend?: boolean
  initialFile?: File | null
}) {
  const [value, setValue] = useState(initialValue)
  const [file, setFile] = useState<File | null>(initialFile)

  const handleSend = (content: string, sentFile?: File) => {
    externalOnSend(content, sentFile)
    if (clearOnSend) {
      setValue('')
      setFile(null)
    }
  }

  return (
    <ChatInput
      value={value}
      onChange={setValue}
      onSend={handleSend}
      disabled={disabled}
      isLoading={isLoading}
      initialFile={file}
      onFileChange={setFile}
    />
  )
}

describe('ChatInput', () => {
  const mockOnSend = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders textarea with placeholder', () => {
    render(<ControlledChatInput onSend={mockOnSend} />)

    const textarea = screen.getByPlaceholderText('Escribe tu mensaje...')
    expect(textarea).toBeInTheDocument()
  })

  it('renders send button', () => {
    render(<ControlledChatInput onSend={mockOnSend} />)

    const button = screen.getByRole('button', { name: /enviar/i })
    expect(button).toBeInTheDocument()
  })

  it('calls onSend with content when send button is clicked', async () => {
    const user = userEvent.setup()
    render(<ControlledChatInput onSend={mockOnSend} />)

    const textarea = screen.getByPlaceholderText('Escribe tu mensaje...')
    await user.type(textarea, 'Hello, world!')

    const button = screen.getByRole('button', { name: /enviar/i })
    await user.click(button)

    expect(mockOnSend).toHaveBeenCalledWith('Hello, world!', undefined)
  })

  it('clears input when parent handles success', async () => {
    const user = userEvent.setup()
    render(<ControlledChatInput onSend={mockOnSend} clearOnSend={true} />)

    const textarea = screen.getByPlaceholderText('Escribe tu mensaje...') as HTMLTextAreaElement
    await user.type(textarea, 'Hello, world!')

    const button = screen.getByRole('button', { name: /enviar/i })
    await user.click(button)

    expect(textarea.value).toBe('')
  })

  it('keeps input content when clearOnSend is false (retry scenario)', async () => {
    const user = userEvent.setup()
    render(<ControlledChatInput onSend={mockOnSend} clearOnSend={false} />)

    const textarea = screen.getByPlaceholderText('Escribe tu mensaje...') as HTMLTextAreaElement
    await user.type(textarea, 'Hello, world!')

    const button = screen.getByRole('button', { name: /enviar/i })
    await user.click(button)

    // Input should keep content for retry
    expect(textarea.value).toBe('Hello, world!')
    expect(mockOnSend).toHaveBeenCalledWith('Hello, world!', undefined)
  })

  it('sends message on Enter key press', async () => {
    const user = userEvent.setup()
    render(<ControlledChatInput onSend={mockOnSend} />)

    const textarea = screen.getByPlaceholderText('Escribe tu mensaje...')
    await user.type(textarea, 'Hello, world!{Enter}')

    expect(mockOnSend).toHaveBeenCalledWith('Hello, world!', undefined)
  })

  it('does not send message on Shift+Enter (adds new line)', async () => {
    const user = userEvent.setup()
    render(<ControlledChatInput onSend={mockOnSend} />)

    const textarea = screen.getByPlaceholderText('Escribe tu mensaje...') as HTMLTextAreaElement
    await user.type(textarea, 'Line 1{Shift>}{Enter}{/Shift}Line 2')

    expect(mockOnSend).not.toHaveBeenCalled()
    expect(textarea.value).toContain('Line 1')
    expect(textarea.value).toContain('Line 2')
  })

  it('does not send empty messages', async () => {
    const user = userEvent.setup()
    render(<ControlledChatInput onSend={mockOnSend} />)

    const button = screen.getByRole('button', { name: /enviar/i })
    await user.click(button)

    expect(mockOnSend).not.toHaveBeenCalled()
  })

  it('does not send whitespace-only messages', async () => {
    const user = userEvent.setup()
    render(<ControlledChatInput onSend={mockOnSend} />)

    const textarea = screen.getByPlaceholderText('Escribe tu mensaje...')
    await user.type(textarea, '   ')

    const button = screen.getByRole('button', { name: /enviar/i })
    await user.click(button)

    expect(mockOnSend).not.toHaveBeenCalled()
  })

  it('disables input when isLoading is true', () => {
    render(<ControlledChatInput onSend={mockOnSend} isLoading={true} />)

    const textarea = screen.getByPlaceholderText('Escribe tu mensaje...')
    expect(textarea).toBeDisabled()
  })

  it('disables send button when isLoading is true', () => {
    render(<ControlledChatInput onSend={mockOnSend} isLoading={true} />)

    const button = screen.getByRole('button', { name: /enviando/i })
    expect(button).toBeDisabled()
  })

  it('shows loading spinner when isLoading is true', () => {
    render(<ControlledChatInput onSend={mockOnSend} isLoading={true} />)

    // Button text changes to "Enviando..."
    const button = screen.getByRole('button', { name: /enviando/i })
    expect(button).toBeInTheDocument()
  })

  it('disables input when disabled prop is true', () => {
    render(<ControlledChatInput onSend={mockOnSend} disabled={true} />)

    const textarea = screen.getByPlaceholderText('Escribe tu mensaje...')
    const button = screen.getByRole('button', { name: /enviar/i })

    expect(textarea).toBeDisabled()
    expect(button).toBeDisabled()
  })

  it('trims whitespace from message before sending', async () => {
    const user = userEvent.setup()
    render(<ControlledChatInput onSend={mockOnSend} />)

    const textarea = screen.getByPlaceholderText('Escribe tu mensaje...')
    await user.type(textarea, '  Hello  ')

    const button = screen.getByRole('button', { name: /enviar/i })
    await user.click(button)

    expect(mockOnSend).toHaveBeenCalledWith('Hello', undefined)
  })

  it('displays value from controlled prop', () => {
    render(<ControlledChatInput onSend={mockOnSend} initialValue="Pre-filled message" />)

    const textarea = screen.getByPlaceholderText('Escribe tu mensaje...') as HTMLTextAreaElement
    expect(textarea.value).toBe('Pre-filled message')
  })

  it('allows user to retry sending the same message after failure', async () => {
    const user = userEvent.setup()
    render(<ControlledChatInput onSend={mockOnSend} clearOnSend={false} />)

    const textarea = screen.getByPlaceholderText('Escribe tu mensaje...')
    await user.type(textarea, 'Retry message')

    const button = screen.getByRole('button', { name: /enviar/i })

    // First attempt
    await user.click(button)
    expect(mockOnSend).toHaveBeenCalledTimes(1)
    expect(mockOnSend).toHaveBeenCalledWith('Retry message', undefined)

    // Second attempt (retry) - message still in input
    await user.click(button)
    expect(mockOnSend).toHaveBeenCalledTimes(2)
    expect(mockOnSend).toHaveBeenLastCalledWith('Retry message', undefined)
  })

  describe('file upload integration', () => {
    it('renders FileUpload component', () => {
      render(<ControlledChatInput onSend={mockOnSend} />)

      const uploadButton = screen.getByRole('button', { name: FILE_UPLOAD_LABELS.ATTACH_FILE })
      expect(uploadButton).toBeInTheDocument()
    })

    it('shows FilePreview when file is selected', async () => {
      const mockFile = createMockFile(
        'test.xlsx',
        1024,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      render(<ControlledChatInput onSend={mockOnSend} initialFile={mockFile} />)

      // FilePreview should be visible
      expect(screen.getByText('test.xlsx')).toBeInTheDocument()
      expect(screen.getByText('(1.0 KB)')).toBeInTheDocument()
    })

    it('enables send button when only file is selected (no message)', async () => {
      const mockFile = createMockFile(
        'test.xlsx',
        1024,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      render(<ControlledChatInput onSend={mockOnSend} initialFile={mockFile} />)

      const sendButton = screen.getByRole('button', { name: /enviar/i })
      // Button should be enabled because we have a file
      expect(sendButton).not.toBeDisabled()
    })

    it('calls onSend with file parameter', async () => {
      const user = userEvent.setup()
      const mockFile = createMockFile(
        'test.xlsx',
        1024,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      render(<ControlledChatInput onSend={mockOnSend} initialFile={mockFile} />)

      const sendButton = screen.getByRole('button', { name: /enviar/i })
      await user.click(sendButton)

      expect(mockOnSend).toHaveBeenCalledWith('', expect.any(File))
    })

    it('clears file after successful send', async () => {
      const user = userEvent.setup()
      const mockFile = createMockFile(
        'test.xlsx',
        1024,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      render(<ControlledChatInput onSend={mockOnSend} initialFile={mockFile} />)

      // Verify file is shown
      expect(screen.getByText('test.xlsx')).toBeInTheDocument()

      const sendButton = screen.getByRole('button', { name: /enviar/i })
      await user.click(sendButton)

      // File preview should be removed after send
      expect(screen.queryByText('test.xlsx')).not.toBeInTheDocument()
    })

    it('removes file when remove button is clicked', async () => {
      const user = userEvent.setup()
      const mockFile = createMockFile(
        'test.xlsx',
        1024,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      render(<ControlledChatInput onSend={mockOnSend} initialFile={mockFile} />)

      // Verify file is shown
      expect(screen.getByText('test.xlsx')).toBeInTheDocument()

      const removeButton = screen.getByRole('button', { name: FILE_UPLOAD_LABELS.REMOVE_FILE })
      await user.click(removeButton)

      // File preview should be removed
      expect(screen.queryByText('test.xlsx')).not.toBeInTheDocument()
    })
  })
})
