import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthHeader } from './AuthHeader'

describe('AuthHeader', () => {
  it('renders Setec logo', () => {
    render(<AuthHeader />)

    expect(screen.getByText('SETEC')).toBeInTheDocument()
    expect(screen.getByText('AI Hub')).toBeInTheDocument()
  })

  it('renders with Setec orange color', () => {
    render(<AuthHeader />)

    const logo = screen.getByText('SETEC')
    expect(logo).toHaveClass('text-setec-orange')
  })

  it('renders title when provided', () => {
    render(<AuthHeader title="Test Title" />)

    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('does not render title when not provided', () => {
    render(<AuthHeader />)

    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument()
  })

  it('renders title with correct styling', () => {
    render(<AuthHeader title="Nueva contraseña" />)

    const title = screen.getByText('Nueva contraseña')
    expect(title).toHaveClass('text-setec-charcoal')
  })
})
