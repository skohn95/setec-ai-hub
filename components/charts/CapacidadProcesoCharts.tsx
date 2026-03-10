'use client'

import HistogramChart from './HistogramChart'
import NormalityPlot from './NormalityPlot'
import type {
  CapacidadProcesoChartDataItem,
  HistogramChartData,
  NormalityPlotData,
} from '@/types/analysis'

interface CapacidadProcesoChartsProps {
  chartData: CapacidadProcesoChartDataItem[]
}

/**
 * CapacidadProcesoCharts component renders all chart types
 * for Capacidad de Proceso (Process Capability) analysis.
 *
 * Chart order: Histogram, Normality Plot
 *
 * Accepts chartData array from analysis results and renders
 * appropriate chart components based on chart type.
 */
export default function CapacidadProcesoCharts({ chartData }: CapacidadProcesoChartsProps) {
  if (!chartData || chartData.length === 0) {
    return null
  }

  // Find histogram chart data
  const histogramData = chartData.find(
    (item): item is HistogramChartData => item.type === 'histogram'
  )

  // Find Normality Plot data
  const normalityPlotData = chartData.find(
    (item): item is NormalityPlotData => item.type === 'normality_plot'
  )

  // If no recognized chart types, render nothing
  if (!histogramData && !normalityPlotData) {
    return null
  }

  return (
    <div data-testid="capacidad-proceso-charts" className="space-y-4">
      {histogramData && <HistogramChart data={histogramData} />}
      {normalityPlotData && <NormalityPlot data={normalityPlotData} />}
    </div>
  )
}
