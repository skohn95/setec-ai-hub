import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  logError,
  logWarning,
  logInfo,
  logNetworkError,
  logApiError,
  logComponentError,
} from './error-logging'

describe('error-logging', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('logError', () => {
    it('logs Error object with structured format', () => {
      const error = new Error('Test error')
      const result = logError(error)

      expect(result.type).toBe('Error')
      expect(result.message).toBe('Test error')
      expect(result.stack).toBeDefined()
      expect(result.id).toMatch(/^err_/)
      expect(result.timestamp).toBeDefined()
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('logs string message as error', () => {
      const result = logError('Simple error message')

      expect(result.type).toBe('Error')
      expect(result.message).toBe('Simple error message')
      expect(result.stack).toBeUndefined()
    })

    it('includes context in log entry', () => {
      const context = { userId: '123', action: 'test' }
      const result = logError(new Error('Test'), { context })

      expect(result.context).toEqual(context)
    })

    it('includes userAction in log entry', () => {
      const result = logError(new Error('Test'), { userAction: 'clicking button' })

      expect(result.userAction).toBe('clicking button')
    })

    it('generates unique ID for each error', () => {
      const result1 = logError('Error 1')
      const result2 = logError('Error 2')

      expect(result1.id).not.toBe(result2.id)
    })

    it('uses correct emoji for different severities', () => {
      logError('Low', { severity: 'low' })
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️'),
        expect.any(Object)
      )

      logError('High', { severity: 'high' })
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔴'),
        expect.any(Object)
      )

      logError('Critical', { severity: 'critical' })
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('🚨'),
        expect.any(Object)
      )
    })
  })

  describe('logWarning', () => {
    it('logs warning to console', () => {
      logWarning('Test warning', { detail: 'info' })

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ [Warning]',
        'Test warning',
        { detail: 'info' }
      )
    })

    it('handles missing context', () => {
      logWarning('Simple warning')

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️ [Warning]',
        'Simple warning',
        ''
      )
    })
  })

  describe('logInfo', () => {
    it('logs info in development environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      logInfo('Test info', { data: 'value' })

      expect(consoleInfoSpy).toHaveBeenCalledWith(
        'ℹ️ [Info]',
        'Test info',
        { data: 'value' }
      )

      process.env.NODE_ENV = originalEnv
    })

    it('does not log in production environment', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      logInfo('Test info')

      expect(consoleInfoSpy).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('logNetworkError', () => {
    it('logs network error with operation context', () => {
      const result = logNetworkError(
        new Error('Connection failed'),
        'fetching data',
        '/api/test'
      )

      expect(result.context).toMatchObject({
        operation: 'fetching data',
        endpoint: '/api/test',
      })
      expect(result.userAction).toBe('fetching data')
    })

    it('includes online status in context', () => {
      const result = logNetworkError('Network error', 'test')

      expect(result.context?.online).toBeDefined()
    })
  })

  describe('logApiError', () => {
    it('logs API error with endpoint and method', () => {
      const result = logApiError(
        new Error('API failed'),
        '/api/chat',
        'POST',
        500
      )

      expect(result.context).toMatchObject({
        endpoint: '/api/chat',
        method: 'POST',
        status: 500,
      })
      expect(result.userAction).toBe('POST /api/chat')
    })

    it('sets high severity for 5xx errors', () => {
      logApiError(new Error('Server error'), '/api/test', 'GET', 500)

      // Check that console.error was called with high severity emoji
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔴'),
        expect.any(Object)
      )
    })
  })

  describe('logComponentError', () => {
    it('logs component error with name and props', () => {
      const error = new Error('Render failed')
      const result = logComponentError(error, 'MyComponent', { id: '123' })

      expect(result.context).toMatchObject({
        component: 'MyComponent',
        props: { id: '123' },
      })
    })

    it('sets high severity for component errors', () => {
      logComponentError(new Error('Test'), 'TestComponent')

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔴'),
        expect.any(Object)
      )
    })
  })
})
