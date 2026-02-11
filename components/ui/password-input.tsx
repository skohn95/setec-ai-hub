'use client'

import * as React from 'react'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type PasswordInputProps = React.InputHTMLAttributes<HTMLInputElement>

/**
 * PasswordInput component with visibility toggle
 *
 * A reusable password input field that extends shadcn/ui Input with an
 * eye icon button to show/hide password text. Designed for authentication
 * flows (login, reset password, set password) with full accessibility support.
 *
 * Features:
 * - Toggle between password (hidden) and text (visible) modes
 * - Eye/EyeOff icons from Lucide React
 * - 44×44px minimum touch target (WCAG AA compliant)
 * - Keyboard accessible (Tab navigation, Enter/Space to toggle)
 * - Spanish ARIA labels
 * - Focus indicators matching existing form inputs
 * - Forwards all Input props and ref
 */
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    // Toggle state: false = hidden (password), true = visible (text)
    const [showPassword, setShowPassword] = useState(false)

    /**
     * Toggles password visibility between hidden and visible states
     */
    const toggleVisibility = () => {
      setShowPassword((prev) => !prev)
    }

    return (
      <div className="relative">
        <Input
          type={showPassword ? 'text' : 'password'}
          className={cn('pr-12', className)} // Add right padding for toggle button
          ref={ref}
          {...props}
        />
        <button
          type="button"
          onClick={toggleVisibility}
          aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute right-0 top-0 h-full px-3 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer rounded-r-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors group"
        >
          {showPassword ? (
            <EyeOff
              className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors"
              aria-hidden="true"
            />
          ) : (
            <Eye className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden="true" />
          )}
        </button>
      </div>
    )
  }
)
PasswordInput.displayName = 'PasswordInput'

export { PasswordInput }
