# Setec AI Hub - Backend Architecture Documentation

## Overview

Setec AI Hub is a Lean Six Sigma statistical analysis platform with AI-powered chat functionality. It uses Next.js (frontend/API) + Python serverless functions (analysis) + Supabase (database/storage) + OpenAI (LLM).

---

## DETAILED APPLICATION FLOW

This section walks you through exactly what happens in the backend when users interact with the app. Each flow includes the files involved, the database tables affected, and code snippets showing the key operations.

---

### 🆕 Flow 1: Creating a New Chat

When a user clicks the "New Chat" button, here's what happens behind the scenes:

**Step 1: Frontend triggers conversation creation**

The frontend calls the `createConversation()` function to create a new chat session.

| What | Where |
|------|-------|
| Function | `createConversation()` |
| File | `/lib/supabase/conversations.ts:143-169` |

**Step 2: Insert record into database**

```typescript
// /lib/supabase/conversations.ts:154-161
const { data, error } = await supabase
  .from('conversations')
  .insert({
    user_id: userId,
    title: title ?? generateDefaultTitle(),  // "Nueva conversacion - DD/MM/YYYY HH:MM"
  })
  .select()
  .single()
```

| What | Details |
|------|---------|
| Table | `conversations` |
| Columns set | `id` (auto UUID), `user_id`, `title`, `created_at`, `updated_at` |
| Title format | "Nueva conversacion - 10/02/2026 16:07" |

**Step 3: Navigate to new chat**

The frontend receives the new `conversationId` and navigates the user to `/chat/{conversationId}`.

---

### 💬 Flow 2: Sending a Message (Without File)

This is the core flow - what happens when a user types a message and hits send.

**Step 1: User sends message**

The frontend makes a POST request to the chat API.

| What | Where |
|------|-------|
| Endpoint | `POST /api/chat` |
| File | `/app/api/chat/route.ts` |
| Request body | `{ conversationId, content }` |

**Step 2: Authenticate the user**

Before processing anything, we verify the user is logged in.

```typescript
// /app/api/chat/route.ts:53-80
const { data: { user }, error: authError } = await supabase.auth.getUser()
```

| What | Where |
|------|-------|
| Auth check | `/app/api/chat/route.ts:53-80` |
| Supabase client | `/lib/supabase/server.ts` |
| On failure | Returns 401 Unauthorized |

**Step 3: Validate the request**

We check that the message is properly formatted before processing.

| What | Where | Rule |
|------|-------|------|
| UUID validation | `/app/api/chat/route.ts:82-97` | Must be valid UUID format |
| Content check | `/app/api/chat/route.ts:99-114` | Must be non-empty string |
| Length limit | `/app/api/chat/route.ts:119-130` | Max 10,000 characters |

**Step 4: Save the user's message to the database**

We persist the message immediately so it's not lost even if something fails later.

```typescript
// /app/api/chat/route.ts:141-156
const userMessageResult = await createMessage(conversationId, 'user', messageContent, fileId, supabase)
```

| What | Where |
|------|-------|
| Function | `createMessage()` |
| File | `/lib/supabase/messages.ts:122-169` |
| Table | `messages` |
| Columns | `id`, `conversation_id`, `role='user'`, `content`, `metadata`, `created_at` |

**Step 5: Filter Agent evaluates the message**

This is the first AI call - a lightweight model checks if the message is on-topic.

```typescript
// /app/api/chat/route.ts:158-191
filterResult = await filterMessage(messageContent)
```

| What | Where |
|------|-------|
| Function | `filterMessage()` |
| File | `/lib/openai/filter-agent.ts:33-75` |
| OpenAI client | `/lib/openai/client.ts` |
| System prompt | `/lib/openai/prompts.ts:5-33` (`FILTER_SYSTEM_PROMPT`) |
| Model | `gpt-4o-mini` (fast & cheap) |
| Output | `{ "allowed": true }` or `{ "allowed": false }` |

The Filter Agent uses structured output (JSON schema) to guarantee a clean boolean response.

---

### 🚫 Step 6a: If Message is REJECTED

If the Filter Agent determines the message is off-topic (weather, recipes, etc.), we return a friendly rejection.

