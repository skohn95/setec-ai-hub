'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/providers/AuthProvider'
import { Sidebar } from '@/components/layout'
import { ErrorBoundary } from '@/components/common'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
}

function LoadingSkeleton() {
  return (
    <div data-testid="loading-skeleton" className="min-h-screen bg-background flex">
      {/* Sidebar skeleton - dark charcoal per UX spec, fixed position */}
      <div className="hidden md:flex fixed inset-y-0 left-0 w-[280px] border-r border-sidebar-border bg-sidebar flex-col z-50">
        {/* Logo area */}
        <div className="p-4 flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded bg-sidebar-hover" />
          <Skeleton className="h-5 w-16 bg-sidebar-hover" />
        </div>
        {/* Button */}
        <div className="px-4 pb-4">
          <Skeleton className="h-10 w-full bg-sidebar-hover" />
        </div>
        {/* Nav */}
        <div className="p-2">
          <Skeleton className="h-8 w-full bg-sidebar-hover" />
        </div>
        {/* Conversations */}
        <div className="flex-1 p-2 space-y-2">
          <Skeleton className="h-6 w-full bg-sidebar-hover" />
          <Skeleton className="h-6 w-full bg-sidebar-hover" />
          <Skeleton className="h-6 w-full bg-sidebar-hover" />
        </div>
        {/* User menu */}
        <div className="p-2 border-t border-sidebar-border">
          <Skeleton className="h-12 w-full bg-sidebar-hover" />
        </div>
      </div>
      {/* Main content skeleton - offset for fixed sidebar */}
      <div className="flex-1 p-6 md:ml-[280px]">
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const params = useParams()

  // Get the conversation ID from URL if on a conversation page
  const selectedConversationId = params?.id as string | undefined

  // Show loading skeleton while checking auth
  if (loading) {
    return <LoadingSkeleton />
  }

  // Defense-in-depth: Don't render dashboard if user is null after loading
  // (middleware should catch this, but this provides additional safety)
  if (!user) {
    return <LoadingSkeleton />
  }

  const handleMenuClick = () => setSidebarOpen(true)
  const handleSidebarClose = () => setSidebarOpen(false)

  return (
    <div
      data-testid="dashboard-layout"
      className="h-screen bg-background flex overflow-hidden"
    >
      {/* Sidebar - handles both desktop (always visible) and mobile (toggleable) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        selectedConversationId={selectedConversationId}
      />

      {/* Main content area - offset for fixed sidebar on desktop */}
      <div className="flex-1 flex flex-col h-full md:ml-[280px]">
        {/* Mobile header with menu button */}
        <div className="md:hidden h-14 border-b border-sidebar-border bg-sidebar flex items-center px-4 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleMenuClick}
            aria-label="Abrir menú"
            className="text-sidebar-foreground hover:bg-sidebar-hover"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Image
            src="/setec-logo.png"
            alt="Setec AI Hub"
            width={140}
            height={32}
            className="ml-3 h-8 w-auto"
          />
        </div>

        {/* Main content */}
        <main className="flex-1 flex flex-col min-h-0">
          <ErrorBoundary>
            <div className="flex-1 flex flex-col min-h-0">{children}</div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
