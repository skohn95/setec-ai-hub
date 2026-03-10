# Story 9.2: Update Capability Index Formulas with Explicit Sigma Differentiation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **capability indices calculated with the correct sigma for each metric**,
So that **Cp/Cpk (Within) and Pp/Ppk (Overall) are statistically accurate and comparable to Minitab**.

**FRs covered (PRD-v3):** FR-CP14

**Supersedes:** Story 7.4 capability index calculations (partial update)

## Acceptance Criteria

1. **Given** LEI and LES are provided and sigma_within and sigma_overall are calculated
   **When** capability indices are computed
   **Then** the system calculates:
   - Cp = (LES - LEI) / (6 x sigma_within)
   - Cpk = min[(LES - mean) / (3 x sigma_within), (mean - LEI) / (3 x sigma_within)]
   - Pp = (LES - LEI) / (6 x sigma_overall)
   - Ppk = min[(LES - mean) / (3 x sigma_overall), (mean - LEI) / (3 x sigma_overall)]
   **And** the formulas are explicitly documented in code comments

2. **Given** `calculate_capability_indices()` in `capability_indices.py` currently accepts `stability_result` parameter
   **When** the refactoring is applied
   **Then** the parameter is renamed to `sigma_result` accepting `{'sigma_within': float, 'sigma_overall': float, 'mr_bar': float}`
   **And** sigma values are used directly (no re-extraction from nested dict)
   **And** the `sigma_compat` shim in `capacidad_proceso_calculator.py` is removed
   **And** `sigma_result` is passed directly to `calculate_capability_indices()`

3. **Given** `capability_indices.py` has its own `calculate_sigma_within()` and `calculate_sigma_overall()` functions
   **When** the refactoring is applied
   **Then** these duplicated functions are removed from `capability_indices.py`
   **And** `sigma_estimation.py` remains the single source of truth for sigma calculation
   **And** `capability_indices.py` only contains index formulas (Cp, Cpk, Pp, Ppk) and PPM calculation

4. **Given** the results JSON is generated
   **When** capability indices are included
   **Then** the output clearly labels which sigma was used for each index pair
   **And** both sigma values are reported alongside the indices
   **And** classification still uses Cpk (>=1.33 Capaz, 1.00-1.33 Marginal, <1.00 No Capaz)

5. **Given** data is non-normal with a fitted alternative distribution
   **When** capability indices are calculated
   **Then** distribution-based PPM calculation uses the fitted distribution
   **And** the sigma differentiation still applies for Cp/Cpk vs Pp/Ppk

## Tasks / Subtasks