```typescript
// /app/api/chat/route.ts:197-231
import { REJECTION_MESSAGE } from '@/lib/openai/rejection-messages'

const assistantMessageResult = await createMessage(
  conversationId,
  'assistant',
  REJECTION_MESSAGE,
  undefined,
  supabase
)
```

| What | Where |
|------|-------|
| Rejection message | `/lib/openai/rejection-messages.ts` |
| Save to DB | `/lib/supabase/messages.ts:122-169` |
| Update timestamp | `/lib/supabase/conversations.ts:207-229` |
| Response type | JSON (not streaming) |

**Current rejection message** (from `/lib/openai/rejection-messages.ts`):

> "Lo siento, no puedo ayudarte con esa consulta. Soy un asistente especializado en análisis estadístico para Lean Six Sigma, como MSA, Gauge R&R, gráficos de control y pruebas de hipótesis. ¿Hay algo relacionado con calidad o estadística en lo que pueda asistirte?"

---

### ✅ Step 6b: If Message is ALLOWED - Continue to Main Agent

If the message passes the filter, we proceed to generate a real response.

**Step 7: Fetch conversation history**

We load previous messages to give the AI context about the conversation.

```typescript
// /app/api/chat/route.ts:235-239
const messagesResult = await fetchMessages(conversationId, supabase)
```

| What | Where |
|------|-------|
| Function | `fetchMessages()` |
| File | `/lib/supabase/messages.ts:47-70` |
| Context limit | Last 10 messages (defined in `/lib/openai/main-agent.ts:29`) |

**Step 8: Build file context**

We check if there are any uploaded files available for analysis.

```typescript
// /app/api/chat/route.ts:242
const fileContext = await buildFileContext(conversationId, supabase)
```

| What | Where |
|------|-------|
| Function | `buildFileContext()` |
| File | `/lib/openai/file-context.ts` |
| DB query | `/lib/supabase/files.ts:189-207` |
| Filters | Files with status `pending` or `valid` |

This produces a string like:
```
ARCHIVOS DISPONIBLES PARA ANÁLISIS:
- datos_msa.xlsx (ID: abc123-def456)
```

**Step 9: Stream response from Main Agent**

Now we call the main AI model with streaming enabled for a responsive UX.

```typescript
// /app/api/chat/route.ts:269-359
for await (const event of streamMainAgentWithTools({
  conversationHistory,
  userMessage: messageContent,
  fileContext: fileContext.contextString,
})) {
  // Process streaming events...
}
```

| What | Where |
|------|-------|
| Function | `streamMainAgentWithTools()` |
| File | `/lib/openai/main-agent.ts:194-318` |
| System prompt | `/lib/openai/prompts.ts:40-143` (`MAIN_SYSTEM_PROMPT`) |
| Tools definition | `/lib/openai/tools.ts` |
| Model | `gpt-4o` (high quality) |
| Streaming | Yes (SSE - Server-Sent Events) |

**Step 10: Stream text chunks to the client**

As the AI generates text, we send it to the frontend in real-time.

```typescript
// /app/api/chat/route.ts:274-277
if (event.type === 'text') {
  fullContent += event.content
  sendEvent({ type: 'text', content: event.content })
}
```

| What | Where |
|------|-------|
| SSE encoding | `/lib/openai/streaming.ts` |
| Event format | `data: {"type":"text","content":"chunk..."}\n\n` |

**Step 11: Save assistant message to database**

Once streaming completes, we save the full response.

```typescript
// /app/api/chat/route.ts:375-380
await createMessage(conversationId, 'assistant', cleanContent, undefined, supabase)
```

| What | Where |
|------|-------|
| Function | `createMessage()` |
| File | `/lib/supabase/messages.ts:122-169` |
| Table | `messages` with `role='assistant'` |

**Step 12: Update conversation timestamp**

We update the conversation's `updated_at` so it sorts to the top of the list.

```typescript
// /app/api/chat/route.ts:383
await updateConversationTimestamp(conversationId, supabase)
```

| What | Where |
|------|-------|
| Function | `updateConversationTimestamp()` |
| File | `/lib/supabase/conversations.ts:207-229` |
| Table | `conversations.updated_at = NOW()` |

---

### 📁 Flow 3: Uploading a File

