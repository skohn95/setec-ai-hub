'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PasswordInput } from '@/components/ui/password-input'
import { Loader2 } from 'lucide-react'

// Zod validation schema with Spanish error messages
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido.')
    .email('Por favor ingresa un correo electrónico válido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
})

type LoginFormData = z.infer<typeof loginSchema>

/**
 * Login form component with email/password authentication
 * Integrates with Supabase Auth and provides Spanish language UI
 */
export function LoginForm() {
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Memoize Supabase client
  const supabase = useMemo(() => createClient(), [])

  // Check for messages in URL params
  useEffect(() => {
    const message = searchParams.get('message')

    if (message === 'password-reset-success') {
      setSuccessMessage(
        'Contraseña restablecida exitosamente. Por favor, inicia sesión con tu nueva contraseña.'
      )
    }
  }, [searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        setError('Correo electrónico o contraseña incorrectos')
        setValue('password', '')
        setIsLoading(false)
        return
      }

      // Redirect to homepage on success
      window.location.href = '/'
    } catch {
      setError('Ocurrió un error. Por favor, intenta nuevamente.')
      setValue('password', '')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Success Message */}
      {successMessage && (
        <Alert className="bg-success/10 text-success border-success/20">
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

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

      {/* Password Input */}
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <PasswordInput
          id="password"
          {...register('password')}
          className={`h-12 ${errors.password ? 'border-destructive' : ''}`}
          disabled={isLoading}
          autoComplete="current-password"
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-12 mt-6 bg-setec-orange hover:bg-setec-orange-hover cursor-pointer transition-colors"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Iniciando sesión...
          </>
        ) : (
          'Iniciar Sesión'
        )}
      </Button>

      {/* Password Reset Link */}
      <div className="text-center">
        <Button variant="link" asChild className="text-sm min-h-[44px]">
          <Link href="/recuperar-password">¿Olvidaste tu contraseña?</Link>
        </Button>
      </div>
    </form>
  )
}
