# Story 1.4: Protected Routes & Session Management

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **unauthorized access to be blocked and my session managed properly**,
So that **my data is secure and I stay logged in until I choose to log out**.

**FRs covered:** FR2, FR3

## Acceptance Criteria

1. **Given** an unauthenticated user tries to access any dashboard route, **When** the middleware processes the request, **Then** they are redirected to the login page, **And** the originally requested URL is preserved for post-login redirect

2. **Given** an authenticated user is browsing the dashboard, **When** they navigate between pages, **Then** their session remains valid, **And** no re-authentication is required

3. **Given** an authenticated user closes their browser and reopens it, **When** they return to the site, **Then** they are still authenticated (session persisted via Supabase Auth), **And** they can continue using the dashboard without logging in again

4. **Given** an authenticated user clicks "Cerrar sesión", **When** the logout action completes, **Then** their session is invalidated, **And** they are redirected to the login page, **And** they cannot access dashboard routes until logging in again

5. **Given** the dashboard layout needs to be established, **When** an authenticated user accesses the dashboard, **Then** they see a header with the Setec logo and user menu (with logout option), **And** they see a sidebar area (content to be added in Epic 2), **And** they see a main content area, **And** the layout is responsive (desktop-first, functional on mobile)

## Tasks / Subtasks

