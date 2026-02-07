/**
 * Template definitions for downloadable analysis templates
 * All text in Spanish per project requirements
 */

export interface TemplateDefinition {
  id: string
  title: string
  description: string
  filename: string
  downloadPath: string
  analysisType: string // For future tool integration (Epic 4)
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'msa',
    title: 'Análisis del Sistema de Medición (MSA)',
    description:
      'Plantilla para evaluar la variación en tu sistema de medición. Incluye datos de ejemplo para realizar un análisis Gauge R&R completo.',
    filename: 'plantilla-msa.xlsx',
    downloadPath: '/templates/plantilla-msa.xlsx',
    analysisType: 'msa',
  },
  // Future templates will be added here (Phase 2)
]
