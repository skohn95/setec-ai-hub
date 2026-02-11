'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import {
  GaugeRRChart,
  VariationChart,
  RChartByOperator,
  XBarChartByOperator,
  MeasurementsByPart,
  MeasurementsByOperator,
  InteractionPlot,
  StaticChartDisplay,
} from '@/components/charts'
import FileAttachmentCard from './FileAttachmentCard'
import type { MessageRowWithFiles } from '@/lib/supabase/messages'
import type {
  ChartDataItem,
  StaticChartDataItem,
  VariationChartDataItem,
  RChartData,
  XBarChartData,
  MeasurementsByPartItem,
  MeasurementsByOperatorItem,
  InteractionPlotData,
} from '@/types/api'

interface ChatMessageProps {
  message: MessageRowWithFiles
  onDownload?: (fileId: string) => void
  downloadingFileIds?: string[]
}

/**
 * Format timestamp for display
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}


/**
 * ChatMessage component displays a single message in the chat
 * User messages are aligned right with primary background
 * Assistant messages are aligned left with muted background
 * Renders file attachments above the message content
 * Shows charts when available
 */
export default function ChatMessage({
  message,
  onDownload,
  downloadingFileIds = [],
}: ChatMessageProps) {
  const isUser = message.role === 'user'
  const hasFiles = message.files && message.files.length > 0

  // Extract chartData from metadata for assistant messages
  // metadata is typed as Json which can be various types - need to cast for access
  const metadata = message.metadata as Record<string, unknown> | null
  const rawChartData = !isUser && metadata?.chartData
    ? (metadata.chartData as (ChartDataItem | StaticChartDataItem)[])
    : null

  // Detect if charts are static (server-rendered images) or dynamic (JSON data)
  // Static charts have 'image' property, dynamic charts have 'data' property
  const isStaticCharts = rawChartData && rawChartData.length > 0 && 'image' in rawChartData[0]
  const staticChartData = isStaticCharts ? (rawChartData as StaticChartDataItem[]) : null
  const chartData = !isStaticCharts ? (rawChartData as ChartDataItem[] | null) : null

  // Extract operator comparison data and transform to variation data for VariationChart
  const variationData: VariationChartDataItem[] | null = (() => {
    if (!chartData) return null
    const operatorChart = chartData.find((d) => d.type === 'operatorComparison')
    if (!operatorChart) return null
    // Transform operatorComparison data to variation data (stdDev becomes variation)
    return (operatorChart.data as { operator: string; mean: number; stdDev: number }[]).map(
      (item) => ({
        operator: item.operator,
        variation: item.stdDev,
      })
    )
  })()

  // Extract new chart data types
  const rChartData: RChartData | null = (() => {
    if (!chartData) return null
    const chart = chartData.find((d) => d.type === 'rChartByOperator')
    return chart ? (chart.data as unknown as RChartData) : null
  })()

  const xBarChartData: XBarChartData | null = (() => {
    if (!chartData) return null
    const chart = chartData.find((d) => d.type === 'xBarChartByOperator')
    return chart ? (chart.data as unknown as XBarChartData) : null
  })()

  const measurementsByPartData: MeasurementsByPartItem[] | null = (() => {
    if (!chartData) return null
    const chart = chartData.find((d) => d.type === 'measurementsByPart')
    return chart ? (chart.data as MeasurementsByPartItem[]) : null
  })()

  const measurementsByOperatorData: MeasurementsByOperatorItem[] | null = (() => {
    if (!chartData) return null
    const chart = chartData.find((d) => d.type === 'measurementsByOperator')
    return chart ? (chart.data as MeasurementsByOperatorItem[]) : null
  })()

  const interactionPlotData: InteractionPlotData | null = (() => {
    if (!chartData) return null
    const chart = chartData.find((d) => d.type === 'interactionPlot')
    return chart ? (chart.data as unknown as InteractionPlotData) : null
  })()

  const handleDownload = (fileId: string) => {
    onDownload?.(fileId)
  }

  return (
    <div
      data-testid="chat-message"
      role="listitem"
      className="group px-4 md:px-8 py-2"
    >
      <div className={cn(
        'flex flex-col',
        isUser ? 'items-end' : 'items-start'
      )}>
        {/* File attachments */}
        {hasFiles && (
          <div data-testid="file-attachments" className="flex flex-col gap-2 mb-2">
            {message.files!.map((file) => (
              <FileAttachmentCard
                key={file.id}
                file={file}
                onDownload={handleDownload}
                isDownloading={downloadingFileIds.includes(file.id)}
              />
            ))}
          </div>
        )}

        {/* Message bubble - hide if only file attachment placeholder */}
        {!(hasFiles && message.content === '[Archivo adjunto]') && (
          <div
            data-testid="message-bubble"
            className={cn(
              'inline-block text-sm leading-relaxed max-w-[85%] md:max-w-[70%]',
              isUser
                ? 'bg-setec-orange text-white px-4 py-3 rounded-2xl rounded-tr-md shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-3 rounded-2xl rounded-tl-md shadow-sm'
            )}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            ) : (
              <div className="markdown-content break-words prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2 prose-ul:my-2 prose-li:my-0">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {/* Timestamp below bubble */}
        <span className="text-[10px] text-gray-400 mt-1 px-1">
          {formatTime(message.created_at)}
        </span>

        {/* Charts Container */}
        {(staticChartData || (chartData && chartData.length > 0)) && (
          <div
            data-testid="analysis-results-container"
            className="mt-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-4 rounded-2xl rounded-tl-md shadow-sm max-w-[85%] md:max-w-[70%] space-y-4"
          >
            {/* Static charts (server-rendered images) */}
            {staticChartData && staticChartData.length > 0 && (
              <StaticChartDisplay charts={staticChartData} />
            )}
            {/* Dynamic charts (client-side Recharts) - backwards compatibility */}
            {chartData && chartData.length > 0 && <GaugeRRChart data={chartData} />}
            {rChartData && <RChartByOperator data={rChartData} />}
            {xBarChartData && <XBarChartByOperator data={xBarChartData} />}
            {measurementsByPartData && measurementsByPartData.length > 0 && (
              <MeasurementsByPart data={measurementsByPartData} />
            )}
            {measurementsByOperatorData && measurementsByOperatorData.length > 0 && (
              <MeasurementsByOperator data={measurementsByOperatorData} />
            )}
            {interactionPlotData && <InteractionPlot data={interactionPlotData} />}
          </div>
        )}
      </div>
    </div>
  )
}
