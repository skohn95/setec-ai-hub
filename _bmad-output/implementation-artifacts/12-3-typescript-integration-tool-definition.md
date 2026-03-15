# Story 12.3: TypeScript Integration & Tool Definition

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the TypeScript types, tool definition, and API client updated for the sample size analysis,
so that the agent can invoke the calculation and the frontend can process the results.

## Acceptance Criteria

1. **Given** the `types/analysis.ts` file
   **When** the new analysis type is added
   **Then** `'tamano_muestra'` is added to the `AnalysisType` union type
   **And** a `TamanoMuestraResult` interface is defined matching the Python output structure (input_parameters, sample_size, classification, sensitivity)

2. **Given** the `constants/analysis.ts` file
   **When** the new analysis type is added
   **Then** `ANALYSIS_TYPES.TAMANO_MUESTRA = 'tamano_muestra'` is added

3. **Given** the `lib/openai/tools.ts` tool definition
   **When** the analyze tool is updated
   **Then** `'tamano_muestra'` is added to the `analysis_type` enum
   **And** `file_id` is removed from the global `required` array
   **And** the `file_id` description clarifies it is required for msa, capacidad_proceso, hipotesis_2_muestras but NOT for tamano_muestra
   **And** new parameters are added: `delta` (number), `sigma` (number), `alpha` (number), `power` (number), `alternative_hypothesis` (string enum), `current_mean` (number, optional), `expected_mean` (number, optional)

4. **Given** the `lib/api/analyze.ts` client function
   **When** `invokeAnalysisTool` is updated
   **Then** `fileId` parameter becomes optional (string | undefined)
   **And** a new `SampleSizeParams` interface is added (delta, sigma, alpha, power, alternative_hypothesis, current_mean?, expected_mean?)
   **And** a new optional `sampleSizeParams` parameter is accepted
   **And** when `sampleSizeParams` is provided, those fields are added to the request body
   **And** when `fileId` is undefined, `file_id` is not sent in the request body

5. **Given** an existing call to `invokeAnalysisTool('msa', fileId, messageId)`
   **When** the function is called with the old signature
   **Then** it works exactly as before (backwards compatible)

6. **Given** a call to `invokeAnalysisTool('tamano_muestra', undefined, messageId, undefined, sampleSizeParams)`
   **When** the request is sent
   **Then** the body contains `analysis_type`, `delta`, `sigma`, `alpha`, `power`, `alternative_hypothesis`
   **And** the body does NOT contain `file_id`
   **And** `current_mean` and `expected_mean` are included only if provided

## Tasks / Subtasks

- [x] Task 1: Fix TamanoMuestraResult type mismatch (AC: 1)
  - [x] 1.1 In `types/analysis.ts` — rename `params_changed` to `parameters` in the `TamanoMuestraResult.sensitivity` array type to match the Python calculator output field name
  - [x] 1.2 Add `TamanoMuestraResult` to the `AnalysisResult.results` union type (currently missing — line 35 only has `GageRRResults | CapacidadProcesoResult | Hipotesis2MuestrasResult`)

- [x] Task 2: Verify all TypeScript integrations are correct (AC: 1-6)
  - [x] 2.1 Confirm `AnalysisType` union includes `'tamano_muestra'` (already done in 12.1)
  - [x] 2.2 Confirm `ANALYSIS_TYPES.TAMANO_MUESTRA` constant exists (already done in 12.1)
  - [x] 2.3 Confirm `tools.ts` has tamano_muestra in enum, file_id not in required, new params present (already done in 12.1)
  - [x] 2.4 Confirm `analyze.ts` has optional fileId and SampleSizeParams (already done in 12.1)
  - [x] 2.5 Confirm `route.ts` builds sampleSizeParams and passes to invokeAnalysisTool (already done in 12.1)
  - [x] 2.6 Confirm backward compatibility — existing invokeAnalysisTool callers unaffected (already verified in 12.1)

- [x] Task 3: Build verification (AC: all)
  - [x] 3.1 Run `npx tsc --noEmit` — zero new TypeScript errors
  - [x] 3.2 Run `npm run build` — successful build
  - [x] 3.3 Run `python3 -m pytest api/tests/ -v` — all tests still pass (no Python changes expected)

## Dev Notes

### CRITICAL: Story 12.1 Already Completed Most Work

**All 6 acceptance criteria were front-loaded into Story 12.1** as part of the architecture foundation. The following is already done and committed in the working tree:

