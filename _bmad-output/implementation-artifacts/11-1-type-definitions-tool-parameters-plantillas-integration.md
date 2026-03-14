# Story 11.1: Type Definitions, Tool Parameters & Plantillas Integration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the TypeScript types, tool definition, and plantillas page updated for the new analysis,
So that the frontend and agent can invoke and render 2-sample hypothesis testing results.

## Acceptance Criteria

### AC 1: AnalysisType and Result Interface (`types/analysis.ts`)
- **Given** the `types/analysis.ts` file
- **When** the new analysis type is added
- **Then** `'hipotesis_2_muestras'` is added to the `AnalysisType` union type
- **And** a `Hipotesis2MuestrasResult` interface is defined matching the Python output structure (descriptive_a, descriptive_b, normality_a, normality_b, sample_size, variance_test, means_test, warnings)
- **And** the `AnalysisResult.results` union includes `Hipotesis2MuestrasResult`
- **And** chart data types are defined: `Hipotesis2MHistogramData`, `Hipotesis2MBoxplotVarianceData`, `Hipotesis2MBoxplotMeansData`, `Hipotesis2MChartDataItem`

### AC 2: Analysis Type Constant (`constants/analysis.ts`)
- **Given** the `constants/analysis.ts` file
- **When** the new analysis type is added
- **Then** `ANALYSIS_TYPES.HIPOTESIS_2_MUESTRAS = 'hipotesis_2_muestras'` is added

### AC 3: Tool Definition (`lib/openai/tools.ts`)
- **Given** the `lib/openai/tools.ts` tool definition
- **When** the analyze tool is updated
- **Then** `'hipotesis_2_muestras'` is added to the `analysis_type` enum
- **And** a new optional parameter `confidence_level` (number, enum: [0.90, 0.95, 0.99]) is added
- **And** a new optional parameter `alternative_hypothesis` (string, enum: ['two-sided', 'greater', 'less']) is added
- **And** the tool description mentions hypothesis testing

### AC 4: Analyze Client Function (`lib/api/analyze.ts`)
- **Given** the `lib/api/analyze.ts` client function
- **When** `invokeAnalysisTool` is called with `hipotesis_2_muestras`
- **Then** it passes `confidence_level` and `alternative_hypothesis` to the API
- **And** existing analysis types are unaffected

### AC 5: Plantillas Page (PRE-COMPLETED)
- **Given** the plantillas page at `/app/(dashboard)/plantillas/page.tsx`
- **When** the page renders
- **Then** a template card appears for "Prueba de Hipotesis: 2 Muestras"
- **STATUS: ALREADY DONE** — the page dynamically renders from `TEMPLATES` array and the entry exists

### AC 6: Template Constants (PRE-COMPLETED)
- **Given** the `constants/templates.ts` file
- **When** the templates are loaded
- **Then** the hipotesis_2_muestras entry includes id, title, description, filename, and download path
- **STATUS: ALREADY DONE** — entry exists at lines 35-42 of `constants/templates.ts`

## Tasks / Subtasks

- [x] Task 1: Add TypeScript type definitions (AC: 1)
  - [x] 1.1 Add `'hipotesis_2_muestras'` to `AnalysisType` union (line 3 of `types/analysis.ts`)
  - [x] 1.2 Add `Hipotesis2MuestrasResult` to the `AnalysisResult.results` union (around line 30)
  - [x] 1.3 Define `Hipotesis2MuestrasDescriptive` interface (matching Python `descriptive_a`/`descriptive_b`)
  - [x] 1.4 Define `Hipotesis2MuestrasOutliers` interface (nested within descriptive)
  - [x] 1.5 Define `Hipotesis2MuestrasSampleSize` interface (matching Python `sample_size.a`/`.b`)
  - [x] 1.6 Define `Hipotesis2MuestrasNormality` interface (matching Python `normality_a`/`normality_b`)
  - [x] 1.7 Define `Hipotesis2MuestrasBoxCox` interface (matching Python `box_cox`)
  - [x] 1.8 Define `Hipotesis2MuestrasVarianceTest` interface (matching Python `variance_test`)
  - [x] 1.9 Define `Hipotesis2MuestrasMeansTest` interface (matching Python `means_test`)
  - [x] 1.10 Define `Hipotesis2MuestrasResult` interface combining all sub-interfaces
  - [x] 1.11 Define chart data types: `Hipotesis2MHistogramData`, `Hipotesis2MBoxplotVarianceData`, `Hipotesis2MBoxplotMeansData`, `Hipotesis2MBoxplotSample`, `Hipotesis2MChartDataItem`
