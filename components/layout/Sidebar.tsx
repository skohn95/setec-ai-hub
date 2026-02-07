'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { FileSpreadsheet } from 'lucide-react'
import { ConversationList } from './ConversationList'
import { NewConversationButton } from './NewConversationButton'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  selectedConversationId?: string | null
}

export function Sidebar({ isOpen, onClose, selectedConversationId }: SidebarProps) {
  const pathname = usePathname()
  const isPlantillasActive = pathname === '/plantillas'

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
          <NewConversationButton onSuccess={onClose} />
        </div>

        <Separator className="bg-[#E5E5E5]" />

        {/* Navigation links */}
        <nav className="p-2">
          <Link
            href="/plantillas"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isPlantillasActive
                ? 'bg-setec-orange/10 text-setec-orange'
                : 'text-setec-charcoal hover:bg-white/50'
            }`}
            aria-current={isPlantillasActive ? 'page' : undefined}
          >
            <FileSpreadsheet className="h-4 w-4" />
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
