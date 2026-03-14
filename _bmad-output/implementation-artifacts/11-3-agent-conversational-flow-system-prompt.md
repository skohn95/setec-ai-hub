# Story 11.3: Agent Conversational Flow & System Prompt

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the AI agent to guide me through configuring the analysis and understand my results,
So that I get a natural conversational experience without needing to know statistical details upfront.

## Acceptance Criteria

### AC 1: Confidence Level Configuration
- **Given** a user uploads a file and expresses intent for 2-sample hypothesis testing
- **When** the agent detects the intent
- **Then** the agent asks: "Para el test de hipotesis de 2 muestras, necesito que me indiques el nivel de confianza. Por default es 95%." with options 90%, 95%, 99%
- **And** the agent waits for the user's response before proceeding

### AC 2: Hypothesis Direction Configuration
- **Given** the user has selected a confidence level
- **When** the agent continues the configuration
- **Then** it asks: "Para el analisis de medias, la hipotesis alternativa es de desigualdad (muA != muB), o quieres probar una direccion especifica?" with options: != (default), >, <
- **And** the agent waits for the user's response before invoking the tool

### AC 3: Tool Invocation with Correct Parameters
- **Given** the user has provided both configuration choices
- **When** the agent invokes the analyze tool
- **Then** it passes the correct `confidence_level` and `alternative_hypothesis` values
- **And** it includes the `file_id` and `analysis_type='hipotesis_2_muestras'`

### AC 4: Small Sample Warning (n < 30)
- **Given** the analysis results indicate at least one sample has n < 30 (`small_sample_warning = true`)
- **When** the agent receives the results
- **Then** it presents the warning: "Warning: [Muestra X] tiene menos de 30 observaciones (n=Y). Se recomienda tomar mas muestras. Es posible obtener mas datos?"
- **And** it waits for the user's yes/no response

### AC 5: User Accepts to Get More Data
- **Given** the user responds "si" to the n < 30 question
- **When** the agent processes the response
- **Then** it advises: "Regresa cuando tengas al menos 30 observaciones por muestra"
- **And** it does NOT display the analysis results

### AC 6: User Proceeds Despite Small Sample
- **Given** the user responds "no" to the n < 30 question
- **When** the agent processes the response
- **Then** it presents the full results with a caveat about critical condition
- **And** the caveat appears in both technical and terrenal sections

### AC 7: Normal Flow (Both Samples >= 30)
- **Given** both samples have n >= 30 (no small sample warning)
- **When** the agent receives the results
- **Then** it presents the full results directly without the n < 30 question

### AC 8: Follow-up Q&A
- **Given** the analysis results have been presented
- **When** the user asks a follow-up question (e.g., "Que significa el p-value del test de Levene?")
- **Then** the agent answers using the conversation context and stored results
- **And** it does NOT re-invoke the analysis tool

### AC 9: System Prompt Updated
- **Given** the system prompt for the principal agent
- **When** it is updated for the new analysis type
- **Then** it includes instructions for recognizing hypothesis testing intent
- **And** it includes the conversational configuration flow (confidence + hypothesis direction)
- **And** it includes the n < 30 conditional presentation logic

### AC 10: Route Handler Parameter Fix (BUG)
- **Given** the agent passes `confidence_level` and `alternative_hypothesis` in the tool call
- **When** the route handler processes the tool call
- **Then** it forwards both parameters to `invokeAnalysisTool`
- **And** the Python backend receives and uses the correct values

## Tasks / Subtasks

- [x] Task 1: Fix route.ts parameter forwarding bug (AC: 10)
  - [x] 1.1 In `app/api/chat/route.ts` line 353-358, add `args.confidence_level` and `args.alternative_hypothesis` as 5th and 6th arguments to `invokeAnalysisTool()`
  - [x] 1.2 Add debug logging for the new parameters (follow existing pattern at lines 348-351)