- [x] Task 2: Add analysis type constant (AC: 2)
  - [x] 2.1 Add `HIPOTESIS_2_MUESTRAS: 'hipotesis_2_muestras'` to `ANALYSIS_TYPES` object in `constants/analysis.ts`
- [x] Task 3: Update tool definition (AC: 3)
  - [x] 3.1 Add `'hipotesis_2_muestras'` to `analysis_type.enum` array in `lib/openai/tools.ts`
  - [x] 3.2 Update `analysis_type.description` to mention hypothesis testing
  - [x] 3.3 Add `confidence_level` property with `type: 'number'`, `enum: [0.90, 0.95, 0.99]`
  - [x] 3.4 Add `alternative_hypothesis` property with `type: 'string'`, `enum: ['two-sided', 'greater', 'less']`
  - [x] 3.5 Both new params are NOT in `required` array (they are optional, defaults are in Python)
- [x] Task 4: Update analyze client function (AC: 4)
  - [x] 4.1 Add `confidenceLevel?: number` parameter to `invokeAnalysisTool` signature
  - [x] 4.2 Add `alternativeHypothesis?: string` parameter to `invokeAnalysisTool` signature
  - [x] 4.3 Add conditional body fields: `body.confidence_level = confidenceLevel` (if defined) and `body.alternative_hypothesis = alternativeHypothesis` (if defined)
  - [x] 4.4 Verify existing MSA and capacidad_proceso calls are unaffected (new params are optional)
- [x] Task 5: Verify build and type checking (AC: 1-4)
  - [x] 5.1 Run `npx tsc --noEmit` — zero new TypeScript errors
  - [x] 5.2 Run `npm run build` — successful build
  - [x] 5.3 Verify plantillas page still renders correctly (no runtime errors)

## Dev Notes

### Developer Context

This is **Story 11.1 in Epic 11** (2-Sample Hypothesis Visualization & Agent Integration). Epic 10 (backend engine) is COMPLETE. This story bridges the Python backend output to the frontend TypeScript layer.

**Pre-completed work from Epic 10:**
- `constants/templates.ts` already has the hipotesis_2_muestras template entry (Story 10.1)
- `public/templates/plantilla-hipotesis-2-muestras.xlsx` already exists (Story 10.1)
- `app/(dashboard)/plantillas/page.tsx` dynamically renders from TEMPLATES — no change needed

**This story ONLY needs 4 files modified:**
1. `types/analysis.ts` — add types
2. `constants/analysis.ts` — add constant
3. `lib/openai/tools.ts` — update tool definition
4. `lib/api/analyze.ts` — update client function

**After this story:**
- Story 11.2 creates `BoxplotChart` and `Hipotesis2MuestrasCharts` chart components
- Story 11.3 updates the agent system prompt for conversational flow

### Technical Requirements

**TypeScript types MUST match the Python output EXACTLY.** The Python `build_hipotesis_2_muestras_output()` function returns a specific structure. TypeScript interfaces must use the SAME key names.

**Python results dict uses `snake_case` keys** (e.g., `descriptive_a`, `sample_size`, `variance_test`). TypeScript interfaces must preserve these names since they come from the API response JSON.

**Python chartData uses `camelCase` keys** (e.g., `sampleName`, `leveneTestPValue`, `ciLower`). TypeScript chart interfaces must use camelCase to match.

**No runtime code changes in Python.** This story is frontend-only TypeScript.

**No new npm dependencies.** All work uses existing TypeScript type system.

### Architecture Compliance

**Type architecture follows the established pattern in `types/analysis.ts`:**
- `GageRRResults` → interface for MSA results
- `CapacidadProcesoResult` → interface for capacity results
- `Hipotesis2MuestrasResult` → NEW interface for hypothesis results (same pattern)

**Result union pattern:**
```typescript
// Current (line ~30):
results: GageRRResults | CapacidadProcesoResult
// After:
results: GageRRResults | CapacidadProcesoResult | Hipotesis2MuestrasResult
```

**Chart data union pattern:**
```typescript
// Current:
export type CapacidadProcesoChartDataItem = HistogramChartData | NormalityPlotData
// New (separate type):
export type Hipotesis2MChartDataItem = Hipotesis2MHistogramData | Hipotesis2MBoxplotVarianceData | Hipotesis2MBoxplotMeansData
```

