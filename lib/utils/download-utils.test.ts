import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { downloadFile, exportChartToPng, generateExportFilename, triggerDownload, ChartExportError } from './download-utils'

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve({
    toBlob: (callback: (blob: Blob) => void) => callback(new Blob(['test'], { type: 'image/png' }))
  }))
}))

describe('downloadFile', () => {
  let appendChildSpy: ReturnType<typeof vi.spyOn>
  let removeChildSpy: ReturnType<typeof vi.spyOn>
  let clickSpy: ReturnType<typeof vi.fn>
  let mockAnchor: HTMLAnchorElement

  beforeEach(() => {
    clickSpy = vi.fn()
    mockAnchor = {
      href: '',
      download: '',
      click: clickSpy,
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor)
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockReturnValue(mockAnchor)
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockReturnValue(mockAnchor)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates an anchor element with type "a"', () => {
    downloadFile('/templates/test.xlsx')
    expect(document.createElement).toHaveBeenCalledWith('a')
  })

  it('sets the href attribute to the provided path', () => {
    downloadFile('/templates/plantilla-msa.xlsx')
    expect(mockAnchor.href).toBe('/templates/plantilla-msa.xlsx')
  })

  it('sets the download attribute to filename from path', () => {
    downloadFile('/templates/plantilla-msa.xlsx')
    expect(mockAnchor.download).toBe('plantilla-msa.xlsx')
  })

  it('uses provided filename when specified', () => {
    downloadFile('/templates/plantilla-msa.xlsx', 'custom-name.xlsx')
    expect(mockAnchor.download).toBe('custom-name.xlsx')
  })

  it('appends anchor to document body', () => {
    downloadFile('/templates/test.xlsx')
    expect(appendChildSpy).toHaveBeenCalledWith(mockAnchor)
  })

  it('triggers click on the anchor', () => {
    downloadFile('/templates/test.xlsx')
    expect(clickSpy).toHaveBeenCalled()
  })

  it('removes anchor from document body after click', () => {
    downloadFile('/templates/test.xlsx')
    expect(removeChildSpy).toHaveBeenCalledWith(mockAnchor)
  })

  it('handles path with multiple segments', () => {
    downloadFile('/public/assets/templates/file.xlsx')
    expect(mockAnchor.download).toBe('file.xlsx')
  })

  it('handles path without extension gracefully', () => {
    downloadFile('/downloads/file')
    expect(mockAnchor.download).toBe('file')
  })

  it('defaults to "download" when path ends with slash', () => {
    downloadFile('/templates/')
    expect(mockAnchor.download).toBe('download')
  })

  it('handles errors gracefully and logs to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(document, 'createElement').mockImplementation(() => {
      throw new Error('DOM error')
    })

    // Should not throw
    expect(() => downloadFile('/templates/test.xlsx')).not.toThrow()
    expect(consoleSpy).toHaveBeenCalledWith('Failed to initiate download:', expect.any(Error))

    consoleSpy.mockRestore()
  })
})

describe('generateExportFilename', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-03T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('generates filename with analysis type and date', () => {
    const filename = generateExportFilename('msa')
    expect(filename).toBe('msa-results-2026-02-03.png')
  })

  it('handles different analysis types', () => {
    expect(generateExportFilename('gauge-rr')).toBe('gauge-rr-results-2026-02-03.png')
    expect(generateExportFilename('variation')).toBe('variation-results-2026-02-03.png')
  })

  it('uses current system date', () => {
    vi.setSystemTime(new Date('2025-12-25T10:30:00Z'))
    const filename = generateExportFilename('test')
    expect(filename).toBe('test-results-2025-12-25.png')
  })
})

describe('triggerDownload', () => {
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>
  let clickSpy: ReturnType<typeof vi.fn>
  let mockAnchor: HTMLAnchorElement

  beforeEach(() => {
    clickSpy = vi.fn()
    mockAnchor = {
      href: '',
      download: '',
      click: clickSpy,
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor)
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates object URL from blob', () => {
    const blob = new Blob(['test'], { type: 'image/png' })
    triggerDownload(blob, 'test.png')
    expect(createObjectURLSpy).toHaveBeenCalledWith(blob)
  })

  it('sets anchor href to blob URL', () => {
    const blob = new Blob(['test'], { type: 'image/png' })
    triggerDownload(blob, 'test.png')
    expect(mockAnchor.href).toBe('blob:mock-url')
  })

  it('sets download filename', () => {
    const blob = new Blob(['test'], { type: 'image/png' })
    triggerDownload(blob, 'my-chart.png')
    expect(mockAnchor.download).toBe('my-chart.png')
  })

  it('triggers click on anchor', () => {
    const blob = new Blob(['test'], { type: 'image/png' })
    triggerDownload(blob, 'test.png')
    expect(clickSpy).toHaveBeenCalled()
  })

  it('revokes object URL after download', () => {
    const blob = new Blob(['test'], { type: 'image/png' })
    triggerDownload(blob, 'test.png')
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
  })
})

