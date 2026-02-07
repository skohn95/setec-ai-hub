import { describe, it, expect, vi, beforeEach } from 'vitest'

// Valid UUIDs for testing (must match UUID v4 format with 89ab in position 17)
const VALID_CONVERSATION_ID = '123e4567-e89b-12d3-a456-426614174000'

// Mock the Supabase client - needs to be set up before imports
const mockSupabaseClient = {
  from: vi.fn(),
}

vi.mock('./client', () => ({
  createClient: () => mockSupabaseClient,
}))

// Import after mock setup
import { fetchMessages, createMessage, updateMessageMetadata } from './messages'

describe('fetchMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns messages in chronological order', async () => {
    const mockMessages = [
      {
        id: 'msg-1',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'user',
        content: 'First message',
        metadata: {},
        created_at: '2026-02-04T00:00:00Z',
      },
      {
        id: 'msg-2',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'assistant',
        content: 'Second message',
        metadata: {},
        created_at: '2026-02-04T00:01:00Z',
      },
    ]

    const mockOrder = vi.fn().mockResolvedValue({ data: mockMessages, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockSupabaseClient.from.mockReturnValue({ select: mockSelect })

    const result = await fetchMessages(VALID_CONVERSATION_ID)

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('messages')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('conversation_id', VALID_CONVERSATION_ID)
    expect(mockOrder).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(result.data).toEqual(mockMessages)
    expect(result.error).toBeNull()
  })

  it('returns error for invalid conversation ID format', async () => {
    const result = await fetchMessages('invalid-id')

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('Invalid conversation ID format')
    expect(mockSupabaseClient.from).not.toHaveBeenCalled()
  })

  it('returns error when conversation ID is empty', async () => {
    const result = await fetchMessages('')

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('Invalid conversation ID format')
  })

  it('handles database error correctly', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error', code: 'PGRST301' },
    })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockSupabaseClient.from.mockReturnValue({ select: mockSelect })

    const result = await fetchMessages(VALID_CONVERSATION_ID)

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('Database error')
  })

  it('returns { data, error } structure following Architecture patterns', async () => {
    const mockMessages = [
      {
        id: 'msg-1',
        conversation_id: VALID_CONVERSATION_ID,
        role: 'user',
        content: 'Test message',
        metadata: {},
        created_at: '2026-02-04T00:00:00Z',
      },
    ]

    const mockOrder = vi.fn().mockResolvedValue({ data: mockMessages, error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockSupabaseClient.from.mockReturnValue({ select: mockSelect })

    const result = await fetchMessages(VALID_CONVERSATION_ID)

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
    expect(typeof result.data).not.toBe('undefined')
    expect(result.error === null || result.error instanceof Error).toBe(true)
  })

  it('returns empty array when no messages exist', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null })
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockSupabaseClient.from.mockReturnValue({ select: mockSelect })

    const result = await fetchMessages(VALID_CONVERSATION_ID)

    expect(result.data).toEqual([])
    expect(result.error).toBeNull()
  })
})

