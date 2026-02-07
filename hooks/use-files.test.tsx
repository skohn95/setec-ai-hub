import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useUploadFile, useFilesByConversation, useDownloadFile } from './use-files'

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock window.open for downloads
const mockWindowOpen = vi.fn()
global.window.open = mockWindowOpen

describe('use-files hooks', () => {
  let queryClient: QueryClient
  let wrapper: ({ children }: { children: ReactNode }) => ReactNode

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  })

  describe('useUploadFile', () => {
    it('should upload file successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { fileId: 'file-123', storagePath: 'user/conv/file.xlsx' },
            error: null,
          }),
      })

      const { result } = renderHook(() => useUploadFile(), { wrapper })

      const mockFile = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      result.current.mutate({
        userId: 'user-123',
        conversationId: 'conv-456',
        file: mockFile,
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual({
        fileId: 'file-123',
        storagePath: 'user/conv/file.xlsx',
      })
    })

    it('should handle upload error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            data: null,
            error: { code: 'UPLOAD_ERROR', message: 'Upload failed' },
          }),
      })

      const { result } = renderHook(() => useUploadFile(), { wrapper })

      const mockFile = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      result.current.mutate({
        userId: 'user-123',
        conversationId: 'conv-456',
        file: mockFile,
      })

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })

    it('should send correct form data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { fileId: 'file-123', storagePath: 'path' },
            error: null,
          }),
      })

      const { result } = renderHook(() => useUploadFile(), { wrapper })

      const mockFile = new File(['test'], 'test.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      result.current.mutate({
        userId: 'user-123',
        conversationId: 'conv-456',
        file: mockFile,
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/files', {
          method: 'POST',
          body: expect.any(FormData),
        })
      })
    })
  })

  describe('useFilesByConversation', () => {
    it('should fetch files for conversation', async () => {
      const mockFiles = [
        { id: 'file-1', original_name: 'file1.xlsx' },
        { id: 'file-2', original_name: 'file2.xlsx' },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockFiles, error: null }),
      })

      const { result } = renderHook(
        () => useFilesByConversation('conv-123'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      expect(result.current.data).toEqual(mockFiles)
    })

    it('should handle fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            data: null,
            error: { code: 'ERROR', message: 'Failed to fetch' },
          }),
      })

      const { result } = renderHook(
        () => useFilesByConversation('conv-123'),
        { wrapper }
      )

      await waitFor(() => {
        expect(result.current.isError).toBe(true)
      })
    })

    it('should not fetch when conversationId is empty', () => {
      const { result } = renderHook(
        () => useFilesByConversation(''),
        { wrapper }
      )

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('useDownloadFile', () => {
    it('should open download URL in new window', async () => {
      const downloadUrl = 'https://storage.example.com/file.xlsx'

      const { result } = renderHook(() => useDownloadFile(), { wrapper })

      result.current(downloadUrl)

      expect(mockWindowOpen).toHaveBeenCalledWith(downloadUrl, '_blank')
    })

    it('should handle empty URL gracefully', () => {
      const { result } = renderHook(() => useDownloadFile(), { wrapper })

      result.current('')

      expect(mockWindowOpen).not.toHaveBeenCalled()
    })
  })
})
