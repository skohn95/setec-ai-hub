---
type: architecture-addendum
parentDocument: architecture.md
triggeredBy: prd-v5.md
date: 2026-03-14
author: Setec
status: draft
summary: "Three architectural changes required to support the Tamaño de Muestra analysis (no-file, conversational, text-only)"
---

# Architecture Addendum — Tamaño de Muestra (PRD v5)

This addendum documents three architectural decisions needed to support the new `tamano_muestra` analysis type, which introduces a **no-file conversational pattern** not present in existing analyses (MSA, Capacidad de Proceso, Hipótesis 2 Muestras).

The rest of the architecture (streaming, auth, storage, frontend patterns, naming conventions, Vercel/Supabase config) remains unchanged.

---

## AD-1: Make `file_id` Optional in the Analysis Pipeline

### Context

Every existing analysis follows the pattern: **user uploads file → Python validates file → Python analyzes file → results saved**. The `tamano_muestra` analysis breaks this — it's purely conversational with no file involved.

Three locations enforce `file_id` as required:

| Location | Current Constraint | Impact |
|----------|-------------------|--------|
| `analysis_results` table | `file_id UUID NOT NULL` | Cannot insert a row without a file |
| `api/analyze.py` line 139 | `file_id` in `missing_fields` check | Request rejected without `file_id` |
| `lib/openai/tools.ts` | `file_id` in `required` array | Agent cannot invoke tool without `file_id` |

### Decision

Make `file_id` **conditionally required** — required for file-based analyses, omitted for conversational analyses.

### Changes

**Database — `analysis_results` table:**

```sql
-- Migration: Make file_id nullable
ALTER TABLE analysis_results ALTER COLUMN file_id DROP NOT NULL;
```

No other schema changes. The existing JSONB `results` and `chart_data` columns handle any structure.

**Python — `api/analyze.py`:**

For `tamano_muestra`, the flow skips file fetch/load/validate entirely:

```
existing flow:    validate fields → fetch file → load Excel → validate data → analyze → save
tamano_muestra:   validate fields → validate params → calculate → save
```

Concretely:
- Move `file_id` from the always-required check to a conditional check (required unless `analysis_type == 'tamano_muestra'`)
- Add early parameter validation for `tamano_muestra` (delta, sigma, alpha, power, alternative_hypothesis) — same pattern as the existing `hipotesis_2_muestras` parameter validation block (lines 182-220)
- Route `tamano_muestra` before the file fetch/load/validate block, so it never touches file operations
- Pass `file_id=None` to `save_analysis_results` for this analysis type

**TypeScript — `lib/openai/tools.ts`:**

Remove `file_id` from the global `required` array. Instead, make the tool description explicit about when `file_id` is needed:

```typescript
file_id: {
  type: 'string',
  description: 'UUID del archivo subido. Requerido para msa, capacidad_proceso, hipotesis_2_muestras. NO enviar para tamano_muestra.'
}
```

Add the new parameters for `tamano_muestra`:

```typescript
delta: {
  type: 'number',
  description: 'Diferencia mínima prácticamente significativa. Requerido para tamano_muestra.'
},
sigma: {
  type: 'number',
  description: 'Desviación estándar estimada del proceso. Requerido para tamano_muestra.'
},
alpha: {
  type: 'number',
  description: 'Nivel de significancia (ej: 0.05). Requerido para tamano_muestra.'
},
power: {
  type: 'number',
  description: 'Poder estadístico (ej: 0.80). Requerido para tamano_muestra.'
},
alternative_hypothesis: {
  type: 'string',
  enum: ['two-sided', 'greater', 'less'],
  description: 'Dirección de la prueba futura. Requerido para tamano_muestra y hipotesis_2_muestras.'
},
current_mean: {
  type: 'number',
  description: 'Media actual estimada del proceso. Opcional para tamano_muestra (contexto).'
},
expected_mean: {
  type: 'number',
  description: 'Media esperada después de la mejora. Opcional para tamano_muestra (contexto).'
}
```

**TypeScript — `lib/api/analyze.ts`:**

