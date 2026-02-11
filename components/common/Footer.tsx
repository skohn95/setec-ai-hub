import Link from 'next/link'
import { cn } from '@/lib/utils'

interface FooterProps {
  className?: string
}

/**
 * Footer component with privacy link.
 * Appears at the bottom of dashboard and auth pages.
 */
export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn('py-4 border-t border-border', className)}>
      <div className="container mx-auto px-4 text-center">
        <Link
          href="/privacidad"
          className="text-sm text-inherit hover:text-setec-orange transition-colors"
        >
          Privacidad
        </Link>
      </div>
    </footer>
  )
}
