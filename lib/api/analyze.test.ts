/**
 * Tests for Python analysis endpoint caller
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { invokeAnalysisTool, type AnalysisResponse } from './analyze'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('invokeAnalysisTool', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('calls the correct endpoint with proper body', async () => {
    const mockResponse: AnalysisResponse = {
      data: {
        results: { grr: 15.5, ndc: 8 },
        chartData: [{ type: 'variationBreakdown', data: [] }],
        instructions: 'Present the results...',
      },
      error: null,
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    await invokeAnalysisTool('msa', 'file-123', 'msg-456')

    expect(mockFetch).toHaveBeenCalledWith('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        analysis_type: 'msa',
        file_id: 'file-123',
        message_id: 'msg-456',
      }),
    })
  })

  it('omits message_id when not provided', async () => {
    const mockResponse: AnalysisResponse = {
      data: {
        results: {},
        chartData: [],
        instructions: '',
      },
      error: null,
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    await invokeAnalysisTool('msa', 'file-123')

    expect(mockFetch).toHaveBeenCalledWith('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        analysis_type: 'msa',
        file_id: 'file-123',
      }),
    })
  })

  it('returns success data when response is ok', async () => {
    const mockResponse: AnalysisResponse = {
      data: {
        results: { grr: 15.5, ndc: 8 },
        chartData: [{ type: 'variationBreakdown', data: [] }],
        instructions: 'Present the results...',
      },
      error: null,
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const result = await invokeAnalysisTool('msa', 'file-123')

    expect(result.data).toEqual(mockResponse.data)
    expect(result.error).toBeNull()
  })

  it('returns error when API returns validation error', async () => {
    const mockResponse: AnalysisResponse = {
      data: null,
      error: {
        code: 'FILE_VALIDATION_ERROR',
        message: 'El archivo no tiene el formato correcto',
        details: [{ row: 1, column: 'A', message: 'Valor inválido' }],
      },
    }

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve(mockResponse),
    })

    const result = await invokeAnalysisTool('msa', 'file-123')

    expect(result.data).toBeNull()
    expect(result.error?.code).toBe('FILE_VALIDATION_ERROR')
    expect(result.error?.details).toHaveLength(1)
  })

  it('returns error when file not found', async () => {
    const mockResponse: AnalysisResponse = {
      data: null,
      error: {
        code: 'FILE_NOT_FOUND',
        message: 'El archivo no fue encontrado',
      },
    }

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve(mockResponse),
    })

    const result = await invokeAnalysisTool('msa', 'file-123')

    expect(result.data).toBeNull()
    expect(result.error?.code).toBe('FILE_NOT_FOUND')
  })

  it('returns generic error when fetch fails', async () => {
    // Mock fetch to reject for all retry attempts (max 3 retries)
    const networkError = new Error('Network error')
    mockFetch
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)
      .mockRejectedValueOnce(networkError)

    const result = await invokeAnalysisTool('msa', 'file-123')

    expect(result.data).toBeNull()
    expect(result.error?.code).toBe('NETWORK_ERROR')
    expect(result.error?.message).toContain('conexión')
  })

  it('returns error when response is not JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('Invalid JSON')),
    })

    const result = await invokeAnalysisTool('msa', 'file-123')

    expect(result.data).toBeNull()
    expect(result.error?.code).toBe('PARSE_ERROR')
  })
})
