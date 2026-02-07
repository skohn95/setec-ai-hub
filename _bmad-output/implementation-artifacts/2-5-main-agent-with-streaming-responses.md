# Story 2.5: Main Agent with Streaming Responses

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to receive streaming responses from the AI assistant**,
So that **I see the response being generated in real-time and the interaction feels responsive**.

**FRs covered:** FR-AGT4, FR-AGT5

## Acceptance Criteria

1. **Given** a message passes the Filter Agent, **When** the message is sent to the Main Agent (gpt-4o), **Then** the response is streamed back to the client via Server-Sent Events (SSE), **And** the user sees the response appearing word-by-word in real-time, **And** a typing indicator shows while streaming is in progress

2. **Given** the Main Agent system prompt needs to be defined, **When** the prompt is configured, **Then** it establishes the agent's identity as a Lean Six Sigma statistics assistant, **And** it specifies the tone: helpful, pedagogical, professional, in Spanish, **And** it describes available capabilities (MSA analysis, statistical guidance), **And** it instructs the agent to guide users to the Templates section when they need to perform an analysis

3. **Given** a user asks a statistics question without uploading a file, **When** the Main Agent responds, **Then** the agent provides a helpful conversational answer, **And** no tool invocation occurs, **And** the response is educational and contextual

4. **Given** a user asks about performing an MSA analysis, **When** the Main Agent responds (without file uploaded), **Then** the agent explains the MSA process, **And** guides the user: "Para realizar un análisis MSA, ve a la sección de Plantillas y descarga la plantilla de MSA. Llénala con tus datos y súbela aquí."

5. **Given** streaming encounters an error mid-response, **When** the error is detected, **Then** the partial response is preserved, **And** an error indicator appears, **And** the user can retry or continue the conversation

6. **Given** the OpenAI API is unavailable, **When** a request fails, **Then** the user sees a friendly error message: "El servicio no está disponible en este momento. Por favor intenta de nuevo en unos minutos.", **And** the message is not marked as sent successfully

## Tasks / Subtasks

