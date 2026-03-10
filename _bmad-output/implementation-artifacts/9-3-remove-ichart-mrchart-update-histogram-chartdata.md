# Story 9.3: Remove I-Chart & MR-Chart, Update Histogram & chartData Interface

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to see only the 2 relevant charts (Histogram and Normality Plot)**,
So that **the visualization focuses on normality and capability without stability clutter**.

**FRs covered (PRD-v3):** FR-CP17

**Supersedes:** Story 8.1 (I-Chart portion + Histogram LCI/LCS), Story 8.2 (MR-Chart portion)

## Acceptance Criteria

1. **Given** the I-Chart and MR-Chart components exist from Epic 8
   **When** the v3 scope refinement is applied
   **Then** `IChart.tsx` is deleted
   **And** `MRChart.tsx` is deleted
   **And** their test files (`IChart.test.tsx`, `MRChart.test.tsx`) are deleted
   **And** any imports or references to these components are removed from the codebase

2. **Given** the Histogram component exists with green dashed control limit lines (LCI/LCS)
   **When** it is updated for v3
   **Then** the green dashed control limit lines (LCI/LCS) are removed from rendering
   **And** the histogram retains: frequency bars, LEI (red), LES (red), Mean (blue), distribution curve
   **And** the visible values show LEI, LES, and Mean only (no LCI, LCS)

3. **Given** the TypeScript `CapacidadProcesoChartDataItem` union type includes `IChartData` and `MRChartData`
   **When** it is updated for v3
   **Then** the `charts` union contains exactly 2 types: `HistogramChartData` and `NormalityPlotData`
   **And** the `IChartData` and `MRChartData` interfaces are removed
   **And** the `IChartLimits` and `MRChartLimits` interfaces are removed
   **And** the `HistogramChartData.data` type no longer includes `lcl` or `ucl` fields
   **And** the `NormalityPlotData` definition remains unchanged

4. **Given** the Python analysis generates `chartData`
   **When** the output is structured
   **Then** `chartData.charts` contains exactly 2 chart objects (histogram + normality_plot)
   **And** no I-Chart or MR-Chart data is generated (already done in Story 9.1 — verify only)
   **And** the histogram chart data does not include `lcl` or `ucl` values

## Tasks / Subtasks

