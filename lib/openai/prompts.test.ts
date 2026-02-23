import { describe, it, expect } from 'vitest'
import { FILTER_SYSTEM_PROMPT, MAIN_SYSTEM_PROMPT } from './prompts'

describe('prompts', () => {
  describe('FILTER_SYSTEM_PROMPT', () => {
    it('is defined and non-empty', () => {
      expect(FILTER_SYSTEM_PROMPT).toBeDefined()
      expect(FILTER_SYSTEM_PROMPT.length).toBeGreaterThan(0)
    })

    it('specifies allowed topics', () => {
      const lowerPrompt = FILTER_SYSTEM_PROMPT.toLowerCase()
      expect(lowerPrompt).toContain('allowed')
      expect(lowerPrompt).toContain('msa')
      expect(lowerPrompt).toContain('estadístic')
      expect(lowerPrompt).toContain('lean six sigma')
    })

    // Story 8.4: Capacidad de Proceso support in filter
    describe('capacidad de proceso filter support', () => {
      it('allows capacidad de proceso follow-up questions', () => {
        const prompt = FILTER_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('capacidad de proceso')
      })

      it('allows normality and distribution questions', () => {
        const prompt = FILTER_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('normalidad')
      })

      it('allows stability and I-MR chart questions', () => {
        const prompt = FILTER_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('estabilidad')
      })

      it('allows specification limits questions', () => {
        const prompt = FILTER_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('lei')
        expect(prompt).toContain('les')
      })
    })

    it('specifies rejected topics', () => {
      const lowerPrompt = FILTER_SYSTEM_PROMPT.toLowerCase()
      expect(lowerPrompt).toContain('receta')
      expect(lowerPrompt).toContain('entretenimiento')
    })

    it('instructs to return JSON', () => {
      expect(FILTER_SYSTEM_PROMPT.toLowerCase()).toContain('json')
    })
  })

  describe('MAIN_SYSTEM_PROMPT', () => {
    it('is defined and non-empty', () => {
      expect(MAIN_SYSTEM_PROMPT).toBeDefined()
      expect(MAIN_SYSTEM_PROMPT.length).toBeGreaterThan(0)
    })

    it('establishes identity as Asistente del Setec AI Hub', () => {
      expect(MAIN_SYSTEM_PROMPT.toLowerCase()).toContain('asistente del setec ai hub')
    })

    it('identifies as Lean Six Sigma statistics assistant', () => {
      const lowerPrompt = MAIN_SYSTEM_PROMPT.toLowerCase()
      expect(lowerPrompt).toContain('lean six sigma')
      expect(lowerPrompt).toContain('estadístic')
    })

    it('specifies professional and pedagogical tone', () => {
      const lowerPrompt = MAIN_SYSTEM_PROMPT.toLowerCase()
      expect(lowerPrompt).toContain('profesional')
      expect(lowerPrompt).toContain('pedagógic')
    })

    it('instructs to respond in Spanish', () => {
      expect(MAIN_SYSTEM_PROMPT.toLowerCase()).toContain('español')
    })

    it('describes MSA and analysis capabilities', () => {
      const lowerPrompt = MAIN_SYSTEM_PROMPT.toLowerCase()
      expect(lowerPrompt).toContain('msa')
      expect(lowerPrompt).toContain('gauge r&r')
    })

    it('instructs to guide users to Templates section for analysis', () => {
      const lowerPrompt = MAIN_SYSTEM_PROMPT.toLowerCase()
      expect(lowerPrompt).toContain('plantilla')
    })

    it('references that analysis tools require file upload', () => {
      const lowerPrompt = MAIN_SYSTEM_PROMPT.toLowerCase()
      expect(lowerPrompt).toContain('subir')
    })

    // Story 4.4: Tool usage tests
    describe('tool usage instructions', () => {
      it('mentions the analyze tool', () => {
        expect(MAIN_SYSTEM_PROMPT.toLowerCase()).toContain('analyze')
      })

      it('instructs when to use the tool (file + intent)', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        // Should mention using tool when file uploaded AND user wants analysis
        expect(prompt).toContain('archivo')
        expect(prompt).toContain('herramienta')
      })

      it('instructs to verify file before proceeding', () => {
        // Should verify file is available before analysis
        expect(MAIN_SYSTEM_PROMPT.toLowerCase()).toContain('verificar archivo')
      })

      it('instructs to follow tool response instructions field', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('instructions')
      })

      it('instructs to handle validation errors gracefully', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('error')
        expect(prompt).toContain('validación')
      })

      it('instructs not to invoke tool without valid file_id', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('file_id')
      })
    })

    // Story 5.1: Enhanced result presentation guidelines
    describe('result presentation guidelines', () => {
      it('includes methodology explanation guidance for Gauge R&R', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('gauge r&r')
        expect(prompt).toContain('metodología')
      })

      it('defines repeatability and reproducibility', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('repetibilidad')
        expect(prompt).toContain('reproducibilidad')
      })

      it('includes interpretation guidelines for GRR percentages', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        // Should mention what GRR percentages mean practically
        expect(prompt).toContain('%grr')
        expect(prompt).toContain('variación')
      })

      it('includes classification thresholds', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('aceptable')
        expect(prompt).toContain('marginal')
        expect(prompt).toContain('inaceptable')
        expect(prompt).toContain('10%')
        expect(prompt).toContain('30%')
      })

      it('includes recommendation guidelines based on dominant variation', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        // Should provide guidance on recommendations
        expect(prompt).toContain('recomendaciones')
        expect(prompt).toContain('dominante')
      })

      it('includes formatting guidelines for presenting results', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        // Should mention markdown formatting
        expect(prompt).toContain('negritas')
        expect(prompt).toContain('formato')
      })
    })

    // Story 5.4: Follow-up questions handling
    describe('follow-up questions handling', () => {
      it('has a dedicated section for follow-up questions', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('preguntas de seguimiento')
      })

      it('instructs to use conversation context for follow-ups', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('contexto')
        expect(prompt).toContain('mensajes anteriores')
      })

      it('instructs NOT to re-invoke tools for follow-up questions', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('no re-invoques')
        expect(prompt).toContain('nuevo archivo')
      })

      it('instructs to reference specific values from previous analysis', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('valores específicos')
      })

      it('includes guidance for metric clarification questions', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('clarificación')
        expect(prompt).toContain('ndc')
      })

      it('includes guidance for methodology explanation questions', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('por qué gauge r&r')
      })

      it('includes guidance for next steps questions', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('qué hago ahora')
        expect(prompt).toContain('próximos pasos')
      })

      it('includes guidance for handling multiple analyses', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('múltiples análisis')
        expect(prompt).toContain('análisis más reciente')
      })

      it('instructs to be educational in explanations', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('educativo')
      })
    })

    // Story 8.4: Capacidad de Proceso analysis flow
    describe('capacidad de proceso analysis flow', () => {
      it('has dedicated section for capacidad de proceso flow', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('capacidad de proceso')
      })

      it('instructs to obtain LEI/LES specification limits', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('lei')
        expect(prompt).toContain('les')
        expect(prompt).toContain('límite')
      })

      it('recognizes LEI/LES patterns in user messages', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('lei=')
      })

      it('has three-part result presentation for capacidad de proceso', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('análisis técnico')
        expect(prompt).toContain('conclusión ejecutiva')
        // The prompt uses PARTE 3: CONCLUSIÓN "TERRENAL" with quotes
        expect(prompt).toContain('"terrenal"')
      })

      it('includes normality assessment guidance', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('normalidad')
        expect(prompt).toContain('anderson-darling')
      })

      it('includes stability analysis guidance', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('estabilidad')
        expect(prompt).toContain('i-mr')
      })

      it('includes capability indices guidance', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('cp,')
        expect(prompt).toContain('cpk')
        expect(prompt).toContain('pp,')
        expect(prompt).toContain('ppk')
      })

      it('describes the 4 charts generated', () => {
        const prompt = MAIN_SYSTEM_PROMPT.toLowerCase()
        expect(prompt).toContain('histograma')
        expect(prompt).toContain('gráfico i')
        expect(prompt).toContain('gráfico mr')
        expect(prompt).toContain('normalidad')
      })
    })
  })
})
