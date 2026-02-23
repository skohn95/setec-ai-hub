/**
 * Tests for OpenAI tool definitions
 */
import { describe, it, expect } from 'vitest'
import type { ChatCompletionTool } from 'openai/resources/chat/completions'
import { ANALYZE_TOOL, AVAILABLE_TOOLS } from './tools'

// Helper to safely access function properties from a tool
// All our tools are function tools, so this is safe
function getFunctionDef(tool: ChatCompletionTool) {
  if (tool.type !== 'function' || !('function' in tool)) {
    throw new Error('Expected a function tool')
  }
  return tool.function
}

// Extract params helper for cleaner tests
function getParams(tool: ChatCompletionTool) {
  const fn = getFunctionDef(tool)
  return fn.parameters as Record<string, unknown> | undefined
}

describe('ANALYZE_TOOL', () => {
  it('should be a function type tool', () => {
    expect(ANALYZE_TOOL.type).toBe('function')
  })

  it('should have correct function name', () => {
    const fn = getFunctionDef(ANALYZE_TOOL)
    expect(fn.name).toBe('analyze')
  })

  it('should have a description in Spanish mentioning MSA', () => {
    const fn = getFunctionDef(ANALYZE_TOOL)
    expect(fn.description).toBeDefined()
    expect(fn.description!.length).toBeGreaterThan(0)
    // Description should mention MSA/Gauge R&R and Excel
    expect(fn.description).toMatch(/MSA|Gauge R&R/i)
    expect(fn.description).toMatch(/Excel/i)
  })

  it('should have a description mentioning Capacidad de Proceso', () => {
    const fn = getFunctionDef(ANALYZE_TOOL)
    expect(fn.description).toMatch(/Capacidad de Proceso|Cp, Cpk|capacidad/i)
  })

  describe('parameters', () => {
    it('should have object type parameters', () => {
      const params = getParams(ANALYZE_TOOL)
      expect(params?.type).toBe('object')
    })

    it('should have analysis_type property with msa', () => {
      const params = getParams(ANALYZE_TOOL) as { properties?: Record<string, Record<string, unknown>> }
      expect(params?.properties?.analysis_type).toBeDefined()
      expect(params?.properties?.analysis_type?.type).toBe('string')
      expect(params?.properties?.analysis_type?.enum).toContain('msa')
    })

    it('should have analysis_type property with capacidad_proceso', () => {
      const params = getParams(ANALYZE_TOOL) as { properties?: Record<string, Record<string, unknown>> }
      expect(params?.properties?.analysis_type?.enum).toContain('capacidad_proceso')
    })

    it('should have spec_limits property for capacidad_proceso', () => {
      const params = getParams(ANALYZE_TOOL) as { properties?: Record<string, Record<string, unknown>> }
      const specLimits = params?.properties?.spec_limits as Record<string, unknown> | undefined
      expect(specLimits).toBeDefined()
      expect(specLimits?.type).toBe('object')

      const specLimitsProps = specLimits?.properties as Record<string, Record<string, unknown>> | undefined
      expect(specLimitsProps?.lei).toBeDefined()
      expect(specLimitsProps?.lei?.type).toBe('number')
      expect(specLimitsProps?.les).toBeDefined()
      expect(specLimitsProps?.les?.type).toBe('number')

      const specLimitsRequired = specLimits?.required as string[] | undefined
      expect(specLimitsRequired).toContain('lei')
      expect(specLimitsRequired).toContain('les')
    })

    it('should have file_id property', () => {
      const params = getParams(ANALYZE_TOOL) as { properties?: Record<string, Record<string, unknown>> }
      expect(params?.properties?.file_id).toBeDefined()
      expect(params?.properties?.file_id?.type).toBe('string')
    })

    it('should require both analysis_type and file_id', () => {
      const params = getParams(ANALYZE_TOOL) as { required?: string[] }
      expect(params?.required).toContain('analysis_type')
      expect(params?.required).toContain('file_id')
    })

    it('should not allow additional properties', () => {
      const params = getParams(ANALYZE_TOOL) as { additionalProperties?: boolean }
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
      const fn = getFunctionDef(tool)
      expect(fn.name).toBeDefined()
      expect(fn.parameters).toBeDefined()
    })
  })
})
