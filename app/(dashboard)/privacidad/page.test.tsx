import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PrivacidadPage from './page'
import { PRIVACY_PAGE, PRIVACY_HIGHLIGHTS } from '@/constants/privacy'

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>,
}))

describe('PrivacidadPage', () => {
  it('renders the page with correct title', () => {
    render(<PrivacidadPage />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      PRIVACY_PAGE.HEADER.TITLE
    )
  })

  it('displays the introduction paragraph', () => {
    render(<PrivacidadPage />)

    // Check for key phrases from the introduction
    expect(screen.getByText(/privacidad de tus datos/i)).toBeInTheDocument()
  })

  it('renders the data flow section', () => {
    render(<PrivacidadPage />)

    expect(
      screen.getByRole('heading', { name: PRIVACY_PAGE.DATA_FLOW.TITLE })
    ).toBeInTheDocument()
  })

  it('displays all data flow items', () => {
    render(<PrivacidadPage />)

    // Check for each data flow item
    PRIVACY_PAGE.DATA_FLOW.ITEMS.forEach((item) => {
      expect(screen.getByText(item.component)).toBeInTheDocument()
    })
  })

  it('renders all required privacy sections', () => {
    render(<PrivacidadPage />)

    // Check for each section title
    Object.values(PRIVACY_PAGE.SECTIONS).forEach((section) => {
      expect(
        screen.getByRole('heading', { name: section.title })
      ).toBeInTheDocument()
    })
  })

  it('displays the contact section', () => {
    render(<PrivacidadPage />)

    expect(
      screen.getByRole('heading', { name: PRIVACY_PAGE.CONTACT.TITLE })
    ).toBeInTheDocument()
    expect(screen.getByText(PRIVACY_PAGE.CONTACT.EMAIL)).toBeInTheDocument()
  })

  it('provides clickable mailto link for contact email', () => {
    render(<PrivacidadPage />)

    const emailLink = screen.getByRole('link', {
      name: PRIVACY_PAGE.CONTACT.EMAIL,
    })
    expect(emailLink).toBeInTheDocument()
    expect(emailLink).toHaveAttribute(
      'href',
      `mailto:${PRIVACY_PAGE.CONTACT.EMAIL}`
    )
  })

  it('provides back navigation link to dashboard', () => {
    render(<PrivacidadPage />)

    const backLink = screen.getByRole('link', {
      name: /volver al dashboard/i,
    })
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute('href', '/')
  })

  it('uses semantic HTML structure', () => {
    const { container } = render(<PrivacidadPage />)

    // Should have article element for main content
    expect(container.querySelector('article')).toBeInTheDocument()

    // Should have proper heading hierarchy
    const h1 = container.querySelector('h1')
    const h2s = container.querySelectorAll('h2')

    expect(h1).toBeInTheDocument()
    expect(h2s.length).toBeGreaterThan(0)
  })

  it('displays security icons', () => {
    const { container } = render(<PrivacidadPage />)

    // Should have SVG icons (from lucide-react)
    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('highlights that raw data is never sent to AI', () => {
    render(<PrivacidadPage />)

    // Check for the key privacy message
    expect(screen.getByText(/SOLO resultados agregados/i)).toBeInTheDocument()
  })

  it('displays privacy highlights summary box', () => {
    render(<PrivacidadPage />)

    // Check for key privacy highlights
    expect(
      screen.getByText(PRIVACY_HIGHLIGHTS.NEVER_SENT_TO_AI)
    ).toBeInTheDocument()
    expect(
      screen.getByText(PRIVACY_HIGHLIGHTS.AI_ONLY_SEES_AGGREGATES)
    ).toBeInTheDocument()
    expect(
      screen.getByText(PRIVACY_HIGHLIGHTS.ALL_DATA_ENCRYPTED)
    ).toBeInTheDocument()
  })

  it('mentions encryption standards', () => {
    render(<PrivacidadPage />)

    // Multiple mentions of AES-256 is expected (data flow + details)
    const aesElements = screen.getAllByText(/AES-256/i)
    expect(aesElements.length).toBeGreaterThan(0)
  })

  it('mentions Supabase security certifications', () => {
    render(<PrivacidadPage />)

    // Multiple mentions of SOC 2 is expected
    const socElements = screen.getAllByText(/SOC 2/i)
    expect(socElements.length).toBeGreaterThan(0)
  })
})
