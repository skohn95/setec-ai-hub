'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PasswordInput } from '@/components/ui/password-input'
import { Loader2 } from 'lucide-react'

// Zod validation schema
const resetPasswordConfirmSchema = z
  .object({
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
    confirmPassword: z.string().min(1, 'Debes confirmar la contraseña.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
  })

type ResetPasswordConfirmData = z.infer<typeof resetPasswordConfirmSchema>

/**
 * Password reset confirmation form component
 * Allows users to set a new password after clicking magic link
 * Integrates with Supabase Auth and provides Spanish language UI
 */
export function PasswordConfirmForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initError, setInitError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  // Memoize Supabase client
  const supabase = useMemo(() => createClient(), [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ResetPasswordConfirmData>({
    resolver: zodResolver(resetPasswordConfirmSchema),
  })

  useEffect(() => {
    // Wait for Supabase's automatic session detection (detectSessionInUrl: true)
    // to exchange the code/token for a session, then verify it exists
    const initializeSession = async () => {
      // Small delay to allow detectSessionInUrl to process URL parameters
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Check if Supabase returned an error in URL
      const urlParams = new URLSearchParams(window.location.search)
      const errorParam = urlParams.get('error')
      const errorDescription = urlParams.get('error_description')

      if (errorParam) {
        setInitError(
          `El enlace ha expirado o es inválido. Por favor, solicita un nuevo enlace. (${errorDescription})`
        )
        setIsInitializing(false)
        return
      }

      // Verify session exists (should be created automatically by detectSessionInUrl)
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setInitError(
          'No se encontró una sesión válida. Por favor, solicita un nuevo enlace de restablecimiento.'
        )
        setIsInitializing(false)
      } else {
        // Session detected successfully - clean up URL parameters for better UX
        window.history.replaceState({}, '', '/recuperar-password/confirmar')
        setIsInitializing(false)
      }
    }

    initializeSession()
  }, [supabase])

  const onSubmit = async (data: ResetPasswordConfirmData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Verify we still have a session before updating
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setInitError(
          'Tu sesión ha expirado. Por favor, solicita un nuevo enlace de restablecimiento.'
        )
        setIsLoading(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (updateError) {
        // Check for specific error messages
        if (
          updateError.message.includes(
            'should be different from the old password'
          )
        ) {
          setError(
            'La nueva contraseña debe ser diferente a la contraseña actual.'
          )
        } else {
          setError('El enlace de restablecimiento ha expirado o es inválido')
        }

        setIsLoading(false)
        return
      }

      // Success - sign out the user so they can log in with new password
      await supabase.auth.signOut()

      // Clear form and redirect to login with success message
      reset()
      router.push('/login?message=password-reset-success')
    } catch {
      setError('Ocurrió un error. Por favor, intenta nuevamente.')
      setIsLoading(false)
    }
  }

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-setec-orange" />
        <p className="text-sm text-muted-foreground">Verificando enlace...</p>
      </div>
    )
  }

  // If there's an initialization error, show it with a link back
  if (initError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{initError}</AlertDescription>
        </Alert>
        <Button
          asChild
          className="w-full h-12 bg-setec-orange hover:bg-setec-orange-hover cursor-pointer transition-colors"
        >
          <a href="/recuperar-password">Solicitar Nuevo Enlace</a>
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Submission Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* New Password Input */}
      <div className="space-y-2">
        <Label htmlFor="password">Nueva Contraseña</Label>
        <PasswordInput
          id="password"
          {...register('password')}
          className={`h-12 ${errors.password ? 'border-destructive' : ''}`}
          disabled={isLoading}
          autoFocus
          autoComplete="new-password"
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm Password Input */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
        <PasswordInput
          id="confirmPassword"
          {...register('confirmPassword')}
          className={`h-12 ${errors.confirmPassword ? 'border-destructive' : ''}`}
          disabled={isLoading}
          autoComplete="new-password"
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
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
            Restableciendo...
          </>
        ) : (
          'Restablecer Contraseña'
        )}
      </Button>
    </form>
  )
}
