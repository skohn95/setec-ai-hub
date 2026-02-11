import html2canvas from 'html2canvas'

/**
 * Utility function to trigger file downloads from static paths
 * Creates an invisible anchor element, triggers click, and cleans up
 *
 * Note: If the file doesn't exist, the browser will show its 404 page.
 * For static files in /public/, ensure the file exists before calling.
 */
export function downloadFile(path: string, filename?: string): void {
  try {
    const link = document.createElement('a')
    link.href = path

    // Extract filename from path if not provided
    const extractedFilename = path.split('/').pop()
    link.download = filename || extractedFilename || 'download'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Failed to initiate download:', error)
  }
}

/**
 * Error class for chart export failures
 */
export class ChartExportError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'ChartExportError'
  }
}

/**
 * Generate a timestamped filename for chart export
 * @param analysisType - Type of analysis (e.g., 'msa', 'gauge-rr', 'variation')
 * @returns Filename in format: {analysisType}-results-{YYYY-MM-DD}.png
 */
export function generateExportFilename(analysisType: string): string {
  const date = new Date().toISOString().split('T')[0]
  return `${analysisType}-results-${date}.png`
}

/**
 * Trigger browser download for a blob
 * @param blob - The blob to download
 * @param filename - The filename for the download
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * Options for chart export
 */
export interface ChartExportOptions {
  /** Background color for the exported image (default: '#ffffff') */
  backgroundColor?: string
  /** Scale factor for higher resolution (default: 2) */
  scale?: number
}

/**
 * Export a chart element to PNG using html2canvas
 * @param chartRef - React ref to the chart container element (React 19 compatible)
 * @param filename - The filename for the downloaded PNG
 * @param options - Optional export configuration
 * @throws {ChartExportError} When export fails
 */
export async function exportChartToPng(
  chartRef: { current: HTMLDivElement | null },
  filename: string,
  options: ChartExportOptions = {}
): Promise<void> {
  if (!chartRef.current) {
    throw new ChartExportError('Chart element not found')
  }

  const { backgroundColor = '#ffffff', scale = 2 } = options

  try {
    const canvas = await html2canvas(chartRef.current, {
      backgroundColor,
      scale,
      logging: false,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false,
    })

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to create image blob'))
        }
      }, 'image/png')
    })

    triggerDownload(blob, filename)
  } catch (error) {
    throw new ChartExportError(
      'Failed to export chart as image',
      error
    )
  }
}
