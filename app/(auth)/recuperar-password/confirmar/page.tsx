'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PasswordConfirmForm, AuthHeader } from '@/components/auth'
import { PASSWORD_RECOVERY_MESSAGES } from '@/constants/messages'
import { Loader2 } from 'lucide-react'

export default function ConfirmarPasswordPage() {
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Memoize Supabase client
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const checkSession = async () => {
      try {
        // Check if user has a valid session (set by the auth callback)
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          setIsValidToken(true)
        } else {
          setIsValidToken(false)
        }
      } catch {
        setIsValidToken(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [supabase])

  if (isLoading) {
    return (
      <div className="space-y-8">
        <AuthHeader />
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-setec-orange" />
        </div>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="space-y-8">
        <AuthHeader />
        <div className="space-y-6">
          <div
            role="alert"
            className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md"
          >
            {PASSWORD_RECOVERY_MESSAGES.INVALID_RESET_LINK}
          </div>

          <div className="text-center">
            <Link
              href="/recuperar-password"
              className="text-sm text-setec-orange hover:text-setec-orange/80 transition-colors font-medium"
            >
              {PASSWORD_RECOVERY_MESSAGES.REQUEST_NEW_LINK}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <AuthHeader title="Nueva contraseña" />
      <PasswordConfirmForm />
    </div>
  )
}