- [x] **Task 1: Create Main Agent System Prompt** (AC: #2, #3, #4)
  - [x] Add `MAIN_SYSTEM_PROMPT` constant to `lib/openai/prompts.ts`
  - [x] Establish identity: Lean Six Sigma statistics assistant named "Asistente Setec"
  - [x] Define tone: helpful, pedagogical, professional, always in Spanish
  - [x] List capabilities: MSA analysis, Gauge R&R, control charts, statistical guidance
  - [x] Include instruction to guide users to Templates section for analysis
  - [x] Reference that analysis tools require file upload (Epic 3 & 4)

- [x] **Task 2: Create SSE Streaming Utilities** (AC: #1, #5, #6)
  - [x] Create `lib/openai/streaming.ts` with SSE helpers
  - [x] Define `StreamChunk` type: `{ type: 'text' | 'error' | 'done', content?: string }`
  - [x] Create `createSSEResponse(stream: ReadableStream)` helper
  - [x] Create `encodeSSEMessage(data: StreamChunk)` helper
  - [x] Handle proper SSE format: `data: {json}\n\n`
  - [x] Export utilities for use in API route

- [x] **Task 3: Create Main Agent Service** (AC: #1, #2, #3, #4)
  - [x] Create `lib/openai/main-agent.ts`
  - [x] Function `streamMainAgentResponse(messages: Message[]): AsyncGenerator<string>`
  - [x] Use `gpt-4o` model for quality responses
  - [x] Use OpenAI streaming mode (`stream: true`)
  - [x] Yield text chunks as they arrive
  - [x] Handle partial responses on error
  - [x] Include conversation history in context (last N messages)

- [x] **Task 4: Refactor Chat API Route for SSE Streaming** (AC: #1, #5, #6)
  - [x] Update `app/api/chat/route.ts` to support streaming
  - [x] Keep filter agent logic unchanged (non-streaming)
  - [x] Replace placeholder response with Main Agent streaming call
  - [x] Return SSE stream for allowed messages
  - [x] Return JSON response for filtered messages (no change needed)
  - [x] Handle streaming errors gracefully with partial content preservation
  - [x] Save complete assistant message to database after stream completes
  - [x] Update conversation `updated_at` timestamp

- [x] **Task 5: Create useStreamingChat Hook** (AC: #1, #5)
  - [x] Create or update `hooks/use-chat.ts` with streaming support
  - [x] `useStreamingChat(conversationId: string)` hook
  - [x] Consume SSE stream from `/api/chat`
  - [x] Accumulate text chunks into complete message
  - [x] Expose `streamingContent` state for real-time display
  - [x] Expose `isStreaming` boolean state
  - [x] Handle stream completion and errors
  - [x] Update messages cache when stream completes

- [x] **Task 6: Create StreamingMessage Component** (AC: #1)
  - [x] Create `components/chat/StreamingMessage.tsx`
  - [x] Props: `content: string`, `isComplete: boolean`
  - [x] Display content with typing cursor animation while streaming
  - [x] Remove cursor when isComplete=true
  - [x] Match ChatMessage styling for assistant messages
  - [x] Support markdown rendering (future-proof)

- [x] **Task 7: Update ChatContainer for Streaming** (AC: #1, #5)
  - [x] Update `components/chat/ChatContainer.tsx`
  - [x] Integrate `useStreamingChat` hook
  - [x] Show StreamingMessage during active stream
  - [x] Convert StreamingMessage to regular ChatMessage on completion
  - [x] Handle streaming errors with retry option
  - [x] Ensure auto-scroll works during streaming
  - [x] Show loading skeleton only before stream starts (not during)

- [x] **Task 8: Add Streaming Types and Constants** (AC: all)
  - [x] Update `types/api.ts` with streaming types
  - [x] Add `StreamChunk` interface
  - [x] Add `StreamState` type: `'idle' | 'streaming' | 'complete' | 'error'`
  - [x] Update `constants/messages.ts` with streaming-related messages
  - [x] Add `STREAMING_MESSAGES.TYPING` cursor text (optional)
  - [x] Add `STREAMING_MESSAGES.ERROR` for mid-stream failures

- [x] **Task 9: Write Unit Tests** (AC: all)
  - [x] Test Main Agent prompt includes all required topics
  - [x] Test Main Agent responds to statistics questions
  - [x] Test Main Agent guides to Templates for MSA requests
  - [x] Test SSE encoder produces valid format
  - [x] Test API route returns SSE stream for allowed messages
  - [x] Test API route still returns JSON for filtered messages
  - [x] Test useStreamingChat accumulates chunks correctly
  - [x] Test useStreamingChat handles stream completion
  - [x] Test useStreamingChat handles stream errors
  - [x] Test StreamingMessage shows cursor while streaming
  - [x] Test StreamingMessage hides cursor when complete
  - [x] Test ChatContainer shows streaming content in real-time
  - [x] Test ChatContainer handles mid-stream errors gracefully
  - [x] Test assistant message is saved to database after stream completes

## Dev Notes

### Critical Architecture Patterns

**Two-Agent Architecture - Main Agent (from PRD & Architecture):**
```
┌─────────────────────────────────────────────────────────────────┐
│                        USUARIO                                  │
│                     envía mensaje                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  AGENTE 1 (Filtro) - Story 2.4 ✅ COMPLETE                      │
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
              [Mensaje       ┌─────────────────────────────────────┐
               rechazo       │  AGENTE 2 (Principal) ← THIS STORY  │
               contextual]   │  ───────────────────                │
                             │  • Model: gpt-4o (quality)          │
                             │  • Streaming SSE responses          │
                             │  • Tools: analyze (Epic 4)          │
                             │  • Conversational + pedagogical     │
                             └─────────────────────────────────────┘
```

**SSE Streaming Pattern (from Architecture):**
```typescript
// app/api/chat/route.ts - Streaming implementation
import { OpenAI } from 'openai';

export async function POST(req: Request) {
  // ... filter logic (Story 2.4) ...

  if (filterResult.allowed) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const openai = new OpenAI();

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [...conversationHistory, { role: 'user', content: message }],
          stream: true,
        });

        let fullContent = '';

        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            fullContent += content;
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'text', content })}\n\n`
            ));
          }
        }

        // Save complete message to database
        await createMessage(conversationId, 'assistant', fullContent);

        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'done' })}\n\n`
        ));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
}
```

