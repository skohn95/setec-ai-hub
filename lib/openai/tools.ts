/**
 * OpenAI Tool Definitions for function calling
 *
 * Tools allow the AI agent to perform specific actions like
 * analyzing uploaded Excel files for MSA/Gauge R&R analysis
 * and Process Capability (Capacidad de Proceso) analysis.
 */

import type { ChatCompletionTool } from 'openai/resources/chat/completions'

/**
 * Analyze tool for performing statistical analysis on uploaded Excel files
 *
 * This tool is invoked when:
 * - User has uploaded a file AND indicates MSA analysis intent
 * - User has uploaded a file AND indicates Capacidad de Proceso analysis intent
 * - User has uploaded a file AND indicates Hipótesis 2 Muestras analysis intent
 * - File ID must be from current conversation context
 */
export const ANALYZE_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'analyze',
    description:
      'Realiza análisis estadístico en archivos Excel subidos. Soporta MSA (Gauge R&R), Análisis de Capacidad de Proceso (Cp, Cpk, Pp, Ppk), y Prueba de Hipótesis de 2 Muestras. Para MSA, incluir specification (target). Para Capacidad de Proceso, incluir spec_limits (LEI/LES). Para Hipótesis 2 Muestras, opcionalmente incluir confidence_level y alternative_hypothesis.',
    parameters: {
      type: 'object',
      properties: {
        analysis_type: {
          type: 'string',
          enum: ['msa', 'capacidad_proceso', 'hipotesis_2_muestras'],
          description: 'Tipo de análisis: "msa" para Gauge R&R, "capacidad_proceso" para índices de capacidad, "hipotesis_2_muestras" para comparación de 2 muestras.',
        },
        file_id: {
          type: 'string',
          description: 'UUID del archivo subido a analizar',
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
          description: 'Nivel de confianza para prueba de hipótesis (solo hipotesis_2_muestras). Default: 0.95',
        },
        alternative_hypothesis: {
          type: 'string',
          enum: ['two-sided', 'greater', 'less'],
          description: 'Hipótesis alternativa para test de medias: "two-sided" (≠), "greater" (>), "less" (<). Solo hipotesis_2_muestras. Default: "two-sided"',
        },
      },
      required: ['analysis_type', 'file_id'],
      additionalProperties: false,
    },
  },
}

/**
 * Array of all available tools for the Main Agent
 * Supports MSA (Gauge R&R), Capacidad de Proceso (Cp, Cpk, Pp, Ppk), and Hipótesis 2 Muestras analysis
 */
export const AVAILABLE_TOOLS: ChatCompletionTool[] = [ANALYZE_TOOL]
