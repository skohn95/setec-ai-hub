'use client'

import type { ReactNode } from 'react'
import { QueryProvider } from './QueryProvider'
import { AuthProvider } from './AuthProvider'
import { ErrorBoundary, OfflineBanner } from '@/components/common'
import { Toaster } from '@/components/ui/sonner'

interface ProvidersProps {
  children: ReactNode
}

/**
 * Root providers component that wraps the entire application
 *
 * Provides:
 * - React Query for data fetching
 * - Auth context for user authentication
 * - Error boundary for catching uncaught errors
 * - Offline banner for network status indication
 * - Toast notifications
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryProvider>
      <AuthProvider>
        <ErrorBoundary>
          <OfflineBanner />
          {children}
        </ErrorBoundary>
        <Toaster />
      </AuthProvider>
    </QueryProvider>
  )
}
