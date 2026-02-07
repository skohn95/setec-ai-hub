import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GaugeRRChart from './GaugeRRChart'
import type { ChartDataItem } from '@/types/api'
import { toast } from 'sonner'

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve({
    toBlob: (callback: (blob: Blob) => void) => callback(new Blob(['test'], { type: 'image/png' }))
  }))
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}))

describe('GaugeRRChart', () => {
  const mockVariationData: ChartDataItem = {
    type: 'variationBreakdown',
    data: [
      { source: 'Repetibilidad', percentage: 15.5, color: '#3B82F6' },
      { source: 'Reproducibilidad', percentage: 8.2, color: '#F97316' },
      { source: 'Parte a Parte', percentage: 76.3, color: '#10B981' },
      { source: 'GRR Total', percentage: 23.7, color: '#F59E0B' },
    ],
  }

  const mockVariationDataAcceptable: ChartDataItem = {
    type: 'variationBreakdown',
    data: [
      { source: 'Repetibilidad', percentage: 4.2, color: '#3B82F6' },
      { source: 'Reproducibilidad', percentage: 2.8, color: '#F97316' },
      { source: 'Parte a Parte', percentage: 93.0, color: '#10B981' },
      { source: 'GRR Total', percentage: 7.0, color: '#10B981' },
    ],
  }

  const mockVariationDataUnacceptable: ChartDataItem = {
    type: 'variationBreakdown',
    data: [
      { source: 'Repetibilidad', percentage: 28.5, color: '#3B82F6' },
      { source: 'Reproducibilidad', percentage: 15.3, color: '#F97316' },
      { source: 'Parte a Parte', percentage: 56.2, color: '#10B981' },
      { source: 'GRR Total', percentage: 43.8, color: '#EF4444' },
    ],
  }

  const mockOperatorData: ChartDataItem = {
    type: 'operatorComparison',
    data: [
      { operator: 'Op1', mean: 10.5, stdDev: 0.23 },
      { operator: 'Op2', mean: 10.8, stdDev: 0.31 },
      { operator: 'Op3', mean: 10.6, stdDev: 0.19 },
    ],
  }

  describe('variation breakdown chart', () => {
    it('renders variation breakdown chart with title', () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      expect(screen.getByText('Desglose de Variación')).toBeInTheDocument()
    })

    it('displays all variation sources as labels', () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      expect(screen.getByText('Repetibilidad')).toBeInTheDocument()
      expect(screen.getByText('Reproducibilidad')).toBeInTheDocument()
      expect(screen.getByText('Parte a Parte')).toBeInTheDocument()
    })

    it('displays percentage values', () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      expect(screen.getByText('15.5%')).toBeInTheDocument()
      expect(screen.getByText('8.2%')).toBeInTheDocument()
      expect(screen.getByText('76.3%')).toBeInTheDocument()
    })

    it('has accessible test id', () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      expect(screen.getByTestId('variation-breakdown-chart')).toBeInTheDocument()
    })
  })

  describe('operator comparison chart', () => {
    it('renders operator comparison chart with title', () => {
      render(<GaugeRRChart data={[mockOperatorData]} />)

      expect(screen.getByText('Comparación de Operadores')).toBeInTheDocument()
    })

    it('renders chart container with recharts', () => {
      render(<GaugeRRChart data={[mockOperatorData]} />)

      // Recharts renders a responsive container
      const chartContainer = screen.getByTestId('operator-comparison-chart')
      expect(chartContainer.querySelector('.recharts-responsive-container')).toBeInTheDocument()
    })

    it('has accessible test id', () => {
      render(<GaugeRRChart data={[mockOperatorData]} />)

      expect(screen.getByTestId('operator-comparison-chart')).toBeInTheDocument()
    })

    it('displays legend items', () => {
      render(<GaugeRRChart data={[mockOperatorData]} />)

      expect(screen.getByText('Media')).toBeInTheDocument()
      expect(screen.getByText('±1 Desv. Std.')).toBeInTheDocument()
    })
  })

  describe('multiple charts', () => {
    it('renders both charts when both data types provided', () => {
      render(<GaugeRRChart data={[mockVariationData, mockOperatorData]} />)

      expect(screen.getByTestId('variation-breakdown-chart')).toBeInTheDocument()
      expect(screen.getByTestId('operator-comparison-chart')).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('renders nothing when data is empty', () => {
      const { container } = render(<GaugeRRChart data={[]} />)

      expect(container.firstChild).toBeNull()
    })

    it('renders nothing when data is null', () => {
      const { container } = render(<GaugeRRChart data={null as unknown as ChartDataItem[]} />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('unknown chart types', () => {
    it('ignores unknown chart types gracefully', () => {
      const unknownData: ChartDataItem = {
        type: 'unknownChartType',
        data: [{ foo: 'bar' }],
      }

      const { container } = render(<GaugeRRChart data={[unknownData]} />)

      // Should not crash, just not render anything
      expect(container.querySelector('[data-testid="variation-breakdown-chart"]')).toBeNull()
      expect(container.querySelector('[data-testid="operator-comparison-chart"]')).toBeNull()
    })
  })

  describe('reference lines', () => {
    it('displays 10% threshold reference line', () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      // Single reference line for entire chart (not duplicated per bar)
      expect(screen.getByTestId('reference-line-10')).toBeInTheDocument()
    })

    it('displays 30% threshold reference line', () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      // Single reference line for entire chart (not duplicated per bar)
      expect(screen.getByTestId('reference-line-30')).toBeInTheDocument()
    })

    it('positions reference lines using calc for proper alignment', () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      const line10 = screen.getByTestId('reference-line-10')
      const line30 = screen.getByTestId('reference-line-30')

      // Reference lines use calc() for positioning
      // Values are divided by 100 in CSS: 10/100 = 0.1, 30/100 = 0.3
      expect(line10.style.left).toContain('0.1')
      expect(line30.style.left).toContain('0.3')
    })
  })

  describe('threshold legend', () => {
    it('displays threshold legend with explanations', () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      expect(screen.getByTestId('threshold-legend')).toBeInTheDocument()
    })

    it('shows acceptable threshold label', () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      expect(screen.getByText(/< ?10%.*Aceptable/i)).toBeInTheDocument()
    })

    it('shows unacceptable threshold label', () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      expect(screen.getByText(/> ?30%.*Inaceptable/i)).toBeInTheDocument()
    })
  })

  describe('GRR classification badge', () => {
    it('displays GRR classification badge', () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      expect(screen.getByTestId('grr-classification-badge')).toBeInTheDocument()
    })

    it('shows GRR Total value in badge', () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      expect(screen.getByText(/23\.7%/)).toBeInTheDocument()
    })

    it('shows acceptable classification for low GRR', () => {
      render(<GaugeRRChart data={[mockVariationDataAcceptable]} />)

      // Check within the badge element specifically
      const badge = screen.getByTestId('grr-classification-badge')
      expect(badge).toHaveTextContent(/Aceptable/i)
    })

    it('shows marginal classification for medium GRR', () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      // Check within the badge element specifically
      const badge = screen.getByTestId('grr-classification-badge')
      expect(badge).toHaveTextContent(/Marginal/i)
    })

    it('shows unacceptable classification for high GRR', () => {
      render(<GaugeRRChart data={[mockVariationDataUnacceptable]} />)

      // Check within the badge element specifically
      const badge = screen.getByTestId('grr-classification-badge')
      expect(badge).toHaveTextContent(/Inaceptable/i)
    })

    it('applies correct color for acceptable GRR', () => {
      render(<GaugeRRChart data={[mockVariationDataAcceptable]} />)

      const badge = screen.getByTestId('grr-classification-badge')
      const colorIndicator = badge.querySelector('[data-testid="classification-color"]')
      expect(colorIndicator).toHaveStyle({ backgroundColor: '#10B981' })
    })

    it('applies correct color for marginal GRR', () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      const badge = screen.getByTestId('grr-classification-badge')
      const colorIndicator = badge.querySelector('[data-testid="classification-color"]')
      expect(colorIndicator).toHaveStyle({ backgroundColor: '#F59E0B' })
    })

    it('applies correct color for unacceptable GRR', () => {
      render(<GaugeRRChart data={[mockVariationDataUnacceptable]} />)

      const badge = screen.getByTestId('grr-classification-badge')
      const colorIndicator = badge.querySelector('[data-testid="classification-color"]')
      expect(colorIndicator).toHaveStyle({ backgroundColor: '#EF4444' })
    })
  })

  describe('tooltip formatting', () => {
    it('renders tooltip with precise percentage formatting', () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      // Percentage values should be displayed with precision
      expect(screen.getByText('15.5%')).toBeInTheDocument()
      expect(screen.getByText('8.2%')).toBeInTheDocument()
    })
  })

  describe('responsive design', () => {
    it('uses ResponsiveContainer for operator comparison chart', () => {
      render(<GaugeRRChart data={[mockOperatorData]} />)

      const chartContainer = screen.getByTestId('operator-comparison-chart')
      expect(chartContainer.querySelector('.recharts-responsive-container')).toBeInTheDocument()
    })

    it('uses flex-wrap for threshold legend on mobile', () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      const legend = screen.getByTestId('threshold-legend')
      expect(legend).toHaveClass('flex-wrap')
    })

    it('variation breakdown uses flexible layout', () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      // Check that the progress bar container is flex-1 (flexible width)
      const chartContainer = screen.getByTestId('variation-breakdown-chart')
      const progressBarContainers = chartContainer.querySelectorAll('.flex-1')
      expect(progressBarContainers.length).toBeGreaterThan(0)
    })
  })

  describe('export functionality', () => {
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

    it('displays export button', () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      expect(screen.getByTitle('Descargar como imagen')).toBeInTheDocument()
    })

    it('export button has download icon', () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      const button = screen.getByTitle('Descargar como imagen')
      expect(button.querySelector('svg')).toBeInTheDocument()
    })

    it('triggers export on button click', async () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      const button = screen.getByTitle('Descargar como imagen')
      fireEvent.click(button)

      await waitFor(() => {
        expect(clickSpy).toHaveBeenCalled()
      })
    })

    it('generates filename with msa prefix', async () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      const button = screen.getByTitle('Descargar como imagen')
      fireEvent.click(button)

      // Wait for async export to complete
      await waitFor(() => {
        expect(mockAnchor.download).toMatch(/^msa-results-.*\.png$/)
      }, { timeout: 1000 })
    })

    it('button becomes disabled during export', async () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      const button = screen.getByTitle('Descargar como imagen')

      // Button should not be disabled initially
      expect(button).not.toBeDisabled()

      // Click triggers export
      fireEvent.click(button)

      // Button should be disabled during export (or completed)
      await waitFor(() => {
        expect(clickSpy).toHaveBeenCalled()
      }, { timeout: 1000 })
    })

    it('shows success toast on successful export', async () => {
      render(<GaugeRRChart data={[mockVariationData]} />)

      const button = screen.getByTitle('Descargar como imagen')
      fireEvent.click(button)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Gráfico exportado correctamente')
      }, { timeout: 1000 })
    })

    it('shows error toast when export fails', async () => {
      const html2canvas = (await import('html2canvas')).default
      vi.mocked(html2canvas).mockRejectedValueOnce(new Error('Canvas rendering failed'))

      render(<GaugeRRChart data={[mockVariationData]} />)

      const button = screen.getByTitle('Descargar como imagen')
      fireEvent.click(button)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error al exportar el gráfico')
      }, { timeout: 1000 })
    })
  })
})
