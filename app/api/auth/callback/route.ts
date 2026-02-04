import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')

  if (code) {
    try {
      const supabase = await createClient()
      await supabase.auth.exchangeCodeForSession(code)
    } catch {
      // If code exchange fails, redirect to appropriate error page
      if (type === 'recovery') {
        return NextResponse.redirect(`${requestUrl.origin}/recuperar-password/confirmar`)
      }
      return NextResponse.redirect(`${requestUrl.origin}/login`)
    }
  }

  // Redirect based on type
  if (type === 'recovery') {
    return NextResponse.redirect(`${requestUrl.origin}/recuperar-password/confirmar`)
  }

  // Default redirect to home
  return NextResponse.redirect(`${requestUrl.origin}/`)
}
