import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import NormalityPlot from './NormalityPlot'
import type { NormalityPlotData } from '@/types/analysis'

// Mock download-utils to avoid canvas issues in tests
vi.mock('@/lib/utils/download-utils', () => ({
  exportChartToPng: vi.fn().mockResolvedValue(undefined),
  generateExportFilename: vi.fn((type: string) => `${type}-test.png`),
  ChartExportError: class ChartExportError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ChartExportError'
    }
  },
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock ResizeObserver for ResponsiveContainer
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

beforeEach(() => {
  vi.clearAllMocks()
})

/**
 * Create valid Normality Plot data for testing
 */
function createNormalityPlotData(overrides?: Partial<NormalityPlotData['data']>): NormalityPlotData {
  // Generate sample points for a Q-Q plot
  const samplePoints = [
    { actual: 85.5, expected: -1.64, index: 0 },
    { actual: 92.3, expected: -1.04, index: 1 },
    { actual: 97.1, expected: -0.67, index: 2 },
    { actual: 99.8, expected: -0.39, index: 3 },
    { actual: 102.4, expected: -0.13, index: 4 },
    { actual: 104.6, expected: 0.13, index: 5 },
    { actual: 107.2, expected: 0.39, index: 6 },
    { actual: 110.5, expected: 0.67, index: 7 },
    { actual: 115.8, expected: 1.04, index: 8 },
    { actual: 124.2, expected: 1.64, index: 9 },
  ]

  return {
    type: 'normality_plot',
    data: {
      points: samplePoints,
      fit_line: {
        slope: 10.5,
        intercept: 103.4,
      },
      confidence_bands: {
        lower: samplePoints.map(p => p.actual - 5),
        upper: samplePoints.map(p => p.actual + 5),
      },
      anderson_darling: {
        statistic: 0.25,
        p_value: 0.72,
        is_normal: true,
      },
      ...overrides,
    },
  }
}

describe('NormalityPlot', () => {
  describe('Rendering', () => {
    it('renders the normality plot container', () => {
      const data = createNormalityPlotData()
      render(<NormalityPlot data={data} />)
      expect(screen.getByTestId('normality-plot')).toBeInTheDocument()
    })

    it('displays the chart title', () => {
      const data = createNormalityPlotData()
      render(<NormalityPlot data={data} />)
      expect(screen.getByText('Gráfico de Probabilidad Normal')).toBeInTheDocument()
    })

    it('renders the legend', () => {
      const data = createNormalityPlotData()
      render(<NormalityPlot data={data} />)
      expect(screen.getByTestId('normality-plot-legend')).toBeInTheDocument()
    })

    it('renders legend item for data points', () => {
      const data = createNormalityPlotData()
      render(<NormalityPlot data={data} />)
      expect(screen.getByText('Datos')).toBeInTheDocument()
    })

    it('renders legend item for fit line', () => {
      const data = createNormalityPlotData()
      render(<NormalityPlot data={data} />)
      expect(screen.getByText('Línea de Ajuste')).toBeInTheDocument()
    })

    it('renders legend item for confidence bands', () => {
      const data = createNormalityPlotData()
      render(<NormalityPlot data={data} />)
      expect(screen.getByText('Bandas de Confianza 95%')).toBeInTheDocument()
    })

    it('renders the export button', () => {
      const data = createNormalityPlotData()
      render(<NormalityPlot data={data} />)
      expect(screen.getByTitle('Descargar como imagen')).toBeInTheDocument()
    })
  })

  describe('Empty data handling', () => {
    it('returns null when points array is empty', () => {
      const data = createNormalityPlotData({ points: [] })
      const { container } = render(<NormalityPlot data={data} />)
      expect(container.firstChild).toBeNull()
    })

    it('returns null when data prop is missing points', () => {
      const invalidData = {
        type: 'normality_plot',
        data: {
          points: null as unknown as NormalityPlotData['data']['points'],
          fit_line: { slope: 10, intercept: 100 },
          confidence_bands: { lower: [], upper: [] },
          anderson_darling: { statistic: 0.25, p_value: 0.72, is_normal: true },
        },
      } as NormalityPlotData
      const { container } = render(<NormalityPlot data={invalidData} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Anderson-Darling Display', () => {
    it('renders A² statistic display', () => {
      const data = createNormalityPlotData()
      render(<NormalityPlot data={data} />)
      expect(screen.getByTestId('ad-stats-display')).toBeInTheDocument()
    })

    it('displays A² statistic value', () => {
      const data = createNormalityPlotData({
        anderson_darling: {
          statistic: 0.25,
          p_value: 0.72,
          is_normal: true,
        },
      })
      render(<NormalityPlot data={data} />)
      expect(screen.getByText(/A² = 0.2500/)).toBeInTheDocument()
    })

    it('displays p-value', () => {
      const data = createNormalityPlotData({
        anderson_darling: {
          statistic: 0.25,
          p_value: 0.72,
          is_normal: true,
        },
      })
      render(<NormalityPlot data={data} />)
      expect(screen.getByText(/p-value = 0.7200/)).toBeInTheDocument()
    })

    it('displays "< 0.005" for very small p-values', () => {
      const data = createNormalityPlotData({
        anderson_darling: {
          statistic: 2.5,
          p_value: 0.001,
          is_normal: false,
        },
      })
      render(<NormalityPlot data={data} />)
      expect(screen.getByText(/p-value = < 0.005/)).toBeInTheDocument()
    })
  })

  describe('Normal Conclusion Display', () => {
    it('shows green indicator and "Normal" for normal data', () => {
      const data = createNormalityPlotData({
        anderson_darling: {
          statistic: 0.25,
          p_value: 0.72,
          is_normal: true,
        },
      })
      render(<NormalityPlot data={data} />)
      expect(screen.getByText('Normal')).toBeInTheDocument()
      expect(screen.getByText(/Los datos siguen una distribución normal/)).toBeInTheDocument()
    })

    it('shows red indicator and "No Normal" for non-normal data', () => {
      const data = createNormalityPlotData({
        anderson_darling: {
          statistic: 2.5,
          p_value: 0.001,
          is_normal: false,
        },
      })
      render(<NormalityPlot data={data} />)
      expect(screen.getByText('No Normal')).toBeInTheDocument()
      expect(screen.getByText(/Los datos NO siguen una distribución normal/)).toBeInTheDocument()
    })
  })

  describe('Export functionality', () => {
    it('export button is clickable', () => {
      const data = createNormalityPlotData()
      render(<NormalityPlot data={data} />)
      const exportButton = screen.getByTitle('Descargar como imagen')
      expect(exportButton).not.toBeDisabled()
    })

    it('calls export function when clicked', async () => {
      const { exportChartToPng } = await import('@/lib/utils/download-utils')
      const { toast } = await import('sonner')

      const data = createNormalityPlotData()
      render(<NormalityPlot data={data} />)
      const exportButton = screen.getByTitle('Descargar como imagen')

      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(exportChartToPng).toHaveBeenCalled()
        expect(toast.success).toHaveBeenCalledWith('Gráfico exportado correctamente')
      })
    })

    it('shows error toast on export failure', async () => {
      const downloadUtils = await import('@/lib/utils/download-utils')
      const { toast } = await import('sonner')

      vi.mocked(downloadUtils.exportChartToPng).mockRejectedValueOnce(
        new downloadUtils.ChartExportError('Export failed')
      )

      const data = createNormalityPlotData()
      render(<NormalityPlot data={data} />)
      const exportButton = screen.getByTitle('Descargar como imagen')

      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error al exportar el gráfico')
      })
    })
  })

  describe('Data edge cases', () => {
    it('handles minimal data (2 points)', () => {
      const data = createNormalityPlotData({
        points: [
          { actual: 95.0, expected: -0.67, index: 0 },
          { actual: 105.0, expected: 0.67, index: 1 },
        ],
        confidence_bands: {
          lower: [90.0, 100.0],
          upper: [100.0, 110.0],
        },
      })
      render(<NormalityPlot data={data} />)
      expect(screen.getByTestId('normality-plot')).toBeInTheDocument()
    })

    it('handles perfect normal data (all points on line)', () => {
      const perfectPoints = [
        { actual: 92.9, expected: -1.0, index: 0 },
        { actual: 103.4, expected: 0.0, index: 1 },
        { actual: 113.9, expected: 1.0, index: 2 },
      ]
      const data = createNormalityPlotData({
        points: perfectPoints,
        fit_line: { slope: 10.5, intercept: 103.4 },
        confidence_bands: {
          lower: perfectPoints.map(p => p.actual - 3),
          upper: perfectPoints.map(p => p.actual + 3),
        },
        anderson_darling: {
          statistic: 0.1,
          p_value: 0.99,
          is_normal: true,
        },
      })
      render(<NormalityPlot data={data} />)
      expect(screen.getByTestId('normality-plot')).toBeInTheDocument()
      expect(screen.getByText('Normal')).toBeInTheDocument()
    })

    it('handles highly skewed data', () => {
      const skewedPoints = [
        { actual: 1.2, expected: -1.64, index: 0 },
        { actual: 1.5, expected: -1.04, index: 1 },
        { actual: 2.0, expected: -0.67, index: 2 },
        { actual: 3.5, expected: -0.39, index: 3 },
        { actual: 8.0, expected: -0.13, index: 4 },
        { actual: 15.0, expected: 0.13, index: 5 },
        { actual: 25.0, expected: 0.39, index: 6 },
        { actual: 40.0, expected: 0.67, index: 7 },
        { actual: 65.0, expected: 1.04, index: 8 },
        { actual: 120.0, expected: 1.64, index: 9 },
      ]
      const data = createNormalityPlotData({
        points: skewedPoints,
        confidence_bands: {
          lower: skewedPoints.map(p => p.actual - 10),
          upper: skewedPoints.map(p => p.actual + 10),
        },
        anderson_darling: {
          statistic: 3.5,
          p_value: 0.0001,
          is_normal: false,
        },
      })
      render(<NormalityPlot data={data} />)
      expect(screen.getByTestId('normality-plot')).toBeInTheDocument()
      expect(screen.getByText('No Normal')).toBeInTheDocument()
    })

    it('handles large dataset', () => {
      const largePoints = Array.from({ length: 100 }, (_, i) => ({
        actual: 100 + i * 0.5 + Math.random() * 5,
        expected: -2.33 + (i / 100) * 4.66, // Span from -2.33 to 2.33
        index: i,
      }))
      const data = createNormalityPlotData({
        points: largePoints,
        confidence_bands: {
          lower: largePoints.map(p => p.actual - 5),
          upper: largePoints.map(p => p.actual + 5),
        },
      })
      render(<NormalityPlot data={data} />)
      expect(screen.getByTestId('normality-plot')).toBeInTheDocument()
    })
  })

  describe('Tooltip', () => {
    // Note: Recharts tooltip hover behavior cannot be reliably tested in JSDOM
    // because Recharts uses mouse position calculations that require a real DOM.
    // These tests verify the chart renders with tooltip configured.

    it('chart renders with tooltip configuration', () => {
      const data = createNormalityPlotData()
      render(<NormalityPlot data={data} />)
      expect(screen.getByTestId('normality-plot')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has accessible chart title', () => {
      const data = createNormalityPlotData()
      render(<NormalityPlot data={data} />)
      expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Gráfico de Probabilidad Normal')
    })

    it('export button has accessible title', () => {
      const data = createNormalityPlotData()
      render(<NormalityPlot data={data} />)
      expect(screen.getByTitle('Descargar como imagen')).toBeInTheDocument()
    })

    it('conclusion text is displayed for screen readers', () => {
      const data = createNormalityPlotData()
      render(<NormalityPlot data={data} />)
      expect(screen.getByText(/Los datos siguen una distribución normal/)).toBeInTheDocument()
    })
  })
})
