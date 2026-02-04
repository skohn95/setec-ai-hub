# Story 1.3: Password Recovery Flow

Status: done

## Story

As a **user**,
I want **to recover my password via email**,
So that **I can regain access to my account if I forget my password**.

**FRs covered:** FR4, FR4.1, FR4.2, FR4.3

## Acceptance Criteria

1. **Given** a user clicks "¿Olvidaste tu contraseña?" on the login page, **When** the password recovery page loads, **Then** they see a form requesting their email address, **And** the page is titled "Recuperar contraseña", **And** they see a "Enviar enlace" button

2. **Given** a user enters a valid registered email, **When** they submit the recovery form, **Then** Supabase sends a password reset email using the Spanish template, **And** the user sees a confirmation message: "Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo.", **And** the email contains a secure reset link that expires in 24 hours

3. **Given** a user enters an unregistered email, **When** they submit the recovery form, **Then** they see the same confirmation message (to prevent email enumeration), **And** no email is sent

4. **Given** a user clicks the reset link in their email, **When** the reset page loads, **Then** they see a form to enter a new password, **And** they see password confirmation field, **And** they see a "Guardar nueva contraseña" button

5. **Given** a user enters a valid new password, **When** they submit the new password form, **Then** their password is updated in Supabase Auth, **And** they see a success message: "Tu contraseña ha sido actualizada.", **And** they are redirected to the login page

6. **Given** a user clicks an expired or invalid reset link, **When** the page attempts to load, **Then** they see an error message: "Este enlace ha expirado o no es válido. Solicita uno nuevo.", **And** they see a link to request a new reset email

## Tasks / Subtasks

