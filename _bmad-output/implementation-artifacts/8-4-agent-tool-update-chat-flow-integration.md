# Story 8.4: Agent Tool Update & Chat Flow Integration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **the AI agent to handle my capacity analysis requests seamlessly**,
So that **I receive clear interpretations and can ask follow-up questions**.

**FRs covered:** FR-CP3, FR-CP22, FR-CP23

## Acceptance Criteria

1. **Given** the analyze tool definition needs updating, **When** `lib/openai/tools.ts` is modified, **Then** the tool accepts `analysis_type: 'capacidad_proceso'` **And** the tool accepts optional `spec_limits: { lei: number, les: number }` **And** the tool description mentions process capability analysis

2. **Given** analysis completes successfully, **When** the agent presents results, **Then** the agent follows the `instructions` markdown from the tool response **And** results are streamed to the user in real-time **And** charts render inline after the text interpretation **And** the message metadata stores results and chartData for conversation reload

3. **Given** the agent presents the interpretation, **When** the three-part structure is followed, **Then** Part 1 (Análisis Técnico) includes formatted tables of all metrics **And** Part 2 (Conclusión Ejecutiva) clearly states: estable/inestable, capaz/no capaz, normal/no normal **And** Part 3 (Conclusión Terrenal) explains in simple language what the numbers mean and what to do next

4. **Given** a user asks a follow-up question after receiving results, **When** they ask something like "¿Qué puedo hacer para mejorar?" or "¿Por qué no es capaz?", **Then** the agent answers using conversation context without re-invoking the analysis tool **And** the agent references specific values from the previous analysis **And** recommendations are specific to their results (e.g., if Cpk low due to centering vs spread)

5. **Given** LEI/LES are NOT found in the user's message when requesting capacidad_proceso analysis, **When** the agent responds, **Then** a SpecLimitsForm component is rendered in the chat **And** the form shows detected data summary **And** on valid submission, analysis proceeds with the provided limits

6. **Given** the chat route handles the SpecLimitsForm flow, **When** form values are submitted, **Then** they are received as a structured message in the chat **And** the agent extracts LEI/LES and invokes the analyze tool **And** the flow is seamless from user perspective

## Tasks / Subtasks