- [x] Task 2: Update MAIN_SYSTEM_PROMPT with Hipotesis 2 Muestras flow (AC: 1, 2, 3, 4, 5, 6, 7, 9)
  - [x] 2.1 Update "SOBRE EL SETEC AI HUB" section to list Hipotesis 2 Muestras as available analysis
  - [x] 2.2 Update "CAPACIDADES" section to include hypothesis testing capabilities
  - [x] 2.3 Add "FLUJO DE ANALISIS HIPOTESIS 2 MUESTRAS" section with step-by-step flow
  - [x] 2.4 Add "PRESENTACION DE RESULTADOS DE HIPOTESIS 2 MUESTRAS" section with 3-part structure
  - [x] 2.5 Add "GRAFICOS DE HIPOTESIS 2 MUESTRAS" section describing the 4 charts
  - [x] 2.6 Add "PREGUNTAS DE SEGUIMIENTO PARA HIPOTESIS 2 MUESTRAS" section
  - [x] 2.7 Update "SALUDO INICIAL" to mention Hipotesis 2 Muestras

- [x] Task 3: Update Filter Agent prompt (AC: 8)
  - [x] 3.1 Add "Seguimiento de Analisis de Hipotesis 2 Muestras" section to FILTER_SYSTEM_PROMPT
  - [x] 3.2 Add hypothesis testing keywords to the "Estadistica y analisis" allow list

- [x] Task 4: Build verification (AC: 1-10)
  - [x] 4.1 Run `npx tsc --noEmit` -- zero new TypeScript errors
  - [x] 4.2 Run `npm run build` -- successful build

## Dev Notes

### Developer Context

This is **Story 11.3 in Epic 11** (2-Sample Hypothesis Visualization & Agent Integration). Stories 11.1 (type definitions) and 11.2 (chart components) are DONE. This is the FINAL story in Epic 11 -- it wires up the agent's conversational intelligence for the new analysis type.

**Pre-completed work from Stories 11.1 and 11.2:**
- TypeScript types for `Hipotesis2MuestrasResult` and all chart data types are defined in `types/analysis.ts`
- Tool definition in `lib/openai/tools.ts` already includes `hipotesis_2_muestras` in the enum with `confidence_level` and `alternative_hypothesis` parameters
- `invokeAnalysisTool` in `lib/api/analyze.ts` already accepts `confidenceLevel` and `alternativeHypothesis` as parameters 5 and 6
- Chart components (`Hipotesis2MHistogramChart`, `BoxplotChart`, `Hipotesis2MCharts`) are created and wired in `ChatMessage.tsx`
- Python backend (Epic 10) fully supports the analysis with all calculation, validation, and output generation

**What this story completes:**
- The agent can recognize hypothesis testing intent and guide configuration
- The route handler actually passes the user's configuration to the API (BUG FIX)
- The agent presents results following the 3-part structure pattern
- The agent handles the n<30 conditional flow
- Follow-up Q&A works naturally

### Critical Bug: route.ts Parameter Forwarding

**File:** `app/api/chat/route.ts`, lines 353-358

**Current code (BROKEN):**
```typescript
const analysisResult = await invokeAnalysisTool(
  args.analysis_type,
  args.file_id,
  assistantMessageId || undefined,
  args.spec_limits
)
```

**Required fix:**
```typescript
const analysisResult = await invokeAnalysisTool(
  args.analysis_type,
  args.file_id,
  assistantMessageId || undefined,
  args.spec_limits,
  args.confidence_level,
  args.alternative_hypothesis
)
```

**Impact:** Without this fix, ALL hipotesis_2_muestras analyses run with default values (confidence_level=0.95, alternative_hypothesis='two-sided') regardless of what the user selected through the conversational flow. The agent asks the questions, the LLM includes the values in the tool call, but the route handler silently drops them.

**Also add debug logging** (follow existing pattern at lines 348-351):
```typescript
console.log('[CHAT-DEBUG] Confidence Level:', args.confidence_level || '(default)')
console.log('[CHAT-DEBUG] Alternative Hypothesis:', args.alternative_hypothesis || '(default)')
```

### System Prompt Architecture

**File:** `lib/openai/prompts.ts`

The file exports two prompts:
1. `FILTER_SYSTEM_PROMPT` -- used by `filter-agent.ts` (model: `gpt-5-nano`) to classify messages as on/off-topic
2. `MAIN_SYSTEM_PROMPT` -- used by `main-agent.ts` (model: `gpt-5`) for the conversational agent