| AC | File | What was done | Status |
|---|---|---|---|
| AC 1 | `types/analysis.ts` | Added `'tamano_muestra'` to `AnalysisType` union, created `TamanoMuestraResult` interface | Done (2 bugs to fix) |
| AC 2 | `constants/analysis.ts` | Added `TAMANO_MUESTRA: 'tamano_muestra'` to `ANALYSIS_TYPES` | Done |
| AC 3 | `lib/openai/tools.ts` | Added tamano_muestra to enum, removed file_id from required, added delta/sigma/alpha/power/current_mean/expected_mean params | Done |
| AC 4 | `lib/api/analyze.ts` | Made fileId optional, added `SampleSizeParams` interface, added sampleSizeParams parameter | Done |
| AC 5 | `lib/api/analyze.ts` | Backward compatible — existing callers still pass fileId as string | Done |
| AC 6 | `app/api/chat/route.ts` | Builds sampleSizeParams when analysis_type is tamano_muestra, passes undefined for file_id | Done |

### Bugs to Fix

**Bug 1: Field name mismatch in `TamanoMuestraResult.sensitivity`**

The TypeScript interface at `types/analysis.ts:486-490` uses `params_changed`:
```typescript
sensitivity: Array<{
    scenario: string
    label: string
    params_changed: Record<string, number>  // ← WRONG
    n_per_group: number
}>
```

The Python calculator at `api/utils/tamano_muestra_calculator.py:182-192` returns `parameters`:
```python
results.append({
    'scenario': s['key'],
    'label': s['label'],
    'parameters': {  # ← CORRECT field name
        'delta': s['delta'],
        'sigma': s['sigma'],
        'alpha': s['alpha'],
        'power': s['power'],
    },
    'n_per_group': calc['n_per_group'],
})
```

**Fix**: Change `params_changed` to `parameters` in the TypeScript interface.

**Bug 2: Missing union member in `AnalysisResult.results`**

The `AnalysisResult` interface at `types/analysis.ts:35` is:
```typescript
results: GageRRResults | CapacidadProcesoResult | Hipotesis2MuestrasResult
```

It should include `TamanoMuestraResult`:
```typescript
results: GageRRResults | CapacidadProcesoResult | Hipotesis2MuestrasResult | TamanoMuestraResult
```

### Exact Code Changes

**File: `types/analysis.ts`**

Change 1 — Line 35 (add TamanoMuestraResult to union):
```typescript
// Before:
results: GageRRResults | CapacidadProcesoResult | Hipotesis2MuestrasResult

// After:
results: GageRRResults | CapacidadProcesoResult | Hipotesis2MuestrasResult | TamanoMuestraResult
```

Change 2 — Line 489 (fix field name):
```typescript
// Before:
params_changed: Record<string, number>

// After:
parameters: Record<string, number>
```

### No Other Files Need Changes

All other files are already correct from Story 12.1:
- `constants/analysis.ts` — `TAMANO_MUESTRA` constant at line 66 ✅
- `lib/openai/tools.ts` — Full tool definition with all params ✅
- `lib/api/analyze.ts` — `SampleSizeParams` interface, optional fileId, sampleSizeParams spreading ✅
- `app/api/chat/route.ts` — Conditional sampleSizeParams build + debug logging ✅

### Project Structure Notes

- Only `types/analysis.ts` needs modification (2 small fixes)
- No new files needed
- No new dependencies
- No Python changes needed
- No database changes needed

### Architecture Compliance

- **AD-1 (file_id optional)**: TS tool definition already has `required: ['analysis_type']` — file_id not globally required ✅
- **AD-3 (empty chartData)**: Python returns `chartData: []`, TS types handle empty arrays ✅

### Previous Story Intelligence (12-1 and 12-2)

**From Story 12-1:**
- All TypeScript integration was done as part of the architecture story
- Code review caught and fixed: stale docstrings, double-set alternative_hypothesis, `||` → `??` for 0-value display, non-null assertions → runtime checks
- 70 existing tests passed post-12-1

**From Story 12-2:**
- Python calculator implemented and fully tested (42 tests)
- Response structure confirmed: `{ results: { input_parameters, sample_size, classification, sensitivity }, chartData: [], instructions: "..." }`
- Sensitivity array uses `parameters` field (not `params_changed`)
- Integration into analyze.py completed (placeholder replaced)
- 671/675 total tests pass (4 pre-existing MSA chart data failures)

### Git Intelligence

Recent commits:
- `feat: Add Hipotesis de 2 Muestras analysis type` — pattern for full-stack analysis integration
- `fix: Rename "Prueba de Hipotesis" to "Test de Hipotesis"` — naming convention fix

Working tree has uncommitted changes from Stories 12.1 and 12.2 in:
- `api/analyze.py`, `api/utils/supabase_client.py`, `api/utils/capacidad_proceso_calculator.py`
- `lib/openai/tools.ts`, `lib/api/analyze.ts`, `types/analysis.ts`, `constants/analysis.ts`
- `app/api/chat/route.ts`

### Testing Requirements

- Run `npx tsc --noEmit` — verify zero new TypeScript errors after fixes
- Run `npm run build` — verify successful build
- Run `python3 -m pytest api/tests/ -v` — no Python changes, just confirm no regressions
- Manual verification: the `TamanoMuestraResult` type fields match `api/utils/tamano_muestra_calculator.py` output exactly

