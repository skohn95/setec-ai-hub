# Story 12.4: Agent Conversational Flow & System Prompt

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the AI agent to guide me step by step through defining my sample size parameters,
So that I get a clear recommendation without needing to know the statistical formula.

## Acceptance Criteria

### AC 1: Intent Recognition & Variable Explanation
- **Given** a user writes something indicating sample size intent (e.g., "cuantas muestras necesito", "tamano de muestra", "calcular muestras")
- **When** the agent detects the intent
- **Then** the agent explains the 4 key variables (Delta, Alpha, Power, Sigma) in simple business language
- **And** the explanations are practical and applied, not academic jargon

### AC 2: One-by-One Questioning (7-Step Flow)
- **Given** the agent has explained the variables
- **When** the conversational flow begins
- **Then** the agent asks questions ONE BY ONE in this order:
  a) Media actual estimada
  b) Media esperada despues de mejora
  c) Diferencia minima relevante (Delta)
  d) Desvio estandar historico (Sigma)
  e) Nivel de alfa
  f) Poder estadistico
  g) Bilateral o unilateral
- **And** the agent waits for the user's response before asking the next question

### AC 3: Delta Auto-Calculation from Means
- **Given** the user provided media actual = 15.2 and media esperada = 14.8
- **When** the agent asks about Delta
- **Then** the agent calculates |14.8 - 15.2| = 0.4 and asks: "Entonces la diferencia minima relevante seria 0.4. Es esa diferencia economicamente significativa, o necesitas detectar una diferencia mas pequena?"
- **And** the agent waits for confirmation or adjustment

### AC 4: Sigma Estimation Help
- **Given** the user doesn't know their sigma
- **When** the agent asks about sigma
- **Then** the agent offers help: suggests using historical data or range/4 as a rough estimate
- **And** the agent does NOT proceed until the user provides a value

### AC 5: Alpha/Power Defaults with Explanation
- **Given** the user doesn't know what alpha or power to choose
- **When** the agent asks about alpha/power
- **Then** the agent suggests 0.05 / 80% and explains in business language ("esto significa que aceptas un 5% de probabilidad de detectar una diferencia cuando no la hay" / "si la diferencia real existe, tienes 80% de probabilidad de detectarla")
- **And** the agent waits for the user to accept or choose a different value

### AC 6: No Value Assumption Without Asking
- **Given** any parameter in the 7-question flow
- **When** the agent guides the user
- **Then** the agent never assumes a value without explicitly asking the user
- **And** each parameter is confirmed by the user before proceeding

### AC 7: Tool Invocation with All Parameters
- **Given** all 7 parameters have been collected
- **When** the agent invokes the analyze tool
- **Then** it passes `analysis_type='tamano_muestra'` with all parameters (delta, sigma, alpha, power, alternative_hypothesis, current_mean, expected_mean)
- **And** it does NOT send a `file_id`

### AC 8: Results Presentation (5-Part Structure)
- **Given** the analysis results are returned
- **When** the agent presents the results
- **Then** it follows the 5-part structure from the instructions markdown:
  1. Parameters table
  2. n per group result (clearly stated as PER GROUP)
  3. Evaluation/classification
  4. Sensitivity table
  5. Strategic recommendations
- **And** all presentation is in Spanish

### AC 9: Follow-Up Re-Calculation
- **Given** the user asks a follow-up like "y si mi sigma es realmente 0.8?"
- **When** the agent processes the follow-up
- **Then** it re-invokes the tool with the modified parameter (sigma=0.8) and all other original parameters
- **And** it presents the new results without repeating the full 7-question flow

### AC 10: Never Execute Hypothesis Test
- **Given** the user asks to run the actual hypothesis test after seeing sample size results
- **When** the agent processes the request
- **Then** it does NOT execute a hypothesis test
- **And** it responds: the user should first collect their data and then use the "Test de Hipotesis: 2 Muestras" analysis
- **And** it suggests downloading the hipotesis template from Plantillas

### AC 11: System Prompt Updated
- **Given** the system prompt for the principal agent
- **When** it is updated for the new analysis type
- **Then** it includes instructions for recognizing sample size calculation intent
- **And** it includes the 7-question coaching flow with coaching guidance for each question
- **And** it includes the guard against executing the hypothesis test
- **And** it includes the follow-up re-calculation behavior

### AC 12: Filter Agent Updated
- **Given** the filter agent system prompt
- **When** it is updated for the new analysis type
- **Then** it allows sample size calculation related messages
- **And** it allows numerical responses during the parameter collection flow
- **And** it allows follow-up questions about sample size results

