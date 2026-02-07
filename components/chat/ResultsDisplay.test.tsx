import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ResultsDisplay from './ResultsDisplay'

const mockResults = {
  grr_percent: 18.2,
  repeatability_percent: 12.5,
  reproducibility_percent: 13.2,
  part_to_part_percent: 98.3,
  ndc: 4,
  classification: 'marginal' as const,
}

const mockChartData = [
  {
    type: 'variationBreakdown',
    data: [
      { source: 'Repetibilidad', percentage: 12.5, color: '#3B82F6' },
      { source: 'Reproducibilidad', percentage: 13.2, color: '#F97316' },
      { source: 'Parte a Parte', percentage: 98.3, color: '#10B981' },
    ],
  },
]

describe('ResultsDisplay', () => {
  describe('rendering', () => {
    it('renders classification badge', () => {
      render(<ResultsDisplay results={mockResults} />)

      expect(screen.getByTestId('classification-badge')).toBeInTheDocument()
    })

    it('displays classification label', () => {
      render(<ResultsDisplay results={mockResults} />)

      expect(screen.getByText(/marginal/i)).toBeInTheDocument()
    })

    it('displays GRR percentage', () => {
      render(<ResultsDisplay results={mockResults} />)

      expect(screen.getByText(/18\.2%/)).toBeInTheDocument()
    })

    it('displays ndc value', () => {
      render(<ResultsDisplay results={mockResults} />)

      expect(screen.getByText(/4/)).toBeInTheDocument()
    })
  })

  describe('classification colors', () => {
    it('shows green badge for acceptable classification', () => {
      const acceptableResults = { ...mockResults, grr_percent: 5, classification: 'aceptable' as const }
      render(<ResultsDisplay results={acceptableResults} />)

      const badge = screen.getByTestId('classification-badge')
      expect(badge).toHaveClass('bg-green-100')
    })

    it('shows yellow badge for marginal classification', () => {
      render(<ResultsDisplay results={mockResults} />)

      const badge = screen.getByTestId('classification-badge')
      expect(badge).toHaveClass('bg-amber-100')
    })

    it('shows red badge for unacceptable classification', () => {
      const unacceptableResults = { ...mockResults, grr_percent: 45, classification: 'inaceptable' as const }
      render(<ResultsDisplay results={unacceptableResults} />)

      const badge = screen.getByTestId('classification-badge')
      expect(badge).toHaveClass('bg-red-100')
    })
  })

  describe('metrics display', () => {
    it('displays repeatability percentage', () => {
      render(<ResultsDisplay results={mockResults} />)

      expect(screen.getByText(/repetibilidad/i)).toBeInTheDocument()
      expect(screen.getByText(/12\.5%/)).toBeInTheDocument()
    })

    it('displays reproducibility percentage', () => {
      render(<ResultsDisplay results={mockResults} />)

      expect(screen.getByText(/reproducibilidad/i)).toBeInTheDocument()
      expect(screen.getByText(/13\.2%/)).toBeInTheDocument()
    })

    it('displays part-to-part percentage', () => {
      render(<ResultsDisplay results={mockResults} />)

      expect(screen.getByText(/parte a parte/i)).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has appropriate semantic structure', () => {
      render(<ResultsDisplay results={mockResults} />)

      const container = screen.getByTestId('results-display')
      expect(container).toBeInTheDocument()
    })
  })

  describe('invalid classification handling', () => {
    it('falls back to marginal for invalid classification value', () => {
      const resultsWithInvalidClassification = {
        ...mockResults,
        classification: 'invalid_value' as 'marginal',
      }
      render(<ResultsDisplay results={resultsWithInvalidClassification} />)

      const badge = screen.getByTestId('classification-badge')
      // Should fallback to marginal styling
      expect(badge).toHaveClass('bg-amber-100')
    })

    it('falls back to marginal for missing classification', () => {
      const resultsWithoutClassification = {
        ...mockResults,
        classification: undefined as unknown as 'marginal',
      }
      render(<ResultsDisplay results={resultsWithoutClassification} />)

      const badge = screen.getByTestId('classification-badge')
      expect(badge).toHaveClass('bg-amber-100')
    })
  })
})
