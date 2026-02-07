import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from './Footer'

describe('Footer', () => {
  it('renders the footer with privacy link in Spanish', () => {
    render(<Footer />)

    const privacyLink = screen.getByText('Privacidad')
    expect(privacyLink).toBeInTheDocument()
    expect(privacyLink).toHaveAttribute('href', '/privacidad')
  })

  it('has proper footer structure', () => {
    render(<Footer />)

    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
    expect(footer).toHaveClass('border-t')
  })

  it('uses Next.js Link for SPA navigation', () => {
    render(<Footer />)

    const link = screen.getByText('Privacidad')
    // Next.js Link renders an anchor with href
    expect(link.tagName).toBe('A')
    expect(link).toHaveAttribute('href', '/privacidad')
  })

  it('applies hover styling for Setec brand', () => {
    render(<Footer />)

    const link = screen.getByText('Privacidad')
    expect(link).toHaveClass('hover:text-setec-orange')
  })
})