### Main Agent System Prompt Design

**Key Requirements (from PRD):**
- Identity: Lean Six Sigma statistics assistant
- Tone: helpful, pedagogical, professional, Spanish
- Capabilities: MSA analysis, statistical guidance, quality concepts
- Guidance: direct users to Templates section for analysis

**Prompt Template:**
```typescript
export const MAIN_SYSTEM_PROMPT = `Eres el Asistente Setec, un experto en análisis estadístico para Lean Six Sigma.

IDENTIDAD:
- Nombre: Asistente Setec
- Especialidad: Análisis del Sistema de Medición (MSA), Gauge R&R, gráficos de control, pruebas de hipótesis
- Tono: profesional, pedagógico, amigable, siempre en español

CAPACIDADES:
- Responder preguntas sobre conceptos estadísticos y de calidad
- Explicar metodologías de análisis MSA y Gauge R&R
- Interpretar resultados estadísticos cuando el usuario los proporciona
- Guiar en mejores prácticas de Lean Six Sigma

LIMITACIONES ACTUALES:
- Para realizar un análisis MSA, el usuario debe:
  1. Ir a la sección de Plantillas
  2. Descargar la plantilla MSA
  3. Llenarla con sus datos
  4. Subirla en el chat

INSTRUCCIONES:
- Siempre responde en español
- Sé pedagógico: explica conceptos de forma clara y accesible
- Si el usuario pregunta cómo hacer un análisis, guíalo a la sección de Plantillas
- Proporciona ejemplos prácticos cuando sea útil
- Sé conciso pero completo en tus respuestas`;
```

### Conversation History Management

**Context Window Strategy:**
```typescript
// Include last N messages for context
const MAX_CONTEXT_MESSAGES = 10;

function getConversationContext(messages: Message[]): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  // Get last N messages
  const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES);

  // Convert to OpenAI format
  return recentMessages.map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));
}
```

### Frontend Streaming Consumption

**useStreamingChat Hook Pattern:**
```typescript
// hooks/use-chat.ts
export function useStreamingChat(conversationId: string) {
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const sendMessage = async (content: string) => {
    setIsStreaming(true);
    setStreamingContent('');
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content }),
      });

      // Check if it's a streaming response
      const contentType = response.headers.get('Content-Type');

      if (contentType?.includes('text/event-stream')) {
        // Handle SSE stream
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;

          const text = decoder.decode(value);
          const lines = text.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'text') {
                setStreamingContent(prev => prev + data.content);
              } else if (data.type === 'done') {
                // Invalidate messages query to get final message
                queryClient.invalidateQueries({
                  queryKey: queryKeys.messages.byConversation(conversationId)
                });
              } else if (data.type === 'error') {
                setError(data.content);
              }
            }
          }
        }
      } else {
        // Handle JSON response (filtered messages)
        const json = await response.json();
        if (json.error) {
          setError(json.error.message);
        } else {
          queryClient.invalidateQueries({
            queryKey: queryKeys.messages.byConversation(conversationId)
          });
        }
      }
    } catch (err) {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsStreaming(false);
    }
  };

  return {
    sendMessage,
    streamingContent,
    isStreaming,
    error,
    clearError: () => setError(null),
  };
}
```

### Error Handling During Streaming

**Partial Response Preservation:**
```typescript
// If error occurs mid-stream, save partial content
try {
  for await (const chunk of response) {
    // ... accumulate content ...
  }
} catch (error) {
  // Save partial content to database
  if (fullContent.length > 0) {
    await createMessage(conversationId, 'assistant', fullContent + '\n\n[Respuesta incompleta - error de conexión]');
  }

  // Send error event to client
  controller.enqueue(encoder.encode(
    `data: ${JSON.stringify({ type: 'error', content: 'Error durante la respuesta. El contenido parcial se ha guardado.' })}\n\n`
  ));
}
```

### Database Schema Reference

**Messages Table (from Architecture - already exists):**
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',  -- For future: tool_calls, file_refs, chart_data
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### TypeScript Types