### Anti-Pattern Prevention

- **DO NOT** recreate work already done in 12.1 — only fix the 2 bugs identified
- **DO NOT** add new TypeScript types that duplicate existing ones
- **DO NOT** modify Python code — this is a TypeScript-only story
- **DO NOT** modify tool definitions — they are already correct from 12.1
- **DO NOT** modify the chat route handler — it is already correct from 12.1
- **DO NOT** add tests for TypeScript types — no runtime behavior change, just type correctness

### References

- [Source: types/analysis.ts:3] — AnalysisType union (already has tamano_muestra)
- [Source: types/analysis.ts:35] — AnalysisResult.results union (missing TamanoMuestraResult)
- [Source: types/analysis.ts:462-492] — TamanoMuestraResult interface (params_changed → parameters fix)
- [Source: constants/analysis.ts:62-67] — ANALYSIS_TYPES constant (already has TAMANO_MUESTRA)
- [Source: lib/openai/tools.ts:22-92] — Tool definition (already complete)
- [Source: lib/api/analyze.ts:19-27,129-179] — SampleSizeParams + invokeAnalysisTool (already complete)
- [Source: app/api/chat/route.ts:324-386] — Tool call handling (already complete)
- [Source: api/utils/tamano_muestra_calculator.py:177-193] — Python sensitivity output structure (field: "parameters")
- [Source: _bmad-output/implementation-artifacts/12-1-architecture-foundation-file-id-optional-shared-stats-module.md] — Story 12.1 completion notes
- [Source: _bmad-output/implementation-artifacts/12-2-sample-size-calculator-sensitivity-engine.md] — Story 12.2 completion notes

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no debugging required. Both fixes were straightforward type corrections.

### Completion Notes List

- Fixed `TamanoMuestraResult.sensitivity` field name from `params_changed` to `parameters` to match Python calculator output (`api/utils/tamano_muestra_calculator.py:185`)
- Added `TamanoMuestraResult` to the `AnalysisResult.results` union type so the TypeScript type system correctly represents all possible analysis result shapes
- Verified all 6 ACs satisfied: AnalysisType union, ANALYSIS_TYPES constant, tool definition, API client, backward compatibility, and request body construction — all confirmed correct from Story 12.1
- Build verification: `npm run build` passes, `tsc --noEmit` has zero new errors (only pre-existing test file issues), Python tests 671/675 pass (4 pre-existing MSA chart failures)

### File List

- `types/analysis.ts` — Modified (4 changes: line 35 added TamanoMuestraResult to union, line 36 fixed chartData to array union type, line 489 renamed params_changed to parameters, line 489 strengthened parameters type from Record to explicit interface)

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 (Code Review Workflow)
**Date:** 2026-03-14
**Outcome:** Approve (with 2 MEDIUM fixes applied)

### Findings

**MEDIUM (2 — both fixed):**
1. `TamanoMuestraResult.sensitivity[].parameters` typed as `Record<string, number>` — too loose. Python always returns `{delta, sigma, alpha, power}`. **Fixed:** replaced with explicit interface.
2. `AnalysisResult.chartData` typed as `ChartData` (single legacy object) — inaccurate for tamano_muestra (`[]`), capacidad_proceso (histogram array), and hipotesis_2_muestras (boxplot array). **Fixed:** updated to `ChartData[] | CapacidadProcesoChartDataItem[] | Hipotesis2MChartDataItem[]`.

**LOW (1 — noted, not fixed):**
1. PRD-v5 line 415 still references `params_changed` — documentation debt. Both Python and TypeScript now use `parameters`. Out of code review scope (bmad-output excluded).

### AC Verification

| AC | Status | Evidence |
|---|---|---|
| AC 1 | IMPLEMENTED | `types/analysis.ts:3` (union), `:466-495` (interface matches Python output) |
| AC 2 | IMPLEMENTED | `constants/analysis.ts:66` |
| AC 3 | IMPLEMENTED | `lib/openai/tools.ts:33,38,64-86,88` |
| AC 4 | IMPLEMENTED | `lib/api/analyze.ts:19-27,131,136,163-174` |
| AC 5 | IMPLEMENTED | All params optional after analysisType — existing callers unaffected |
| AC 6 | IMPLEMENTED | `app/api/chat/route.ts:368-376,380` |

### Task Audit

All 3 tasks verified complete. Implementation matches claims.

## Change Log

- 2026-03-14: Fixed TamanoMuestraResult type to match Python calculator output — renamed `params_changed` to `parameters` in sensitivity array and added TamanoMuestraResult to AnalysisResult.results union type
- 2026-03-14: Code review — strengthened sensitivity.parameters type from Record<string,number> to explicit interface, fixed AnalysisResult.chartData from legacy single object to proper array union type
