// API configuration constants

export const API_TIMEOUT = 30000 // 30 seconds

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const ALLOWED_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
] as const

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
