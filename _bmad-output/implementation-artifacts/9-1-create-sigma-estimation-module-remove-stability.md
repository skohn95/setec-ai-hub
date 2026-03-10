# Story 9.1: Create Sigma Estimation Module & Remove Stability Analysis

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **the system to use properly differentiated sigma estimates for capability indices**,
So that **Cp/Cpk reflect short-term Within variation and Pp/Ppk reflect long-term Overall variation**.

**FRs covered (PRD-v3):** FR-CP14

**Supersedes:** Story 7.3 (Stability Analysis with I-MR Control Charts) — entirely removed

## Acceptance Criteria

1. **Given** a new module `sigma_estimation.py` is created
   **When** the module is implemented
   **Then** it calculates sigma_within = MR-bar / d2 (where d2 = 1.128 for n=2 moving ranges)
   **And** it calculates sigma_overall = sample standard deviation of the data
   **And** both values are returned in the analysis results
   **And** sigma_within is used exclusively for Cp and Cpk calculations
   **And** sigma_overall is used exclusively for Pp and Ppk calculations

2. **Given** stability analysis code exists from Story 7.3
   **When** the v3 scope refinement is applied
   **Then** all stability analysis functions are removed (I-MR chart calculations, 7 instability rules)
   **And** the `stability_analysis.py` module is deleted and replaced by `sigma_estimation.py`
   **And** `capacidad_proceso_calculator.py` is updated to import from `sigma_estimation.py` instead
   **And** no stability-related calculations remain in the Python codebase

3. **Given** the analysis runs with the new sigma module
   **When** results are returned
   **Then** the results JSON includes both `sigma_within` and `sigma_overall` values
   **And** no control limits (LCI, LCS), instability rules, or stability conclusions are present in results

## Tasks / Subtasks