**Tool definition pattern:** The `lib/openai/tools.ts` file uses a single `AVAILABLE_TOOLS` array with OpenAI function calling format. New parameters are added as properties in `parameters.properties`, NOT in `required`.

**Client function pattern:** The `lib/api/analyze.ts` `invokeAnalysisTool` function builds a body object and conditionally adds optional fields. Follow the existing `specLimits` pattern.

### Library & Framework Requirements

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| TypeScript | TypeScript | 5.x strict mode | Type definitions only, no runtime code |
| Next.js | Next.js | 16 with App Router | Build verification |
| React | React | 19.2.3 | No React changes in this story |

**No new dependencies.** This story is purely TypeScript type definitions and minor code changes.

### File Structure Requirements

**Files to MODIFY:**
```
types/analysis.ts                    # Add Hipotesis2MuestrasResult + chart types
constants/analysis.ts                # Add HIPOTESIS_2_MUESTRAS constant
lib/openai/tools.ts                  # Add enum value + new parameters
lib/api/analyze.ts                   # Add optional params to invokeAnalysisTool
```

**Files to READ (reference only — do NOT modify):**
```
constants/templates.ts               # Verify template entry exists (DO NOT CHANGE)
app/(dashboard)/plantillas/page.tsx  # Verify page renders dynamically (DO NOT CHANGE)
api/utils/hipotesis_2_muestras_calculator.py  # Python output structure reference
api/analyze.py                       # Python parameter handling reference
```

**DO NOT create new files.** All changes go in existing files.

### Exact Python Output Structure (TypeScript Must Match)

**`build_hipotesis_2_muestras_output()` returns:**

```python
{
  'results': {
    'descriptive_a': {
      'sample_name': str,
      'n': int,
      'mean': float,
      'median': float,
      'std_dev': float,
      'skewness': float,
      'outliers': {
        'q1': float, 'q3': float, 'iqr': float,
        'lower_fence': float, 'upper_fence': float,
        'outlier_count': int,
        'outlier_values': list[float],
        'outlier_percentage': float
      }
    },
    'descriptive_b': { ... same structure ... },
    'sample_size': {
      'a': { 'n': int, 'tcl_applies': bool, 'small_sample_warning': bool, 'note': str },
      'b': { 'n': int, 'tcl_applies': bool, 'small_sample_warning': bool, 'note': str }
    },
    'normality_a': {
      'is_normal': bool, 'ad_statistic': float, 'p_value': float,
      'alpha': 0.05, 'is_robust': bool | None, 'robustness_details': str | None
    },
    'normality_b': { ... same structure ... },
    'box_cox': {
      'applied': bool, 'lambda_a': float | None, 'lambda_b': float | None,
      'normality_improved': bool | None, 'using_transformed_data': bool,
      'warning': str | None
    },
    'variance_test': {
      'method': str, 'f_statistic': float, 'p_value': float,
      'df1': 1, 'df2': int, 'alpha': float,
      'equal_variances': bool, 'conclusion': str
    },
    'means_test': {
      'method': str, 't_statistic': float, 'degrees_of_freedom': float,
      'p_value': float, 'ci_lower': float | None, 'ci_upper': float | None,
      'difference': float, 'alpha': float, 'confidence_level': float,
      'alternative_hypothesis': str, 'equal_variances': bool, 'conclusion': str
    },
    'warnings': list[str]
  },
  'chartData': [
    {
      'type': 'histogram_a',
      'data': {
        'bins': [{'start': float, 'end': float, 'count': int}],
        'mean': float, 'sampleName': str, 'outliers': list[float]
      }
    },
    {
      'type': 'histogram_b',
      'data': { ... same as histogram_a ... }
    },
    {
      'type': 'boxplot_variance',
      'data': {
        'samples': [
          {'name': str, 'min': float, 'q1': float, 'median': float, 'q3': float, 'max': float, 'outliers': list[float], 'mean': float},
          { ... same for sample B ... }
        ],
        'leveneTestPValue': float, 'leveneConclusion': str
      }
    },
    {
      'type': 'boxplot_means',
      'data': {
        'samples': [
          {'name': str, 'min': float, 'q1': float, 'median': float, 'q3': float, 'max': float, 'outliers': list[float], 'mean': float, 'ciLower': float, 'ciUpper': float},
          { ... same for sample B ... }
        ],
        'tTestPValue': float, 'tTestConclusion': str
      }
    }
  ],
  'instructions': str
}
```