describe('createMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a message with the correct conversation_id', async () => {
    const mockMessage = {
      id: 'msg-1',
      conversation_id: VALID_CONVERSATION_ID,
      role: 'user',
      content: 'Hello, world!',
      metadata: {},
      created_at: '2026-02-04T00:00:00Z',
    }

    const mockSingle = vi.fn().mockResolvedValue({ data: mockMessage, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    mockSupabaseClient.from.mockReturnValue({ insert: mockInsert })

    const result = await createMessage(VALID_CONVERSATION_ID, 'user', 'Hello, world!')

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('messages')
    expect(mockInsert).toHaveBeenCalledWith({
      conversation_id: VALID_CONVERSATION_ID,
      role: 'user',
      content: 'Hello, world!',
      metadata: {},
    })
    expect(result.data).toEqual(mockMessage)
    expect(result.error).toBeNull()
  })

  it('creates assistant message with role set correctly', async () => {
    const mockMessage = {
      id: 'msg-2',
      conversation_id: VALID_CONVERSATION_ID,
      role: 'assistant',
      content: 'Hello! How can I help?',
      metadata: {},
      created_at: '2026-02-04T00:00:00Z',
    }

    const mockSingle = vi.fn().mockResolvedValue({ data: mockMessage, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    mockSupabaseClient.from.mockReturnValue({ insert: mockInsert })

    const result = await createMessage(VALID_CONVERSATION_ID, 'assistant', 'Hello! How can I help?')

    expect(mockInsert).toHaveBeenCalledWith({
      conversation_id: VALID_CONVERSATION_ID,
      role: 'assistant',
      content: 'Hello! How can I help?',
      metadata: {},
    })
    expect(result.data?.role).toBe('assistant')
  })

  it('returns error for invalid conversation ID format', async () => {
    const result = await createMessage('invalid-id', 'user', 'Test message')

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('Invalid conversation ID format')
    expect(mockSupabaseClient.from).not.toHaveBeenCalled()
  })

  it('returns error when conversation ID is empty', async () => {
    const result = await createMessage('', 'user', 'Test message')

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('Invalid conversation ID format')
  })

  it('returns error when content is empty', async () => {
    const result = await createMessage(VALID_CONVERSATION_ID, 'user', '')

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('Message content cannot be empty')
  })

  it('returns error when content is whitespace only', async () => {
    const result = await createMessage(VALID_CONVERSATION_ID, 'user', '   ')

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('Message content cannot be empty')
  })

  it('handles database error correctly', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error', code: 'PGRST301' },
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    mockSupabaseClient.from.mockReturnValue({ insert: mockInsert })

    const result = await createMessage(VALID_CONVERSATION_ID, 'user', 'Test message')

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('Database error')
  })

  it('returns { data, error } structure following Architecture patterns', async () => {
    const mockMessage = {
      id: 'msg-1',
      conversation_id: VALID_CONVERSATION_ID,
      role: 'user',
      content: 'Test message',
      metadata: {},
      created_at: '2026-02-04T00:00:00Z',
    }

    const mockSingle = vi.fn().mockResolvedValue({ data: mockMessage, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    mockSupabaseClient.from.mockReturnValue({ insert: mockInsert })

    const result = await createMessage(VALID_CONVERSATION_ID, 'user', 'Test message')

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
    expect(typeof result.data).not.toBe('undefined')
    expect(result.error === null || result.error instanceof Error).toBe(true)
  })
})

// Valid message ID for testing
const VALID_MESSAGE_ID = '123e4567-e89b-12d3-a456-426614174001'

describe('updateMessageMetadata', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('merges new metadata with existing metadata', async () => {
    const existingMessage = {
      id: VALID_MESSAGE_ID,
      conversation_id: VALID_CONVERSATION_ID,
      role: 'assistant',
      content: 'Test message',
      metadata: { existingKey: 'existingValue' },
      created_at: '2026-02-04T00:00:00Z',
    }

    const updatedMessage = {
      ...existingMessage,
      metadata: { existingKey: 'existingValue', chartData: [{ type: 'test' }] },
    }

    // Mock fetch
    const mockFetchSingle = vi.fn().mockResolvedValue({ data: existingMessage, error: null })
    const mockFetchEq = vi.fn().mockReturnValue({ single: mockFetchSingle })
    const mockFetchSelect = vi.fn().mockReturnValue({ eq: mockFetchEq })

    // Mock update
    const mockUpdateSingle = vi.fn().mockResolvedValue({ data: updatedMessage, error: null })
    const mockUpdateSelect = vi.fn().mockReturnValue({ single: mockUpdateSingle })
    const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

    // First call is for select (fetch), second call is for update
    mockSupabaseClient.from
      .mockReturnValueOnce({ select: mockFetchSelect })
      .mockReturnValueOnce({ update: mockUpdate })

    const result = await updateMessageMetadata(VALID_MESSAGE_ID, { chartData: [{ type: 'test' }] })

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('messages')
    expect(mockUpdate).toHaveBeenCalledWith({
      metadata: { existingKey: 'existingValue', chartData: [{ type: 'test' }] },
    })
    expect(result.data).toEqual(updatedMessage)
    expect(result.error).toBeNull()
  })

  it('returns error for invalid message ID format', async () => {
    const result = await updateMessageMetadata('invalid-id', { chartData: [] })

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('Invalid message ID format')
    expect(mockSupabaseClient.from).not.toHaveBeenCalled()
  })

  it('returns error when message ID is empty', async () => {
    const result = await updateMessageMetadata('', { chartData: [] })

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('Invalid message ID format')
  })

  it('handles database error on fetch correctly', async () => {
    const mockFetchSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Message not found', code: 'PGRST116' },
    })
    const mockFetchEq = vi.fn().mockReturnValue({ single: mockFetchSingle })
    const mockFetchSelect = vi.fn().mockReturnValue({ eq: mockFetchEq })
    mockSupabaseClient.from.mockReturnValue({ select: mockFetchSelect })

    const result = await updateMessageMetadata(VALID_MESSAGE_ID, { chartData: [] })

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('Message not found')
  })

  it('handles database error on update correctly', async () => {
    const existingMessage = {
      id: VALID_MESSAGE_ID,
      metadata: {},
    }

    // Mock fetch success
    const mockFetchSingle = vi.fn().mockResolvedValue({ data: existingMessage, error: null })
    const mockFetchEq = vi.fn().mockReturnValue({ single: mockFetchSingle })
    const mockFetchSelect = vi.fn().mockReturnValue({ eq: mockFetchEq })

    // Mock update failure
    const mockUpdateSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Update failed', code: 'PGRST301' },
    })
    const mockUpdateSelect = vi.fn().mockReturnValue({ single: mockUpdateSingle })
    const mockUpdateEq = vi.fn().mockReturnValue({ select: mockUpdateSelect })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq })

    mockSupabaseClient.from
      .mockReturnValueOnce({ select: mockFetchSelect })
      .mockReturnValueOnce({ update: mockUpdate })

    const result = await updateMessageMetadata(VALID_MESSAGE_ID, { chartData: [] })

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('Update failed')
  })
})