- [x] Task 1: Create `api/utils/sigma_estimation.py` (AC: #1)
  - [x]1.1 Create module with `calculate_moving_ranges(values)` function (extract from stability_analysis.py)
  - [x]1.2 Create `calculate_sigma_within(values)` — computes MR-bar then sigma_within = MR-bar / 1.128
  - [x]1.3 Create `calculate_sigma_overall(values)` — sample std dev with ddof=1
  - [x]1.4 Create `estimate_sigma(values)` wrapper returning both sigmas as dict
  - [x]1.5 Add unit tests `api/tests/test_sigma_estimation.py`

- [x] Task 2: Update `api/utils/capacidad_proceso_calculator.py` (AC: #2, #3)
  - [x]2.1 Replace `from .stability_analysis import perform_stability_analysis` with `from .sigma_estimation import estimate_sigma`
  - [x]2.2 Replace `stability_result = perform_stability_analysis(values)` with `sigma_result = estimate_sigma(values)`
  - [x]2.3 Update `build_capacidad_proceso_output()` signature — remove `stability_result` parameter, add `sigma_result`
  - [x]2.4 Remove `generate_stability_instructions()` function entirely (lines ~399-485)
  - [x]2.5 Remove `_build_mr_chart_data()` function (lines ~515-548)
  - [x]2.6 Remove `_extract_rules_violations()` function (lines ~741-767)
  - [x]2.7 Remove I-Chart and MR-Chart data from `_build_chart_data()` (lines ~816-833)
  - [x]2.8 Ensure sigma_within and sigma_overall are passed to `calculate_capability_indices()` correctly
  - [x]2.9 Include `sigma_within` and `sigma_overall` in the output JSON results

- [x] Task 3: Delete `api/utils/stability_analysis.py` (AC: #2)
  - [x]3.1 Delete `api/utils/stability_analysis.py` (746 lines)
  - [x]3.2 Delete `api/tests/test_stability_analysis.py`
  - [x]3.3 Verify no remaining imports of stability_analysis anywhere

- [x] Task 4: Update `api/analyze.py` (AC: #2)
  - [x]4.1 Remove `from .utils.stability_analysis import perform_stability_analysis` (line 67 area)
  - [x]4.2 Remove `stability_result = perform_stability_analysis(values)` (line 244 area)
  - [x]4.3 Update `build_capacidad_proceso_output()` call — remove `stability_result` arg
  - [x]4.4 Add import of `estimate_sigma` from sigma_estimation if needed at this level

- [x] Task 5: Update existing tests (AC: #3)
  - [x]5.1 Update `api/tests/test_capacidad_proceso_calculator.py` — remove stability references
  - [x]5.2 Update `api/tests/test_analyze.py` — remove stability_result from test data
  - [x]5.3 Run all tests and verify passing

## Dev Notes

### CRITICAL: What This Story Does and Does NOT Cover

**IN SCOPE (Story 9.1 — Python backend only):**
- Create new `sigma_estimation.py` module
- Remove stability_analysis.py and all stability code from Python
- Update calculator and analyze.py to use new sigma module
- Update Python tests

**OUT OF SCOPE (handled in later stories):**
- Story 9.2: Update capability index formulas (the formulas in `capability_indices.py` already use sigma_within/sigma_overall correctly — just verify)
- Story 9.3: Remove IChart.tsx, MRChart.tsx frontend components, update TypeScript types
- Story 9.4: Update agent instructions and presentation text

### Architecture & Constraints

- **Runtime:** Vercel serverless Python (250MB limit) — NO scipy allowed, pure NumPy only
- **Pattern:** Follow existing calculator module patterns (normality_tests.py, capability_indices.py)
- **Constants:** d2 = 1.128 (for n=2 moving ranges) — this constant already exists in `stability_analysis.py` and `capability_indices.py`

### Key File Locations

| File | Action | Purpose |
|------|--------|---------|
| `api/utils/sigma_estimation.py` | **CREATE** | New lightweight sigma estimation module |
| `api/utils/stability_analysis.py` | **DELETE** | 746-line module being fully removed |
| `api/utils/capacidad_proceso_calculator.py` | **UPDATE** | Remove stability imports/calls, wire sigma_estimation |
| `api/analyze.py` | **UPDATE** | Remove stability_result from flow |
| `api/tests/test_sigma_estimation.py` | **CREATE** | Tests for new module |
| `api/tests/test_stability_analysis.py` | **DELETE** | Tests for removed module |
| `api/tests/test_capacidad_proceso_calculator.py` | **UPDATE** | Remove stability references |
| `api/tests/test_analyze.py` | **UPDATE** | Remove stability_result |

### Current Code Flow (BEFORE — to understand what changes)

```
analyze.py (capacidad_proceso branch):
  1. validated_data = validate_file(...)
  2. basic_stats = calculate_basic_statistics(values)
  3. normality_result = perform_normality_analysis(values, lei, les)
  4. stability_result = perform_stability_analysis(values)  ← REMOVE
  5. analysis_output = build_capacidad_proceso_output(
       validated_data, basic_stats, normality_result, stability_result, spec_limits
     )
```

### Target Code Flow (AFTER)

```
analyze.py (capacidad_proceso branch):
  1. validated_data = validate_file(...)
  2. basic_stats = calculate_basic_statistics(values)
  3. normality_result = perform_normality_analysis(values, lei, les)
  4. sigma_result = estimate_sigma(values)  ← NEW
  5. analysis_output = build_capacidad_proceso_output(
       validated_data, basic_stats, normality_result, sigma_result, spec_limits
     )
```

### sigma_estimation.py Module Design

```python
"""
Sigma Estimation Module for Process Capability Analysis.
Calculates Within (short-term) and Overall (long-term) sigma estimates.
"""
import numpy as np
from typing import Any

D2_CONSTANT = 1.128  # d2 for n=2 (moving range of consecutive observations)

def calculate_moving_ranges(values: np.ndarray) -> np.ndarray:
    """Calculate moving ranges: MR[i] = |X[i] - X[i-1]|"""
    return np.abs(np.diff(values))

def calculate_sigma_within(values: np.ndarray) -> tuple[float, float]:
    """
    Calculate within-subgroup sigma using MR-bar method.
    Returns: (sigma_within, mr_bar)
    """
    mr = calculate_moving_ranges(values)
    mr_bar = float(np.mean(mr))
    sigma_within = mr_bar / D2_CONSTANT if mr_bar > 0 else 0.0
    return sigma_within, mr_bar

def calculate_sigma_overall(values: np.ndarray) -> float:
    """Calculate overall sigma as sample standard deviation (ddof=1)."""
    if len(values) < 2:
        return 0.0
    return float(np.std(values, ddof=1))

def estimate_sigma(values: np.ndarray) -> dict[str, Any]:
    """
    Main entry point: estimate both sigma types.
    Returns dict with sigma_within, sigma_overall, mr_bar.
    """
    sigma_within, mr_bar = calculate_sigma_within(values)
    sigma_overall = calculate_sigma_overall(values)
    return {
        'sigma_within': sigma_within,
        'sigma_overall': sigma_overall,
        'mr_bar': mr_bar,
    }
```

### Existing capability_indices.py — Already Has Correct Sigma Logic

The `capability_indices.py` module already has `calculate_sigma_within()` and `calculate_sigma_overall()` functions. However, the new `sigma_estimation.py` should be the single source of truth for sigma calculation. Check whether `capability_indices.py` delegates to it or duplicates the logic — prefer delegation if practical. The capability formulas themselves (Cp, Cpk, Pp, Ppk) should NOT change in this story.

### Testing Strategy

- **Unit tests for sigma_estimation.py:** Test moving ranges, sigma_within, sigma_overall with known data
- **Integration tests:** Verify end-to-end analyze.py flow still returns valid results without stability data
- **Regression:** Ensure capability indices (Cp, Cpk, Pp, Ppk) produce same values as before (the sigma values feeding them should be identical)

### Git Intelligence — Recent Commits

```
fe47c80 feat: Redesign privacy page with transparency section
ef569dd feat: Update BMAD framework and app prompts
2d66109 feat: Rename analysis from 'Capacidad de Proceso' to 'Control Estadístico de Proceso'
c49e27a fix: Remove duplicate SpecLimits export from analysis.ts
30b86c4 feat: Complete Epic 7 & 8 - Process Capability Analysis
```

Note: Commit `2d66109` renamed the analysis — verify all references use "Control Estadístico de Proceso" not "Capacidad de Proceso" in user-facing strings. Internal code still uses `capacidad_proceso` as the analysis type key.

### Previous Story Learnings (Story 8.4)

- Tool calling patterns for capacidad_proceso already work
- SpecLimitsForm integration is complete
- Chart rendering in ChatMessage uses `CapacidadProcesoCharts` component
- Agent prompts currently mention "4 charts" including I-Chart, MR-Chart — will be updated in Story 9.4

### Project Structure Notes

- Python API at `api/` with `utils/` subdirectory for calculator modules
- Tests at `api/tests/` following `test_<module>.py` naming
- Frontend at `components/`, types at `types/`
- This story only touches `api/` files — frontend changes are Story 9.3

### References

- [Source: _bmad-output/planning-artifacts/prd-v3.md — FR-CP14 Sigma Differentiation]
- [Source: _bmad-output/planning-artifacts/epics.md — Epic 9, Story 9.1]
- [Source: _bmad-output/planning-artifacts/architecture.md — Python Analysis Architecture]
- [Source: api/utils/stability_analysis.py — Module to be removed]
- [Source: api/utils/capacidad_proceso_calculator.py — Main calculator, lines 14, 244, 399-485, 515-548, 741-767, 816-833]
- [Source: api/utils/capability_indices.py — Sigma functions already exist here]
- [Source: api/analyze.py — Entry point, lines 67, 244, 248]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

N/A

### Completion Notes List

- Created lightweight sigma_estimation.py (123 lines) replacing stability_analysis.py (746 lines)
- Used compatibility shim (`sigma_compat` dict) in `build_capacidad_proceso_output()` to bridge sigma output to `calculate_capability_indices()` which still expects `stability_result` structure (deferred to Story 9.2)
- Removed I-Chart, MR-Chart generation from `_build_chart_data()` — charts now: histogram + normality_plot only
- All 187 related tests passing; 4 pre-existing MSA test failures unrelated to this story

### File List

| File | Action | Lines Changed |
|------|--------|---------------|
| `api/utils/sigma_estimation.py` | CREATED | 125 lines |
| `api/tests/test_sigma_estimation.py` | CREATED | 208 lines |
| `api/utils/stability_analysis.py` | DELETED | -746 lines |
| `api/tests/test_stability_analysis.py` | DELETED | -600+ lines |
| `api/utils/capacidad_proceso_calculator.py` | MODIFIED | Removed stability imports, functions, chart builders |
| `api/analyze.py` | MODIFIED | Replaced stability import/call with sigma_estimation |
| `api/tests/test_capacidad_proceso_calculator.py` | MODIFIED | Removed MR-Chart, I-Chart, stability test classes |
| `api/tests/test_analyze.py` | MODIFIED | Replaced stability integration tests with sigma tests |
