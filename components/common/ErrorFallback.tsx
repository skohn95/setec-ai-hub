'use client'

import Link from 'next/link'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Props for the ErrorFallback component
 */
interface ErrorFallbackProps {
  /** Callback to reset the error state (typically triggers page reload) */
  onReset: () => void
  /** Whether to show "Volver al inicio" link. Defaults to false */
  showHomeLink?: boolean
  /** Custom title text. Defaults to "Algo salió mal." */
  title?: string
  /** Custom message text. Defaults to "Recarga la página para continuar." */
  message?: string
}

/**
 * Error Fallback UI Component
 *
 * Displays a clean, reassuring error state with options to reload
 * or navigate home. Used by ErrorBoundary and can be used standalone.
 *
 * Features:
 * - Setec brand colors (charcoal text, orange accent)
 * - AlertTriangle icon for visual indication
 * - Reload button with RefreshCw icon
 * - Optional "Volver al inicio" link
 * - Responsive design for mobile
 * - Dark mode support
 *
 * @example Basic usage
 * ```tsx
 * <ErrorFallback onReset={() => window.location.reload()} />
 * ```
 *
 * @example With home link
 * ```tsx
 * <ErrorFallback
 *   onReset={() => window.location.reload()}
 *   showHomeLink
 * />
 * ```
 *
 * @example Custom messages
 * ```tsx
 * <ErrorFallback
 *   onReset={handleReset}
 *   title="Error de conexión"
 *   message="Verifica tu conexión e intenta de nuevo."
 * />
 * ```
 */
export function ErrorFallback({
  onReset,
  showHomeLink = false,
  title = 'Algo salió mal.',
  message = 'Recarga la página para continuar.',
}: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center min-h-[300px] p-4 md:p-8 bg-background"
    >
      <div className="flex flex-col items-center text-center max-w-md">
        {/* Error icon with Setec orange accent */}
        <div className="mb-6 p-4 rounded-full bg-orange-50 dark:bg-orange-950">
          <AlertTriangle
            className="h-10 w-10 md:h-12 md:w-12 text-setec-orange"
            aria-hidden="true"
          />
        </div>

        {/* Error message in charcoal text */}
        <h2 className="text-lg md:text-xl font-semibold text-setec-charcoal dark:text-gray-100 mb-2">
          {title}
        </h2>
        <p className="text-sm md:text-base text-muted-foreground mb-6">
          {message}
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Reload button with orange accent */}
          <Button
            onClick={onReset}
            className="bg-setec-orange hover:bg-setec-orange/90 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Recargar página
          </Button>

          {/* Optional home link */}
          {showHomeLink && (
            <Button
              asChild
              variant="outline"
              className="border-setec-charcoal text-setec-charcoal dark:border-gray-400 dark:text-gray-300"
            >
              <Link href="/">
                <Home className="h-4 w-4 mr-2" aria-hidden="true" />
                Volver al inicio
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
