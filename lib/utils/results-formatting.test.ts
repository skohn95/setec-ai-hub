import { describe, it, expect } from 'vitest'
import {
  formatPercentage,
  formatMetric,
  getClassification,
  getClassificationText,
  getClassificationColor,
  getClassificationEmoji,
  getDominantVariationRecommendations,
} from './results-formatting'
import { GRR_THRESHOLDS, GRR_CLASSIFICATIONS } from '@/constants/analysis'

describe('results-formatting', () => {
  describe('GRR_THRESHOLDS constants', () => {
    it('defines acceptable threshold at 10', () => {
      expect(GRR_THRESHOLDS.ACCEPTABLE).toBe(10)
    })

    it('defines marginal threshold at 30', () => {
      expect(GRR_THRESHOLDS.MARGINAL).toBe(30)
    })
  })

  describe('GRR_CLASSIFICATIONS constants', () => {
    it('defines acceptable classification', () => {
      expect(GRR_CLASSIFICATIONS.ACCEPTABLE).toBeDefined()
      expect(GRR_CLASSIFICATIONS.ACCEPTABLE.key).toBe('acceptable')
      expect(GRR_CLASSIFICATIONS.ACCEPTABLE.label).toBe('Aceptable')
      expect(GRR_CLASSIFICATIONS.ACCEPTABLE.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })

    it('defines marginal classification', () => {
      expect(GRR_CLASSIFICATIONS.MARGINAL).toBeDefined()
      expect(GRR_CLASSIFICATIONS.MARGINAL.key).toBe('marginal')
      expect(GRR_CLASSIFICATIONS.MARGINAL.label).toBe('Marginal')
      expect(GRR_CLASSIFICATIONS.MARGINAL.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })

    it('defines unacceptable classification', () => {
      expect(GRR_CLASSIFICATIONS.UNACCEPTABLE).toBeDefined()
      expect(GRR_CLASSIFICATIONS.UNACCEPTABLE.key).toBe('unacceptable')
      expect(GRR_CLASSIFICATIONS.UNACCEPTABLE.label).toBe('Inaceptable')
      expect(GRR_CLASSIFICATIONS.UNACCEPTABLE.color).toMatch(/^#[0-9A-Fa-f]{6}$/)
    })
  })

  describe('formatPercentage', () => {
    it('formats number as percentage with default precision (1 decimal)', () => {
      expect(formatPercentage(18.25)).toBe('18.3%')
    })

    it('formats number with specified precision', () => {
      expect(formatPercentage(18.259, 2)).toBe('18.26%')
    })

    it('formats zero correctly', () => {
      expect(formatPercentage(0)).toBe('0.0%')
    })

    it('formats integer correctly', () => {
      expect(formatPercentage(25)).toBe('25.0%')
    })

    it('rounds correctly', () => {
      // JavaScript toFixed uses banker's rounding, so 18.15 -> 18.1
      // Using clearer test cases
      expect(formatPercentage(18.16)).toBe('18.2%')
      expect(formatPercentage(18.14)).toBe('18.1%')
    })
  })

  describe('formatMetric', () => {
    it('formats number with default precision (3 decimals)', () => {
      expect(formatMetric(0.12345)).toBe('0.123')
    })

    it('formats number with specified precision', () => {
      expect(formatMetric(0.12345, 2)).toBe('0.12')
    })

    it('formats zero correctly', () => {
      expect(formatMetric(0)).toBe('0.000')
    })

    it('formats large numbers correctly', () => {
      expect(formatMetric(123.456789)).toBe('123.457')
    })
  })

  describe('getClassification', () => {
    it('returns acceptable for GRR < 10%', () => {
      const result = getClassification(5)
      expect(result.key).toBe('acceptable')
      expect(result.label).toBe('Aceptable')
    })

    it('returns acceptable for GRR = 9.9%', () => {
      const result = getClassification(9.9)
      expect(result.key).toBe('acceptable')
    })

    it('returns marginal for GRR = 10%', () => {
      const result = getClassification(10)
      expect(result.key).toBe('marginal')
    })

    it('returns marginal for GRR between 10-30%', () => {
      const result = getClassification(20)
      expect(result.key).toBe('marginal')
      expect(result.label).toBe('Marginal')
    })

    it('returns marginal for GRR = 30%', () => {
      const result = getClassification(30)
      expect(result.key).toBe('marginal')
    })

    it('returns unacceptable for GRR > 30%', () => {
      const result = getClassification(35)
      expect(result.key).toBe('unacceptable')
      expect(result.label).toBe('Inaceptable')
    })

    it('returns unacceptable for GRR = 30.1%', () => {
      const result = getClassification(30.1)
      expect(result.key).toBe('unacceptable')
    })
  })

  describe('getClassificationText', () => {
    it('returns "Aceptable" for low GRR', () => {
      expect(getClassificationText(5)).toBe('Aceptable')
    })

    it('returns "Marginal" for medium GRR', () => {
      expect(getClassificationText(20)).toBe('Marginal')
    })

    it('returns "Inaceptable" for high GRR', () => {
      expect(getClassificationText(40)).toBe('Inaceptable')
    })
  })

  describe('getClassificationColor', () => {
    it('returns green color for acceptable GRR', () => {
      const color = getClassificationColor(5)
      expect(color).toBe('#10B981')
    })

    it('returns amber color for marginal GRR', () => {
      const color = getClassificationColor(20)
      expect(color).toBe('#F59E0B')
    })

    it('returns red color for unacceptable GRR', () => {
      const color = getClassificationColor(40)
      expect(color).toBe('#EF4444')
    })
  })

  describe('getClassificationEmoji', () => {
    it('returns green circle for acceptable GRR', () => {
      expect(getClassificationEmoji(5)).toContain('🟢')
    })

    it('returns yellow circle for marginal GRR', () => {
      expect(getClassificationEmoji(20)).toContain('🟡')
    })

    it('returns red circle for unacceptable GRR', () => {
      expect(getClassificationEmoji(40)).toContain('🔴')
    })
  })

  describe('getDominantVariationRecommendations', () => {
    it('returns equipment-focused recommendations for repeatability', () => {
      const recommendations = getDominantVariationRecommendations('repeatability')
      expect(recommendations.length).toBeGreaterThan(0)

      const text = recommendations.join(' ').toLowerCase()
      expect(text).toContain('equipo')
    })

    it('returns operator-focused recommendations for reproducibility', () => {
      const recommendations = getDominantVariationRecommendations('reproducibility')
      expect(recommendations.length).toBeGreaterThan(0)

      const text = recommendations.join(' ').toLowerCase()
      expect(text).toContain('operador')
    })

    it('returns positive recommendations for part_to_part', () => {
      const recommendations = getDominantVariationRecommendations('part_to_part')
      expect(recommendations.length).toBeGreaterThan(0)

      const text = recommendations.join(' ').toLowerCase()
      expect(text).toContain('correctamente')
    })

    it('returns array of strings', () => {
      const recommendations = getDominantVariationRecommendations('repeatability')
      expect(Array.isArray(recommendations)).toBe(true)
      recommendations.forEach(rec => {
        expect(typeof rec).toBe('string')
      })
    })

    it('returns at least 2 recommendations', () => {
      expect(getDominantVariationRecommendations('repeatability').length).toBeGreaterThanOrEqual(2)
      expect(getDominantVariationRecommendations('reproducibility').length).toBeGreaterThanOrEqual(2)
      expect(getDominantVariationRecommendations('part_to_part').length).toBeGreaterThanOrEqual(2)
    })
  })
})
