import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import IChart from './IChart'
import type { IChartData } from '@/types/analysis'

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

describe('IChart', () => {
  const validIChartData: IChartData = {
    type: 'i_chart',
    data: {
      values: [98, 100, 102, 99, 101, 97, 103, 100, 98, 102, 99, 101, 100, 98, 102],
      center: 100,
      ucl: 110,
      lcl: 90,
      ooc_points: [],
      rules_violations: [],
    },
  }

  const dataWithOOCPoints: IChartData = {
    type: 'i_chart',
    data: {
      values: [98, 100, 115, 99, 101, 85, 103, 100, 98, 102, 99, 101, 100, 98, 102],
      center: 100,
      ucl: 110,
      lcl: 90,
      ooc_points: [
        { index: 2, value: 115, limit: 'UCL' },
        { index: 5, value: 85, limit: 'LCL' },
      ],
      rules_violations: [
        { rule: 'rule_1', index: 2, limit: 'UCL' },
        { rule: 'rule_1', index: 5, limit: 'LCL' },
      ],
    },
  }

  describe('Rendering', () => {
    it('renders the I-Chart container', () => {
      render(<IChart data={validIChartData} />)
      expect(screen.getByTestId('i-chart')).toBeInTheDocument()
    })

    it('displays the chart title', () => {
      render(<IChart data={validIChartData} />)
      expect(screen.getByText('Carta I (Valores Individuales)')).toBeInTheDocument()
    })

    it('displays the chart description', () => {
      render(<IChart data={validIChartData} />)
      expect(screen.getByText(/Comportamiento del proceso/)).toBeInTheDocument()
    })

    it('renders the legend', () => {
      render(<IChart data={validIChartData} />)
      expect(screen.getByTestId('i-chart-legend')).toBeInTheDocument()
    })

    it('renders legend item for normal points', () => {
      render(<IChart data={validIChartData} />)
      expect(screen.getByText('Punto Normal')).toBeInTheDocument()
    })

    it('renders legend item for OOC points', () => {
      render(<IChart data={validIChartData} />)
      expect(screen.getByText('Fuera de Control')).toBeInTheDocument()
    })

    it('renders legend item for center line', () => {
      render(<IChart data={validIChartData} />)
      expect(screen.getByText('X̄ (Centro)')).toBeInTheDocument()
    })

    it('renders legend item for control limits', () => {
      render(<IChart data={validIChartData} />)
      expect(screen.getByText('LCI / LCS')).toBeInTheDocument()
    })

    it('renders the export button', () => {
      render(<IChart data={validIChartData} />)
      expect(screen.getByTitle('Descargar como imagen')).toBeInTheDocument()
    })
  })

  describe('Empty data handling', () => {
    it('returns null when values array is empty', () => {
      const emptyData: IChartData = {
        type: 'i_chart',
        data: {
          values: [],
          center: 100,
          ucl: 110,
          lcl: 90,
          ooc_points: [],
          rules_violations: [],
        },
      }
      const { container } = render(<IChart data={emptyData} />)
      expect(container.firstChild).toBeNull()
    })

    it('returns null when data prop is missing values', () => {
      const invalidData = {
        type: 'i_chart',
        data: {
          values: null as unknown as number[],
          center: 100,
          ucl: 110,
          lcl: 90,
          ooc_points: [],
          rules_violations: [],
        },
      } as IChartData
      const { container } = render(<IChart data={invalidData} />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Out-of-control points', () => {
    it('shows OOC count when points exist', () => {
      render(<IChart data={dataWithOOCPoints} />)
      expect(screen.getByText(/2 puntos fuera de control/)).toBeInTheDocument()
    })

    it('does not show OOC count message when no OOC points', () => {
      render(<IChart data={validIChartData} />)
      // Should not have the "X punto(s) fuera de control" message in description
      expect(screen.queryByText(/\d+ puntos? fuera de control/)).not.toBeInTheDocument()
    })

    it('renders correctly with OOC points', () => {
      render(<IChart data={dataWithOOCPoints} />)
      expect(screen.getByTestId('i-chart')).toBeInTheDocument()
    })

    it('shows singular form for single OOC point', () => {
      const singleOOCData: IChartData = {
        type: 'i_chart',
        data: {
          values: [98, 100, 115, 99, 101],
          center: 100,
          ucl: 110,
          lcl: 90,
          ooc_points: [{ index: 2, value: 115, limit: 'UCL' }],
          rules_violations: [],
        },
      }
      render(<IChart data={singleOOCData} />)
      expect(screen.getByText(/1 punto fuera de control/)).toBeInTheDocument()
    })
  })

  describe('Control limits rendering', () => {
    it('renders without crashing when all values are provided', () => {
      render(<IChart data={validIChartData} />)
      expect(screen.getByTestId('i-chart')).toBeInTheDocument()
    })
  })

  describe('Export functionality', () => {
    it('export button is clickable', async () => {
      render(<IChart data={validIChartData} />)
      const exportButton = screen.getByTitle('Descargar como imagen')
      expect(exportButton).not.toBeDisabled()
    })

    it('calls export function when clicked', async () => {
      const { exportChartToPng } = await import('@/lib/utils/download-utils')
      const { toast } = await import('sonner')

      render(<IChart data={validIChartData} />)
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

      render(<IChart data={validIChartData} />)
      const exportButton = screen.getByTitle('Descargar como imagen')

      fireEvent.click(exportButton)

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Error al exportar el gráfico')
      })
    })
  })

  describe('Rules violations', () => {
    it('handles rules violations data', () => {
      render(<IChart data={dataWithOOCPoints} />)
      expect(screen.getByTestId('i-chart')).toBeInTheDocument()
    })

    it('handles empty rules violations', () => {
      const dataNoViolations: IChartData = {
        type: 'i_chart',
        data: {
          values: [98, 100, 102, 99, 101],
          center: 100,
          ucl: 110,
          lcl: 90,
          ooc_points: [],
          rules_violations: [],
        },
      }
      render(<IChart data={dataNoViolations} />)
      expect(screen.getByTestId('i-chart')).toBeInTheDocument()
    })
  })

  describe('Data edge cases', () => {
    it('handles small dataset', () => {
      const smallData: IChartData = {
        type: 'i_chart',
        data: {
          values: [100, 101, 99],
          center: 100,
          ucl: 105,
          lcl: 95,
          ooc_points: [],
          rules_violations: [],
        },
      }
      render(<IChart data={smallData} />)
      expect(screen.getByTestId('i-chart')).toBeInTheDocument()
    })

    it('handles single value', () => {
      const singleValueData: IChartData = {
        type: 'i_chart',
        data: {
          values: [100],
          center: 100,
          ucl: 105,
          lcl: 95,
          ooc_points: [],
          rules_violations: [],
        },
      }
      render(<IChart data={singleValueData} />)
      expect(screen.getByTestId('i-chart')).toBeInTheDocument()
    })

    it('handles large dataset', () => {
      const values = Array.from({ length: 100 }, (_, i) => 100 + Math.sin(i) * 5)
      const largeData: IChartData = {
        type: 'i_chart',
        data: {
          values,
          center: 100,
          ucl: 115,
          lcl: 85,
          ooc_points: [],
          rules_violations: [],
        },
      }
      render(<IChart data={largeData} />)
      expect(screen.getByTestId('i-chart')).toBeInTheDocument()
    })
  })

  describe('Tooltip', () => {
    // Note: Recharts tooltip hover behavior cannot be reliably tested in JSDOM
    // because Recharts uses mouse position calculations that require a real DOM.
    // These tests verify the chart renders with tooltip configured, not actual hover interaction.
    // For full tooltip testing, consider E2E tests with Playwright or Cypress.

    it('chart renders with tooltip configuration', () => {
      render(<IChart data={validIChartData} />)
      expect(screen.getByTestId('i-chart')).toBeInTheDocument()
    })

    it('chart with OOC points includes tooltip for OOC status', () => {
      render(<IChart data={dataWithOOCPoints} />)
      expect(screen.getByTestId('i-chart')).toBeInTheDocument()
    })
  })
})