### Detailed Modification Guide

#### 1. `types/analysis.ts` — Type Definitions

**Line 3 — Add to AnalysisType union:**
```typescript
export type AnalysisType = 'gage_rr' | 'capacidad_proceso' | 'hipotesis_2_muestras'
```

**Around line 30 — Add to AnalysisResult.results union:**
```typescript
results: GageRRResults | CapacidadProcesoResult | Hipotesis2MuestrasResult
```

**After line 323 (end of file) — Add all new interfaces:**

```typescript
// ============================================
// Hipotesis 2 Muestras Types
// ============================================

export interface Hipotesis2MuestrasOutliers {
  q1: number
  q3: number
  iqr: number
  lower_fence: number
  upper_fence: number
  outlier_count: number
  outlier_values: number[]
  outlier_percentage: number
}

export interface Hipotesis2MuestrasDescriptive {
  sample_name: string
  n: number
  mean: number
  median: number
  std_dev: number
  skewness: number
  outliers: Hipotesis2MuestrasOutliers
}

export interface Hipotesis2MuestrasSampleSizeEntry {
  n: number
  tcl_applies: boolean
  small_sample_warning: boolean
  note: string
}

export interface Hipotesis2MuestrasSampleSize {
  a: Hipotesis2MuestrasSampleSizeEntry
  b: Hipotesis2MuestrasSampleSizeEntry
}

export interface Hipotesis2MuestrasNormality {
  is_normal: boolean
  ad_statistic: number
  p_value: number
  alpha: number
  is_robust: boolean | null
  robustness_details: string | null
}

export interface Hipotesis2MuestrasBoxCox {
  applied: boolean
  lambda_a: number | null
  lambda_b: number | null
  normality_improved: boolean | null
  using_transformed_data: boolean
  warning: string | null
}

export interface Hipotesis2MuestrasVarianceTest {
  method: string
  f_statistic: number
  p_value: number
  df1: number
  df2: number
  alpha: number
  equal_variances: boolean
  conclusion: string
}

export interface Hipotesis2MuestrasMeansTest {
  method: string
  t_statistic: number
  degrees_of_freedom: number
  p_value: number
  ci_lower: number | null
  ci_upper: number | null
  difference: number
  alpha: number
  confidence_level: number
  alternative_hypothesis: 'two-sided' | 'greater' | 'less'
  equal_variances: boolean
  conclusion: string
}

export interface Hipotesis2MuestrasResult {
  descriptive_a: Hipotesis2MuestrasDescriptive
  descriptive_b: Hipotesis2MuestrasDescriptive
  sample_size: Hipotesis2MuestrasSampleSize
  normality_a: Hipotesis2MuestrasNormality
  normality_b: Hipotesis2MuestrasNormality
  box_cox: Hipotesis2MuestrasBoxCox
  variance_test: Hipotesis2MuestrasVarianceTest
  means_test: Hipotesis2MuestrasMeansTest
  warnings: string[]
}

// Chart Data Types for Hipotesis 2 Muestras

export interface Hipotesis2MHistogramBin {
  start: number
  end: number
  count: number
}

export interface Hipotesis2MHistogramData {
  type: 'histogram_a' | 'histogram_b'
  data: {
    bins: Hipotesis2MHistogramBin[]
    mean: number
    sampleName: string
    outliers: number[]
  }
}

export interface Hipotesis2MBoxplotSample {
  name: string
  min: number
  q1: number
  median: number
  q3: number
  max: number
  outliers: number[]
  mean: number
}

export interface Hipotesis2MBoxplotMeansSample extends Hipotesis2MBoxplotSample {
  ciLower: number
  ciUpper: number
}

export interface Hipotesis2MBoxplotVarianceData {
  type: 'boxplot_variance'
  data: {
    samples: [Hipotesis2MBoxplotSample, Hipotesis2MBoxplotSample]
    leveneTestPValue: number
    leveneConclusion: string
  }
}

export interface Hipotesis2MBoxplotMeansData {
  type: 'boxplot_means'
  data: {
    samples: [Hipotesis2MBoxplotMeansSample, Hipotesis2MBoxplotMeansSample]
    tTestPValue: number
    tTestConclusion: string
  }
}

export type Hipotesis2MChartDataItem =
  | Hipotesis2MHistogramData
  | Hipotesis2MBoxplotVarianceData
  | Hipotesis2MBoxplotMeansData
```

