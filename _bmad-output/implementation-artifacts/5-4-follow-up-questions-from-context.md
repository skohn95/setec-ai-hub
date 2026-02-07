# Story 5.4: Follow-up Questions from Context

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to ask follow-up questions about my results**,
So that **I can deepen my understanding without re-running the analysis**.

**FRs covered:** FR35

## Acceptance Criteria

1. **Given** analysis results have been presented in the conversation, **When** the user asks a follow-up question (e.g., "¿Qué puedo hacer para mejorar?"), **Then** the agent answers using the conversation context, **And** the agent references the specific results from the previous analysis, **And** no new tool invocation occurs (unless user uploads a new file)

2. **Given** the user asks for clarification on a specific metric, **When** they ask "¿Qué significa el número de categorías distintas?", **Then** the agent provides a clear explanation, **And** the agent relates it to their specific ndc value from the results, **And** the explanation is educational and contextual

3. **Given** the user asks about methodology, **When** they ask "¿Por qué usaste Gauge R&R?", **Then** the agent explains the choice of analysis method, **And** relates it to the user's stated goal (MSA analysis), **And** may mention alternatives if relevant

4. **Given** the user asks about next steps, **When** they ask "¿Qué hago ahora?", **Then** the agent provides practical guidance based on their results, **And** suggestions are specific to their %GRR level and dominant variation source, **And** the agent may suggest re-measuring after improvements

5. **Given** the conversation history is long, **When** the agent responds to follow-up questions, **Then** it correctly references the most recent analysis results, **And** if multiple analyses exist, it clarifies which one it's discussing, **And** the agent maintains coherent context throughout the conversation

## Tasks / Subtasks

