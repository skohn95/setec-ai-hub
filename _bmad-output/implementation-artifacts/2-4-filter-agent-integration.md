# Story 2.4: Filter Agent Integration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **system**,
I want **all user messages to pass through a filter agent**,
So that **off-topic queries are rejected with helpful guidance**.

**FRs covered:** FR-AGT1, FR-AGT2, FR-AGT3

## Acceptance Criteria

1. **Given** a user sends a message, **When** the `/api/chat` endpoint receives the message, **Then** the message is first sent to the Filter Agent (gpt-4o-mini), **And** the Filter Agent uses structured output to return `{ "allowed": boolean }`

2. **Given** the Filter Agent determines the message is on-topic, **When** `allowed: true` is returned, **Then** the message proceeds to the Main Agent for processing (Story 2.5), **And** no rejection message is shown to the user

3. **Given** the Filter Agent determines the message is off-topic, **When** `allowed: false` is returned, **Then** the user receives a contextual rejection message in Spanish, **And** the rejection explains the system's capabilities: "Soy un asistente especializado en análisis estadístico para Lean Six Sigma. Puedo ayudarte con MSA, gráficos de control, pruebas de hipótesis y más. ¿En qué puedo ayudarte?", **And** no call is made to the Main Agent

4. **Given** the Filter Agent system prompt needs to be defined, **When** the prompt is configured, **Then** it allows: greetings, MSA-related queries, statistics questions, analysis requests, follow-up questions about results, **And** it rejects: unrelated topics (cooking recipes, general chat, coding help unrelated to stats, etc.)

5. **Given** the OpenAI API is unavailable, **When** a request fails, **Then** the user sees a friendly error message in Spanish: "El servicio no está disponible en este momento. Por favor intenta de nuevo en unos minutos.", **And** the message is not marked as sent successfully

## Tasks / Subtasks

