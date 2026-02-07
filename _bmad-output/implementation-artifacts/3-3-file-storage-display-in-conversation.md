# Story 3.3: File Storage & Display in Conversation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **my uploaded files to be stored and visible in the conversation**,
So that **I can reference and re-download them later**.

**FRs covered:** FR16

## Acceptance Criteria

1. **Given** a user sends a message with an attached file, **When** the message is submitted, **Then** the file is uploaded to Supabase Storage in the path `{user_id}/{conversation_id}/{file_id}.xlsx`, **And** a record is created in the files table with storage_path, original_name, mime_type, size_bytes, **And** the file record is linked to the conversation_id and message_id, **And** the file status is set to 'pending'

2. **Given** a file has been uploaded successfully, **When** the message displays in the chat, **Then** the file appears as an attachment card showing the file name and size, **And** the card has a download button to re-download the file, **And** clicking download fetches the file from Supabase Storage

3. **Given** a user views a previous conversation with file attachments, **When** the messages load, **Then** all file attachments are visible with their original names, **And** files can be downloaded even in old conversations, **And** file cards show upload timestamp

4. **Given** file upload fails, **When** the error is detected, **Then** the user sees an error message: "No se pudo subir el archivo. Intenta de nuevo.", **And** the message is not sent, **And** the file attachment is preserved for retry

5. **Given** a conversation is deleted, **When** the deletion cascades, **Then** all associated files are deleted from Supabase Storage, **And** all file records are deleted from the files table

## Tasks / Subtasks

