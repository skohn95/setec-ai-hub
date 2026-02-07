import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ExportableChart from './ExportableChart'

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve({
    toBlob: (callback: (blob: Blob) => void) => callback(new Blob(['test'], { type: 'image/png' }))
  }))
}))

describe('ExportableChart', () => {
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>
  let clickSpy: ReturnType<typeof vi.fn>
  let mockAnchor: HTMLAnchorElement
  const originalCreateElement = document.createElement.bind(document)

  beforeEach(() => {
    clickSpy = vi.fn()
    mockAnchor = {
      href: '',
      download: '',
      click: clickSpy,
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') return mockAnchor
      return originalCreateElement(tagName)
    })
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('renders children content', () => {
      render(
        <ExportableChart analysisType="test">
          <div data-testid="child-content">Child Content</div>
        </ExportableChart>
      )

      expect(screen.getByTestId('child-content')).toBeInTheDocument()
    })

    it('renders title when provided', () => {
      render(
        <ExportableChart analysisType="test" title="Test Chart Title">
          <div>Content</div>
        </ExportableChart>
      )

      expect(screen.getByText('Test Chart Title')).toBeInTheDocument()
    })

    it('does not render title when not provided', () => {
      render(
        <ExportableChart analysisType="test">
          <div>Content</div>
        </ExportableChart>
      )

      const container = screen.getByTestId('exportable-chart')
      expect(container.querySelector('h4')).toBeNull()
    })

    it('applies custom className', () => {
      render(
        <ExportableChart analysisType="test" className="custom-class">
          <div>Content</div>
        </ExportableChart>
      )

      const chartContainer = screen.getByTestId('exportable-chart')
      // The inner div should have the custom class
      expect(chartContainer.querySelector('.custom-class')).toBeInTheDocument()
    })

    it('has correct test id', () => {
      render(
        <ExportableChart analysisType="test">
          <div>Content</div>
        </ExportableChart>
      )

      expect(screen.getByTestId('exportable-chart')).toBeInTheDocument()
    })
  })

  describe('export button', () => {
    it('displays export button', () => {
      render(
        <ExportableChart analysisType="test">
          <div>Content</div>
        </ExportableChart>
      )

      expect(screen.getByTitle('Descargar como imagen')).toBeInTheDocument()
    })

    it('export button has download icon', () => {
      render(
        <ExportableChart analysisType="test">
          <div>Content</div>
        </ExportableChart>
      )

      const button = screen.getByTitle('Descargar como imagen')
      expect(button.querySelector('svg')).toBeInTheDocument()
    })

    it('triggers export on button click', async () => {
      render(
        <ExportableChart analysisType="test">
          <div>Content</div>
        </ExportableChart>
      )

      const button = screen.getByTitle('Descargar como imagen')
      fireEvent.click(button)

      await waitFor(() => {
        expect(clickSpy).toHaveBeenCalled()
      }, { timeout: 1000 })
    })
  })

  describe('export filename', () => {
    it('generates filename with provided analysisType', async () => {
      render(
        <ExportableChart analysisType="gauge-rr">
          <div>Content</div>
        </ExportableChart>
      )

      const button = screen.getByTitle('Descargar como imagen')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockAnchor.download).toMatch(/^gauge-rr-results-.*\.png$/)
      }, { timeout: 1000 })
    })

    it('uses msa for msa analysis type', async () => {
      render(
        <ExportableChart analysisType="msa">
          <div>Content</div>
        </ExportableChart>
      )

      const button = screen.getByTitle('Descargar como imagen')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockAnchor.download).toMatch(/^msa-results-.*\.png$/)
      }, { timeout: 1000 })
    })
  })

  describe('loading state', () => {
    it('button is not disabled by default', () => {
      render(
        <ExportableChart analysisType="test">
          <div>Content</div>
        </ExportableChart>
      )

      const button = screen.getByTitle('Descargar como imagen')
      expect(button).not.toBeDisabled()
    })
  })
})
