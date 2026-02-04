'use client'

import { useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

// Zod validation schema with Spanish error messages
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido.')
    .email('Por favor ingresa un correo electrónico válido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
})

interface FormErrors {
  email?: string
  password?: string
  auth?: string
}

/**
 * Sanitize redirectTo URL to prevent open redirect vulnerabilities.
 * Only allows paths that start with / and don't start with // (protocol-relative URLs).
 */
function sanitizeRedirectUrl(redirectTo: string | null): string {
  if (!redirectTo) return '/'
  // Only allow paths starting with single / (not //)
  if (redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
    // Additional check: must not contain protocol indicators
    if (!redirectTo.includes('://')) {
      return redirectTo
    }
  }
  return '/'
}

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)

  // Memoize Supabase client to avoid recreation on each render
  const supabase = useMemo(() => createClient(), [])

  const validateForm = (): boolean => {
    const result = loginSchema.safeParse({ email, password })
    if (!result.success) {
      const fieldErrors: FormErrors = {}
      // Zod v4 uses .issues instead of .errors
      const issues = result.error.issues || []
      issues.forEach((err) => {
        const field = err.path[0] as keyof FormErrors
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = err.message
        }
      })
      setErrors(fieldErrors)
      return false
    }
    setErrors({})
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Rate limiting: Add delay after multiple failed attempts
    if (failedAttempts >= 3) {
      const delayMs = Math.min(failedAttempts * 1000, 5000) // Max 5 second delay
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }

    setIsLoading(true)
    setErrors({})

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setFailedAttempts((prev) => prev + 1)
        setErrors({
          auth: 'Credenciales incorrectas. Verifica tu email y contraseña.',
        })
        setPassword('') // Clear password on error
        return
      }

      // Successful login - reset failed attempts and redirect
      setFailedAttempts(0)
      const redirectTo = sanitizeRedirectUrl(searchParams.get('redirectTo'))
      router.push(redirectTo)
      router.refresh()
    } catch {
      setFailedAttempts((prev) => prev + 1)
      setErrors({
        auth: 'Error al iniciar sesión. Por favor, intenta nuevamente.',
      })
      setPassword('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Authentication error alert */}
      {errors.auth && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
        >
          {errors.auth}
        </div>
      )}

      {/* Email field */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-sm font-medium text-setec-charcoal"
        >
          Correo electrónico
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="usuario@ejemplo.com"
          aria-describedby={errors.email ? 'email-error' : undefined}
          aria-invalid={!!errors.email}
          disabled={isLoading}
          className="h-11"
          autoComplete="email"
        />
        {errors.email && (
          <p
            id="email-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.email}
          </p>
        )}
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-setec-charcoal"
        >
          Contraseña
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          aria-describedby={errors.password ? 'password-error' : undefined}
          aria-invalid={!!errors.password}
          disabled={isLoading}
          className="h-11"
          autoComplete="current-password"
        />
        {errors.password && (
          <p
            id="password-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.password}
          </p>
        )}
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 bg-setec-orange hover:bg-setec-orange/90 text-white font-medium"
        aria-label="Iniciar sesión"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Iniciando sesión...
          </>
        ) : (
          'Iniciar sesión'
        )}
      </Button>

      {/* Forgot password link */}
      <div className="text-center">
        <Link
          href="/recuperar-password"
          className="text-sm text-muted-foreground hover:text-setec-orange transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </Link>
      </div>
    </form>
  )
}