- [x] **Task 1: Create OpenAI Client Configuration** (AC: #1, #5)
  - [x] Create `lib/openai/client.ts` with OpenAI SDK initialization
  - [x] Import API key from environment variables (`OPENAI_API_KEY`)
  - [x] Configure default settings (timeout, retries)
  - [x] Export singleton client instance
  - [x] Handle API key missing error gracefully

- [x] **Task 2: Create Filter Agent System Prompt** (AC: #4)
  - [x] Create `lib/openai/prompts.ts` for system prompts
  - [x] Define `FILTER_SYSTEM_PROMPT` constant
  - [x] Prompt should instruct: classify as allowed/not-allowed
  - [x] Explicitly list allowed topics: greetings, MSA, statistics, Lean Six Sigma, quality analysis, follow-up questions
  - [x] Explicitly list rejected topics: cooking, general chat, coding (non-stats), entertainment, politics, etc.
  - [x] Use Spanish for any examples in the prompt

- [x] **Task 3: Create Filter Agent Service** (AC: #1, #2, #3)
  - [x] Create `lib/openai/filter-agent.ts`
  - [x] Function `filterMessage(content: string): Promise<{ allowed: boolean }>`
  - [x] Use `gpt-4o-mini` model for cost efficiency
  - [x] Use OpenAI structured output (`response_format: { type: 'json_schema' }`)
  - [x] Define JSON schema for response: `{ allowed: boolean }`
  - [x] Return parsed boolean response
  - [x] Handle API errors with proper error messages

- [x] **Task 4: Create Rejection Message Handler** (AC: #3)
  - [x] Create `lib/openai/rejection-messages.ts`
  - [x] Define `REJECTION_MESSAGE` constant in Spanish
  - [x] Include system capabilities explanation
  - [x] Make message friendly and helpful, guiding user back to valid topics

- [x] **Task 5: Create Chat API Route** (AC: #1, #2, #3, #5)
  - [x] Create `app/api/chat/route.ts` POST endpoint
  - [x] Accept request body: `{ conversationId: string, content: string }`
  - [x] Call filter agent first with user message
  - [x] If filtered out: return rejection response immediately
  - [x] If allowed: for now, return a placeholder response (Main Agent in Story 2.5)
  - [x] Save user message to database before processing
  - [x] Save assistant response to database after processing
  - [x] Return proper error responses for failures
  - [x] Use Edge runtime for better performance

- [x] **Task 6: Create useSendChatMessage Hook** (AC: #1, #5)
  - [x] Create `hooks/use-chat.ts` with chat-specific hooks
  - [x] `useSendChatMessage(conversationId: string)` mutation hook
  - [x] Call `/api/chat` endpoint
  - [x] Handle optimistic updates for user message
  - [x] Handle assistant response insertion into cache
  - [x] Handle error states with toast notifications
  - [x] Update conversation `updated_at` timestamp

- [x] **Task 7: Update ChatContainer for API Integration** (AC: #1, #2, #3, #5)
  - [x] Update `components/chat/ChatContainer.tsx`
  - [x] Replace mock send with `useSendChatMessage`
  - [x] Handle loading state during API call
  - [x] Display assistant response when received
  - [x] Handle error states with retry option
  - [x] Ensure auto-scroll works with API responses

- [x] **Task 8: Add API Error Constants** (AC: #5)
  - [x] Update `constants/messages.ts` with API error messages
  - [x] Add `API_ERRORS.OPENAI_UNAVAILABLE` in Spanish
  - [x] Add `API_ERRORS.NETWORK_ERROR` in Spanish
  - [x] Add `API_ERRORS.SEND_FAILED` in Spanish

- [x] **Task 9: Create API Response Types** (AC: #1, #2, #3)
  - [x] Update `types/api.ts` with chat API types
  - [x] `ChatRequest`: `{ conversationId: string, content: string }`
  - [x] `ChatResponse`: `{ data: { userMessage: Message, assistantMessage: Message } | null, error: ApiError | null }`
  - [x] `FilterResult`: `{ allowed: boolean }`

- [x] **Task 10: Write Unit Tests** (AC: all)
  - [x] Test filter agent allows greetings ("Hola")
  - [x] Test filter agent allows MSA queries ("Quiero analizar MSA")
  - [x] Test filter agent allows statistics questions ("¿Qué es Gauge R&R?")
  - [x] Test filter agent rejects off-topic ("Dame una receta de cocina")
  - [x] Test filter agent rejects unrelated coding ("Ayúdame con mi código JavaScript")
  - [x] Test API route returns rejection message when filtered
  - [x] Test API route saves messages to database
  - [x] Test API route handles OpenAI errors gracefully
  - [x] Test useSendChatMessage mutation updates cache
  - [x] Test ChatContainer shows assistant response
  - [x] Test ChatContainer handles API errors

## Dev Notes

### Critical Architecture Patterns

**Two-Agent Architecture (from PRD & Architecture):**
```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO                                  │
│                     envía mensaje                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  AGENTE 1 (Filtro) ← THIS STORY                                 │
│  ─────────────────                                              │
│  • Model: gpt-4o-mini (cost efficient)                          │
│  • Structured output: { "allowed": true/false }                 │
│  • Permite: saludos, todo relacionado a análisis/MSA/stats      │
│  • Rechaza: todo lo demás → mensaje contextual                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                         allowed?
                     ┌─────┴─────┐
                    NO          SÍ
                     ↓           ↓
              [Mensaje       [Agente Principal]
               rechazo       (Story 2.5)
               contextual]
```

**OpenAI SDK Structured Output (from PRD):**
```typescript
// Filter Agent uses structured output for reliable classification
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: FILTER_SYSTEM_PROMPT },
    { role: 'user', content: userMessage }
  ],
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'filter_response',
      schema: {
        type: 'object',
        properties: {
          allowed: { type: 'boolean' }
        },
        required: ['allowed'],
        additionalProperties: false
      }
    }
  }
});

const result = JSON.parse(response.choices[0].message.content);
// result.allowed is guaranteed to be boolean
```

### Filter Agent System Prompt Design

**Key Requirements (from PRD):**
- Allows: greetings, MSA-related queries, statistics questions, analysis requests, follow-up questions about results
- Rejects: unrelated topics (cooking recipes, general chat, coding help unrelated to stats, entertainment, etc.)

**Prompt Template:**
```typescript
export const FILTER_SYSTEM_PROMPT = `Eres un filtro de mensajes para una plataforma de análisis estadístico de Lean Six Sigma.

Tu única tarea es determinar si el mensaje del usuario está relacionado con el propósito del sistema.

PERMITIR (allowed: true):
- Saludos y despedidas
- Preguntas sobre MSA (Análisis del Sistema de Medición)
- Preguntas sobre estadística, control de calidad, Lean Six Sigma
- Solicitudes de análisis de datos
- Preguntas sobre Gauge R&R, gráficos de control, pruebas de hipótesis
- Preguntas de seguimiento sobre resultados de análisis previos
- Preguntas sobre cómo usar la plataforma

RECHAZAR (allowed: false):
- Recetas de cocina, comida
- Entretenimiento, películas, música
- Política, religión
- Ayuda con programación no relacionada a estadística
- Preguntas generales no relacionadas con estadística o calidad
- Solicitudes de información personal
- Cualquier tema que no esté en la lista de permitidos

Responde SOLO con JSON. No incluyas explicaciones.`;
```

### Rejection Message (from PRD - Spanish)

```typescript
export const REJECTION_MESSAGE =
  'Soy un asistente especializado en análisis estadístico para Lean Six Sigma. ' +
  'Puedo ayudarte con MSA, gráficos de control, pruebas de hipótesis y más. ' +
  '¿En qué puedo ayudarte?';
```

### API Route Structure

**File: `app/api/chat/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { filterMessage } from '@/lib/openai/filter-agent';
import { createMessage } from '@/lib/supabase/messages';
import { REJECTION_MESSAGE } from '@/lib/openai/rejection-messages';

export const runtime = 'edge'; // Better performance for streaming (prep for Story 2.5)

export async function POST(req: NextRequest) {
  try {
    const { conversationId, content } = await req.json();

    // 1. Save user message first
    const userMessageResult = await createMessage(conversationId, 'user', content);
    if (userMessageResult.error) {
      return NextResponse.json(
        { data: null, error: userMessageResult.error },
        { status: 500 }
      );
    }

    // 2. Filter the message
    const filterResult = await filterMessage(content);

    // 3. Handle rejected messages
    if (!filterResult.allowed) {
      const assistantMessageResult = await createMessage(
        conversationId,
        'assistant',
        REJECTION_MESSAGE
      );

      return NextResponse.json({
        data: {
          userMessage: userMessageResult.data,
          assistantMessage: assistantMessageResult.data,
          filtered: true
        },
        error: null
      });
    }

    // 4. For now, return placeholder (Main Agent in Story 2.5)
    // TODO: Replace with Main Agent call in Story 2.5
    const placeholderResponse = 'El agente principal procesará tu mensaje pronto.';
    const assistantMessageResult = await createMessage(
      conversationId,
      'assistant',
      placeholderResponse
    );

    return NextResponse.json({
      data: {
        userMessage: userMessageResult.data,
        assistantMessage: assistantMessageResult.data,
        filtered: false
      },
      error: null
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'CHAT_ERROR',
          message: 'No se pudo procesar el mensaje. Intenta de nuevo.'
        }
      },
      { status: 500 }
    );
  }
}
```

### Environment Variables Required

```bash
# .env.local (add to existing)
OPENAI_API_KEY=sk-...
```

**Note:** Update `.env.example` with placeholder:
```bash
OPENAI_API_KEY=your-openai-api-key-here
```

### Database Operations

**Messages are saved to database following existing pattern from Story 2.3:**
- User message saved before filter call (ensures message is persisted even if API fails)
- Assistant response saved after filter decision
- Uses existing `createMessage` function from `lib/supabase/messages.ts`

### Error Handling Patterns

**OpenAI API Errors:**
```typescript
try {
  const response = await openai.chat.completions.create({...});
  return { allowed: JSON.parse(response.choices[0].message.content).allowed };
} catch (error) {
  if (error.status === 429) {
    throw new Error('Rate limited. Please try again later.');
  }
  if (error.status === 503) {
    throw new Error('OpenAI service unavailable.');
  }
  throw new Error('Failed to filter message.');
}
```

**API Response Pattern (from Architecture):**
```typescript
// All API routes return { data, error } structure
interface ChatApiResponse {
  data: {
    userMessage: Message;
    assistantMessage: Message;
    filtered: boolean;
  } | null;
  error: {
    code: string;
    message: string;
  } | null;
}
```

### Previous Story Learnings (from Story 2.3)

**Patterns to follow:**
- Use `useQueryClient` from TanStack Query for cache invalidation
- Implement optimistic updates for instant user feedback
- Toast notifications using `sonner` for success/error feedback
- Handle loading states explicitly with isPending
- Import constants from centralized `constants/messages.ts`
- Controlled input component pattern (value/onChange props)
- On failure, preserve input for retry

**Dependencies confirmed working:**
- `@tanstack/react-query@^5.60.0` - useQuery, useMutation
- `@supabase/supabase-js@^2.94.0` - Database operations
- `sonner` - Toast notifications
- `lucide-react@^0.460.0` - Icons

### Project Structure Notes

**Files to create:**
```
lib/openai/
├── client.ts              <- NEW: OpenAI client singleton
├── prompts.ts             <- NEW: System prompts (filter, main)
├── filter-agent.ts        <- NEW: Filter agent service
├── filter-agent.test.ts   <- NEW: Filter agent tests
├── rejection-messages.ts  <- NEW: Rejection message constants

app/api/chat/
└── route.ts               <- NEW: Chat API endpoint

hooks/
├── use-chat.ts            <- NEW: Chat-specific hooks
├── use-chat.test.tsx      <- NEW: Chat hooks tests

types/
├── api.ts                 <- UPDATE: Add chat API types

constants/
├── messages.ts            <- UPDATE: Add API error messages
```

**Files to modify:**
```
components/chat/
├── ChatContainer.tsx      <- UPDATE: Integrate API
├── ChatContainer.test.tsx <- UPDATE: Test API integration

.env.example               <- UPDATE: Add OPENAI_API_KEY
```

### TypeScript Types

```typescript
// types/api.ts - Add chat types
export interface ChatRequest {
  conversationId: string;
  content: string;
}

export interface ChatResponse {
  data: {
    userMessage: Message;
    assistantMessage: Message;
    filtered: boolean;
  } | null;
  error: ApiError | null;
}

export interface FilterResult {
  allowed: boolean;
}

// lib/openai/filter-agent.ts
export interface FilterAgentResponse {
  allowed: boolean;
}
```

### Testing Strategy

**Unit Tests for Filter Agent:**
```typescript
// Test allowed messages
describe('filterMessage', () => {
  it('allows greetings', async () => {
    const result = await filterMessage('Hola');
    expect(result.allowed).toBe(true);
  });

  it('allows MSA queries', async () => {
    const result = await filterMessage('Necesito hacer un análisis MSA');
    expect(result.allowed).toBe(true);
  });

  it('allows statistics questions', async () => {
    const result = await filterMessage('¿Qué es Gauge R&R?');
    expect(result.allowed).toBe(true);
  });

  it('rejects cooking requests', async () => {
    const result = await filterMessage('Dame una receta de pasta');
    expect(result.allowed).toBe(false);
  });

  it('rejects unrelated coding help', async () => {
    const result = await filterMessage('Ayúdame con mi código React');
    expect(result.allowed).toBe(false);
  });
});
```

**Integration Tests for API Route:**
```typescript
// Mock OpenAI client for API route tests
vi.mock('@/lib/openai/client', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn()
      }
    }
  }
}));

describe('POST /api/chat', () => {
  it('returns rejection message for off-topic queries', async () => {
    mockFilterResponse(false);

    const response = await POST(mockRequest({
      conversationId: 'test-id',
      content: 'Dame una receta'
    }));

    const body = await response.json();
    expect(body.data.filtered).toBe(true);
    expect(body.data.assistantMessage.content).toContain('especializado en análisis estadístico');
  });
});
```

### Security Considerations

1. **API Key Security:** OpenAI API key stored in environment variable, never exposed to client
2. **Input Validation:** Validate conversationId is valid UUID, content is non-empty string
3. **Rate Limiting:** Consider implementing rate limiting in future (not MVP scope)
4. **Message Length:** Consider max message length to prevent abuse (not MVP scope)

### Performance Considerations

1. **Model Selection:** Using `gpt-4o-mini` for filter agent (faster, cheaper than gpt-4o)
2. **Edge Runtime:** Using Edge runtime for lower latency
3. **Parallel Operations:** Save user message while filtering (if possible without race conditions)

### Important Note: Scope Boundary

**This story implements:**
- Filter Agent (Agente 1) classification
- Rejection message for off-topic queries
- API route foundation for chat
- Database persistence of messages

**Story 2.5 will implement:**
- Main Agent (Agente 2) with streaming responses
- SSE (Server-Sent Events) for real-time response streaming
- Tool definitions for future analysis integration

### References

- [Source: prd.md#arquitectura-de-agentes-mvp] - FR-AGT1, FR-AGT2, FR-AGT3 specifications
- [Source: prd.md#arquitectura-técnica] - Two-agent architecture diagram
- [Source: architecture.md#streaming-con-sse] - API route structure with streaming (prep for 2.5)
- [Source: architecture.md#api-y-comunicación] - API patterns and structure
- [Source: architecture.md#patrones-de-implementación] - Error handling, response format
- [Source: epics.md#story-24-filter-agent-integration] - Story requirements and ACs
- [Source: 2-3-chat-interface-message-display.md] - Previous story patterns and learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation proceeded without issues

### Completion Notes List

- Implemented OpenAI client singleton with getOpenAIClient() function supporting timeout (30s) and retries (2)
- Created comprehensive FILTER_SYSTEM_PROMPT in Spanish covering allowed topics (greetings, MSA, statistics, Lean Six Sigma) and rejected topics (cooking, entertainment, politics, unrelated coding)
- Implemented filterMessage() function using gpt-4o-mini with structured JSON output (`response_format: { type: 'json_schema' }`) for guaranteed boolean response
- Created REJECTION_MESSAGE constant matching PRD specification exactly in Spanish
- Implemented /api/chat POST endpoint with Edge runtime, input validation, filter agent integration, and database persistence
- Created useSendChatMessage hook with optimistic updates, cache management, and error handling via toast notifications
- Updated ChatContainer to use new API-based hook instead of direct database calls
- Added API_ERRORS constants for Spanish error messages
- Added ChatRequest, ChatResponse, ChatResponseData, and FilterResult TypeScript types
- All 42 new tests pass (21 in lib/openai/, 8 in app/api/chat/, 4 in hooks/use-chat, 9 in ChatContainer)
- Full test suite passes with 409 tests total

### File List

**New Files:**
- lib/openai/client.ts
- lib/openai/client.test.ts
- lib/openai/prompts.ts
- lib/openai/prompts.test.ts
- lib/openai/filter-agent.ts
- lib/openai/filter-agent.test.ts
- lib/openai/rejection-messages.ts
- lib/openai/rejection-messages.test.ts
- app/api/chat/route.ts
- app/api/chat/route.test.ts
- hooks/use-chat.ts
- hooks/use-chat.test.tsx

**Modified Files:**
- lib/openai/index.ts (updated exports)
- components/chat/ChatContainer.tsx (API integration)
- components/chat/ChatContainer.test.tsx (updated mocks)
- constants/messages.ts (added API_ERRORS)
- types/api.ts (added chat types)

## Code Review

### Review Date
2026-02-04

### Reviewer
Claude Opus 4.5 (Adversarial Code Review)

### Issues Found

| ID | Severity | Category | File | Description | Status |
|----|----------|----------|------|-------------|--------|
| H1 | HIGH | Security | app/api/chat/route.ts | Missing authentication check - API endpoint accessible without auth | ✅ FIXED |
| H2 | HIGH | Testing | lib/openai/client.ts | Missing resetOpenAIClient() for test isolation | ✅ FIXED |
| H3 | HIGH | Security | app/api/chat/route.ts | No UUID validation for conversationId | ✅ FIXED |
| H4 | HIGH | Standards | app/api/chat/route.ts | Not using API_ERRORS constants for error codes | ✅ FIXED |
| M1 | MEDIUM | Types | hooks/use-chat.ts | Duplicate ChatResponse definition (also in types/api.ts) | ✅ FIXED |
| M2 | MEDIUM | Security | app/api/chat/route.ts | No max length validation for message content | ✅ FIXED |
| M3 | MEDIUM | Testing | app/api/chat/route.test.ts | Missing authentication tests | ✅ FIXED |
| M4 | MEDIUM | Testing | app/api/chat/route.test.ts | Missing validation tests for UUID format | ✅ FIXED |
| L1 | LOW | Documentation | lib/openai/client.ts | Missing JSDoc for exported functions | Not Fixed |
| L2 | LOW | Performance | lib/openai/filter-agent.ts | Could add temperature: 0 for deterministic classification | Not Fixed |
| L3 | LOW | Code Style | app/api/chat/route.ts | Long function could be split into smaller helpers | Not Fixed |

### Fixes Applied

1. **H1 - Authentication**: Added Supabase auth check using `createServerClient` from `@supabase/ssr` to verify user before processing messages
2. **H2 - Test Reset**: Added `resetOpenAIClient()` function to reset singleton between tests
3. **H3 - UUID Validation**: Added UUID regex validation (`/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`)
4. **H4 - API_ERRORS**: Updated error responses to use `ERROR_CODES.UNAUTHORIZED`, `ERROR_CODES.VALIDATION_ERROR`, and added `OPENAI_UNAVAILABLE` constant
5. **M1 - Type Duplication**: Removed local ChatResponse definition in use-chat.ts, now imports from `@/types/api`
6. **M2 - Max Length**: Added `MAX_MESSAGE_LENGTH = 10000` constant with validation
7. **M3 & M4 - Tests**: Added authentication tests and UUID validation tests to route.test.ts

### Test Results After Fixes
- All 413 tests pass
- No regressions introduced
- Linter passes with no errors

### Low Severity Items (Not Fixed)

These items are documented for future consideration:
- L1: JSDoc can be added in a documentation pass
- L2: Temperature setting is fine at default for this use case
- L3: Function length is acceptable for this MVP scope

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-02-04 | Story 2.4 implementation complete - Filter Agent with API integration | Claude Opus 4.5 |
| 2026-02-04 | Code review: Fixed 8 issues (4 HIGH, 4 MEDIUM) - Added auth, UUID validation, max length, test isolation | Claude Opus 4.5 |