When a user uploads an Excel file for analysis:

**Step 1: User selects and uploads file**

| What | Where |
|------|-------|
| Endpoint | `POST /api/files` |
| File | `/app/api/files/route.ts` |
| Request | FormData with file |

**Step 2: Upload to Supabase Storage**

The file is stored in a secure, user-specific path.

```typescript
// /lib/supabase/files.ts:53-74
const fileId = crypto.randomUUID()
const storagePath = `${userId}/${conversationId}/${fileId}.xlsx`

const { error: uploadError } = await supabase.storage
  .from('analysis-files')
  .upload(storagePath, file, {
    contentType: file.type,
    upsert: false,
  })
```

| What | Details |
|------|---------|
| Bucket | `analysis-files` |
| Path format | `{userId}/{conversationId}/{fileId}.xlsx` |
| Example | `550e8400.../34052b1c.../abc123.xlsx` |

**Step 3: Create file record in database**

We track the file metadata in the database.

```typescript
// /lib/supabase/files.ts:77-89
const { error: dbError } = await supabase
  .from('files')
  .insert({
    id: fileId,
    conversation_id: conversationId,
    storage_path: storagePath,
    original_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    status: 'pending',
  })
```

| What | Where |
|------|-------|
| Table | `files` |
| Initial status | `pending` (not yet analyzed) |
| File | `/lib/supabase/files.ts:77-89` |

**Step 4: Return fileId to frontend**

The frontend receives the `fileId` and can include it when sending chat messages.

---

### 📊 Flow 4: Running MSA Analysis (With File)

This is the complete flow when a user requests analysis of an uploaded file.

**Steps 1-9:** Same as Flow 2 (message validation, filtering, Main Agent setup)

**Step 10: Main Agent decides to use the analyze tool**

The AI sees the file in context and the user's request, and decides to invoke the analysis tool.

| What | Where |
|------|-------|
| Tool call detection | `/lib/openai/main-agent.ts:253-309` |
| Event emitted | `{ type: 'tool_call', name: 'analyze', arguments: { analysis_type: 'msa', file_id: '...' } }` |

**Step 11: Chat route handles the tool call**

```typescript
// /app/api/chat/route.ts:278-355
if (event.type === 'tool_call' && event.name === 'analyze') {
  // Send processing indicator to client
  sendEvent({ type: 'tool_call', name: 'analyze', status: 'processing' })

  // Create assistant message for metadata storage
  const partialResult = await createMessage(conversationId, 'assistant', fullContent || '', undefined, supabase)
  assistantMessageId = partialResult.data!.id

  // Call Python analysis endpoint
  const analysisResult = await invokeAnalysisTool(args.analysis_type, args.file_id, assistantMessageId)
}
```

| What | Where |
|------|-------|
| Tool handler | `/app/api/chat/route.ts:278-355` |
| Analysis caller | `/lib/api/analyze.ts:115-225` |

**Step 12: Call Python analysis endpoint**

The TypeScript backend calls the Python serverless function.

```typescript
// /lib/api/analyze.ts:140-148
const response = await fetch(`${baseUrl}/api/analyze`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    analysis_type: 'msa',
    file_id: fileId,
    message_id: messageId,
  }),
})
```

| What | Where |
|------|-------|
| Function | `invokeAnalysisTool()` |
| File | `/lib/api/analyze.ts:115-225` |
| Retry logic | 3 attempts with exponential backoff |
| Retry file | `/lib/utils/retry-utils.ts` |

**Step 13: Python loads file from storage**

```python
# /api/analyze.py
storage_response = supabase.storage.from_('analysis-files').download(file_record['storage_path'])
```

| What | Where |
|------|-------|
| Endpoint | `/api/analyze.py` |
| Downloads from | `analysis-files` bucket |

**Step 14: Python validates Excel structure**

Before running calculations, we verify the file has the correct format.

| What | Where |
|------|-------|
| Validator | `/api/utils/msa_validator.py` |
| Checks | Part column, Operator column, Measurement columns |
| Validates | Numeric data, minimum rows/parts/operators |

**Step 15: Python performs MSA/ANOVA calculations**

The actual statistical analysis happens here.

