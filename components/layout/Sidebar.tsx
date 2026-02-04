'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Plus, FileText } from 'lucide-react'
import { ConversationList } from './ConversationList'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  selectedConversationId?: string | null
}

export function Sidebar({ isOpen, onClose, selectedConversationId }: SidebarProps) {
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

      {/* Sidebar */}
      <aside
        data-testid="sidebar"
        className={`
          fixed md:static inset-y-0 left-0 z-50 md:z-auto
          w-[280px] bg-[#F5F5F5] border-r border-[#E5E5E5]
          flex flex-col h-[calc(100vh-56px)]
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Nueva conversación button */}
        <div className="p-4">
          <Button
            className="w-full bg-setec-orange hover:bg-setec-orange/90 text-white font-medium"
            disabled
            aria-label="Nueva conversación (próximamente)"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva conversación
          </Button>
        </div>

        <Separator className="bg-[#E5E5E5]" />

        {/* Navigation links */}
        <nav className="p-2">
          <Link
            href="/plantillas"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-setec-charcoal hover:bg-white/50 transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Plantillas</span>
          </Link>
        </nav>

        <Separator className="bg-[#E5E5E5]" />

        {/* Conversations list */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ConversationList
            selectedConversationId={selectedConversationId}
            onNavigate={onClose}
          />
        </div>

        {/* Privacy link at bottom */}
        <div className="p-4 border-t border-[#E5E5E5]">
          <Link
            href="/privacidad"
            className="text-xs text-muted-foreground hover:text-setec-orange transition-colors"
          >
            Privacidad
          </Link>
        </div>
      </aside>
    </>
  )
}
