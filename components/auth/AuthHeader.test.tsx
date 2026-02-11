import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthHeader } from './AuthHeader'

describe('AuthHeader', () => {
  it('renders Setec logo and AI Hub text', () => {
    render(<AuthHeader />)

    // Logo is an Image with alt="Setec"
    expect(screen.getByAltText('Setec')).toBeInTheDocument()
    expect(screen.getByText('AI Hub')).toBeInTheDocument()
  })

  it('renders welcome message', () => {
    render(<AuthHeader />)

    expect(screen.getByText('Bienvenido a Setec AI Hub')).toBeInTheDocument()
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