- [x] Task 1: Refactor `calculate_capability_indices()` signature in `api/utils/capability_indices.py` (AC: #2, #3)
  - [x] 1.1 Rename parameter `stability_result` to `sigma_result` with type `dict[str, Any]`
  - [x] 1.2 Replace sigma extraction logic (lines ~641-650) to use `sigma_result['sigma_within']` and `sigma_result['sigma_overall']` directly
  - [x] 1.3 Remove `calculate_sigma_within(mr_bar)` function (lines ~96-115) — duplicated by `sigma_estimation.py`
  - [x] 1.4 Remove `calculate_sigma_overall(values)` function (lines ~118-132) — duplicated by `sigma_estimation.py`
  - [x] 1.5 Update any internal calls or references to the removed functions
  - [x] 1.6 Add explicit code comments on formulas: "Cp/Cpk use sigma_within (short-term)" and "Pp/Ppk use sigma_overall (long-term)"
  - [x] 1.7 Keep `D2_CONSTANT` only in `sigma_estimation.py` (remove from `capability_indices.py` if duplicated)

- [x] Task 2: Remove sigma_compat shim in `api/utils/capacidad_proceso_calculator.py` (AC: #2)
  - [x] 2.1 Remove `sigma_compat` dict construction (lines ~725-728)
  - [x] 2.2 Pass `sigma_result` directly to `calculate_capability_indices()` instead of `sigma_compat`
  - [x] 2.3 Verify the call site passes `sigma_result` with correct keys: `sigma_within`, `sigma_overall`, `mr_bar`

- [x] Task 3: Update tests in `api/tests/test_capacidad_proceso_calculator.py` (AC: #2, #4)
  - [x] 3.1 Update any tests that mock or construct `stability_result`-shaped dicts to use `sigma_result` format
  - [x] 3.2 Verify capability output structure tests still pass
  - [x] 3.3 Add/update test asserting `sigma_within` and `sigma_overall` appear in capability output

- [x] Task 4: Update capability_indices tests if they exist (AC: #1, #2)
  - [x] 4.1 Check for `api/tests/test_capability_indices.py` — update if exists
  - [x] 4.2 Update test calls to `calculate_capability_indices()` to pass `sigma_result` format instead of `stability_result`
  - [x] 4.3 Add test verifying Cp/Cpk use sigma_within, Pp/Ppk use sigma_overall

- [x] Task 5: Verify end-to-end and regression (AC: #1, #4, #5)
  - [x] 5.1 Run all Python tests (`python -m pytest api/tests/`)
  - [x] 5.2 Verify capability index values are identical before/after refactoring (same sigma values in, same indices out)
  - [x] 5.3 Verify non-normal distribution PPM path still works

## Dev Notes

### CRITICAL: What This Story Does and Does NOT Cover

**IN SCOPE (Story 9.2 — Python backend refactoring only):**
- Refactor `calculate_capability_indices()` to accept `sigma_result` directly
- Remove `sigma_compat` compatibility shim from Story 9.1
- Remove duplicate sigma calculation functions from `capability_indices.py`
- Update all related Python tests
- Formulas themselves do NOT change (they are already correct)

**OUT OF SCOPE (handled in other stories):**
- Story 9.3: Remove IChart.tsx, MRChart.tsx frontend components, update TypeScript types
- Story 9.4: Update agent instructions and presentation text
- Frontend changes of any kind

### Architecture & Constraints

- **Runtime:** Vercel serverless Python 3.11 (250MB limit) — NO scipy, pure NumPy only
- **Pattern:** Follow existing calculator module patterns in `api/utils/`
- **Single source of truth:** `sigma_estimation.py` is THE module for sigma calculation. `capability_indices.py` should only contain index formulas.
- **Constants:** `D2_CONSTANT = 1.128` should live only in `sigma_estimation.py`

### Key Data Flow — BEFORE (Current, with shim from Story 9.1)

```
sigma_estimation.py:
  estimate_sigma(values) → {'sigma_within': float, 'sigma_overall': float, 'mr_bar': float}
                                        ↓
capacidad_proceso_calculator.py:
  sigma_compat = {                          ← SHIM (to be removed)
    'i_chart': {'mr_bar': sigma_result['mr_bar']},
    'sigma': sigma_result['sigma_within']
  }
  calculate_capability_indices(values, lei, les, sigma_compat, normality_result)
                                        ↓
capability_indices.py:
  mr_bar = stability_result.get('i_chart', {}).get('mr_bar', 0)  ← RE-EXTRACTION
  sigma_within = calculate_sigma_within(mr_bar)                   ← RECALCULATION
  sigma_overall = calculate_sigma_overall(values)                 ← RECALCULATION
```

### Key Data Flow — AFTER (Target, clean interface)

```
sigma_estimation.py:
  estimate_sigma(values) → {'sigma_within': float, 'sigma_overall': float, 'mr_bar': float}
                                        ↓
capacidad_proceso_calculator.py:
  calculate_capability_indices(values, lei, les, sigma_result, normality_result)
                                        ↓  (passed directly, no shim)
capability_indices.py:
  sigma_within = sigma_result['sigma_within']   ← DIRECT USE
  sigma_overall = sigma_result['sigma_overall'] ← DIRECT USE
```

### Key File Locations

| File | Action | Purpose |
|------|--------|---------|
| `api/utils/capability_indices.py` | **MODIFY** | Refactor `calculate_capability_indices()` signature, remove duplicate sigma functions |
| `api/utils/capacidad_proceso_calculator.py` | **MODIFY** | Remove `sigma_compat` shim (~4 lines), pass `sigma_result` directly |
| `api/tests/test_capacidad_proceso_calculator.py` | **MODIFY** | Update tests for new sigma_result format |
| `api/tests/test_capability_indices.py` | **MODIFY (if exists)** | Update tests for new parameter name and format |

### Current `calculate_capability_indices()` Signature (BEFORE)

```python
def calculate_capability_indices(
    values: np.ndarray,
    lei: float,
    les: float,
    stability_result: dict[str, Any],    # ← OLD: expects {'i_chart': {'mr_bar': ...}}
    normality_result: dict[str, Any] | None = None
) -> dict[str, Any]:
```

### Target `calculate_capability_indices()` Signature (AFTER)

```python
def calculate_capability_indices(
    values: np.ndarray,
    lei: float,
    les: float,
    sigma_result: dict[str, Any],        # ← NEW: expects {'sigma_within': float, 'sigma_overall': float, 'mr_bar': float}
    normality_result: dict[str, Any] | None = None
) -> dict[str, Any]:
```

### Current Sigma Extraction Logic to Replace (capability_indices.py ~lines 641-650)

```python
# CURRENT (remove this):
mr_bar = stability_result.get('i_chart', {}).get('mr_bar', 0)
sigma_within = calculate_sigma_within(mr_bar)
if sigma_within == 0 and 'sigma' in stability_result:
    sigma_within = stability_result['sigma']
sigma_overall = calculate_sigma_overall(values)

# TARGET (replace with):
sigma_within = sigma_result.get('sigma_within', 0.0)
sigma_overall = sigma_result.get('sigma_overall', 0.0)
```

### Functions to Remove from `capability_indices.py`

1. `calculate_sigma_within(mr_bar: float) -> float` (~lines 96-115) — replaced by `sigma_estimation.calculate_sigma_within(values)`
2. `calculate_sigma_overall(values: np.ndarray) -> float` (~lines 118-132) — replaced by `sigma_estimation.calculate_sigma_overall(values)`

**Note:** These functions have different signatures from their `sigma_estimation.py` counterparts:
- `capability_indices.calculate_sigma_within(mr_bar)` takes only mr_bar
- `sigma_estimation.calculate_sigma_within(values)` takes the full values array and returns (sigma_within, mr_bar) tuple

This is fine — after this refactoring, `capability_indices.py` won't need to calculate sigma at all. It receives pre-calculated values.

### Existing Index Formulas — DO NOT CHANGE

The individual formula functions are already correct and should NOT be modified:
- `calculate_cp(lei, les, sigma)` — uses sigma_within (line ~158)
- `calculate_cpk(mean, lei, les, sigma)` — uses sigma_within (lines ~194-196)
- `calculate_pp(lei, les, sigma_overall)` — uses sigma_overall (line ~225)
- `calculate_ppk(mean, lei, les, sigma_overall)` — uses sigma_overall (lines ~261-262)

### Testing Strategy

- **Unit tests:** Verify `calculate_capability_indices()` accepts new `sigma_result` format and produces identical outputs
- **Regression:** Run the same test data through before/after and compare Cp, Cpk, Pp, Ppk values — they MUST be identical
- **Integration:** Verify end-to-end flow through `analyze.py` → `build_capacidad_proceso_output()` → `calculate_capability_indices()` still produces valid results
- **Negative:** Verify graceful handling of missing/zero sigma values

### Previous Story Intelligence (Story 9.1)

**Key completion notes from Story 9.1:**
- Created `sigma_estimation.py` (125 lines) replacing `stability_analysis.py` (746 lines)
- **Used compatibility shim (`sigma_compat` dict) to bridge sigma output to `calculate_capability_indices()` which still expects `stability_result` structure — THIS IS WHAT STORY 9.2 REMOVES**
- Removed I-Chart, MR-Chart from `_build_chart_data()` — charts now: histogram + normality_plot only
- All 187 related tests passing; 4 pre-existing MSA test failures unrelated

**Files modified in 9.1 that 9.2 touches again:**
- `api/utils/capacidad_proceso_calculator.py` — Remove shim added in 9.1
- `api/tests/test_capacidad_proceso_calculator.py` — Update sigma-related tests

### Git Intelligence — Recent Commits

```
fe47c80 feat: Redesign privacy page with transparency section
ef569dd feat: Update BMAD framework and app prompts
2d66109 feat: Rename analysis from 'Capacidad de Proceso' to 'Control Estadistico de Proceso'
c49e27a fix: Remove duplicate SpecLimits export from analysis.ts
30b86c4 feat: Complete Epic 7 & 8 - Process Capability Analysis
```

- Commit `2d66109` renamed the analysis — internal code still uses `capacidad_proceso` as the analysis type key, which is correct
- Story 9.1 changes are uncommitted (in working tree) — this story builds on top of them

### Project Structure Notes

- Python API at `api/` with `utils/` subdirectory for calculator modules
- Tests at `api/tests/` following `test_<module>.py` naming
- This story only touches `api/` Python files — NO frontend changes
- Naming convention: snake_case for Python files and functions

### References

- [Source: _bmad-output/planning-artifacts/prd-v3.md — FR-CP14 Sigma Differentiation]
- [Source: _bmad-output/planning-artifacts/epics.md — Epic 9, Story 9.2]
- [Source: _bmad-output/planning-artifacts/architecture.md — Python Serverless Constraints, Pure Python Stats]
- [Source: _bmad-output/implementation-artifacts/9-1-create-sigma-estimation-module-remove-stability.md — Completion notes re: sigma_compat shim]
- [Source: api/utils/capability_indices.py — calculate_capability_indices() signature, sigma extraction lines ~641-650]
- [Source: api/utils/capacidad_proceso_calculator.py — sigma_compat shim lines ~725-728]
- [Source: api/utils/sigma_estimation.py — estimate_sigma() return structure]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered. Clean refactoring with zero regressions.

### Completion Notes List

- Renamed `stability_result` parameter to `sigma_result` in `calculate_capability_indices()` — now accepts `{'sigma_within': float, 'sigma_overall': float, 'mr_bar': float}` directly from `sigma_estimation.estimate_sigma()`
- Removed `D2_CONSTANT` from `capability_indices.py` — now only in `sigma_estimation.py` (single source of truth)
- Removed duplicate `calculate_sigma_within(mr_bar)` and `calculate_sigma_overall(values)` from `capability_indices.py` — `sigma_estimation.py` is the sole sigma calculator
- Replaced 5-line sigma re-extraction logic (nested dict access + recalculation) with 2-line direct access: `sigma_result.get('sigma_within', 0.0)` and `sigma_result.get('sigma_overall', 0.0)`
- Removed 4-line `sigma_compat` shim from `capacidad_proceso_calculator.py` — `sigma_result` now passed directly to `calculate_capability_indices()`
- Added explicit code comments: "Cp/Cpk use sigma_within (short-term, MR̄/d2 method)" and "Pp/Ppk use sigma_overall (long-term, sample std dev)"
- Updated `test_capability_indices.py`: removed tests for deleted functions (D2_CONSTANT import, calculate_sigma_within, calculate_sigma_overall), added tests verifying Cp uses sigma_within and Pp uses sigma_overall, updated all test dicts from stability_result to sigma_result format, added test for zero sigma graceful handling
- `test_capacidad_proceso_calculator.py` required no changes — integration tests already used `estimate_sigma()` and validated via `build_capacidad_proceso_output()`
- Full regression suite: 463 passed, 4 failed (pre-existing MSA test failures, unrelated to this story)
- Net code reduction: ~40 lines removed from capability_indices.py, ~4 lines removed from capacidad_proceso_calculator.py

### File List

- `api/utils/capability_indices.py` — MODIFIED: Renamed param, removed D2_CONSTANT, removed duplicate sigma functions, added code comments
- `api/utils/capacidad_proceso_calculator.py` — MODIFIED: Removed sigma_compat shim, pass sigma_result directly
- `api/tests/test_capability_indices.py` — MODIFIED: Updated all tests from stability_result to sigma_result format, removed tests for deleted functions, added sigma differentiation tests

## Change Log

- 2026-03-09: Story 9.2 — Refactored capability index calculation to accept sigma_result directly, removed compatibility shim and duplicate sigma functions, establishing clean interface between sigma_estimation and capability_indices modules
