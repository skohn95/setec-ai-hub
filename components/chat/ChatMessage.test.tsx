import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChatMessage from './ChatMessage'
import type { MessageRowWithFiles } from '@/lib/supabase/messages'
import type { MessageFile } from '@/types/chat'

// Mock react-markdown to simplify testing - renders content with basic markdown parsing
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => {
    // Basic markdown parsing for bold text (**text**)
    const parts = children.split(/(\*\*[^*]+\*\*)/g)
    return (
      <div data-testid="markdown-content">
        {parts.map((part, index) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index}>{part.slice(2, -2)}</strong>
          }
          return <span key={index}>{part}</span>
        })}
      </div>
    )
  },
}))

vi.mock('remark-gfm', () => ({
  default: () => {},
}))

const createMessage = (overrides: Partial<MessageRowWithFiles> = {}): MessageRowWithFiles => ({
  id: 'msg-1',
  conversation_id: '123e4567-e89b-12d3-a456-426614174000',
  role: 'user',
  content: 'Hello, world!',
  metadata: {},
  created_at: '2026-02-04T10:30:00Z',
  files: [],
  ...overrides,
})

const createMockFile = (overrides: Partial<MessageFile> = {}): MessageFile => ({
  id: 'file-1',
  conversation_id: '123e4567-e89b-12d3-a456-426614174000',
  message_id: 'msg-1',
  storage_path: 'user/conv/file.xlsx',
  original_name: 'test-file.xlsx',
  mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  size_bytes: 1024,
  status: 'pending',
  created_at: '2026-02-04T10:30:00Z',
  ...overrides,
})

