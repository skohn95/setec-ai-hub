import { describe, it, expect, vi, beforeEach } from 'vitest'
import { filterMessage } from './filter-agent'

// Mock the OpenAI client
const mockCreate = vi.fn()
vi.mock('./client', () => ({
  getOpenAIClient: vi.fn(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  })),
}))

describe('filterMessage', () => {
  beforeEach(() => {
    mockCreate.mockReset()
  })

  describe('allowed messages', () => {
    it('allows greetings like "Hola"', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{"allowed": true}' } }],
      })

      const result = await filterMessage('Hola')

      expect(result.allowed).toBe(true)
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-5-nano',
        })
      )
    })

    it('allows MSA queries', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{"allowed": true}' } }],
      })

      const result = await filterMessage('Quiero analizar MSA')

      expect(result.allowed).toBe(true)
    })

    it('allows statistics questions', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{"allowed": true}' } }],
      })

      const result = await filterMessage('¿Qué es Gauge R&R?')

      expect(result.allowed).toBe(true)
    })
  })

  describe('rejected messages', () => {
    it('rejects cooking requests', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{"allowed": false}' } }],
      })

      const result = await filterMessage('Dame una receta de cocina')

      expect(result.allowed).toBe(false)
    })

    it('rejects unrelated coding help', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{"allowed": false}' } }],
      })

      const result = await filterMessage('Ayúdame con mi código JavaScript')

      expect(result.allowed).toBe(false)
    })
  })

  describe('error handling', () => {
    it('throws FilterError when OpenAI API fails', async () => {
      mockCreate.mockRejectedValueOnce(new Error('API Error'))

      await expect(filterMessage('test')).rejects.toThrow('El servicio de IA no está disponible')
    })

    it('throws FilterError with rate limit message on 429 status', async () => {
      const rateLimitError = new Error('Rate limited')
      ;(rateLimitError as Error & { status: number }).status = 429
      mockCreate.mockRejectedValueOnce(rateLimitError)

      await expect(filterMessage('test')).rejects.toThrow('Demasiadas solicitudes')
    })

    it('throws FilterError with timeout message on timeout error', async () => {
      const timeoutError = new Error('Timeout')
      ;(timeoutError as Error & { code: string }).code = 'ETIMEDOUT'
      mockCreate.mockRejectedValueOnce(timeoutError)

      await expect(filterMessage('test')).rejects.toThrow('tardó demasiado')
    })

    it('throws error when response is invalid JSON', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: 'invalid json' } }],
      })

      await expect(filterMessage('test')).rejects.toThrow()
    })
  })

  describe('API call structure', () => {
    it('uses structured output with json_schema', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{"allowed": true}' } }],
      })

      await filterMessage('test message')

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-5-nano',
          response_format: expect.objectContaining({
            type: 'json_schema',
          }),
        })
      )
    })

    it('includes system prompt and user message', async () => {
      mockCreate.mockResolvedValueOnce({
        choices: [{ message: { content: '{"allowed": true}' } }],
      })

      await filterMessage('my message')

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: 'my message' }),
          ]),
        })
      )
    })
  })
})