- [x] **Task 1: Create File Upload Service** (AC: #1, #4)
  - [x] Create `lib/supabase/files.ts`
  - [x] Function `uploadFile(userId: string, conversationId: string, file: File): Promise<FileUploadResult>`
  - [x] Generate unique file_id using `crypto.randomUUID()`
  - [x] Upload to Supabase Storage at path `{user_id}/{conversation_id}/{file_id}.xlsx`
  - [x] Create record in files table with all required fields
  - [x] Return `{ fileId, storagePath, error }` result
  - [x] Handle upload errors with appropriate error messages

- [x] **Task 2: Create File Download Service** (AC: #2, #3)
  - [x] Add to `lib/supabase/files.ts`
  - [x] Function `downloadFile(fileId: string): Promise<Blob | null>`
  - [x] Function `getFileDownloadUrl(storagePath: string): Promise<string>`
  - [x] Use Supabase Storage `createSignedUrl()` for secure download URLs
  - [x] Handle download errors gracefully

- [x] **Task 3: Create Files API Route** (AC: #1, #2)
  - [x] Create `app/api/files/route.ts` for POST (upload)
  - [x] Validate user authentication
  - [x] Accept multipart/form-data with file and metadata
  - [x] Call file upload service
  - [x] Return `{ data: { fileId, storagePath }, error: null }` on success
  - [x] Return appropriate error responses

- [x] **Task 4: Create File Download API Route** (AC: #2, #3)
  - [x] Create `app/api/files/[id]/route.ts` for GET (download)
  - [x] Validate user authentication
  - [x] Verify user owns the file via conversation ownership
  - [x] Generate signed URL and redirect or return blob
  - [x] Handle file not found with 404

- [x] **Task 5: Create FileAttachmentCard Component** (AC: #2, #3)
  - [x] Create `components/chat/FileAttachmentCard.tsx`
  - [x] Props: `file: MessageFile`, `onDownload: (fileId: string) => void`
  - [x] Display: FileSpreadsheet icon, file name, file size, upload timestamp
  - [x] Download button with Download icon from lucide-react
  - [x] Loading state while downloading
  - [x] Styled as card matching chat message style

- [x] **Task 6: Update ChatMessage Component** (AC: #2, #3)
  - [x] Update `components/chat/ChatMessage.tsx`
  - [x] Check for file attachments in message metadata
  - [x] Render FileAttachmentCard for each attached file
  - [x] Position file cards above message content

- [x] **Task 7: Create useFiles Hook** (AC: #1, #2, #3)
  - [x] Create `hooks/use-files.ts`
  - [x] `useUploadFile()` mutation hook
  - [x] `useDownloadFile()` function
  - [x] `useFilesByConversation(conversationId)` query hook
  - [x] Integrate with TanStack Query
  - [x] Handle loading and error states

- [x] **Task 8: Update useChat Hook for File Upload** (AC: #1, #4)
  - [x] Update `hooks/use-chat.ts` or create integration
  - [x] When message has file, upload file first
  - [x] On file upload success, send message with file reference
  - [x] On file upload failure, preserve file and show error
  - [x] Clear file after successful send

- [x] **Task 9: Update Messages Service** (AC: #1, #3)
  - [x] Update `lib/supabase/messages.ts`
  - [x] Include file data when creating message with attachment
  - [x] Update `getMessages()` to include related file records
  - [x] Add `metadata.fileId` to message when file is attached

- [x] **Task 10: Create File Deletion Service** (AC: #5)
  - [x] Add to `lib/supabase/files.ts`
  - [x] Function `deleteFilesByConversation(conversationId: string): Promise<void>`
  - [x] Delete files from Supabase Storage
  - [x] Note: DB records cascade deleted via RLS/FK constraints

- [x] **Task 11: Update Conversation Deletion** (AC: #5)
  - [x] Update `hooks/use-conversations.ts` `useDeleteConversation`
  - [x] Call file deletion service before deleting conversation
  - [x] Ensure storage files are cleaned up
  - [x] Handle partial failure gracefully

- [x] **Task 12: Add Types** (AC: all)
  - [x] Update `types/chat.ts` or create `types/files.ts`
  - [x] `MessageFile` interface: `{ id, conversation_id, message_id, storage_path, original_name, mime_type, size_bytes, status, created_at }`
  - [x] `FileUploadResult` interface: `{ fileId, storagePath, error? }`
  - [x] Update `Message` type to include optional `files: MessageFile[]`

- [x] **Task 13: Add Query Keys** (AC: #3)
  - [x] Update `constants/query-keys.ts`
  - [x] Add `files.byConversation(conversationId)` query key
  - [x] Add `files.detail(fileId)` query key

- [x] **Task 14: Add API Constants** (AC: #4)
  - [x] Update `constants/api.ts` or `constants/messages.ts`
  - [x] `FILE_UPLOAD_ERROR: 'No se pudo subir el archivo. Intenta de nuevo.'`
  - [x] `FILE_DOWNLOAD_ERROR: 'No se pudo descargar el archivo.'`
  - [x] `FILE_NOT_FOUND: 'El archivo no existe.'`

- [x] **Task 15: Write Unit Tests** (AC: all)
  - [x] Create `lib/supabase/files.test.ts`
    - [x] Test uploadFile success path
    - [x] Test uploadFile error handling
    - [x] Test downloadFile success
    - [x] Test getFileDownloadUrl
    - [x] Test deleteFilesByConversation
  - [x] Create `components/chat/FileAttachmentCard.test.tsx`
    - [x] Test renders file name and size
    - [x] Test formats size correctly (KB/MB)
    - [x] Test download button calls onDownload
    - [x] Test loading state while downloading
    - [x] Test renders upload timestamp
  - [x] Create `hooks/use-files.test.tsx`
    - [x] Test useUploadFile mutation
    - [x] Test useFilesByConversation query
    - [x] Test error handling
  - [x] Update `components/chat/ChatMessage.test.tsx`
    - [x] Test renders file attachment when present
    - [x] Test handles message without files
  - [x] Update `hooks/use-conversations.test.tsx`
    - [x] Test file cleanup on conversation delete

- [x] **Task 16: Update Barrel Exports** (AC: all)
  - [x] Update `components/chat/index.ts` with FileAttachmentCard
  - [x] Update `hooks/index.ts` with use-files exports
  - [x] Update `lib/supabase/index.ts` with files exports

## Dev Notes

### Critical Architecture Patterns

**From Architecture Document:**

**Database Schema (files table):**
```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,           -- {user_id}/{conversation_id}/{file_id}.xlsx
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'validating', 'valid', 'invalid', 'processed')),
  validation_errors JSONB,
  validated_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Storage Configuration:**
- Bucket: `analysis-files` (private)
- Max file size: 10MB (10485760 bytes)
- Allowed MIME types: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/vnd.ms-excel`
- Path pattern: `{user_id}/{conversation_id}/{file_id}.xlsx`

**RLS Policies:**
- Users can only access files linked to their own conversations
- Storage policies enforce user folder access: `auth.uid()::text = (storage.foldername(name))[1]`

**API Response Format:**
```typescript
interface ApiResponse<T> {
  data: T | null;
  error: { code: string; message: string } | null;
}
```

### File Upload Flow

```
User selects file (Story 3.2)
        │
        ▼
ChatInput.onSubmit(message, file)
        │
        ▼
┌───────────────────────────────┐
│  1. Upload file to Storage    │
│     POST /api/files           │
│     → Supabase Storage        │
│     → Create files record     │
└───────────────┬───────────────┘
                │ returns fileId
                ▼
┌───────────────────────────────┐
│  2. Send message with file    │
│     POST /api/chat            │
│     message.metadata.fileId   │
│     → Create message record   │
│     → Link file to message    │
└───────────────────────────────┘
```

### File Download Flow

```
User clicks download on FileAttachmentCard
        │
        ▼
┌───────────────────────────────┐
│  GET /api/files/[id]          │
│  1. Verify auth + ownership   │
│  2. Get signed URL from       │
│     Supabase Storage          │
│  3. Redirect to signed URL    │
└───────────────────────────────┘
```

### Supabase Storage Integration

```typescript
// lib/supabase/files.ts
import { createClient } from './server';

export async function uploadFile(
  userId: string,
  conversationId: string,
  file: File
): Promise<FileUploadResult> {
  const supabase = await createClient();
  const fileId = crypto.randomUUID();
  const storagePath = `${userId}/${conversationId}/${fileId}.xlsx`;

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('analysis-files')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    return { fileId: null, storagePath: null, error: uploadError.message };
  }

  // Create database record
  const { error: dbError } = await supabase.from('files').insert({
    id: fileId,
    conversation_id: conversationId,
    storage_path: storagePath,
    original_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    status: 'pending',
  });

  if (dbError) {
    // Rollback storage upload
    await supabase.storage.from('analysis-files').remove([storagePath]);
    console.error('Database insert error:', dbError);
    return { fileId: null, storagePath: null, error: dbError.message };
  }

  return { fileId, storagePath, error: null };
}

export async function getFileDownloadUrl(storagePath: string): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from('analysis-files')
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  if (error) {
    console.error('Signed URL error:', error);
    return null;
  }

  return data.signedUrl;
}
```

### FileAttachmentCard Component Design

```typescript
// components/chat/FileAttachmentCard.tsx
interface FileAttachmentCardProps {
  file: MessageFile;
  onDownload: (fileId: string) => void;
  isDownloading?: boolean;
}

// Visual design:
// ┌─────────────────────────────────────────────────────┐
// │ 📊 plantilla-msa.xlsx                               │
// │ 245 KB · Subido hace 2h                     [⬇️]   │
// └─────────────────────────────────────────────────────┘
```

**Styling (Setec Brand Colors):**
- Card background: subtle gray (bg-muted)
- File icon: green for Excel (FileSpreadsheet)
- Download button: charcoal, hover:orange
- Border: subtle border matching chat bubbles

### Message with File Reference

```typescript
// When creating message with file
const message = {
  conversation_id: conversationId,
  role: 'user',
  content: messageText,
  metadata: {
    fileId: uploadedFileId, // Reference to files.id
  },
};

// When fetching messages, join with files
const { data: messages } = await supabase
  .from('messages')
  .select(`
    *,
    files!files_message_id_fkey(*)
  `)
  .eq('conversation_id', conversationId)
  .order('created_at', { ascending: true });
```

### Conversation Deletion with File Cleanup

```typescript
// hooks/use-conversations.ts
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      // 1. Get all files for this conversation
      const { data: files } = await supabase
        .from('files')
        .select('storage_path')
        .eq('conversation_id', conversationId);

      // 2. Delete from storage
      if (files && files.length > 0) {
        const paths = files.map(f => f.storage_path);
        await supabase.storage.from('analysis-files').remove(paths);
      }

      // 3. Delete conversation (cascades to messages and files records)
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
  });
}
```

### Project Structure Notes

**Files to create:**
```
lib/supabase/
├── files.ts                     <- NEW: File upload/download service
├── files.test.ts                <- NEW: File service tests

app/api/files/
├── route.ts                     <- NEW: POST upload endpoint
└── [id]/
    └── route.ts                 <- NEW: GET download endpoint

components/chat/
├── FileAttachmentCard.tsx       <- NEW: File display in messages
├── FileAttachmentCard.test.tsx  <- NEW: Component tests

hooks/
├── use-files.ts                 <- NEW: File operations hook
├── use-files.test.tsx           <- NEW: Hook tests
```

**Files to modify:**
```
components/chat/
├── ChatMessage.tsx              <- UPDATE: Render file attachments
├── ChatMessage.test.tsx         <- UPDATE: Test file rendering

hooks/
├── use-conversations.ts         <- UPDATE: Add file cleanup on delete
├── use-conversations.test.tsx   <- UPDATE: Test file cleanup
├── use-chat.ts                  <- UPDATE: Handle file upload in send

lib/supabase/
├── messages.ts                  <- UPDATE: Include files in queries
├── index.ts                     <- UPDATE: Export files

types/
├── chat.ts                      <- UPDATE: Add MessageFile type

constants/
├── query-keys.ts                <- UPDATE: Add files query keys
├── messages.ts                  <- UPDATE: Add file error messages
```

### Previous Story Learnings (Story 3.2)

**Patterns to follow from Story 3.2:**
- File validation already implemented in `lib/utils/file-validation.ts`
- FilePreview component shows selected file before upload
- ChatInput passes file to onSubmit handler
- PrivacyTooltip wraps file upload area
- Drag and drop creates visual drop zone overlay
- Error messages in Spanish from `constants/files.ts`
- Use toast.error() for user-facing error notifications

**Dependencies confirmed working:**
- `@supabase/supabase-js@^2.45.0` - Storage API
- `@supabase/ssr@^0.5.0` - Server-side Supabase client
- `lucide-react@^0.460.0` - Icons (Download, FileSpreadsheet)
- `@tanstack/react-query@^5.60.0` - Query/mutation hooks

**Code patterns established:**
- File size formatting: `formatFileSize()` in `lib/utils/file-validation.ts`
- File type checking: `validateExcelFile()` in `lib/utils/file-validation.ts`
- Constants: `MAX_FILE_SIZE_BYTES`, `ALLOWED_MIME_TYPES` in `constants/files.ts`

### Error Handling Patterns

```typescript
// Upload errors
try {
  const result = await uploadFile(userId, conversationId, file);
  if (result.error) {
    toast.error('No se pudo subir el archivo. Intenta de nuevo.');
    return; // File preserved in ChatInput for retry
  }
  // Proceed with message send
} catch (error) {
  console.error('File upload error:', error);
  toast.error('No se pudo subir el archivo. Intenta de nuevo.');
}

// Download errors
try {
  const url = await getFileDownloadUrl(storagePath);
  if (!url) {
    toast.error('No se pudo descargar el archivo.');
    return;
  }
  window.open(url, '_blank');
} catch (error) {
  console.error('File download error:', error);
  toast.error('No se pudo descargar el archivo.');
}
```

### Accessibility Considerations

1. **FileAttachmentCard:** Keyboard accessible, focusable
2. **Download Button:** `aria-label="Descargar {filename}"`
3. **Loading State:** Visual spinner + `aria-busy="true"`
4. **Error States:** Screen reader announcements via toast

### Testing Strategy

**Unit Tests:**
- File upload service: mock Supabase storage, test success/error paths
- File download service: mock signed URL generation
- FileAttachmentCard: render, click handlers, loading state
- useFiles hook: mock mutations and queries

**Integration Points:**
- Verify file appears in message after upload
- Verify file persists after page reload
- Verify file downloads correctly
- Verify file deleted with conversation

### Security Considerations

1. **Authentication:** All API routes verify user authentication
2. **Authorization:** Files linked to conversations owned by user
3. **RLS:** Database policies enforce access control
4. **Signed URLs:** Temporary access URLs (1 hour expiry)
5. **MIME Validation:** Double-check MIME type on server

### References

- [Source: prd.md#interfaz-de-chat-mvp] - FR16 file storage specification
- [Source: architecture.md#arquitectura-de-datos-supabase] - Files table schema
- [Source: architecture.md#configuración-de-storage] - Storage bucket config, RLS policies
- [Source: architecture.md#estructura-de-api-routes] - /api/files route structure
- [Source: architecture.md#patrones-de-nombrado] - Naming conventions
- [Source: epics.md#story-33-file-storage-display-in-conversation] - Story requirements and ACs
- [Source: 3-2-file-upload-in-chat.md] - Previous story patterns and learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation proceeded without blocking issues.

### Completion Notes List

1. **Task 1-2: File Upload/Download Service** - Created `lib/supabase/files.ts` with functions for:
   - `uploadFile()` - Uploads to Supabase Storage and creates DB record
   - `getFileDownloadUrl()` - Generates signed URLs (1 hour expiry)
   - `downloadFile()` - Fetches file by ID
   - `deleteFilesByConversation()` - Cleanup on conversation delete
   - `getFilesByConversation()` - Query files for a conversation
   - `linkFileToMessage()` - Associates file with message

2. **Task 3-4: API Routes** - Created:
   - `app/api/files/route.ts` - POST for multipart file upload
   - `app/api/files/[id]/route.ts` - GET for file download with ownership verification

3. **Task 5: FileAttachmentCard Component** - Created visual card showing file name, size, timestamp with download button. Uses date-fns for Spanish relative timestamps.

4. **Task 6: ChatMessage Update** - Added file attachment rendering above message content. Supports multiple files per message.

5. **Task 7: useFiles Hook** - Created TanStack Query hooks for file operations: `useUploadFile()`, `useFilesByConversation()`, `useDownloadFile()`.

6. **Task 8: useChat File Integration** - Extended `useStreamingChat` to handle file upload before message send. Preserves file for retry on failure.

7. **Task 9: Messages Service** - Added `fetchMessagesWithFiles()` with Supabase join and updated `createMessage()` to support fileId in metadata.

8. **Task 10-11: File Deletion** - Implemented cascade delete of storage files when conversation is deleted.

9. **Task 12-14: Types & Constants** - Added `MessageFile`, `FileUploadResult` types and file error message constants.

10. **Task 15-16: Tests & Exports** - 66 new tests covering all functionality. Updated barrel exports.

### Change Log

- 2026-02-05: Implemented file storage and display in conversation (Story 3.3)
  - All 16 tasks completed
  - 574 tests passing (no regressions)
  - Linting passes
- 2026-02-05: Code review fixes applied
  - Added missing `app/api/conversations/[id]/files/route.ts` endpoint for file listing
  - Added ResizeObserver mock in `vitest.setup.ts` for Radix UI components
  - All 574 tests passing

### File List

**New Files:**
- `lib/supabase/files.ts` - File service (upload, download, delete)
- `lib/supabase/files.test.ts` - 16 unit tests for file service
- `app/api/files/route.ts` - File upload API endpoint
- `app/api/files/[id]/route.ts` - File download API endpoint
- `app/api/conversations/[id]/files/route.ts` - Files by conversation API endpoint
- `components/chat/FileAttachmentCard.tsx` - File display component
- `components/chat/FileAttachmentCard.test.tsx` - 10 tests for component
- `hooks/use-files.ts` - File operations hooks
- `hooks/use-files.test.tsx` - 8 tests for hooks

**Modified Files:**
- `types/chat.ts` - Added MessageFile, FileUploadResult, FileStatus types
- `components/chat/ChatMessage.tsx` - Added file attachment rendering
- `components/chat/ChatMessage.test.tsx` - Added 5 tests for file attachments
- `components/chat/index.ts` - Export FileAttachmentCard
- `hooks/use-chat.ts` - Added file upload integration
- `hooks/use-conversations.ts` - Added file cleanup on delete
- `hooks/use-conversations.test.tsx` - Added file deletion mock
- `hooks/use-messages.ts` - Added useMessagesWithFiles hook
- `hooks/index.ts` - Updated exports
- `lib/supabase/messages.ts` - Added fetchMessagesWithFiles, fileId support in createMessage
- `lib/supabase/messages.test.ts` - Updated tests for metadata
- `lib/supabase/index.ts` - Export files and messages modules
- `constants/files.ts` - Added error messages
- `package.json` - Added date-fns dependency
- `vitest.setup.ts` - Added ResizeObserver mock for Radix UI
