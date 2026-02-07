# Story 4.4: Agent Tool Integration

Status: complete

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **the AI agent to automatically analyze my uploaded file**,
So that **I get results without manual steps after uploading**.

**FRs covered:** FR-AGT6, FR-TOOL1, FR-TOOL2

## Acceptance Criteria

1. **Given** a user uploads a file with a message indicating MSA analysis, **When** the Main Agent processes the message, **Then** the agent recognizes the intent to perform MSA analysis, **And** the agent invokes the analyze tool with `{ analysis_type: 'msa', file_id: '...' }`, **And** the tool call is visible to the user as a processing indicator

2. **Given** a user uploads a file without specifying the analysis type, **When** the Main Agent processes the message, **Then** the agent asks the user: "¿Qué tipo de análisis deseas realizar con este archivo?", **And** the agent waits for user clarification before invoking the tool, **And** MVP: if user says anything related to MSA, the agent proceeds with MSA analysis

3. **Given** the analysis tool returns successfully, **When** the agent receives the tool response, **Then** the agent uses the `instructions` from the response to present results, **And** the `results` data is included in the message metadata, **And** the `chartData` is passed to the frontend for rendering

4. **Given** the analysis tool returns a validation error, **When** the agent receives the error response, **Then** the agent presents the validation errors to the user in a helpful way, **And** the agent encourages the user to fix the issues and re-upload, **And** the agent offers to explain what each error means if the user asks

5. **Given** the tool definition needs to be registered, **When** the Main Agent is configured, **Then** the `analyze` tool is defined with: name: "analyze", description: "Performs statistical analysis on uploaded Excel files", parameters: analysis_type (string, required), file_id (string, required), **And** the tool is only invoked when a file has been uploaded in the current message or recent context

6. **Given** the user uploads multiple files in a conversation, **When** they request analysis, **Then** the agent can handle each file separately, **And** the agent asks which file to analyze if ambiguous, **And** each analysis result is stored separately in analysis_results table

## Tasks / Subtasks