**MAIN_SYSTEM_PROMPT structure:**
```
IDENTIDAD
SOBRE SETEC
CONTACTO SETEC
SOBRE EL SETEC AI HUB        <-- UPDATE: add Hipotesis 2 Muestras
CAPACIDADES                   <-- UPDATE: add hypothesis testing
HERRAMIENTA DE ANALISIS
FLUJO DE ANALISIS MSA         <-- existing pattern to follow
FLUJO DE CAPACIDAD DE PROCESO <-- existing pattern to follow
                              <-- ADD: FLUJO DE HIPOTESIS 2 MUESTRAS (after capacidad)
PRESENTACION MSA              <-- existing pattern to follow
                              <-- ADD: PRESENTACION HIPOTESIS 2 MUESTRAS (after MSA)
GRAFICOS MSA                  <-- existing pattern to follow
                              <-- ADD: GRAFICOS HIPOTESIS 2 MUESTRAS (after MSA)
MANEJO DE ERRORES
ARCHIVOS MULTIPLES
PREGUNTAS DE SEGUIMIENTO
  Seguimiento MSA             <-- existing
  Seguimiento Capacidad       <-- existing
                              <-- ADD: Seguimiento Hipotesis 2 Muestras
SALUDO INICIAL                <-- UPDATE: mention Hipotesis 2 Muestras
INSTRUCCIONES GENERALES
PLANTILLAS
```

### Exact Content for System Prompt Updates

#### Update "SOBRE EL SETEC AI HUB" (line 134)

**Current:**
```
- Analisis disponibles actualmente: MSA (Gauge R&R) y Analisis de Capacidad de Proceso (Cp, Cpk, Pp, Ppk)
- Proximamente: mas tipos de analisis estadistico
```

**Replace with:**
```
- Analisis disponibles actualmente: MSA (Gauge R&R), Analisis de Capacidad de Proceso (Cp, Cpk, Pp, Ppk), y Prueba de Hipotesis de 2 Muestras
- Proximamente: mas tipos de analisis estadistico
```

#### Update "CAPACIDADES" (after line 148)

**Add these lines after the existing capabilities:**
```
- Explicar Prueba de Hipotesis de 2 Muestras: test de Levene, t-test de 2 muestras (pooled/Welch), intervalos de confianza
- Analizar archivos Excel con datos de 2 muestras usando la herramienta 'analyze'
```

#### Add "FLUJO DE ANALISIS HIPOTESIS 2 MUESTRAS" (after FLUJO DE CAPACIDAD DE PROCESO, after line 190)

```
FLUJO DE ANALISIS HIPOTESIS 2 MUESTRAS - PASO A PASO:

**PASO 1: Verificar archivo**
- Si NO hay archivos en "ARCHIVOS DISPONIBLES PARA ANALISIS" -> guia al usuario a la seccion "Plantillas" en el menu lateral izquierdo para descargar la plantilla "Prueba de Hipotesis: 2 Muestras" (plantilla-hipotesis-2-muestras.xlsx). El archivo requiere dos columnas numericas: "Muestra A" y "Muestra B".
- Si hay archivo disponible -> continua al Paso 2

**PASO 2: Preguntar nivel de confianza**
- Pregunta: "Para el test de hipotesis de 2 muestras, necesito que me indiques el nivel de confianza. Por default es 95%. Las opciones son: 90%, 95%, o 99%."
- ESPERA la respuesta del usuario antes de continuar
- Si el usuario no sabe o dice "default" -> usa 0.95

**PASO 3: Preguntar hipotesis alternativa**
- Pregunta: "Para el analisis de medias, la hipotesis alternativa es:
  - **Desigualdad (muA != muB)**: Quieres saber si las medias son diferentes (bilateral, recomendado)
  - **Mayor (muA > muB)**: Quieres probar que la Muestra A tiene mayor media
  - **Menor (muA < muB)**: Quieres probar que la Muestra A tiene menor media"
- ESPERA la respuesta del usuario antes de continuar
- Si el usuario no sabe o dice "default" -> usa 'two-sided'

**PASO 4: Ejecutar analisis**
- SOLO despues de obtener ambas configuraciones, invoca: analyze(analysis_type='hipotesis_2_muestras', file_id='...', confidence_level=X, alternative_hypothesis='...')

**PASO 5: Evaluar tamano de muestra (n < 30)**
- Si los resultados indican `small_sample_warning = true` en `results.sample_size.a` o `results.sample_size.b`:
  - Presenta advertencia: "⚠️ [Muestra X] tiene menos de 30 observaciones (n=Y). Cuando n < 30, la validez del test depende fuertemente de que los datos sean normales. Se recomienda tomar mas muestras. ¿Es posible obtener mas datos?"
  - ESPERA respuesta del usuario
  - Si responde "si" -> responde: "Regresa cuando tengas al menos 30 observaciones por muestra. Puedes usar la misma plantilla para agregar mas datos." NO muestres los resultados.
  - Si responde "no" -> presenta resultados con caveat en la conclusion terrenal
- Si ambas muestras tienen n >= 30 -> presenta resultados directamente

CUANDO INVOCAR ANALISIS HIPOTESIS 2 MUESTRAS:
1. Hay archivo disponible Y usuario menciona hipotesis/comparar muestras/t-test/diferencia de medias -> PREGUNTA configuracion primero
2. El usuario sube archivo con mensaje "[Archivo adjunto]" Y menciona hipotesis o comparacion -> Pregunta configuracion
3. El usuario ya proporciono configuracion en mensajes anteriores -> INVOCA 'analyze' directamente
```

