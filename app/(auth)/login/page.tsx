import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from '@/components/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Iniciar Sesión - Setec AI Hub',
  description: 'Inicia sesión en tu cuenta de Setec AI Hub',
}

/**
 * Login page component
 * Displays Setec logo, login form with Card structure
 */
export default async function LoginPage() {
  // Check if user is already authenticated - redirect to dashboard
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-setec-charcoal p-4 overflow-x-hidden">
      <div className="w-full max-w-md mx-auto">
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
          <h1 className="text-xl sm:text-2xl font-bold text-white text-center px-2">
            Bienvenido a Setec AI Hub
          </h1>
        </div>

        {/* Login Form Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Iniciar Sesión</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <Suspense
              fallback={
                <div className="space-y-5">
                  {/* Email skeleton */}
                  <div className="space-y-2">
                    <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-12 w-full bg-muted animate-pulse rounded" />
                  </div>
                  {/* Password skeleton */}
                  <div className="space-y-2">
                    <div className="h-5 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-12 w-full bg-muted animate-pulse rounded" />
                  </div>
                  {/* Button skeleton */}
                  <div className="h-12 w-full bg-muted animate-pulse rounded mt-6" />
                </div>
              }
            >
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
