import OpenAI from 'openai'

// Singleton instance
let openaiClient: OpenAI | null = null

/**
 * Get the OpenAI client singleton instance
 * Throws error if OPENAI_API_KEY is not set
 */
export function getOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 30000, // 30 second timeout
      maxRetries: 2,
    })
  }

  return openaiClient
}

/**
 * Reset the singleton client instance
 * Used for testing to ensure clean state between tests
 */
export function resetOpenAIClient(): void {
  openaiClient = null
}
