import Link from 'next/link'

export function Footer() {
  return (
    <footer className="py-4 border-t border-border">
      <div className="container mx-auto px-4 text-center">
        <Link
          href="/privacy"
          className="text-sm text-muted-foreground hover:text-setec-orange transition-colors"
        >
          Privacidad
        </Link>
      </div>
    </footer>
  )
}
