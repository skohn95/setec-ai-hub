import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import PlantillasPage from './page'

// Mock the TemplateCard component
vi.mock('@/components/templates', () => ({
  TemplateCard: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="template-card">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}))

// Store the mock so we can modify it in tests
const mockTemplates = [
  {
    id: 'msa',
    title: 'Análisis del Sistema de Medición (MSA)',
    description: 'Plantilla para evaluar la variación en tu sistema de medición.',
    filename: 'plantilla-msa.xlsx',
    downloadPath: '/templates/plantilla-msa.xlsx',
    analysisType: 'msa',
  },
]

// Mock the constants with a getter to allow dynamic values
vi.mock('@/constants', () => ({
  get TEMPLATES() {
    return mockTemplates
  },
}))

describe('PlantillasPage', () => {
  beforeEach(() => {
    // Reset to default templates
    mockTemplates.length = 0
    mockTemplates.push({
      id: 'msa',
      title: 'Análisis del Sistema de Medición (MSA)',
      description: 'Plantilla para evaluar la variación en tu sistema de medición.',
      filename: 'plantilla-msa.xlsx',
      downloadPath: '/templates/plantilla-msa.xlsx',
      analysisType: 'msa',
    })
  })

  describe('Rendering', () => {
    it('renders the page title "Plantillas"', () => {
      render(<PlantillasPage />)
      expect(screen.getByRole('heading', { level: 1, name: 'Plantillas' })).toBeInTheDocument()
    })

    it('renders MSA template card', () => {
      render(<PlantillasPage />)
      expect(screen.getByText('Análisis del Sistema de Medición (MSA)')).toBeInTheDocument()
    })

    it('renders template description', () => {
      render(<PlantillasPage />)
      expect(
        screen.getByText('Plantilla para evaluar la variación en tu sistema de medición.')
      ).toBeInTheDocument()
    })

    it('renders the template card component', () => {
      render(<PlantillasPage />)
      expect(screen.getByTestId('template-card')).toBeInTheDocument()
    })
  })

  describe('Layout', () => {
    it('renders within a container', () => {
      const { container } = render(<PlantillasPage />)
      const main = container.firstChild as HTMLElement
      expect(main.className).toMatch(/container|mx-auto/)
    })

    it('has proper spacing for heading', () => {
      render(<PlantillasPage />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading.className).toMatch(/mb-/)
    })
  })

  describe('Empty state', () => {
    it('shows empty message when no templates available', () => {
      mockTemplates.length = 0
      render(<PlantillasPage />)
      expect(screen.getByText('No hay plantillas disponibles.')).toBeInTheDocument()
    })

    it('does not show template cards when empty', () => {
      mockTemplates.length = 0
      render(<PlantillasPage />)
      expect(screen.queryByTestId('template-card')).not.toBeInTheDocument()
    })
  })
})
