# Story 2.2: Create New Conversation

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to start a new conversation with one click**,
So that **I can begin a fresh analysis session quickly**.

**FRs covered:** FR13

## Acceptance Criteria

1. **Given** a user is on the dashboard, **When** they click the "Nueva conversacion" button, **Then** a new conversation is created in Supabase, **And** they are navigated to the new conversation view, **And** the chat area is empty and ready for input, **And** the new conversation appears at the top of the sidebar

2. **Given** a user creates a new conversation, **When** the conversation is created, **Then** it has a default title based on timestamp or "Nueva conversacion", **And** the conversation is associated with the authenticated user's ID

3. **Given** a user is already in a conversation, **When** they click "Nueva conversacion", **Then** a new conversation is created, **And** they are navigated away from the current conversation to the new one, **And** the previous conversation remains accessible in the sidebar

## Tasks / Subtasks

- [ ] **Task 1: Create Database Service for Conversation Creation** (AC: #1, #2)
  - [ ] Add `createConversation(userId: string, title?: string)` to `lib/supabase/conversations.ts`
  - [ ] Return `{ data, error }` structure following Architecture patterns
  - [ ] Set default title to "Nueva conversacion" with timestamp if not provided
  - [ ] Use RLS-aware client from `lib/supabase/client.ts`

- [ ] **Task 2: Create useCreateConversation Hook** (AC: #1, #2, #3)
  - [ ] Add `useCreateConversation()` mutation to `hooks/use-conversations.ts`
  - [ ] On success: invalidate conversations list query to refresh sidebar
  - [ ] On success: navigate to `/conversacion/[id]` with new conversation ID
  - [ ] On error: show toast with error message in Spanish
  - [ ] Return mutation state for loading indicator in button

- [ ] **Task 3: Create NewConversationButton Component** (AC: #1, #3)
  - [ ] Create `components/layout/NewConversationButton.tsx`
  - [ ] Props: `onSuccess?: () => void` (for mobile sidebar close)
  - [ ] Display: "Nueva conversacion" text with plus icon (MessageSquarePlus from lucide-react)
  - [ ] Use shadcn/ui `Button` with Setec orange primary variant
  - [ ] Loading state: Show spinner, disable button during creation
  - [ ] Full width to match sidebar design

- [ ] **Task 4: Integrate Button into Sidebar** (AC: #1, #3)
  - [ ] Import and place `NewConversationButton` at top of Sidebar
  - [ ] Position above conversation list with visual separator
  - [ ] Pass `onSuccess` callback to close mobile sidebar after creation
  - [ ] Ensure button is always visible (not scrollable with list)

- [ ] **Task 5: Update Dashboard Page for Empty State** (AC: #1)
  - [ ] Modify `app/(dashboard)/page.tsx` to show welcome state when no conversation selected
  - [ ] Display: Welcome message in Spanish with guidance to start new conversation
  - [ ] Include centered "Nueva conversacion" button as alternative entry point
  - [ ] Design matches UX specification empty state

- [ ] **Task 6: Write Unit Tests** (AC: all)
  - [ ] Test `createConversation` service creates record with correct user_id
  - [ ] Test `createConversation` sets default title when none provided
  - [ ] Test `useCreateConversation` hook mutation triggers and invalidates cache
  - [ ] Test `useCreateConversation` navigates to new conversation on success
  - [ ] Test `NewConversationButton` renders correctly
  - [ ] Test `NewConversationButton` shows loading state during mutation
  - [ ] Test `NewConversationButton` calls mutation on click
  - [ ] Test `NewConversationButton` calls onSuccess callback
  - [ ] Test Sidebar includes NewConversationButton
  - [ ] Test Dashboard page shows welcome state
  - [ ] Test error handling shows toast message

## Dev Notes

### Critical Architecture Patterns

**File Naming (from Architecture):**
- Components: PascalCase.tsx -> `NewConversationButton.tsx`
- Hooks: kebab-case -> `use-conversations.ts` (extend existing)
- Tests: co-located -> `NewConversationButton.test.tsx` next to component

**Query Keys Pattern (from Architecture):**
```typescript
// constants/query-keys.ts (already exists)
export const queryKeys = {
  conversations: {
    all: ['conversations'] as const,
    list: () => [...queryKeys.conversations.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.conversations.all, 'detail', id] as const,
  },
};
```

**API Response Pattern (from Architecture):**
```typescript
// All service calls return { data, error } structure
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

**Database INSERT Pattern:**
```typescript
// Use RLS-aware client for insert operations
const supabase = createClient();
const { data, error } = await supabase
  .from('conversations')
  .insert({ user_id: userId, title })
  .select()
  .single();
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

-- RLS policy for insert
CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### TypeScript Types (Already Defined in Story 2.1)

```typescript
// types/database.ts - already exists from Story 2.1
export interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}
```

### UX Design Requirements

**Button Design (from UX Spec):**
```
┌──────────────────────────────────────┐
│  [+] Nueva conversacion              │  <- Full width, orange primary
└──────────────────────────────────────┘
```

**Loading State:**
```
┌──────────────────────────────────────┐
│  [⟳] Creando...                      │  <- Spinner + disabled
└──────────────────────────────────────┘
```

**Dashboard Empty State (from UX Spec):**
```
┌───────────────────────────────────────────────────┐
│                                                   │
│                                                   │
│              Bienvenido a Setec AI Hub           │
│                                                   │
│          Inicia una nueva conversacion           │
│          para comenzar tu analisis               │
│                                                   │
│         [+] Nueva conversacion                   │
│                                                   │
└───────────────────────────────────────────────────┘
```

**Brand Colors (from Architecture):**
- Primary Orange: `#F7931E` -> "Nueva conversacion" button background
- White: `#FFFFFF` -> Button text
- Charcoal Text: `#3D3D3D` -> Welcome text

### Existing Components to Use

**From Story 2.1 (already implemented):**
- `lib/supabase/conversations.ts` - Extend with createConversation
- `hooks/use-conversations.ts` - Extend with useCreateConversation
- `components/layout/Sidebar.tsx` - Integrate NewConversationButton
- `components/layout/ConversationList.tsx` - Will auto-update via query invalidation
- `constants/query-keys.ts` - Query key factory
- `constants/messages.ts` - Spanish UI messages

**From shadcn/ui:**
- `Button` - Primary action button
- `Spinner` or loading indicator

**From lucide-react:**
- `MessageSquarePlus` - Icon for new conversation button
- `Loader2` - Spinning loader icon

### Previous Story Learnings (Story 2.1)

**Patterns to follow:**
- Use `useRouter()` from `next/navigation` for programmatic navigation
- Invalidate `queryKeys.conversations.list()` after mutations
- Pass `onSuccess` callback for mobile sidebar close behavior
- Show toast notifications using `sonner` for success/error feedback
- Handle loading states explicitly in UI

**Issues found in previous story (avoid repeating):**
- Use proper Spanish accents: "conversacion" -> "conversacion" (but without accent in code variables)
- Clean up mutations properly with query invalidation
- Don't forget to handle the mobile sidebar close on navigation

**Dependencies confirmed working:**
- `@tanstack/react-query@^5.60.0` - useMutation for create operation
- `@supabase/supabase-js@^2.94.0` - Insert operations
- `next/navigation` - useRouter for navigation
- `sonner` - Toast notifications
- `lucide-react@^0.460.0` - Icons

### Project Structure Notes

**Files to create:**
```
components/
├── layout/
│   ├── NewConversationButton.tsx      <- NEW: Create conversation button
│   ├── NewConversationButton.test.tsx <- NEW: Component tests
│   └── index.ts                       <- UPDATE: Add new export
```

**Files to modify:**
```
lib/supabase/conversations.ts          <- UPDATE: Add createConversation
hooks/use-conversations.ts             <- UPDATE: Add useCreateConversation
hooks/use-conversations.test.tsx       <- UPDATE: Add new hook tests
components/layout/Sidebar.tsx          <- UPDATE: Integrate NewConversationButton
app/(dashboard)/page.tsx               <- UPDATE: Add welcome empty state
```

**Alignment with Architecture:**
- Component location: `components/layout/` for sidebar-related components
- Hook pattern: Extend existing `use-conversations.ts` (colocation of related logic)
- Service pattern: Extend existing `conversations.ts` (single responsibility file)

### Security Considerations

1. **RLS Enforcement:** Insert uses browser client with auth session - RLS ensures user_id matches authenticated user
2. **Auth Validation:** Button only renders in dashboard (protected route) - user always authenticated
3. **Input Sanitization:** Title is optional; if provided, Supabase handles escaping

### Testing Strategy

**Unit Tests (Vitest + Testing Library):**
- Service tests: Mock Supabase client, verify insert call with correct parameters
- Hook tests: Mock service, verify mutation behavior and navigation
- Component tests: Mock hook, verify rendering and interaction states

**Test Mocking Pattern:**
```typescript
// Mock navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock the hook for component tests
vi.mock('@/hooks/use-conversations', () => ({
  useCreateConversation: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));
```

### Error Messages (Spanish)

```typescript
// Add to constants/messages.ts
export const MESSAGES = {
  // ... existing messages
  CREATE_CONVERSATION_SUCCESS: 'Conversacion creada',
  CREATE_CONVERSATION_ERROR: 'No se pudo crear la conversacion. Intenta de nuevo.',
};
```

### References

- [Source: architecture.md#arquitectura-de-datos-supabase] - Database schema and RLS policies
- [Source: architecture.md#frontend-architecture] - TanStack Query mutation patterns
- [Source: architecture.md#patrones-de-nombrado] - File naming conventions
- [Source: architecture.md#estructura-completa-del-proyecto] - Project structure
- [Source: ux-design-specification.md#sidebar-navigation] - Sidebar and button design
- [Source: epics.md#story-22-create-new-conversation] - Story requirements
- [Source: prd.md#interfaz-de-chat-mvp] - FR13 specification

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

