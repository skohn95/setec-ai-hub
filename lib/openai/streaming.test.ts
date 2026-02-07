import { describe, it, expect } from 'vitest'
import {
  encodeSSEMessage,
  createSSEResponse,
  type StreamChunk,
  type SSEToolCallEvent,
  type SSEToolResultEvent,
} from './streaming'

describe('streaming utilities', () => {
  describe('encodeSSEMessage', () => {
    it('encodes text chunk correctly', () => {
      const chunk: StreamChunk = { type: 'text', content: 'Hello' }
      const encoded = encodeSSEMessage(chunk)
      expect(encoded).toBe('data: {"type":"text","content":"Hello"}\n\n')
    })

    it('encodes done chunk correctly', () => {
      const chunk: StreamChunk = { type: 'done' }
      const encoded = encodeSSEMessage(chunk)
      expect(encoded).toBe('data: {"type":"done"}\n\n')
    })

    it('encodes error chunk correctly', () => {
      const chunk: StreamChunk = { type: 'error', content: 'Something went wrong' }
      const encoded = encodeSSEMessage(chunk)
      expect(encoded).toBe('data: {"type":"error","content":"Something went wrong"}\n\n')
    })

    it('handles special characters in content', () => {
      const chunk: StreamChunk = { type: 'text', content: '¡Hola! ¿Cómo estás?' }
      const encoded = encodeSSEMessage(chunk)
      expect(encoded).toContain('"content":"¡Hola! ¿Cómo estás?"')
    })

    it('handles newlines in content by escaping them', () => {
      const chunk: StreamChunk = { type: 'text', content: 'Line 1\nLine 2' }
      const encoded = encodeSSEMessage(chunk)
      // JSON.stringify escapes newlines
      expect(encoded).toContain('\\n')
    })
  })

  describe('createSSEResponse', () => {
    it('returns a Response object', async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })
      const response = createSSEResponse(stream)
      expect(response).toBeInstanceOf(Response)
    })

    it('sets correct Content-Type header', async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })
      const response = createSSEResponse(stream)
      expect(response.headers.get('Content-Type')).toBe('text/event-stream')
    })

    it('sets Cache-Control header to no-cache', async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })
      const response = createSSEResponse(stream)
      expect(response.headers.get('Cache-Control')).toBe('no-cache')
    })

    it('sets Connection header to keep-alive', async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.close()
        },
      })
      const response = createSSEResponse(stream)
      expect(response.headers.get('Connection')).toBe('keep-alive')
    })
  })

  // Story 4.4: Tool event types tests
  describe('tool event types', () => {
    describe('SSEToolCallEvent', () => {
      it('encodes tool_call processing event correctly', () => {
        const event: SSEToolCallEvent = {
          type: 'tool_call',
          name: 'analyze',
          status: 'processing',
        }
        const encoded = encodeSSEMessage(event)
        expect(encoded).toContain('"type":"tool_call"')
        expect(encoded).toContain('"name":"analyze"')
        expect(encoded).toContain('"status":"processing"')
      })

      it('encodes tool_call complete event correctly', () => {
        const event: SSEToolCallEvent = {
          type: 'tool_call',
          name: 'analyze',
          status: 'complete',
        }
        const encoded = encodeSSEMessage(event)
        expect(encoded).toContain('"status":"complete"')
      })

      it('encodes tool_call error event correctly', () => {
        const event: SSEToolCallEvent = {
          type: 'tool_call',
          name: 'analyze',
          status: 'error',
        }
        const encoded = encodeSSEMessage(event)
        expect(encoded).toContain('"status":"error"')
      })
    })

    describe('SSEToolResultEvent', () => {
      it('encodes tool_result success event correctly', () => {
        const event: SSEToolResultEvent = {
          type: 'tool_result',
          data: {
            results: { grr: 15.5, ndc: 8 },
            chartData: [{ type: 'variationBreakdown', data: [] }],
            instructions: 'Present results...',
          },
        }
        const encoded = encodeSSEMessage(event)
        expect(encoded).toContain('"type":"tool_result"')
        expect(encoded).toContain('"data"')
        expect(encoded).toContain('"results"')
        expect(encoded).toContain('"chartData"')
        expect(encoded).toContain('"instructions"')
      })

      it('encodes tool_result error event correctly', () => {
        const event: SSEToolResultEvent = {
          type: 'tool_result',
          data: null,
          error: {
            code: 'FILE_VALIDATION_ERROR',
            message: 'El archivo no tiene el formato correcto',
            details: [{ row: 1, column: 'A', message: 'Valor inválido' }],
          },
        }
        const encoded = encodeSSEMessage(event)
        expect(encoded).toContain('"type":"tool_result"')
        expect(encoded).toContain('"data":null')
        expect(encoded).toContain('"error"')
        expect(encoded).toContain('"code":"FILE_VALIDATION_ERROR"')
      })
    })
  })
})