#### Add "PRESENTACION DE RESULTADOS DE HIPOTESIS 2 MUESTRAS" (after PRESENTACION MSA section, after line 271)

```
PRESENTACION DE RESULTADOS DE HIPOTESIS 2 MUESTRAS:
Cuando la herramienta retorne resultados de hipotesis 2 muestras, presenta en TRES PARTES:

**PARTE 1: ANALISIS TECNICO**
- Estadisticas descriptivas por muestra: n, media, mediana, desviacion estandar, sesgo
- Valores atipicos (outliers) detectados por muestra (metodo IQR)
- Evaluacion de tamano de muestra: si aplica TCL (n>=30) o si es muestra pequena
- Evaluacion de normalidad: prueba Anderson-Darling por muestra (estadistico A², p-value, conclusion)
- Si la normalidad fallo: resultado de evaluacion de robustez (sesgo < 1.0 y outliers < 5%)
- Si se aplico transformacion Box-Cox: lambda, si mejoro la normalidad
- Test de varianzas (Levene): F-estadistico, p-value, conclusion (varianzas iguales o diferentes)
- Test de medias: metodo usado (Pooled t-test o Welch t-test), t-estadistico, grados de libertad, p-value, intervalo de confianza de la diferencia, conclusion
- Usa tablas markdown para organizar las metricas

**PARTE 2: CONCLUSION EJECUTIVA**
- ¿Las varianzas son iguales? (con p-value de Levene y conclusion)
- ¿Las medias son estadisticamente diferentes? (con p-value del t-test y conclusion)
  - p-value >= alfa: No se rechaza H0 - No hay evidencia de diferencia significativa
  - p-value < alfa: Se rechaza H0 - Hay evidencia de diferencia significativa
- Intervalo de confianza de la diferencia de medias y su interpretacion
- Si hubo advertencias (Box-Cox, robustez, muestra pequena), mencionarlas

**PARTE 3: CONCLUSION "TERRENAL"**
- En terminos simples: ¿Los dos grupos son estadisticamente diferentes o no?
- Si hay diferencia: ¿Cual grupo tiene mayor/menor media y por cuanto?
- Si NO hay diferencia: Explicar que la variacion observada es producto del azar
- Si la muestra es pequena (n < 30 y el usuario decidio continuar): incluir caveat "Nota: Este resultado debe interpretarse con precaucion dado el tamano reducido de la muestra. Se recomienda replicar con mas datos."
- Recomendaciones practicas basadas en los resultados
- Si hay warnings del analisis, explicarlos en terminos simples

GRAFICOS DE HIPOTESIS 2 MUESTRAS:
El sistema genera 4 graficos automaticamente:
- **Histograma Muestra A**: Distribucion de frecuencias con linea de media y marcadores de outliers. Interpreta la forma de la distribucion.
- **Histograma Muestra B**: Igual que Muestra A. Compara visualmente ambas distribuciones.
- **Boxplot de Varianzas**: Dos boxplots lado a lado mostrando la dispersion de cada muestra. Incluye p-value de Levene. Interpreta si las cajas tienen tamano similar (varianzas iguales) o no.
- **Boxplot de Medias**: Dos boxplots con intervalos de confianza de la media superpuestos. Incluye p-value del t-test. Interpreta si los intervalos se solapan (no hay diferencia) o no.

Menciona e interpreta brevemente cada grafico relevante en tu respuesta.
```

