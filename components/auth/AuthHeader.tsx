interface AuthHeaderProps {
  title?: string
}

export function AuthHeader({ title }: AuthHeaderProps) {
  return (
    <>
      {/* Setec Logo */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-setec-orange tracking-tight">
          SETEC
        </h1>
        <p className="text-sm text-muted-foreground mt-1">AI Hub</p>
      </div>

      {/* Page Title */}
      {title && (
        <div className="text-center">
          <h2 className="text-xl font-semibold text-setec-charcoal">
            {title}
          </h2>
        </div>
      )}
    </>
  )
}
