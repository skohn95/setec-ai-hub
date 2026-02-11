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
 * Convert modern CSS color functions (lab, oklch, etc.) to RGB
 */
function resolveColor(color: string): string {
  if (!color || color === 'none' || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
    return color
  }

  // Check if needs conversion
  if (color.includes('lab(') || color.includes('oklch(') || color.includes('color(') || color.includes('var(')) {
    const temp = document.createElement('div')
    temp.style.cssText = `color: ${color} !important;`
    document.body.appendChild(temp)
    const resolved = getComputedStyle(temp).color
    document.body.removeChild(temp)
    return resolved || color
  }

  return color
}

/**
 * Inline all computed styles on an element and its descendants,
 * converting modern CSS colors to RGB for html2canvas compatibility
 */
function inlineStyles(element: HTMLElement): void {
  const processElement = (el: Element) => {
    const computed = getComputedStyle(el)
    const htmlEl = el as HTMLElement

    // Properties that might contain lab() colors
    const colorProps = [
      'color', 'backgroundColor', 'borderColor', 'borderTopColor',
      'borderRightColor', 'borderBottomColor', 'borderLeftColor',
      'outlineColor', 'fill', 'stroke'
    ]

    colorProps.forEach(prop => {
      const value = computed.getPropertyValue(prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase()))
      if (value && value !== 'none' && value !== 'transparent') {
        const resolved = resolveColor(value)
        if (resolved !== value) {
          htmlEl.style.setProperty(prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase()), resolved, 'important')
        }
      }
    })

    // For SVG elements, also handle fill and stroke attributes
    if (el instanceof SVGElement) {
      const fill = computed.fill || el.getAttribute('fill')
      const stroke = computed.stroke || el.getAttribute('stroke')

      if (fill) {
        const resolvedFill = resolveColor(fill)
        htmlEl.style.setProperty('fill', resolvedFill, 'important')
      }
      if (stroke) {
        const resolvedStroke = resolveColor(stroke)
        htmlEl.style.setProperty('stroke', resolvedStroke, 'important')
      }
    }
  }

  // Process the element and all descendants
  processElement(element)
  element.querySelectorAll('*').forEach(processElement)
}

/**
 * Export a chart element to PNG using html2canvas
 * Preprocesses the element to convert modern CSS colors to RGB
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
  const original = chartRef.current

  try {
    // Clone the element to avoid modifying the original
    const clone = original.cloneNode(true) as HTMLElement

    // Position the clone off-screen but still in the document for style computation
    clone.style.position = 'absolute'
    clone.style.left = '-9999px'
    clone.style.top = '0'
    clone.style.width = `${original.offsetWidth}px`
    clone.style.height = `${original.offsetHeight}px`
    document.body.appendChild(clone)

    // Inline all styles, converting lab() colors to RGB
    inlineStyles(clone)

    // Use html2canvas on the preprocessed clone
    const canvas = await html2canvas(clone, {
      backgroundColor,
      scale,
      logging: false,
      useCORS: true,
    })

    // Clean up
    document.body.removeChild(clone)

    // Convert to blob and download
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create image blob'))
      }, 'image/png')
    })

    triggerDownload(blob, filename)
  } catch (error) {
    throw new ChartExportError('Failed to export chart as image', error)
  }
}