#### Add "PREGUNTAS DE SEGUIMIENTO PARA HIPOTESIS 2 MUESTRAS" (after "Seguimiento Capacidad", after line 325)

```
Seguimiento de Analisis de Hipotesis 2 Muestras:
- Si el mensaje anterior contiene resultados de hipotesis (test de Levene, t-test, varianzas, medias), PERMITIR cualquier pregunta sobre esos resultados
- Preguntas sobre que significa el p-value del test de Levene o del t-test
- Preguntas sobre por que se uso Pooled o Welch
- Preguntas sobre que son los intervalos de confianza
- Preguntas sobre varianzas iguales vs diferentes y sus implicaciones
- Preguntas sobre normalidad, robustez, Box-Cox
- Preguntas sobre como interpretar los boxplots o histogramas
- Preguntas sobre que acciones tomar basandose en los resultados
- Preguntas sobre que pasa si las muestras son pequenas
- Preguntas sobre outliers detectados y su impacto
```

#### Update "SALUDO INICIAL" (line 335)

**Current greeting example starts with:**
```
"Hola! Soy el Asistente del Setec AI Hub, especialista en MSA (Gauge R&R) y Analisis de Capacidad de Proceso.
```

**Replace with:**
```
"Hola! Soy el Asistente del Setec AI Hub, especialista en MSA (Gauge R&R), Analisis de Capacidad de Proceso, y Prueba de Hipotesis de 2 Muestras.
```

**Current template list:**
```
Para realizar un analisis, ve a la seccion **'Plantillas'** en el menu lateral izquierdo y descarga la plantilla correspondiente (MSA o Analisis de Capacidad de Proceso).
```

**Replace with:**
```
Para realizar un analisis, ve a la seccion **'Plantillas'** en el menu lateral izquierdo y descarga la plantilla correspondiente (MSA, Analisis de Capacidad de Proceso, o Prueba de Hipotesis de 2 Muestras).
```

**Current capabilities mention:**
```
Tambien puedo explicarte conceptos como Cp, Cpk, Pp, Ppk, normalidad, sigma de corto plazo (Within), sigma de largo plazo (Overall), repetibilidad, reproducibilidad, etc.
```

**Replace with:**
```
Tambien puedo explicarte conceptos como Cp, Cpk, Pp, Ppk, normalidad, repetibilidad, reproducibilidad, pruebas de hipotesis, test de Levene, t-test, intervalos de confianza, etc.
```

### Filter Agent Updates

**File:** `lib/openai/prompts.ts` -- `FILTER_SYSTEM_PROMPT`

Add a new follow-up section after "Seguimiento de Analisis de Capacidad de Proceso" (after line 81):

```
Seguimiento de Analisis de Hipotesis 2 Muestras:
- Si el mensaje anterior contiene resultados de hipotesis (test de Levene, t-test, p-value, varianzas), PERMITIR cualquier pregunta sobre esos resultados
- Preguntas sobre varianzas, medias, t-test, Levene, p-value
- Preguntas sobre interpretacion de boxplots o histogramas
- Preguntas sobre normalidad, robustez, outliers
- Preguntas sobre intervalos de confianza
- Preguntas sobre que acciones tomar basandose en los resultados
- Respuestas a preguntas de configuracion del agente ("95%", "bilateral", "no", "si", "desigualdad", "mayor", "menor")
```

Also in the "Estadistica y analisis" section (around line 47), the keyword "pruebas de hipotesis" is already listed. Verify it's present -- no change needed there.

### Architecture Compliance

**Pattern compliance:**
- System prompt follows the exact same structure as MSA and Capacidad de Proceso flows
- 3-part result presentation (Tecnico / Ejecutivo / Terrenal) matches existing patterns
- Follow-up Q&A section matches existing MSA and Capacidad patterns
- Route handler fix follows existing parameter passing pattern

