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
  {
    id: 'capacidad_proceso',
    title: 'Análisis de Capacidad de Proceso',
    description:
      'Evalúa si tu proceso cumple con las especificaciones del cliente. Incluye datos de ejemplo para calcular índices de capacidad.',
    filename: 'plantilla-capacidad-proceso.xlsx',
    downloadPath: '/templates/plantilla-capacidad-proceso.xlsx',
    analysisType: 'capacidad_proceso',
  },
]
