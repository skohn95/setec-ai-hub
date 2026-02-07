'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/providers/AuthProvider'
import { Header, Sidebar } from '@/components/layout'
import { ErrorBoundary, Footer } from '@/components/common'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardLayoutProps {
  children: React.ReactNode
}

function LoadingSkeleton() {
  return (
    <div data-testid="loading-skeleton" className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="h-14 border-b bg-white flex items-center justify-between px-4">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      {/* Content skeleton */}
      <div className="flex">
        {/* Sidebar skeleton */}
        <div className="hidden md:block w-[280px] border-r bg-[#F5F5F5] p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-full" />
          <div className="pt-4 space-y-2">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
        {/* Main content skeleton */}
        <div className="flex-1 p-6">
          <Skeleton className="h-32 w-full" />
        </div>
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
      className="min-h-screen bg-background grid grid-rows-[56px_1fr] grid-cols-1 md:grid-cols-[280px_1fr]"
    >
      {/* Header spans full width */}
      <div className="col-span-1 md:col-span-2">
        <Header onMenuClick={handleMenuClick} />
      </div>

      {/* Sidebar - handles both desktop (always visible) and mobile (toggleable) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleSidebarClose}
        selectedConversationId={selectedConversationId}
      />

      {/* Main content area with footer - wrapped in nested ErrorBoundary for dashboard isolation */}
      <main className="overflow-auto p-4 md:p-6 flex flex-col min-h-0">
        <ErrorBoundary>
          <div className="flex-1">{children}</div>
        </ErrorBoundary>
        <Footer />
      </main>
    </div>
  )
}
