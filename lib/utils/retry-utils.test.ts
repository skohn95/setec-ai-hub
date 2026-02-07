import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  calculateBackoffDelay,
  retryWithBackoff,
  retryWithResult,
} from './retry-utils'

describe('calculateBackoffDelay', () => {
  const config = {
    initialDelay: 1000,
    maxDelay: 4000,
    backoffMultiplier: 2,
  }

  it('returns initial delay for first attempt', () => {
    expect(calculateBackoffDelay(0, config)).toBe(1000)
  })

  it('doubles delay for second attempt', () => {
    expect(calculateBackoffDelay(1, config)).toBe(2000)
  })

  it('caps delay at maxDelay', () => {
    expect(calculateBackoffDelay(2, config)).toBe(4000)
    expect(calculateBackoffDelay(3, config)).toBe(4000)
  })

  it('works with custom configuration', () => {
    const customConfig = {
      initialDelay: 500,
      maxDelay: 2000,
      backoffMultiplier: 3,
    }
    expect(calculateBackoffDelay(0, customConfig)).toBe(500)
    expect(calculateBackoffDelay(1, customConfig)).toBe(1500)
    expect(calculateBackoffDelay(2, customConfig)).toBe(2000) // capped
  })
})

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns result on first successful attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success')

    const resultPromise = retryWithBackoff(fn)
    const result = await resultPromise

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on failure and succeeds on second attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockResolvedValue('success')

    const resultPromise = retryWithBackoff(fn, { initialDelay: 1000 })

    // First attempt fails immediately
    await vi.advanceTimersByTimeAsync(0)

    // Wait for backoff delay
    await vi.advanceTimersByTimeAsync(1000)

    const result = await resultPromise

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throws after max attempts', async () => {
    // Use real timers for this test since we need actual delays
    vi.useRealTimers()

    const fn = vi.fn().mockRejectedValue(new Error('Always fails'))

    await expect(
      retryWithBackoff(fn, {
        maxAttempts: 3,
        initialDelay: 10,
        maxDelay: 20,
      })
    ).rejects.toThrow('Always fails')

    expect(fn).toHaveBeenCalledTimes(3)

    // Switch back to fake timers for other tests
    vi.useFakeTimers()
  })

  it('respects isRetryable predicate', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Non-retryable'))

    const resultPromise = retryWithBackoff(fn, {
      maxAttempts: 3,
      isRetryable: () => false,
    })

    await expect(resultPromise).rejects.toThrow('Non-retryable')
    expect(fn).toHaveBeenCalledTimes(1) // No retries
  })

  it('uses exponential backoff delays', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('1'))
      .mockRejectedValueOnce(new Error('2'))
      .mockResolvedValue('success')

    const resultPromise = retryWithBackoff(fn, {
      maxAttempts: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
    })

    // First attempt
    await vi.advanceTimersByTimeAsync(0)
    expect(fn).toHaveBeenCalledTimes(1)

    // First retry after 1000ms
    await vi.advanceTimersByTimeAsync(1000)
    expect(fn).toHaveBeenCalledTimes(2)

    // Second retry after 2000ms (1000 * 2)
    await vi.advanceTimersByTimeAsync(2000)
    expect(fn).toHaveBeenCalledTimes(3)

    const result = await resultPromise
    expect(result).toBe('success')
  })
})

describe('retryWithResult', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns success result on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('data')

    const resultPromise = retryWithResult(fn)
    const result = await resultPromise

    expect(result).toEqual({
      success: true,
      data: 'data',
      attempts: 1,
    })
  })

  it('returns failure result after max attempts', async () => {
    const error = new Error('Failed')
    const fn = vi.fn().mockRejectedValue(error)

    const resultPromise = retryWithResult(fn, {
      maxAttempts: 2,
      initialDelay: 100,
    })

    // Advance through all retries
    await vi.advanceTimersByTimeAsync(500)

    const result = await resultPromise

    expect(result).toEqual({
      success: false,
      error,
      attempts: 2,
    })
  })

  it('tracks correct attempt count on success', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('1'))
      .mockResolvedValue('data')

    const resultPromise = retryWithResult(fn, { initialDelay: 100 })

    await vi.advanceTimersByTimeAsync(200)

    const result = await resultPromise

    expect(result).toEqual({
      success: true,
      data: 'data',
      attempts: 2,
    })
  })

  it('does not throw on failure', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Error'))

    const resultPromise = retryWithResult(fn, {
      maxAttempts: 1,
    })

    const result = await resultPromise

    expect(result.success).toBe(false)
    expect(result.error).toBeInstanceOf(Error)
  })
})
