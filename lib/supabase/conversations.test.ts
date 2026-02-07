import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createConversation, updateConversationTimestamp } from './conversations'

// Valid UUID for testing (4th segment must start with 8, 9, a, or b per UUID v4 spec)
const VALID_USER_ID = '123e4567-e89b-12d3-a456-426614174000'
const VALID_CONV_ID = '987fcdeb-51a2-3bc4-a567-890123456789'

// Mock the Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
}

vi.mock('./client', () => ({
  createClient: () => mockSupabaseClient,
}))

describe('createConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates a conversation with the correct user_id', async () => {
    const mockConversation = {
      id: VALID_CONV_ID,
      user_id: VALID_USER_ID,
      title: 'Nueva conversacion',
      created_at: '2026-02-04T00:00:00Z',
      updated_at: '2026-02-04T00:00:00Z',
    }

    const mockSingle = vi.fn().mockResolvedValue({ data: mockConversation, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    mockSupabaseClient.from.mockReturnValue({ insert: mockInsert })

    const result = await createConversation(VALID_USER_ID)

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('conversations')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: VALID_USER_ID })
    )
    expect(result.data).toEqual(mockConversation)
    expect(result.error).toBeNull()
  })

  it('sets default title with timestamp when no title provided', async () => {
    const mockConversation = {
      id: VALID_CONV_ID,
      user_id: VALID_USER_ID,
      title: 'Nueva conversacion - 04/02/2026 12:00',
      created_at: '2026-02-04T00:00:00Z',
      updated_at: '2026-02-04T00:00:00Z',
    }

    const mockSingle = vi.fn().mockResolvedValue({ data: mockConversation, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    mockSupabaseClient.from.mockReturnValue({ insert: mockInsert })

    await createConversation(VALID_USER_ID)

    // Verify the title starts with "Nueva conversacion - " and contains a date pattern
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: VALID_USER_ID,
        title: expect.stringMatching(/^Nueva conversacion - \d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/),
      })
    )
  })

  it('uses provided title when specified', async () => {
    const mockConversation = {
      id: VALID_CONV_ID,
      user_id: VALID_USER_ID,
      title: 'Custom Title',
      created_at: '2026-02-04T00:00:00Z',
      updated_at: '2026-02-04T00:00:00Z',
    }

    const mockSingle = vi.fn().mockResolvedValue({ data: mockConversation, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    mockSupabaseClient.from.mockReturnValue({ insert: mockInsert })

    const result = await createConversation(VALID_USER_ID, 'Custom Title')

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Custom Title' })
    )
    expect(result.data?.title).toBe('Custom Title')
  })

  it('returns error for invalid user ID format', async () => {
    const result = await createConversation('invalid-id')

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('Invalid user ID format')
    expect(mockSupabaseClient.from).not.toHaveBeenCalled()
  })

  it('returns error when user ID is empty', async () => {
    const result = await createConversation('')

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('Invalid user ID format')
  })

  it('handles database error correctly', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error', code: 'PGRST301' },
    })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    mockSupabaseClient.from.mockReturnValue({ insert: mockInsert })

    const result = await createConversation('123e4567-e89b-12d3-a456-426614174000')

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('Database error')
  })

  it('returns { data, error } structure following Architecture patterns', async () => {
    const mockConversation = {
      id: VALID_CONV_ID,
      user_id: VALID_USER_ID,
      title: 'Nueva conversacion - 04/02/2026 12:00',
      created_at: '2026-02-04T00:00:00Z',
      updated_at: '2026-02-04T00:00:00Z',
    }

    const mockSingle = vi.fn().mockResolvedValue({ data: mockConversation, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })
    mockSupabaseClient.from.mockReturnValue({ insert: mockInsert })

    const result = await createConversation(VALID_USER_ID)

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error')
    expect(typeof result.data).not.toBe('undefined')
    expect(result.error === null || result.error instanceof Error).toBe(true)
  })
})

describe('updateConversationTimestamp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates the updated_at timestamp of a conversation', async () => {
    const mockEq = vi.fn().mockResolvedValue({ data: null, error: null })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    mockSupabaseClient.from.mockReturnValue({ update: mockUpdate })

    const result = await updateConversationTimestamp(VALID_CONV_ID)

    expect(mockSupabaseClient.from).toHaveBeenCalledWith('conversations')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ updated_at: expect.any(String) })
    )
    expect(mockEq).toHaveBeenCalledWith('id', VALID_CONV_ID)
    expect(result.success).toBe(true)
    expect(result.error).toBeNull()
  })

  it('returns error for invalid conversation ID format', async () => {
    const result = await updateConversationTimestamp('invalid-id')

    expect(result.success).toBe(false)
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('Invalid conversation ID format')
    expect(mockSupabaseClient.from).not.toHaveBeenCalled()
  })

  it('returns error when conversation ID is empty', async () => {
    const result = await updateConversationTimestamp('')

    expect(result.success).toBe(false)
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('Invalid conversation ID format')
  })

  it('handles database error correctly', async () => {
    const mockEq = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error', code: 'PGRST301' },
    })
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq })
    mockSupabaseClient.from.mockReturnValue({ update: mockUpdate })

    const result = await updateConversationTimestamp(VALID_CONV_ID)

    expect(result.success).toBe(false)
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toBe('Database error')
  })
})