## Tasks / Subtasks

- [x] Task 1: Update MAIN_SYSTEM_PROMPT — "SOBRE EL SETEC AI HUB" and "CAPACIDADES" sections (AC: 11)
  - [x] 1.1 In `lib/openai/prompts.ts`, update "Analisis disponibles actualmente" line to include "Calculo de Tamano de Muestra"
  - [x] 1.2 Add capability: "Calcular tamano de muestra minimo para comparacion de 2 medias — sin archivo requerido, guia conversacional paso a paso"
  - [x] 1.3 Update "HERRAMIENTA DE ANALISIS" description to mention tamano_muestra does NOT require file_id

- [x] Task 2: Add "FLUJO DE ANALISIS TAMANO DE MUESTRA" section to MAIN_SYSTEM_PROMPT (AC: 1-7, 10, 11)
  - [x] 2.1 Add the complete flow section AFTER the "FLUJO DE ANALISIS HIPOTESIS 2 MUESTRAS" section
  - [x] 2.2 Include Step 1: Intent detection — trigger on "tamano de muestra", "cuantas muestras", "cuantas mediciones", "calcular muestras", "diseno muestral"
  - [x] 2.3 Include Step 2: Explain 4 variables (Delta, Alpha, Power, Sigma) in business language
  - [x] 2.4 Include Step 3: 7-question coaching sequence with per-question coaching guidance
  - [x] 2.5 Include Step 4: Tool invocation with all parameters (NO file_id)
  - [x] 2.6 Include Step 5: Guard — NEVER execute hypothesis test, redirect to "Test de Hipotesis: 2 Muestras"
  - [x] 2.7 Include "CUANDO INVOCAR" section with trigger patterns

- [x] Task 3: Add "PRESENTACION DE RESULTADOS DE TAMANO DE MUESTRA" section to MAIN_SYSTEM_PROMPT (AC: 8, 11)
  - [x] 3.1 Add after the "GRAFICOS DE HIPOTESIS 2 MUESTRAS" section
  - [x] 3.2 Define 5-part structure: Parameters, Result (PER GROUP), Evaluation, Sensitivity, Recommendations
  - [x] 3.3 Note: NO charts — this is text-only presentation
  - [x] 3.4 Agent should present the `instructions` markdown from Python directly (it already has the 5-part structure)

- [x] Task 4: Add follow-up Q&A section for Tamano de Muestra to MAIN_SYSTEM_PROMPT (AC: 9, 10, 11)
  - [x] 4.1 Add "Seguimiento de Analisis de Tamano de Muestra" section after existing follow-up sections
  - [x] 4.2 Include re-calculation guidance: "y si" questions trigger re-invocation with modified parameter
  - [x] 4.3 Include hypothesis test guard: redirect to "Test de Hipotesis: 2 Muestras"
  - [x] 4.4 Include template download suggestion for when user is ready to collect data

- [x] Task 5: Update "SALUDO INICIAL" in MAIN_SYSTEM_PROMPT (AC: 11)
  - [x] 5.1 Add "Calculo de Tamano de Muestra" to the greeting specialist list
  - [x] 5.2 Add note in greeting that sample size calculation does NOT require a file — just a conversation
  - [x] 5.3 Update template list mention and capabilities mention in greeting example

- [x] Task 6: Update FILTER_SYSTEM_PROMPT (AC: 12)
  - [x] 6.1 Add "tamano de muestra", "cuantas muestras", "tamano muestral", "diseno muestral" to the "Estadistica y analisis" allow list
  - [x] 6.2 Add "Seguimiento de Analisis de Tamano de Muestra" section with follow-up question patterns
  - [x] 6.3 Add parameter response keywords to "Respuestas directas" section (if not already covered by existing numeric/confirmation rules)

- [x] Task 7: Build verification (AC: all)
  - [x] 7.1 Run `npx tsc --noEmit` — zero new TypeScript errors (all errors are pre-existing in test files)
  - [x] 7.2 Run `npm run build` — successful build

## Dev Notes

### Developer Context

This is **Story 12.4 in Epic 12** (Sample Size Calculator for 2-Sample Comparison). This is the FINAL story in Epic 12 — it wires up the agent's conversational intelligence for the new analysis type.