- [x] **Task 1: Update Tool Definition** (AC: #1)
  - [x] Update `lib/openai/tools.ts` ANALYZE_TOOL
  - [x] Add `capacidad_proceso` to `analysis_type` enum
  - [x] Add optional `spec_limits` parameter with `{ lei: number, les: number }` structure
  - [x] Update description to mention "Capacidad de Proceso (Cp, Cpk, Pp, Ppk)"

- [x] **Task 2: Update Main Agent System Prompt** (AC: #2, #3, #4, #5)
  - [x] Update `lib/openai/prompts.ts` MAIN_SYSTEM_PROMPT
  - [x] Add Capacidad de Proceso flow section (parallel to MSA flow)
  - [x] Add LEI/LES parsing instructions (recognize patterns like "LEI=95, LES=105")
  - [x] Add SpecLimitsForm rendering trigger instruction
  - [x] Add three-part result presentation structure guidance
  - [x] Add follow-up question handling for capacidad_proceso context

- [x] **Task 3: Update Chat API Route** (AC: #2, #5, #6)
  - [x] Update `app/api/chat/route.ts` tool call handling
  - [x] Extract `spec_limits` from tool call arguments when present
  - [x] Pass `spec_limits` to `invokeAnalysisTool` function
  - [x] Store `analysisType: 'capacidad_proceso'` in message metadata

- [x] **Task 4: Update invokeAnalysisTool Function** (AC: #2)
  - [x] Update `lib/api/analyze.ts` to accept optional `spec_limits` parameter
  - [x] Include `spec_limits` in POST body to Python endpoint

- [x] **Task 5: Update ChatContainer for SpecLimitsForm** (AC: #5, #6)
  - [x] SpecLimitsForm component available from Story 8.3 (25 tests passing)
  - [x] Imported SpecLimitsForm into ChatContainer
  - [x] Added marker detection regex: `<!-- SHOW_SPEC_LIMITS_FORM count=N file_id=UUID -->`
  - [x] Added useMemo to detect marker in last assistant message
  - [x] Added handlers for form submission (sends `LEI=X, LES=Y` message) and cancellation
  - [x] Renders SpecLimitsForm when marker detected in assistant response

- [x] **Task 6: Add Types for SpecLimits Flow** (AC: #1, #6)
  - [x] Update `types/api.ts` with SpecLimits interface
  - [x] Add `spec_limits` to SSE event types if needed

- [x] **Task 7: Update Filter Agent for Capacidad de Proceso** (AC: #4)
  - [x] Update `lib/openai/prompts.ts` FILTER_SYSTEM_PROMPT
  - [x] Add capacidad de proceso terms to allowed topics
  - [x] Add follow-up question context for capability analysis

- [x] **Task 8: Create Integration Tests** (AC: #1, #2, #5)
  - [x] Test tool definition accepts capacidad_proceso (tools.test.ts - 15 tests)
  - [x] Test spec_limits parameter validation (analyze.test.ts - 8 tests)
  - [x] Test SpecLimitsForm renders when needed (SpecLimitsForm.test.tsx - 25 tests)
  - [x] Test form submission triggers analysis (SpecLimitsForm.test.tsx)

## Dev Notes

### Critical Architecture Patterns

**CRITICAL: Follow existing MSA implementation patterns exactly. This is an EXTENSION, not a new feature.**

The codebase already has:
- MSA analysis working end-to-end with tool calling
- Chart rendering in ChatMessage for MSA results
- Filter agent allowing MSA-related questions
- SpecLimitsForm component ready (Story 8.3)
- Python endpoint supporting `capacidad_proceso` analysis type

**Your job is to wire everything together for capacidad_proceso.**

### Existing Code to Study (DO NOT REINVENT)

**1. Tool Definition Pattern** (`lib/openai/tools.ts:17-50`):
```typescript
// Current MSA tool structure - ADD capacidad_proceso to enum
export const ANALYZE_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'analyze',
    description: '...',  // UPDATE to include capacidad_proceso
    parameters: {
      type: 'object',
      properties: {
        analysis_type: {
          type: 'string',
          enum: ['msa'],  // CHANGE TO: ['msa', 'capacidad_proceso']
          description: '...',
        },
        file_id: { type: 'string', ... },
        specification: { type: 'number', ... },  // MSA only
        // ADD: spec_limits for capacidad_proceso
      },
      required: ['analysis_type', 'file_id'],
    },
  },
}
```

**2. Chat Route Tool Handling** (`app/api/chat/route.ts:300-398`):
```typescript
// Extract arguments - ADD spec_limits extraction
const args = event.arguments as {
  analysis_type: string;
  file_id: string;
  specification?: number;
  spec_limits?: { lei: number; les: number }  // ADD THIS
}

// Pass to invokeAnalysisTool - ADD spec_limits parameter
const analysisResult = await invokeAnalysisTool(
  args.analysis_type,
  args.file_id,
  assistantMessageId || undefined,
  args.specification,
  args.spec_limits  // ADD THIS
)
```

**3. Python Endpoint Already Supports spec_limits** (`api/analyze.py:148`):
```python
spec_limits = body.get('spec_limits')  # Already implemented!
```

**4. SpecLimitsForm Component** (`components/chat/SpecLimitsForm.tsx`):
- Already implemented and tested (Story 8.3)
- Exports: `{ onSubmit, onCancel, detectedCount, isSubmitting }`
- Returns `{ lei: number, les: number }` on submit

### Tool Definition Update

**File:** `lib/openai/tools.ts`

```typescript
export const ANALYZE_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'analyze',
    description:
      'Realiza análisis estadístico en archivos Excel subidos. Soporta MSA (Gauge R&R) y Capacidad de Proceso (Cp, Cpk, Pp, Ppk). Para MSA, incluir specification (target). Para Capacidad de Proceso, incluir spec_limits (LEI/LES).',
    parameters: {
      type: 'object',
      properties: {
        analysis_type: {
          type: 'string',
          enum: ['msa', 'capacidad_proceso'],
          description: 'Tipo de análisis: "msa" para Gauge R&R, "capacidad_proceso" para índices de capacidad.',
        },
        file_id: {
          type: 'string',
          description: 'UUID del archivo subido a analizar',
        },
        specification: {
          type: 'number',
          description: 'Especificación o valor objetivo (target) de la pieza. Solo para MSA.',
        },
        spec_limits: {
          type: 'object',
          properties: {
            lei: { type: 'number', description: 'Límite de Especificación Inferior' },
            les: { type: 'number', description: 'Límite de Especificación Superior' },
          },
          required: ['lei', 'les'],
          description: 'Límites de especificación para Capacidad de Proceso. Requerido para calcular Cp, Cpk, Pp, Ppk.',
        },
      },
      required: ['analysis_type', 'file_id'],
      additionalProperties: false,
    },
  },
}
```

### Main Agent Prompt Updates

**File:** `lib/openai/prompts.ts`

Add to MAIN_SYSTEM_PROMPT after the MSA section (around line 175):

```markdown
FLUJO DE ANÁLISIS DE CAPACIDAD DE PROCESO - PASO A PASO:

**PASO 1: Verificar archivo**
- Si NO hay archivos disponibles → guía al usuario a "Plantillas" para descargar plantilla-capacidad-proceso.xlsx
- Si hay archivo disponible → continúa al Paso 2

**PASO 2: Obtener límites de especificación (LEI/LES)**
- Busca LEI/LES en el mensaje del usuario
- Patrones reconocidos:
  - "LEI=95, LES=105" o "LEI 95 y LES 105"
  - "límite inferior 95, superior 105"
  - "lower spec 95, upper 105"
  - "especificación inferior 95, superior 105"
- Si LEI/LES están presentes → procede al análisis
- Si NO están presentes → responde solicitando los límites:
  "Para realizar el análisis de capacidad, necesito los **límites de especificación**:
  - **LEI (Límite de Especificación Inferior)**: ¿Cuál es el valor mínimo aceptable?
  - **LES (Límite de Especificación Superior)**: ¿Cuál es el valor máximo aceptable?"
- ESPERA la respuesta del usuario

**PASO 3: Ejecutar análisis**
- SOLO después de obtener LEI y LES, invoca: analyze(analysis_type='capacidad_proceso', file_id='...', spec_limits={lei: X, les: Y})

PRESENTACIÓN DE RESULTADOS DE CAPACIDAD DE PROCESO:
Cuando la herramienta retorne resultados, presenta en tres partes:

**PARTE 1: ANÁLISIS TÉCNICO**
- Estadísticas básicas (media, mediana, desv. estándar, min, max, rango)
- Resultado de normalidad (Anderson-Darling, p-value, conclusión)
- Análisis de estabilidad (I-MR): límites de control, puntos fuera de control, reglas evaluadas
- Índices de capacidad: Cp, Cpk, Pp, Ppk con clasificación

**PARTE 2: CONCLUSIÓN EJECUTIVA**
- ¿Es normal o no? (con p-value)
- ¿Es estable o no? (con reglas violadas)
- ¿Es capaz o no? (con Cpk y clasificación)

**PARTE 3: CONCLUSIÓN "TERRENAL"**
- En términos simples: ¿El proceso cumple las especificaciones del cliente?
- Si no es capaz: ¿Por qué? (centrado vs. dispersión)
- Acciones recomendadas específicas

GRÁFICOS DE CAPACIDAD DE PROCESO:
El sistema genera 4 gráficos automáticamente:
- Histograma: distribución de datos con LEI, LES, media y curva ajustada
- Gráfico I (Individuos): valores individuales con límites de control
- Gráfico MR (Rango Móvil): variación entre puntos consecutivos
- Gráfico de Normalidad (Q-Q): evaluación visual de normalidad

Menciona e interpreta brevemente cada gráfico en tu respuesta.
```

### Filter Agent Update

**File:** `lib/openai/prompts.ts` - FILTER_SYSTEM_PROMPT

Add to "Estadística y análisis" section:
```
- Preguntas sobre capacidad de proceso (Cp, Cpk, Pp, Ppk)
- Preguntas sobre normalidad, Anderson-Darling, distribuciones
- Preguntas sobre estabilidad de proceso, cartas I-MR
- Preguntas sobre límites de especificación (LEI, LES)
```

Add to "Seguimiento de análisis" section:
```
Seguimiento de análisis de Capacidad de Proceso:
- Si el mensaje anterior contiene resultados de capacidad (Cp, Cpk, normalidad, estabilidad), PERMITIR cualquier pregunta sobre esos resultados
- Preguntas sobre por qué el proceso es capaz o no capaz
- Preguntas sobre cómo mejorar la capacidad
- Preguntas sobre normalidad y transformaciones
- Preguntas sobre estabilidad y puntos fuera de control
```

### invokeAnalysisTool Update

**File:** `lib/api/analyze.ts`

```typescript
export async function invokeAnalysisTool(
  analysisType: string,
  fileId: string,
  messageId?: string,
  specification?: number,
  specLimits?: { lei: number; les: number }  // ADD THIS
): Promise<ApiResponse<AnalysisToolResult>> {
  const body: Record<string, unknown> = {
    analysis_type: analysisType,
    file_id: fileId,
  }

  if (messageId) body.message_id = messageId
  if (specification !== undefined) body.specification = specification
  if (specLimits) body.spec_limits = specLimits  // ADD THIS

  // ... rest of implementation
}
```

### ChatContainer SpecLimitsForm Integration

**File:** `components/chat/ChatContainer.tsx`

Add state management for pending spec limits:

```typescript
// Add state
const [pendingSpecLimits, setPendingSpecLimits] = useState(false)
const [pendingAnalysisFileId, setPendingAnalysisFileId] = useState<string | null>(null)
const [detectedValueCount, setDetectedValueCount] = useState(0)

// Handle SSE event for showing form (custom event from agent)
// When agent needs LEI/LES, it can signal via a special marker in the response

// Handle form submission
const handleSpecLimitsSubmit = async (limits: { lei: number; les: number }) => {
  // Send as a structured message that the agent will parse
  const message = `LEI=${limits.lei}, LES=${limits.les}`
  await sendMessage(message)
  setPendingSpecLimits(false)
  setPendingAnalysisFileId(null)
}

const handleSpecLimitsCancel = () => {
  setPendingSpecLimits(false)
  setPendingAnalysisFileId(null)
}

// Render form when pending
{pendingSpecLimits && (
  <SpecLimitsForm
    detectedCount={detectedValueCount}
    onSubmit={handleSpecLimitsSubmit}
    onCancel={handleSpecLimitsCancel}
    isSubmitting={isStreaming}
  />
)}
```

**Alternative Implementation (Simpler):**
Instead of a custom SSE event, the agent can include a marker in its text response that triggers the form. The ChatMessage or ChatContainer can detect this marker and show the form.

Marker pattern: `<!-- SHOW_SPEC_LIMITS_FORM count=N file_id=UUID -->`

### CapacidadProcesoCharts Integration

Charts are **already integrated** in `components/chat/ChatMessage.tsx:123-130`:
```typescript
const capacidadProcesoChartData: CapacidadProcesoChartDataItem[] | null = (() => {
  if (!chartData) return null
  const cpCharts = chartData.filter(
    (d) => d.type === 'histogram' || d.type === 'i_chart'
  ) as unknown as CapacidadProcesoChartDataItem[]
  return cpCharts.length > 0 ? cpCharts : null
})()
```

And rendered at line 213:
```typescript
{capacidadProcesoChartData && capacidadProcesoChartData.length > 0 && (
  <CapacidadProcesoCharts chartData={capacidadProcesoChartData} />
)}
```

**No changes needed to ChatMessage for chart rendering.**

### File Structure

```
lib/openai/
├── tools.ts              # UPDATE: Add capacidad_proceso to enum, add spec_limits param
├── prompts.ts            # UPDATE: Add CP flow, add filter terms

lib/api/
├── analyze.ts            # UPDATE: Add spec_limits parameter

app/api/chat/
├── route.ts              # UPDATE: Extract spec_limits from tool args

components/chat/
├── ChatContainer.tsx     # UPDATE: Add SpecLimitsForm rendering logic
├── SpecLimitsForm.tsx    # EXISTS: No changes needed
├── SpecLimitsForm.test.tsx  # EXISTS: No changes needed
├── ChatMessage.tsx       # EXISTS: No changes needed (charts already integrated)
```

### Previous Story Learnings (Stories 8.1, 8.2, 8.3)

1. **Chart types already supported**: `histogram`, `i_chart`, `mr_chart`, `normality_plot`
2. **CapacidadProcesoCharts component**: Already renders all 4 chart types
3. **SpecLimitsForm**: Already tested with 25 test cases
4. **Python endpoint**: Already handles `capacidad_proceso` with `spec_limits`
5. **Spanish messages**: All user-facing text must be in Spanish
6. **Metadata storage**: Use `analysisType: 'capacidad_proceso'` in message metadata

### Git Intelligence (Recent Commits)

Recent commits show MSA output improvements and chart handling refinements. Follow the same patterns for capacidad_proceso.

### Critical Constraints

1. **NO scipy** - Python endpoint already handles this (Story 7.x)
2. **Spanish only** - All prompts and messages in Spanish
3. **Streaming** - Results must stream like MSA results
4. **Metadata persistence** - Store for conversation reload
5. **Follow-up support** - Must work like MSA follow-ups

### Testing Approach

1. **Unit tests**: Tool definition accepts capacidad_proceso
2. **Integration tests**: End-to-end flow with SpecLimitsForm
3. **Manual testing**:
   - Upload capacidad_proceso template
   - Request analysis without LEI/LES (should prompt)
   - Provide LEI/LES (should run analysis)
   - Ask follow-up questions
   - Verify 4 charts render

### Project Structure Notes

- Tool definitions: `lib/openai/tools.ts`
- System prompts: `lib/openai/prompts.ts`
- API integration: `lib/api/analyze.ts`
- Chat flow: `app/api/chat/route.ts`
- UI rendering: `components/chat/ChatContainer.tsx`

### References

- [Source: epics.md#story-84-agent-tool-update-chat-flow-integration] - Story requirements
- [Source: prd-v2.md#requisitos-funcionales-capacidad-de-proceso] - FR-CP3, FR-CP22, FR-CP23
- [Source: architecture.md#api-y-comunicación] - Tool calling patterns
- [Source: lib/openai/tools.ts] - Existing ANALYZE_TOOL structure
- [Source: lib/openai/prompts.ts] - Existing MAIN_SYSTEM_PROMPT pattern
- [Source: app/api/chat/route.ts] - Tool handling in chat route
- [Source: components/chat/SpecLimitsForm.tsx] - Ready-to-use form component
- [Source: components/chat/ChatMessage.tsx:123-130] - CapacidadProcesoCharts already integrated
- [Source: api/analyze.py:148] - spec_limits already supported in Python
- [Source: 8-3-spec-limits-form-template-page-update.md] - Previous story learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No blocking issues encountered

### Completion Notes List

- **Task 1: Tool Definition Update** - Updated `lib/openai/tools.ts` to add `capacidad_proceso` to analysis_type enum and `spec_limits` parameter with `{ lei: number, les: number }` structure. Updated tool description to mention Capacidad de Proceso (Cp, Cpk, Pp, Ppk). Added 3 new tests.

- **Task 2: Main Agent System Prompt** - Added comprehensive Capacidad de Proceso flow section to `MAIN_SYSTEM_PROMPT` including: step-by-step flow (verify file → obtain LEI/LES → execute analysis), LEI/LES pattern recognition, three-part result presentation structure (Análisis Técnico, Conclusión Ejecutiva, Conclusión "Terrenal"), 4 chart descriptions (Histogram, I-Chart, MR-Chart, Normality Plot), and follow-up question handling. Added 8 new tests.

- **Task 3: Chat API Route** - Updated `app/api/chat/route.ts` to extract `spec_limits` from tool call arguments and pass to `invokeAnalysisTool`. Added debug logging for spec_limits.

- **Task 4: invokeAnalysisTool Update** - Updated `lib/api/analyze.ts` to accept optional `specLimits` parameter and include in POST body to Python endpoint. Changed body type from `Record<string, string | number>` to `Record<string, unknown>` to accommodate nested objects. Added 1 new test.

- **Task 5: ChatContainer SpecLimitsForm Flow** - Integrated SpecLimitsForm component into ChatContainer. Added marker detection regex (`<!-- SHOW_SPEC_LIMITS_FORM count=N file_id=UUID -->`), useMemo for detecting marker in last assistant message, form submission handler (sends `LEI=X, LES=Y` message), and cancellation handler. Form renders when agent includes marker in response. Uses message ID tracking to avoid re-showing dismissed forms.

- **Task 6: Types** - Added `SpecLimits` interface to `types/api.ts` with `lei` and `les` properties.

- **Task 7: Filter Agent Update** - Added "Seguimiento de análisis de Capacidad de Proceso" section to `FILTER_SYSTEM_PROMPT` allowing follow-up questions about capacity analysis (Cp, Cpk, normalidad, estabilidad, LEI, LES). Added 4 new tests.

- **Task 8: Integration Tests** - Existing and new tests provide coverage:
  - `tools.test.ts`: 15 tests (3 new for capacidad_proceso)
  - `prompts.test.ts`: 45 tests (12 new for capacidad_proceso)
  - `analyze.test.ts`: 8 tests (1 new for spec_limits)
  - `SpecLimitsForm.test.tsx`: 25 tests (existing)

### File List

**Modified:**
- `lib/openai/tools.ts` - Added capacidad_proceso to analysis_type enum, added spec_limits parameter, updated comment
- `lib/openai/tools.test.ts` - Added 3 tests for capacidad_proceso and spec_limits, fixed TypeScript type errors with helper functions
- `lib/openai/prompts.ts` - Added Capacidad de Proceso flow section and filter support
- `lib/openai/prompts.test.ts` - Added 12 tests for capacidad_proceso support
- `app/api/chat/route.ts` - Added spec_limits extraction and passing, fixed `let` to `const` lint error
- `lib/api/analyze.ts` - Added specLimits parameter to invokeAnalysisTool
- `lib/api/analyze.test.ts` - Fixed mock implementations for .text(), added spec_limits test
- `types/api.ts` - Added SpecLimits interface
- `components/chat/ChatContainer.tsx` - Integrated SpecLimitsForm component with marker detection (AC #5, #6)

**New:**
- None

**Deleted:**
- None

**Existing (unchanged):**
- `components/chat/SpecLimitsForm.tsx` - Form component available from Story 8.3
- `components/chat/SpecLimitsForm.test.tsx` - 25 tests for form component

## Change Log

- 2026-02-21: Story 8.4 implemented - Added Capacidad de Proceso support to agent tool calling flow, including tool definition update, system prompt enhancements, chat route integration, and comprehensive tests (93 tests pass)
- 2026-02-22: Code review fixes - Integrated SpecLimitsForm into ChatContainer (AC #5, #6), fixed lint error in route.ts (let→const), fixed TypeScript errors in tools.test.ts, updated outdated comment

