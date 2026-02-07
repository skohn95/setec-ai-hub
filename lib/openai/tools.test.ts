/**
 * Tests for OpenAI tool definitions
 */
import { describe, it, expect } from 'vitest'
import { ANALYZE_TOOL, AVAILABLE_TOOLS } from './tools'

describe('ANALYZE_TOOL', () => {
  it('should be a function type tool', () => {
    expect(ANALYZE_TOOL.type).toBe('function')
  })

  it('should have correct function name', () => {
    expect(ANALYZE_TOOL.function.name).toBe('analyze')
  })

  it('should have a description in Spanish', () => {
    expect(ANALYZE_TOOL.function.description).toBeDefined()
    expect(ANALYZE_TOOL.function.description!.length).toBeGreaterThan(0)
    // Description should mention MSA/Gauge R&R and Excel
    expect(ANALYZE_TOOL.function.description).toMatch(/MSA|Gauge R&R/i)
    expect(ANALYZE_TOOL.function.description).toMatch(/Excel/i)
  })

  describe('parameters', () => {
    const params = ANALYZE_TOOL.function.parameters

    it('should have object type parameters', () => {
      expect(params?.type).toBe('object')
    })

    it('should have analysis_type property', () => {
      expect(params?.properties?.analysis_type).toBeDefined()
      expect(params?.properties?.analysis_type?.type).toBe('string')
      expect(params?.properties?.analysis_type?.enum).toContain('msa')
    })

    it('should have file_id property', () => {
      expect(params?.properties?.file_id).toBeDefined()
      expect(params?.properties?.file_id?.type).toBe('string')
    })

    it('should require both analysis_type and file_id', () => {
      expect(params?.required).toContain('analysis_type')
      expect(params?.required).toContain('file_id')
    })

    it('should not allow additional properties', () => {
      expect(params?.additionalProperties).toBe(false)
    })
  })
})

describe('AVAILABLE_TOOLS', () => {
  it('should be an array', () => {
    expect(Array.isArray(AVAILABLE_TOOLS)).toBe(true)
  })

  it('should contain the analyze tool', () => {
    expect(AVAILABLE_TOOLS).toContain(ANALYZE_TOOL)
  })

  it('should have exactly 1 tool in MVP', () => {
    // MVP only has MSA analysis tool
    expect(AVAILABLE_TOOLS.length).toBe(1)
  })

  it('should export valid OpenAI tool format', () => {
    // Each tool should have required OpenAI structure
    AVAILABLE_TOOLS.forEach((tool) => {
      expect(tool.type).toBe('function')
      expect(tool.function).toBeDefined()
      expect(tool.function.name).toBeDefined()
      expect(tool.function.parameters).toBeDefined()
    })
  })
})