#### 2. `constants/analysis.ts` — Add Constant

**Inside the `ANALYSIS_TYPES` object (line ~64), add:**
```typescript
export const ANALYSIS_TYPES = {
  MSA: 'msa',
  CAPACIDAD_PROCESO: 'capacidad_proceso',
  HIPOTESIS_2_MUESTRAS: 'hipotesis_2_muestras',
} as const
```

#### 3. `lib/openai/tools.ts` — Tool Definition Updates

**Line ~30 — Update `analysis_type` enum:**
```typescript
enum: ['msa', 'capacidad_proceso', 'hipotesis_2_muestras'],
description: 'Tipo de análisis: "msa" para Gauge R&R, "capacidad_proceso" para índices de capacidad, "hipotesis_2_muestras" para comparación de 2 muestras.',
```

**After `spec_limits` property (around line 48), add new properties:**
```typescript
confidence_level: {
  type: 'number',
  enum: [0.90, 0.95, 0.99],
  description: 'Nivel de confianza para prueba de hipótesis (solo hipotesis_2_muestras). Default: 0.95',
},
alternative_hypothesis: {
  type: 'string',
  enum: ['two-sided', 'greater', 'less'],
  description: 'Hipótesis alternativa para test de medias: "two-sided" (≠), "greater" (>), "less" (<). Solo hipotesis_2_muestras. Default: "two-sided"',
},
```

**DO NOT add these to `required` array.** Both are optional with defaults handled in Python.

#### 4. `lib/api/analyze.ts` — Client Function Updates

**Update `invokeAnalysisTool` function signature to add optional params:**
```typescript
export async function invokeAnalysisTool(
  analysisType: string,
  fileId: string,
  messageId?: string,
  specLimits?: SpecLimits,
  confidenceLevel?: number,
  alternativeHypothesis?: string,
): Promise<AnalysisResponse>
```

**In the body building block, after the existing `specLimits` conditional, add:**
```typescript
if (confidenceLevel !== undefined) {
  body.confidence_level = confidenceLevel
}
if (alternativeHypothesis) {
  body.alternative_hypothesis = alternativeHypothesis
}
```

**Follow the EXACT same pattern as the existing `specLimits` conditional.**

### Testing Requirements

**This story is TypeScript-only. Testing approach:**

1. **Type checking:** `npx tsc --noEmit` — validates all new interfaces compile correctly and the union types are consistent
2. **Build verification:** `npm run build` — ensures no runtime issues
3. **No unit tests needed** for type definitions (TypeScript compiler IS the test)
4. **Manual verification:** Plantillas page still renders (the template entry already exists)

**Verification commands:**
```bash
npx tsc --noEmit        # Zero TypeScript errors
npm run build            # Successful build
```

**Pre-existing test failures:** 4 MSA chart-related tests are known to fail. Do NOT fix these.

### Previous Story Intelligence

**From Story 10.4 (Results Assembly, Chart Data & Instructions):**

1. **Output structure is final.** The `build_hipotesis_2_muestras_output()` function returns the exact structure that TypeScript types must match. All keys in `results` are `snake_case`, all keys in `chartData` items are `camelCase`.

2. **numpy types are already cast.** The Python output builder casts all numpy types to native Python types. TypeScript interfaces use `number` and `boolean` — no special handling needed.

3. **`ci_lower`/`ci_upper` can be null.** For one-sided tests, one of these may be null. TypeScript must use `number | null`.

4. **`is_robust` and `robustness_details` can be null.** When normality passes, robustness is not evaluated. TypeScript must use `boolean | null` and `string | null`.

5. **Chart rounding:** All chart data values are rounded to 4 decimals in Python. TypeScript types are just `number`.

6. **Test baseline after Epic 10:** 599 passed, 4 pre-existing failures. This story should NOT change test count (no Python changes).

**From Story 10.1 (Template & Validator):**

1. **Template entry already in `constants/templates.ts`.** Lines 35-42 have the complete entry with `id: 'hipotesis_2_muestras'`, `analysisType: 'hipotesis_2_muestras'`.

2. **Plantillas page is dynamic.** `app/(dashboard)/plantillas/page.tsx` maps over the `TEMPLATES` array — adding the constant was sufficient.

3. **The `analysisType` field in templates should match the `AnalysisType` union.** After this story adds `'hipotesis_2_muestras'` to the union, type safety is complete.

