import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils/cn'
import { formatDisplayDate, formatRelativeTime, formatDisplayTime, isSameDay } from '@/lib/utils/date-utils'
import { createApiError, ERROR_CODES, getErrorMessage, normalizeError } from '@/lib/utils/error-utils'

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('handles conditional classes', () => {
      expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible')
    })

    it('merges tailwind classes correctly (later wins)', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2')
    })

    it('handles undefined and null values', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar')
    })

    it('handles array of classes', () => {
      expect(cn(['foo', 'bar'])).toBe('foo bar')
    })

    it('handles empty input', () => {
      expect(cn()).toBe('')
    })
  })

  describe('formatDisplayDate', () => {
    it('formats date string correctly', () => {
      const result = formatDisplayDate('2026-01-15T10:30:00Z')
      // Should contain day, month, year
      expect(result).toMatch(/\d/)
    })

    it('formats Date object correctly', () => {
      const date = new Date('2026-06-20T14:00:00Z')
      const result = formatDisplayDate(date)
      expect(result).toMatch(/\d/)
    })

    it('handles invalid date (returns Invalid Date string)', () => {
      const result = formatDisplayDate('invalid-date')
      expect(result).toContain('Invalid Date')
    })

    it('formats time correctly', () => {
      const result = formatDisplayTime('2026-01-15T10:30:00Z')
      expect(result).toMatch(/\d{1,2}:\d{2}/)
    })
  })

  describe('formatRelativeTime', () => {
    it('returns "hace un momento" for very recent times', () => {
      const now = new Date()
      const result = formatRelativeTime(now.toISOString())
      expect(result).toBe('hace un momento')
    })

    it('returns minutes ago for times within the hour', () => {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
      const result = formatRelativeTime(thirtyMinutesAgo.toISOString())
      expect(result).toMatch(/hace \d+ minutos?/)
    })

    it('returns hours ago for times within the day', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
      const result = formatRelativeTime(threeHoursAgo.toISOString())
      expect(result).toMatch(/hace \d+ horas?/)
    })

    it('returns days ago for older times', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      const result = formatRelativeTime(threeDaysAgo.toISOString())
      expect(result).toMatch(/hace \d+ días?/)
    })
  })

  describe('createApiError', () => {
    it('creates error with code and message', () => {
      const error = createApiError(ERROR_CODES.UNAUTHORIZED, 'Custom message')
      expect(error.code).toBe(ERROR_CODES.UNAUTHORIZED)
      expect(error.message).toBe('Custom message')
    })

    it('creates error with default message if not provided', () => {
      const error = createApiError(ERROR_CODES.NOT_FOUND)
      expect(error.code).toBe(ERROR_CODES.NOT_FOUND)
      expect(error.message).toBeDefined()
    })

    it('includes details when provided', () => {
      const details = { field: 'email', issue: 'invalid format' }
      const error = createApiError(ERROR_CODES.VALIDATION_ERROR, 'Validation failed', details)
      expect(error.details).toEqual(details)
    })
  })

  describe('ERROR_CODES', () => {
    it('has all required error codes', () => {
      expect(ERROR_CODES.UNAUTHORIZED).toBeDefined()
      expect(ERROR_CODES.FORBIDDEN).toBeDefined()
      expect(ERROR_CODES.NOT_FOUND).toBeDefined()
      expect(ERROR_CODES.VALIDATION_ERROR).toBeDefined()
      expect(ERROR_CODES.INTERNAL_ERROR).toBeDefined()
    })
  })

  describe('getErrorMessage', () => {
    it('returns Spanish message for known error codes', () => {
      const message = getErrorMessage(ERROR_CODES.UNAUTHORIZED)
      expect(message).toContain('No autorizado')
    })

    it('returns default message for unknown codes', () => {
      const message = getErrorMessage('UNKNOWN_CODE' as typeof ERROR_CODES.INTERNAL_ERROR)
      expect(message).toBeDefined()
    })
  })

  describe('normalizeError', () => {
    it('returns error as-is if it has code property', () => {
      const apiError = { code: 'TEST', message: 'test' }
      const result = normalizeError(apiError)
      expect(result.code).toBe('TEST')
    })

    it('wraps Error instance in ApiError', () => {
      const error = new Error('Something went wrong')
      const result = normalizeError(error)
      expect(result.code).toBe(ERROR_CODES.INTERNAL_ERROR)
      expect(result.message).toBe('Something went wrong')
    })

    it('returns internal error for unknown error types', () => {
      const result = normalizeError('random string')
      expect(result.code).toBe(ERROR_CODES.INTERNAL_ERROR)
    })
  })

  describe('isSameDay', () => {
    it('returns true for same day', () => {
      expect(isSameDay('2026-01-15T10:00:00Z', '2026-01-15T22:00:00Z')).toBe(true)
    })

    it('returns false for different days', () => {
      expect(isSameDay('2026-01-15T10:00:00Z', '2026-01-16T10:00:00Z')).toBe(false)
    })

    it('works with Date objects', () => {
      const d1 = new Date('2026-01-15')
      const d2 = new Date('2026-01-15')
      expect(isSameDay(d1, d2)).toBe(true)
    })
  })
})
