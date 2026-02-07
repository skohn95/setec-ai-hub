/**
 * OpenAI Tool Definitions for function calling
 *
 * Tools allow the AI agent to perform specific actions like
 * analyzing uploaded Excel files for MSA/Gauge R&R analysis.
 */

import type { ChatCompletionTool } from 'openai/resources/chat/completions'

/**
 * Analyze tool for performing statistical analysis on uploaded Excel files
 *
 * This tool is invoked when:
 * - User has uploaded a file AND indicates MSA analysis intent
 * - File ID must be from current conversation context
 */
export const ANALYZE_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'analyze',
    description:
      'Realiza análisis estadístico MSA (Gauge R&R) en archivos Excel subidos. Solo invocar cuando el usuario ha subido un archivo y desea analizarlo.',
    parameters: {
      type: 'object',
      properties: {
        analysis_type: {
          type: 'string',
          enum: ['msa'],
          description: 'Tipo de análisis. Actualmente solo MSA está soportado.',
        },
        file_id: {
          type: 'string',
          description: 'UUID del archivo subido a analizar',
        },
      },
      required: ['analysis_type', 'file_id'],
      additionalProperties: false,
    },
  },
}

/**
 * Array of all available tools for the Main Agent
 * MVP: Only MSA analysis tool is available
 */
export const AVAILABLE_TOOLS: ChatCompletionTool[] = [ANALYZE_TOOL]
