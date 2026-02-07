/**
 * SSE (Server-Sent Events) streaming utilities for OpenAI responses
 */

import type {
  StreamChunk,
  SSEEvent,
  SSEToolCallEvent,
  SSEToolResultEvent,
} from '@/types/api'

// Re-export for convenience
export type { StreamChunk, SSEEvent, SSEToolCallEvent, SSEToolResultEvent }

/**
 * Encode an SSE event as a message
 * Format: data: {json}\n\n
 * Accepts StreamChunk, SSEToolCallEvent, or SSEToolResultEvent
 */
export function encodeSSEMessage(event: SSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`
}

/**
 * Create an SSE Response with proper headers
 * @param stream - ReadableStream containing encoded SSE messages
 * @returns Response configured for SSE
 */
export function createSSEResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
