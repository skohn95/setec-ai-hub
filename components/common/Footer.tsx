import Link from 'next/link'

/**
 * Footer component with privacy link.
 * Appears at the bottom of dashboard pages.
 */
export function Footer() {
  return (
    <footer className="py-4 border-t border-border">
      <div className="container mx-auto px-4 text-center">
        <Link
          href="/privacidad"
          className="text-sm text-muted-foreground hover:text-setec-orange transition-colors"
        >
          Privacidad
        </Link>
      </div>
    </footer>
  )
}