- [x] **Task 1: Create Next.js Middleware for Route Protection** (AC: #1, #2)
  - [x] Create `middleware.ts` in project root
  - [x] Configure matcher to protect all `/(dashboard)` routes
  - [x] Use `@supabase/ssr` to validate session from cookies
  - [x] If no session: redirect to `/login` with `redirectTo` query param preserving original URL
  - [x] If session valid: allow request to continue
  - [x] Exclude public routes: `/login`, `/recuperar-password`, `/api/auth/*`, static files

- [x] **Task 2: Update Supabase Middleware Client** (AC: #1, #2, #3)
  - [x] Verify `lib/supabase/middleware.ts` exists (from Story 1.1)
  - [x] Ensure `updateSession()` properly refreshes tokens in middleware
  - [x] Handle session refresh to keep users authenticated across browser sessions
  - [x] Export helper function for middleware to use

- [x] **Task 3: Update Login Flow for Post-Login Redirect** (AC: #1)
  - [x] Modify `components/auth/LoginForm.tsx` to read `redirectTo` from URL params
  - [x] After successful login, redirect to `redirectTo` if present, else to `/`
  - [x] Use `next/navigation` `useSearchParams()` to get query parameter
  - [x] Sanitize redirectTo to prevent open redirect vulnerabilities (only allow same-origin paths)

- [x] **Task 4: Create Dashboard Layout** (AC: #5)
  - [x] Create `app/(dashboard)/layout.tsx`
  - [x] Import and wrap with Auth validation (useAuth hook)
  - [x] Structure layout with three areas: Header, Sidebar, Main Content
  - [x] Use CSS Grid or Flexbox for responsive layout
  - [x] Sidebar: 280px fixed width on desktop, collapsible on mobile
  - [x] Main content: fills remaining space with scroll

- [x] **Task 5: Create Header Component** (AC: #4, #5)
  - [x] Create `components/layout/Header.tsx`
  - [x] Add Setec text logo on left (same style as auth pages)
  - [x] Add user dropdown menu on right with:
    - User email display
    - "Cerrar sesión" option
  - [x] Use shadcn/ui `DropdownMenu` and `Avatar` components
  - [x] Wire logout to `supabase.auth.signOut()` → redirect to `/login`
  - [x] Make header responsive (logo visible on mobile, menu accessible)

- [x] **Task 6: Create Sidebar Component** (AC: #5)
  - [x] Create `components/layout/Sidebar.tsx`
  - [x] Create placeholder structure for conversation list (Epic 2)
  - [x] Add "Nueva conversación" button placeholder at top
  - [x] Add "Plantillas" navigation link
  - [x] Style with Setec brand colors
  - [x] Implement mobile toggle (hamburger menu in header on mobile)
  - [x] Use shadcn/ui `ScrollArea` for scrollable conversation list area
  - [x] Add separator between navigation and conversation list area

- [x] **Task 7: Create Dashboard Main Page** (AC: #5)
  - [x] Create `app/(dashboard)/page.tsx`
  - [x] Show welcome message or empty state for chat (Epic 2)
  - [x] Placeholder text: "Selecciona una conversación o inicia una nueva"
  - [x] Style centered in main content area

- [x] **Task 8: Update AuthProvider to Handle Loading State** (AC: #2, #3)
  - [x] Verify `lib/providers/AuthProvider.tsx` handles initial auth check
  - [x] Add loading state while checking auth on page load
  - [x] Dashboard layout should show skeleton/loading until auth confirmed
  - [x] Prevent flash of unauthorized content

- [x] **Task 9: Add Component Exports and Index Files** (AC: all)
  - [x] Create `components/layout/index.ts` with exports for Header, Sidebar
  - [x] Update any existing barrel exports as needed

- [x] **Task 10: Write Unit Tests** (AC: all)
  - [x] Test middleware redirects unauthenticated users
  - [x] Test middleware allows authenticated users
  - [x] Test LoginForm redirect after login works
  - [x] Test Header component renders with user menu
  - [x] Test Header logout calls signOut and redirects
  - [x] Test Sidebar component renders with navigation
  - [x] Test Dashboard layout renders children when authenticated
  - [x] Test loading state shown while auth checking

## Dev Notes

### Critical Architecture Patterns

**File Naming (from Architecture):**
- Components: PascalCase.tsx → `Header.tsx`, `Sidebar.tsx`
- Pages: lowercase with route structure → `app/(dashboard)/page.tsx`
- Tests: co-located → `Header.test.tsx` next to `Header.tsx`
- Middleware: `middleware.ts` in project root (Next.js convention)

**Middleware Pattern (from Architecture):**
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protected routes check
  if (!user && !request.nextUrl.pathname.startsWith('/login') &&
      !request.nextUrl.pathname.startsWith('/recuperar-password') &&
      !request.nextUrl.pathname.startsWith('/api/auth')) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Dashboard Layout Structure (from UX Design):**
```
┌────────────────────────────────────────────────────────────┐
│ [SETEC] ─────────────────────────────────── [User Menu ▼] │
├─────────────────┬──────────────────────────────────────────┤
│                 │                                          │
│  [+ Nueva]      │                                          │
│                 │       Main Content Area                  │
│  ─────────────  │                                          │
│  Plantillas     │       (Chat will go here in Epic 2)      │
│  ─────────────  │                                          │
│                 │                                          │
│  Conversations  │                                          │
│  (list area)    │                                          │
│                 │                                          │
│                 │                                          │
├─────────────────┴──────────────────────────────────────────┤
│                        Privacidad                          │
└────────────────────────────────────────────────────────────┘
```

**Layout CSS (desktop-first responsive):**
```css
/* Dashboard layout - 280px sidebar on desktop */
.dashboard-layout {
  display: grid;
  grid-template-rows: 56px 1fr;  /* Header + content */
  grid-template-columns: 280px 1fr;  /* Sidebar + main */
  min-height: 100vh;
}

.dashboard-header {
  grid-column: 1 / -1;  /* Full width */
}

/* Mobile: sidebar collapses */
@media (max-width: 768px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
  }
  .dashboard-sidebar {
    position: fixed;
    left: -280px;  /* Hidden by default */
    transition: left 0.3s ease;
  }
  .dashboard-sidebar.open {
    left: 0;
  }
}
```

### UX Design Requirements

**Header Component:**
- Height: 56px fixed
- Background: White with subtle bottom border
- Left: Setec logo (text, orange)
- Right: User dropdown with avatar initials + email
- Mobile: Add hamburger menu icon to toggle sidebar

**Sidebar Component:**
- Width: 280px on desktop
- Background: Light gray (`#F5F5F5`) or white with border
- Top section: "Nueva conversación" button (full width, orange)
- Navigation section: "Plantillas" link with icon
- Separator
- Conversations section: Scrollable list area (placeholder for Epic 2)
- Footer: Privacy link (optional, can be in main footer)

**User Dropdown Menu (shadcn/ui DropdownMenu):**
```
┌─────────────────────┐
│ user@example.com    │
├─────────────────────┤
│ ✗ Cerrar sesión     │
└─────────────────────┘
```

**Brand Colors (from Architecture):**
- Primary Orange: `#F7931E` (buttons, logo accent)
- Charcoal Text: `#3D3D3D` (labels, headings)
- White: `#FFFFFF` (backgrounds)
- Light Gray: `#F5F5F5` (sidebar background)
- Border Gray: `#E5E5E5` (separators)

### Technical Requirements

**Supabase Session Management:**
```typescript
// lib/supabase/middleware.ts - already exists, verify implementation
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if needed
  await supabase.auth.getUser()

  return response
}
```

**Auth Context (verify in lib/providers/AuthProvider.tsx):**
```typescript
// The AuthProvider should expose:
interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

// Usage in Header:
const { user, signOut } = useAuth()
// Display user.email, call signOut() on logout
```

**Post-Login Redirect (update LoginForm.tsx):**
```typescript
import { useSearchParams, useRouter } from 'next/navigation'

// In LoginForm:
const searchParams = useSearchParams()
const router = useRouter()

const handleSuccessfulLogin = () => {
  const redirectTo = searchParams.get('redirectTo')
  // Sanitize: only allow paths starting with /
  if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
    router.push(redirectTo)
  } else {
    router.push('/')
  }
}
```

### shadcn/ui Components to Use

From components installed in Story 1.1:
- `DropdownMenu` - for user menu in header
- `Avatar` - for user initials
- `Button` - for "Nueva conversación" and logout
- `ScrollArea` - for conversation list in sidebar
- `Separator` - between sidebar sections
- `Skeleton` - for loading states

### Previous Story Learnings (Story 1.3)

**Patterns to follow:**
- Auth layout exists at `app/(auth)/layout.tsx` - separate from dashboard layout
- Footer component with Privacy link exists at `components/common/Footer.tsx`
- Supabase clients: `lib/supabase/client.ts`, `server.ts`, `middleware.ts`
- Error utilities: `lib/utils/error-utils.ts`
- Brand colors in `globals.css`: `--setec-orange`, `--setec-charcoal`
- AuthHeader component exists for reusable logo

**Issues found in previous stories (avoid repeating):**
- Use `Link` from `next/link` for internal navigation
- Memoize Supabase client with `useMemo` to avoid recreation
- Use setTimeout cleanup with `useEffect` return / `useRef`
- Don't add redundant `aria-label` when `htmlFor` provides association

**Dependencies confirmed working:**
- `@supabase/supabase-js@^2.94.0`
- `@supabase/ssr@^0.8.0`
- `zod@^4.3.6`

### Project Structure Notes

**Files to create:**
```
middleware.ts                           ← NEW: Route protection
app/
├── (dashboard)/
│   ├── layout.tsx                      ← NEW: Dashboard layout
│   └── page.tsx                        ← NEW: Dashboard home
components/
├── layout/
│   ├── Header.tsx                      ← NEW: Dashboard header
│   ├── Header.test.tsx
│   ├── Sidebar.tsx                     ← NEW: Dashboard sidebar
│   ├── Sidebar.test.tsx
│   └── index.ts                        ← NEW: Barrel exports
```

**Files to modify:**
```
components/auth/LoginForm.tsx           ← UPDATE: Add redirectTo handling
lib/supabase/middleware.ts              ← VERIFY: Session refresh works
lib/providers/AuthProvider.tsx          ← VERIFY: Loading state exposed
```

**Alignment with Architecture:**
- Route groups: `(dashboard)` for protected routes
- Middleware in root for Next.js route protection
- Component location: `components/layout/` for layout components
- Tests co-located with components

### Security Considerations

1. **Open redirect prevention:** Sanitize `redirectTo` param - only allow same-origin paths starting with `/`
2. **Session validation:** Use `getUser()` in middleware (not `getSession()`) for secure validation
3. **Cookie security:** Supabase SSR handles secure cookie settings
4. **Logout completeness:** Call `signOut()` and clear any local state

### Mobile Responsiveness

**Breakpoints:**
- Desktop: >= 1024px (full sidebar visible)
- Tablet: 768px - 1023px (sidebar collapsible)
- Mobile: < 768px (sidebar hidden, hamburger menu)

**Mobile sidebar behavior:**
- Hidden by default (off-screen left)
- Hamburger icon in header toggles visibility
- Overlay backdrop when open (click to close)
- Touch-friendly: swipe to close (nice-to-have)

### Testing Checklist

- [x] Middleware redirects unauthenticated users to /login
- [x] Middleware preserves original URL in redirectTo param
- [x] Middleware allows authenticated users through
- [x] Login redirects to redirectTo after successful auth
- [x] Login sanitizes redirectTo (no open redirect)
- [x] Dashboard layout renders header, sidebar, main area
- [x] Header shows user email in dropdown
- [x] Header logout works and redirects to /login
- [x] Sidebar shows navigation items
- [x] Sidebar "Plantillas" link navigates correctly
- [x] Layout is responsive (sidebar collapses on mobile)
- [x] Loading state shown while auth checking
- [x] Session persists across browser close/reopen
- [x] Authenticated users redirected away from login page (code review fix)
- [x] Mobile sidebar toggle works via hamburger menu (code review fix)

### References

- [Source: architecture.md#api-y-comunicación] - Middleware pattern
- [Source: architecture.md#frontend-architecture] - AuthProvider context
- [Source: architecture.md#estructura-completa-del-proyecto] - File structure
- [Source: ux-design-specification.md#sidebar-navigation] - Sidebar design
- [Source: ux-design-specification.md#header-component] - Header design
- [Source: epics.md#story-14-protected-routes--session-management] - Story requirements
- [Source: prd.md#autenticación-mvp] - FR2, FR3

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

No debug issues encountered.

### Completion Notes List

- ✅ Created Next.js middleware for route protection with proper session validation
- ✅ Verified existing Supabase middleware client correctly handles session refresh
- ✅ Updated LoginForm to handle redirectTo query parameter with open redirect protection
- ✅ Created dashboard layout with CSS Grid for responsive 3-column structure
- ✅ Created Header component with Setec logo, user dropdown menu, and logout functionality
- ✅ Created Sidebar component with navigation links, conversation placeholder, and mobile toggle support
- ✅ Created dashboard main page with placeholder content for Epic 2
- ✅ Verified AuthProvider handles loading state correctly
- ✅ Created barrel exports for layout components
- ✅ All 233 tests pass including 57 new tests for this story
- ✅ ESLint passes with no errors
- ✅ Application builds successfully

**Code Review Fixes Applied (2026-02-04):**
- ✅ Fixed mobile sidebar toggle - added state management connecting Header hamburger to Sidebar
- ✅ Added redirect for authenticated users visiting /login or /recuperar-password
- ✅ Added defense-in-depth user null check in dashboard layout
- ✅ Removed obsolete app/page.tsx so dashboard handles root URL
- ✅ Added tests for authenticated user redirect from public routes
- ✅ Improved dashboard layout test to verify grid classes
- ✅ Updated Testing Checklist with all items verified

### File List

**New Files:**
- middleware.ts (Route protection middleware)
- app/(dashboard)/layout.tsx (Dashboard layout with Header, Sidebar, Main content)
- app/(dashboard)/layout.test.tsx (Dashboard layout tests)
- app/(dashboard)/page.tsx (Dashboard main page)
- app/(dashboard)/page.test.tsx (Dashboard page tests)
- components/layout/Header.tsx (Header component with user menu)
- components/layout/Header.test.tsx (Header tests)
- components/layout/Sidebar.tsx (Sidebar component with navigation)
- components/layout/Sidebar.test.tsx (Sidebar tests)
- __tests__/middleware.test.ts (Middleware tests)

**Modified Files:**
- components/auth/LoginForm.tsx (Added redirectTo handling)
- components/auth/LoginForm.test.tsx (Added redirect tests)
- components/layout/index.ts (Updated barrel exports)

**Deleted Files (Code Review):**
- app/page.tsx (Removed starter page so dashboard handles root URL)

## Senior Developer Review (AI)

**Review Date:** 2026-02-04
**Review Outcome:** Approved with Changes Applied
**Reviewer:** Claude Opus 4.5 (Code Review Workflow)

### Action Items

- [x] [HIGH] Fix mobile sidebar toggle - Header doesn't pass state to Sidebar
- [x] [HIGH] Add redirect for authenticated users visiting /login
- [x] [HIGH] Add defense-in-depth user null check in dashboard layout
- [x] [HIGH] Fix root page routing - remove obsolete starter page
- [x] [MED] Add test for authenticated user visiting public routes
- [x] [MED] Improve dashboard layout test to verify grid classes
- [x] [MED] Update Testing Checklist (was all unchecked)
- [ ] [LOW] Privacy link goes to non-existent /privacidad page
- [ ] [LOW] Plantillas link goes to non-existent /plantillas page
- [ ] [LOW] Header skeleton structure differs slightly from actual header

**Summary:** 4 HIGH and 3 MEDIUM issues fixed. 3 LOW issues remain (non-blocking - pages will be created in future epics).

## Change Log

| Date | Changes | Author |
|------|---------|--------|
| 2026-02-04 | Implemented protected routes, session management, and dashboard layout | Claude Opus 4.5 |
| 2026-02-04 | Code review fixes: mobile toggle, auth redirects, defense-in-depth, root routing | Claude Opus 4.5 |
| 2026-02-04 | Story marked DONE after code review passed - all HIGH/MEDIUM issues fixed | Claude Opus 4.5 |