**Pre-completed work from Stories 12.1-12.3:**
- Python endpoint fully routes tamano_muestra requests without file_id, validates all parameters (Story 12.1)
- Python calculator (`api/utils/tamano_muestra_calculator.py`) computes sample size, classification, sensitivity analysis, and generates 5-part Spanish markdown instructions (Story 12.2)
- TypeScript tool definition includes `tamano_muestra` in enum with all parameters: delta, sigma, alpha, power, alternative_hypothesis, current_mean, expected_mean (Story 12.1/12.3)
- `invokeAnalysisTool` in `lib/api/analyze.ts` accepts optional fileId and SampleSizeParams (Story 12.1/12.3)
- Route handler in `app/api/chat/route.ts` builds sampleSizeParams conditionally and forwards them (Story 12.1)
- `TamanoMuestraResult` TypeScript interface matches Python output exactly (Story 12.3)
- All 671+ Python tests pass, TypeScript compiles clean, Next.js builds successfully

**What this story completes (ONLY 2 files modified):**
1. `lib/openai/prompts.ts` — MAIN_SYSTEM_PROMPT text additions for conversational flow, result presentation, follow-up
2. `lib/openai/prompts.ts` — FILTER_SYSTEM_PROMPT text additions for sample size message filtering

**NO code changes to route handler, tools, API client, or Python backend.** This is purely a prompt engineering story.

### Critical: This Analysis is DIFFERENT from All Others

Every previous analysis (MSA, Capacidad, Hipotesis) follows this pattern:
1. User uploads file
2. Agent asks 0-2 config questions
3. Agent invokes tool with file_id
4. Agent presents results

Tamano de Muestra is fundamentally different:
1. **NO file upload** — purely conversational
2. **7-question coaching flow** — the agent IS the data collection mechanism
3. **Agent calculates delta from means** — computation logic in the prompt
4. **Agent provides coaching/defaults** — pedagogical guidance for each parameter
5. **Agent must NEVER execute hypothesis test** — explicit guard required
6. **Re-calculation support** — "what if" questions modify parameters without repeating flow
7. **No charts** — text-only results

### System Prompt Architecture

**File:** `lib/openai/prompts.ts`

The file exports two prompts:
1. `FILTER_SYSTEM_PROMPT` — used by `filter-agent.ts` (model: `gpt-5-nano`)
2. `MAIN_SYSTEM_PROMPT` — used by `main-agent.ts` (model: `gpt-5`)

**MAIN_SYSTEM_PROMPT current structure with insertion points:**
```
IDENTIDAD
SOBRE SETEC
CONTACTO SETEC
SOBRE EL SETEC AI HUB                       ← UPDATE: add Tamano de Muestra
CAPACIDADES                                  ← UPDATE: add sample size calculation
HERRAMIENTA DE ANALISIS                      ← UPDATE: note tamano_muestra no file
FLUJO DE ANALISIS MSA
FLUJO DE CAPACIDAD DE PROCESO
FLUJO DE HIPOTESIS 2 MUESTRAS
                                             ← ADD: FLUJO DE TAMANO DE MUESTRA
PRESENTACION CAPACIDAD DE PROCESO
PRESENTACION MSA
PRESENTACION HIPOTESIS 2 MUESTRAS
GRAFICOS HIPOTESIS 2 MUESTRAS
                                             ← ADD: PRESENTACION TAMANO DE MUESTRA
MANEJO DE ERRORES
ARCHIVOS MULTIPLES
PREGUNTAS DE SEGUIMIENTO
  Seguimiento Capacidad
  Seguimiento MSA (implied in follow-up)
  Seguimiento Hipotesis 2 Muestras
                                             ← ADD: Seguimiento Tamano de Muestra
SALUDO INICIAL                               ← UPDATE: mention Tamano de Muestra
INSTRUCCIONES GENERALES
PLANTILLAS
```

### Exact Content for System Prompt Updates

#### Task 1: Update "SOBRE EL SETEC AI HUB" (line 146)

**Current:**
```
- Analisis disponibles actualmente: MSA (Gauge R&R), Analisis de Capacidad de Proceso (Cp, Cpk, Pp, Ppk), y Test de Hipotesis de 2 Muestras
```

**Replace with:**
```
- Analisis disponibles actualmente: MSA (Gauge R&R), Analisis de Capacidad de Proceso (Cp, Cpk, Pp, Ppk), Test de Hipotesis de 2 Muestras, y Calculo de Tamano de Muestra
```

#### Task 1: Update "CAPACIDADES" (after line 161)

**Add these lines after the existing capabilities:**
```
- Calcular tamano de muestra minimo para comparacion de 2 medias — sin archivo requerido, guia conversacional paso a paso
- Explicar las variables del calculo de tamano de muestra (Delta, Alfa, Poder, Sigma) en lenguaje de negocio
```

#### Task 1: Update "HERRAMIENTA DE ANALISIS" (after line 165)

