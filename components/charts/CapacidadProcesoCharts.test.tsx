import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import CapacidadProcesoCharts from './CapacidadProcesoCharts'
import type {
  HistogramChartData,
  IChartData,
  MRChartData,
  NormalityPlotData,
  CapacidadProcesoChartDataItem,
} from '@/types/analysis'

// Mock child chart components to isolate container testing
vi.mock('./HistogramChart', () => ({
  default: () => <div data-testid="histogram-chart">HistogramChart</div>,
}))

vi.mock('./IChart', () => ({
  default: () => <div data-testid="i-chart">IChart</div>,
}))

vi.mock('./MRChart', () => ({
  default: () => <div data-testid="mr-chart">MRChart</div>,
}))

vi.mock('./NormalityPlot', () => ({
  default: () => <div data-testid="normality-plot">NormalityPlot</div>,
}))

// Mock ResizeObserver for ResponsiveContainer
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
})

/**
 * Test fixtures for chart data
 */
const createHistogramData = (): HistogramChartData => ({
  type: 'histogram',
  data: {
    values: [95, 100, 105, 98, 102],
    lei: 90,
    les: 110,
    mean: 100,
    std: 3.5,
    lcl: 89.5,
    ucl: 110.5,
    fitted_distribution: null,
  },
})

const createIChartData = (): IChartData => ({
  type: 'i_chart',
  data: {
    values: [95, 100, 105, 98, 102],
    center: 100,
    ucl: 110,
    lcl: 90,
    ooc_points: [],
    rules_violations: [],
  },
})

const createMRChartData = (): MRChartData => ({
  type: 'mr_chart',
  data: {
    values: [5, 5, 7, 4],
    center: 5.25,
    ucl: 17.15,
    lcl: 0,
    ooc_points: [],
  },
})

const createNormalityPlotData = (): NormalityPlotData => ({
  type: 'normality_plot',
  data: {
    points: [
      { actual: 95, expected: -1.28, index: 0 },
      { actual: 98, expected: -0.52, index: 1 },
      { actual: 100, expected: 0, index: 2 },
      { actual: 102, expected: 0.52, index: 3 },
      { actual: 105, expected: 1.28, index: 4 },
    ],
    fit_line: { slope: 3.9, intercept: 100 },
    confidence_bands: {
      lower: [93, 96.5, 98.5, 100.5, 103],
      upper: [97, 99.5, 101.5, 103.5, 107],
    },
    anderson_darling: {
      statistic: 0.25,
      p_value: 0.72,
      is_normal: true,
    },
  },
})

