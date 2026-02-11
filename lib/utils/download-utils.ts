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
 * Get computed color value, converting CSS variables to actual colors
 */
function getComputedColor(element: Element, property: string): string {
  const computed = getComputedStyle(element).getPropertyValue(property)
  if (computed.includes('var(')) {
    // For CSS variables, try to resolve them
    const temp = document.createElement('div')
    temp.style.color = computed
    document.body.appendChild(temp)
    const resolved = getComputedStyle(temp).color
    document.body.removeChild(temp)
    return resolved
  }
  return computed
}

/**
 * Convert a color value to RGB, handling modern CSS color functions
 */
function convertToRgb(colorValue: string): string {
  if (!colorValue || colorValue === 'none' || colorValue === 'transparent') {
    return colorValue
  }

  // Check if it's a modern color function that needs conversion
  if (colorValue.includes('lab(') || colorValue.includes('oklch(') || colorValue.includes('color(') || colorValue.includes('var(')) {
    const temp = document.createElement('div')
    temp.style.color = colorValue
    document.body.appendChild(temp)
    const resolved = getComputedStyle(temp).color
    document.body.removeChild(temp)
    return resolved
  }

  return colorValue
}

/**
 * Convert SVG element to a data URL with inlined styles
 */
function svgToDataUrl(svgElement: SVGSVGElement): string {
  // Get all original elements and their computed styles BEFORE cloning
  const originalElements = svgElement.querySelectorAll('*')
  const stylesMap = new Map<number, Record<string, string>>()

  const props = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'font-size', 'font-family', 'font-weight', 'opacity', 'color']

  originalElements.forEach((el, index) => {
    const computed = getComputedStyle(el)
    const styles: Record<string, string> = {}

    props.forEach((prop) => {
      const value = computed.getPropertyValue(prop)
      if (value && value !== 'none' && value !== '') {
        styles[prop] = convertToRgb(value)
      }
    })

    // Also get fill and stroke from attributes if not in computed
    const fillAttr = el.getAttribute('fill')
    const strokeAttr = el.getAttribute('stroke')
    if (fillAttr && !styles['fill']) {
      styles['fill'] = convertToRgb(fillAttr)
    }
    if (strokeAttr && !styles['stroke']) {
      styles['stroke'] = convertToRgb(strokeAttr)
    }

    stylesMap.set(index, styles)
  })

  // Clone the SVG
  const clone = svgElement.cloneNode(true) as SVGSVGElement

  // Apply stored styles to cloned elements
  const clonedElements = clone.querySelectorAll('*')
  clonedElements.forEach((el, index) => {
    const styles = stylesMap.get(index)
    if (styles) {
      const styleString = Object.entries(styles)
        .map(([prop, value]) => `${prop}:${value}`)
        .join(';')
      if (styleString) {
        ;(el as SVGElement).setAttribute('style', styleString)
      }
    }
  })

  // Set explicit dimensions
  const bbox = svgElement.getBoundingClientRect()
  clone.setAttribute('width', String(bbox.width))
  clone.setAttribute('height', String(bbox.height))

  // Add xmlns if missing
  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  }

  // Serialize to string
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(clone)

  // Create data URL
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString)
}

/**
 * Export a chart element to PNG by capturing the SVG and rendering to canvas
 * @param chartRef - React ref to the chart container element
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
  const container = chartRef.current

  try {
    // Get container dimensions
    const rect = container.getBoundingClientRect()
    const width = rect.width * scale
    const height = rect.height * scale

    // Create canvas
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Could not get canvas context')
    }

    // Fill background
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)

    // Find all text elements (titles, labels) and SVG
    const svg = container.querySelector('svg')

    if (svg) {
      // Convert SVG to image
      const svgDataUrl = svgToDataUrl(svg as SVGSVGElement)
      const svgImg = new Image()

      await new Promise<void>((resolve, reject) => {
        svgImg.onload = () => resolve()
        svgImg.onerror = () => reject(new Error('Failed to load SVG image'))
        svgImg.src = svgDataUrl
      })

      // Calculate SVG position relative to container
      const svgRect = svg.getBoundingClientRect()
      const offsetX = (svgRect.left - rect.left) * scale
      const offsetY = (svgRect.top - rect.top) * scale

      // Draw SVG
      ctx.drawImage(svgImg, offsetX, offsetY, svgRect.width * scale, svgRect.height * scale)
    }

    // Draw text elements (titles, descriptions, legends)
    const textElements = container.querySelectorAll('h4, p, span')
    ctx.textBaseline = 'top'

    textElements.forEach((el) => {
      const textEl = el as HTMLElement
      const textRect = textEl.getBoundingClientRect()
      const computed = getComputedStyle(textEl)

      // Skip if outside container or empty
      if (!textEl.textContent?.trim()) return

      const offsetX = (textRect.left - rect.left) * scale
      const offsetY = (textRect.top - rect.top) * scale

      // Get font properties
      const fontSize = parseFloat(computed.fontSize) * scale
      const fontWeight = computed.fontWeight
      const fontFamily = computed.fontFamily || 'sans-serif'

      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`

      // Get color - resolve CSS variables
      let color = computed.color
      if (color.includes('lab(') || color.includes('oklch(')) {
        color = '#374151' // fallback to gray
      }
      ctx.fillStyle = color

      ctx.fillText(textEl.textContent || '', offsetX, offsetY)
    })

    // Draw legend colored boxes/lines
    const legendItems = container.querySelectorAll('.flex.items-center.gap-1 > div:first-child')
    legendItems.forEach((el) => {
      const divEl = el as HTMLElement
      const divRect = divEl.getBoundingClientRect()
      const computed = getComputedStyle(divEl)

      const offsetX = (divRect.left - rect.left) * scale
      const offsetY = (divRect.top - rect.top) * scale
      const w = divRect.width * scale
      const h = divRect.height * scale

      let bgColor = computed.backgroundColor
      if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
        // Check for inline style background
        bgColor = divEl.style.backgroundColor || '#cccccc'
      }

      ctx.fillStyle = bgColor
      ctx.fillRect(offsetX, offsetY, w, h)
    })

    // Convert to blob and download
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
