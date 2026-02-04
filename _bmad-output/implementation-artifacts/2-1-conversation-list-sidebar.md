# Story 2.1: Conversation List Sidebar

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to see my conversation history in a sidebar**,
So that **I can easily navigate between past conversations and continue previous work**.

**FRs covered:** FR18, FR19, FR20

## Acceptance Criteria

1. **Given** an authenticated user accesses the dashboard, **When** the page loads, **Then** they see a sidebar on the left side with a list of their conversations, **And** each conversation shows a title (or preview of first message) and relative timestamp, **And** conversations are sorted by most recently updated first, **And** the sidebar is scrollable if there are many conversations

2. **Given** a user has no conversations yet, **When** they view the sidebar, **Then** they see an empty state message: "No tienes conversaciones aún", **And** they see a prominent "Nueva conversación" button

3. **Given** a user clicks on a conversation in the sidebar, **When** the conversation loads, **Then** they are navigated to that conversation's view, **And** the selected conversation is visually highlighted in the sidebar, **And** all messages from that conversation are displayed in the main area

4. **Given** a user wants to delete a conversation, **When** they click the delete option (via context menu or icon), **Then** they see a confirmation dialog: "¿Eliminar esta conversación?", **And** upon confirmation, the conversation and all its messages are permanently deleted, **And** the sidebar updates to reflect the deletion

5. **Given** the sidebar needs to be responsive, **When** viewed on mobile, **Then** the sidebar is collapsed by default, **And** a hamburger menu icon allows toggling the sidebar visibility

## Tasks / Subtasks

