import type { ApiError, ErrorCode } from '@/types/api'
import { ERROR_CODES } from '@/types/api'
import { ERROR_MESSAGES, API_ERRORS } from '@/constants/messages'

/**
 * Re-export error codes for convenience
 */
export { ERROR_CODES }

/**
 * OpenAI error classification result
 */
export interface OpenAIErrorClassification {
  code: ErrorCode
  message: string
  isRetryable: boolean
}

/**
 * Classify an OpenAI API error and return appropriate user-facing message
 *
 * Handles:
 * - Rate limiting (429 errors)
 * - Timeout errors
 * - API unavailability (5xx errors)
 * - Network errors
 *
 * @param error - The error from OpenAI API call
 * @returns Classification with error code, user message, and retry suggestion
 */
export function classifyOpenAIError(error: unknown): OpenAIErrorClassification {
  // Handle OpenAI-specific error shapes
  if (error && typeof error === 'object') {
    // OpenAI SDK errors have a 'status' property
    const errWithStatus = error as { status?: number; code?: string; message?: string }

    // Rate limiting (429 Too Many Requests)
    if (errWithStatus.status === 429) {
      return {
        code: ERROR_CODES.OPENAI_RATE_LIMIT,
        message: API_ERRORS.OPENAI_RATE_LIMIT,
        isRetryable: true,
      }
    }

    // Server errors (5xx)
    if (errWithStatus.status && errWithStatus.status >= 500) {
      return {
        code: ERROR_CODES.OPENAI_UNAVAILABLE,
        message: API_ERRORS.OPENAI_UNAVAILABLE,
        isRetryable: true,
      }
    }

    // Timeout errors (various representations)
    if (
      errWithStatus.code === 'ETIMEDOUT' ||
      errWithStatus.code === 'ECONNABORTED' ||
      errWithStatus.message?.toLowerCase().includes('timeout')
    ) {
      return {
        code: ERROR_CODES.OPENAI_TIMEOUT,
        message: API_ERRORS.OPENAI_TIMEOUT,
        isRetryable: true,
      }
    }

    // Connection errors
    if (
      errWithStatus.code === 'ECONNREFUSED' ||
      errWithStatus.code === 'ENOTFOUND' ||
      errWithStatus.message?.toLowerCase().includes('network')
    ) {
      return {
        code: ERROR_CODES.NETWORK_ERROR,
        message: API_ERRORS.NETWORK_ERROR,
        isRetryable: true,
      }
    }
  }

  // Default to generic unavailability
  return {
    code: ERROR_CODES.OPENAI_UNAVAILABLE,
    message: API_ERRORS.OPENAI_UNAVAILABLE,
    isRetryable: true,
  }
}

/**
 * Check if an error is a network-related error
 *
 * @param error - The error to check
 * @returns true if the error is network-related
 */
export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const err = error as { code?: string; message?: string; name?: string }

  // Check for common network error codes
  const networkCodes = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNABORTED', 'ENETUNREACH']
  if (err.code && networkCodes.includes(err.code)) {
    return true
  }

  // Check for fetch/network error patterns
  if (err.name === 'TypeError' && err.message?.toLowerCase().includes('failed to fetch')) {
    return true
  }

  // Check for offline errors
  if (err.message?.toLowerCase().includes('network') ||
      err.message?.toLowerCase().includes('offline')) {
    return true
  }

  return false
}

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
    [ERROR_CODES.OPENAI_UNAVAILABLE]: API_ERRORS.OPENAI_UNAVAILABLE,
    [ERROR_CODES.OPENAI_RATE_LIMIT]: API_ERRORS.OPENAI_RATE_LIMIT,
    [ERROR_CODES.OPENAI_TIMEOUT]: API_ERRORS.OPENAI_TIMEOUT,
    [ERROR_CODES.NETWORK_ERROR]: ERROR_MESSAGES.NETWORK_ERROR,
    [ERROR_CODES.TIMEOUT]: ERROR_MESSAGES.TIMEOUT,
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

/**
 * Supabase error structure from @supabase/supabase-js
 */
export interface SupabaseError {
  message: string
  code?: string
  details?: string
  hint?: string
}

/**
 * Result from handleSupabaseError
 */
export interface SupabaseErrorResult {
  userMessage: string
  logContext: {
    code?: string
    message: string
    details?: string
    operation: string
    table?: string
  }
}

/**
 * Centralized handler for Supabase errors
 *
 * Converts Supabase-specific error codes to user-friendly Spanish messages
 * while preserving technical details for logging.
 *
 * @param error - The Supabase error object
 * @param operation - Description of the operation that failed (for logging)
 * @param table - Optional table name involved (for logging)
 * @returns Object with user-facing message and logging context
 */
export function handleSupabaseError(
  error: SupabaseError | Error | null,
  operation: string,
  table?: string
): SupabaseErrorResult {
  // Handle null error case
  if (!error) {
    return {
      userMessage: ERROR_MESSAGES.SUPABASE_GENERIC,
      logContext: {
        message: 'Unknown error (null)',
        operation,
        table,
      },
    }
  }

  // Extract error details
  const supaError = error as SupabaseError
  const code = supaError.code
  const message = supaError.message || error.message || 'Unknown error'
  const details = supaError.details

  // Log context for debugging (never exposed to user)
  const logContext = {
    code,
    message,
    details,
    operation,
    table,
  }

  // Map Supabase error codes to user-friendly messages
  // These codes are from PostgreSQL/Supabase
  let userMessage: string

  switch (code) {
    // Not found errors
    case 'PGRST116': // No rows returned
    case '42P01': // Undefined table
      userMessage = ERROR_MESSAGES.SUPABASE_NOT_FOUND
      break

    // Permission/auth errors
    case '42501': // Insufficient privilege
    case 'PGRST301': // Row level security violation
      userMessage = ERROR_MESSAGES.FORBIDDEN
      break

    // Conflict/duplicate errors
    case '23505': // Unique violation
      userMessage = 'Ya existe un registro con esos datos.'
      break

    // Foreign key violation
    case '23503':
      userMessage = 'No se puede realizar la operación debido a dependencias.'
      break

    // Connection errors
    case '08000': // Connection exception
    case '08003': // Connection does not exist
    case '08006': // Connection failure
      userMessage = ERROR_MESSAGES.NETWORK_ERROR
      break

    // Default: generic error (never expose technical details)
    default:
      userMessage = ERROR_MESSAGES.SUPABASE_GENERIC
  }

  return { userMessage, logContext }
}

/**
 * Log a Supabase error with structured context
 *
 * @param error - The Supabase error
 * @param operation - Description of the operation
 * @param table - Optional table name
 */
export function logSupabaseError(
  error: SupabaseError | Error | null,
  operation: string,
  table?: string
): void {
  const { logContext } = handleSupabaseError(error, operation, table)
  console.error('[Supabase Error]', logContext)
}
