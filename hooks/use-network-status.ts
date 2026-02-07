'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to detect online/offline network status
 *
 * Listens to browser online/offline events and returns current network state.
 * Useful for showing offline indicators and preserving form state on network errors.
 *
 * @returns {boolean} true if online, false if offline
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isOnline = useNetworkStatus()
 *
 *   if (!isOnline) {
 *     return <OfflineBanner />
 *   }
 *
 *   return <MainContent />
 * }
 * ```
 */
export function useNetworkStatus(): boolean {
  // Initialize with navigator.onLine if available, default to true for SSR
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine
    }
    return true
  })

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
