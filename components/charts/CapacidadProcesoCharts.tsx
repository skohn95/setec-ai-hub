'use client'

import HistogramChart from './HistogramChart'
import IChart from './IChart'
import MRChart from './MRChart'
import NormalityPlot from './NormalityPlot'
import type {
  CapacidadProcesoChartDataItem,
  HistogramChartData,
  IChartData,
  MRChartData,
  NormalityPlotData,
} from '@/types/analysis'

interface CapacidadProcesoChartsProps {
  chartData: CapacidadProcesoChartDataItem[]
}

/**
 * CapacidadProcesoCharts component renders all chart types
 * for Capacidad de Proceso (Process Capability) analysis.
 *
 * Chart order: Histogram, I-Chart, MR-Chart, Normality Plot
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

  // Find I-Chart data
  const iChartData = chartData.find(
    (item): item is IChartData => item.type === 'i_chart'
  )

  // Find MR-Chart data (Story 8.2)
  const mrChartData = chartData.find(
    (item): item is MRChartData => item.type === 'mr_chart'
  )

  // Find Normality Plot data (Story 8.2)
  const normalityPlotData = chartData.find(
    (item): item is NormalityPlotData => item.type === 'normality_plot'
  )

  // If no recognized chart types, render nothing
  if (!histogramData && !iChartData && !mrChartData && !normalityPlotData) {
    return null
  }

  return (
    <div data-testid="capacidad-proceso-charts" className="space-y-4">
      {histogramData && <HistogramChart data={histogramData} />}
      {iChartData && <IChart data={iChartData} />}
      {mrChartData && <MRChart data={mrChartData} />}
      {normalityPlotData && <NormalityPlot data={normalityPlotData} />}
    </div>
  )
}
