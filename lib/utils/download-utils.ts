import html2canvas from 'html2canvas'

/**
 * Utility function to trigger file downloads from static paths
 */
export function downloadFile(path: string, filename?: string): void {
  try {
    const link = document.createElement('a')
    link.href = path
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
 */
export function generateExportFilename(analysisType: string): string {
  const date = new Date().toISOString().split('T')[0]
  return `${analysisType}-results-${date}.png`
}

/**
 * Trigger browser download for a blob
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export interface ChartExportOptions {
  backgroundColor?: string
  scale?: number
}

/**
 * Get all CSS custom properties (variables) and their computed RGB values
 */
function getCssVariableOverrides(): string {
  const root = document.documentElement
  const computed = getComputedStyle(root)
  const overrides: string[] = []

  // Get all custom properties from stylesheets
  const customProps = new Set<string>()

  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        const text = rule.cssText
        const matches = text.matchAll(/var\((--[^,)]+)/g)
        for (const match of matches) {
          customProps.add(match[1])
        }
      }
    } catch {
      // Cross-origin stylesheets will throw
    }
  }

  // For each variable, get its computed value and convert to RGB if needed
  customProps.forEach(prop => {
    const value = computed.getPropertyValue(prop).trim()
    if (value) {
      // Create temp element to resolve any modern color functions
      const temp = document.createElement('div')
      temp.style.color = value
      document.body.appendChild(temp)
      const resolved = getComputedStyle(temp).color
      document.body.removeChild(temp)

      if (resolved && resolved !== value) {
        overrides.push(`${prop}: ${resolved} !important;`)
      }
    }
  })

  return `:root { ${overrides.join(' ')} }`
}

/**
 * Export a chart element to PNG using html2canvas
 * Injects CSS overrides to convert modern colors to RGB
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

  // Create a style element with CSS variable overrides
  const styleOverride = document.createElement('style')
  styleOverride.id = 'html2canvas-color-fix'
  styleOverride.textContent = getCssVariableOverrides()

  try {
    // Inject the style overrides
    document.head.appendChild(styleOverride)

    // Small delay to ensure styles are applied
    await new Promise(resolve => setTimeout(resolve, 50))

    const canvas = await html2canvas(chartRef.current, {
      backgroundColor,
      scale,
      logging: false,
      useCORS: true,
    })

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create image blob'))
      }, 'image/png')
    })

    triggerDownload(blob, filename)
  } catch (error) {
    throw new ChartExportError('Failed to export chart as image', error)
  } finally {
    // Always clean up the style override
    styleOverride.remove()
  }
}
