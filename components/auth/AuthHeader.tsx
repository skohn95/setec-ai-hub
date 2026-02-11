import Image from 'next/image'

interface AuthHeaderProps {
  title?: string
}

export function AuthHeader({ title }: AuthHeaderProps) {
  return (
    <>
      {/* Logo and Brand */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2.5 mb-2">
          <Image
            src="/setec-logo.png"
            alt="Setec"
            width={40}
            height={40}
            className="h-10 w-auto brightness-[0.24]"
            priority
          />
          <span className="text-[28px] font-bold text-setec-charcoal">
            AI Hub
          </span>
        </div>
        <p className="text-lg font-semibold text-setec-charcoal">
          Bienvenido a Setec AI Hub
        </p>
      </div>

      {/* Page Title */}
      {title && (
        <div className="text-center mb-4">
          <h2 className="text-xl font-semibold text-setec-charcoal">{title}</h2>
        </div>
      )}
    </>
  )
}
