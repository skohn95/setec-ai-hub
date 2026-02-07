/**
 * Retry utilities with exponential backoff
 *
 * Story 6.2: Provides retry functionality for failed operations
 * with configurable attempts and exponential backoff delays.
 */

/**
 * Configuration for retry operations
 */
export interface RetryConfig {
  /** Maximum number of retry attempts. Default: 3 */
  maxAttempts?: number
  /** Initial delay in milliseconds before first retry. Default: 1000 (1s) */
  initialDelay?: number
  /** Maximum delay in milliseconds. Default: 4000 (4s) */
  maxDelay?: number
  /** Multiplier for exponential backoff. Default: 2 */
  backoffMultiplier?: number
  /** Function to check if error is retryable. Default: all errors are retryable */
  isRetryable?: (error: unknown) => boolean
}

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 4000,
  backoffMultiplier: 2,
  isRetryable: () => true,
}

/**
 * Calculate the delay for a given attempt using exponential backoff
 *
 * @param attempt - Current attempt number (0-indexed)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  config: Pick<Required<RetryConfig>, 'initialDelay' | 'maxDelay' | 'backoffMultiplier'>
): number {
  const { initialDelay, maxDelay, backoffMultiplier } = config
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt)
  return Math.min(delay, maxDelay)
}

/**
 * Wait for a specified duration
 *
 * @param ms - Duration in milliseconds
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Execute a function with automatic retry and exponential backoff
 *
 * @param fn - Async function to execute
 * @param config - Retry configuration
 * @returns Promise with the result of the function
 * @throws The last error if all retries fail
 *
 * @example
 * ```typescript
 * // Basic usage
 * const result = await retryWithBackoff(async () => {
 *   const response = await fetch('/api/data')
 *   if (!response.ok) throw new Error('Failed')
 *   return response.json()
 * })
 *
 * // Custom configuration
 * const result = await retryWithBackoff(
 *   () => fetchData(),
 *   {
 *     maxAttempts: 5,
 *     initialDelay: 500,
 *     isRetryable: (error) => error instanceof NetworkError
 *   }
 * )
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const mergedConfig: Required<RetryConfig> = { ...DEFAULT_CONFIG, ...config }
  const { maxAttempts, isRetryable } = mergedConfig

  let lastError: unknown

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Check if we should retry
      const isLastAttempt = attempt === maxAttempts - 1
      if (isLastAttempt || !isRetryable(error)) {
        throw error
      }

      // Wait before retrying
      const delay = calculateBackoffDelay(attempt, mergedConfig)
      await wait(delay)
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError
}

/**
 * Result of a retry operation with status info
 */
export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: unknown
  attempts: number
}

/**
 * Execute a function with retry and return result with metadata
 * Unlike retryWithBackoff, this doesn't throw on failure
 *
 * @param fn - Async function to execute
 * @param config - Retry configuration
 * @returns Promise with result object containing success status and data/error
 *
 * @example
 * ```typescript
 * const result = await retryWithResult(() => fetchData())
 * if (result.success) {
 *   console.log('Data:', result.data)
 * } else {
 *   console.log(`Failed after ${result.attempts} attempts:`, result.error)
 * }
 * ```
 */
export async function retryWithResult<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<RetryResult<T>> {
  const mergedConfig: Required<RetryConfig> = { ...DEFAULT_CONFIG, ...config }
  const { maxAttempts, isRetryable } = mergedConfig

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const data = await fn()
      return { success: true, data, attempts: attempt + 1 }
    } catch (error) {
      // Check if we should retry
      const isLastAttempt = attempt === maxAttempts - 1
      if (isLastAttempt || !isRetryable(error)) {
        return { success: false, error, attempts: attempt + 1 }
      }

      // Wait before retrying
      const delay = calculateBackoffDelay(attempt, mergedConfig)
      await wait(delay)
    }
  }

  // This should never be reached
  return { success: false, error: new Error('Max attempts reached'), attempts: maxAttempts }
}
