'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

// Zod validation schema
const resetPasswordRequestSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido.')
    .email('Por favor ingresa un correo electrónico válido.'),
})

type ResetPasswordRequestData = z.infer<typeof resetPasswordRequestSchema>

/**
 * Password reset request form component
 * Allows users to request a password reset email with magic link
 * Integrates with Supabase Auth and provides Spanish language UI
 */
export function PasswordResetForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Memoize Supabase client
  const supabase = useMemo(() => createClient(), [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordRequestData>({
    resolver: zodResolver(resetPasswordRequestSchema),
  })

  const onSubmit = async (data: ResetPasswordRequestData) => {
    setIsLoading(true)
    setShowSuccess(false)

    try {
      // Request password reset - redirect to confirm page
      await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/recuperar-password/confirmar`,
      })

      // Always show success message (security best practice - don't reveal if email exists)
      setShowSuccess(true)
    } catch {
      // Even on error, show success message for security
      setShowSuccess(true)
    } finally {
      setIsLoading(false)
    }
  }

  // Show success state without form
  if (showSuccess) {
    return (
      <div className="space-y-5">
        <Alert className="bg-success/10 text-success border-success/20">
          <AlertDescription>
            Si existe una cuenta con este correo, recibirás un enlace de
            restablecimiento
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <Button variant="link" asChild className="text-sm min-h-[44px]">
            <Link href="/login">Volver al inicio de sesión</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Email Input */}
      <div className="space-y-2">
        <Label htmlFor="email">Correo Electrónico</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          className={`h-12 ${errors.email ? 'border-destructive' : ''}`}
          disabled={isLoading}
          autoFocus
          autoComplete="email"
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 mt-6 bg-setec-orange hover:bg-setec-orange-hover cursor-pointer transition-colors"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          'Restablecer contraseña'
        )}
      </Button>

      {/* Back to Login Link */}
      <div className="text-center">
        <Button variant="link" asChild className="text-sm min-h-[44px]">
          <Link href="/login">Volver al inicio de sesión</Link>
        </Button>
      </div>
    </form>
  )
}
