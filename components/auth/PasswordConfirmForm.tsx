'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { PASSWORD_RECOVERY_MESSAGES } from '@/constants/messages'

// Zod validation schema
const passwordConfirmSchema = z
  .object({
    password: z
      .string()
      .min(6, PASSWORD_RECOVERY_MESSAGES.PASSWORD_MIN_LENGTH),
    confirmPassword: z
      .string()
      .min(1, PASSWORD_RECOVERY_MESSAGES.CONFIRM_PASSWORD_REQUIRED),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: PASSWORD_RECOVERY_MESSAGES.PASSWORDS_DONT_MATCH,
    path: ['confirmPassword'],
  })

interface FormErrors {
  password?: string
  confirmPassword?: string
  auth?: string
}

export function PasswordConfirmForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Memoize Supabase client to avoid recreation on each render
  const supabase = useMemo(() => createClient(), [])

  // Cleanup timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  const validateForm = (): boolean => {
    const result = passwordConfirmSchema.safeParse({ password, confirmPassword })
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
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setErrors({
          auth: PASSWORD_RECOVERY_MESSAGES.INVALID_RESET_LINK,
        })
        return
      }

      setIsSuccess(true)
      // Redirect to login after 2 seconds
      redirectTimeoutRef.current = setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch {
      setErrors({
        auth: PASSWORD_RECOVERY_MESSAGES.INVALID_RESET_LINK,
      })
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
          {PASSWORD_RECOVERY_MESSAGES.PASSWORD_UPDATED}
        </div>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-setec-orange hover:text-setec-orange/80 transition-colors font-medium"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </div>
    )
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

      {/* New Password field */}
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="text-sm font-medium text-setec-charcoal"
        >
          Nueva contraseña
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
          autoComplete="new-password"
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

      {/* Confirm Password field */}
      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-setec-charcoal"
        >
          Confirmar contraseña
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
          aria-invalid={!!errors.confirmPassword}
          disabled={isLoading}
          className="h-11"
          autoComplete="new-password"
        />
        {errors.confirmPassword && (
          <p
            id="confirmPassword-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {errors.confirmPassword}
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
            Guardando...
          </>
        ) : (
          'Guardar nueva contraseña'
        )}
      </Button>
    </form>
  )
}
