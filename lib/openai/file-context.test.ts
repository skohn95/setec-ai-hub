/**
 * Tests for file context detection utilities
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildFileContext, type FileContext } from './file-context'
import type { FileRow } from '@/lib/supabase/files'

// Mock the Supabase files module
vi.mock('@/lib/supabase/files', () => ({
  getFilesByConversation: vi.fn(),
}))

import { getFilesByConversation } from '@/lib/supabase/files'

const mockGetFilesByConversation = vi.mocked(getFilesByConversation)

describe('buildFileContext', () => {
  beforeEach(() => {
    mockGetFilesByConversation.mockReset()
  })

  it('returns empty context when no files exist', async () => {
    mockGetFilesByConversation.mockResolvedValueOnce({
      data: [],
      error: null,
    })

    const context = await buildFileContext('conv-123')

    expect(context.files).toEqual([])
    expect(context.contextString).toBe('')
    expect(context.hasMultipleFiles).toBe(false)
  })

  it('returns context with pending files', async () => {
    const mockFiles: FileRow[] = [
      {
        id: 'file-1',
        conversation_id: 'conv-123',
        message_id: null,
        storage_path: 'path/to/file1.xlsx',
        original_name: 'datos_msa.xlsx',
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size_bytes: 1024,
        status: 'pending',
        validation_errors: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]

    mockGetFilesByConversation.mockResolvedValueOnce({
      data: mockFiles,
      error: null,
    })

    const context = await buildFileContext('conv-123')

    expect(context.files).toHaveLength(1)
    expect(context.files[0].id).toBe('file-1')
    expect(context.files[0].name).toBe('datos_msa.xlsx')
    expect(context.files[0].status).toBe('pending')
    expect(context.contextString).toContain('ARCHIVOS DISPONIBLES')
    expect(context.contextString).toContain('file-1')
    expect(context.contextString).toContain('datos_msa.xlsx')
  })

  it('filters out processed files', async () => {
    const mockFiles: FileRow[] = [
      {
        id: 'file-1',
        conversation_id: 'conv-123',
        message_id: null,
        storage_path: 'path/to/file1.xlsx',
        original_name: 'processed.xlsx',
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size_bytes: 1024,
        status: 'processed',
        validation_errors: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'file-2',
        conversation_id: 'conv-123',
        message_id: null,
        storage_path: 'path/to/file2.xlsx',
        original_name: 'pending.xlsx',
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size_bytes: 1024,
        status: 'pending',
        validation_errors: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]

    mockGetFilesByConversation.mockResolvedValueOnce({
      data: mockFiles,
      error: null,
    })

    const context = await buildFileContext('conv-123')

    expect(context.files).toHaveLength(1)
    expect(context.files[0].name).toBe('pending.xlsx')
  })

  it('includes valid files (not yet processed)', async () => {
    const mockFiles: FileRow[] = [
      {
        id: 'file-1',
        conversation_id: 'conv-123',
        message_id: null,
        storage_path: 'path/to/file1.xlsx',
        original_name: 'valid_file.xlsx',
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size_bytes: 1024,
        status: 'valid',
        validation_errors: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]

    mockGetFilesByConversation.mockResolvedValueOnce({
      data: mockFiles,
      error: null,
    })

    const context = await buildFileContext('conv-123')

    expect(context.files).toHaveLength(1)
    expect(context.files[0].status).toBe('valid')
  })

  it('sets hasMultipleFiles flag when multiple available', async () => {
    const mockFiles: FileRow[] = [
      {
        id: 'file-1',
        conversation_id: 'conv-123',
        message_id: null,
        storage_path: 'path/to/file1.xlsx',
        original_name: 'file1.xlsx',
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size_bytes: 1024,
        status: 'pending',
        validation_errors: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'file-2',
        conversation_id: 'conv-123',
        message_id: null,
        storage_path: 'path/to/file2.xlsx',
        original_name: 'file2.xlsx',
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size_bytes: 1024,
        status: 'valid',
        validation_errors: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]

    mockGetFilesByConversation.mockResolvedValueOnce({
      data: mockFiles,
      error: null,
    })

    const context = await buildFileContext('conv-123')

    expect(context.hasMultipleFiles).toBe(true)
    expect(context.files).toHaveLength(2)
  })

  it('handles database error gracefully', async () => {
    mockGetFilesByConversation.mockResolvedValueOnce({
      data: null,
      error: new Error('Database error'),
    })

    const context = await buildFileContext('conv-123')

    expect(context.files).toEqual([])
    expect(context.contextString).toBe('')
  })

  it('formats context string correctly for multiple files', async () => {
    const mockFiles: FileRow[] = [
      {
        id: 'file-1',
        conversation_id: 'conv-123',
        message_id: null,
        storage_path: 'path/to/file1.xlsx',
        original_name: 'archivo_1.xlsx',
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size_bytes: 1024,
        status: 'pending',
        validation_errors: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'file-2',
        conversation_id: 'conv-123',
        message_id: null,
        storage_path: 'path/to/file2.xlsx',
        original_name: 'archivo_2.xlsx',
        mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size_bytes: 1024,
        status: 'pending',
        validation_errors: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]

    mockGetFilesByConversation.mockResolvedValueOnce({
      data: mockFiles,
      error: null,
    })

    const context = await buildFileContext('conv-123')

    // Should contain both file IDs and names
    expect(context.contextString).toContain('file-1')
    expect(context.contextString).toContain('archivo_1.xlsx')
    expect(context.contextString).toContain('file-2')
    expect(context.contextString).toContain('archivo_2.xlsx')
  })
})