**Add clarification:**
```
Para analisis de tamano de muestra (tamano_muestra): NO se requiere archivo. Los parametros se recolectan conversacionalmente y se pasan directamente a la herramienta.
```

#### Task 2: Add "FLUJO DE ANALISIS TAMANO DE MUESTRA" (after FLUJO HIPOTESIS, after line 239)

```
FLUJO DE ANALISIS TAMANO DE MUESTRA - PASO A PASO:

IMPORTANTE: Este analisis NO requiere archivo. Es puramente conversacional.

**PASO 1: Detectar intencion**
- Si el usuario menciona: "tamano de muestra", "cuantas muestras", "cuantas mediciones necesito", "calcular muestras", "diseno muestral", "cuantos datos necesito" → activar flujo de tamano de muestra
- NO pedir archivo. NO dirigir a Plantillas. Este analisis es conversacional.

**PASO 2: Explicar las 4 variables clave**
- Antes de preguntar, explica las 4 variables que influyen en el calculo:
  - **Delta (Diferencia):** La diferencia minima que consideras practicamente significativa. Si el proceso cambia por esta cantidad, quieres detectarlo.
  - **Alfa (Significancia):** Tu tolerancia al falso positivo. Que tan dispuesto estas a concluir que hay diferencia cuando no la hay.
  - **Poder:** Tu capacidad de detectar una diferencia real. Que tan seguro quieres estar de no dejar pasar un efecto verdadero.
  - **Sigma (Variabilidad):** La variabilidad natural del proceso. A mayor variabilidad, mas muestras necesitas.
- Usa lenguaje de negocio, no jerga estadistica.

**PASO 3: Recolectar parametros UNO POR UNO**
- Pregunta en este orden, esperando respuesta antes de continuar:

  a) Media actual estimada:
     Pregunta: "¿Cual es la media actual estimada del proceso?"
     Sin coaching especial.

  b) Media esperada despues de mejora:
     Pregunta: "¿Cual es la media esperada despues de la mejora?"
     Sin coaching especial.

  c) Diferencia minima relevante (Delta):
     Si el usuario ya dio a) y b): calcula Delta = |media_esperada - media_actual| y pregunta: "Entonces la diferencia minima relevante seria [valor]. ¿Es esa diferencia economicamente significativa, o necesitas detectar una diferencia mas pequena?"
     Si el usuario NO dio a) y b): pregunta directamente el valor de Delta.
     ESPERA confirmacion o ajuste.

  d) Desvio estandar historico (Sigma):
     Pregunta: "¿Cual es el desvio estandar historico del proceso?"
     Si el usuario no lo conoce: sugiere usar datos historicos o rango de datos conocidos / 4 como estimacion. Acepta el valor que el usuario provea.
     NO avanzar sin un valor concreto.

  e) Nivel de alfa:
     Pregunta: "¿Que nivel de significancia (alfa) deseas?"
     Si el usuario no sabe: sugiere 0.05 y explica: "esto significa que aceptas un 5% de probabilidad de detectar una diferencia cuando no la hay (falso positivo)."
     ESPERA que el usuario acepte o elija otro valor.

  f) Poder estadistico:
     Pregunta: "¿Que poder estadistico deseas?"
     Si el usuario no sabe: sugiere 80% (0.80) y explica: "esto significa que si la diferencia real existe, tienes 80% de probabilidad de detectarla."
     ESPERA que el usuario acepte o elija otro valor.

  g) Bilateral o unilateral:
     Pregunta: "¿Tu prueba futura sera bilateral (μA ≠ μB) o unilateral (μA > μB o μA < μB)?"
     Si el usuario no sabe: sugiere bilateral y explica que es la opcion mas conservadora.
     ESPERA la respuesta.

REGLA CRITICA: NUNCA asumas valores sin preguntar. Cada parametro debe ser confirmado por el usuario.

**PASO 4: Ejecutar calculo**
- SOLO cuando tengas los 7 parametros, invoca: analyze(analysis_type='tamano_muestra', delta=X, sigma=Y, alpha=Z, power=W, alternative_hypothesis='...', current_mean=A, expected_mean=B)
- NO enviar file_id.
- current_mean y expected_mean son opcionales — incluir solo si el usuario los proporciono.

**PASO 5: Guardia — NUNCA ejecutar test de hipotesis**
- Si el usuario pide ejecutar el test de hipotesis despues de ver los resultados de tamano de muestra:
  - NO ejecutar el test.
  - Responder: "El calculo de tamano de muestra es una herramienta de diseno — te dice cuantas muestras recolectar. Para ejecutar el test de hipotesis, primero necesitas recolectar tus datos con el tamano calculado y luego usar el analisis 'Test de Hipotesis: 2 Muestras'. Puedes descargar la plantilla desde la seccion 'Plantillas' en el menu lateral."

CUANDO ACTIVAR FLUJO DE TAMANO DE MUESTRA:
1. Usuario menciona tamano de muestra/cuantas muestras/calcular muestras/diseno muestral → INICIAR flujo de coaching
2. NO requiere archivo — este analisis es 100% conversacional
3. Si el usuario ya proporciono todos los parametros en un solo mensaje → INVOCA 'analyze' directamente sin repetir las preguntas
```

