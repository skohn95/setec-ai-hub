import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MessageSkeleton from './MessageSkeleton'

describe('MessageSkeleton', () => {
  it('renders skeleton container', () => {
    render(<MessageSkeleton />)

    const skeleton = screen.getByTestId('message-skeleton')
    expect(skeleton).toBeInTheDocument()
  })

  it('matches ChatMessage layout for assistant messages', () => {
    render(<MessageSkeleton />)

    // Should be left-aligned like assistant messages
    const skeleton = screen.getByTestId('message-skeleton')
    expect(skeleton).toHaveClass('justify-start')
  })

  it('contains skeleton elements for avatar and message', () => {
    render(<MessageSkeleton />)

    // Avatar skeleton
    const avatarSkeleton = screen.getByTestId('skeleton-avatar')
    expect(avatarSkeleton).toBeInTheDocument()

    // Message skeleton
    const messageSkeleton = screen.getByTestId('skeleton-message')
    expect(messageSkeleton).toBeInTheDocument()
  })

  it('applies pulse animation', () => {
    render(<MessageSkeleton />)

    const messageSkeleton = screen.getByTestId('skeleton-message')
    expect(messageSkeleton).toHaveClass('animate-pulse')
  })

  it('renders with correct accessibility attributes', () => {
    render(<MessageSkeleton />)

    const skeleton = screen.getByTestId('message-skeleton')
    expect(skeleton).toHaveAttribute('aria-busy', 'true')
    expect(skeleton).toHaveAttribute('aria-label', 'Cargando mensaje...')
  })
})
