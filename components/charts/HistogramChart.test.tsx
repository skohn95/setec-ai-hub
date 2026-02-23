import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import HistogramChart from './HistogramChart'
import type { HistogramChartData } from '@/types/analysis'

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

describe('HistogramChart', () => {
  const validHistogramData: HistogramChartData = {
    type: 'histogram',
    data: {
      values: [95, 97, 100, 102, 105, 98, 103, 99, 101, 104, 96, 100, 102, 98, 100],
      lei: 90,
      les: 110,
      mean: 100,
      std: 3.5,
      lcl: 93,
      ucl: 107,
      fitted_distribution: null,
    },
  }

  describe('Rendering', () => {
    it('renders the histogram chart container', () => {
      render(<HistogramChart data={validHistogramData} />)
      expect(screen.getByTestId('histogram-chart')).toBeInTheDocument()
    })

    it('displays the chart title', () => {
      render(<HistogramChart data={validHistogramData} />)
      expect(screen.getByText('Histograma de Datos')).toBeInTheDocument()
    })

    it('displays the chart description', () => {
      render(<HistogramChart data={validHistogramData} />)
      expect(screen.getByText(/Distribución de frecuencias/)).toBeInTheDocument()
    })

    it('renders the legend', () => {
      render(<HistogramChart data={validHistogramData} />)
      expect(screen.getByTestId('histogram-legend')).toBeInTheDocument()
    })

    it('renders legend items for spec limits', () => {
      render(<HistogramChart data={validHistogramData} />)
      expect(screen.getByText(/LEI \/ LES/)).toBeInTheDocument()
    })

    it('renders legend item for mean', () => {
      render(<HistogramChart data={validHistogramData} />)
      expect(screen.getByText(/Media \(μ\)/)).toBeInTheDocument()
    })

    it('renders legend item for control limits', () => {
      render(<HistogramChart data={validHistogramData} />)
      expect(screen.getByText(/LCI \/ LCS/)).toBeInTheDocument()
    })

    it('renders the export button', () => {
      render(<HistogramChart data={validHistogramData} />)
      expect(screen.getByTitle('Descargar como imagen')).toBeInTheDocument()
    })
  })

  describe('Empty data handling', () => {
    it('returns null when values array is empty', () => {
      const emptyData: HistogramChartData = {
        type: 'histogram',
        data: {
          values: [],
          lei: 90,
          les: 110,
          mean: 100,
          std: 3.5,
          lcl: 93,
          ucl: 107,
          fitted_distribution: null,
        },
      }
      const { container } = render(<HistogramChart data={emptyData} />)
      expect(container.firstChild).toBeNull()
    })

    it('returns null when data prop is missing data property', () => {
      const invalidData = {
        type: 'histogram',
        data: {
          values: null as unknown as number[],
          lei: 90,
          les: 110,
          mean: 100,
          std: 3.5,
          lcl: 93,
          ucl: 107,
          fitted_distribution: null,
        },
      } as HistogramChartData
      const { container } = render(<HistogramChart data={invalidData} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Reference lines', () => {
    it('renders without crashing when all reference values are provided', () => {
      render(<HistogramChart data={validHistogramData} />)
      expect(screen.getByTestId('histogram-chart')).toBeInTheDocument()
    })

    it('handles null control limits gracefully', () => {
      const dataWithNullLimits: HistogramChartData = {
        type: 'histogram',
        data: {
          values: [95, 97, 100, 102, 105],
          lei: 90,
          les: 110,
          mean: 100,
          std: 3.5,
          lcl: null,
          ucl: null,
          fitted_distribution: null,
        },
      }
      render(<HistogramChart data={dataWithNullLimits} />)
      expect(screen.getByTestId('histogram-chart')).toBeInTheDocument()
    })
  })

  describe('Export functionality', () => {
    it('export button is clickable', async () => {
      render(<HistogramChart data={validHistogramData} />)
      const exportButton = screen.getByTitle('Descargar como imagen')
      expect(exportButton).not.toBeDisabled()
    })

    it('calls export function when clicked', async () => {
      const { exportChartToPng } = await import('@/lib/utils/download-utils')
      const { toast } = await import('sonner')

      render(<HistogramChart data={validHistogramData} />)
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

      render(<HistogramChart data={validHistogramData} />)
      const exportButton = screen.getByTitle('Descargar como imagen')

      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error al exportar el gráfico')
      })
    })
  })

  describe('Fitted distribution', () => {
    it('renders when fitted_distribution is provided', () => {
      const dataWithFittedDist: HistogramChartData = {
        type: 'histogram',
        data: {
          values: [95, 97, 100, 102, 105],
          lei: 90,
          les: 110,
          mean: 100,
          std: 3.5,
          lcl: 93,
          ucl: 107,
          fitted_distribution: {
            name: 'lognormal',
            params: { mu: 4.6, sigma: 0.1 },
          },
        },
      }
      render(<HistogramChart data={dataWithFittedDist} />)
      expect(screen.getByTestId('histogram-chart')).toBeInTheDocument()
    })
  })

  describe('Bin calculation', () => {
    it('renders bins for various data sizes', () => {
      const smallData: HistogramChartData = {
        type: 'histogram',
        data: {
          values: [1, 2, 3, 4, 5],
          lei: 0,
          les: 6,
          mean: 3,
          std: 1.58,
          lcl: 1,
          ucl: 5,
          fitted_distribution: null,
        },
      }
      render(<HistogramChart data={smallData} />)
      expect(screen.getByTestId('histogram-chart')).toBeInTheDocument()
    })

    it('handles single value data', () => {
      const singleValueData: HistogramChartData = {
        type: 'histogram',
        data: {
          values: [100],
          lei: 90,
          les: 110,
          mean: 100,
          std: 0,
          lcl: 100,
          ucl: 100,
          fitted_distribution: null,
        },
      }
      render(<HistogramChart data={singleValueData} />)
      expect(screen.getByTestId('histogram-chart')).toBeInTheDocument()
    })

    it('handles all same values', () => {
      const sameValuesData: HistogramChartData = {
        type: 'histogram',
        data: {
          values: [100, 100, 100, 100, 100],
          lei: 90,
          les: 110,
          mean: 100,
          std: 0,
          lcl: 100,
          ucl: 100,
          fitted_distribution: null,
        },
      }
      render(<HistogramChart data={sameValuesData} />)
      expect(screen.getByTestId('histogram-chart')).toBeInTheDocument()
    })
  })
})
