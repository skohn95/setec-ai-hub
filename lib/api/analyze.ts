/**
 * Python Analysis Endpoint Caller
 *
 * This module provides a function to invoke the Python analysis endpoint
 * from the Next.js chat route when a tool call is triggered.
 *
 * Error Classification (Story 6.2):
 * - Validation errors → specific validation message with details
 * - Calculation errors → generic analysis error message
 * - Timeout errors → timeout-specific message
 * - Network errors → network error message
 */

import type { ChartDataItem, ValidationError } from '@/types/api'
import { API_ERRORS } from '@/constants/messages'
import { retryWithBackoff } from '@/lib/utils/retry-utils'
import { isNetworkError } from '@/lib/utils/error-utils'

/**
 * Analysis result data structure from Python endpoint
 */
export interface AnalysisResultData {
  results: Record<string, unknown>
  chartData: ChartDataItem[]
  instructions: string
}

/**
 * Analysis error structure from Python endpoint
 */
export interface AnalysisError {
  code: string
  message: string
  details?: ValidationError[]
}

/**
 * Full response structure from Python analysis endpoint
 */
export interface AnalysisResponse {
  data: AnalysisResultData | null
  error: AnalysisError | null
}

/**
 * Analysis error codes returned by Python endpoint
 */
const ANALYSIS_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CALCULATION_ERROR: 'CALCULATION_ERROR',
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  TIMEOUT: 'TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

/**
 * Classify analysis error and return user-friendly message
 *
 * @param code - Error code from Python endpoint
 * @param originalMessage - Original error message
 * @returns User-friendly error message in Spanish
 */
function getAnalysisErrorMessage(code: string, originalMessage?: string): string {
  switch (code) {
    case ANALYSIS_ERROR_CODES.VALIDATION_ERROR:
      return API_ERRORS.ANALYSIS_VALIDATION
    case ANALYSIS_ERROR_CODES.TIMEOUT:
      return API_ERRORS.ANALYSIS_TIMEOUT
    case ANALYSIS_ERROR_CODES.FILE_NOT_FOUND:
      return 'El archivo no fue encontrado. Por favor súbelo de nuevo.'
    case ANALYSIS_ERROR_CODES.CALCULATION_ERROR:
    case ANALYSIS_ERROR_CODES.UNKNOWN_ERROR:
    default:
      // For calculation errors, use the original message if it's user-friendly
      // Otherwise use generic message
      if (originalMessage && !originalMessage.toLowerCase().includes('error')) {
        return originalMessage
      }
      return API_ERRORS.ANALYSIS_FAILED
  }
}

/**
 * Get the base URL for API calls
 * In Edge runtime, we need absolute URLs
 */
function getApiBaseUrl(): string {
  // Use VERCEL_URL in production/preview
  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) {
    return `https://${vercelUrl}`
  }
  // For local development, use PYTHON_API_URL or fallback to port 3002
  // The Python server runs separately from Next.js in local dev
  return process.env.PYTHON_API_URL || 'http://localhost:3002'
}

/**
 * Invoke the Python analysis endpoint
 *
 * @param analysisType - Type of analysis to perform (e.g., 'msa')
 * @param fileId - UUID of the file to analyze
 * @param messageId - Optional UUID of the assistant message for result storage
 * @returns Promise with analysis results or error
 */
export async function invokeAnalysisTool(
  analysisType: string,
  fileId: string,
  messageId?: string
): Promise<AnalysisResponse> {
  const body: Record<string, string> = {
    analysis_type: analysisType,
    file_id: fileId,
  }

  // Only include message_id if provided
  if (messageId) {
    body.message_id = messageId
  }

  // Build absolute URL for Edge runtime compatibility
  const baseUrl = getApiBaseUrl()
  const analyzeUrl = `${baseUrl}/api/analyze`

  console.log('[CHAT-DEBUG] Analysis URL:', analyzeUrl)

  /**
   * Inner fetch function that can be retried
   * Only network errors are retryable - validation/calculation errors should not retry
   */
  const fetchAnalysis = async (): Promise<AnalysisResponse> => {
    const response = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    let result: AnalysisResponse

    // Read response text first for debugging if JSON parse fails
    const responseText = await response.text()
    console.log('[Analysis] Response status:', response.status, 'Length:', responseText.length)

    try {
      result = JSON.parse(responseText)
    } catch (parseError) {
      // JSON parsing failed - log details for debugging
      console.error('[Analysis] Failed to parse response JSON for file:', fileId)
      console.error('[Analysis] Response text (first 500 chars):', responseText.substring(0, 500))
      console.error('[Analysis] Parse error:', parseError)
      return {
        data: null,
        error: {
          code: ANALYSIS_ERROR_CODES.PARSE_ERROR,
          message: 'Error al procesar la respuesta del servidor.',
        },
      }
    }

    // Return classified error (don't retry validation/calculation errors)
    if (!response.ok || result.error) {
      const errorCode = result.error?.code || ANALYSIS_ERROR_CODES.UNKNOWN_ERROR
      const errorMessage = getAnalysisErrorMessage(errorCode, result.error?.message)

      console.error(`[Analysis] Error for file ${fileId}:`, errorCode, result.error?.message)

      return {
        data: null,
        error: {
          code: errorCode,
          message: errorMessage,
          details: result.error?.details,
        },
      }
    }

    return result
  }

  try {
    // Use retry with backoff for network errors only
    return await retryWithBackoff(fetchAnalysis, {
      maxAttempts: 3,
      initialDelay: 1000,
      isRetryable: (error) => isNetworkError(error),
    })
  } catch (error) {
    // Network or other fetch errors after all retries exhausted
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[Analysis] Network error for file ${fileId}:`, errorMessage)

    // Check for timeout-like errors
    if (
      errorMessage.toLowerCase().includes('timeout') ||
      errorMessage.toLowerCase().includes('aborted')
    ) {
      return {
        data: null,
        error: {
          code: ANALYSIS_ERROR_CODES.TIMEOUT,
          message: API_ERRORS.ANALYSIS_TIMEOUT,
        },
      }
    }

    return {
      data: null,
      error: {
        code: ANALYSIS_ERROR_CODES.NETWORK_ERROR,
        message: API_ERRORS.NETWORK_ERROR,
      },
    }
  }
}
