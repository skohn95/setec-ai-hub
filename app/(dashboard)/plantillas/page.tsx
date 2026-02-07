import { TemplateCard } from '@/components/templates'
import { TEMPLATES } from '@/constants'

export default function PlantillasPage() {
  return (
    <div className="container mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-setec-charcoal mb-6">Plantillas</h1>

      {TEMPLATES.length === 0 ? (
        <p className="text-muted-foreground">No hay plantillas disponibles.</p>
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
  )
}
