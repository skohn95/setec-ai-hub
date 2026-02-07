import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase client
const mockStorage = {
  from: vi.fn().mockReturnThis(),
  upload: vi.fn(),
  remove: vi.fn(),
  createSignedUrl: vi.fn(),
}

const mockFrom = vi.fn().mockReturnThis()
const mockInsert = vi.fn().mockReturnThis()
const mockSelect = vi.fn().mockReturnThis()
const mockSingle = vi.fn()
const mockDelete = vi.fn().mockReturnThis()
const mockEq = vi.fn().mockReturnThis()

const mockSupabase = {
  storage: mockStorage,
  from: mockFrom,
}

vi.mock('./client', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

// Import after mocking
import {
  uploadFile,
  getFileDownloadUrl,
  downloadFile,
  deleteFilesByConversation,
  getFilesByConversation,
  getFileById,
  linkFileToMessage,
} from './files'

describe('files service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset chain mocks
    mockFrom.mockReturnThis()
    mockInsert.mockReturnThis()
    mockSelect.mockReturnThis()
    mockDelete.mockReturnThis()
    mockEq.mockReturnThis()
    mockFrom.mockImplementation(() => ({
      insert: mockInsert,
      select: mockSelect,
      delete: mockDelete,
      update: vi.fn().mockReturnThis(),
      eq: mockEq,
    }))
    mockInsert.mockImplementation(() => ({
      select: mockSelect,
    }))
    mockSelect.mockImplementation(() => ({
      single: mockSingle,
      eq: mockEq,
      order: vi.fn().mockReturnThis(),
    }))
    mockEq.mockImplementation(() => ({
      select: mockSelect,
      single: mockSingle,
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }))
  })

  describe('uploadFile', () => {
    const mockFile = new File(['test content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const userId = 'user-123'
    const conversationId = 'conv-456'

    it('should upload file to storage and create database record', async () => {
      // Mock successful storage upload
      mockStorage.upload.mockResolvedValue({ data: {}, error: null })

      // Mock successful database insert
      mockSingle.mockResolvedValue({
        data: {
          id: 'file-789',
          conversation_id: conversationId,
          storage_path: `${userId}/${conversationId}/file-789.xlsx`,
          original_name: 'test.xlsx',
          mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          size_bytes: 12,
          status: 'pending',
          created_at: new Date().toISOString(),
        },
        error: null,
      })

      const result = await uploadFile(userId, conversationId, mockFile)

      expect(result.error).toBeNull()
      expect(result.fileId).toBeTruthy()
      expect(result.storagePath).toContain(userId)
      expect(result.storagePath).toContain(conversationId)
      expect(mockStorage.from).toHaveBeenCalledWith('analysis-files')
    })

    it('should return error when storage upload fails', async () => {
      mockStorage.upload.mockResolvedValue({
        data: null,
        error: { message: 'Storage error' },
      })

      const result = await uploadFile(userId, conversationId, mockFile)

      expect(result.error).toBe('Storage error')
      expect(result.fileId).toBeNull()
      expect(result.storagePath).toBeNull()
    })

    it('should rollback storage on database error', async () => {
      // Mock successful storage upload
      mockStorage.upload.mockResolvedValue({ data: {}, error: null })
      mockStorage.remove.mockResolvedValue({ data: {}, error: null })

      // Mock database error
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await uploadFile(userId, conversationId, mockFile)

      expect(result.error).toBe('Database error')
      expect(mockStorage.remove).toHaveBeenCalled()
    })
  })

  describe('getFileDownloadUrl', () => {
    const storagePath = 'user-123/conv-456/file-789.xlsx'

    it('should return signed URL for valid storage path', async () => {
      const expectedUrl = 'https://storage.example.com/signed-url'
      mockStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: expectedUrl },
        error: null,
      })

      const result = await getFileDownloadUrl(storagePath)

      expect(result).toBe(expectedUrl)
      expect(mockStorage.from).toHaveBeenCalledWith('analysis-files')
      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(storagePath, 3600)
    })

    it('should return null when signed URL creation fails', async () => {
      mockStorage.createSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'URL generation failed' },
      })

      const result = await getFileDownloadUrl(storagePath)

      expect(result).toBeNull()
    })
  })

  describe('downloadFile', () => {
    const fileId = 'file-789'

    it('should return download URL for valid file', async () => {
      const mockFileData = {
        id: fileId,
        storage_path: 'user-123/conv-456/file-789.xlsx',
        original_name: 'test.xlsx',
      }

      mockEq.mockImplementation(() => ({
        single: vi.fn().mockResolvedValue({ data: mockFileData, error: null }),
      }))

      mockStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://example.com/download' },
        error: null,
      })

      const result = await downloadFile(fileId)

      expect(result).toBeTruthy()
    })

    it('should return null when file not found', async () => {
      mockEq.mockImplementation(() => ({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      }))

      const result = await downloadFile(fileId)

      expect(result).toBeNull()
    })
  })

  describe('deleteFilesByConversation', () => {
    const conversationId = 'conv-456'

    it('should delete files from storage and database', async () => {
      const mockFiles = [
        { storage_path: 'path/to/file1.xlsx' },
        { storage_path: 'path/to/file2.xlsx' },
      ]

      mockEq.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockFiles, error: null }),
        }),
      }))

      mockStorage.remove.mockResolvedValue({ data: {}, error: null })

      const result = await deleteFilesByConversation(conversationId)

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should handle empty file list gracefully', async () => {
      mockEq.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }))

      const result = await deleteFilesByConversation(conversationId)

      expect(result.success).toBe(true)
      expect(mockStorage.remove).not.toHaveBeenCalled()
    })

    it('should return error when storage deletion fails', async () => {
      const mockFiles = [{ storage_path: 'path/to/file.xlsx' }]

      // Reset and set up mock chain for this test
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockFiles, error: null }),
        }),
      }))

      mockStorage.remove.mockResolvedValue({
        data: null,
        error: { message: 'Storage deletion failed' },
      })

      const result = await deleteFilesByConversation(conversationId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Storage deletion failed')
    })
  })

  describe('getFilesByConversation', () => {
    const conversationId = 'conv-456'

    it('should return files for a conversation ordered by created_at', async () => {
      const mockFiles = [
        { id: 'file-1', original_name: 'file1.xlsx', created_at: '2024-01-01' },
        { id: 'file-2', original_name: 'file2.xlsx', created_at: '2024-01-02' },
      ]

      mockEq.mockImplementation(() => ({
        order: vi.fn().mockResolvedValue({ data: mockFiles, error: null }),
      }))

      const result = await getFilesByConversation(conversationId)

      expect(result.data).toEqual(mockFiles)
      expect(result.error).toBeNull()
    })

    it('should return empty array when no files exist', async () => {
      mockEq.mockImplementation(() => ({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }))

      const result = await getFilesByConversation(conversationId)

      expect(result.data).toEqual([])
      expect(result.error).toBeNull()
    })
  })

  describe('getFileById', () => {
    const fileId = 'file-789'

    it('should return file data for valid ID', async () => {
      const mockFile = {
        id: fileId,
        original_name: 'test.xlsx',
        storage_path: 'user/conv/file.xlsx',
      }

      mockEq.mockImplementation(() => ({
        single: vi.fn().mockResolvedValue({ data: mockFile, error: null }),
      }))

      const result = await getFileById(fileId)

      expect(result.data).toEqual(mockFile)
      expect(result.error).toBeNull()
    })

    it('should return error for invalid file ID', async () => {
      mockEq.mockImplementation(() => ({
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      }))

      const result = await getFileById(fileId)

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('linkFileToMessage', () => {
    const fileId = 'file-789'
    const messageId = 'msg-123'

    it('should link file to message successfully', async () => {
      const mockUpdatedFile = {
        id: fileId,
        message_id: messageId,
      }

      mockFrom.mockImplementation(() => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockUpdatedFile, error: null }),
            }),
          }),
        }),
      }))

      const result = await linkFileToMessage(fileId, messageId)

      expect(result.success).toBe(true)
      expect(result.error).toBeNull()
    })

    it('should return error when link fails', async () => {
      mockFrom.mockImplementation(() => ({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
            }),
          }),
        }),
      }))

      const result = await linkFileToMessage(fileId, messageId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })
  })
})
