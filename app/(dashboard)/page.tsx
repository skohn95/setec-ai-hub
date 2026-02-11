'use client'

import { BarChart3, Calculator, Sparkles, Cpu } from 'lucide-react'
import { NewConversationButton } from '@/components/layout/NewConversationButton'

const capabilities = [
  {
    icon: Calculator,
    title: 'Análisis Estadístico',
    description: 'Realiza análisis estadísticos sin necesidad de software especializado'
  },
  {
    icon: Sparkles,
    title: 'Interpretación con IA',
    description: 'Obtén explicaciones claras y recomendaciones accionables'
  },
  {
    icon: BarChart3,
    title: 'Gráficos Profesionales',
    description: 'Visualiza tus resultados con gráficos claros y descargables'
  },
]

export default function DashboardPage() {
  return (
    <div className="relative flex items-center justify-center h-full min-h-[500px] p-4 overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-setec-orange/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-orange-300/10 rounded-full blur-2xl" />

      <div className="relative text-center space-y-8 max-w-2xl">
        {/* Hero section */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-setec-orange to-orange-600 text-white shadow-lg shadow-orange-500/25 mb-2">
            <Cpu className="h-8 w-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
            Bienvenido a <span className="text-setec-orange">Setec AI Hub</span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Tu asistente inteligente para análisis estadístico y control de calidad
          </p>
        </div>

        {/* Capabilities grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {capabilities.map((capability) => (
            <div
              key={capability.title}
              className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-left transition-all hover:border-setec-orange/30 hover:shadow-md"
            >
              <capability.icon className="h-6 w-6 text-setec-orange mb-3" />
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                {capability.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {capability.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="pt-4">
          <div className="w-72 mx-auto">
            <NewConversationButton />
          </div>
        </div>
      </div>
    </div>
  )
}
