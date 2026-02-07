import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TemplateCard } from './TemplateCard'

// Mock the download utility
vi.mock('@/lib/utils/download-utils', () => ({
  downloadFile: vi.fn(),
}))

import { downloadFile } from '@/lib/utils/download-utils'

describe('TemplateCard', () => {
  const defaultProps = {
    title: 'Análisis del Sistema de Medición (MSA)',
    description: 'Plantilla para evaluar la variación en tu sistema de medición.',
    filename: 'plantilla-msa.xlsx',
    downloadPath: '/templates/plantilla-msa.xlsx',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('renders the template title', () => {
      render(<TemplateCard {...defaultProps} />)
      expect(screen.getByText(defaultProps.title)).toBeInTheDocument()
    })

    it('renders the template description', () => {
      render(<TemplateCard {...defaultProps} />)
      expect(screen.getByText(defaultProps.description)).toBeInTheDocument()
    })

    it('renders a download button with "Descargar" text', () => {
      render(<TemplateCard {...defaultProps} />)
      expect(screen.getByRole('button', { name: /descargar/i })).toBeInTheDocument()
    })

    it('renders within a card element', () => {
      render(<TemplateCard {...defaultProps} />)
      expect(screen.getByTestId('template-card')).toBeInTheDocument()
    })

    it('renders download icon in the button', () => {
      render(<TemplateCard {...defaultProps} />)
      const button = screen.getByRole('button', { name: /descargar/i })
      const icon = button.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Download functionality', () => {
    it('calls downloadFile with correct path when button is clicked', async () => {
      const user = userEvent.setup()
      render(<TemplateCard {...defaultProps} />)

      const button = screen.getByRole('button', { name: /descargar/i })
      await user.click(button)

      expect(downloadFile).toHaveBeenCalledWith(
        defaultProps.downloadPath,
        defaultProps.filename
      )
    })

    it('only triggers download once per click', async () => {
      const user = userEvent.setup()
      render(<TemplateCard {...defaultProps} />)

      const button = screen.getByRole('button', { name: /descargar/i })
      await user.click(button)

      expect(downloadFile).toHaveBeenCalledTimes(1)
    })

    it('does not navigate away from page on download', async () => {
      const user = userEvent.setup()
      render(<TemplateCard {...defaultProps} />)

      const button = screen.getByRole('button', { name: /descargar/i })
      await user.click(button)

      // Button should still be in document (no navigation occurred)
      expect(button).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('download button has accessible name', () => {
      render(<TemplateCard {...defaultProps} />)
      const button = screen.getByRole('button')
      expect(button).toHaveAccessibleName(/descargar/i)
    })

    it('download button has aria-label with template title', () => {
      render(<TemplateCard {...defaultProps} />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', `Descargar ${defaultProps.title}`)
    })

    it('card is keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<TemplateCard {...defaultProps} />)

      const button = screen.getByRole('button')
      button.focus()
      expect(document.activeElement).toBe(button)

      await user.keyboard('{Enter}')
      expect(downloadFile).toHaveBeenCalled()
    })
  })

  describe('Styling', () => {
    it('applies orange accent color to download button', () => {
      render(<TemplateCard {...defaultProps} />)
      const button = screen.getByRole('button')
      // Button should have bg-setec-orange class or equivalent
      expect(button.className).toMatch(/bg-setec-orange|bg-\[#F7931E\]/i)
    })
  })
})
