import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardLayout from './layout'

// Mock the AuthProvider hook
const mockUseAuth = vi.fn()
vi.mock('@/lib/providers/AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}))

// Mock the layout components
vi.mock('@/components/layout', () => ({
  Sidebar: () => <aside data-testid="sidebar">Sidebar</aside>,
}))

// Mock the common components
vi.mock('@/components/common', () => ({
  // ErrorBoundary passes children through for testing
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('DashboardLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading skeleton while auth is checking', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true })

    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>
    )

    // Should show loading state
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
    // Should NOT show content
    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument()
  })

  it('renders layout with sidebar and main content when authenticated', () => {
    mockUseAuth.mockReturnValue({ user: { id: '1', email: 'test@example.com' }, loading: false })

    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>
    )

    // Should show sidebar
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    // Should show main content
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
  })

  it('has proper CSS flex layout structure', () => {
    mockUseAuth.mockReturnValue({ user: { id: '1', email: 'test@example.com' }, loading: false })

    const { container } = render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>
    )

    // Main container should have flex layout classes with proper scroll containment
    const layout = container.querySelector('[data-testid="dashboard-layout"]')
    expect(layout).toBeInTheDocument()
    expect(layout).toHaveClass('flex')
    expect(layout).toHaveClass('h-screen')
    expect(layout).toHaveClass('overflow-hidden')
  })

  it('shows loading skeleton when user is null after loading (defense-in-depth)', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false })

    render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>
    )

    // Should show loading skeleton as fallback when user is null
    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument()
    // Should NOT show content
    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument()
  })

  it('positions main content within flex container', () => {
    mockUseAuth.mockReturnValue({ user: { id: '1', email: 'test@example.com' }, loading: false })

    const { container } = render(
      <DashboardLayout>
        <div>Dashboard Content</div>
      </DashboardLayout>
    )

    // Main content area should be a flex container
    const main = container.querySelector('main')
    expect(main).toHaveClass('flex')
    expect(main).toHaveClass('flex-col')
  })
})
