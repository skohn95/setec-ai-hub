import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  classifyOpenAIError,
  isNetworkError,
  createApiError,
  getErrorMessage,
  isErrorCode,
  normalizeError,
  handleSupabaseError,
  logSupabaseError,
  ERROR_CODES,
} from './error-utils'
import { ERROR_MESSAGES, API_ERRORS } from '@/constants/messages'

describe('error-utils', () => {
  describe('classifyOpenAIError', () => {
    it('classifies rate limit error (429)', () => {
      const error = { status: 429 }
      const result = classifyOpenAIError(error)

      expect(result.code).toBe(ERROR_CODES.OPENAI_RATE_LIMIT)
      expect(result.message).toBe(API_ERRORS.OPENAI_RATE_LIMIT)
      expect(result.isRetryable).toBe(true)
    })

    it('classifies server errors (5xx)', () => {
      const errors = [
        { status: 500 },
        { status: 502 },
        { status: 503 },
        { status: 504 },
      ]

      for (const error of errors) {
        const result = classifyOpenAIError(error)
        expect(result.code).toBe(ERROR_CODES.OPENAI_UNAVAILABLE)
        expect(result.message).toBe(API_ERRORS.OPENAI_UNAVAILABLE)
        expect(result.isRetryable).toBe(true)
      }
    })

    it('classifies timeout error by code ETIMEDOUT', () => {
      const error = { code: 'ETIMEDOUT' }
      const result = classifyOpenAIError(error)

      expect(result.code).toBe(ERROR_CODES.OPENAI_TIMEOUT)
      expect(result.message).toBe(API_ERRORS.OPENAI_TIMEOUT)
      expect(result.isRetryable).toBe(true)
    })

    it('classifies timeout error by code ECONNABORTED', () => {
      const error = { code: 'ECONNABORTED' }
      const result = classifyOpenAIError(error)

      expect(result.code).toBe(ERROR_CODES.OPENAI_TIMEOUT)
      expect(result.message).toBe(API_ERRORS.OPENAI_TIMEOUT)
      expect(result.isRetryable).toBe(true)
    })

    it('classifies timeout error by message', () => {
      const error = { message: 'Request timeout exceeded' }
      const result = classifyOpenAIError(error)

      expect(result.code).toBe(ERROR_CODES.OPENAI_TIMEOUT)
      expect(result.isRetryable).toBe(true)
    })

    it('classifies connection refused as network error', () => {
      const error = { code: 'ECONNREFUSED' }
      const result = classifyOpenAIError(error)

      expect(result.code).toBe(ERROR_CODES.NETWORK_ERROR)
      expect(result.message).toBe(API_ERRORS.NETWORK_ERROR)
      expect(result.isRetryable).toBe(true)
    })

    it('classifies DNS lookup failure as network error', () => {
      const error = { code: 'ENOTFOUND' }
      const result = classifyOpenAIError(error)

      expect(result.code).toBe(ERROR_CODES.NETWORK_ERROR)
      expect(result.isRetryable).toBe(true)
    })

    it('classifies network message as network error', () => {
      const error = { message: 'Network error occurred' }
      const result = classifyOpenAIError(error)

      expect(result.code).toBe(ERROR_CODES.NETWORK_ERROR)
      expect(result.isRetryable).toBe(true)
    })

    it('returns default unavailable for unknown errors', () => {
      const result = classifyOpenAIError({ status: 400 })

      expect(result.code).toBe(ERROR_CODES.OPENAI_UNAVAILABLE)
      expect(result.isRetryable).toBe(true)
    })

    it('handles null error', () => {
      const result = classifyOpenAIError(null)

      expect(result.code).toBe(ERROR_CODES.OPENAI_UNAVAILABLE)
      expect(result.isRetryable).toBe(true)
    })

    it('handles undefined error', () => {
      const result = classifyOpenAIError(undefined)

      expect(result.code).toBe(ERROR_CODES.OPENAI_UNAVAILABLE)
      expect(result.isRetryable).toBe(true)
    })

    it('handles string error', () => {
      const result = classifyOpenAIError('some error')

      expect(result.code).toBe(ERROR_CODES.OPENAI_UNAVAILABLE)
      expect(result.isRetryable).toBe(true)
    })
  })

  describe('isNetworkError', () => {
    it('detects ECONNREFUSED', () => {
      expect(isNetworkError({ code: 'ECONNREFUSED' })).toBe(true)
    })

    it('detects ENOTFOUND', () => {
      expect(isNetworkError({ code: 'ENOTFOUND' })).toBe(true)
    })

    it('detects ETIMEDOUT', () => {
      expect(isNetworkError({ code: 'ETIMEDOUT' })).toBe(true)
    })

    it('detects ECONNABORTED', () => {
      expect(isNetworkError({ code: 'ECONNABORTED' })).toBe(true)
    })

    it('detects ENETUNREACH', () => {
      expect(isNetworkError({ code: 'ENETUNREACH' })).toBe(true)
    })

    it('detects TypeError with failed to fetch', () => {
      const error = {
        name: 'TypeError',
        message: 'Failed to fetch',
      }
      expect(isNetworkError(error)).toBe(true)
    })

    it('detects network keyword in message', () => {
      expect(isNetworkError({ message: 'Network error' })).toBe(true)
      expect(isNetworkError({ message: 'A network issue occurred' })).toBe(true)
    })

    it('detects offline keyword in message', () => {
      expect(isNetworkError({ message: 'User is offline' })).toBe(true)
      expect(isNetworkError({ message: 'The device went offline' })).toBe(true)
    })

    it('returns false for null', () => {
      expect(isNetworkError(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isNetworkError(undefined)).toBe(false)
    })

    it('returns false for string', () => {
      expect(isNetworkError('error')).toBe(false)
    })

    it('returns false for number', () => {
      expect(isNetworkError(500)).toBe(false)
    })

    it('returns false for non-network errors', () => {
      expect(isNetworkError({ code: 'ENOENT' })).toBe(false)
      expect(isNetworkError({ message: 'Validation failed' })).toBe(false)
      expect(isNetworkError({ name: 'Error', message: 'Something broke' })).toBe(false)
    })
  })

  describe('createApiError', () => {
    it('creates error with code and default message', () => {
      const error = createApiError(ERROR_CODES.NOT_FOUND)

      expect(error.code).toBe(ERROR_CODES.NOT_FOUND)
      expect(error.message).toBe(ERROR_MESSAGES.NOT_FOUND)
      expect(error.details).toBeUndefined()
    })

    it('creates error with custom message', () => {
      const error = createApiError(ERROR_CODES.VALIDATION_ERROR, 'Custom validation message')

      expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR)
      expect(error.message).toBe('Custom validation message')
    })

    it('creates error with details', () => {
      const details = { field: 'email', reason: 'invalid format' }
      const error = createApiError(ERROR_CODES.INVALID_INPUT, undefined, details)

      expect(error.details).toEqual(details)
    })
  })

  describe('getErrorMessage', () => {
    it('returns correct message for UNAUTHORIZED', () => {
      expect(getErrorMessage(ERROR_CODES.UNAUTHORIZED)).toBe(ERROR_MESSAGES.UNAUTHORIZED)
    })

    it('returns correct message for FORBIDDEN', () => {
      expect(getErrorMessage(ERROR_CODES.FORBIDDEN)).toBe(ERROR_MESSAGES.FORBIDDEN)
    })

    it('returns correct message for NOT_FOUND', () => {
      expect(getErrorMessage(ERROR_CODES.NOT_FOUND)).toBe(ERROR_MESSAGES.NOT_FOUND)
    })

    it('returns correct message for OPENAI_UNAVAILABLE', () => {
      expect(getErrorMessage(ERROR_CODES.OPENAI_UNAVAILABLE)).toBe(API_ERRORS.OPENAI_UNAVAILABLE)
    })

    it('returns correct message for OPENAI_RATE_LIMIT', () => {
      expect(getErrorMessage(ERROR_CODES.OPENAI_RATE_LIMIT)).toBe(API_ERRORS.OPENAI_RATE_LIMIT)
    })

    it('returns correct message for OPENAI_TIMEOUT', () => {
      expect(getErrorMessage(ERROR_CODES.OPENAI_TIMEOUT)).toBe(API_ERRORS.OPENAI_TIMEOUT)
    })

    it('returns INTERNAL_ERROR for unknown codes', () => {
      expect(getErrorMessage('UNKNOWN_CODE' as any)).toBe(ERROR_MESSAGES.INTERNAL_ERROR)
    })
  })

  describe('isErrorCode', () => {
    it('returns true for matching code', () => {
      const error = { code: ERROR_CODES.NOT_FOUND, message: 'Not found' }
      expect(isErrorCode(error, ERROR_CODES.NOT_FOUND)).toBe(true)
    })

    it('returns false for non-matching code', () => {
      const error = { code: ERROR_CODES.NOT_FOUND, message: 'Not found' }
      expect(isErrorCode(error, ERROR_CODES.FORBIDDEN)).toBe(false)
    })

    it('returns false for null error', () => {
      expect(isErrorCode(null, ERROR_CODES.NOT_FOUND)).toBe(false)
    })
  })

  describe('normalizeError', () => {
    it('returns ApiError as is', () => {
      const apiError = { code: ERROR_CODES.NOT_FOUND, message: 'Not found' }
      const result = normalizeError(apiError)

      expect(result).toBe(apiError)
    })

    it('converts Error to ApiError', () => {
      const error = new Error('Something went wrong')
      const result = normalizeError(error)

      expect(result.code).toBe(ERROR_CODES.INTERNAL_ERROR)
      expect(result.message).toBe('Something went wrong')
    })

    it('handles unknown types', () => {
      const result = normalizeError('string error')

      expect(result.code).toBe(ERROR_CODES.INTERNAL_ERROR)
    })

    it('handles null', () => {
      const result = normalizeError(null)

      expect(result.code).toBe(ERROR_CODES.INTERNAL_ERROR)
    })
  })

  describe('handleSupabaseError', () => {
    it('handles null error', () => {
      const result = handleSupabaseError(null, 'test operation')

      expect(result.userMessage).toBe(ERROR_MESSAGES.SUPABASE_GENERIC)
      expect(result.logContext.message).toBe('Unknown error (null)')
      expect(result.logContext.operation).toBe('test operation')
    })

    it('handles PGRST116 (no rows returned) as not found', () => {
      const error = { code: 'PGRST116', message: 'No rows returned' }
      const result = handleSupabaseError(error, 'fetch', 'users')

      expect(result.userMessage).toBe(ERROR_MESSAGES.SUPABASE_NOT_FOUND)
      expect(result.logContext.code).toBe('PGRST116')
      expect(result.logContext.table).toBe('users')
    })

    it('handles 42P01 (undefined table) as not found', () => {
      const error = { code: '42P01', message: 'Undefined table' }
      const result = handleSupabaseError(error, 'query')

      expect(result.userMessage).toBe(ERROR_MESSAGES.SUPABASE_NOT_FOUND)
    })

    it('handles 42501 (insufficient privilege) as forbidden', () => {
      const error = { code: '42501', message: 'Permission denied' }
      const result = handleSupabaseError(error, 'delete', 'admin_table')

      expect(result.userMessage).toBe(ERROR_MESSAGES.FORBIDDEN)
    })

    it('handles PGRST301 (RLS violation) as forbidden', () => {
      const error = { code: 'PGRST301', message: 'Row level security violation' }
      const result = handleSupabaseError(error, 'update')

      expect(result.userMessage).toBe(ERROR_MESSAGES.FORBIDDEN)
    })

    it('handles 23505 (unique violation) with custom message', () => {
      const error = { code: '23505', message: 'Duplicate key value' }
      const result = handleSupabaseError(error, 'insert', 'users')

      expect(result.userMessage).toBe('Ya existe un registro con esos datos.')
    })

    it('handles 23503 (foreign key violation) with custom message', () => {
      const error = { code: '23503', message: 'Foreign key violation' }
      const result = handleSupabaseError(error, 'delete')

      expect(result.userMessage).toBe('No se puede realizar la operación debido a dependencias.')
    })

    it('handles 08000 (connection exception) as network error', () => {
      const error = { code: '08000', message: 'Connection exception' }
      const result = handleSupabaseError(error, 'connect')

      expect(result.userMessage).toBe(ERROR_MESSAGES.NETWORK_ERROR)
    })

    it('handles 08003 (connection does not exist) as network error', () => {
      const error = { code: '08003', message: 'Connection does not exist' }
      const result = handleSupabaseError(error, 'query')

      expect(result.userMessage).toBe(ERROR_MESSAGES.NETWORK_ERROR)
    })

    it('handles 08006 (connection failure) as network error', () => {
      const error = { code: '08006', message: 'Connection failure' }
      const result = handleSupabaseError(error, 'insert')

      expect(result.userMessage).toBe(ERROR_MESSAGES.NETWORK_ERROR)
    })

    it('returns generic message for unknown error codes', () => {
      const error = { code: 'UNKNOWN', message: 'Some error' }
      const result = handleSupabaseError(error, 'operation')

      expect(result.userMessage).toBe(ERROR_MESSAGES.SUPABASE_GENERIC)
    })

    it('includes all context in logContext', () => {
      const error = {
        code: 'TEST',
        message: 'Test message',
        details: 'Test details',
      }
      const result = handleSupabaseError(error, 'test op', 'test_table')

      expect(result.logContext).toEqual({
        code: 'TEST',
        message: 'Test message',
        details: 'Test details',
        operation: 'test op',
        table: 'test_table',
      })
    })

    it('handles Error object', () => {
      const error = new Error('Standard Error')
      const result = handleSupabaseError(error, 'operation')

      expect(result.userMessage).toBe(ERROR_MESSAGES.SUPABASE_GENERIC)
      expect(result.logContext.message).toBe('Standard Error')
    })
  })

  describe('logSupabaseError', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
      vi.restoreAllMocks()
    })

    it('logs error with structured context', () => {
      const error = { code: '23505', message: 'Duplicate' }
      logSupabaseError(error, 'insert', 'users')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Supabase Error]',
        expect.objectContaining({
          code: '23505',
          message: 'Duplicate',
          operation: 'insert',
          table: 'users',
        })
      )
    })

    it('logs null error', () => {
      logSupabaseError(null, 'test')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Supabase Error]',
        expect.objectContaining({
          message: 'Unknown error (null)',
          operation: 'test',
        })
      )
    })
  })
})
