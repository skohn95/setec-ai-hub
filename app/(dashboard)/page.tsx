'use client'

import { NewConversationButton } from '@/components/layout/NewConversationButton'

export default function DashboardPage() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center space-y-6 max-w-md px-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-setec-charcoal">
            Bienvenido a Setec AI Hub
          </h1>
          <p className="text-muted-foreground">
            Inicia una nueva conversacion para comenzar tu analisis
          </p>
        </div>
        <div className="flex justify-center">
          <div className="w-64">
            <NewConversationButton />
          </div>
        </div>
      </div>
    </div>
  )
}
