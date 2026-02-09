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
  // Always initialize as online to match SSR - prevents hydration mismatch
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Set actual status after mount (client-side only)
    setIsOnline(navigator.onLine)

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