#### Task 3: Add "PRESENTACION DE RESULTADOS DE TAMANO DE MUESTRA" (after GRAFICOS HIPOTESIS, after line 360)

```
PRESENTACION DE RESULTADOS DE TAMANO DE MUESTRA:
Cuando la herramienta retorne resultados de tamano de muestra, presenta los resultados usando el contenido del campo 'instructions' que ya contiene la estructura completa en 5 partes:

1. **Parametros Utilizados** — Tabla con todos los valores ingresados
2. **Resultado** — n por grupo (SIEMPRE indicar claramente que es POR GRUPO)
3. **Evaluacion** — Clasificacion segun umbrales:
   - n >= 30: Adecuado (TCL aplica) 🟢
   - 15 <= n < 30: Verificar normalidad 🟡
   - n < 15: Muestra debil 🔴
4. **Analisis de Sensibilidad** — Tabla con escenarios alternativos (delta reducida, poder aumentado, variabilidad duplicada)
5. **Recomendaciones** — Acciones practicas basadas en los resultados

IMPORTANTE:
- NO hay graficos para este analisis — es solo texto
- El campo 'instructions' del resultado contiene el markdown completo — presentalo directamente
- Asegurate de que el usuario entienda que n es POR GRUPO (necesita n del grupo A Y n del grupo B)
- Si n > 1000, enfatizar la advertencia de que puede no ser practico
```

#### Task 4: Add follow-up section (after Seguimiento Hipotesis, after line 425)

```
Seguimiento de Analisis de Tamano de Muestra:
- Si el usuario hizo un calculo de tamano de muestra, PERMITIR y RESPONDER a:
  - Preguntas "¿y si...?" (ej: "¿y si mi sigma es 0.8?", "¿que pasa con poder de 90%?"): RE-INVOCAR la herramienta con el parametro modificado y los demas parametros originales. NO repetir el flujo completo de 7 preguntas.
  - Preguntas sobre el resultado (ej: "¿que significa adecuado?", "¿por que necesito tantas muestras?"): Responder usando el contexto de la conversacion.
  - Preguntas sobre sensibilidad (ej: "¿que pasa si la diferencia es mas chica?"): Explicar usando la tabla de sensibilidad ya calculada.
  - Preguntas sobre siguientes pasos (ej: "¿y ahora que hago?"): Explicar que debe recolectar los datos con el tamano calculado y luego usar "Test de Hipotesis: 2 Muestras". Sugerir descargar la plantilla de hipotesis desde Plantillas.
  - Solicitudes de ejecutar el test de hipotesis: RECHAZAR — indicar que primero debe recolectar datos y luego usar el otro analisis.
- NUNCA ejecutar hipotesis_2_muestras desde el flujo de tamano de muestra
```

#### Task 5: Update "SALUDO INICIAL" (lines 427-441)

**Current greeting specialist line:**
```
"¡Hola! Soy el Asistente del Setec AI Hub, especialista en MSA (Gauge R&R), Analisis de Capacidad de Proceso, y Test de Hipotesis de 2 Muestras.
```

**Replace with:**
```
"¡Hola! Soy el Asistente del Setec AI Hub, especialista en MSA (Gauge R&R), Analisis de Capacidad de Proceso, Test de Hipotesis de 2 Muestras, y Calculo de Tamano de Muestra.
```

**Current template mention:**
```
Para realizar un analisis, ve a la seccion **'Plantillas'** en el menu lateral izquierdo y descarga la plantilla correspondiente (MSA, Analisis de Capacidad de Proceso, o Test de Hipotesis de 2 Muestras). Esa plantilla define el formato exacto que necesito para procesar tus datos.
```

**Replace with:**
```
Para realizar un analisis con datos, ve a la seccion **'Plantillas'** en el menu lateral izquierdo y descarga la plantilla correspondiente (MSA, Analisis de Capacidad de Proceso, o Test de Hipotesis de 2 Muestras). Esa plantilla define el formato exacto que necesito para procesar tus datos.

Para calcular el tamano de muestra antes de un experimento, simplemente preguntame — no necesitas archivo, te guio paso a paso.
```

