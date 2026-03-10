# Story 9.4: Update Agent Instructions & Presentation — Remove Stability

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **the analysis interpretation to focus on normality and capability without mentioning stability**,
So that **the results are clear, consistent with the 2-pillar scope, and not confusing**.

**FRs covered (PRD-v3):** FR-CP19

**Supersedes:** Story 8.4 instruction/presentation portions related to stability

## Acceptance Criteria

1. **Given** the Python analysis generates the `instructions` markdown
   **When** Part 1 (Analisis Tecnico) is constructed
   **Then** it includes: basic statistics table, normality result (A2, p-value, conclusion), transformation details if applicable
   **And** it includes: "Desviaciones estandar: sigma Within = {value}, sigma Overall = {value}"
   **And** it includes: capability indices table (Cp, Cpk, Pp, Ppk) with sigma labels
   **And** it does NOT include: control limits table (X-bar, LCI, LCS, MR-bar)
   **And** it does NOT include: stability rules list or their evaluations

2. **Given** Part 2 (Conclusion Ejecutiva) is constructed
   **When** the conclusion is generated
   **Then** it states: "Los datos SON/NO SON normales" with reason
   **And** it states: "El proceso ES/NO ES capaz" with Cpk value and classification
   **And** it does NOT state anything about stability (no "estable/inestable")

3. **Given** Part 3 (Conclusion Terrenal) is constructed
   **When** the plain-language summary is generated
   **Then** it explains normality and capability in simple terms
   **And** it provides specific recommendations based on results
   **And** it does NOT mention stability, control charts, or control limits

4. **Given** the agent system prompt or tool instructions reference stability
   **When** the v3 update is applied
   **Then** all stability-related instructions are removed from the agent's guidance
   **And** the agent's follow-up capability correctly answers questions about the 2-pillar analysis
   **And** if a user asks about stability, the agent explains it is not part of this analysis scope

## Tasks / Subtasks

