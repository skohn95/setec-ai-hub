import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ErrorFallback } from './ErrorFallback'

describe('ErrorFallback', () => {
  it('renders error message', () => {
    render(<ErrorFallback onReset={vi.fn()} />)

    expect(screen.getByText('Algo salió mal.')).toBeInTheDocument()
    expect(screen.getByText('Recarga la página para continuar.')).toBeInTheDocument()
  })

  it('renders reload button', () => {
    render(<ErrorFallback onReset={vi.fn()} />)

    expect(screen.getByRole('button', { name: /recargar página/i })).toBeInTheDocument()
  })

  it('calls onReset when reload button is clicked', () => {
    const onReset = vi.fn()
    render(<ErrorFallback onReset={onReset} />)

    fireEvent.click(screen.getByRole('button', { name: /recargar página/i }))

    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('renders home link when showHomeLink is true', () => {
    render(<ErrorFallback onReset={vi.fn()} showHomeLink />)

    expect(screen.getByRole('link', { name: /volver al inicio/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /volver al inicio/i })).toHaveAttribute('href', '/')
  })

  it('does not render home link when showHomeLink is false', () => {
    render(<ErrorFallback onReset={vi.fn()} showHomeLink={false} />)

    expect(screen.queryByRole('link', { name: /volver al inicio/i })).not.toBeInTheDocument()
  })

  it('renders AlertTriangle icon', () => {
    render(<ErrorFallback onReset={vi.fn()} />)

    // Icon should be present (rendered as svg)
    const icon = document.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('has role="alert" for accessibility', () => {
    render(<ErrorFallback onReset={vi.fn()} />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('is responsive - container uses responsive classes', () => {
    const { container } = render(<ErrorFallback onReset={vi.fn()} />)

    // Check for responsive padding classes
    const alertDiv = container.querySelector('[role="alert"]')
    expect(alertDiv).toHaveClass('p-4', 'md:p-8')
  })

  it('renders custom title when provided', () => {
    render(<ErrorFallback onReset={vi.fn()} title="Error personalizado" />)

    expect(screen.getByText('Error personalizado')).toBeInTheDocument()
  })

  it('renders custom message when provided', () => {
    render(<ErrorFallback onReset={vi.fn()} message="Mensaje personalizado" />)

    expect(screen.getByText('Mensaje personalizado')).toBeInTheDocument()
  })
})