- [x] **Task 1: Create OpenAI Tool Definition** (AC: #5)
  - [x] Create new file `lib/openai/tools.ts`
  - [x] Define `ANALYZE_TOOL` constant with OpenAI function calling schema:
    ```typescript
    {
      type: 'function',
      function: {
        name: 'analyze',
        description: 'Performs statistical analysis (MSA/Gauge R&R) on uploaded Excel files. Only invoke when user has uploaded a file.',
        parameters: {
          type: 'object',
          properties: {
            analysis_type: {
              type: 'string',
              enum: ['msa'],
              description: 'Type of analysis to perform. Currently only MSA is supported.'
            },
            file_id: {
              type: 'string',
              description: 'UUID of the uploaded file to analyze'
            }
          },
          required: ['analysis_type', 'file_id']
        }
      }
    }
    ```
  - [x] Export `AVAILABLE_TOOLS` array containing the analyze tool
  - [x] Add unit tests in `lib/openai/tools.test.ts`

- [x] **Task 2: Update Main Agent System Prompt** (AC: #1, #2, #5)
  - [x] Update `MAIN_SYSTEM_PROMPT` in `lib/openai/prompts.ts`
  - [x] Add tool usage instructions:
    - When user uploads a file AND indicates MSA analysis intent → invoke analyze tool
    - When user uploads a file WITHOUT specifying type → ask "¿Qué tipo de análisis deseas realizar?"
    - Never invoke tool without a valid file_id from the current conversation context
  - [x] Add instructions for presenting results following the tool's `instructions` field
  - [x] Add instructions for handling validation errors gracefully
  - [x] Update tests in `lib/openai/prompts.test.ts`

- [x] **Task 3: Implement Tool Execution in Chat Route** (AC: #1, #3, #4)
  - [x] Modify `app/api/chat/route.ts` to support tool calling
  - [x] Add `tools: AVAILABLE_TOOLS` to the OpenAI completion call
  - [x] Handle `tool_calls` in the streaming response:
    - Parse tool call arguments (analysis_type, file_id)
    - Call Python analysis endpoint: `POST /api/analyze`
    - Stream SSE event `{ type: 'tool_call', status: 'processing' }` to show indicator
  - [x] After tool completes, continue conversation with tool results
  - [x] Stream the agent's interpretation of results
  - [x] Save metadata with chartData to message record
  - [x] Add comprehensive error handling

- [x] **Task 4: Create Tool Call SSE Event Types** (AC: #1, #3)
  - [x] Update `lib/openai/streaming.ts` to add new event types:
    - `{ type: 'tool_call', name: string, status: 'processing' | 'complete' | 'error' }`
    - `{ type: 'tool_result', data: { results, chartData, instructions } }`
  - [x] Update `types/api.ts` to include new SSE event types
  - [x] Update frontend to handle these new event types (in Task 7)

- [x] **Task 5: Implement Python Endpoint Caller** (AC: #3, #4)
  - [x] Create `lib/api/analyze.ts` with `invokeAnalysisTool()` function
  - [x] Make HTTP call to `POST /api/analyze` with:
    - `analysis_type`: from tool call arguments
    - `file_id`: from tool call arguments
    - `message_id`: current assistant message ID for result storage
  - [x] Parse response: `{ data: { results, chartData, instructions }, error }`
  - [x] Handle error responses gracefully
  - [x] Add unit tests

- [x] **Task 6: Implement File Context Detection** (AC: #1, #2, #6)
  - [x] Create helper to fetch recent files in conversation
  - [x] Pass file context to Main Agent in system/user message:
    - Include list of available files: `{ id, name, status }`
    - Only include files with status 'pending' or 'valid' (not yet processed)
  - [x] Update prompt to reference available files by ID
  - [x] Handle multiple files: if more than one pending file, ask user which to analyze

- [x] **Task 7: Update Frontend ChatMessage Component** (AC: #1, #3)
  - [x] Handle `tool_call` SSE events in `hooks/use-chat.ts`
  - [x] Show "Analizando archivo..." indicator during tool processing
  - [x] Handle `tool_result` events to store chartData in message state
  - [x] Update `ChatMessage.tsx` to render charts when chartData is present
  - [x] Import and use `GaugeRRChart` component (created new component)

- [x] **Task 8: Store Analysis Results in Message Metadata** (AC: #3)
  - [x] After analysis completes, update assistant message in database:
    - Add `metadata.chartData` containing chart configuration
    - Add `metadata.analysisType` and `metadata.fileId` for reference
  - [x] Ensure metadata is fetched when loading conversation history
  - [x] Render charts from stored metadata on conversation reload

- [x] **Task 9: Integration Tests** (AC: #1, #2, #3, #4, #6)
  - [x] Create `app/api/chat/route.test.ts` test cases:
    - Test: User sends message with file + "analiza esto" → tool invoked
    - Test: Tool returns success → agent presents results with instructions
    - Test: Tool returns validation error → agent presents friendly error
    - Test: Multiple files in conversation → context passed to agent
    - Test: No file in conversation + analysis request → agent explains to upload file
    - Test: Message metadata updated with chartData after analysis
  - [x] 7 new integration tests covering tool calling flow

## Dev Notes

### Critical Architecture Patterns

**Story 4.4 Focus:**
This story integrates the OpenAI function calling feature with the existing Python analysis endpoint. The Main Agent must be enhanced to:
1. Recognize when a user wants to analyze a file
2. Invoke the `analyze` tool with proper parameters
3. Present results following the tool's instructions
4. Handle errors gracefully

**Existing Infrastructure (from Stories 4.1-4.3):**
- Python endpoint `POST /api/analyze` is fully implemented and tested
- Endpoint accepts `{ analysis_type, file_id, message_id? }`
- Returns `{ results, chartData, instructions }` on success
- Returns validation errors with specific row/column details
- 139 Python tests passing - must not break

**Current Chat Flow (Story 2.5):**
```
User Message → Filter Agent → Main Agent (streaming) → Assistant Response
```

**New Chat Flow with Tool Calling:**
```
User Message → Filter Agent → Main Agent (with tools)
                                    │
                                    ├─[No tool call]→ Stream response
                                    │
                                    └─[Tool call: analyze]→ Call Python API
                                                                │
                                                                ↓
                                                          Tool Result
                                                                │
                                                                ↓
                                                    Continue conversation
                                                    with tool results
                                                                │
                                                                ↓
                                                    Stream interpretation
```

### OpenAI Function Calling Pattern

**Tool Definition Format:**
```typescript
// lib/openai/tools.ts
import type { ChatCompletionTool } from 'openai/resources/chat/completions'

export const ANALYZE_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'analyze',
    description: 'Realiza análisis estadístico MSA (Gauge R&R) en archivos Excel. Solo invocar cuando el usuario ha subido un archivo y desea analizarlo.',
    parameters: {
      type: 'object',
      properties: {
        analysis_type: {
          type: 'string',
          enum: ['msa'],
          description: 'Tipo de análisis. Actualmente solo MSA está soportado.'
        },
        file_id: {
          type: 'string',
          description: 'UUID del archivo subido a analizar'
        }
      },
      required: ['analysis_type', 'file_id'],
      additionalProperties: false
    }
  }
}

export const AVAILABLE_TOOLS: ChatCompletionTool[] = [ANALYZE_TOOL]
```

**Tool Call Response Handling:**
```typescript
// In chat route streaming handler
for await (const chunk of response) {
  const choice = chunk.choices[0]

  // Handle regular content
  if (choice?.delta?.content) {
    controller.enqueue(encodeSSE({ type: 'text', content: choice.delta.content }))
  }

  // Handle tool calls
  if (choice?.delta?.tool_calls) {
    for (const toolCall of choice.delta.tool_calls) {
      if (toolCall.function?.name === 'analyze') {
        // Send processing indicator
        controller.enqueue(encodeSSE({
          type: 'tool_call',
          name: 'analyze',
          status: 'processing'
        }))

        // Parse arguments and call Python API
        const args = JSON.parse(toolCall.function.arguments)
        const result = await invokeAnalysisTool(args.analysis_type, args.file_id, messageId)

        // Send result indicator
        controller.enqueue(encodeSSE({
          type: 'tool_result',
          data: result
        }))

        // Continue conversation with tool result
        // ... send result back to OpenAI for interpretation
      }
    }
  }
}
```

### Updated System Prompt Structure

```typescript
export const MAIN_SYSTEM_PROMPT = `Eres el Asistente Setec, un experto en análisis estadístico para Lean Six Sigma.

IDENTIDAD:
- Nombre: Asistente Setec
- Especialidad: Análisis del Sistema de Medición (MSA), Gauge R&R, gráficos de control
- Tono: profesional, pedagógico, amigable, siempre en español

CAPACIDADES:
- Responder preguntas sobre conceptos estadísticos
- Analizar archivos Excel con datos MSA usando la herramienta 'analyze'
- Interpretar y presentar resultados de análisis
- Guiar en mejores prácticas de Lean Six Sigma

HERRAMIENTA DE ANÁLISIS:
Tienes acceso a la herramienta 'analyze' para procesar archivos Excel.

CUÁNDO USAR LA HERRAMIENTA:
1. El usuario ha subido un archivo Y indica que quiere analizarlo → usa 'analyze'
2. El usuario ha subido un archivo SIN especificar tipo → pregunta "¿Qué tipo de análisis deseas?"
3. El usuario pide análisis pero NO hay archivo → guíalo a subir un archivo

PRESENTACIÓN DE RESULTADOS:
Cuando la herramienta retorne resultados:
1. Sigue las instrucciones del campo 'instructions' en la respuesta
2. Adapta la explicación al contexto de la conversación
3. Si hay errores de validación, explica cada error de forma amigable
4. Ofrece ayuda adicional si el usuario tiene preguntas

CONTEXTO DE ARCHIVOS DISPONIBLES:
[Se insertará dinámicamente: lista de archivos pendientes de análisis]
`
```

### File Context Injection

Before calling the Main Agent, inject file context:
```typescript
// Build file context for the prompt
const pendingFiles = await getFilesByConversation(conversationId)
const validFiles = pendingFiles.filter(f => f.status === 'pending' || f.status === 'valid')

let fileContext = ''
if (validFiles.length > 0) {
  fileContext = `\n\nARCHIVOS DISPONIBLES PARA ANÁLISIS:\n`
  validFiles.forEach(f => {
    fileContext += `- ID: ${f.id}, Nombre: ${f.original_name}\n`
  })
}

// Append to system prompt or user message
const messagesWithContext = [
  { role: 'system', content: MAIN_SYSTEM_PROMPT + fileContext },
  ...conversationHistory,
  { role: 'user', content: userMessage }
]
```

### SSE Event Types

```typescript
// types/api.ts - Add new SSE event types
export type SSEEventType =
  | 'text'           // Regular text chunk
  | 'done'           // Stream complete
  | 'error'          // Error occurred
  | 'tool_call'      // Tool is being invoked
  | 'tool_result'    // Tool completed with results

export interface SSEToolCallEvent {
  type: 'tool_call'
  name: string
  status: 'processing' | 'complete' | 'error'
}

export interface SSEToolResultEvent {
  type: 'tool_result'
  data: {
    results: MSAResults
    chartData: ChartDataItem[]
    instructions: string
  } | null
  error?: {
    code: string
    message: string
    details?: ValidationError[]
  }
}
```

### Frontend Handling

```typescript
// hooks/use-chat.ts - Handle tool events
const handleSSEEvent = (event: SSEEvent) => {
  switch (event.type) {
    case 'text':
      // Append to streaming message
      setStreamingContent(prev => prev + event.content)
      break

    case 'tool_call':
      if (event.status === 'processing') {
        setIsAnalyzing(true)
        setAnalyzingStatus('Analizando archivo...')
      }
      break

    case 'tool_result':
      setIsAnalyzing(false)
      if (event.data) {
        setChartData(event.data.chartData)
      }
      break

    case 'done':
      finalizeMessage()
      break

    case 'error':
      handleError(event.content)
      break
  }
}
```

### Error Handling Patterns

**Validation Error Presentation:**
```typescript
// When tool returns validation error, agent should say:
`Encontré algunos problemas con el archivo:

${errors.map(e => `• ${e.message}`).join('\n')}

Por favor corrige estos errores y vuelve a subir el archivo. Si necesitas ayuda para entender algún error, pregúntame.`
```

**No File Context:**
```typescript
// When user asks to analyze but no file available:
`Para realizar un análisis MSA, necesito que subas un archivo Excel con tus datos de medición.

Ve a la sección de Plantillas, descarga la plantilla MSA, llénala con tus datos y súbela aquí usando el botón de adjuntar archivo.`
```

### Database Integration

**Saving Analysis Results:**
The Python endpoint already saves to `analysis_results` table when `message_id` is provided. This story needs to:
1. Pass the assistant message ID to the Python endpoint
2. Update the assistant message metadata with `analysisId` and `chartData`

**Message Metadata Structure:**
```typescript
interface MessageMetadata {
  analysisId?: string      // Reference to analysis_results.id
  fileId?: string          // Reference to files.id
  chartData?: ChartData[]  // Chart configuration for frontend
}
```

### Previous Story Learnings (Story 4.3)

From the completed Story 4.3:
- 139 Python tests passing
- MSA calculation returns: `{ results, chartData, instructions }`
- `chartData` structure:
  ```json
  [
    {
      "type": "variationBreakdown",
      "data": [
        { "source": "Repetibilidad", "percentage": 12.5, "color": "#3B82F6" },
        { "source": "Reproducibilidad", "percentage": 13.2, "color": "#F97316" },
        { "source": "Parte a Parte", "percentage": 98.3, "color": "#10B981" }
      ]
    },
    {
      "type": "operatorComparison",
      "data": [
        { "operator": "Op1", "mean": 10.52, "stdDev": 0.023 },
        { "operator": "Op2", "mean": 10.48, "stdDev": 0.031 }
      ]
    }
  ]
  ```
- `instructions` contains Spanish markdown for presenting results
- Validation errors include row/column details

### Testing Strategy

**Unit Tests:**
- `lib/openai/tools.test.ts` - Tool definition structure validation
- `lib/api/analyze.test.ts` - Python endpoint caller tests (mock HTTP)

**Integration Tests:**
- `app/api/chat/route.test.ts` - Full flow with mocked OpenAI and Python endpoints
- Test scenarios:
  1. File + intent → tool called → results presented
  2. File only → agent asks for type
  3. Tool error → graceful error message
  4. Multiple files → disambiguation

**Local Testing:**
```bash
# Run all TypeScript tests
npm run test

# Run specific test file
npm run test -- lib/openai/tools.test.ts

# Run with coverage
npm run test:coverage
```

### File Structure Changes

**Files to Create:**
- `lib/openai/tools.ts` - Tool definitions
- `lib/openai/tools.test.ts` - Tool tests
- `lib/api/analyze.ts` - Python endpoint caller
- `lib/api/analyze.test.ts` - Caller tests

**Files to Modify:**
- `lib/openai/prompts.ts` - Update MAIN_SYSTEM_PROMPT
- `lib/openai/prompts.test.ts` - Update prompt tests
- `lib/openai/main-agent.ts` - Add tools to completion call
- `lib/openai/streaming.ts` - Add new SSE event types
- `app/api/chat/route.ts` - Handle tool calls
- `hooks/use-chat.ts` - Handle tool events on frontend
- `types/api.ts` - Add SSE event types
- `components/chat/ChatMessage.tsx` - Render charts from metadata

### Dependencies

**No New Dependencies Required:**
- OpenAI function calling is already supported by `openai` package
- HTTP calls to Python endpoint use native `fetch`
- Chart rendering uses existing Recharts (from architecture)

### References

- [Source: epics.md#story-44-agent-tool-integration] - Story requirements and ACs
- [Source: architecture.md#api-y-comunicación] - Streaming SSE pattern
- [Source: architecture.md#frontend-architecture] - State management patterns
- [Source: 4-3-msa-calculation-engine.md] - Previous story patterns and output structure
- [OpenAI Function Calling Documentation](https://platform.openai.com/docs/guides/function-calling)

## Dev Agent Record

### Agent Model Used

Claude Code (Opus 4.5)

### Debug Log References

N/A

### Completion Notes List

- All 9 tasks implemented and verified
- 646 tests passing across 49 test files
- Tool calling flow fully integrated with Python MSA endpoint
- Chart rendering working from message metadata

### File List

**Created:**
- `lib/openai/tools.ts` - OpenAI tool definitions (ANALYZE_TOOL)
- `lib/openai/tools.test.ts` - Tool definition tests (12 tests)
- `lib/api/analyze.ts` - Python endpoint caller (invokeAnalysisTool)
- `lib/api/analyze.test.ts` - Endpoint caller tests
- `lib/openai/file-context.ts` - File context detection (buildFileContext)
- `lib/openai/file-context.test.ts` - File context tests
- `components/charts/GaugeRRChart.tsx` - Chart component for MSA results
- `components/charts/GaugeRRChart.test.tsx` - Chart component tests
- `components/charts/index.ts` - Charts barrel export

**Modified:**
- `lib/openai/prompts.ts` - Updated MAIN_SYSTEM_PROMPT with tool instructions
- `lib/openai/prompts.test.ts` - Updated prompt tests
- `lib/openai/main-agent.ts` - Added streamMainAgentWithTools with tool support
- `lib/openai/main-agent.test.ts` - Added tool calling tests
- `lib/openai/streaming.ts` - Added tool event SSE encoding
- `app/api/chat/route.ts` - Full tool calling integration (340 lines)
- `app/api/chat/route.test.ts` - Integration tests for tool flow
- `hooks/use-chat.ts` - Frontend tool event handling
- `hooks/use-chat.test.tsx` - Hook tests for tool events
- `types/api.ts` - SSEToolCallEvent, SSEToolResultEvent, ChartDataItem types
- `components/chat/ChatMessage.tsx` - Chart rendering from metadata
- `components/chat/ChatMessage.test.tsx` - Chart rendering tests