### Git Intelligence

**Recent commit patterns:** `feat:` prefix for features, concise English summaries.

**Codebase state:** Epic 10 is complete. All 4 stories (10.1-10.4) are done. The Python backend fully supports `hipotesis_2_muestras` analysis. Frontend TypeScript layer is NOT yet aware of this analysis type — that's what this story fixes.

**No pending refactors or breaking changes.** Clean starting point.

### Project Structure Notes

- All TypeScript types are in `types/` directory with descriptive filenames
- Constants follow `as const` pattern for type safety
- Tool definitions use OpenAI function calling schema format
- Client API functions use optional parameters with undefined checks
- No new files created — all modifications to existing files
- The `AnalysisType` union at `types/analysis.ts:3` is the single source of truth for valid analysis types

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-11, Story 11.1]
- [Source: _bmad-output/planning-artifacts/prd-v4.md#FR-H3, FR-H26]
- [Source: _bmad-output/planning-artifacts/architecture.md#TypeScript-Type-System]
- [Source: _bmad-output/planning-artifacts/architecture.md#Tool-Definitions]
- [Source: _bmad-output/implementation-artifacts/10-4-results-assembly-chart-data-instructions-generation.md — Python output structure]
- [Source: _bmad-output/implementation-artifacts/10-1-template-validator-routing-foundation.md — Template already created]
- [Source: types/analysis.ts — existing type patterns to follow]
- [Source: constants/analysis.ts#L62-66 — ANALYSIS_TYPES constant to EXTEND]
- [Source: lib/openai/tools.ts — tool definition to EXTEND]
- [Source: lib/api/analyze.ts#invokeAnalysisTool — client function to EXTEND]
- [Source: constants/templates.ts#L35-42 — template entry already EXISTS]
- [Source: api/utils/hipotesis_2_muestras_calculator.py#build_hipotesis_2_muestras_output — Python output reference]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered.

### Completion Notes List

- **Task 1:** Added 13 new TypeScript interfaces and 1 union type for Hipotesis 2 Muestras in `types/analysis.ts`. All key names match the Python output structure exactly (snake_case for results, camelCase for chartData). Added `Hipotesis2MuestrasResult` to the `AnalysisResult.results` union and `'hipotesis_2_muestras'` to the `AnalysisType` union.
- **Task 2:** Added `HIPOTESIS_2_MUESTRAS: 'hipotesis_2_muestras'` to the `ANALYSIS_TYPES` constant in `constants/analysis.ts`.
- **Task 3:** Updated tool definition in `lib/openai/tools.ts`: added `'hipotesis_2_muestras'` to the analysis_type enum, updated description to mention hypothesis testing, added `confidence_level` (number, enum [0.90, 0.95, 0.99]) and `alternative_hypothesis` (string, enum ['two-sided', 'greater', 'less']) as optional properties (not in `required` array).
- **Task 4:** Extended `invokeAnalysisTool` in `lib/api/analyze.ts` with two new optional parameters (`confidenceLevel`, `alternativeHypothesis`) following the existing `specLimits` conditional pattern. All 8 existing tests pass with no regressions.
- **Task 5:** `tsc --noEmit` shows zero new errors (all errors are pre-existing in test files). `npm run build` succeeds. Plantillas page renders as static content.

### Change Log

- 2026-03-14: Story 11.1 implemented — Added TypeScript types, analysis constant, tool parameters, and client function updates for hipotesis_2_muestras analysis type.
- 2026-03-14: Code review (Claude Opus 4.6) — Found 4 Medium + 2 Low issues. Fixed: stale JSDoc comments in tools.ts and analyze.ts, stale file header in analysis.ts, inconsistent null check pattern. Noted: chat route caller update deferred to Story 11.3 (by design). Status → done.

### File List

- `types/analysis.ts` — Modified: Added AnalysisType union member, AnalysisResult.results union member, and 13 new interfaces/types for Hipotesis 2 Muestras
- `constants/analysis.ts` — Modified: Added HIPOTESIS_2_MUESTRAS to ANALYSIS_TYPES constant
- `lib/openai/tools.ts` — Modified: Added hipotesis_2_muestras to enum, updated description, added confidence_level and alternative_hypothesis properties
- `lib/api/analyze.ts` — Modified: Added confidenceLevel and alternativeHypothesis optional parameters to invokeAnalysisTool