describe('ChatMessage', () => {
  it('renders user message content', () => {
    const message = createMessage({ content: 'Test user message' })
    render(<ChatMessage message={message} />)

    expect(screen.getByText('Test user message')).toBeInTheDocument()
  })

  it('renders assistant message content', () => {
    const message = createMessage({ role: 'assistant', content: 'Test assistant message' })
    render(<ChatMessage message={message} />)

    expect(screen.getByText('Test assistant message')).toBeInTheDocument()
  })

  it('renders user messages aligned to the right', () => {
    const message = createMessage({ role: 'user' })
    const { container } = render(<ChatMessage message={message} />)

    // User messages are aligned to items-end
    const flexContainer = container.querySelector('.items-end')
    expect(flexContainer).toBeInTheDocument()
  })

  it('renders assistant messages aligned to the left', () => {
    const message = createMessage({ role: 'assistant' })
    const { container } = render(<ChatMessage message={message} />)

    // Assistant messages are aligned to items-start
    const flexContainer = container.querySelector('.items-start')
    expect(flexContainer).toBeInTheDocument()
  })

  it('renders user message bubble aligned right', () => {
    const message = createMessage({ role: 'user' })
    const { container } = render(<ChatMessage message={message} />)

    // User messages should be aligned to the end (right)
    const flexContainer = container.querySelector('.items-end')
    expect(flexContainer).toBeInTheDocument()
  })

  it('renders assistant message bubble aligned left', () => {
    const message = createMessage({ role: 'assistant' })
    const { container } = render(<ChatMessage message={message} />)

    // Assistant messages should be aligned to the start (left)
    const flexContainer = container.querySelector('.items-start')
    expect(flexContainer).toBeInTheDocument()
  })

  it('shows timestamp inline', () => {
    const message = createMessage({ created_at: '2026-02-04T10:30:00Z' })
    render(<ChatMessage message={message} />)

    // Timestamp should be displayed inline (HH:MM format, timezone-agnostic check)
    // Using regex to match time format since actual value depends on local timezone
    expect(screen.getByText(/^\d{2}:\d{2}$/)).toBeInTheDocument()
  })

  it('applies user message styling', () => {
    const message = createMessage({ role: 'user' })
    render(<ChatMessage message={message} />)

    const bubble = screen.getByTestId('message-bubble')
    // User messages should have setec-orange background color
    expect(bubble).toHaveClass('bg-setec-orange')
  })

  it('applies assistant message styling', () => {
    const message = createMessage({ role: 'assistant' })
    render(<ChatMessage message={message} />)

    const bubble = screen.getByTestId('message-bubble')
    // Assistant messages should have gray background bubble
    expect(bubble).toHaveClass('bg-gray-100')
  })

  it('renders with correct accessibility attributes', () => {
    const message = createMessage({ content: 'Accessible message' })
    render(<ChatMessage message={message} />)

    const container = screen.getByTestId('chat-message')
    expect(container).toHaveAttribute('role', 'listitem')
  })

  describe('file attachments', () => {
    const mockOnDownload = vi.fn()

    it('renders file attachment when present', () => {
      const file = createMockFile({ original_name: 'attached-file.xlsx' })
      const message = createMessage({ files: [file] })

      render(<ChatMessage message={message} onDownload={mockOnDownload} />)

      expect(screen.getByText('attached-file.xlsx')).toBeInTheDocument()
    })

    it('renders multiple file attachments', () => {
      const files = [
        createMockFile({ id: 'f1', original_name: 'file1.xlsx' }),
        createMockFile({ id: 'f2', original_name: 'file2.xlsx' }),
      ]
      const message = createMessage({ files })

      render(<ChatMessage message={message} onDownload={mockOnDownload} />)

      expect(screen.getByText('file1.xlsx')).toBeInTheDocument()
      expect(screen.getByText('file2.xlsx')).toBeInTheDocument()
    })

    it('does not render file section when no files attached', () => {
      const message = createMessage({ files: [] })
      render(<ChatMessage message={message} onDownload={mockOnDownload} />)

      expect(screen.queryByTestId('file-attachments')).not.toBeInTheDocument()
    })

    it('handles message without files array', () => {
      const message = createMessage()
      // Remove files to simulate old messages
      delete (message as { files?: MessageFile[] }).files

      render(<ChatMessage message={message} onDownload={mockOnDownload} />)

      expect(screen.queryByTestId('file-attachments')).not.toBeInTheDocument()
    })

    it('positions file cards above message content', () => {
      const file = createMockFile({ original_name: 'test.xlsx' })
      const message = createMessage({ content: 'Message content', files: [file] })

      const { container } = render(<ChatMessage message={message} onDownload={mockOnDownload} />)

      // Get the rendered HTML and verify file appears before message
      const html = container.innerHTML

      const filePosition = html.indexOf('file-attachments')
      const bubblePosition = html.indexOf('message-bubble')

      // File section should appear before the message bubble in the DOM
      expect(filePosition).toBeGreaterThan(-1)
      expect(bubblePosition).toBeGreaterThan(-1)
      expect(filePosition).toBeLessThan(bubblePosition)
    })
  })

  describe('chart data rendering', () => {
    const mockVariationBreakdownData = [
      {
        type: 'variationBreakdown',
        data: [
          { source: 'Repetibilidad', percentage: 15.5, color: '#3B82F6' },
          { source: 'Reproducibilidad', percentage: 8.2, color: '#F97316' },
          { source: 'Parte a Parte', percentage: 76.3, color: '#10B981' },
          { source: 'GRR Total', percentage: 23.7, color: '#F59E0B' },
        ],
      },
    ]

    const mockOperatorComparisonData = [
      {
        type: 'operatorComparison',
        data: [
          { operator: 'Op1', mean: 10.5, stdDev: 0.23 },
          { operator: 'Op2', mean: 10.8, stdDev: 0.31 },
          { operator: 'Op3', mean: 10.6, stdDev: 0.19 },
        ],
      },
    ]

    const mockChartData = mockVariationBreakdownData

    it('renders chart when chartData is present in metadata', () => {
      const message = createMessage({
        role: 'assistant',
        content: 'Análisis completado',
        metadata: { chartData: mockChartData },
      })

      render(<ChatMessage message={message} />)

      expect(screen.getByTestId('variation-breakdown-chart')).toBeInTheDocument()
    })

    it('does not render chart when chartData is not present', () => {
      const message = createMessage({
        role: 'assistant',
        content: 'Normal message',
        metadata: {},
      })

      render(<ChatMessage message={message} />)

      expect(screen.queryByTestId('variation-breakdown-chart')).not.toBeInTheDocument()
    })

    it('does not render chart for user messages even with chartData', () => {
      const message = createMessage({
        role: 'user',
        content: 'User message',
        metadata: { chartData: mockChartData },
      })

      render(<ChatMessage message={message} />)

      // Charts should only be shown for assistant messages
      expect(screen.queryByTestId('variation-breakdown-chart')).not.toBeInTheDocument()
    })

    it('positions chart after message content', () => {
      const message = createMessage({
        role: 'assistant',
        content: 'Análisis completado',
        metadata: { chartData: mockChartData },
      })

      const { container } = render(<ChatMessage message={message} />)
      const html = container.innerHTML

      const bubblePosition = html.indexOf('message-bubble')
      const chartPosition = html.indexOf('variation-breakdown-chart')

      // Chart should appear after the message bubble
      expect(bubblePosition).toBeGreaterThan(-1)
      expect(chartPosition).toBeGreaterThan(-1)
      expect(chartPosition).toBeGreaterThan(bubblePosition)
    })

    it('renders operator comparison chart when operatorComparison data is present', () => {
      const message = createMessage({
        role: 'assistant',
        content: 'Análisis completado',
        metadata: { chartData: mockOperatorComparisonData },
      })

      render(<ChatMessage message={message} />)

      expect(screen.getByTestId('operator-comparison-chart')).toBeInTheDocument()
    })

    it('renders VariationChart derived from operatorComparison data', () => {
      const message = createMessage({
        role: 'assistant',
        content: 'Análisis completado',
        metadata: { chartData: mockOperatorComparisonData },
      })

      render(<ChatMessage message={message} />)

      // VariationChart should be rendered when operatorComparison data is present
      expect(screen.getByTestId('variation-chart')).toBeInTheDocument()
    })

    it('renders both chart types when both data types are present', () => {
      const bothChartTypes = [...mockVariationBreakdownData, ...mockOperatorComparisonData]
      const message = createMessage({
        role: 'assistant',
        content: 'Análisis completado',
        metadata: { chartData: bothChartTypes },
      })

      render(<ChatMessage message={message} />)

      expect(screen.getByTestId('variation-breakdown-chart')).toBeInTheDocument()
      expect(screen.getByTestId('operator-comparison-chart')).toBeInTheDocument()
    })

    it('renders GRR classification badge with chart data', () => {
      const message = createMessage({
        role: 'assistant',
        content: 'Análisis completado',
        metadata: { chartData: mockVariationBreakdownData },
      })

      render(<ChatMessage message={message} />)

      // Should show the GRR classification badge
      expect(screen.getByTestId('grr-classification-badge')).toBeInTheDocument()
      expect(screen.getByText(/GRR Total.*23\.7%/)).toBeInTheDocument()
    })

    it('renders charts correctly on conversation reload (from message metadata)', () => {
      // Simulates a message loaded from database with chart data in metadata
      const reloadedMessage = createMessage({
        role: 'assistant',
        content: 'Análisis del sistema de medición completado.',
        metadata: {
          chartData: mockVariationBreakdownData,
          results: {
            grr_percent: 23.7,
            repeatability_percent: 15.5,
            reproducibility_percent: 8.2,
            part_to_part_percent: 76.3,
            ndc: 4,
            classification: 'marginal',
          },
        },
      })

      render(<ChatMessage message={reloadedMessage} />)

      // Charts should render from metadata
      expect(screen.getByTestId('variation-breakdown-chart')).toBeInTheDocument()
      expect(screen.getByTestId('grr-classification-badge')).toBeInTheDocument()
    })
  })

  describe('markdown formatting for assistant messages', () => {
    it('renders bold text with strong tags', () => {
      const message = createMessage({
        role: 'assistant',
        content: 'El **%GRR** es 18.2%',
      })

      render(<ChatMessage message={message} />)

      const strongElement = screen.getByText('%GRR')
      expect(strongElement.tagName).toBe('STRONG')
    })

    it('renders multiple bold sections', () => {
      const message = createMessage({
        role: 'assistant',
        content: 'La **repetibilidad** y **reproducibilidad** son importantes',
      })

      render(<ChatMessage message={message} />)

      expect(screen.getByText('repetibilidad').tagName).toBe('STRONG')
      expect(screen.getByText('reproducibilidad').tagName).toBe('STRONG')
    })

    it('does not apply markdown formatting to user messages', () => {
      const message = createMessage({
        role: 'user',
        content: 'This is **bold** text',
      })

      render(<ChatMessage message={message} />)

      // The text should appear literally with asterisks
      expect(screen.getByText('This is **bold** text')).toBeInTheDocument()
    })
  })

  describe('results display for analysis', () => {
    const mockResults = {
      grr_percent: 18.2,
      repeatability_percent: 12.5,
      reproducibility_percent: 13.2,
      part_to_part_percent: 98.3,
      ndc: 4,
      classification: 'marginal' as const,
    }

    const mockChartData = [
      {
        type: 'variationBreakdown',
        data: [
          { source: 'Repetibilidad', percentage: 12.5, color: '#3B82F6' },
        ],
      },
    ]

    it('renders charts when chartData is present in metadata', () => {
      const message = createMessage({
        role: 'assistant',
        content: 'Análisis completado',
        metadata: { chartData: mockChartData },
      })

      render(<ChatMessage message={message} />)

      expect(screen.getByTestId('analysis-results-container')).toBeInTheDocument()
    })

    it('does not render charts container without chartData', () => {
      const message = createMessage({
        role: 'assistant',
        content: 'Normal message',
        metadata: {},
      })

      render(<ChatMessage message={message} />)

      expect(screen.queryByTestId('analysis-results-container')).not.toBeInTheDocument()
    })
  })

  describe('visual delineation for analysis results', () => {
    const mockChartData = [
      {
        type: 'variationBreakdown',
        data: [
          { source: 'Repetibilidad', percentage: 12.5, color: '#3B82F6' },
          { source: 'GRR Total', percentage: 18.0, color: '#F59E0B' },
        ],
      },
    ]

    it('wraps analysis results in a container matching message bubble style', () => {
      const message = createMessage({
        role: 'assistant',
        content: 'Análisis completado',
        metadata: { chartData: mockChartData },
      })

      render(<ChatMessage message={message} />)

      const container = screen.getByTestId('analysis-results-container')
      expect(container).toBeInTheDocument()
      expect(container).toHaveClass('bg-gray-100')
      expect(container).toHaveClass('rounded-2xl')
    })

    it('renders analysis container after message bubble', () => {
      const message = createMessage({
        role: 'assistant',
        content: 'Análisis completado',
        metadata: { chartData: mockChartData },
      })

      const { container } = render(<ChatMessage message={message} />)
      const html = container.innerHTML

      const bubblePosition = html.indexOf('message-bubble')
      const containerPosition = html.indexOf('analysis-results-container')

      // Container should appear after the message bubble
      expect(bubblePosition).toBeGreaterThan(-1)
      expect(containerPosition).toBeGreaterThan(-1)
      expect(containerPosition).toBeGreaterThan(bubblePosition)
    })

    it('does not render container for messages without analysis data', () => {
      const message = createMessage({
        role: 'assistant',
        content: 'Normal message without analysis',
        metadata: {},
      })

      render(<ChatMessage message={message} />)

      expect(screen.queryByTestId('analysis-results-container')).not.toBeInTheDocument()
    })

    it('renders charts within the container', () => {
      const message = createMessage({
        role: 'assistant',
        content: 'Análisis completado',
        metadata: { chartData: mockChartData },
      })

      render(<ChatMessage message={message} />)

      const container = screen.getByTestId('analysis-results-container')
      expect(container.querySelector('[data-testid="variation-breakdown-chart"]')).toBeInTheDocument()
    })
  })
})