- [x] Task 1: Delete I-Chart and MR-Chart component files (AC: #1)
  - [x] 1.1 Delete `components/charts/IChart.tsx` (328 lines)
  - [x] 1.2 Delete `components/charts/MRChart.tsx` (276 lines)
  - [x] 1.3 Delete `components/charts/IChart.test.tsx`
  - [x] 1.4 Delete `components/charts/MRChart.test.tsx`

- [x] Task 2: Remove I-Chart/MR-Chart from chart orchestrator and barrel exports (AC: #1)
  - [x] 2.1 In `components/charts/CapacidadProcesoCharts.tsx`: remove `import IChart from './IChart'` and `import MRChart from './MRChart'`
  - [x] 2.2 Remove `IChartData` and `MRChartData` type imports from CapacidadProcesoCharts.tsx
  - [x] 2.3 Remove the `charts.find(c => c.type === 'i_chart')` data extraction and `<IChart>` render
  - [x] 2.4 Remove the `charts.find(c => c.type === 'mr_chart')` data extraction and `<MRChart>` render
  - [x] 2.5 In `components/charts/index.ts`: remove `export { default as IChart } from './IChart'` and `export { default as MRChart } from './MRChart'`

- [x] Task 3: Clean up TypeScript type definitions (AC: #3)
  - [x] 3.1 In `types/analysis.ts`: remove `IChartData` interface
  - [x] 3.2 Remove `MRChartData` interface
  - [x] 3.3 Remove `IChartLimits` interface
  - [x] 3.4 Remove `MRChartLimits` interface
  - [x] 3.5 Update `CapacidadProcesoChartDataItem` union type: remove `IChartData | MRChartData`, keep only `HistogramChartData | NormalityPlotData`
  - [x] 3.6 Remove `lcl` and `ucl` fields from `HistogramChartData.data` interface
  - [x] 3.7 In `types/api.ts`: remove `IChartData` from re-exports
  - [x] 3.8 Remove `RuleViolation` from re-exports (confirmed no other consumers)
  - [x] 3.9 Remove `OutOfControlPoint`, `RuleViolation`, `ChartPoint`, `StabilityRuleResult`, `StabilityAnalysisResult` and `stability` field from `CapacidadProcesoResult` (all orphaned after I-Chart/MR-Chart removal, verified via grep)

- [x] Task 4: Remove control limit lines from HistogramChart.tsx (AC: #2)
  - [x] 4.1 Remove `lcl` and `ucl` from destructured `data.data` properties
  - [x] 4.2 Remove the green dashed `<ReferenceLine>` for LCI
  - [x] 4.3 Remove the green dashed `<ReferenceLine>` for LCS
  - [x] 4.4 Remove legend item referencing LCI / LCS (Control)
  - [x] 4.5 Verify histogram still renders: frequency bars, LEI (red), LES (red), Mean (blue), distribution curve

- [x] Task 5: Verify Python backend (AC: #4)
  - [x] 5.1 Confirm `_build_chart_data()` generates only histogram + normality_plot (grep: no i_chart/mr_chart/lcl/ucl references)
  - [x] 5.2 Confirm histogram data dict does NOT include `lcl` or `ucl` keys
  - [x] 5.3 Run Python tests: 69 passed in 0.19s

- [x] Task 6: Build verification and regression (AC: #1, #2, #3, #4)
  - [x] 6.1 Run TypeScript type check: `npx tsc --noEmit` — passes (only pre-existing errors in unrelated test files)
  - [x] 6.2 Run frontend build: `npm run build` — successful
  - [x] 6.3 Verify no remaining references to IChart, MRChart, i_chart, mr_chart in codebase — grep: 0 matches
  - [x] 6.4 Verify no remaining references to lcl/ucl/LCI/LCS in chart-related code — grep: 0 matches

## Dev Notes

### CRITICAL: What This Story Does and Does NOT Cover

**IN SCOPE (Story 9.3 — Frontend cleanup + TypeScript types):**
- Delete IChart.tsx, MRChart.tsx and their test files
- Remove all imports/references to these components
- Remove IChartData, MRChartData, IChartLimits, MRChartLimits TypeScript interfaces
- Remove lcl/ucl from HistogramChartData interface and HistogramChart.tsx rendering
- Update CapacidadProcesoChartDataItem union type to only HistogramChartData | NormalityPlotData
- Clean up orphaned type exports (OutOfControlPoint, RuleViolation if unused)
- Verify Python backend already correct (Story 9.1 removed chart generation)

**OUT OF SCOPE (handled in other stories):**
- Story 9.4: Update agent instructions and presentation text (remove stability mentions)
- Python calculation changes (already completed in Stories 9.1 and 9.2)
- Any new chart features or visual changes beyond removal

### Architecture & Constraints

- **Runtime:** Next.js 16 + React 19 + TypeScript, deployed on Vercel
- **Charts:** Recharts library — no version-specific concerns for deletion
- **Pattern:** Chart components in `components/charts/`, types in `types/analysis.ts`
- **Build:** Must pass `npx tsc --noEmit` and `npm run build` after changes
- **No new dependencies** — this is purely a removal/cleanup story

### Key Data Flow — Current State (Post Stories 9.1 & 9.2)

```
Python backend (_build_chart_data):
  Generates exactly 2 charts: histogram + normality_plot
  (I-Chart/MR-Chart generation already removed in Story 9.1)
                    |
                    v
Frontend (CapacidadProcesoCharts.tsx):
  Still imports IChart, MRChart (dead code)     <-- REMOVE
  charts.find('i_chart') → null (no data)       <-- REMOVE
  charts.find('mr_chart') → null (no data)      <-- REMOVE
  charts.find('histogram') → renders            <-- KEEP
  charts.find('normalityPlot') → renders         <-- KEEP
                    |
                    v
HistogramChart.tsx:
  Renders: bars, LEI (red), LES (red), Mean (blue), distribution curve  <-- KEEP
  Renders: LCI (green dashed), LCS (green dashed)                       <-- REMOVE
```

### Key Data Flow — AFTER (Target)

```
Python backend (_build_chart_data):
  Generates exactly 2 charts: histogram + normality_plot  (no change)
                    |
                    v
Frontend (CapacidadProcesoCharts.tsx):
  Only imports HistogramChart, NormalityPlot
  Only finds/renders 'histogram' and 'normalityPlot'
                    |
                    v
HistogramChart.tsx:
  Renders: bars, LEI (red), LES (red), Mean (blue), distribution curve
  No control limit lines
```

### Key File Locations

| File | Action | Purpose |
|------|--------|---------|
| `components/charts/IChart.tsx` | **DELETE** | I-Chart component (328 lines) |
| `components/charts/MRChart.tsx` | **DELETE** | MR-Chart component (276 lines) |
| `components/charts/IChart.test.tsx` | **DELETE** | I-Chart tests |
| `components/charts/MRChart.test.tsx` | **DELETE** | MR-Chart tests |
| `components/charts/CapacidadProcesoCharts.tsx` | **MODIFY** | Remove IChart/MRChart imports, data extraction, rendering |
| `components/charts/index.ts` | **MODIFY** | Remove IChart/MRChart barrel exports |
| `components/charts/HistogramChart.tsx` | **MODIFY** | Remove lcl/ucl destructuring and LCI/LCS ReferenceLine elements |
| `types/analysis.ts` | **MODIFY** | Remove 4+ interfaces, update union type, remove lcl/ucl from HistogramChartData |
| `types/api.ts` | **MODIFY** | Remove IChartData (and possibly RuleViolation) from re-exports |
| `api/utils/capacidad_proceso_calculator.py` | **VERIFY ONLY** | Confirm histogram data has no lcl/ucl (already done in 9.1) |

### Current CapacidadProcesoCharts.tsx Structure (BEFORE)

```tsx
import HistogramChart from './HistogramChart'
import NormalityPlot from './NormalityPlot'
import IChart from './IChart'          // ← REMOVE
import MRChart from './MRChart'        // ← REMOVE
import {
  HistogramChartData, NormalityPlotData,
  IChartData, MRChartData,              // ← REMOVE
  CapacidadProcesoChartDataItem
} from '@/types/analysis'

// Inside component:
const iChartData = charts.find(c => c.type === 'i_chart')   // ← REMOVE
const mrChartData = charts.find(c => c.type === 'mr_chart')  // ← REMOVE

// In JSX:
{iChartData && <IChart data={iChartData as IChartData} />}   // ← REMOVE
{mrChartData && <MRChart data={mrChartData as MRChartData} />} // ← REMOVE
```

### Current HistogramChart.tsx Control Limit Lines (REMOVE)

```tsx
// Destructuring (~line 212):
const { lei, les, mean, lcl, ucl, fitted_distribution } = data.data
//                       ^^^  ^^^  ← REMOVE these two

// ReferenceLine elements (~lines 337-354):
{lcl !== null && lcl !== undefined && (
  <ReferenceLine x={lcl} stroke="#10B981" strokeDasharray="5 5" strokeWidth={2}
    label={{ value: 'LCI', position: 'top', fontSize: 10, fill: '#10B981' }} />
)}
{ucl !== null && ucl !== undefined && (
  <ReferenceLine x={ucl} stroke="#10B981" strokeDasharray="5 5" strokeWidth={2}
    label={{ value: 'LCS', position: 'top', fontSize: 10, fill: '#10B981' }} />
)}
// ↑ REMOVE both blocks entirely
```

### Current TypeScript Types to Remove (types/analysis.ts)

```typescript
// REMOVE these interfaces:
export interface IChartLimits { center: number; ucl: number; lcl: number; mr_bar: number }
export interface MRChartLimits { center: number; ucl: number; lcl: number }
export interface IChartData { type: 'i_chart'; data: { values: number[]; center: number; ucl: number; lcl: number; ooc_points: OutOfControlPoint[]; rules_violations: RuleViolation[] } }
export interface MRChartData { type: 'mr_chart'; data: { values: number[]; center: number; ucl: number; lcl: number; ooc_points: OutOfControlPoint[] } }

// UPDATE this union type:
// BEFORE:
export type CapacidadProcesoChartDataItem = HistogramChartData | IChartData | MRChartData | NormalityPlotData
// AFTER:
export type CapacidadProcesoChartDataItem = HistogramChartData | NormalityPlotData

// REMOVE from HistogramChartData.data:
lcl: number | null
ucl: number | null
```

### Orphaned Types Check

After removing IChart/MRChart, verify if these types are still used anywhere:
- `OutOfControlPoint` — used only by IChartData and MRChartData → **REMOVE if unused**
- `RuleViolation` — used only by IChartData → **REMOVE if unused**
- `StabilityAnalysisResult` — may still be in CapacidadProcesoResult → **check, may be Story 9.4 scope**

**IMPORTANT:** Before removing OutOfControlPoint/RuleViolation, grep the entire codebase to confirm no other consumers. If they appear only in the deleted files and types/analysis.ts, safe to remove.

### Testing Strategy

- **No new tests needed** — this is a deletion story
- **TypeScript compilation:** `npx tsc --noEmit` must pass (catches broken imports/types)
- **Build verification:** `npm run build` must succeed
- **Python regression:** `python -m pytest api/tests/test_capacidad_proceso_calculator.py -v` to confirm backend unchanged
- **Grep verification:** No remaining references to IChart, MRChart, i_chart, mr_chart, LCI, LCS in active code

### Project Structure Notes

- Chart components at `components/charts/` following `ComponentName.tsx` naming
- Test files co-located: `ComponentName.test.tsx`
- Barrel exports via `components/charts/index.ts`
- Types centralized in `types/analysis.ts` with re-exports in `types/api.ts`
- Python API at `api/` — verify only, no modifications expected

### Previous Story Intelligence (Stories 9.1 & 9.2)

**From Story 9.1 completion notes:**
- Created `sigma_estimation.py` replacing `stability_analysis.py`
- Removed I-Chart, MR-Chart generation from `_build_chart_data()` — charts now: histogram + normality_plot only
- Python backend already produces correct 2-chart output
- 187 related tests passing; 4 pre-existing MSA test failures unrelated

**From Story 9.2 completion notes:**
- Refactored `calculate_capability_indices()` to accept `sigma_result` directly
- Removed `sigma_compat` compatibility shim
- Removed duplicate sigma functions from `capability_indices.py`
- 463 passed, 4 failed (pre-existing MSA, unrelated)

**Key insight:** Python backend is already correct. Story 9.3 is purely frontend cleanup.

### Git Intelligence — Recent Commits

```
fe47c80 feat: Redesign privacy page with transparency section
ef569dd feat: Update BMAD framework and app prompts
2d66109 feat: Rename analysis from 'Capacidad de Proceso' to 'Control Estadistico de Proceso'
c49e27a fix: Remove duplicate SpecLimits export from analysis.ts
30b86c4 feat: Complete Epic 7 & 8 - Process Capability Analysis
```

- Stories 9.1 and 9.2 changes are uncommitted (in working tree) — this story builds on top
- Commit `c49e27a` fixed a duplicate export in analysis.ts — watch for similar issues when removing exports

### References

- [Source: _bmad-output/planning-artifacts/prd-v3.md — FR-CP17 Visualizations]
- [Source: _bmad-output/planning-artifacts/epics.md — Epic 9, Story 9.3]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Architecture, Chart Components]
- [Source: _bmad-output/implementation-artifacts/9-1-create-sigma-estimation-module-remove-stability.md — I-Chart/MR-Chart removal from Python]
- [Source: _bmad-output/implementation-artifacts/9-2-update-capability-index-formulas-sigma-differentiation.md — Sigma refactoring context]
- [Source: components/charts/CapacidadProcesoCharts.tsx — Chart orchestrator with IChart/MRChart imports]
- [Source: components/charts/HistogramChart.tsx — LCI/LCS ReferenceLine elements ~lines 337-354]
- [Source: types/analysis.ts — IChartData, MRChartData, IChartLimits, MRChartLimits, CapacidadProcesoChartDataItem union]
- [Source: types/api.ts — IChartData re-export ~line 305]
- [Source: components/charts/index.ts — Barrel exports for IChart, MRChart]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered. Clean removal with zero regressions.

### Completion Notes List

- Deleted 4 files: IChart.tsx (328 lines), MRChart.tsx (276 lines), IChart.test.tsx, MRChart.test.tsx
- Rewrote CapacidadProcesoCharts.tsx: removed IChart/MRChart imports, type imports, find calls, and JSX rendering — now only renders Histogram + NormalityPlot
- Updated index.ts barrel exports: removed IChart and MRChart exports
- Removed 9 interfaces from types/analysis.ts: IChartLimits, MRChartLimits, OutOfControlPoint, StabilityRuleResult, StabilityAnalysisResult, IChartData, MRChartData, RuleViolation, ChartPoint
- Removed `stability?: StabilityAnalysisResult` field from CapacidadProcesoResult (dead code since Story 9.1 removed stability analysis from Python backend)
- Updated CapacidadProcesoChartDataItem union type to only `HistogramChartData | NormalityPlotData`
- Removed lcl/ucl fields from HistogramChartData.data interface
- Removed green dashed LCI/LCS ReferenceLine elements and legend item from HistogramChart.tsx
- Removed lcl/ucl from allXValues X-axis domain calculation
- Updated description text from "especificación y control" to "especificación"
- Updated types/api.ts: removed IChartData, RuleViolation, ChartPoint re-exports
- Fixed ChatMessage.tsx: removed i_chart/mr_chart from chart type filter
- Updated CapacidadProcesoCharts.test.tsx: removed IChart/MRChart mocks, fixtures, and tests; updated chart order tests for 2-chart layout
- Updated HistogramChart.test.tsx: removed lcl/ucl from all test fixtures, removed control limit legend test
- Python backend verified: no lcl/ucl/i_chart/mr_chart references, 69 tests passed
- Full regression: 464 Python tests passed (4 pre-existing MSA failures, unrelated)
- TypeScript compilation passes, npm run build successful, grep verification clean

### File List

- `components/charts/IChart.tsx` — DELETED
- `components/charts/MRChart.tsx` — DELETED
- `components/charts/IChart.test.tsx` — DELETED
- `components/charts/MRChart.test.tsx` — DELETED
- `components/charts/CapacidadProcesoCharts.tsx` — MODIFIED: Removed IChart/MRChart imports and rendering
- `components/charts/CapacidadProcesoCharts.test.tsx` — MODIFIED: Updated tests for 2-chart layout
- `components/charts/index.ts` — MODIFIED: Removed IChart/MRChart exports
- `components/charts/HistogramChart.tsx` — MODIFIED: Removed lcl/ucl, LCI/LCS lines, control limit legend
- `components/charts/HistogramChart.test.tsx` — MODIFIED: Removed lcl/ucl from fixtures, removed control limit tests
- `components/chat/ChatMessage.tsx` — MODIFIED: Removed i_chart/mr_chart from chart type filter
- `types/analysis.ts` — MODIFIED: Removed 9 interfaces, updated union type, removed lcl/ucl from HistogramChartData
- `types/api.ts` — MODIFIED: Removed IChartData, RuleViolation, ChartPoint re-exports

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 (adversarial code review)
**Date:** 2026-03-09
**Outcome:** APPROVED — All 4 ACs fully implemented, all tasks genuinely completed.

**Issues Found:** 0 High, 2 Medium, 2 Low — **all fixed**

| # | Severity | Issue | Fix |
|---|----------|-------|-----|
| M1 | Medium | Stale comment in ChatMessage.tsx:212 referencing "I-Chart" | Updated to "histogram and normality plot" |
| M2 | Medium | Stale JSDoc in HistogramChart.tsx:155-157 referencing "control limits" | Removed "control limits" from JSDoc |
| L1 | Low | Missing negative regression test for LCI/LCS removal | Added test: `does not render LCI/LCS control limit lines` |
| L2 | Low | Story completion notes said "7 interfaces" but listed 9 | Fixed count to "9 interfaces" |

## Change Log

- 2026-03-09: Story 9.3 — Removed IChart.tsx, MRChart.tsx and all related TypeScript types, cleaned up histogram control limit lines, updated chart orchestrator to 2-chart layout (Histogram + Normality Plot only)
- 2026-03-09: Code review — Fixed 2 stale comments (ChatMessage.tsx, HistogramChart.tsx), added negative regression test for LCI/LCS, fixed interface count in completion notes
