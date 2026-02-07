import { describe, it, expect } from 'vitest'
import { REJECTION_MESSAGE } from './rejection-messages'

describe('rejection-messages', () => {
  describe('REJECTION_MESSAGE', () => {
    it('is defined and non-empty', () => {
      expect(REJECTION_MESSAGE).toBeDefined()
      expect(REJECTION_MESSAGE.length).toBeGreaterThan(0)
    })

    it('is in Spanish', () => {
      // Check for Spanish keywords
      expect(REJECTION_MESSAGE).toContain('Soy')
      expect(REJECTION_MESSAGE).toContain('ayudarte')
    })

    it('explains system capabilities', () => {
      const lowerMessage = REJECTION_MESSAGE.toLowerCase()
      expect(lowerMessage).toContain('análisis estadístico')
      expect(lowerMessage).toContain('lean six sigma')
    })

    it('mentions MSA capability', () => {
      expect(REJECTION_MESSAGE).toContain('MSA')
    })

    it('is friendly and helpful', () => {
      // Check it ends with a question inviting the user
      expect(REJECTION_MESSAGE).toContain('¿En qué puedo ayudarte?')
    })
  })
})