- [x] **Task 1: Enhance System Prompt for Follow-up Context Awareness** (AC: #1, #5)
  - [x] Review current MAIN_SYSTEM_PROMPT in `lib/openai/prompts.ts`
  - [x] Add dedicated section for handling follow-up questions
  - [x] Include instructions to reference previous analysis results by context
  - [x] Add guidance to clarify which analysis when multiple exist
  - [x] Add instructions to NOT re-invoke tools for follow-up questions
  - [x] Add tests for new prompt content in `prompts.test.ts`

- [x] **Task 2: Enhance Conversation Context Building** (AC: #1, #2, #5)
  - [x] Review `getConversationContext` in `lib/openai/main-agent.ts`
  - [x] Consider including message metadata (chartData summary) in context for follow-ups
  - [x] Ensure analysis results are accessible in conversation history
  - [x] Add helper to extract last analysis results from conversation
  - [x] Add tests for context building with analysis metadata

- [x] **Task 3: Add Follow-up Response Instructions to System Prompt** (AC: #2, #3, #4)
  - [x] Add section "PREGUNTAS DE SEGUIMIENTO" to MAIN_SYSTEM_PROMPT
  - [x] Include specific guidance for metric clarification questions
  - [x] Include methodology explanation guidelines
  - [x] Include next steps guidance with %GRR thresholds
  - [x] Ensure prompt instructs agent to be educational and contextual
  - [x] Update tests

- [x] **Task 4: Verify Tool Non-Invocation for Follow-ups** (AC: #1)
  - [x] Add integration test: follow-up question after analysis does NOT trigger tool
  - [x] Verify agent uses conversation history instead of calling analyze tool
  - [x] Test that new file upload DOES trigger tool (expected behavior)
  - [x] Add test in `lib/openai/main-agent.test.ts`

- [x] **Task 5: Create Follow-up Scenario Integration Tests** (AC: #1, #2, #3, #4, #5)
  - [x] Create test file `lib/openai/follow-up.test.ts` for integration tests
  - [x] Test: User asks "¿Qué puedo hacer para mejorar?" → No tool call, contextual answer
  - [x] Test: User asks "¿Qué significa el ndc?" → Educational explanation with their value
  - [x] Test: User asks "¿Por qué Gauge R&R?" → Methodology explanation
  - [x] Test: User asks "¿Qué hago ahora?" → Practical next steps based on results
  - [x] Test: Multiple analyses → Agent clarifies which one

- [x] **Task 6: Verify UI Behavior for Follow-up Messages** (AC: #1)
  - [x] Verify ChatContainer correctly handles follow-up responses (no chart rendering unless new analysis)
  - [x] Verify isAnalyzing state remains false for follow-up questions
  - [x] Add test in `components/chat/ChatContainer.test.tsx` for follow-up scenario
  - [x] Ensure streaming works correctly for follow-up responses

- [x] **Task 7: Documentation and Edge Cases** (AC: #5)
  - [x] Document follow-up question handling in code comments
  - [x] Handle edge case: user asks follow-up but no previous analysis exists
  - [x] Handle edge case: conversation context exceeds MAX_CONTEXT_MESSAGES
  - [x] Ensure graceful handling when analysis results are truncated from context

## Dev Notes

### Critical Architecture Patterns

**Story 5.4 Focus:**
This story ensures the AI agent correctly answers follow-up questions about analysis results using conversation context, without unnecessarily re-invoking the analysis tool.

**Current Architecture (from Stories 2.5, 4.4, 5.1-5.3):**
- Main Agent receives up to 10 recent messages as context (`MAX_CONTEXT_MESSAGES`)
- Analysis results are stored in message metadata (chartData, results)
- Agent has tool access but should only invoke when file is uploaded AND analysis requested
- Streaming SSE delivers responses to frontend

**Key Insight:**
The core infrastructure is already in place. This story is primarily about:
1. Enhancing the system prompt to guide follow-up behavior
2. Ensuring conversation context properly includes analysis information
3. Verifying the agent doesn't unnecessarily call the analyze tool
4. Adding tests to validate follow-up scenarios

### System Prompt Enhancement Strategy

**Current MAIN_SYSTEM_PROMPT sections:**
- IDENTIDAD
- CAPACIDADES
- HERRAMIENTA DE ANÁLISIS
- PRESENTACIÓN DE RESULTADOS DE ANÁLISIS
- MANEJO DE ERRORES DE VALIDACIÓN
- ARCHIVOS MÚLTIPLES
- INSTRUCCIONES GENERALES

**New section to add: PREGUNTAS DE SEGUIMIENTO**
```
PREGUNTAS DE SEGUIMIENTO:
Cuando el usuario hace preguntas después de recibir resultados de análisis:

1. USA EL CONTEXTO - Revisa los mensajes anteriores para encontrar los resultados
2. NO RE-INVOQUES LA HERRAMIENTA - Solo usa 'analyze' si hay un NUEVO archivo
3. REFERENCIA VALORES ESPECÍFICOS - Menciona los números exactos de su análisis
4. SÉ EDUCATIVO - Explica conceptos en términos simples

TIPOS DE PREGUNTAS DE SEGUIMIENTO:

Clarificación de métricas:
- "¿Qué significa el ndc?" → Explica número de categorías distintas y relaciona con SU valor específico
- "¿Qué es la repetibilidad?" → Define y relaciona con SU porcentaje de repetibilidad

Metodología:
- "¿Por qué Gauge R&R?" → Explica que es el estándar AIAG para evaluar sistemas de medición
- "¿Hay otras opciones?" → Menciona alternativas (ANOVA, X-bar R) pero explica por qué G R&R es apropiado

Próximos pasos:
- "¿Qué hago ahora?" → Recomendaciones específicas basadas en SU %GRR y fuente dominante de variación
- "¿Cómo mejoro?" → Acciones concretas según si repetibilidad o reproducibilidad es mayor

Múltiples análisis:
- Si hay varios análisis en la conversación, pregunta: "¿Te refieres al análisis de [nombre_archivo]?"
- Por defecto, asume el análisis más reciente
```

### Conversation Context Building Enhancement

**Current implementation (main-agent.ts:41-52):**
```typescript
export function getConversationContext(
  messages: MessageRow[]
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES)
  return recentMessages.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }))
}
```

**Enhancement needed:**
Messages with analysis results have metadata containing chartData and results. The agent needs access to these for follow-up questions. Options:

**Option A (Recommended): Append results summary to assistant message content**
When the agent presents results, the content already includes the numerical values. Follow-up questions should work with the existing content.

**Option B: Include metadata summary in context**
```typescript
export function getConversationContext(
  messages: MessageRow[]
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES)
  return recentMessages.map((msg) => {
    let content = msg.content
    // If message has analysis results, append summary
    if (msg.metadata?.analysisResults) {
      content += `\n[Resultados del análisis: ${JSON.stringify(msg.metadata.analysisResults)}]`
    }
    return {
      role: msg.role as 'user' | 'assistant',
      content,
    }
  })
}
```

**Recommendation:** Start with Option A (current behavior) and verify with tests. The agent already receives the full message content which should include result presentation. Only enhance to Option B if tests reveal context gaps.

### Tool Non-Invocation Verification

**Key behavior to verify:**
1. Follow-up question without new file → NO tool call
2. Follow-up question with new file → Tool call (expected)
3. "Analiza mi archivo" without file → No tool call, ask for file

**Test approach:**
Mock the OpenAI response to verify tool_calls are not generated for follow-up scenarios.

### File Context Integration

**Current flow (route.ts:196):**
```typescript
const fileContext = await buildFileContext(conversationId)
// ... later ...
const systemPrompt = MAIN_SYSTEM_PROMPT + fileContext
```

The file context lists available files. For follow-ups, this context helps the agent know what files exist but shouldn't trigger analysis unless user explicitly requests it.

### Edge Cases to Handle

1. **No previous analysis:** User asks "¿Qué significa el GRR?" without having done analysis
   - Agent should explain the concept generally
   - Suggest: "Si deseas ver tu GRR, sube tu archivo de datos MSA"

2. **Context overflow:** Conversation has >10 messages, analysis results truncated
   - Agent should ask: "No veo los resultados de tu análisis anterior. ¿Podrías volver a subir el archivo?"

3. **Multiple analyses:** User has 3 files analyzed, asks about "los resultados"
   - Agent should clarify: "Veo que hiciste varios análisis. ¿Te refieres al de [archivo más reciente] o a otro?"

4. **Ambiguous follow-up:** User asks "¿Por qué salió mal?"
   - Agent should infer from context (last analysis) and provide specific guidance

### Previous Story Learnings (Story 5.3)

From the completed Story 5.3:
- Charts export via html2canvas working
- Multi-file analysis verified - each file creates separate message with metadata
- Metadata persistence verified - chartData and results saved to message.metadata
- Visual delineation with Card wrapper for analysis results
- 806 tests passing after code review fixes

**Key files from 5.3 relevant to 5.4:**
- `app/api/chat/route.ts` - Main streaming handler, passes conversationHistory to agent
- `lib/openai/main-agent.ts` - streamMainAgentWithTools with MAX_CONTEXT_MESSAGES=10
- `lib/openai/prompts.ts` - MAIN_SYSTEM_PROMPT to enhance
- `hooks/use-chat.ts` - Client-side streaming handler

### Testing Strategy

**Unit Tests:**
- `lib/openai/prompts.test.ts` - Verify new follow-up section exists
- `lib/openai/main-agent.test.ts` - Context building with metadata

**Integration Tests:**
- `lib/openai/follow-up.test.ts` - New file for follow-up scenarios
- Mock OpenAI responses for different follow-up questions
- Verify no tool_calls in response

**E2E Considerations:**
- Manual testing recommended for full conversation flow
- Verify agent responses are contextual and educational

### Mock Requirements

```typescript
// Mock for OpenAI follow-up response (no tool calls)
const mockFollowUpResponse = {
  choices: [{
    delta: { content: 'El número de categorías distintas (ndc) de 5.2 en tu análisis indica...' },
    finish_reason: 'stop'  // NOT 'tool_calls'
  }]
}

// Mock for OpenAI response that WOULD trigger tool (new file scenario)
const mockNewFileResponse = {
  choices: [{
    delta: {
      tool_calls: [{
        index: 0,
        id: 'call_123',
        function: { name: 'analyze', arguments: '{"analysis_type":"msa","file_id":"..."}' }
      }]
    },
    finish_reason: 'tool_calls'
  }]
}
```

### Dependencies

**No new dependencies required.** This story enhances existing functionality.

**Existing dependencies used:**
- OpenAI SDK (chat completions with streaming)
- TanStack Query (conversation/message caching)
- Vitest (testing)

### File Structure Changes

**Files to Modify:**
- `lib/openai/prompts.ts` - Add PREGUNTAS DE SEGUIMIENTO section
- `lib/openai/prompts.test.ts` - Add tests for new section
- `lib/openai/main-agent.ts` - Potentially enhance getConversationContext
- `lib/openai/main-agent.test.ts` - Add follow-up context tests

**Files to Create:**
- `lib/openai/follow-up.test.ts` - Integration tests for follow-up scenarios

**Files to Verify (no changes expected):**
- `app/api/chat/route.ts` - Verify context passing works
- `hooks/use-chat.ts` - Verify UI handles follow-ups correctly
- `components/chat/ChatContainer.tsx` - Verify no chart rendering for follow-ups

### Project Structure Notes

- All changes follow existing patterns from Stories 5.1-5.3
- Tests co-located with source files
- All UI text remains in Spanish
- No changes to database schema required
- No new API endpoints needed

### References

- [Source: epics.md#story-54-follow-up-questions-from-context] - Story requirements and ACs
- [Source: architecture.md#frontend-architecture] - Component patterns
- [Source: architecture.md#api-y-comunicación] - SSE streaming patterns
- [Source: 5-3-chart-export-multi-file-support.md] - Previous story learnings
- [Source: prd.md#fr35] - Follow-up questions requirement
- [Source: lib/openai/prompts.ts] - Current system prompt structure
- [Source: lib/openai/main-agent.ts:18] - MAX_CONTEXT_MESSAGES = 10
- [Source: app/api/chat/route.ts:189-196] - Conversation history passed to agent

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No debug issues encountered during implementation.

### Completion Notes List

1. **Task 1**: Added "PREGUNTAS DE SEGUIMIENTO" section to MAIN_SYSTEM_PROMPT with comprehensive guidance for handling follow-up questions. Added 9 new tests covering follow-up question handling requirements.

2. **Task 2**: Enhanced `getConversationContext` to include analysis results metadata in context. Added `getLastAnalysisResults` helper function to extract most recent analysis from conversation. Added 4 new tests.

3. **Task 3**: Verified all follow-up prompt requirements from Task 1 cover AC #2, #3, #4. All prompt tests pass (33 total).

4. **Task 4**: Added integration tests verifying tool non-invocation for follow-up questions vs tool invocation for new file analysis. Added 3 new tests in main-agent.test.ts.

5. **Task 5**: Created comprehensive `lib/openai/follow-up.test.ts` with 10 integration tests covering all follow-up scenarios (improvement questions, metric clarification, methodology, next steps, multiple analyses).

6. **Task 6**: Added 3 UI behavior tests in ChatContainer.test.tsx verifying follow-up responses don't render charts, input remains enabled, and streaming works correctly for follow-ups.

7. **Task 7**: Added `hasRecentAnalysisInContext` helper function for edge case detection. Added comprehensive code documentation. Added 5 new edge case tests.

### File List

**Modified:**
- lib/openai/prompts.ts - Added "PREGUNTAS DE SEGUIMIENTO" section with follow-up handling instructions
- lib/openai/prompts.test.ts - Added 9 tests for follow-up questions handling
- lib/openai/main-agent.ts - Added getLastAnalysisResults, hasRecentAnalysisInContext helpers; enhanced getConversationContext for metadata; fixed metadata key consistency
- lib/openai/main-agent.test.ts - Added 12 tests for context building, edge cases, and tool non-invocation; fixed unused variable warnings
- lib/openai/index.ts - Added exports for getLastAnalysisResults, hasRecentAnalysisInContext
- lib/openai/follow-up.test.ts - Fixed unused variable warnings
- components/chat/ChatContainer.test.tsx - Added 3 tests for follow-up UI behavior

**Created:**
- lib/openai/follow-up.test.ts - New file with 10 integration tests for follow-up scenarios

### Change Log

- 2026-02-06: Implemented Story 5.4 - Follow-up Questions from Context
  - Enhanced system prompt with dedicated follow-up handling section
  - Added conversation context enhancement for analysis metadata
  - Created helper functions for analysis extraction and context checking
  - Verified UI correctly handles follow-up responses (no chart rendering)
  - Added comprehensive test coverage (34 new tests across 4 files)
  - All 841 tests passing, no regressions

- 2026-02-06: Code Review Fixes Applied
  - Fixed metadata key inconsistency: `getConversationContext` now checks both 'analysisResults' and 'results' keys
  - Fixed metadata key inconsistency: `getLastAnalysisResults` now checks both keys for compatibility
  - Added missing exports: `getLastAnalysisResults`, `hasRecentAnalysisInContext` now exported from lib/openai/index.ts
  - Fixed unused variable warnings: Changed `_event` to `event` with explicit `void event` in test loops
  - Enhanced JSDoc documentation with examples and clearer return type descriptions
  - All 841 tests still passing after fixes

