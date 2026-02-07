import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useNetworkStatus } from './use-network-status'

describe('useNetworkStatus', () => {
  const originalNavigator = window.navigator

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
    })
  })

  it('returns true when navigator.onLine is true', () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: true },
      writable: true,
    })

    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current).toBe(true)
  })

  it('returns false when navigator.onLine is false', () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: false },
      writable: true,
    })

    const { result } = renderHook(() => useNetworkStatus())

    expect(result.current).toBe(false)
  })

  it('updates to true when online event fires', () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: false },
      writable: true,
    })

    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current).toBe(false)

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current).toBe(true)
  })

  it('updates to false when offline event fires', () => {
    Object.defineProperty(window, 'navigator', {
      value: { onLine: true },
      writable: true,
    })

    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current).toBe(true)

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current).toBe(false)
  })

  it('cleans up event listeners on unmount', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useNetworkStatus())

    expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(addEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function))
    expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function))
  })

  it('defaults to true during SSR (no navigator)', () => {
    // Simulate SSR environment where navigator is undefined
    const originalNavigatorProp = Object.getOwnPropertyDescriptor(window, 'navigator')

    Object.defineProperty(window, 'navigator', {
      value: undefined,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useNetworkStatus())

    // Should default to true (assume online)
    expect(result.current).toBe(true)

    // Restore navigator
    if (originalNavigatorProp) {
      Object.defineProperty(window, 'navigator', originalNavigatorProp)
    }
  })
})
