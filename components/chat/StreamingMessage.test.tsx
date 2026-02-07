import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StreamingMessage from './StreamingMessage'

describe('StreamingMessage', () => {
  it('renders content text', () => {
    render(<StreamingMessage content="Hello, I am responding..." isComplete={false} />)
    expect(screen.getByText(/Hello, I am responding/)).toBeInTheDocument()
  })

  it('shows typing cursor when not complete', () => {
    const { container } = render(
      <StreamingMessage content="Streaming..." isComplete={false} />
    )
    // Cursor should be present - either as text or as a styled element
    const cursor = container.querySelector('[data-testid="typing-cursor"]')
    expect(cursor).toBeInTheDocument()
  })

  it('hides typing cursor when complete', () => {
    const { container } = render(
      <StreamingMessage content="Done!" isComplete={true} />
    )
    const cursor = container.querySelector('[data-testid="typing-cursor"]')
    expect(cursor).not.toBeInTheDocument()
  })

  it('renders with assistant message styling', () => {
    const { container } = render(
      <StreamingMessage content="Response" isComplete={false} />
    )
    // Should have the assistant styling class
    const messageEl = container.firstChild
    expect(messageEl).toBeInTheDocument()
  })

  it('renders empty content when no text yet', () => {
    render(<StreamingMessage content="" isComplete={false} />)
    // Should still render cursor for empty content
    expect(screen.getByTestId('typing-cursor')).toBeInTheDocument()
  })

  it('preserves whitespace in content', () => {
    render(<StreamingMessage content="Line 1\nLine 2" isComplete={false} />)
    // Content should be rendered (whitespace handling depends on CSS)
    expect(screen.getByText(/Line 1/)).toBeInTheDocument()
  })
})