| What | Where |
|------|-------|
| Calculator | `/api/utils/msa_calculator.py` |
| Calculates | Repeatability (EV), Reproducibility (AV), Part-to-Part (PV) |
| Outputs | %GRR, NDC, classification (Acceptable/Marginal/Unacceptable) |

**Step 16: Python returns results**

```json
{
  "data": {
    "results": {
      "grr_percent": 23.7,
      "repeatability_percent": 15.2,
      "reproducibility_percent": 8.5,
      "ndc": 5,
      "classification": "Marginal"
    },
    "chartData": [...],
    "instructions": "## INSTRUCCIONES PARA EL AGENTE..."
  },
  "error": null
}
```

**Step 17: Update file status**

```python
# In /api/analyze.py
supabase.table('files').update({'status': 'processed'}).eq('id', file_id).execute()
```

| What | Details |
|------|---------|
| Table | `files` |
| Status change | `pending` → `processed` |

**Step 18: Send tool result to client**

```typescript
// /app/api/chat/route.ts:324-337
sendEvent({
  type: 'tool_result',
  data: analysisResult.data,
  error: analysisResult.error || undefined,
})
```

**Step 19: Save analysis results in message metadata**

```typescript
// /app/api/chat/route.ts:340-347
await updateMessageMetadata(assistantMessageId, {
  results: analysisResult.data.results,
  chartData: analysisResult.data.chartData,
  analysisType: args.analysis_type,
  fileId: args.file_id,
}, supabase)
```

| What | Where |
|------|-------|
| Function | `updateMessageMetadata()` |
| File | `/lib/supabase/messages.ts:178-221` |
| Table | `messages.metadata` (JSONB) |

**Step 20: Main Agent interprets results**

The AI receives the analysis results and generates a human-friendly interpretation based on the `instructions` field from Python.

---

### 🔄 Flow 5: Asking Follow-up Questions

When a user asks a follow-up about previous analysis results:

**Steps 1-7:** Same as Flow 2

**Step 8: Previous analysis included in context**

When building conversation context, we include analysis results from previous messages.

```typescript
// /lib/openai/main-agent.ts:53-78
const metadata = msg.metadata as Record<string, unknown> | null
const analysisResults = (metadata?.analysisResults || metadata?.results)
if (analysisResults) {
  content += `\n[Resultados del análisis: ${JSON.stringify(analysisResults)}]`
}
```

| What | Where |
|------|-------|
| Function | `getConversationContext()` |
| File | `/lib/openai/main-agent.ts:53-78` |
| Metadata source | `messages.metadata` column |

**Step 9: Agent answers without re-analyzing**

The Main Agent can reference specific numbers from the previous analysis without needing to call the tool again. This makes follow-up responses fast and efficient.

---

## 1. AI AGENTS

### Agent 1: Filter Agent (Content Moderation)

| Property | Value |
|----------|-------|
| **Model** | `gpt-4o-mini` |
| **Location** | `/lib/openai/filter-agent.ts` |
| **Prompt Location** | `/lib/openai/prompts.ts` (lines 5-63) |

**Purpose:** Filters incoming messages to ensure they're relevant to Lean Six Sigma / quality analysis.

**System Prompt (Spanish):**
```
Eres un filtro de mensajes para una plataforma de análisis estadístico de Lean Six Sigma.

PERMITIR (allowed: true):
- Saludos y despedidas
- Preguntas sobre MSA (Measurement System Analysis)
- Preguntas estadísticas, control de calidad, Lean Six Sigma
- Solicitudes de análisis de datos
- Archivos adjuntos para análisis
- Preguntas sobre Gauge R&R, gráficos de control
- Preguntas de seguimiento sobre resultados previos
- Preguntas sobre capacidad de proceso (Cp, Cpk, Pp, Ppk)

RECHAZAR (allowed: false):
- Recetas, entretenimiento, películas, música, deportes
- Política, religión, noticias
- Temas médicos, legales, financieros personales
```

**Input/Output:**
```typescript
// Input
filterMessage(content: string): Promise<FilterResult>

// Output
interface FilterResult {
  allowed: boolean
}
```

---

### Agent 2: Main Agent (Conversational Assistant)