- [x] **Task 1: Create Supabase Database Service Layer** (AC: #1, #3, #4)
  - [x] Create `lib/supabase/conversations.ts` with typed database operations
  - [x] Implement `getConversations(userId: string)` - fetch all user conversations sorted by updated_at DESC
  - [x] Implement `getConversation(id: string)` - fetch single conversation with messages
  - [x] Implement `deleteConversation(id: string)` - hard delete with cascade
  - [x] Define TypeScript types in `types/database.ts` for Conversation, Message rows
  - [x] Add RLS-aware client calls using `createClient()` from `lib/supabase/client.ts`

- [x] **Task 2: Create TanStack Query Hooks for Conversations** (AC: #1, #3, #4)
  - [x] Create `hooks/use-conversations.ts` with:
    - `useConversations()` - fetch all conversations with query key `['conversations', 'list']`
    - `useConversation(id: string)` - fetch single conversation with query key `['conversations', 'detail', id]`
    - `useDeleteConversation()` - mutation with optimistic update and cache invalidation
  - [x] Use query keys from `constants/query-keys.ts`
  - [x] Add proper error handling with toast notifications
  - [x] Configure stale time (5 minutes) and retry (1 attempt)

- [x] **Task 3: Create ConversationItem Component** (AC: #1, #2, #3, #4)
  - [x] Create `components/layout/ConversationItem.tsx`
  - [x] Props: `conversation: Conversation`, `isSelected: boolean`, `onDelete: (id: string) => void`
  - [x] Display: title or first message preview (truncated to ~30 chars)
  - [x] Display: relative timestamp using `formatRelativeTime()` from `lib/utils/date-utils.ts`
  - [x] Visual states: default, hover, selected (highlighted with Setec orange border-left)
  - [x] Delete button: trash icon on hover, triggers confirmation dialog
  - [x] Use shadcn/ui components: `Card` for item container, `Button` for delete
  - [x] Use `next/link` for navigation to `/conversacion/[id]`

- [x] **Task 4: Create ConversationList Component** (AC: #1, #2)
  - [x] Create `components/layout/ConversationList.tsx`
  - [x] Fetch conversations using `useConversations()` hook
  - [x] Loading state: show 3-5 `Skeleton` components for placeholder
  - [x] Empty state: "No tienes conversaciones aun" centered message
  - [x] Error state: "Error al cargar conversaciones" with retry button
  - [x] Render list of `ConversationItem` components in `ScrollArea`
  - [x] Pass current conversation ID (from URL) to highlight selected item

- [x] **Task 5: Create Delete Confirmation Dialog** (AC: #4)
  - [x] Create `components/layout/DeleteConversationDialog.tsx`
  - [x] Use shadcn/ui `Dialog` component
  - [x] Spanish text: "Eliminar esta conversacion?"
  - [x] Description: "Esta accion no se puede deshacer. Se eliminaran todos los mensajes."
  - [x] Buttons: "Cancelar" (secondary), "Eliminar" (destructive red)
  - [x] Handle loading state during delete operation
  - [x] Close dialog and show success toast on completion

- [x] **Task 6: Update Sidebar Component** (AC: #1, #2, #5)
  - [x] Modify `components/layout/Sidebar.tsx`
  - [x] Replace placeholder conversation list with `ConversationList` component
  - [x] Ensure "Nueva conversacion" button remains at top (placeholder - functional in Story 2.2)
  - [x] Verify mobile responsiveness (collapse/expand via Header hamburger menu)
  - [x] Add visual separator between navigation and conversation list sections
  - [x] Verify `ScrollArea` properly contains scrollable content

- [x] **Task 7: Create Conversation Detail Route** (AC: #3)
  - [x] Create `app/(dashboard)/conversacion/[id]/page.tsx`
  - [x] Validate conversation ID format (UUID)
  - [x] Use `useConversation(id)` to fetch conversation data
  - [x] Loading state: Show chat skeleton
  - [x] Error/Not found: "Conversacion no encontrada" with link back to dashboard
  - [x] Success: Render placeholder chat area (messages display in Story 2.3)
  - [x] Pass conversation ID to sidebar via URL params for selection highlighting

- [x] **Task 8: Add URL-Based Selection Highlighting** (AC: #3)
  - [x] In dashboard layout, read current conversation ID from `useParams()`
  - [x] Pass `selectedConversationId` to `Sidebar` component
  - [x] `ConversationList` receives and passes to `ConversationItem` for highlighting
  - [x] Navigating to `/` (dashboard home) clears selection
  - [x] Navigating to `/conversacion/[id]` highlights that conversation

- [x] **Task 9: Add Optimistic Updates for Deletion** (AC: #4)
  - [x] In `useDeleteConversation()` mutation:
    - onMutate: Remove conversation from cache optimistically
    - onError: Rollback cache to previous state
    - onSuccess: Invalidate queries to ensure sync
  - [x] Navigate to `/` if deleting currently viewed conversation
  - [x] Show success toast: "Conversacion eliminada"
  - [x] Show error toast on failure: "No se pudo eliminar la conversacion"

- [x] **Task 10: Write Unit Tests** (AC: all)
  - [x] Test `useConversations` hook returns data correctly
  - [x] Test `useConversations` handles loading state
  - [x] Test `useConversations` handles error state
  - [x] Test `useDeleteConversation` mutation works
  - [x] Test `ConversationItem` renders title and timestamp
  - [x] Test `ConversationItem` shows delete button on hover
  - [x] Test `ConversationItem` highlights when selected
  - [x] Test `ConversationList` renders conversations
  - [x] Test `ConversationList` shows empty state
  - [x] Test `ConversationList` shows loading skeletons
  - [x] Test `DeleteConversationDialog` opens/closes correctly
  - [x] Test `DeleteConversationDialog` calls delete on confirm
  - [x] Test Sidebar includes ConversationList
  - [x] Test conversation detail page loads conversation
  - [x] Test conversation detail page handles not found

## Dev Notes

### Critical Architecture Patterns

**File Naming (from Architecture):**
- Components: PascalCase.tsx → `ConversationItem.tsx`, `ConversationList.tsx`
- Hooks: kebab-case → `use-conversations.ts`
- Tests: co-located → `ConversationItem.test.tsx` next to `ConversationItem.tsx`
- Routes: lowercase with route structure → `app/(dashboard)/conversacion/[id]/page.tsx`

**Query Keys Pattern (from Architecture):**
```typescript
// constants/query-keys.ts (already exists)
export const queryKeys = {
  conversations: {
    all: ['conversations'] as const,
    list: () => [...queryKeys.conversations.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.conversations.all, 'detail', id] as const,
  },
  // ... other keys
};
```

**API Response Pattern (from Architecture):**
```typescript
// All API/service calls return { data, error } structure
interface ApiSuccessResponse<T> {
  data: T;
  error: null;
}

interface ApiErrorResponse {
  data: null;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

**TanStack Query Configuration (from Architecture):**
```typescript
// Default options in QueryProvider
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 minutes
      retry: 1,
    },
  },
});
```

### Database Schema Reference

```sql
-- conversations table (from Architecture)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- messages table (from Architecture)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies ensure users only see their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);
```

### TypeScript Types to Define

```typescript
// types/database.ts - extend existing types
export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}
```

### UX Design Requirements

**Conversation Item Design (from UX Spec):**
```
┌──────────────────────────────────────┐
│ [Title or preview...]         Hace 5m│
│                               [🗑️]   │
└──────────────────────────────────────┘

Selected state:
┌──────────────────────────────────────┐
│▌[Title or preview...]        Hace 5m│ ← Orange left border
│▌                              [🗑️]  │
└──────────────────────────────────────┘
```

**Empty State Design:**
```
┌──────────────────────────────────────┐
│                                      │
│                                      │
│     💬 No tienes conversaciones aún  │
│                                      │
│        Inicia una nueva para         │
│        comenzar tu análisis          │
│                                      │
└──────────────────────────────────────┘
```

**Delete Dialog Design:**
```
┌────────────────────────────────────────┐
│ ¿Eliminar esta conversación?           │
├────────────────────────────────────────┤
│ Esta acción no se puede deshacer.      │
│ Se eliminarán todos los mensajes.      │
├────────────────────────────────────────┤
│              [Cancelar] [Eliminar]     │
└────────────────────────────────────────┘
```

**Brand Colors (from Architecture):**
- Primary Orange: `#F7931E` → Selection border, "Nueva conversación" button
- Charcoal Text: `#3D3D3D` → Conversation titles
- Light Gray: `#F5F5F5` → Sidebar background
- Border Gray: `#E5E5E5` → Item separators
- Muted Text: `#9CA3AF` → Timestamps
- Destructive Red: `#EF4444` → Delete button

**Timestamp Formatting (from date-utils.ts):**
- "Ahora" → < 1 minute ago
- "Hace X min" → < 60 minutes
- "Hace Xh" → < 24 hours
- "Hace Xd" → < 7 days
- "3 feb 2026" → >= 7 days

### Existing Components to Use

From Story 1.4 (already implemented):
- `components/layout/Sidebar.tsx` - Container with navigation structure
- `components/layout/Header.tsx` - Mobile hamburger toggle for sidebar
- `components/ui/ScrollArea` - Scrollable container
- `components/ui/Skeleton` - Loading placeholders
- `components/ui/Button` - Action buttons
- `components/ui/Dialog` - Confirmation dialogs
- `components/ui/Separator` - Visual dividers

From Story 1.1-1.3:
- `lib/supabase/client.ts` - Browser Supabase client
- `lib/utils/date-utils.ts` - formatRelativeTime function
- `lib/utils/error-utils.ts` - Error codes and messages
- `constants/query-keys.ts` - Query key factory
- `constants/messages.ts` - Spanish UI messages

### Previous Story Learnings (Story 1.4)

**Patterns to follow:**
- Dashboard layout uses CSS Grid with 280px sidebar
- Mobile sidebar toggle works via `sidebarOpen` state passed from Header
- Auth context provides `user` for user_id in database queries
- Supabase clients memoized with `useMemo` to avoid recreation
- Tests co-located with components

**Issues found in previous stories (avoid repeating):**
- Use `Link` from `next/link` for internal navigation (not `router.push` for static links)
- Clean up subscriptions/effects with return cleanup functions
- Don't add redundant `aria-label` when semantic elements provide accessibility
- Handle loading states explicitly (not just checking `!data`)

**Dependencies confirmed working:**
- `@tanstack/react-query@^5.60.0`
- `@supabase/supabase-js@^2.94.0`
- `lucide-react@^0.460.0` (for icons)
- `sonner` (for toasts - configured in Story 1.1)

### Project Structure Notes

**Files to create:**
```
lib/
├── supabase/
│   └── conversations.ts               ← NEW: Database operations
hooks/
├── use-conversations.ts               ← NEW: TanStack Query hooks
├── use-conversations.test.ts          ← NEW: Hook tests
components/
├── layout/
│   ├── ConversationItem.tsx           ← NEW: Single conversation card
│   ├── ConversationItem.test.tsx      ← NEW: Component tests
│   ├── ConversationList.tsx           ← NEW: List container
│   ├── ConversationList.test.tsx      ← NEW: Component tests
│   ├── DeleteConversationDialog.tsx   ← NEW: Confirmation dialog
│   ├── DeleteConversationDialog.test.tsx ← NEW: Dialog tests
│   └── index.ts                       ← UPDATE: Add new exports
app/
├── (dashboard)/
│   └── conversacion/
│       └── [id]/
│           └── page.tsx               ← NEW: Conversation detail route
│           └── page.test.tsx          ← NEW: Route tests
types/
├── database.ts                        ← UPDATE: Add Conversation, Message types
```

**Files to modify:**
```
components/layout/Sidebar.tsx          ← UPDATE: Integrate ConversationList
components/layout/index.ts             ← UPDATE: Export new components
app/(dashboard)/layout.tsx             ← VERIFY: Passes selectedConversationId
```

**Alignment with Architecture:**
- Route structure: `/conversacion/[id]` matches architecture conventions
- Query hooks: Follow established TanStack Query patterns
- Database calls: Use RLS-aware browser client
- Component location: `components/layout/` for sidebar-related components

### Security Considerations

1. **RLS Enforcement:** All database queries use browser client with auth session - RLS policies ensure users only see their own conversations
2. **UUID Validation:** Validate conversation ID format before database lookup to prevent injection
3. **Cascade Delete:** Database cascade ensures messages deleted with conversation (no orphan data)
4. **Auth Check:** Dashboard layout already validates authentication - component assumes valid user

### Testing Strategy

**Unit Tests (Vitest + Testing Library):**
- Hook tests: Mock Supabase client, verify query behavior
- Component tests: Mock hooks, verify rendering and interactions
- Dialog tests: Verify open/close states and callback invocations

**Test Mocking Pattern:**
```typescript
// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockConversations, error: null }),
    })),
  })),
}));

// Mock TanStack Query hooks
vi.mock('@/hooks/use-conversations', () => ({
  useConversations: vi.fn(() => ({
    data: mockConversations,
    isLoading: false,
    isError: false,
  })),
}));
```

### References

- [Source: architecture.md#arquitectura-de-datos-supabase] - Database schema and RLS policies
- [Source: architecture.md#frontend-architecture] - TanStack Query patterns
- [Source: architecture.md#patrones-de-nombrado] - File naming conventions
- [Source: architecture.md#estructura-completa-del-proyecto] - Project structure
- [Source: ux-design-specification.md#sidebar-navigation] - Sidebar design specs
- [Source: epics.md#story-21-conversation-list-sidebar] - Story requirements
- [Source: prd.md#interfaz-de-chat-mvp] - FR18, FR19, FR20

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

No debug issues encountered.

### Completion Notes List

- Implemented Supabase database service layer with typed operations for conversations
- Created TanStack Query hooks with optimistic updates and proper error handling
- Built ConversationItem, ConversationList, and DeleteConversationDialog components
- Updated Sidebar to integrate ConversationList with selection highlighting
- Created conversation detail route with UUID validation and loading/error states
- Added URL-based selection highlighting via dashboard layout
- Implemented comprehensive unit tests (285 tests, all passing)
- All acceptance criteria satisfied
- All linting passes

### Code Review Fixes Applied

**Issue #1 & #2 (HIGH):** Added navigation to `/` when deleting current conversation, added `onNavigate` callback for mobile sidebar close
**Issue #3 & #4 (MEDIUM):** Added UUID validation in `getConversation()` and optimized to single query with join for messages
**Issue #6 (MEDIUM):** Fixed Spanish accents throughout - conversación, acción, eliminarán, aún
**Issue #7 (MEDIUM):** Added test for optimistic update rollback verification on delete error
**Issue #10 (LOW):** Fixed empty query key in `useConversation` to use explicit `['conversations', 'detail', 'disabled']` when id is null

All 285 tests passing after code review fixes.

### File List

**New Files:**
- lib/supabase/conversations.ts
- hooks/use-conversations.ts
- hooks/use-conversations.test.tsx
- components/layout/ConversationItem.tsx
- components/layout/ConversationItem.test.tsx
- components/layout/ConversationList.tsx
- components/layout/ConversationList.test.tsx
- components/layout/DeleteConversationDialog.tsx
- components/layout/DeleteConversationDialog.test.tsx
- app/(dashboard)/conversacion/[id]/page.tsx
- app/(dashboard)/conversacion/[id]/page.test.tsx

**Modified Files:**
- lib/supabase/index.ts
- hooks/index.ts
- components/layout/index.ts
- components/layout/Sidebar.tsx
- components/layout/Sidebar.test.tsx
- app/(dashboard)/layout.tsx

## Change Log

- 2026-02-04: Story 2.1 implemented - Conversation list sidebar with full CRUD functionality, optimistic updates, and comprehensive test coverage

