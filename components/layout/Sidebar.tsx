'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/providers/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { FileSpreadsheet, LogOut, Shield } from 'lucide-react'
import { ConversationList } from './ConversationList'
import { NewConversationButton } from './NewConversationButton'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  selectedConversationId?: string | null
}

export function Sidebar({ isOpen, onClose, selectedConversationId }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = useMemo(() => createClient(), [])
  const isPlantillasActive = pathname === '/plantillas'
  const isPrivacidadActive = pathname === '/privacidad'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Dark charcoal per UX spec, full height */}
      <aside
        data-testid="sidebar"
        className={`
          fixed inset-y-0 left-0 z-50
          w-[280px] bg-sidebar border-r border-sidebar-border
          flex flex-col h-screen
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo header - clickable to go home */}
        <div className="p-4 pt-5 pb-5 flex justify-center">
          <Link href="/" onClick={onClose} className="cursor-pointer">
            <Image
              src="/setec-logo.png"
              alt="Setec AI Hub"
              width={180}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>
        </div>

        {/* Nueva conversación button */}
        <div className="px-4 pb-4">
          <NewConversationButton onSuccess={onClose} />
        </div>

        {/* Conversations list - scrollable area */}
        <div className="flex-1 flex flex-col overflow-hidden border-t border-sidebar-border">
          <ConversationList
            selectedConversationId={selectedConversationId}
            onNavigate={onClose}
          />
        </div>

        {/* Bottom section: Plantillas, Privacidad, Cerrar sesión - always fixed */}
        <nav className="border-t border-sidebar-border p-2 space-y-1">
          <Link
            href="/plantillas"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
              isPlantillasActive
                ? 'bg-setec-orange text-white'
                : 'text-sidebar-foreground hover:bg-sidebar-hover'
            }`}
            aria-current={isPlantillasActive ? 'page' : undefined}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="text-sm font-medium">Plantillas</span>
          </Link>
          <Link
            href="/privacidad"
            onClick={onClose}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
              isPrivacidadActive
                ? 'bg-setec-orange text-white'
                : 'text-sidebar-foreground hover:bg-sidebar-hover'
            }`}
            aria-current={isPrivacidadActive ? 'page' : undefined}
          >
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Políticas de Privacidad</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sidebar-foreground hover:bg-sidebar-hover hover:text-white cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span className="text-sm font-medium">Cerrar sesión</span>
          </button>
        </nav>
      </aside>
    </>
  )
}