| Property | Value |
|----------|-------|
| **Model** | `gpt-4o` |
| **Location** | `/lib/openai/main-agent.ts` |
| **Prompt Location** | `/lib/openai/prompts.ts` (lines 70-199) |
| **Context Window** | 10 most recent messages |

**Purpose:** Expert assistant for MSA, Gauge R&R, and statistical analysis. Can invoke tools for file analysis.

**System Prompt Summary:**
- Identity: "Asistente Setec" - statistical analysis expert
- Specialties: MSA, Gauge R&R, control charts, hypothesis testing
- Tone: Professional, pedagogical, friendly, in Spanish
- Tool usage rules for when to invoke `analyze` tool

**Input/Output:**
```typescript
// Input
interface StreamWithToolsOptions {
  conversationHistory: MessageRow[]
  userMessage: string
  fileContext: string  // Available files with IDs
}

// Output (streaming generator)
type MainAgentEvent =
  | { type: 'text'; content: string }
  | { type: 'tool_call'; name: string; callId: string; arguments: Record<string, unknown> }
  | { type: 'done' }
```

**Available Tool: `analyze`**
```typescript
{
  name: 'analyze',
  description: 'Realiza análisis estadístico MSA (Gauge R&R) en archivos Excel',
  parameters: {
    analysis_type: 'msa',  // enum: ['msa']
    file_id: string        // UUID of uploaded file
  }
}
```

---

## 2. API ENDPOINTS

### Next.js API Routes (`/app/api/`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/chat` | Main chat endpoint with SSE streaming |
| POST | `/api/files` | Upload Excel files |
| GET | `/api/files/[id]` | Download file (signed URL) |
| GET | `/api/conversations/[id]/files` | List files for conversation |
| GET | `/api/auth/callback` | OAuth callback |

### Python Serverless (`/api/`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/analyze` | MSA/Gauge R&R analysis |

**Analyze Request:**
```json
{
  "analysis_type": "msa",
  "file_id": "uuid",
  "message_id": "uuid"  // optional
}
```

**Analyze Response:**
```json
{
  "data": {
    "results": {
      "grr_percent": 23.7,
      "repeatability_percent": 15.2,
      "reproducibility_percent": 8.5,
      "part_to_part_percent": 76.3,
      "ndc": 5,
      "classification": "Marginal"
    },
    "chartData": [/* visualization data */],
    "instructions": "markdown presentation guide"
  },
  "error": null
}
```

---

## 3. SUPABASE TABLES

### `conversations`
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID (PK) | Unique identifier |
| `user_id` | UUID (FK → auth.users) | Owner |
| `title` | TEXT | Display name |
| `created_at` | TIMESTAMPTZ | Creation time |
| `updated_at` | TIMESTAMPTZ | Last update (trigger) |

### `messages`
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID (PK) | Unique identifier |
| `conversation_id` | UUID (FK) | Parent conversation |
| `role` | TEXT | 'user' / 'assistant' / 'system' |
| `content` | TEXT | Message text |
| `metadata` | JSONB | FileId, analysis results, chartData |
| `created_at` | TIMESTAMPTZ | Creation time |

### `files`
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID (PK) | Unique identifier |
| `conversation_id` | UUID (FK) | Parent conversation |
| `message_id` | UUID (FK, nullable) | Associated message |
| `storage_path` | TEXT | Path in storage bucket |
| `original_name` | TEXT | Original filename |
| `mime_type` | TEXT | File type |
| `size_bytes` | INTEGER | File size |
| `status` | TEXT | 'pending'→'valid'/'invalid'→'processed' |
| `validation_errors` | JSONB | Error details |
| `validated_at` | TIMESTAMPTZ | Validation timestamp |
| `processed_at` | TIMESTAMPTZ | Analysis completion time |
| `created_at` | TIMESTAMPTZ | Upload time |

### `analysis_results`
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID (PK) | Unique identifier |
| `message_id` | UUID (FK) | Associated assistant message |
| `file_id` | UUID (FK) | Analyzed file |
| `analysis_type` | TEXT | 'msa', 'bias', 'linearity', 'stability' |
| `results` | JSONB | Numerical analysis data |
| `chart_data` | JSONB | Visualization data |
| `instructions` | TEXT | Presentation guidance |
| `python_version` | TEXT | Python version used |
| `computed_at` | TIMESTAMPTZ | Analysis timestamp |

