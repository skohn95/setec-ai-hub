import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

// Mock Supabase SSR module
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
  })),
}))

// Mock the lib/supabase/middleware module
vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: vi.fn(),
}))

// Helper to create mock NextResponse
function createMockResponse(): NextResponse {
  return NextResponse.next()
}

describe('Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the module to ensure fresh imports
    vi.resetModules()
  })

  const createMockRequest = (pathname: string) => {
    return new NextRequest(new URL(`http://localhost:3000${pathname}`))
  }

  describe('Route Protection', () => {
    it('should redirect unauthenticated users from dashboard routes to login', async () => {
      const { updateSession } = await import('@/lib/supabase/middleware')
      vi.mocked(updateSession).mockResolvedValue({
        supabaseResponse: createMockResponse(),
        user: null,
      })

      const { middleware } = await import('@/middleware')
      const request = createMockRequest('/dashboard')
      const response = await middleware(request)

      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/login')
    })

    it('should preserve original URL in redirectTo query param', async () => {
      const { updateSession } = await import('@/lib/supabase/middleware')
      vi.mocked(updateSession).mockResolvedValue({
        supabaseResponse: createMockResponse(),
        user: null,
      })

      const { middleware } = await import('@/middleware')
      const request = createMockRequest('/dashboard/conversations/123')
      const response = await middleware(request)

      expect(response.headers.get('location')).toContain(
        'redirectTo=%2Fdashboard%2Fconversations%2F123'
      )
    })

    it('should allow authenticated users to access dashboard routes', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const { updateSession } = await import('@/lib/supabase/middleware')
      const mockResponse = createMockResponse()
      vi.mocked(updateSession).mockResolvedValue({
        supabaseResponse: mockResponse,
        user: mockUser,
      })

      const { middleware } = await import('@/middleware')
      const request = createMockRequest('/dashboard')
      const response = await middleware(request)

      // Should NOT redirect - status should not be a redirect
      expect(response.status).not.toBe(307)
      expect(response.status).not.toBe(302)
    })

    it('should allow access to login page without authentication', async () => {
      const { updateSession } = await import('@/lib/supabase/middleware')
      const mockResponse = createMockResponse()
      vi.mocked(updateSession).mockResolvedValue({
        supabaseResponse: mockResponse,
        user: null,
      })

      const { middleware } = await import('@/middleware')
      const request = createMockRequest('/login')
      const response = await middleware(request)

      // Should NOT redirect
      expect(response.status).not.toBe(307)
      expect(response.status).not.toBe(302)
    })

    it('should allow access to recuperar-password without authentication', async () => {
      const { updateSession } = await import('@/lib/supabase/middleware')
      const mockResponse = createMockResponse()
      vi.mocked(updateSession).mockResolvedValue({
        supabaseResponse: mockResponse,
        user: null,
      })

      const { middleware } = await import('@/middleware')
      const request = createMockRequest('/recuperar-password')
      const response = await middleware(request)

      // Should NOT redirect
      expect(response.status).not.toBe(307)
      expect(response.status).not.toBe(302)
    })

    it('should allow access to auth callback routes without authentication', async () => {
      const { updateSession } = await import('@/lib/supabase/middleware')
      const mockResponse = createMockResponse()
      vi.mocked(updateSession).mockResolvedValue({
        supabaseResponse: mockResponse,
        user: null,
      })

      const { middleware } = await import('@/middleware')
      const request = createMockRequest('/api/auth/callback')
      const response = await middleware(request)

      // Should NOT redirect
      expect(response.status).not.toBe(307)
      expect(response.status).not.toBe(302)
    })

    it('should redirect authenticated users away from login page to dashboard', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const { updateSession } = await import('@/lib/supabase/middleware')
      vi.mocked(updateSession).mockResolvedValue({
        supabaseResponse: createMockResponse(),
        user: mockUser,
      })

      const { middleware } = await import('@/middleware')
      const request = createMockRequest('/login')
      const response = await middleware(request)

      // Should redirect to dashboard
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/')
      expect(response.headers.get('location')).not.toContain('/login')
    })

    it('should redirect authenticated users away from recuperar-password to dashboard', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      const { updateSession } = await import('@/lib/supabase/middleware')
      vi.mocked(updateSession).mockResolvedValue({
        supabaseResponse: createMockResponse(),
        user: mockUser,
      })

      const { middleware } = await import('@/middleware')
      const request = createMockRequest('/recuperar-password')
      const response = await middleware(request)

      // Should redirect to dashboard
      expect(response.status).toBe(307)
      expect(response.headers.get('location')).toContain('/')
    })
  })
})