describe('CapacidadProcesoCharts', () => {
  describe('Rendering', () => {
    it('renders container when chartData is provided', () => {
      const chartData: CapacidadProcesoChartDataItem[] = [createHistogramData()]
      render(<CapacidadProcesoCharts chartData={chartData} />)
      expect(screen.getByTestId('capacidad-proceso-charts')).toBeInTheDocument()
    })

    it('returns null when chartData is empty', () => {
      const { container } = render(<CapacidadProcesoCharts chartData={[]} />)
      expect(container.firstChild).toBeNull()
    })

    it('returns null when chartData is undefined', () => {
      const { container } = render(
        <CapacidadProcesoCharts chartData={undefined as unknown as CapacidadProcesoChartDataItem[]} />
      )
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Individual Chart Rendering', () => {
    it('renders HistogramChart when histogram data is provided', () => {
      const chartData: CapacidadProcesoChartDataItem[] = [createHistogramData()]
      render(<CapacidadProcesoCharts chartData={chartData} />)
      expect(screen.getByTestId('histogram-chart')).toBeInTheDocument()
    })

    it('renders IChart when i_chart data is provided', () => {
      const chartData: CapacidadProcesoChartDataItem[] = [createIChartData()]
      render(<CapacidadProcesoCharts chartData={chartData} />)
      expect(screen.getByTestId('i-chart')).toBeInTheDocument()
    })

    it('renders MRChart when mr_chart data is provided', () => {
      const chartData: CapacidadProcesoChartDataItem[] = [createMRChartData()]
      render(<CapacidadProcesoCharts chartData={chartData} />)
      expect(screen.getByTestId('mr-chart')).toBeInTheDocument()
    })

    it('renders NormalityPlot when normality_plot data is provided', () => {
      const chartData: CapacidadProcesoChartDataItem[] = [createNormalityPlotData()]
      render(<CapacidadProcesoCharts chartData={chartData} />)
      expect(screen.getByTestId('normality-plot')).toBeInTheDocument()
    })
  })

  describe('Chart Order', () => {
    it('renders charts in correct order: Histogram, I-Chart, MR-Chart, Normality Plot', () => {
      const chartData: CapacidadProcesoChartDataItem[] = [
        createHistogramData(),
        createIChartData(),
        createMRChartData(),
        createNormalityPlotData(),
      ]
      render(<CapacidadProcesoCharts chartData={chartData} />)

      const container = screen.getByTestId('capacidad-proceso-charts')
      const children = container.children

      // Verify order of rendered charts
      expect(children[0]).toHaveAttribute('data-testid', 'histogram-chart')
      expect(children[1]).toHaveAttribute('data-testid', 'i-chart')
      expect(children[2]).toHaveAttribute('data-testid', 'mr-chart')
      expect(children[3]).toHaveAttribute('data-testid', 'normality-plot')
    })

    it('maintains correct order even when data provided in different order', () => {
      // Provide data in reverse order
      const chartData: CapacidadProcesoChartDataItem[] = [
        createNormalityPlotData(),
        createMRChartData(),
        createIChartData(),
        createHistogramData(),
      ]
      render(<CapacidadProcesoCharts chartData={chartData} />)

      const container = screen.getByTestId('capacidad-proceso-charts')
      const children = container.children

      // Component should render in correct order regardless of input order
      expect(children[0]).toHaveAttribute('data-testid', 'histogram-chart')
      expect(children[1]).toHaveAttribute('data-testid', 'i-chart')
      expect(children[2]).toHaveAttribute('data-testid', 'mr-chart')
      expect(children[3]).toHaveAttribute('data-testid', 'normality-plot')
    })
  })

  describe('Partial Chart Data', () => {
    it('renders only available charts when some are missing', () => {
      const chartData: CapacidadProcesoChartDataItem[] = [
        createIChartData(),
        createMRChartData(),
      ]
      render(<CapacidadProcesoCharts chartData={chartData} />)

      expect(screen.queryByTestId('histogram-chart')).not.toBeInTheDocument()
      expect(screen.getByTestId('i-chart')).toBeInTheDocument()
      expect(screen.getByTestId('mr-chart')).toBeInTheDocument()
      expect(screen.queryByTestId('normality-plot')).not.toBeInTheDocument()
    })

    it('renders only histogram when only histogram data provided', () => {
      const chartData: CapacidadProcesoChartDataItem[] = [createHistogramData()]
      render(<CapacidadProcesoCharts chartData={chartData} />)

      expect(screen.getByTestId('histogram-chart')).toBeInTheDocument()
      expect(screen.queryByTestId('i-chart')).not.toBeInTheDocument()
      expect(screen.queryByTestId('mr-chart')).not.toBeInTheDocument()
      expect(screen.queryByTestId('normality-plot')).not.toBeInTheDocument()
    })

    it('renders only normality plot when only normality data provided', () => {
      const chartData: CapacidadProcesoChartDataItem[] = [createNormalityPlotData()]
      render(<CapacidadProcesoCharts chartData={chartData} />)

      expect(screen.queryByTestId('histogram-chart')).not.toBeInTheDocument()
      expect(screen.queryByTestId('i-chart')).not.toBeInTheDocument()
      expect(screen.queryByTestId('mr-chart')).not.toBeInTheDocument()
      expect(screen.getByTestId('normality-plot')).toBeInTheDocument()
    })
  })

  describe('Empty/Missing Data Handling', () => {
    it('returns null when no recognized chart types exist', () => {
      // Create an array with an unrecognized type (cast to bypass TypeScript)
      const chartData = [{ type: 'unknown_chart', data: {} }] as CapacidadProcesoChartDataItem[]
      const { container } = render(<CapacidadProcesoCharts chartData={chartData} />)
      expect(container.firstChild).toBeNull()
    })

    it('handles mixed valid and invalid chart types gracefully', () => {
      const chartData = [
        { type: 'unknown_chart', data: {} } as unknown as CapacidadProcesoChartDataItem,
        createIChartData(),
      ]
      render(<CapacidadProcesoCharts chartData={chartData} />)
      expect(screen.getByTestId('i-chart')).toBeInTheDocument()
    })
  })

  describe('CSS Classes', () => {
    it('applies correct spacing class to container', () => {
      const chartData: CapacidadProcesoChartDataItem[] = [createHistogramData()]
      render(<CapacidadProcesoCharts chartData={chartData} />)
      const container = screen.getByTestId('capacidad-proceso-charts')
      expect(container).toHaveClass('space-y-4')
    })
  })
})
