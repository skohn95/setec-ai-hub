'use client'

import { User, Bot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { GaugeRRChart, VariationChart } from '@/components/charts'
import FileAttachmentCard from './FileAttachmentCard'
import ResultsDisplay from './ResultsDisplay'
import type { MessageRowWithFiles } from '@/lib/supabase/messages'
import type { ChartDataItem, MSAResults, VariationChartDataItem } from '@/types/api'

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
  })
}

/**
 * Render text with basic markdown formatting (bold, line breaks)
 * Parses **text** for bold and preserves newlines
 */
function renderFormattedText(text: string): React.ReactNode {
  // Split by bold markers and line breaks
  const parts = text.split(/(\*\*[^*]+\*\*)/g)

  return parts.map((part, index) => {
    // Check if this part is bold text
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2)
      return (
        <strong key={index} className="font-semibold">
          {boldText}
        </strong>
      )
    }
    return <span key={index}>{part}</span>
  })
}

/**
 * Check if message content contains analysis results
 * Only requires 'results' - chartData is separately checked for GaugeRRChart
 */
function hasAnalysisResults(metadata: Record<string, unknown> | null): boolean {
  return Boolean(metadata?.results)
}

/**
 * ChatMessage component displays a single message in the chat
 * User messages are aligned right with primary background
 * Assistant messages are aligned left with muted background
 * Renders file attachments above the message content
 * Shows analysis results with ResultsDisplay component when available
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
  const chartData =
    !isUser && metadata?.chartData
      ? (metadata.chartData as ChartDataItem[])
      : null

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

  // Extract analysis results from metadata for ResultsDisplay
  const analysisResults =
    !isUser && hasAnalysisResults(metadata)
      ? (metadata?.results as MSAResults)
      : null

  const handleDownload = (fileId: string) => {
    onDownload?.(fileId)
  }

  return (
    <div
      data-testid="chat-message"
      role="listitem"
      className={cn(
        'flex items-end gap-2 px-4 py-2',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Avatar for assistant messages (shown on left) */}
      {!isUser && (
        <Avatar size="sm" data-testid="bot-avatar">
          <AvatarFallback className="bg-muted">
            <Bot className="h-4 w-4 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message content container with file attachments */}
      <div className={cn('flex flex-col gap-2 max-w-[70%]', isUser && 'items-end')}>
        {/* File attachments - displayed above message content */}
        {hasFiles && (
          <div data-testid="file-attachments" className="flex flex-col gap-2">
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

        {/* Message bubble with tooltip for timestamp */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              data-testid="message-bubble"
              className={cn(
                'rounded-2xl px-4 py-2 text-sm',
                isUser
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-muted text-foreground rounded-bl-md'
              )}
            >
              {/* Message content - supports multiline and basic markdown */}
              <p className="whitespace-pre-wrap break-words">
                {isUser ? message.content : renderFormattedText(message.content)}
              </p>
            </div>
          </TooltipTrigger>
          <TooltipContent side={isUser ? 'left' : 'right'}>
            {formatTime(message.created_at)}
          </TooltipContent>
        </Tooltip>

        {/* Analysis Results Container - grouped for clear visual delineation */}
        {(analysisResults || (chartData && chartData.length > 0)) && (
          <Card data-testid="analysis-results-container" className="mt-2 border-l-4 border-orange-500">
            <CardContent className="p-4 space-y-4">
              {/* Results summary card */}
              {analysisResults && (
                <ResultsDisplay
                  data-testid="analysis-results-display"
                  results={analysisResults}
                  className="w-full"
                />
              )}

              {/* Chart display for assistant messages with analysis results */}
              {chartData && chartData.length > 0 && <GaugeRRChart data={chartData} />}

              {/* Variation chart showing per-operator variation (derived from operatorComparison data) */}
              {variationData && variationData.length > 0 && <VariationChart data={variationData} />}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Avatar for user messages (shown on right) */}
      {isUser && (
        <Avatar size="sm" data-testid="user-avatar">
          <AvatarFallback className="bg-primary">
            <User className="h-4 w-4 text-primary-foreground" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}
