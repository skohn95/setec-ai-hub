import { Canvg } from 'canvg'

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
 * Resolve a color to RGB format
 */
function resolveToRgb(color: string): string {
  if (!color || color === 'none' || color === 'transparent' || color === 'inherit') {
    return color
  }
  if (color.startsWith('rgb') || color.startsWith('#')) {
    return color
  }
  const temp = document.createElement('div')
  temp.style.cssText = `color: ${color} !important; display: none;`
  document.body.appendChild(temp)
  const resolved = getComputedStyle(temp).color
  document.body.removeChild(temp)
  return resolved || color
}

/**
 * Get a complete SVG string with inlined styles from the DOM
 */
function getSvgWithInlinedStyles(svgElement: SVGSVGElement): string {
  const clone = svgElement.cloneNode(true) as SVGSVGElement
  const originalElements = svgElement.querySelectorAll('*')
  const cloneElements = clone.querySelectorAll('*')

  const styleProps = [
    'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap',
    'stroke-linejoin', 'opacity', 'font-size', 'font-family', 'font-weight',
    'text-anchor', 'dominant-baseline', 'visibility', 'display'
  ]

  originalElements.forEach((origEl, i) => {
    const cloneEl = cloneElements[i]
    if (!cloneEl) return

    const computed = getComputedStyle(origEl)
    const styles: string[] = []

    styleProps.forEach(prop => {
      const value = computed.getPropertyValue(prop)
      if (value && value !== 'none' && value !== 'auto' && value !== '' && value !== 'normal') {
        const resolved = (prop === 'fill' || prop === 'stroke') ? resolveToRgb(value) : value
        styles.push(`${prop}:${resolved}`)
      }
    })

    // Get fill/stroke from attributes as fallback
    const fillAttr = origEl.getAttribute('fill')
    const strokeAttr = origEl.getAttribute('stroke')
    const strokeWidthAttr = origEl.getAttribute('stroke-width')

    if (fillAttr && !styles.some(s => s.startsWith('fill:'))) {
      styles.push(`fill:${resolveToRgb(fillAttr)}`)
    }
    if (strokeAttr && !styles.some(s => s.startsWith('stroke:'))) {
      styles.push(`stroke:${resolveToRgb(strokeAttr)}`)
    }
    if (strokeWidthAttr && !styles.some(s => s.startsWith('stroke-width:'))) {
      styles.push(`stroke-width:${strokeWidthAttr}`)
    }

    if (styles.length > 0) {
      cloneEl.setAttribute('style', styles.join(';'))
    }

    // Remove class attributes to avoid CSS dependency
    cloneEl.removeAttribute('class')
  })

  // Set dimensions
  const rect = svgElement.getBoundingClientRect()
  clone.setAttribute('width', String(rect.width))
  clone.setAttribute('height', String(rect.height))
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.removeAttribute('class')

  return new XMLSerializer().serializeToString(clone)
}

/**
 * Export a chart element to PNG using canvg for proper SVG rendering
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

    // Scale context for high-DPI rendering
    ctx.scale(scale, scale)

    // Render all SVGs using canvg
    const svgs = container.querySelectorAll('svg')
    for (const svg of svgs) {
      try {
        const svgString = getSvgWithInlinedStyles(svg as SVGSVGElement)
        const svgRect = svg.getBoundingClientRect()
        const offsetX = svgRect.left - containerRect.left
        const offsetY = svgRect.top - containerRect.top

        // Create a temporary canvas for this SVG
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = svgRect.width * scale
        tempCanvas.height = svgRect.height * scale
        const tempCtx = tempCanvas.getContext('2d')
        if (!tempCtx) continue

        tempCtx.scale(scale, scale)

        // Use canvg to render the SVG
        const v = await Canvg.from(tempCtx, svgString, {
          ignoreMouse: true,
          ignoreAnimation: true,
          ignoreDimensions: false,
        })
        await v.render()

        // Draw the rendered SVG onto the main canvas
        ctx.drawImage(tempCanvas, offsetX, offsetY, svgRect.width, svgRect.height)
      } catch (svgError) {
        console.error('Error rendering SVG with canvg:', svgError)
      }
    }

    // Render text elements manually
    const textElements = container.querySelectorAll('h4, p, span')
    ctx.textBaseline = 'top'

    textElements.forEach(el => {
      const textEl = el as HTMLElement
      const text = textEl.textContent?.trim()
      if (!text) return

      const textRect = textEl.getBoundingClientRect()
      if (textRect.right < containerRect.left || textRect.left > containerRect.right) return

      const computed = getComputedStyle(textEl)
      const fontSize = parseFloat(computed.fontSize)
      const fontWeight = computed.fontWeight
      const fontFamily = computed.fontFamily || 'system-ui, sans-serif'

      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
      ctx.fillStyle = resolveToRgb(computed.color)

      const x = textRect.left - containerRect.left
      const y = textRect.top - containerRect.top
      ctx.fillText(text, x, y)
    })

    // Render legend color boxes
    const legendDivs = container.querySelectorAll('.flex.items-center.gap-1 > div:first-child')
    legendDivs.forEach(el => {
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
      const x = divRect.left - containerRect.left
      const y = divRect.top - containerRect.top
      ctx.fillRect(x, y, divRect.width, divRect.height)
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
