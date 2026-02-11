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
 * Resolve a color to RGB format, handling CSS variables and modern color functions
 */
function resolveToRgb(color: string): string {
  if (!color || color === 'none' || color === 'transparent' || color === 'inherit' || color === 'currentColor') {
    return color
  }

  // If it's already rgb/rgba, return as-is
  if (color.startsWith('rgb')) {
    return color
  }

  // If it's a hex color, return as-is
  if (color.startsWith('#')) {
    return color
  }

  // For CSS variables or modern color functions, resolve via DOM
  const temp = document.createElement('div')
  temp.style.cssText = `color: ${color} !important; display: none;`
  document.body.appendChild(temp)
  const resolved = getComputedStyle(temp).color
  document.body.removeChild(temp)

  // If still contains lab/oklch, try using background-color
  if (resolved.includes('lab(') || resolved.includes('oklch(')) {
    const temp2 = document.createElement('div')
    temp2.style.cssText = `background-color: ${color} !important; display: none;`
    document.body.appendChild(temp2)
    const resolved2 = getComputedStyle(temp2).backgroundColor
    document.body.removeChild(temp2)
    return resolved2 || color
  }

  return resolved || color
}

/**
 * Inline all styles for SVG elements with resolved RGB colors
 */
function inlineSvgStyles(svg: SVGSVGElement, original: SVGSVGElement): void {
  const originalElements = original.querySelectorAll('*')
  const cloneElements = svg.querySelectorAll('*')

  const styleProps = ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap', 'stroke-linejoin', 'opacity', 'font-size', 'font-family', 'font-weight', 'text-anchor', 'dominant-baseline']

  originalElements.forEach((origEl, i) => {
    const cloneEl = cloneElements[i]
    if (!cloneEl) return

    const computed = getComputedStyle(origEl)
    const styles: string[] = []

    styleProps.forEach(prop => {
      let value = computed.getPropertyValue(prop)
      if (value && value !== 'none' && value !== 'auto' && value !== '') {
        // Resolve colors to RGB
        if (prop === 'fill' || prop === 'stroke') {
          value = resolveToRgb(value)
        }
        styles.push(`${prop}:${value}`)
      }
    })

    // Check for fill/stroke from attributes or computed
    const fillAttr = origEl.getAttribute('fill')
    const strokeAttr = origEl.getAttribute('stroke')
    const computedFill = computed.fill
    const computedStroke = computed.stroke

    if (!styles.some(s => s.startsWith('fill:'))) {
      const fill = fillAttr || computedFill
      if (fill && fill !== 'none') {
        styles.push(`fill:${resolveToRgb(fill)}`)
      }
    }
    if (!styles.some(s => s.startsWith('stroke:'))) {
      const stroke = strokeAttr || computedStroke
      if (stroke && stroke !== 'none') {
        styles.push(`stroke:${resolveToRgb(stroke)}`)
      }
    }

    // Copy stroke-width from attribute if present
    const strokeWidthAttr = origEl.getAttribute('stroke-width')
    if (strokeWidthAttr && !styles.some(s => s.startsWith('stroke-width:'))) {
      styles.push(`stroke-width:${strokeWidthAttr}`)
    }

    if (styles.length > 0) {
      (cloneEl as Element).setAttribute('style', styles.join(';'))
    }
  })
}

/**
 * Convert SVG to a data URL with inlined styles
 */
function svgToDataUrl(svgElement: SVGSVGElement): string {
  const clone = svgElement.cloneNode(true) as SVGSVGElement

  // Inline all computed styles from the original
  inlineSvgStyles(clone, svgElement)

  // Set dimensions
  const rect = svgElement.getBoundingClientRect()
  clone.setAttribute('width', String(rect.width))
  clone.setAttribute('height', String(rect.height))
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')

  // Serialize
  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(clone)

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString)
}

/**
 * Export a chart element to PNG by rendering SVG to canvas
 * This approach avoids html2canvas and its CSS parsing issues
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
    const containerRect = container.getBoundingClientRect()
    const width = containerRect.width * scale
    const height = containerRect.height * scale

    // Create canvas
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context')

    // Fill background
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)

    // Find and render ALL SVGs in the container
    const svgs = container.querySelectorAll('svg')
    for (const svg of svgs) {
      try {
        const svgDataUrl = svgToDataUrl(svg as SVGSVGElement)
        const img = new Image()

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = (e) => {
            console.error('Failed to load SVG:', e)
            resolve() // Continue with other SVGs
          }
          img.src = svgDataUrl
        })

        if (img.width > 0 && img.height > 0) {
          const svgRect = svg.getBoundingClientRect()
          const offsetX = (svgRect.left - containerRect.left) * scale
          const offsetY = (svgRect.top - containerRect.top) * scale
          ctx.drawImage(img, offsetX, offsetY, svgRect.width * scale, svgRect.height * scale)
        }
      } catch (svgError) {
        console.error('Error processing SVG:', svgError)
      }
    }

    // Render text elements (h4, p, span) manually
    const textElements = container.querySelectorAll('h4, p, span')
    ctx.textBaseline = 'top'

    textElements.forEach(el => {
      const textEl = el as HTMLElement
      const text = textEl.textContent?.trim()
      if (!text) return

      const textRect = textEl.getBoundingClientRect()
      // Skip if outside container bounds
      if (textRect.right < containerRect.left || textRect.left > containerRect.right) return

      const computed = getComputedStyle(textEl)
      const fontSize = parseFloat(computed.fontSize) * scale
      const fontWeight = computed.fontWeight
      const fontFamily = computed.fontFamily || 'system-ui, sans-serif'

      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
      ctx.fillStyle = resolveToRgb(computed.color)

      const x = (textRect.left - containerRect.left) * scale
      const y = (textRect.top - containerRect.top) * scale
      ctx.fillText(text, x, y)
    })

    // Render legend color indicators
    const legendColorDivs = container.querySelectorAll('.flex.items-center.gap-1 > div:first-child')
    legendColorDivs.forEach(el => {
      const div = el as HTMLElement
      const divRect = div.getBoundingClientRect()
      if (divRect.width === 0 || divRect.height === 0) return

      const computed = getComputedStyle(div)
      let bgColor = computed.backgroundColor
      if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
        bgColor = div.style.backgroundColor
      }
      if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)') return

      ctx.fillStyle = resolveToRgb(bgColor)
      const x = (divRect.left - containerRect.left) * scale
      const y = (divRect.top - containerRect.top) * scale
      ctx.fillRect(x, y, divRect.width * scale, divRect.height * scale)
    })

    // Convert to blob and download
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob)
        else reject(new Error('Failed to create image blob'))
      }, 'image/png')
    })

    triggerDownload(blob, filename)
  } catch (error) {
    throw new ChartExportError('Failed to export chart as image', error)
  }
}
