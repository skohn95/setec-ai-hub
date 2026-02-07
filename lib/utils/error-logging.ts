/**
 * Client-side error logging utility
 *
 * Story 6.2: Provides structured error logging for debugging and
 * future integration with monitoring services (e.g., Sentry).
 *
 * Usage:
 * - Development: Logs to console with structured format
 * - Production: Logs to console (can be extended to send to monitoring service)
 */

/**
 * Error log entry structure
 */
export interface ErrorLog {
  /** ISO timestamp of when the error occurred */
  timestamp: string
  /** Error type/name */
  type: string
  /** Error message */
  message: string
  /** Additional context about the error */
  context?: Record<string, unknown>
  /** Error stack trace (if available) */
  stack?: string
  /** User action that triggered the error */
  userAction?: string
  /** Unique error ID for tracking */
  id: string
}

/**
 * Error severity levels for categorization
 */
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Options for logging an error
 */
export interface LogErrorOptions {
  /** Additional context to include in the log */
  context?: Record<string, unknown>
  /** User action that triggered the error */
  userAction?: string
  /** Error severity for prioritization */
  severity?: ErrorSeverity
}

/**
 * Generate a unique ID for error tracking
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Log an error with structured context
 *
 * @param error - The error to log (Error object or string message)
 * @param options - Additional logging options
 * @returns The error log entry created
 *
 * @example
 * ```typescript
 * // Basic usage
 * logError(new Error('Failed to fetch data'))
 *
 * // With context
 * logError(new Error('API call failed'), {
 *   context: { endpoint: '/api/chat', conversationId: '123' },
 *   userAction: 'sending message',
 *   severity: 'medium'
 * })
 *
 * // With string message
 * logError('Connection lost', {
 *   context: { lastActivity: Date.now() }
 * })
 * ```
 */
export function logError(
  error: Error | string,
  options: LogErrorOptions = {}
): ErrorLog {
  const { context, userAction, severity = 'medium' } = options

  const log: ErrorLog = {
    id: generateErrorId(),
    timestamp: new Date().toISOString(),
    type: error instanceof Error ? error.name : 'Error',
    message: error instanceof Error ? error.message : error,
    context,
    stack: error instanceof Error ? error.stack : undefined,
    userAction,
  }

  // Log to console in all environments
  const severityEmoji = {
    low: 'ℹ️',
    medium: '⚠️',
    high: '🔴',
    critical: '🚨',
  }

  console.error(
    `${severityEmoji[severity]} [${log.type}] ${log.message}`,
    {
      id: log.id,
      timestamp: log.timestamp,
      context: log.context,
      userAction: log.userAction,
      stack: log.stack,
    }
  )

  // In production, this would send to a monitoring service
  // For MVP, console logging is sufficient
  // TODO: Add Sentry/DataDog integration when needed
  // if (process.env.NODE_ENV === 'production') {
  //   sendToMonitoringService(log, severity)
  // }

  return log
}

/**
 * Log a warning (non-critical issue)
 *
 * @param message - Warning message
 * @param context - Additional context
 */
export function logWarning(
  message: string,
  context?: Record<string, unknown>
): void {
  console.warn('⚠️ [Warning]', message, context || '')
}

/**
 * Log an info message for debugging
 *
 * @param message - Info message
 * @param context - Additional context
 */
export function logInfo(
  message: string,
  context?: Record<string, unknown>
): void {
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.info('ℹ️ [Info]', message, context || '')
  }
}

/**
 * Create a structured error log for network errors
 *
 * @param error - The network error
 * @param operation - The operation that failed
 * @param endpoint - The API endpoint (if applicable)
 */
export function logNetworkError(
  error: Error | string,
  operation: string,
  endpoint?: string
): ErrorLog {
  return logError(error, {
    context: {
      operation,
      endpoint,
      online: typeof navigator !== 'undefined' ? navigator.onLine : undefined,
    },
    userAction: operation,
    severity: 'medium',
  })
}

/**
 * Create a structured error log for API errors
 *
 * @param error - The API error
 * @param endpoint - The API endpoint
 * @param method - HTTP method used
 * @param status - HTTP status code (if available)
 */
export function logApiError(
  error: Error | string,
  endpoint: string,
  method: string,
  status?: number
): ErrorLog {
  return logError(error, {
    context: {
      endpoint,
      method,
      status,
    },
    userAction: `${method} ${endpoint}`,
    severity: status && status >= 500 ? 'high' : 'medium',
  })
}

/**
 * Create a structured error log for component errors
 *
 * @param error - The component error
 * @param componentName - Name of the component that failed
 * @param props - Component props (sanitized, no sensitive data)
 */
export function logComponentError(
  error: Error,
  componentName: string,
  props?: Record<string, unknown>
): ErrorLog {
  return logError(error, {
    context: {
      component: componentName,
      props,
    },
    severity: 'high',
  })
}