**No new files created.** Two files modified:
1. `lib/openai/prompts.ts` -- system prompt text changes (both MAIN and FILTER)
2. `app/api/chat/route.ts` -- bug fix: add 2 parameters to function call

### Library & Framework Requirements

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| TypeScript | TypeScript | 5.x strict mode | Route handler types |
| Next.js | Next.js | 16 with App Router | Build verification |
| OpenAI | openai SDK | Current | Tool call argument types |

**No new dependencies.** Only text changes and a 2-argument function call fix.

### File Structure Requirements

**Files to MODIFY:**
```
lib/openai/prompts.ts          # MAIN_SYSTEM_PROMPT + FILTER_SYSTEM_PROMPT text updates
app/api/chat/route.ts          # Bug fix: pass confidence_level and alternative_hypothesis to invokeAnalysisTool
```

**Files to READ (reference only -- do NOT modify):**
```
lib/openai/tools.ts            # Verify tool definition has the parameters (already done in 11.1)
lib/api/analyze.ts             # Verify invokeAnalysisTool accepts the parameters (already done in 11.1)
lib/openai/main-agent.ts       # Verify how MAIN_SYSTEM_PROMPT is used (append fileContext)
lib/openai/filter-agent.ts     # Verify how FILTER_SYSTEM_PROMPT is used
types/analysis.ts              # Reference for result field names used in presentation instructions
```

**DO NOT create new files.** All changes go in existing files.

### Testing Requirements

**This story is primarily prompt text + a 2-line code fix. Testing approach:**

1. **Type checking:** `npx tsc --noEmit` -- validates route.ts change compiles
2. **Build verification:** `npm run build` -- ensures no issues
3. **No unit tests needed** for prompt text changes
4. **The route.ts fix is trivially correct** -- adding 2 already-typed arguments to a function that already accepts them

**Verification commands:**
```bash
npx tsc --noEmit        # Zero new TypeScript errors
npm run build            # Successful build
```

**Pre-existing test failures:** Some MSA chart-related tests are known to fail. Do NOT fix these.

### Previous Story Intelligence

**From Story 11.1 (Type Definitions, Tool Parameters & Plantillas Integration):**

1. **Tool definition already supports hypothesis params.** `confidence_level` (enum: [0.90, 0.95, 0.99]) and `alternative_hypothesis` (enum: ['two-sided', 'greater', 'less']) are defined in `lib/openai/tools.ts`. They are NOT in the `required` array (optional, defaults in Python).

2. **`invokeAnalysisTool` already accepts the params.** Parameters 5 (`confidenceLevel?: number`) and 6 (`alternativeHypothesis?: string`) were added in Story 11.1.

3. **Route handler was NOT updated in 11.1 -- by design.** The story notes: "chat route caller update deferred to Story 11.3." This is the story that fixes it.

4. **JSDoc and description updates were done.** The tool description mentions "Prueba de Hipotesis de 2 Muestras" and the analyze.ts JSDoc was updated.

**From Story 11.2 (BoxplotChart Component & Chart Container):**

1. **All charts are wired up.** `ChatMessage.tsx` already extracts `histogram_a`, `histogram_b`, `boxplot_variance`, `boxplot_means` from chartData and renders via `Hipotesis2MCharts`.

2. **Chart titles include p-values.** Variance boxplot shows "Levene p=X.XXXX: conclusion". Means boxplot shows "t-test p=X.XXXX: conclusion". The system prompt should mention this.

3. **No additional ChatMessage changes needed.** The chart integration is complete.

**From Story 10.4 (Results Assembly, Chart Data & Instructions):**

1. **Python `instructions` field contains 5-part markdown** with `<!-- AGENT_ONLY -->` blocks. The route handler strips agent-only blocks before streaming to client. The system prompt should instruct the agent to use these instructions for presentation.

2. **Result field names use snake_case.** When referencing result fields in the system prompt (e.g., `results.sample_size.a.small_sample_warning`), use the exact Python key names since they come through as JSON.

3. **Warnings array.** `results.warnings` contains Spanish warning messages that the agent should present.

### Git Intelligence

**Recent commits:** `feat:` prefix for features, concise English summaries.

