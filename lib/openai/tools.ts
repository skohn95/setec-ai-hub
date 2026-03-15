/**
 * OpenAI Tool Definitions for function calling
 *
 * Tools allow the AI agent to perform specific actions like
 * analyzing uploaded Excel files for MSA/Gauge R&R analysis,
 * Process Capability (Capacidad de Proceso) analysis,
 * 2-Sample Hypothesis Testing, and Sample Size Calculation.
 */

import type { ChatCompletionTool } from 'openai/resources/chat/completions'

/**
 * Analyze tool for performing statistical analysis
 *
 * This tool is invoked when:
 * - User has uploaded a file AND indicates MSA analysis intent
 * - User has uploaded a file AND indicates Capacidad de Proceso analysis intent
 * - User has uploaded a file AND indicates Hipótesis 2 Muestras analysis intent
 * - User requests Tamaño de Muestra calculation (no file needed)
 * - File ID must be from current conversation context (except tamano_muestra)
 */
export const ANALYZE_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'analyze',
    description:
      'Realiza análisis estadístico. Soporta MSA (Gauge R&R), Capacidad de Proceso (Cp, Cpk, Pp, Ppk), Test de Hipótesis de 2 Muestras, y Cálculo de Tamaño de Muestra. Para tamano_muestra NO se requiere file_id.',
    parameters: {
      type: 'object',
      properties: {
        analysis_type: {
          type: 'string',
          enum: ['msa', 'capacidad_proceso', 'hipotesis_2_muestras', 'tamano_muestra'],
          description: 'Tipo de análisis.',
        },
        file_id: {
          type: 'string',
          description: 'UUID del archivo. Requerido para msa, capacidad_proceso, hipotesis_2_muestras. NO enviar para tamano_muestra.',
        },
        specification: {
          type: 'number',
          description: 'Especificación o valor objetivo (target) de la pieza. Solo para MSA.',
        },
        spec_limits: {
          type: 'object',
          properties: {
            lei: { type: 'number', description: 'Límite de Especificación Inferior' },
            les: { type: 'number', description: 'Límite de Especificación Superior' },
          },
          required: ['lei', 'les'],
          description: 'Límites de especificación para Análisis de Capacidad de Proceso. Requerido para calcular Cp, Cpk, Pp, Ppk.',
        },
        confidence_level: {
          type: 'number',
          enum: [0.90, 0.95, 0.99],
          description: 'Nivel de confianza para test de hipótesis (solo hipotesis_2_muestras). Default: 0.95',
        },
        alternative_hypothesis: {
          type: 'string',
          enum: ['two-sided', 'greater', 'less'],
          description: 'Dirección de la prueba. Para hipotesis_2_muestras y tamano_muestra. Default: "two-sided"',
        },
        delta: {
          type: 'number',
          description: 'Diferencia mínima prácticamente significativa. Requerido para tamano_muestra.',
        },
        sigma: {
          type: 'number',
          description: 'Desviación estándar estimada del proceso. Requerido para tamano_muestra.',
        },
        alpha: {
          type: 'number',
          description: 'Nivel de significancia (ej: 0.05). Requerido para tamano_muestra.',
        },
        power: {
          type: 'number',
          description: 'Poder estadístico (ej: 0.80). Requerido para tamano_muestra.',
        },
        current_mean: {
          type: 'number',
          description: 'Media actual estimada. Opcional para tamano_muestra (contexto).',
        },
        expected_mean: {
          type: 'number',
          description: 'Media esperada después de mejora. Opcional para tamano_muestra (contexto).',
        },
      },
      required: ['analysis_type'],
      additionalProperties: false,
    },
  },
}

/**
 * Array of all available tools for the Main Agent
 * Supports MSA, Capacidad de Proceso, Hipótesis 2 Muestras, and Tamaño de Muestra analysis
 */
export const AVAILABLE_TOOLS: ChatCompletionTool[] = [ANALYZE_TOOL]
