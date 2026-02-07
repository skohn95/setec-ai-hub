// API configuration constants

export const API_TIMEOUT = 30000 // 30 seconds

// File constants are now in constants/files.ts
// Use ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES from '@/constants/files'

export const API_ROUTES = {
  ANALYZE: '/api/analyze',
  CONVERSATIONS: '/api/conversations',
  MESSAGES: '/api/messages',
  FILES: '/api/files',
  AUTH: '/api/auth',
} as const

export const OPENAI_CONFIG = {
  MODEL: 'gpt-4-turbo-preview',
  MAX_TOKENS: 4096,
  TEMPERATURE: 0.7,
} as const