**Most recent:** `feat: Remove Estabilidad and Linealidad y Sesgo from MSA analysis` -- shows the prompt has been updated recently for other changes.

**Codebase state:** Stories 11.1 and 11.2 are complete but NOT committed yet (changes are staged/modified). The system prompt in `lib/openai/prompts.ts` is the version without hypothesis testing sections.

### Project Structure Notes

- System prompt is a single template literal in `lib/openai/prompts.ts`, exported as `MAIN_SYSTEM_PROMPT`
- Filter prompt is also in the same file, exported as `FILTER_SYSTEM_PROMPT`
- The prompt is concatenated with `fileContext` in `main-agent.ts` via `streamMainAgentWithTools`
- `<!-- AGENT_ONLY -->` blocks in instructions are stripped by `route.ts` before streaming -- the agent sees them but the user doesn't
- All UI text in the prompt is in Spanish
- The prompt does NOT use template literals with variables -- it's a static string

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-11, Story 11.3 -- Lines 2359-2413]
- [Source: _bmad-output/planning-artifacts/prd-v4.md#FR-H3, FR-H4, FR-H13, FR-H29]
- [Source: lib/openai/prompts.ts -- MAIN_SYSTEM_PROMPT to EXTEND]
- [Source: lib/openai/prompts.ts -- FILTER_SYSTEM_PROMPT to EXTEND]
- [Source: app/api/chat/route.ts#L353-358 -- BUG: missing parameter forwarding]
- [Source: lib/openai/tools.ts -- tool definition with confidence_level and alternative_hypothesis]
- [Source: lib/api/analyze.ts#invokeAnalysisTool -- function signature with params 5 and 6]
- [Source: _bmad-output/implementation-artifacts/11-1-type-definitions-tool-parameters-plantillas-integration.md -- Previous story context]
- [Source: _bmad-output/implementation-artifacts/11-2-boxplot-chart-component-chart-container.md -- Previous story context]
- [Source: types/analysis.ts -- Result interface field names for presentation instructions]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- No debug issues encountered. All changes compiled and built successfully on first attempt.

### Completion Notes List

- **Task 1:** Fixed critical bug in `app/api/chat/route.ts` — added `args.confidence_level` and `args.alternative_hypothesis` as 5th and 6th arguments to `invokeAnalysisTool()`. Also extended the `args` type definition to include the new optional fields. Added debug logging following existing pattern.
- **Task 2:** Updated `MAIN_SYSTEM_PROMPT` in `lib/openai/prompts.ts` with complete Hipótesis 2 Muestras support: updated "SOBRE EL SETEC AI HUB" section, added capabilities, added full analysis flow (5 steps including confidence level, hypothesis direction, and n<30 conditional), added 3-part results presentation, added chart descriptions for 4 graphs, added follow-up Q&A section, and updated greeting to mention the new analysis type.
- **Task 3:** Updated `FILTER_SYSTEM_PROMPT` in `lib/openai/prompts.ts` with "Seguimiento de Análisis de Hipótesis 2 Muestras" section including follow-up question categories and configuration response keywords. Verified "pruebas de hipótesis" keyword already present in allow list.
- **Task 4:** Build verification passed — `npx tsc --noEmit` showed zero new TypeScript errors (all errors are pre-existing in test files), `npm run build` completed successfully.

### Change Log

- 2026-03-14: Implemented Story 11.3 — Agent Conversational Flow & System Prompt for Hipótesis 2 Muestras. Fixed route.ts parameter forwarding bug, added complete conversational flow and result presentation instructions to MAIN_SYSTEM_PROMPT, updated FILTER_SYSTEM_PROMPT with hypothesis follow-up support.
- 2026-03-14: Code review fixes — Normalized arrow style (`->` → `→`) in Hipótesis prompt sections for consistency with existing MSA/Capacidad sections. Reordered Hipótesis presentation/charts sections to after MSA section per architectural spec.

### File List

- `app/api/chat/route.ts` — Modified: added confidence_level and alternative_hypothesis to args type and invokeAnalysisTool() call, added debug logging
- `lib/openai/prompts.ts` — Modified: MAIN_SYSTEM_PROMPT updated with hypothesis testing flow, presentation, charts, follow-up sections, and greeting; FILTER_SYSTEM_PROMPT updated with hypothesis follow-up section
