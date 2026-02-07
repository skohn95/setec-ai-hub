'use client'

import { WifiOff } from 'lucide-react'
import { useNetworkStatus } from '@/hooks/use-network-status'

/**
 * Offline Banner Component
 *
 * Displays a warning banner when the user is offline.
 * Uses the useNetworkStatus hook to detect online/offline state.
 *
 * Story 6.2: AC #3 - Shows network error message when offline
 *
 * @example
 * ```tsx
 * // Add to layout or provider
 * <OfflineBanner />
 * ```
 */
export function OfflineBanner() {
  const isOnline = useNetworkStatus()

  // Don't render anything when online
  if (isOnline) {
    return null
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[200] bg-yellow-50 border-b border-yellow-200 px-4 py-2 flex items-center justify-center gap-2 text-yellow-800 dark:bg-yellow-900/50 dark:border-yellow-800 dark:text-yellow-200"
    >
      <WifiOff className="h-4 w-4" aria-hidden="true" />
      <span className="text-sm font-medium">
        No hay conexión a internet. Verifica tu conexión e intenta de nuevo.
      </span>
    </div>
  )
}