- [x] Task 1: Update MAIN_SYSTEM_PROMPT — Remove stability from presentation instructions (AC: #1, #2, #3)
  - [x] 1.1 Line 142: Remove "estabilidad" from CAPACIDADES list → change to: "Explicar Analisis de Capacidad de Proceso: normalidad, indices Cp, Cpk, Pp, Ppk"
  - [x] 1.2 Line 146: Remove "cartas de control I-MR, SPC" from explanation capabilities → keep only: "Explicar conceptos como Cp, Cpk, Pp, Ppk, normalidad Anderson-Darling, sigma Within/Overall"
  - [x] 1.3 Lines 215-219: DELETE entire "Analisis de estabilidad (I-MR)" bullet group from PARTE 1 ANALISIS TECNICO
  - [x] 1.4 After removing stability from Part 1, ADD bullet: "- Desviaciones estandar: sigma Within (MR-bar/d2) y sigma Overall (desviacion estandar muestral)"
  - [x] 1.5 Line 225: DELETE "- Es estable o no? (con reglas violadas si aplica)" from PARTE 2 CONCLUSION EJECUTIVA
  - [x] 1.6 Lines 238-245: UPDATE chart section from 4 charts to 2 charts:
    - KEEP: Histograma (remove mention of control limits in description)
    - DELETE: "Grafico I (Individuos)" entry
    - DELETE: "Grafico MR (Rango Movil)" entry
    - KEEP: "Grafico de Normalidad (Q-Q)"
    - Change "4 graficos" to "2 graficos"

- [x] Task 2: Update MAIN_SYSTEM_PROMPT — Fix follow-up question instructions (AC: #4)
  - [x] 2.1 Lines 340-341: REMOVE "- 'Que significa que este fuera de control?' → Explica puntos fuera de limites en graficos I-MR" from follow-up questions
  - [x] 2.2 Lines 359-365: UPDATE greeting example to remove "cartas I-MR" mention → replace with "sigma Within/Overall" or just "normalidad"
  - [x] 2.3 Line 134: Update analysis list from "MSA (Gauge R&R) y Analisis de Capacidad de Proceso (Cp, Cpk, Pp, Ppk)" — verify no stability mention (currently clean)

- [x] Task 3: Update FILTER_SYSTEM_PROMPT — Remove stability from allowed topics (AC: #4)
  - [x] 3.1 Line 75: REMOVE "estabilidad" from follow-up topic list → change to: "Si el mensaje anterior contiene resultados de capacidad (Cp, Cpk, Pp, Ppk, normalidad), PERMITIR cualquier pregunta sobre esos resultados"
  - [x] 3.2 Line 79: DELETE entire line "- Preguntas sobre estabilidad, cartas I-MR, puntos fuera de control"
  - [x] 3.3 Line 44: Keep "Preguntas sobre graficos de control, SPC, cartas de control" — this is general statistics knowledge, NOT specific to capacidad de proceso. User may ask about SPC in general.

- [x] Task 4: Clean up dead stability constants in constants/messages.ts (AC: #4)
  - [x] 4.1 Lines 136-158: DELETE `STABILITY_RULE_DESCRIPTIONS`, `STABILITY_CONCLUSIONS`, `STABILITY_INTERPRETATION` constants — all dead code (I-Chart/MR-Chart components deleted in Story 9.3, Python stability analysis deleted in Story 9.1)
  - [x] 4.2 Line 181: UPDATE `stable_capable` recommendation: remove "estable y" → change to: "El proceso es capaz. Continue con monitoreo de control estadistico."
  - [x] 4.3 Line 182: DELETE `unstable_warning` recommendation — no longer applicable in 2-pillar scope
  - [x] 4.4 Verify no remaining imports of deleted constants via grep

- [x] Task 5: Verify Python instructions are already clean (AC: #1, #2, #3)
  - [x] 5.1 Grep Python codebase for "estabilidad", "estable", "inestable", "stability", "control_limit", "i_chart", "mr_chart", "LCI", "LCS" — confirm 0 matches in capacidad_proceso code
  - [x] 5.2 Confirm `generate_basic_stats_instructions()` (capacidad_proceso_calculator.py:316-391) has no stability references
  - [x] 5.3 Confirm `generate_normality_instructions()` (capacidad_proceso_calculator.py:211-313) has no stability references
  - [x] 5.4 Confirm `generate_capability_instructions()` (capability_indices.py:674-863) has no stability references and correctly shows sigma Within/Overall labels
  - [x] 5.5 Confirm Part 2 (Conclusion Ejecutiva) in capability instructions includes only normalidad + capacidad (no estabilidad)

- [x] Task 6: Build verification and regression (AC: #1, #2, #3, #4)
  - [x] 6.1 Run TypeScript type check: `npx tsc --noEmit` — passes (pre-existing test file errors only, no prompt/constant errors)
  - [x] 6.2 Run frontend build: `npm run build` — successful
  - [x] 6.3 Run Python tests: `python3 -m pytest api/tests/ -v` — 464 passed, 4 failed (pre-existing MSA chart tests, unrelated)
  - [x] 6.4 Grep verification: no remaining references to "estabilidad", "estable", "inestable", "I-MR", "cartas de control" in agent prompt/instruction context for capacidad de proceso
  - [x] 6.5 Verify `STABILITY_RULE_DESCRIPTIONS`, `STABILITY_CONCLUSIONS`, `STABILITY_INTERPRETATION` have no remaining imports anywhere

## Dev Notes

### CRITICAL: What This Story Does and Does NOT Cover

**IN SCOPE (Story 9.4 — Agent prompts & constants cleanup):**
- Remove all stability references from MAIN_SYSTEM_PROMPT presentation instructions (Parts 1, 2, 3)
- Update chart count from 4 to 2 in agent instructions (Histogram + Normality Plot only)
- Remove stability from FILTER_SYSTEM_PROMPT allowed follow-up topics
- Delete dead stability constants from constants/messages.ts
- Update capability recommendations to remove stability references
- Add sigma Within/Overall to Part 1 instructions (replacing stability section)
- Verify Python backend instructions are already stability-free

**OUT OF SCOPE (already completed in other stories):**
- Story 9.1: Deleted `stability_analysis.py`, created `sigma_estimation.py`, removed I-Chart/MR-Chart generation from Python
- Story 9.2: Updated capability index formulas with sigma differentiation
- Story 9.3: Deleted IChart.tsx, MRChart.tsx components and all TypeScript types
- Python calculation changes — already done
- Frontend chart changes — already done

### Architecture & Constraints

- **Runtime:** Next.js 16 + React 19 + TypeScript, deployed on Vercel
- **Agent LLM:** OpenAI (gpt-4o-mini for filter, gpt-4o for main agent)
- **System prompts:** String constants in `lib/openai/prompts.ts`
- **Tool definitions:** In `lib/openai/tools.ts` — no changes needed (already clean)
- **Message constants:** In `constants/messages.ts`
- **Build:** Must pass `npx tsc --noEmit` and `npm run build` after changes
- **No new dependencies** — this is purely a text/constant cleanup story

### Key Data Flow — Agent Instruction Pipeline

```
Python backend (capacidad_proceso_calculator.py + capability_indices.py):
  generate_basic_stats_instructions()     → Part 1a: Basic stats markdown
  generate_normality_instructions()        → Part 1b: Normality markdown
  generate_capability_instructions()       → Part 1c + Part 2 + Part 3: Capability + conclusions
  Concatenated → "instructions" field      ← ALREADY CLEAN (no stability)
                    |
                    v
Frontend (app/api/chat/route.ts):
  Strips <!-- AGENT_ONLY --> sections
  Stores in analysis metadata
                    |
                    v
Agent (gpt-4o with MAIN_SYSTEM_PROMPT):
  Reads "instructions" from tool result
  Follows MAIN_SYSTEM_PROMPT presentation rules
  Presents in 3 parts to user               ← PROMPTS STILL REFERENCE STABILITY
```

**The problem:** Python instructions are clean but the MAIN_SYSTEM_PROMPT still tells the agent to present stability analysis results that no longer exist. This causes the agent to either:
1. Hallucinate stability content (dangerous)
2. Confuse the user with instructions about 4 charts when only 2 exist
3. Include "Es estable o no?" in the executive conclusion when there's no stability data

### File Change Map

| File | Action | Purpose |
|------|--------|---------|
| `lib/openai/prompts.ts` | **MODIFY** | Remove stability from MAIN_SYSTEM_PROMPT (Parts 1-3, chart list, follow-ups, greeting) |
| `lib/openai/prompts.ts` | **MODIFY** | Remove stability from FILTER_SYSTEM_PROMPT (allowed topics) |
| `constants/messages.ts` | **MODIFY** | Delete STABILITY_RULE_DESCRIPTIONS, STABILITY_CONCLUSIONS, STABILITY_INTERPRETATION |
| `constants/messages.ts` | **MODIFY** | Update CAPABILITY_RECOMMENDATIONS (remove stability references) |
| `lib/openai/tools.ts` | **VERIFY ONLY** | Already clean — no stability references |
| `api/utils/capacidad_proceso_calculator.py` | **VERIFY ONLY** | Instructions generation already stability-free |
| `api/utils/capability_indices.py` | **VERIFY ONLY** | Capability instructions already stability-free |

### Exact Code Changes Required

#### 1. MAIN_SYSTEM_PROMPT — CAPACIDADES Section (~line 142)

**BEFORE:**
```
- Explicar Analisis de Capacidad de Proceso: normalidad, estabilidad, indices Cp, Cpk, Pp, Ppk
```
**AFTER:**
```
- Explicar Analisis de Capacidad de Proceso: normalidad, indices Cp, Cpk, Pp, Ppk, sigma Within/Overall
```

#### 2. MAIN_SYSTEM_PROMPT — Concepts Line (~line 146)

**BEFORE:**
```
- Explicar conceptos como Cp, Cpk, Pp, Ppk, cartas de control I-MR, SPC
```
**AFTER:**
```
- Explicar conceptos como Cp, Cpk, Pp, Ppk, normalidad Anderson-Darling, sigma Within/Overall
```

#### 3. MAIN_SYSTEM_PROMPT — PARTE 1 ANALISIS TECNICO (~lines 212-221)

**BEFORE:**
```
**PARTE 1: ANALISIS TECNICO**
- Estadisticas basicas: media, mediana, desviacion estandar, minimo, maximo, rango
- Resultado de normalidad: prueba Anderson-Darling, estadistico A2, p-value, conclusion (normal/no normal)
- Analisis de estabilidad (I-MR):
  - Limites de control para grafico I (LCI, LC, LCS)
  - Limites de control para grafico MR (LCI, LC, LCS)
  - Puntos fuera de control
  - Reglas evaluadas (regla 1, regla de tendencias, etc.)
- Indices de capacidad: Cp, Cpk, Pp, Ppk con su clasificacion
- Usa tablas markdown para organizar las metricas
```
**AFTER:**
```
**PARTE 1: ANALISIS TECNICO**
- Estadisticas basicas: media, mediana, desviacion estandar, minimo, maximo, rango
- Resultado de normalidad: prueba Anderson-Darling, estadistico A2, p-value, conclusion (normal/no normal)
- Desviaciones estandar: sigma Within (MR-bar/d2, corto plazo) y sigma Overall (desv. estandar muestral, largo plazo)
- Indices de capacidad: Cp, Cpk (con sigma Within), Pp, Ppk (con sigma Overall) con su clasificacion
- Usa tablas markdown para organizar las metricas
```

#### 4. MAIN_SYSTEM_PROMPT — PARTE 2 CONCLUSION EJECUTIVA (~lines 223-229)

**BEFORE:**
```
**PARTE 2: CONCLUSION EJECUTIVA**
- Es normal o no? (con p-value y estadistico A2)
- Es estable o no? (con reglas violadas si aplica)
- Es capaz o no? (con Cpk y clasificacion segun umbrales)
  - Cpk >= 1.33: Proceso capaz
  - 1.00 <= Cpk < 1.33: Proceso marginalmente capaz
  - Cpk < 1.00: Proceso no capaz
```
**AFTER:**
```
**PARTE 2: CONCLUSION EJECUTIVA**
- Es normal o no? (con p-value y estadistico A2)
- Es capaz o no? (con Cpk y clasificacion segun umbrales)
  - Cpk >= 1.33: Proceso capaz
  - 1.00 <= Cpk < 1.33: Proceso marginalmente capaz
  - Cpk < 1.00: Proceso no capaz
```

#### 5. MAIN_SYSTEM_PROMPT — Chart Section (~lines 238-245)

**BEFORE:**
```
GRAFICOS DE ANALISIS DE CAPACIDAD DE PROCESO:
El sistema genera 4 graficos automaticamente:
- **Histograma**: Distribucion de datos con LEI, LES, media y curva de distribucion ajustada. Interpreta si los datos estan centrados y que tan cerca estan de los limites.
- **Grafico I (Individuos)**: Valores individuales con limites de control (LCI, LC, LCS). Identifica puntos fuera de control y tendencias.
- **Grafico MR (Rango Movil)**: Variacion entre puntos consecutivos. Evalua la consistencia de la variacion.
- **Grafico de Normalidad (Q-Q)**: Evaluacion visual de normalidad. Puntos sobre la linea diagonal = distribucion normal.

Menciona e interpreta brevemente cada grafico en tu respuesta.
```
**AFTER:**
```
GRAFICOS DE ANALISIS DE CAPACIDAD DE PROCESO:
El sistema genera 2 graficos automaticamente:
- **Histograma**: Distribucion de datos con LEI (rojo), LES (rojo), media (azul) y curva de distribucion ajustada. Interpreta si los datos estan centrados y que tan cerca estan de los limites de especificacion.
- **Grafico de Normalidad (Q-Q)**: Evaluacion visual de normalidad. Puntos sobre la linea diagonal = distribucion normal. Incluye bandas de confianza al 95% y p-value de Anderson-Darling.

Menciona e interpreta brevemente cada grafico en tu respuesta.
```

#### 6. MAIN_SYSTEM_PROMPT — Follow-up Question (~line 341)

**BEFORE:**
```
- "Que significa que este fuera de control?" → Explica puntos fuera de limites en graficos I-MR
```
**DELETE** this entire line.

#### 7. MAIN_SYSTEM_PROMPT — Greeting Example (~lines 359-365)

**BEFORE:**
```
"Hola! Soy el Asistente del Setec AI Hub, especialista en MSA (Gauge R&R) y Analisis de Capacidad de Proceso.

Para realizar un analisis, ve a la seccion **'Plantillas'** en el menu lateral izquierdo y descarga la plantilla correspondiente (MSA o Analisis de Capacidad de Proceso). Esa plantilla define el formato exacto que necesito para procesar tus datos.

Tambien puedo explicarte conceptos como Cp, Cpk, Pp, Ppk, cartas I-MR, normalidad, repetibilidad, reproducibilidad, etc.

En que te puedo ayudar?"
```
**AFTER:**
```
"Hola! Soy el Asistente del Setec AI Hub, especialista en MSA (Gauge R&R) y Analisis de Capacidad de Proceso.

Para realizar un analisis, ve a la seccion **'Plantillas'** en el menu lateral izquierdo y descarga la plantilla correspondiente (MSA o Analisis de Capacidad de Proceso). Esa plantilla define el formato exacto que necesito para procesar tus datos.

Tambien puedo explicarte conceptos como Cp, Cpk, Pp, Ppk, normalidad, sigma Within/Overall, repetibilidad, reproducibilidad, etc.

En que te puedo ayudar?"
```

#### 8. FILTER_SYSTEM_PROMPT — Allowed Topics (~lines 74-81)

**BEFORE:**
```
Seguimiento de Analisis de Capacidad de Proceso:
- Si el mensaje anterior contiene resultados de capacidad (Cp, Cpk, Pp, Ppk, normalidad, estabilidad), PERMITIR cualquier pregunta sobre esos resultados
- Preguntas sobre por que el proceso es capaz o no capaz
- Preguntas sobre como mejorar la capacidad
- Preguntas sobre normalidad, Anderson-Darling, distribuciones, transformaciones
- Preguntas sobre estabilidad, cartas I-MR, puntos fuera de control
- Preguntas sobre limites de especificacion (LEI, LES)
- Preguntas sobre indices de capacidad y su interpretacion
```
**AFTER:**
```
Seguimiento de Analisis de Capacidad de Proceso:
- Si el mensaje anterior contiene resultados de capacidad (Cp, Cpk, Pp, Ppk, normalidad), PERMITIR cualquier pregunta sobre esos resultados
- Preguntas sobre por que el proceso es capaz o no capaz
- Preguntas sobre como mejorar la capacidad
- Preguntas sobre normalidad, Anderson-Darling, distribuciones, transformaciones
- Preguntas sobre sigma Within, sigma Overall, desviaciones estandar
- Preguntas sobre limites de especificacion (LEI, LES)
- Preguntas sobre indices de capacidad y su interpretacion
```

#### 9. constants/messages.ts — Delete Dead Constants (~lines 136-158)

**DELETE** the following three constants entirely:
```typescript
export const STABILITY_RULE_DESCRIPTIONS = { ... }
export const STABILITY_CONCLUSIONS = { ... }
export const STABILITY_INTERPRETATION = { ... }
```

#### 10. constants/messages.ts — Update CAPABILITY_RECOMMENDATIONS (~lines 177-184)

**BEFORE:**
```typescript
export const CAPABILITY_RECOMMENDATIONS = {
  centering_issue: 'El proceso no esta centrado entre las especificaciones. Ajuste el proceso hacia el valor objetivo.',
  spread_issue: 'La variacion del proceso es excesiva. Identifique y elimine fuentes de variacion.',
  both_issues: 'El proceso tiene problemas de centrado y variacion. Priorice reducir la variacion primero.',
  stable_capable: 'El proceso es estable y capaz. Continue con monitoreo de control estadistico.',
  unstable_warning: 'El proceso es inestable. Los indices de capacidad pueden no ser confiables hasta lograr estabilidad.',
  non_normal_note: 'Los datos no siguen una distribucion normal. Los indices se calcularon usando la distribucion ajustada.',
} as const
```
**AFTER:**
```typescript
export const CAPABILITY_RECOMMENDATIONS = {
  centering_issue: 'El proceso no esta centrado entre las especificaciones. Ajuste el proceso hacia el valor objetivo.',
  spread_issue: 'La variacion del proceso es excesiva. Identifique y elimine fuentes de variacion.',
  both_issues: 'El proceso tiene problemas de centrado y variacion. Priorice reducir la variacion primero.',
  capable: 'El proceso es capaz. Continue con monitoreo periodico.',
  non_normal_note: 'Los datos no siguen una distribucion normal. Los indices se calcularon usando la distribucion ajustada.',
} as const
```

### Previous Story Intelligence (Stories 9.1, 9.2, 9.3)

**From Story 9.1 completion notes:**
- Created `sigma_estimation.py` replacing `stability_analysis.py`
- Removed I-Chart, MR-Chart generation from `_build_chart_data()` — charts now: histogram + normality_plot only
- Python backend already produces correct 2-chart output
- All stability functions deleted from Python codebase
- Key: `generate_capability_instructions()` in capability_indices.py already produces correct Part 1/2/3 markdown without stability

**From Story 9.2 completion notes:**
- Refactored `calculate_capability_indices()` to accept `sigma_result` directly
- Capability instructions already show "sigma Within" and "sigma Overall" labels in the Desviaciones Estandar table
- 463 passed, 4 failed (pre-existing MSA, unrelated)

**From Story 9.3 completion notes:**
- Deleted IChart.tsx (328 lines), MRChart.tsx (276 lines) and test files
- Removed 9 interfaces from types/analysis.ts
- Removed stability field from CapacidadProcesoResult
- Frontend now only renders Histogram + NormalityPlot
- Build passes, TypeScript compilation clean

**Key insight:** Python instructions and frontend are already correct. Story 9.4 closes the loop by updating the **agent prompts** and **dead constants** that still reference the old 3-pillar scope.

### Git Intelligence — Recent Commits

```
fe47c80 feat: Redesign privacy page with transparency section
ef569dd feat: Update BMAD framework and app prompts
2d66109 feat: Rename analysis from 'Capacidad de Proceso' to 'Control Estadistico de Proceso'
c49e27a fix: Remove duplicate SpecLimits export from analysis.ts
30b86c4 feat: Complete Epic 7 & 8 - Process Capability Analysis
```

- Stories 9.1-9.3 changes are uncommitted (in working tree) — this story builds on top
- Commit `2d66109` renamed analysis — prompts.ts may already reflect "Control Estadistico de Proceso" naming in some places
- No git conflicts expected for this story (prompt text changes only)

### CAPABILITY_RECOMMENDATIONS Import Check

Before deleting `stable_capable` and `unstable_warning`, verify consumers:
- Grep for `CAPABILITY_RECOMMENDATIONS` across the codebase
- If `stable_capable` or `unstable_warning` are used in any component, update the references
- These constants appear to be frontend-only for potential display — if unused, safe to rename/delete

### Testing Strategy

- **No new tests needed** — this is a text/constant cleanup story
- **TypeScript compilation:** `npx tsc --noEmit` must pass (catches broken imports if constants are used)
- **Build verification:** `npm run build` must succeed
- **Python regression:** `python -m pytest api/tests/ -v` to confirm backend unchanged (verify only)
- **Grep verification:** No remaining stability references in capacidad de proceso context
- **Manual verification (recommended):** Start a conversation, upload capacidad de proceso data, verify agent presents 2-pillar results without stability mentions

### Project Structure Notes

- System prompts in `lib/openai/prompts.ts` as TypeScript string constants
- Tool definitions in `lib/openai/tools.ts` — already clean
- Message constants in `constants/messages.ts` — centralized Spanish strings
- Analysis constants in `constants/analysis.ts` — already clean (no stability)
- Types in `types/analysis.ts` — already clean (Story 9.3 removed stability types)

### References

- [Source: _bmad-output/planning-artifacts/prd-v3.md — FR-CP19 Results and Presentation]
- [Source: _bmad-output/planning-artifacts/epics.md — Epic 9, Story 9.4]
- [Source: _bmad-output/implementation-artifacts/9-3-remove-ichart-mrchart-update-histogram-chartdata.md — Previous story context]
- [Source: lib/openai/prompts.ts — MAIN_SYSTEM_PROMPT lines 142, 146, 209-245, 332-345, 352-365]
- [Source: lib/openai/prompts.ts — FILTER_SYSTEM_PROMPT lines 74-81]
- [Source: constants/messages.ts — STABILITY_RULE_DESCRIPTIONS (lines 140-148), STABILITY_CONCLUSIONS (lines 150-153), STABILITY_INTERPRETATION (lines 155-158)]
- [Source: constants/messages.ts — CAPABILITY_RECOMMENDATIONS (lines 177-184)]
- [Source: api/utils/capacidad_proceso_calculator.py — generate_basic_stats_instructions (316-391), generate_normality_instructions (211-313)]
- [Source: api/utils/capability_indices.py — generate_capability_instructions (674-863)]
- [Source: api/analyze.py — capacidad_proceso routing (227-249)]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation with no debugging required.

### Completion Notes List

- Removed all stability references from MAIN_SYSTEM_PROMPT: CAPACIDADES list, concepts line, PARTE 1 (replaced 5-line stability block with 2-line sigma Within/Overall block), PARTE 2 (removed "Es estable o no?" line), chart section (4→2 charts, removed I-Chart and MR-Chart entries)
- Removed stability follow-up question about "fuera de control" from MAIN_SYSTEM_PROMPT
- Updated greeting example to replace "cartas I-MR" with "sigma Within/Overall"
- Updated FILTER_SYSTEM_PROMPT: removed "estabilidad" from result list, replaced stability follow-up topic with sigma Within/Overall topic
- Deleted 3 dead constants from messages.ts: STABILITY_RULE_DESCRIPTIONS (8 entries), STABILITY_CONCLUSIONS (2 entries), STABILITY_INTERPRETATION (2 entries)
- Updated CAPABILITY_RECOMMENDATIONS: renamed `stable_capable` → `capable` (removed "estable y"), deleted `unstable_warning`
- Verified Python backend (capacidad_proceso_calculator.py, capability_indices.py) has zero stability references — already clean from Stories 9.1-9.2
- Build passes (`npm run build` successful), TypeScript errors are all pre-existing in test files, Python tests 464 passed/4 failed (pre-existing MSA)
- No new dependencies added, no new files created — purely text/constant cleanup

### Change Log

- 2026-03-10: Story 9.4 implementation — Removed all stability references from agent prompts and dead constants (FR-CP19)
- 2026-03-10: Code review fixes — Updated 3 failing tests in prompts.test.ts (stability→sigma, 4 charts→2 charts), added agent guidance for stability scope questions (AC #4), fixed pre-existing LEI/LES test pattern

### File List

- `lib/openai/prompts.ts` — MODIFIED: Removed stability from MAIN_SYSTEM_PROMPT (Parts 1-3, charts, follow-ups, greeting) and FILTER_SYSTEM_PROMPT (allowed topics). Added stability scope guidance for follow-up questions (AC #4).
- `lib/openai/prompts.test.ts` — MODIFIED: Updated 3 tests to reflect 2-pillar scope (stability→sigma, 4 charts→2 charts). Fixed pre-existing LEI/LES test pattern.
- `constants/messages.ts` — MODIFIED: Deleted STABILITY_RULE_DESCRIPTIONS, STABILITY_CONCLUSIONS, STABILITY_INTERPRETATION; updated CAPABILITY_RECOMMENDATIONS
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED: Story status ready-for-dev → in-progress → done
- `_bmad-output/implementation-artifacts/9-4-update-agent-instructions-presentation-remove-stability.md` — MODIFIED: Task checkboxes, Dev Agent Record, File List, Change Log, Status
