import { ReactNode } from 'react'

interface AuthLayoutProps {
  children: ReactNode
}

/**
 * Layout for authentication pages (login, reset password, etc.)
 * Provides consistent styling and structure for auth flows
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return <>{children}</>
}