**Current capabilities mention:**
```
Tambien puedo explicarte conceptos como Cp, Cpk, Pp, Ppk, normalidad, repetibilidad, reproducibilidad, tests de hipotesis, test de Levene, t-test, intervalos de confianza, etc.
```

**Replace with:**
```
Tambien puedo explicarte conceptos como Cp, Cpk, Pp, Ppk, normalidad, repetibilidad, reproducibilidad, tests de hipotesis, test de Levene, t-test, intervalos de confianza, tamano de muestra, poder estadistico, etc.
```

#### Task 6: Filter Agent Updates

**File:** `lib/openai/prompts.ts` — `FILTER_SYSTEM_PROMPT`

**6.1 — Add to "Estadistica y analisis" section (around line 48, after the existing line about hypothesis tests):**

Add after the line `- Preguntas sobre tests de hipotesis, test de hipotesis, hipotesis de 2 muestras, comparacion de muestras`:
```
- Preguntas sobre tamano de muestra, cuantas muestras, cuantas mediciones, diseno muestral, calculo de muestras
```

**6.2 — Add to "Analisis de datos" section (around line 53, after "solicitudes para realizar cualquiera de los analisis disponibles"):**

Update the list of available analyses:
```
- Solicitudes para realizar cualquiera de los analisis disponibles (MSA, capacidad de proceso, hipotesis de 2 muestras, tamano de muestra)
```

**6.3 — Add "Seguimiento de Analisis de Tamano de Muestra" section (after the "Seguimiento de Analisis de Hipotesis 2 Muestras" section, after line 93):**
```
Seguimiento de Analisis de Tamano de Muestra:
- Si el mensaje anterior contiene resultados de tamano de muestra (n por grupo, sensibilidad, clasificacion), PERMITIR cualquier pregunta sobre esos resultados
- Preguntas tipo "¿y si...?" para recalcular con parametros diferentes
- Preguntas sobre que significa el resultado, la clasificacion, o la sensibilidad
- Preguntas sobre siguientes pasos despues del calculo
- Respuestas numericas a preguntas del agente durante la recoleccion de parametros (valores de delta, sigma, alfa, poder, medias)
- Respuestas de confirmacion durante la recoleccion ("si", "correcto", "0.05", "80%", "bilateral")
```

### Architecture Compliance

**Pattern compliance:**
- System prompt follows the exact same structure as MSA, Capacidad, and Hipotesis 2 Muestras flows
- Follow-up Q&A section matches existing patterns
- Filter agent section matches existing analysis type sections

**Key difference from other flows:**
- No "PASO 1: Verificar archivo" step — this analysis is file-less
- 7-step coaching flow instead of 2-step config
- Agent performs computation (delta = |b - a|) within the conversational flow
- Explicit guard against executing hypothesis test

### Project Structure Notes

- Only `lib/openai/prompts.ts` needs modification (text changes to MAIN_SYSTEM_PROMPT and FILTER_SYSTEM_PROMPT)
- No new files needed
- No new dependencies
- No Python changes needed
- No route handler changes needed
- No TypeScript type changes needed

### Library & Framework Requirements

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| TypeScript | TypeScript | 5.x strict mode | Build verification only |
| Next.js | Next.js | 16 with App Router | Build verification only |

**No new dependencies.** Only text changes to prompt strings.

### File Structure Requirements

**Files to MODIFY:**
```
lib/openai/prompts.ts          # MAIN_SYSTEM_PROMPT + FILTER_SYSTEM_PROMPT text updates
```

**Files to READ (reference only — DO NOT modify):**
```
lib/openai/tools.ts            # Verify tool definition has tamano_muestra params (done in 12.1)
lib/api/analyze.ts             # Verify invokeAnalysisTool accepts SampleSizeParams (done in 12.1)
lib/openai/main-agent.ts       # Verify how MAIN_SYSTEM_PROMPT is used (concatenated with fileContext)
lib/openai/filter-agent.ts     # Verify how FILTER_SYSTEM_PROMPT is used (with FilterContext)
app/api/chat/route.ts          # Verify sampleSizeParams forwarding (done in 12.1)
api/utils/tamano_muestra_calculator.py  # Verify instructions output structure (5-part markdown)
```

**DO NOT create new files.** All changes go in `lib/openai/prompts.ts`.

### Testing Requirements

This story is purely prompt text. Testing approach:

1. **Type checking:** `npx tsc --noEmit` — validates prompts.ts compiles (template literal)
2. **Build verification:** `npm run build` — ensures no issues
3. **No unit tests needed** for prompt text changes

**Verification commands:**
```bash
npx tsc --noEmit        # Zero new TypeScript errors
npm run build            # Successful build
```

### Previous Story Intelligence

**From Story 12.3 (TypeScript Integration & Tool Definition):**
- All TypeScript types and tool definitions are correct and complete
- TamanoMuestraResult interface matches Python output
- invokeAnalysisTool correctly handles optional fileId and SampleSizeParams
- Route handler builds sampleSizeParams conditionally for tamano_muestra
- 2 bugs were fixed: params_changed → parameters, TamanoMuestraResult added to union
- Build passes clean

**From Story 12.2 (Sample Size Calculator & Sensitivity Engine):**
- Python calculator returns `{ results: { input_parameters, sample_size, classification, sensitivity }, chartData: [], instructions: "..." }`
- Instructions field contains 5-part Spanish markdown with `<!-- AGENT_ONLY -->` header
- The `<!-- AGENT_ONLY -->` block is stripped by route.ts before streaming to user
- Sensitivity array uses `parameters` field (not `params_changed`)
- 42 calculator tests + 29 integration tests pass
- Classification messages are already in Spanish

**From Story 12.1 (Architecture Foundation):**
- file_id is nullable in DB, conditional in Python routing, optional in TypeScript
- Route handler already forwards all tamano_muestra params
- Debug logging already includes delta, sigma, alpha, power
- SampleSizeParams interface already defined

