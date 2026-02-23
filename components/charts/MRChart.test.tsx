import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import MRChart from './MRChart'
import type { MRChartData } from '@/types/analysis'

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

describe('MRChart', () => {
  const validMRChartData: MRChartData = {
    type: 'mr_chart',
    data: {
      values: [5.2, 3.1, 8.4, 2.0, 6.7, 4.3, 7.1, 3.8, 5.5, 4.2],
      center: 5.03,
      ucl: 16.43,
      lcl: 0,
      ooc_points: [],
    },
  }

  const dataWithOOCPoints: MRChartData = {
    type: 'mr_chart',
    data: {
      values: [5.2, 3.1, 20.5, 2.0, 18.3, 4.3, 7.1, 3.8, 5.5, 4.2],
      center: 5.03,
      ucl: 16.43,
      lcl: 0,
      ooc_points: [
        { index: 2, value: 20.5 },
        { index: 4, value: 18.3 },
      ],
    },
  }

  describe('Rendering', () => {
    it('renders the MR-Chart container', () => {
      render(<MRChart data={validMRChartData} />)
      expect(screen.getByTestId('mr-chart')).toBeInTheDocument()
    })

    it('displays the chart title', () => {
      render(<MRChart data={validMRChartData} />)
      expect(screen.getByText('Carta MR (Rango Móvil)')).toBeInTheDocument()
    })

    it('displays the chart description', () => {
      render(<MRChart data={validMRChartData} />)
      expect(screen.getByText(/Variabilidad entre observaciones consecutivas/)).toBeInTheDocument()
    })

    it('renders the legend', () => {
      render(<MRChart data={validMRChartData} />)
      expect(screen.getByTestId('mr-chart-legend')).toBeInTheDocument()
    })

    it('renders legend item for normal points', () => {
      render(<MRChart data={validMRChartData} />)
      expect(screen.getByText('Punto Normal')).toBeInTheDocument()
    })

    it('renders legend item for OOC points', () => {
      render(<MRChart data={validMRChartData} />)
      expect(screen.getByText('Fuera de Control')).toBeInTheDocument()
    })

    it('renders legend item for center line', () => {
      render(<MRChart data={validMRChartData} />)
      expect(screen.getByText('MR̄ (Centro)')).toBeInTheDocument()
    })

    it('renders legend item for UCL', () => {
      render(<MRChart data={validMRChartData} />)
      expect(screen.getByText('LCS')).toBeInTheDocument()
    })

    it('renders the export button', () => {
      render(<MRChart data={validMRChartData} />)
      expect(screen.getByTitle('Descargar como imagen')).toBeInTheDocument()
    })
  })

  describe('Empty data handling', () => {
    it('returns null when values array is empty', () => {
      const emptyData: MRChartData = {
        type: 'mr_chart',
        data: {
          values: [],
          center: 5.0,
          ucl: 16.0,
          lcl: 0,
          ooc_points: [],
        },
      }
      const { container } = render(<MRChart data={emptyData} />)
      expect(container.firstChild).toBeNull()
    })

    it('returns null when data prop is missing values', () => {
      const invalidData = {
        type: 'mr_chart',
        data: {
          values: null as unknown as number[],
          center: 5.0,
          ucl: 16.0,
          lcl: 0,
          ooc_points: [],
        },
      } as MRChartData
      const { container } = render(<MRChart data={invalidData} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Out-of-control points', () => {
    it('shows OOC count when points exist', () => {
      render(<MRChart data={dataWithOOCPoints} />)
      expect(screen.getByText(/2 puntos fuera de control/)).toBeInTheDocument()
    })

    it('does not show OOC count message when no OOC points', () => {
      render(<MRChart data={validMRChartData} />)
      expect(screen.queryByText(/\d+ puntos? fuera de control/)).not.toBeInTheDocument()
    })

    it('renders correctly with OOC points', () => {
      render(<MRChart data={dataWithOOCPoints} />)
      expect(screen.getByTestId('mr-chart')).toBeInTheDocument()
    })

    it('shows singular form for single OOC point', () => {
      const singleOOCData: MRChartData = {
        type: 'mr_chart',
        data: {
          values: [5.2, 3.1, 20.5, 2.0, 6.7],
          center: 5.0,
          ucl: 16.0,
          lcl: 0,
          ooc_points: [{ index: 2, value: 20.5 }],
        },
      }
      render(<MRChart data={singleOOCData} />)
      expect(screen.getByText(/1 punto fuera de control/)).toBeInTheDocument()
    })
  })

  describe('Control limits', () => {
    it('renders without crashing when all values are provided', () => {
      render(<MRChart data={validMRChartData} />)
      expect(screen.getByTestId('mr-chart')).toBeInTheDocument()
    })

    it('handles zero center line', () => {
      const zeroData: MRChartData = {
        type: 'mr_chart',
        data: {
          values: [0, 0, 0, 0, 0],
          center: 0,
          ucl: 0,
          lcl: 0,
          ooc_points: [],
        },
      }
      render(<MRChart data={zeroData} />)
      expect(screen.getByTestId('mr-chart')).toBeInTheDocument()
    })
  })

  describe('Export functionality', () => {
    it('export button is clickable', () => {
      render(<MRChart data={validMRChartData} />)
      const exportButton = screen.getByTitle('Descargar como imagen')
      expect(exportButton).not.toBeDisabled()
    })

    it('calls export function when clicked', async () => {
      const { exportChartToPng } = await import('@/lib/utils/download-utils')
      const { toast } = await import('sonner')

      render(<MRChart data={validMRChartData} />)
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

      render(<MRChart data={validMRChartData} />)
      const exportButton = screen.getByTitle('Descargar como imagen')

      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error al exportar el gráfico')
      })
    })
  })

  describe('Data edge cases', () => {
    it('handles small dataset (2 values)', () => {
      const smallData: MRChartData = {
        type: 'mr_chart',
        data: {
          values: [5.0, 3.2],
          center: 4.1,
          ucl: 13.4,
          lcl: 0,
          ooc_points: [],
        },
      }
      render(<MRChart data={smallData} />)
      expect(screen.getByTestId('mr-chart')).toBeInTheDocument()
    })

    it('handles single value', () => {
      const singleValueData: MRChartData = {
        type: 'mr_chart',
        data: {
          values: [5.0],
          center: 5.0,
          ucl: 16.0,
          lcl: 0,
          ooc_points: [],
        },
      }
      render(<MRChart data={singleValueData} />)
      expect(screen.getByTestId('mr-chart')).toBeInTheDocument()
    })

    it('handles large dataset', () => {
      const values = Array.from({ length: 100 }, (_, i) => Math.abs(Math.sin(i) * 10))
      const largeData: MRChartData = {
        type: 'mr_chart',
        data: {
          values,
          center: 5.0,
          ucl: 16.0,
          lcl: 0,
          ooc_points: [],
        },
      }
      render(<MRChart data={largeData} />)
      expect(screen.getByTestId('mr-chart')).toBeInTheDocument()
    })

    it('handles all OOC points', () => {
      const values = [20.0, 18.5, 19.2]
      const allOOCData: MRChartData = {
        type: 'mr_chart',
        data: {
          values,
          center: 5.0,
          ucl: 10.0,
          lcl: 0,
          ooc_points: values.map((value, index) => ({ index, value })),
        },
      }
      render(<MRChart data={allOOCData} />)
      expect(screen.getByText(/3 puntos fuera de control/)).toBeInTheDocument()
    })
  })

  describe('Tooltip', () => {
    // Note: Recharts tooltip hover behavior cannot be reliably tested in JSDOM
    // because Recharts uses mouse position calculations that require a real DOM.
    // These tests verify the chart renders with tooltip configured.

    it('chart renders with tooltip configuration', () => {
      render(<MRChart data={validMRChartData} />)
      expect(screen.getByTestId('mr-chart')).toBeInTheDocument()
    })

    it('chart with OOC points includes tooltip for OOC status', () => {
      render(<MRChart data={dataWithOOCPoints} />)
      expect(screen.getByTestId('mr-chart')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has accessible chart title', () => {
      render(<MRChart data={validMRChartData} />)
      expect(screen.getByRole('heading', { level: 4 })).toHaveTextContent('Carta MR (Rango Móvil)')
    })

    it('export button has accessible title', () => {
      render(<MRChart data={validMRChartData} />)
      expect(screen.getByTitle('Descargar como imagen')).toBeInTheDocument()
    })
  })
})
