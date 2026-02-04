'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { PASSWORD_RECOVERY_MESSAGES } from '@/constants/messages'

// Zod validation schema
const passwordResetSchema = z.object({
  email: z
    .string()
    .min(1, PASSWORD_RECOVERY_MESSAGES.EMAIL_REQUIRED)
    .email(PASSWORD_RECOVERY_MESSAGES.INVALID_EMAIL),
})

interface FormErrors {
  email?: string
}

export function PasswordResetForm() {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Memoize Supabase client to avoid recreation on each render
  const supabase = useMemo(() => createClient(), [])

  const validateForm = (): boolean => {
    const result = passwordResetSchema.safeParse({ email })
    if (!result.success) {
      const fieldErrors: FormErrors = {}
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

    setIsLoading(true)
    setErrors({})

    try {
      // Always show success message regardless of email existence (security: prevent enumeration)
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/api/auth/callback?type=recovery`,
      })

      setIsSuccess(true)
    } catch {
      // Even on error, show success message to prevent email enumeration
      setIsSuccess(true)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <div
          role="status"
          aria-live="polite"
          className="p-4 text-sm text-green-800 bg-green-50 border border-green-200 rounded-md"
        >
          {PASSWORD_RECOVERY_MESSAGES.PASSWORD_RESET_SENT}
        </div>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-setec-orange transition-colors"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-11 bg-setec-orange hover:bg-setec-orange/90 text-white font-medium"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          'Enviar enlace'
        )}
      </Button>

      {/* Back to login link */}
      <div className="text-center">
        <Link
          href="/login"
          className="text-sm text-muted-foreground hover:text-setec-orange transition-colors"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    </form>
  )
}
