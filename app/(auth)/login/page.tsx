import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from '@/components/auth'

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
    <div className="space-y-8">
      {/* Setec Logo */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-setec-orange tracking-tight">
          SETEC
        </h1>
        <p className="text-sm text-muted-foreground mt-1">AI Hub</p>
      </div>

      {/* Login Form */}
      <LoginForm />
    </div>
  )
}
