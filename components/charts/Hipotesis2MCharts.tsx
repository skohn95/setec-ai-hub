'use client'

import Hipotesis2MHistogramChart from './Hipotesis2MHistogramChart'
import BoxplotChart from './BoxplotChart'
import type {
  Hipotesis2MChartDataItem,
  Hipotesis2MHistogramData,
  Hipotesis2MBoxplotVarianceData,
  Hipotesis2MBoxplotMeansData,
} from '@/types/analysis'

interface Hipotesis2MChartsProps {
  chartData: Hipotesis2MChartDataItem[]
}

export default function Hipotesis2MCharts({ chartData }: Hipotesis2MChartsProps) {
  if (!chartData || chartData.length === 0) return null

  const histogramA = chartData.find(
    (item): item is Hipotesis2MHistogramData => item.type === 'histogram_a'
  )
  const histogramB = chartData.find(
    (item): item is Hipotesis2MHistogramData => item.type === 'histogram_b'
  )
  const boxplotVariance = chartData.find(
    (item): item is Hipotesis2MBoxplotVarianceData => item.type === 'boxplot_variance'
  )
  const boxplotMeans = chartData.find(
    (item): item is Hipotesis2MBoxplotMeansData => item.type === 'boxplot_means'
  )

  if (!histogramA && !histogramB && !boxplotVariance && !boxplotMeans) return null

  return (
    <div data-testid="hipotesis-2m-charts" className="space-y-4">
      {histogramA && <Hipotesis2MHistogramChart data={histogramA} />}
      {histogramB && <Hipotesis2MHistogramChart data={histogramB} />}
      {boxplotVariance && <BoxplotChart mode="variance" data={boxplotVariance} />}
      {boxplotMeans && <BoxplotChart mode="means" data={boxplotMeans} />}
    </div>
  )
}