```typescript
// types/api.ts - Add streaming types
export interface StreamChunk {
  type: 'text' | 'error' | 'done';
  content?: string;
}

export type StreamState = 'idle' | 'streaming' | 'complete' | 'error';

// lib/openai/main-agent.ts
export interface MainAgentOptions {
  conversationHistory: Message[];
  userMessage: string;
}
```

### Previous Story Learnings (from Story 2.4)

**Patterns to follow:**
- Filter agent logic unchanged - works well with gpt-4o-mini structured output
- Authentication check at start of API route using `createServerClient`
- UUID validation with regex pattern
- Message length validation (MAX_MESSAGE_LENGTH = 10000)
- Save user message before processing (already implemented)
- Error responses use API_ERRORS constants from `constants/messages.ts`
- Edge runtime for better performance

**Dependencies confirmed working:**
- `openai@^4.70.0` - OpenAI SDK with streaming support
- `@supabase/ssr@^0.5.0` - Server-side Supabase client
- `@tanstack/react-query@^5.60.0` - Query cache management
- `sonner` - Toast notifications

**Current API Route Structure (from Story 2.4):**
```typescript
// app/api/chat/route.ts - Current state
export async function POST(req: NextRequest) {
  // 0. Auth check ✅
  // 1. Save user message ✅
  // 2. Filter message ✅
  // 3. If filtered → return rejection JSON ✅
  // 4. If allowed → placeholder response ❌ REPLACE WITH STREAMING
}
```

### Project Structure Notes

**Files to create:**
```
lib/openai/
├── main-agent.ts              <- NEW: Main agent streaming service
├── main-agent.test.ts         <- NEW: Main agent tests
├── streaming.ts               <- NEW: SSE utilities
├── streaming.test.ts          <- NEW: Streaming utilities tests
├── prompts.ts                 <- UPDATE: Add MAIN_SYSTEM_PROMPT

components/chat/
├── StreamingMessage.tsx       <- NEW: Streaming message display
├── StreamingMessage.test.tsx  <- NEW: Streaming message tests
├── index.ts                   <- UPDATE: Add StreamingMessage export
```

**Files to modify:**
```
app/api/chat/
├── route.ts                   <- UPDATE: Add streaming response
├── route.test.ts              <- UPDATE: Add streaming tests

hooks/
├── use-chat.ts                <- UPDATE: Add streaming hook
├── use-chat.test.tsx          <- UPDATE: Add streaming tests

components/chat/
├── ChatContainer.tsx          <- UPDATE: Integrate streaming
├── ChatContainer.test.tsx     <- UPDATE: Streaming integration tests

types/
├── api.ts                     <- UPDATE: Add streaming types

constants/
├── messages.ts                <- UPDATE: Add streaming messages

lib/openai/
├── index.ts                   <- UPDATE: Add new exports
```

### Alignment with Architecture

**From architecture.md:**
- SSE streaming using Edge runtime (already configured)
- OpenAI SDK with `stream: true` for responses
- TanStack Query for cache invalidation after stream completes
- Message persistence after stream completes (not during)

**Deviation Notes:**
- None expected - follows architecture patterns exactly

### Security Considerations

1. **Authentication:** API route already validates user auth (Story 2.4)
2. **Conversation Access:** RLS ensures users can only access own conversations
3. **Rate Limiting:** Consider implementing in future (not MVP scope)
4. **Content Moderation:** Filter agent handles topic filtering

### Performance Considerations

1. **Model Selection:** Using `gpt-4o` for quality responses (Main Agent)
2. **Edge Runtime:** Already configured for lower latency
3. **Streaming:** SSE provides better UX than waiting for complete response
4. **Context Management:** Limit conversation history to last 10 messages

### Testing Strategy

**Unit Tests (Vitest):**
- Mock OpenAI SDK for deterministic testing
- Test SSE encoder output format
- Test streaming hook state management
- Test component rendering during streaming

**Integration Tests:**
- Test full flow: message → filter → main agent → stream → database save
- Test error handling at each stage

**Test Mocking Pattern:**
```typescript
// Mock OpenAI streaming response
vi.mock('@/lib/openai/client', () => ({
  getOpenAIClient: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn().mockReturnValue({
          [Symbol.asyncIterator]: async function* () {
            yield { choices: [{ delta: { content: 'Hola, ' } }] };
            yield { choices: [{ delta: { content: 'soy tu asistente.' } }] };
          },
        }),
      },
    },
  })),
}));
```