- [x] **Task 1: Create Password Recovery Request Page** (AC: #1)
  - [x] Create `app/(auth)/recuperar-password/page.tsx` with centered layout
  - [x] Import and use PasswordResetForm component
  - [x] Add Setec text logo at top (same as login page)
  - [x] Add page title "Recuperar contraseña"
  - [x] Add link back to login page
  - [x] Verify layout matches login page styling

- [x] **Task 2: Create PasswordResetForm Component** (AC: #1, #2, #3)
  - [x] Create `components/auth/PasswordResetForm.tsx`
  - [x] Add email input field with label "Correo electrónico"
  - [x] Add "Enviar enlace" submit button with orange Setec color
  - [x] Implement form validation with Zod schema (email required, valid format)
  - [x] Handle loading state during submission (disable button, show spinner)
  - [x] On submit: call `supabase.auth.resetPasswordForEmail()` with redirect URL
  - [x] Show success message regardless of email existence (security: prevent enumeration)
  - [x] Add "Volver a iniciar sesión" link

- [x] **Task 3: Create Password Confirm Page Route** (AC: #4, #5, #6)
  - [x] Create `app/(auth)/recuperar-password/confirmar/page.tsx`
  - [x] Handle Supabase Auth callback via URL hash parameters
  - [x] Extract access_token and refresh_token from URL
  - [x] Verify token validity with Supabase
  - [x] Show PasswordConfirmForm if token valid
  - [x] Show error state with "Solicitar nuevo enlace" link if token invalid/expired

- [x] **Task 4: Create PasswordConfirmForm Component** (AC: #4, #5)
  - [x] Create `components/auth/PasswordConfirmForm.tsx`
  - [x] Add new password input field with label "Nueva contraseña"
  - [x] Add confirmation password input with label "Confirmar contraseña"
  - [x] Add "Guardar nueva contraseña" submit button
  - [x] Implement Zod validation (min 6 chars, passwords match)
  - [x] Handle loading state during submission
  - [x] On submit: call `supabase.auth.updateUser({ password })`
  - [x] Show success message: "Tu contraseña ha sido actualizada."
  - [x] Redirect to /login after 2 seconds (or on button click)

- [x] **Task 5: Configure Supabase Auth Callback Route** (AC: #4)
  - [x] Verify `app/api/auth/callback/route.ts` exists (from Story 1.1)
  - [x] Ensure it handles `type=recovery` flow from Supabase
  - [x] Redirect to `/recuperar-password/confirmar` with tokens for password reset

- [x] **Task 6: Add Error Message Constants** (AC: #2, #6)
  - [x] Add to `constants/messages.ts`:
    - `PASSWORD_RESET_SENT`: 'Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo.'
    - `PASSWORD_UPDATED`: 'Tu contraseña ha sido actualizada.'
    - `INVALID_RESET_LINK`: 'Este enlace ha expirado o no es válido. Solicita uno nuevo.'
    - `PASSWORD_MIN_LENGTH`: 'La contraseña debe tener al menos 6 caracteres.'
    - `PASSWORDS_DONT_MATCH`: 'Las contraseñas no coinciden.'

- [x] **Task 7: Update Component Exports** (AC: all)
  - [x] Update `components/auth/index.ts` to export PasswordResetForm
  - [x] Update `components/auth/index.ts` to export PasswordConfirmForm

- [x] **Task 8: Write Unit Tests** (AC: all)
  - [x] Test PasswordResetForm renders correctly
  - [x] Test PasswordResetForm validation (empty email, invalid format)
  - [x] Test PasswordResetForm shows success message after submit
  - [x] Test PasswordConfirmForm renders correctly
  - [x] Test PasswordConfirmForm validation (short password, mismatch)
  - [x] Test PasswordConfirmForm success flow
  - [x] Test error state for invalid token

## Dev Notes

### Critical Architecture Patterns

**File Naming (from Architecture):**
- Components: PascalCase.tsx → `PasswordResetForm.tsx`, `PasswordConfirmForm.tsx`
- Pages: lowercase with route structure → `app/(auth)/recuperar-password/page.tsx`
- Tests: co-located → `PasswordResetForm.test.tsx` next to `PasswordResetForm.tsx`

**API Response Format:**
```typescript
// Supabase Auth responses:
// resetPasswordForEmail: { data: {}, error: null } on success (even if email doesn't exist)
// updateUser: { data: { user }, error: null } on success
```

**Spanish Error Messages (add to constants/messages.ts):**
```typescript
// Password Recovery Messages
PASSWORD_RESET_SENT: 'Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo.',
PASSWORD_UPDATED: 'Tu contraseña ha sido actualizada.',
INVALID_RESET_LINK: 'Este enlace ha expirado o no es válido. Solicita uno nuevo.',
PASSWORD_MIN_LENGTH: 'La contraseña debe tener al menos 6 caracteres.',
PASSWORDS_DONT_MATCH: 'Las contraseñas no coinciden.',
REQUEST_NEW_LINK: 'Solicitar nuevo enlace',
```

### UX Design Requirements

**Password Recovery Request Page Layout:**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    [SETEC LOGO]                         │
│                                                         │
│                 Recuperar contraseña                    │
│                                                         │
│     ┌───────────────────────────────────────────┐      │
│     │  Correo electrónico                        │      │
│     │  user@example.com                          │      │
│     └───────────────────────────────────────────┘      │
│                                                         │
│     [        Enviar enlace        ] ← Orange           │
│                                                         │
│     ← Volver a iniciar sesión                          │
│                                                         │
│     ─────────────────────────────────────────────      │
│                    Privacidad                           │
└─────────────────────────────────────────────────────────┘
```

**Password Confirm Page Layout:**
```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                    [SETEC LOGO]                         │
│                                                         │
│               Nueva contraseña                          │
│                                                         │
│     ┌───────────────────────────────────────────┐      │
│     │  Nueva contraseña                          │      │
│     │  ••••••••                                  │      │
│     └───────────────────────────────────────────┘      │
│                                                         │
│     ┌───────────────────────────────────────────┐      │
│     │  Confirmar contraseña                      │      │
│     │  ••••••••                                  │      │
│     └───────────────────────────────────────────┘      │
│                                                         │
│     [    Guardar nueva contraseña    ] ← Orange        │
│                                                         │
│     ─────────────────────────────────────────────      │
│                    Privacidad                           │
└─────────────────────────────────────────────────────────┘
```

**Brand Colors (same as login):**
- Primary Orange: `#F7931E` (button background)
- Charcoal Text: `#3D3D3D` (labels, headings)
- White: `#FFFFFF` (background, inputs)
- Error Red: Use shadcn/ui destructive color
- Success Green: Use appropriate success color for confirmation

### Technical Requirements

**Supabase Auth - Password Reset Flow:**
```typescript
// Step 1: Request password reset (PasswordResetForm.tsx)
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/api/auth/callback?type=recovery`,
})
// Note: Returns success even if email doesn't exist (security best practice)
```

```typescript
// Step 2: Auth callback route handles redirect
// app/api/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect based on type
  if (type === 'recovery') {
    return NextResponse.redirect(`${requestUrl.origin}/recuperar-password/confirmar`)
  }

  return NextResponse.redirect(`${requestUrl.origin}/`)
}
```

```typescript
// Step 3: Update password (PasswordConfirmForm.tsx)
const supabase = createClient()
const { data, error } = await supabase.auth.updateUser({
  password: newPassword
})

if (error) {
  // Handle error - likely invalid/expired session
  setError('INVALID_RESET_LINK')
} else {
  // Success - show message and redirect
  setSuccess(true)
  setTimeout(() => router.push('/login'), 2000)
}
```

**Zod Validation Schemas:**
```typescript
// PasswordResetForm validation
const passwordResetSchema = z.object({
  email: z.string()
    .min(1, 'El correo electrónico es requerido.')
    .email('Por favor ingresa un correo electrónico válido.'),
})

// PasswordConfirmForm validation
const passwordConfirmSchema = z.object({
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  confirmPassword: z.string()
    .min(1, 'Por favor confirma tu contraseña.'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden.',
  path: ['confirmPassword'],
})
```

### shadcn/ui Components to Use

From components installed in Story 1.1:
- `Button` - for submit buttons
- `Input` - for email and password fields
- `Card` - optional wrapper for form (match login page)
- `Sonner` (toast) - for success/error notifications if needed

### Supabase Email Template (Already Configured)

The Spanish email template for password recovery is configured in Supabase Auth:

```html
<!-- Subject: Restablecer tu contraseña de Setec AI Hub -->
<h2>Restablecer Contraseña</h2>
<p>Hola,</p>
<p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Setec AI Hub.</p>
<p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
<p><a href="{{ .ConfirmationURL }}">Restablecer mi contraseña</a></p>
<p>Este enlace expirará en 24 horas.</p>
<p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
```

### Previous Story Learnings (Story 1.2)

**Patterns to follow:**
- Auth layout already exists at `app/(auth)/layout.tsx` - reuse it
- Footer component with Privacy link already exists at `components/common/Footer.tsx`
- Supabase clients created: `lib/supabase/client.ts`, `server.ts`
- Error utilities exist: `lib/utils/error-utils.ts` with `ERROR_CODES`
- Brand colors in `globals.css`: `--setec-orange`, `--setec-charcoal`
- Test setup with Vitest already configured

**Issues found and fixed in Story 1.2 (avoid repeating):**
- Use `Link` from `next/link` for internal navigation (not `<a>`)
- Memoize Supabase client with `useMemo` to avoid recreation on each render
- Don't add redundant `aria-label` when `htmlFor` provides label association
- Don't add `tabIndex={0}` to elements that are focusable by default

**Dependencies confirmed working:**
- `@supabase/supabase-js@^2.94.0`
- `@supabase/ssr@^0.8.0`
- `zod@^4.3.6` (Note: Use `.issues` not `.errors` for validation error extraction)

### Project Structure Notes

**Files to create:**
```
app/
├── (auth)/
│   └── recuperar-password/
│       ├── page.tsx            ← NEW: Password reset request page
│       └── confirmar/
│           └── page.tsx        ← NEW: Password confirm page
components/
├── auth/
│   ├── PasswordResetForm.tsx   ← NEW: Request reset form
│   ├── PasswordResetForm.test.tsx
│   ├── PasswordConfirmForm.tsx ← NEW: Set new password form
│   ├── PasswordConfirmForm.test.tsx
│   └── index.ts                ← UPDATE: Add exports
constants/
└── messages.ts                 ← UPDATE: Add password recovery messages
```

**Files to verify/update:**
```
app/api/auth/callback/route.ts  ← VERIFY: Handles recovery type
```

**Alignment with Architecture:**
- Route groups: `(auth)` for public auth routes
- Component location: `components/auth/` for auth-related components
- Tests co-located with components
- Messages centralized in `constants/messages.ts`

### Security Considerations

1. **Email enumeration prevention:** Always show success message regardless of whether email exists
2. **Token expiration:** Supabase handles 24-hour expiration automatically
3. **Password strength:** Enforce minimum 6 characters (Supabase default)
4. **Session invalidation:** After password change, Supabase invalidates old sessions

### Testing Checklist

- [ ] Password reset request form renders with correct Spanish labels
- [ ] Email validation works (required, valid format)
- [ ] Success message shown after submitting (regardless of email existence)
- [ ] Password confirm page renders when accessed with valid token
- [ ] Error page shown when accessed with invalid/expired token
- [ ] Password validation works (min length, match confirmation)
- [ ] Success message shown and redirect to login on password update
- [ ] All error messages are in Spanish
- [ ] Accessibility: proper labels, focus states, screen reader support

### References

- [Architecture: Supabase Auth Config] architecture.md#configuración-de-auth
- [Architecture: Folder Structure] architecture.md#estructura-completa-del-proyecto
- [Architecture: Email Templates] architecture.md#plantillas-de-email-español
- [PRD: FR4-FR4.3] prd.md#autenticación-de-usuario--mvp
- [UX: Password Recovery Flow] ux-design-specification.md
- [Epics: Story 1.3] epics.md#story-13-password-recovery-flow

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 194 tests pass (8 test files)
- TypeScript: no errors
- ESLint: no errors

### Completion Notes List

- Implemented complete password recovery flow with two pages: request (recuperar-password) and confirm (recuperar-password/confirmar)
- Created PasswordResetForm component with email validation, loading states, success message display
- Created PasswordConfirmForm component with password/confirm validation (min 6 chars, match), auto-redirect to login
- Auth callback route handles `type=recovery` flow and redirects appropriately
- All Spanish UI labels and error messages centralized in constants/messages.ts
- Email enumeration prevention: always shows success message regardless of email existence
- Token validity checked via Supabase session on confirm page
- Fixed LoginForm link from `/forgot-password` to `/recuperar-password`
- Fixed Zod error extraction (use `.issues` only, not `.errors`)
- 38 new tests added (18 for PasswordResetForm, 20 for PasswordConfirmForm)

### File List

**Created:**
- app/(auth)/recuperar-password/page.tsx
- app/(auth)/recuperar-password/confirmar/page.tsx
- app/(auth)/recuperar-password/confirmar/page.test.tsx
- app/api/auth/callback/route.ts
- components/auth/PasswordResetForm.tsx
- components/auth/PasswordResetForm.test.tsx
- components/auth/PasswordConfirmForm.tsx
- components/auth/PasswordConfirmForm.test.tsx
- components/auth/AuthHeader.tsx
- components/auth/AuthHeader.test.tsx

**Modified:**
- constants/messages.ts (added PASSWORD_RECOVERY_MESSAGES)
- components/auth/index.ts (added exports for new components + AuthHeader)
- components/auth/LoginForm.tsx (fixed forgot password link, fixed Zod error extraction)
- components/auth/LoginForm.test.tsx (updated test for new link path)

## Senior Developer Review (AI)

**Review Date:** 2026-02-04
**Outcome:** Approved (after fixes)

### Issues Found & Fixed

| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | MEDIUM | Missing error handling in auth callback | Added try/catch in route.ts |
| 2 | MEDIUM | No test coverage for confirm page | Created page.test.tsx with 8 tests |
| 3 | MEDIUM | setTimeout memory leak risk | Added useRef + useEffect cleanup |
| 4 | LOW | Duplicated logo JSX | Extracted AuthHeader component |
| 5 | LOW | Missing test for exception path | Added test for API throws exception |

### Action Items

- [x] [MEDIUM] Add try/catch to auth callback route
- [x] [MEDIUM] Create tests for confirm page component
- [x] [MEDIUM] Fix setTimeout memory leak with cleanup
- [x] [LOW] Extract AuthHeader component to reduce duplication
- [x] [LOW] Add test for exception handling in PasswordResetForm

### Validation Summary

| AC | Status | Evidence |
|----|--------|----------|
| AC#1 | ✅ PASS | Recovery page renders with form, title, button |
| AC#2 | ✅ PASS | Success message shown on submit |
| AC#3 | ✅ PASS | Same message for unregistered emails |
| AC#4 | ✅ PASS | Confirm page with password form |
| AC#5 | ✅ PASS | Password update + redirect works |
| AC#6 | ✅ PASS | Error for invalid/expired links |

## Change Log

- 2026-02-03: Implemented Story 1.3 Password Recovery Flow - all 8 tasks complete
- 2026-02-04: Code review completed - fixed 5 issues (3 MEDIUM, 2 LOW), added 14 tests

