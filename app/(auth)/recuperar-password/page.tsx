import { Metadata } from 'next'
import Image from 'next/image'
import { PasswordResetForm } from '@/components/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Restablecer Contraseña - Setec AI Hub',
  description: 'Solicita un enlace para restablecer tu contraseña',
}

/**
 * Password reset request page component
 * Displays Setec logo, password reset request form
 */
export default function RecuperarPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-setec-charcoal p-4">
      <div className="w-full max-w-md">
        {/* Setec Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-4 w-full flex items-center justify-center">
            <Image
              src="/setec-logo.png"
              alt="Setec AI Hub"
              width={80}
              height={80}
              className="h-16 w-auto"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Bienvenido a Setec AI Hub
          </h1>
        </div>

        {/* Reset Password Request Form Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl">Restablecer contraseña</CardTitle>
          </CardHeader>
          <CardContent>
            <PasswordResetForm />
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