### Error Messages (Spanish)

```typescript
// Add to constants/messages.ts
export const STREAMING_MESSAGES = {
  ERROR_MIDSTREAM: 'Error durante la respuesta. El contenido parcial se ha guardado.',
  INCOMPLETE_RESPONSE: '[Respuesta incompleta - error de conexión]',
  CONNECTION_ERROR: 'Error de conexión. Intenta de nuevo.',
};
```

### Important Implementation Notes

**Stream Lifecycle:**
1. User sends message → API route receives
2. User message saved to DB (already done in Story 2.4)
3. Filter agent classifies (if rejected, return JSON immediately)
4. If allowed, start SSE stream
5. Main Agent generates response with streaming
6. Frontend accumulates chunks in real-time
7. On stream completion, save full assistant message to DB
8. Invalidate messages query to show final persisted message

**Response Type Detection:**
- Check `Content-Type` header to detect SSE vs JSON
- Filtered messages → JSON response (unchanged from Story 2.4)
- Allowed messages → SSE stream (new in this story)

### References

- [Source: prd.md#arquitectura-de-agentes-mvp] - FR-AGT4, FR-AGT5 specifications
- [Source: architecture.md#streaming-con-sse] - SSE streaming implementation pattern
- [Source: architecture.md#api-y-comunicación] - API route structure
- [Source: architecture.md#frontend-architecture] - TanStack Query cache management
- [Source: epics.md#story-25-main-agent-with-streaming-responses] - Story requirements and ACs
- [Source: 2-4-filter-agent-integration.md] - Previous story patterns and code structure

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation proceeded without blockers.

### Completion Notes List

- ✅ Task 1: Created MAIN_SYSTEM_PROMPT establishing "Asistente Setec" identity with pedagogical tone in Spanish
- ✅ Task 2: Created SSE streaming utilities (encodeSSEMessage, createSSEResponse) with proper format
- ✅ Task 3: Created Main Agent service with AsyncGenerator streaming, gpt-4o model, and conversation context management
- ✅ Task 4: Refactored chat API route - SSE streams for allowed messages, JSON for filtered, partial content preservation on errors
- ✅ Task 5: Created useStreamingChat hook with chunk accumulation, isStreaming state, and cache invalidation
- ✅ Task 6: Created StreamingMessage component with typing cursor animation matching ChatMessage styling
- ✅ Task 7: Updated ChatContainer to integrate streaming, show StreamingMessage during stream, auto-scroll
- ✅ Task 8: Added StreamChunk and StreamState types, STREAMING_MESSAGES constants
- ✅ Task 9: All 460 tests pass (35 test files) including comprehensive streaming tests

### Change Log

- 2026-02-04: Implemented Main Agent with SSE streaming responses (Story 2.5)

### File List

**New Files:**
- lib/openai/streaming.ts - SSE streaming utilities
- lib/openai/streaming.test.ts - Streaming utilities tests (9 tests)
- lib/openai/main-agent.ts - Main Agent service
- lib/openai/main-agent.test.ts - Main Agent tests (8 tests)
- components/chat/StreamingMessage.tsx - Streaming message component
- components/chat/StreamingMessage.test.tsx - StreamingMessage tests (6 tests)

**Modified Files:**
- lib/openai/prompts.ts - Added MAIN_SYSTEM_PROMPT
- lib/openai/prompts.test.ts - Added Main Agent prompt tests (8 new tests)
- lib/openai/index.ts - Added new exports
- app/api/chat/route.ts - Replaced placeholder with SSE streaming
- app/api/chat/route.test.ts - Added streaming tests
- hooks/use-chat.ts - Added useStreamingChat hook
- hooks/use-chat.test.tsx - Added streaming hook tests (7 new tests)
- components/chat/ChatContainer.tsx - Integrated streaming
- components/chat/ChatContainer.test.tsx - Added streaming integration tests (6 new tests)
- components/chat/index.ts - Added StreamingMessage export
- types/api.ts - Added StreamChunk, StreamState types
- constants/messages.ts - Added STREAMING_MESSAGES
