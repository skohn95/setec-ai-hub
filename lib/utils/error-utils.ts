import type { ApiError, ErrorCode } from '@/types/api'
import { ERROR_CODES } from '@/types/api'
import { ERROR_MESSAGES } from '@/constants/messages'

/**
 * Re-export error codes for convenience
 */
export { ERROR_CODES }

/**
 * Create a standardized API error
 */
export function createApiError(
  code: ErrorCode,
  message?: string,
  details?: Record<string, unknown>
): ApiError {
  return {
    code,
    message: message ?? getErrorMessage(code),
    details,
  }
}

/**
 * Get the Spanish error message for an error code
 */
export function getErrorMessage(code: ErrorCode): string {
  const messageMap: Record<ErrorCode, string> = {
    [ERROR_CODES.UNAUTHORIZED]: ERROR_MESSAGES.UNAUTHORIZED,
    [ERROR_CODES.FORBIDDEN]: ERROR_MESSAGES.FORBIDDEN,
    [ERROR_CODES.SESSION_EXPIRED]: ERROR_MESSAGES.SESSION_EXPIRED,
    [ERROR_CODES.VALIDATION_ERROR]: ERROR_MESSAGES.VALIDATION_ERROR,
    [ERROR_CODES.INVALID_INPUT]: ERROR_MESSAGES.INVALID_INPUT,
    [ERROR_CODES.INVALID_FILE]: ERROR_MESSAGES.INVALID_FILE,
    [ERROR_CODES.NOT_FOUND]: ERROR_MESSAGES.NOT_FOUND,
    [ERROR_CODES.CONFLICT]: ERROR_MESSAGES.VALIDATION_ERROR,
    [ERROR_CODES.INTERNAL_ERROR]: ERROR_MESSAGES.INTERNAL_ERROR,
    [ERROR_CODES.SERVICE_UNAVAILABLE]: ERROR_MESSAGES.SERVICE_UNAVAILABLE,
    [ERROR_CODES.ANALYSIS_FAILED]: ERROR_MESSAGES.ANALYSIS_FAILED,
    [ERROR_CODES.FILE_TOO_LARGE]: ERROR_MESSAGES.FILE_TOO_LARGE,
    [ERROR_CODES.UNSUPPORTED_FORMAT]: ERROR_MESSAGES.UNSUPPORTED_FORMAT,
  }

  return messageMap[code] ?? ERROR_MESSAGES.INTERNAL_ERROR
}

/**
 * Check if an error is a specific error code
 */
export function isErrorCode(error: ApiError | null, code: ErrorCode): boolean {
  return error?.code === code
}

/**
 * Extract error from various error types
 */
export function normalizeError(error: unknown): ApiError {
  if (error && typeof error === 'object' && 'code' in error) {
    return error as ApiError
  }

  if (error instanceof Error) {
    return createApiError(ERROR_CODES.INTERNAL_ERROR, error.message)
  }

  return createApiError(ERROR_CODES.INTERNAL_ERROR)
}
