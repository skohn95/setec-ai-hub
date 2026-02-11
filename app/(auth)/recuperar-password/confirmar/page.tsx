import { Metadata } from 'next'
import Image from 'next/image'
import { PasswordConfirmForm } from '@/components/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Confirmar Restablecimiento - Setec AI Hub',
  description: 'Establece tu nueva contraseña',
}

/**
 * Password reset confirmation page component
 * Displays after user clicks magic link from email
 * Shows form to set new password
 */
export default function ConfirmarPasswordPage() {
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

        {/* Reset Password Confirmation Form Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl">Restablecer contraseña</CardTitle>
          </CardHeader>
          <CardContent>
            <PasswordConfirmForm />
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