**From Story 11.3 (Hipotesis Agent Flow — PATTERN REFERENCE):**
- Exact same approach: modify MAIN_SYSTEM_PROMPT + FILTER_SYSTEM_PROMPT in `lib/openai/prompts.ts`
- Follow same section ordering and formatting conventions
- 3-part presentation structure (Tecnico/Ejecutivo/Terrenal) is the standard for file-based analyses
- Tamano de Muestra uses 5-part structure instead (different from 3-part because it's text-only with no charts)

### Git Intelligence

**Recent commits show naming convention:**
- `fix: Rename "Prueba de Hipotesis" to "Test de Hipotesis"` — the current name in prompts.ts is "Test de Hipotesis de 2 Muestras" (already updated)
- `feat: Add Hipotesis de 2 Muestras analysis type` — pattern for full-stack analysis

**Working tree state:**
The following files have uncommitted changes from Stories 12.1-12.3:
- `api/analyze.py`, `api/utils/supabase_client.py`, `api/utils/capacidad_proceso_calculator.py`
- `lib/openai/tools.ts`, `lib/api/analyze.ts`, `types/analysis.ts`, `constants/analysis.ts`
- `app/api/chat/route.ts`

**`lib/openai/prompts.ts` is NOT in the working tree changes** — it has no uncommitted edits. The current content is exactly as committed (with Story 11.3's Hipotesis 2 Muestras additions already committed in `9cb994d`).

### Anti-Pattern Prevention

- **DO NOT** ask for or require file upload — tamano_muestra is 100% conversational
- **DO NOT** add a "Paso 1: Verificar archivo" — there is no file for this analysis
- **DO NOT** add chart description sections — tamano_muestra has no charts (chartData is empty array)
- **DO NOT** modify route.ts, tools.ts, analyze.ts, or any Python code — all routing is complete from 12.1-12.3
- **DO NOT** add a template to the Plantillas section — tamano_muestra has no Excel template
- **DO NOT** use the 3-part presentation structure (Tecnico/Ejecutivo/Terrenal) — tamano_muestra uses the 5-part structure from Python instructions
- **DO NOT** assume parameter values in the prompt without asking the user — FR-TM4 explicitly forbids this
- **DO NOT** allow the agent to execute hipotesis_2_muestras from the tamano_muestra flow — FR-TM17 explicitly forbids this
- **DO NOT** create separate prompt files — all prompts live in `lib/openai/prompts.ts`
- **DO NOT** add more than text to `prompts.ts` — no code logic changes, only string content

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-12, Story 12.4 — Lines 2657-2735]
- [Source: _bmad-output/planning-artifacts/prd-v5.md — FR-TM1 through FR-TM17, NFR-TM1 through NFR-TM5]
- [Source: lib/openai/prompts.ts — MAIN_SYSTEM_PROMPT (lines 120-454) and FILTER_SYSTEM_PROMPT (lines 5-113)]
- [Source: lib/openai/filter-agent.ts — FilterContext interface and post-analysis mode logic]
- [Source: lib/openai/main-agent.ts — How MAIN_SYSTEM_PROMPT is concatenated with fileContext at line 201]
- [Source: app/api/chat/route.ts — sampleSizeParams build at lines 367-376, invokeAnalysisTool call at lines 378-386]
- [Source: api/utils/tamano_muestra_calculator.py — _generate_instructions at lines 201-345, 5-part structure]
- [Source: _bmad-output/implementation-artifacts/12-3-typescript-integration-tool-definition.md — Previous story completion notes]
- [Source: _bmad-output/implementation-artifacts/12-1-architecture-foundation-file-id-optional-shared-stats-module.md — Architecture decisions AD-1, AD-2, AD-3]
- [Source: _bmad-output/implementation-artifacts/11-3-agent-conversational-flow-system-prompt.md — Pattern reference for prompt update approach]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- `npx tsc --noEmit`: All errors are pre-existing in test files (middleware.test.ts, privacidad/page.test.tsx, use-conversations.test.tsx, file-context.test.ts, error-logging.test.ts). Zero new errors from prompts.ts changes.
- `npm run build`: Successful build with all 12 routes generated correctly.

### Completion Notes List

- ✅ Task 1: Updated MAIN_SYSTEM_PROMPT "SOBRE EL SETEC AI HUB" to list "Cálculo de Tamaño de Muestra" as available analysis. Added 2 capability lines for sample size calculation and variable explanation. Added clarification in "HERRAMIENTA DE ANÁLISIS" that tamano_muestra requires no file.
- ✅ Task 2: Added complete "FLUJO DE ANÁLISIS TAMAÑO DE MUESTRA - PASO A PASO" section with 5 steps: intent detection, 4-variable explanation, 7-question coaching flow (one-by-one with coaching guidance per question including delta auto-calculation and sigma estimation help), tool invocation without file_id, and hypothesis test guard. Includes "CUÁNDO ACTIVAR" trigger section.
- ✅ Task 3: Added "PRESENTACIÓN DE RESULTADOS DE TAMAÑO DE MUESTRA" section defining the 5-part structure (Parameters, Result PER GROUP, Evaluation with classification thresholds, Sensitivity, Recommendations) and noting no charts, direct instructions markdown presentation, and n>1000 warning.
- ✅ Task 4: Added "Seguimiento de Análisis de Tamaño de Muestra" follow-up section with re-calculation guidance ("¿y si...?"), result explanation, sensitivity interpretation, next steps guidance, and hypothesis test rejection guard.
- ✅ Task 5: Updated "SALUDO INICIAL" — greeting now mentions "Cálculo de Tamaño de Muestra" in specialist list, added note that sample size calculation requires no file ("simplemente pregúntame"), updated template mention to "análisis con datos", and added "tamaño de muestra, poder estadístico" to concepts list.
- ✅ Task 6: Updated FILTER_SYSTEM_PROMPT — added sample size terms to "Estadística y análisis" allow list, updated "Análisis de datos" to include "tamaño de muestra", added complete "Seguimiento de Análisis de Tamaño de Muestra" section with follow-up patterns and parameter response keywords.
- ✅ Task 7: Build verification passed — `npx tsc --noEmit` shows zero new errors (all errors pre-existing in test files), `npm run build` successful.

### File List

- `lib/openai/prompts.ts` — Modified: MAIN_SYSTEM_PROMPT (added tamano_muestra to available analyses, 2 capability lines, HERRAMIENTA clarification, complete FLUJO section, PRESENTACIÓN section, Seguimiento section, updated SALUDO, updated IDENTIDAD, fixed follow-up rule conflict, qualified greeting instruction) and FILTER_SYSTEM_PROMPT (added sample size terms, updated analysis list, added Seguimiento section)
- `lib/openai/prompts.test.ts` — Modified: Added 17 tests for tamano_muestra prompt sections (MAIN_SYSTEM_PROMPT flow, filter support)

## Change Log

- 2026-03-14: Story 12.4 implementation complete — Added agent conversational flow and system prompt updates for Tamaño de Muestra analysis type. All changes are prompt text additions in lib/openai/prompts.ts (MAIN_SYSTEM_PROMPT + FILTER_SYSTEM_PROMPT). No code logic changes.
- 2026-03-14: Code review fixes — Fixed general follow-up rule conflict with tamano_muestra re-calculation (H1), qualified greeting instruction for file-less analysis (M1), added explicit bilateral/unilateral enum mapping (L2), updated IDENTIDAD specialty line (L3), added 17 prompt tests for tamano_muestra coverage (L1). All 61 prompt tests pass, build verified.
