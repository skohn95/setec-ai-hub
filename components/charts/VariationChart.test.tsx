import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import VariationChart from './VariationChart'
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

describe('VariationChart', () => {
  const mockOperatorData = [
    { operator: 'Op1', variation: 0.234 },
    { operator: 'Op2', variation: 0.312 },
    { operator: 'Op3', variation: 0.198 },
  ]

  const mockOperatorDataSingleHighest = [
    { operator: 'Op1', variation: 0.150 },
    { operator: 'Op2', variation: 0.500 },
    { operator: 'Op3', variation: 0.200 },
  ]

  describe('rendering', () => {
    it('renders the chart container with correct test id', () => {
      render(<VariationChart data={mockOperatorData} />)

      expect(screen.getByTestId('variation-chart')).toBeInTheDocument()
    })

    it('renders the chart title', () => {
      render(<VariationChart data={mockOperatorData} />)

      expect(screen.getByText('Variación por Operador')).toBeInTheDocument()
    })

    it('renders a recharts responsive container', () => {
      render(<VariationChart data={mockOperatorData} />)

      const chartContainer = screen.getByTestId('variation-chart')
      expect(chartContainer.querySelector('.recharts-responsive-container')).toBeInTheDocument()
    })
  })

  describe('operator data display', () => {
    it('renders chart with provided data', () => {
      render(<VariationChart data={mockOperatorData} />)

      const chartContainer = screen.getByTestId('variation-chart')
      // Recharts renders a responsive container for the bar chart
      expect(chartContainer.querySelector('.recharts-responsive-container')).toBeInTheDocument()
    })
  })

  describe('legend', () => {
    it('displays legend explaining chart elements', () => {
      render(<VariationChart data={mockOperatorData} />)

      expect(screen.getByTestId('variation-chart-legend')).toBeInTheDocument()
    })

    it('shows standard deviation label in legend', () => {
      render(<VariationChart data={mockOperatorData} />)

      expect(screen.getByText(/Desv\. Std\./i)).toBeInTheDocument()
    })

    it('shows highest variation indicator in legend', () => {
      render(<VariationChart data={mockOperatorData} />)

      expect(screen.getByText(/Mayor variación/i)).toBeInTheDocument()
    })
  })

  describe('highest variation highlighting', () => {
    it('identifies the operator with highest variation', () => {
      render(<VariationChart data={mockOperatorDataSingleHighest} />)

      // The chart should highlight Op2 which has the highest variation
      const chartContainer = screen.getByTestId('variation-chart')
      expect(chartContainer).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('renders nothing when data is empty', () => {
      const { container } = render(<VariationChart data={[]} />)

      expect(container.querySelector('[data-testid="variation-chart"]')).toBeNull()
    })

    it('renders nothing when data is null', () => {
      const { container } = render(<VariationChart data={null as unknown as typeof mockOperatorData} />)

      expect(container.querySelector('[data-testid="variation-chart"]')).toBeNull()
    })
  })

  describe('custom colors', () => {
    it('accepts custom colors for bars', () => {
      const dataWithColors = [
        { operator: 'Op1', variation: 0.234, color: '#FF0000' },
        { operator: 'Op2', variation: 0.312, color: '#00FF00' },
      ]

      render(<VariationChart data={dataWithColors} />)

      expect(screen.getByTestId('variation-chart')).toBeInTheDocument()
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
      render(<VariationChart data={mockOperatorData} />)

      expect(screen.getByTitle('Descargar como imagen')).toBeInTheDocument()
    })

    it('export button has download icon', () => {
      render(<VariationChart data={mockOperatorData} />)

      const button = screen.getByTitle('Descargar como imagen')
      expect(button.querySelector('svg')).toBeInTheDocument()
    })

    it('triggers export on button click', async () => {
      render(<VariationChart data={mockOperatorData} />)

      const button = screen.getByTitle('Descargar como imagen')
      fireEvent.click(button)

      await waitFor(() => {
        expect(clickSpy).toHaveBeenCalled()
      }, { timeout: 1000 })
    })

    it('generates filename with variation prefix', async () => {
      render(<VariationChart data={mockOperatorData} />)

      const button = screen.getByTitle('Descargar como imagen')
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockAnchor.download).toMatch(/^variation-results-.*\.png$/)
      }, { timeout: 1000 })
    })

    it('shows success toast on successful export', async () => {
      render(<VariationChart data={mockOperatorData} />)

      const button = screen.getByTitle('Descargar como imagen')
      fireEvent.click(button)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Gráfico exportado correctamente')
      }, { timeout: 1000 })
    })

    it('shows error toast when export fails', async () => {
      const html2canvas = (await import('html2canvas')).default
      vi.mocked(html2canvas).mockRejectedValueOnce(new Error('Canvas rendering failed'))

      render(<VariationChart data={mockOperatorData} />)

      const button = screen.getByTitle('Descargar como imagen')
      fireEvent.click(button)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error al exportar el gráfico')
      }, { timeout: 1000 })
    })
  })

  describe('styling consistency', () => {
    it('uses bg-card class instead of bg-white for theme support', () => {
      render(<VariationChart data={mockOperatorData} />)

      const chart = screen.getByTestId('variation-chart')
      expect(chart).toHaveClass('bg-card')
      expect(chart).not.toHaveClass('bg-white')
    })
  })
})