### `token_usage`
| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID (PK) | Unique identifier |
| `conversation_id` | UUID (FK) | Associated conversation |
| `message_id` | UUID (FK, nullable) | Associated message |
| `model` | TEXT | LLM model name |
| `prompt_tokens` | INTEGER | Input tokens |
| `completion_tokens` | INTEGER | Output tokens |
| `total_tokens` | INTEGER | Total tokens |
| `estimated_cost_usd` | DECIMAL | Estimated cost |
| `created_at` | TIMESTAMPTZ | Record time |

---

## 4. SUPABASE STORAGE

### Bucket: `analysis-files`

| Property | Value |
|----------|-------|
| **Visibility** | Private |
| **Size Limit** | 10 MB |
| **Allowed Types** | `.xlsx`, `.xls` |
| **Path Format** | `{user_id}/{conversation_id}/{file_id}.xlsx` |

**RLS Policies:** Users can only access files in their own `{user_id}/` folder.

**Key Functions (`/lib/supabase/files.ts`):**
- `uploadFile(userId, conversationId, file)` - Upload + create DB record
- `getFileDownloadUrl(storagePath)` - Generate signed URL (1 hour)
- `deleteFilesByConversation(conversationId)` - Remove all files

---

## 5. DATA FLOW DIAGRAM

```
User Message
    ↓
POST /api/chat
    ↓
┌─────────────────┐
│  Filter Agent   │ gpt-4o-mini
│  (moderation)   │
└────────┬────────┘
         ├─ Rejected → Return rejection message
         └─ Allowed ↓
┌─────────────────┐
│  Build Context  │
│  (files, history)│
└────────┬────────┘
         ↓
┌─────────────────┐
│   Main Agent    │ gpt-4o + tools
└────────┬────────┘
         ├─ Text → Stream to client
         └─ Tool call (analyze) ↓
              ┌───────────────────┐
              │ POST /api/analyze │ Python
              │ - Load Excel file │
              │ - Run MSA ANOVA   │
              │ - Save results    │
              └─────────┬─────────┘
                        ↓
              Stream tool_result to client
                        ↓
              Main Agent continues with analysis context
                        ↓
              Save messages to database
```

---

## 6. KEY FILE LOCATIONS

| Component | Path |
|-----------|------|
| OpenAI Client | `/lib/openai/client.ts` |
| Filter Agent | `/lib/openai/filter-agent.ts` |
| Main Agent | `/lib/openai/main-agent.ts` |
| Agent Prompts | `/lib/openai/prompts.ts` |
| Tool Definitions | `/lib/openai/tools.ts` |
| Chat API Route | `/app/api/chat/route.ts` |
| File Upload API | `/app/api/files/route.ts` |
| Python Analysis | `/api/analyze.py` |
| MSA Calculator | `/api/utils/msa_calculator.py` |
| MSA Validator | `/api/utils/msa_validator.py` |
| Supabase Files | `/lib/supabase/files.ts` |
| Supabase Messages | `/lib/supabase/messages.ts` |
| Supabase Conversations | `/lib/supabase/conversations.ts` |
| DB Migrations | `/supabase/migrations/*.sql` |
| TypeScript Types | `/types/database.ts`, `/types/analysis.ts` |

---

## 7. ENVIRONMENT VARIABLES

```bash
# Supabase (Public)
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Supabase (Server-only)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI (Server-only)
OPENAI_API_KEY=sk-...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 8. SECURITY

- **RLS (Row Level Security):** All tables enforce user-scoped access
- **Storage Policies:** Files isolated by `{user_id}/` path
- **Auth:** Supabase Auth with JWT tokens
- **Admin Client:** Service role key (server-side only, bypasses RLS)

---

## 9. ANALYSIS CAPABILITIES

**Currently Implemented:**
- MSA (Measurement System Analysis) / Gauge R&R
  - ANOVA-based variance decomposition
  - GRR%, Repeatability%, Reproducibility%
  - Number of Distinct Categories (NDC)
  - AIAG classification thresholds (<10%, 10-30%, >30%)

**Planned (in types but not implemented):**
- Bias Analysis
- Linearity Analysis
- Stability Analysis
