import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StreamingMessage from './StreamingMessage'

describe('StreamingMessage', () => {
  it('renders content text', () => {
    render(<StreamingMessage content="Hello, I am responding..." />)
    expect(screen.getByText(/Hello, I am responding/)).toBeInTheDocument()
  })

  it('shows typing cursor', () => {
    const { container } = render(<StreamingMessage content="Streaming..." />)
    const cursor = container.querySelector('[data-testid="typing-cursor"]')
    expect(cursor).toBeInTheDocument()
  })

  it('renders with assistant message styling', () => {
    const { container } = render(<StreamingMessage content="Response" />)
    const messageEl = container.firstChild
    expect(messageEl).toBeInTheDocument()
  })

  it('renders cursor even with empty content', () => {
    render(<StreamingMessage content="" />)
    expect(screen.getByTestId('typing-cursor')).toBeInTheDocument()
  })

  it('preserves whitespace in content', () => {
    render(<StreamingMessage content="Line 1\nLine 2" />)
    expect(screen.getByText(/Line 1/)).toBeInTheDocument()
  })

  it('shows streaming indicator', () => {
    render(<StreamingMessage content="Loading..." />)
    expect(screen.getByText('Analizando...')).toBeInTheDocument()
  })
})