describe('exportChartToPng', () => {
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>
  let clickSpy: ReturnType<typeof vi.fn>
  let mockAnchor: HTMLAnchorElement

  beforeEach(() => {
    clickSpy = vi.fn()
    mockAnchor = {
      href: '',
      download: '',
      click: clickSpy,
    } as unknown as HTMLAnchorElement

    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor)
    createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throws ChartExportError when chartRef.current is null', async () => {
    const chartRef = { current: null }
    await expect(exportChartToPng(chartRef, 'test.png')).rejects.toThrow(ChartExportError)
    await expect(exportChartToPng(chartRef, 'test.png')).rejects.toThrow('Chart element not found')
  })

  it('calls html2canvas with the chart element and default options', async () => {
    const html2canvas = (await import('html2canvas')).default
    const mockElement = document.createElement('div')
    const chartRef = { current: mockElement }

    await exportChartToPng(chartRef, 'test.png')

    expect(html2canvas).toHaveBeenCalledWith(mockElement, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    })
  })

  it('uses custom background color when provided', async () => {
    const html2canvas = (await import('html2canvas')).default
    const mockElement = document.createElement('div')
    const chartRef = { current: mockElement }

    await exportChartToPng(chartRef, 'test.png', { backgroundColor: '#000000' })

    expect(html2canvas).toHaveBeenCalledWith(mockElement, {
      backgroundColor: '#000000',
      scale: 2,
      logging: false,
    })
  })

  it('uses custom scale when provided', async () => {
    const html2canvas = (await import('html2canvas')).default
    const mockElement = document.createElement('div')
    const chartRef = { current: mockElement }

    await exportChartToPng(chartRef, 'test.png', { scale: 3 })

    expect(html2canvas).toHaveBeenCalledWith(mockElement, {
      backgroundColor: '#ffffff',
      scale: 3,
      logging: false,
    })
  })

  it('triggers download with correct filename', async () => {
    const mockElement = document.createElement('div')
    const chartRef = { current: mockElement }

    await exportChartToPng(chartRef, 'my-chart.png')

    expect(mockAnchor.download).toBe('my-chart.png')
    expect(clickSpy).toHaveBeenCalled()
  })

  it('revokes object URL after download', async () => {
    const mockElement = document.createElement('div')
    const chartRef = { current: mockElement }

    await exportChartToPng(chartRef, 'test.png')

    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')
  })

  it('throws ChartExportError when html2canvas fails', async () => {
    const html2canvas = (await import('html2canvas')).default
    vi.mocked(html2canvas).mockRejectedValueOnce(new Error('Canvas rendering failed'))

    const mockElement = document.createElement('div')
    const chartRef = { current: mockElement }

    await expect(exportChartToPng(chartRef, 'test.png')).rejects.toThrow(ChartExportError)
  })

  it('ChartExportError contains correct message when html2canvas fails', async () => {
    const html2canvas = (await import('html2canvas')).default
    vi.mocked(html2canvas).mockRejectedValueOnce(new Error('Canvas rendering failed'))

    const mockElement = document.createElement('div')
    const chartRef = { current: mockElement }

    await expect(exportChartToPng(chartRef, 'test.png')).rejects.toThrow('Failed to export chart as image')
  })

  it('throws ChartExportError when toBlob returns null', async () => {
    const html2canvas = (await import('html2canvas')).default
    vi.mocked(html2canvas).mockResolvedValueOnce({
      toBlob: (callback: (blob: Blob | null) => void) => callback(null)
    } as unknown as HTMLCanvasElement)

    const mockElement = document.createElement('div')
    const chartRef = { current: mockElement }

    await expect(exportChartToPng(chartRef, 'test.png')).rejects.toThrow(ChartExportError)
  })
})

describe('ChartExportError', () => {
  it('has correct name property', () => {
    const error = new ChartExportError('test message')
    expect(error.name).toBe('ChartExportError')
  })

  it('stores cause when provided', () => {
    const cause = new Error('original error')
    const error = new ChartExportError('test message', cause)
    expect(error.cause).toBe(cause)
  })

  it('message is accessible', () => {
    const error = new ChartExportError('test message')
    expect(error.message).toBe('test message')
  })
})
