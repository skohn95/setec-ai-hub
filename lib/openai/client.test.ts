import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Create a mock class for OpenAI
const mockOpenAI = vi.fn()
mockOpenAI.mockImplementation(function (this: Record<string, unknown>) {
  this.chat = {
    completions: {
      create: vi.fn(),
    },
  }
})

// Mock the OpenAI module
vi.mock('openai', () => ({
  default: mockOpenAI,
}))

describe('OpenAI Client', () => {
  const originalEnv = process.env

  beforeEach(async () => {
    vi.resetModules()
    mockOpenAI.mockClear()
    process.env = { ...originalEnv }
    // Reset the singleton between tests
    const { resetOpenAIClient } = await import('./client')
    resetOpenAIClient()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('getOpenAIClient', () => {
    it('creates OpenAI client when API key is present', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-key'
      const { getOpenAIClient } = await import('./client')

      const client = getOpenAIClient()

      expect(client).toBeDefined()
      expect(client.chat).toBeDefined()
      expect(client.chat.completions).toBeDefined()
      expect(mockOpenAI).toHaveBeenCalledWith({
        apiKey: 'sk-test-key',
        timeout: 30000,
        maxRetries: 2,
      })
    })

    it('throws error when API key is missing', async () => {
      delete process.env.OPENAI_API_KEY
      const { getOpenAIClient } = await import('./client')

      expect(() => getOpenAIClient()).toThrow('OPENAI_API_KEY environment variable is not set')
    })

    it('returns singleton instance on subsequent calls', async () => {
      process.env.OPENAI_API_KEY = 'sk-test-key'
      const { getOpenAIClient } = await import('./client')

      const client1 = getOpenAIClient()
      const client2 = getOpenAIClient()

      expect(client1).toBe(client2)
      // OpenAI constructor should only be called once
      expect(mockOpenAI).toHaveBeenCalledTimes(1)
    })
  })
})
