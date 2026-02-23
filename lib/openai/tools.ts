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
 * - File ID must be from current conversation context
 */
export const ANALYZE_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'analyze',
    description:
      'Realiza análisis estadístico en archivos Excel subidos. Soporta MSA (Gauge R&R) y Control Estadístico de Proceso (Cp, Cpk, Pp, Ppk). Para MSA, incluir specification (target). Para Control Estadístico de Proceso, incluir spec_limits (LEI/LES).',
    parameters: {
      type: 'object',
      properties: {
        analysis_type: {
          type: 'string',
          enum: ['msa', 'capacidad_proceso'],
          description: 'Tipo de análisis: "msa" para Gauge R&R, "capacidad_proceso" para índices de capacidad.',
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
          description: 'Límites de especificación para Control Estadístico de Proceso. Requerido para calcular Cp, Cpk, Pp, Ppk.',
        },
      },
      required: ['analysis_type', 'file_id'],
      additionalProperties: false,
    },
  },
}

/**
 * Array of all available tools for the Main Agent
 * Supports MSA (Gauge R&R) and Capacidad de Proceso (Cp, Cpk, Pp, Ppk) analysis
 */
export const AVAILABLE_TOOLS: ChatCompletionTool[] = [ANALYZE_TOOL]
