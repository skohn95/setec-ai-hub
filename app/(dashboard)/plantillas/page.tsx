import { FileSpreadsheet, Download } from 'lucide-react'
import { TemplateCard } from '@/components/templates'
import { TEMPLATES } from '@/constants'

export default function PlantillasPage() {
  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-setec-orange/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
      <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-orange-300/10 rounded-full blur-2xl" />

      <div className="relative container mx-auto max-w-4xl py-8 px-4">
        {/* Hero Section */}
        <div className="mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-setec-orange to-orange-600 text-white shadow-lg shadow-orange-500/25 mb-4">
            <FileSpreadsheet className="h-8 w-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-3">
            Plantillas de <span className="text-setec-orange">Análisis</span>
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl">
            Descarga plantillas listas para usar con formatos optimizados para cada tipo de análisis estadístico
          </p>
        </div>

        {/* Templates Grid */}
        {TEMPLATES.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 mb-4">
              <Download className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No hay plantillas disponibles.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {TEMPLATES.map((template) => (
              <TemplateCard
                key={template.id}
                title={template.title}
                description={template.description}
                filename={template.filename}
                downloadPath={template.downloadPath}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
