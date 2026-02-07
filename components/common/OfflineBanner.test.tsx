import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OfflineBanner } from './OfflineBanner'

// Mock useNetworkStatus hook
const mockUseNetworkStatus = vi.fn()

vi.mock('@/hooks/use-network-status', () => ({
  useNetworkStatus: () => mockUseNetworkStatus(),
}))

describe('OfflineBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when online', () => {
    mockUseNetworkStatus.mockReturnValue(true)

    const { container } = render(<OfflineBanner />)

    expect(container.firstChild).toBeNull()
  })

  it('renders offline message when offline', () => {
    mockUseNetworkStatus.mockReturnValue(false)

    render(<OfflineBanner />)

    expect(
      screen.getByText('No hay conexión a internet. Verifica tu conexión e intenta de nuevo.')
    ).toBeInTheDocument()
  })

  it('has role="alert" for accessibility', () => {
    mockUseNetworkStatus.mockReturnValue(false)

    render(<OfflineBanner />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders WifiOff icon when offline', () => {
    mockUseNetworkStatus.mockReturnValue(false)

    render(<OfflineBanner />)

    // Icon should be present (rendered as svg)
    const icon = document.querySelector('svg')
    expect(icon).toBeInTheDocument()
  })

  it('has aria-live="polite" for screen readers', () => {
    mockUseNetworkStatus.mockReturnValue(false)

    render(<OfflineBanner />)

    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite')
  })

  it('applies fixed positioning styles', () => {
    mockUseNetworkStatus.mockReturnValue(false)

    render(<OfflineBanner />)

    const banner = screen.getByRole('alert')
    expect(banner).toHaveClass('fixed', 'top-0', 'left-0', 'right-0')
  })
})
