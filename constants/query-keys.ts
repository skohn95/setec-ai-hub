// TanStack Query keys structure
// Following the factory pattern for type-safe query keys

export const queryKeys = {
  // Conversations
  conversations: {
    all: ['conversations'] as const,
    lists: () => [...queryKeys.conversations.all, 'list'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.conversations.lists(), filters] as const,
    details: () => [...queryKeys.conversations.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.conversations.details(), id] as const,
  },

  // Messages
  messages: {
    all: ['messages'] as const,
    lists: () => [...queryKeys.messages.all, 'list'] as const,
    list: (conversationId: string) =>
      [...queryKeys.messages.lists(), { conversationId }] as const,
    details: () => [...queryKeys.messages.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.messages.details(), id] as const,
  },

  // Files
  files: {
    all: ['files'] as const,
    lists: () => [...queryKeys.files.all, 'list'] as const,
    list: (conversationId: string) =>
      [...queryKeys.files.lists(), { conversationId }] as const,
    details: () => [...queryKeys.files.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.files.details(), id] as const,
  },

  // Analysis
  analysis: {
    all: ['analysis'] as const,
    results: () => [...queryKeys.analysis.all, 'results'] as const,
    result: (id: string) => [...queryKeys.analysis.results(), id] as const,
    byFile: (fileId: string) =>
      [...queryKeys.analysis.all, 'byFile', fileId] as const,
  },

  // User/Auth
  user: {
    all: ['user'] as const,
    current: () => [...queryKeys.user.all, 'current'] as const,
    session: () => [...queryKeys.user.all, 'session'] as const,
  },
} as const