Make `fileId` optional in `invokeAnalysisTool`. Add a params object for `tamano_muestra` parameters:

```typescript
export interface SampleSizeParams {
  delta: number
  sigma: number
  alpha: number
  power: number
  alternative_hypothesis: 'two-sided' | 'greater' | 'less'
  current_mean?: number
  expected_mean?: number
}

export async function invokeAnalysisTool(
  analysisType: string,
  fileId?: string,          // Now optional
  messageId?: string,
  specLimits?: SpecLimits,
  sampleSizeParams?: SampleSizeParams  // New
): Promise<AnalysisResponse>
```

### Risk Assessment

**Low risk.** Making `file_id` nullable is backwards-compatible — all existing rows already have a `file_id`. No existing queries break. The only new behavior is that `tamano_muestra` rows will have `file_id = NULL`.

---

## AD-2: Pure Python `norm_ppf` — Reuse Existing Implementation

### Context

PRD v5 NFR-TM1 states: *"Z-scores must use `scipy.stats.norm.ppf`."*

The architecture document states: *"scipy excluded due to Vercel 250MB limit."*

### Decision

**Reuse the existing `_norm_ppf` function** from `api/utils/capacidad_proceso_calculator.py` (line 421). It's a pure Python implementation using Abramowitz & Stegun rational approximation, accurate to ~4.5e-4 — more than sufficient for sample size calculations where n is rounded up to the nearest integer anyway.

### Change

Extract `_norm_ppf` into a **shared module** (`api/utils/stats_common.py` or similar) so both `capacidad_proceso_calculator.py` and the new `tamano_muestra_calculator.py` can import it without cross-dependency.

```
Before:
  capacidad_proceso_calculator.py → defines _norm_ppf internally

After:
  stats_common.py → exports norm_ppf
  capacidad_proceso_calculator.py → imports from stats_common
  tamano_muestra_calculator.py → imports from stats_common
```

The existing `_normal_cdf` in `normality_tests.py` is already shared across modules — same pattern.

### PRD v5 Correction

NFR-TM1 should read: *"Z-scores must use the project's pure Python `norm_ppf` implementation (Abramowitz & Stegun rational approximation)"* — not `scipy.stats.norm.ppf`.

---

## AD-3: Text-Only Analysis Response Contract

### Context

Existing analyses return `{ results, chartData, instructions }` where `chartData` is always a non-empty array of chart definitions. `tamano_muestra` has no charts — output is text-only.

### Decision

`chartData` returns as an **empty array** `[]` (not `null`). This keeps the response contract consistent — the frontend can always expect an array, it just may be empty. No frontend conditional logic needed for null handling.

```python
# tamano_muestra response
{
    "results": { ... },
    "chartData": [],          # Empty array, not null
    "instructions": "..."
}
```

The `analysis_results` table stores this as `'[]'::jsonb` — valid JSONB, no schema change needed.

### Frontend Impact

None. Existing chart rendering logic already iterates over `chartData` — an empty array simply renders nothing.

---

## Summary of All Changes

| Component | Change | Complexity |
|-----------|--------|------------|
| DB: `analysis_results.file_id` | `DROP NOT NULL` | 1 migration |
| Python: `analyze.py` routing | Conditional `file_id` requirement, early branch for `tamano_muestra` | ~30 lines |
| Python: `stats_common.py` | Extract shared `norm_ppf` | New file, ~25 lines |
| Python: `tamano_muestra_calculator.py` | New calculator | New file (PRD scope) |
| TS: `tools.ts` | Add params, make `file_id` conditional | ~20 lines |
| TS: `analyze.ts` | Optional `fileId`, new `SampleSizeParams` | ~15 lines |
| TS: `analysis.ts` | New `TamanoMuestraResult` interface | ~20 lines |
| TS: `constants/analysis.ts` | Add `TAMANO_MUESTRA` | 1 line |

**No changes to:** Database schema (beyond the one column), Auth, Storage, RLS policies, Vercel config, streaming, frontend state management, chart components, or naming conventions.

---

*Architecture addendum for PRD v5 — Cálculo de Tamaño de Muestra — Setec AI Hub*
