# Story 10.4: Results Assembly, Chart Data & Instructions Generation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the analysis to produce complete structured output with chart data and interpretation instructions,
so that the agent can present my results clearly and the frontend can render charts.

## Acceptance Criteria

### AC 1: Complete Results Assembly
- **Given** the full analysis pipeline has completed (descriptive + normality + Levene + t-test)
- **When** results assembly runs
- **Then** it produces a JSON object with `results`, `chartData`, and `instructions`
- **And** the structure matches the `Hipotesis2MChartData` interface from PRD-v4

### AC 2: Results Object Completeness
- **Given** the results object
- **When** it is serialized
- **Then** it includes all sections: `descriptive_a`, `descriptive_b`, `normality_a`, `normality_b`, `sample_size`, `variance_test`, `means_test`, `warnings`

### AC 3: Histogram Chart Data
- **Given** chart data is generated
- **When** histogram data is built for each sample
- **Then** each histogram includes: bins (start, end, count), mean, sampleName, outliers array

### AC 4: Boxplot Variance Chart Data
- **Given** chart data is generated
- **When** boxplot_variance data is built
- **Then** it includes two sample objects with: min, q1, median, q3, max, outliers, mean
- **And** includes leveneTestPValue and leveneConclusion

### AC 5: Boxplot Means Chart Data
- **Given** chart data is generated
- **When** boxplot_means data is built
- **Then** it includes the same boxplot data plus ciLower and ciUpper per sample
- **And** includes tTestPValue and tTestConclusion

### AC 6: Instructions Markdown — 5 Parts
- **Given** the instructions are generated
- **When** markdown is constructed
- **Then** it has 5 parts: Descriptivos, Normalidad, Varianzas, Medias, Conclusión Terrenal
- **And** all text is in Spanish

### AC 7: Caveats in Instructions
- **Given** the analysis encountered caveats (n < 30, Box-Cox failed, normality not achieved)
- **When** instructions are generated
- **Then** each applicable caveat appears in both the technical sections and the Conclusión Terrenal
- **And** the terrenal section says: "Los resultados deben interpretarse con precaución..."

### AC 8: Performance
- **Given** a file with up to 1000 rows per sample
- **When** the complete analysis runs
- **Then** it completes in less than 30 seconds

### AC 9: No Raw Data Leakage
- **Given** the raw data arrays
- **When** results are assembled
- **Then** the raw data values are NOT included in the instructions or results object
- **And** only aggregated statistics and chart data points are returned

**FRs covered:** FR-H28, FR-H30
**NFRs covered:** NFR-H4, NFR-H5, NFR-H6

## Tasks / Subtasks

- [x] Task 1: Implement histogram binning function (AC: 3)
  - [x] 1.1 Implement `_build_histogram_bins(sample: np.ndarray, sample_name: str, outliers: dict) -> dict` in `hipotesis_2_muestras_calculator.py`
  - [x] 1.2 Use Sturges' formula for bin count: `k = ceil(1 + log2(n))`
  - [x] 1.3 Return dict matching PRD type: `{ type: 'histogram_a'|'histogram_b', data: { bins: [{start, end, count}], mean, sampleName, outliers } }`

- [x] Task 2: Implement boxplot statistics function (AC: 4, 5)
  - [x] 2.1 Implement `_build_boxplot_stats(sample: np.ndarray, sample_name: str, outliers: dict) -> dict` returning `{ name, min, q1, median, q3, max, outliers, mean }`
  - [x] 2.2 Use existing outlier data from descriptive statistics (already computed by Story 10.2)
  - [x] 2.3 Whiskers: min/max of non-outlier values (standard boxplot convention)

- [x] Task 3: Implement individual sample CI computation (AC: 5)
  - [x] 3.1 Implement `_calculate_sample_ci(sample: np.ndarray, confidence_level: float) -> tuple[float, float]`
  - [x] 3.2 Formula: mean ± t_critical(α/2, n-1) × (std_dev / sqrt(n)) — reuse existing `_t_critical()` function
  - [x] 3.3 Return (ci_lower, ci_upper) per sample for boxplot_means chart

- [x] Task 4: Implement chart data builder (AC: 1, 3, 4, 5)
  - [x] 4.1 Implement `_build_chart_data(full_results: dict, confidence_level: float) -> list[dict]`
  - [x] 4.2 Build 4 charts: histogram_a, histogram_b, boxplot_variance, boxplot_means
  - [x] 4.3 histogram charts use `data_for_tests.sample_a`/`sample_b` (which are Box-Cox transformed if applicable)
  - [x] 4.4 boxplot_variance includes `leveneTestPValue` and `leveneConclusion` from `variance_test`
  - [x] 4.5 boxplot_means includes `tTestPValue` and `tTestConclusion` from `means_test`, plus per-sample CI

- [x] Task 5: Implement instructions generator (AC: 6, 7, 9)
  - [x] 5.1 Implement `_generate_instructions(full_results: dict) -> str`
  - [x] 5.2 Part 1: Descriptivos — table with n, media, mediana, std dev, skewness per sample + outliers
  - [x] 5.3 Part 2: Normalidad — AD results per sample, robustness evaluation, Box-Cox if applied
  - [x] 5.4 Part 3: Varianzas — Levene method, H₀/H₁, F-statistic, p-value, conclusion, α
  - [x] 5.5 Part 4: Medias — t-test method (pooled/Welch + why), H₀/H₁, t-statistic, df, p-value, CI, conclusion, α
  - [x] 5.6 Part 5: Conclusión Terrenal — plain language explanation of all results with practical implications
  - [x] 5.7 Include all applicable caveats in both technical and terrenal sections
  - [x] 5.8 Wrap agent-only header in `<!-- AGENT_ONLY -->` comments (same pattern as MSA)
  - [x] 5.9 All text in Spanish

- [x] Task 6: Implement output builder function (AC: 1, 2)
  - [x] 6.1 Implement `build_hipotesis_2_muestras_output(full_results: dict, all_warnings: list[str], confidence_level: float) -> dict`
  - [x] 6.2 Orchestrate: build results dict (strip numpy) → build chart data → generate instructions
  - [x] 6.3 Return `{ 'results': dict, 'chartData': list, 'instructions': str }`

- [x] Task 7: Update analyze.py routing (AC: 1, 2)
  - [x] 7.1 Import `build_hipotesis_2_muestras_output` from calculator module
  - [x] 7.2 Replace the current manual results dict construction + `chartData: []` / `instructions: ''` with a single call to `build_hipotesis_2_muestras_output(full_results, all_warnings, confidence_level)`
  - [x] 7.3 Set `analysis_output` to the builder's return value directly

- [x] Task 8: Write unit tests (AC: 1-9)
  - [x] 8.1 Test histogram binning: known dataset → verify bin count (Sturges), bin edges, counts sum to n
  - [x] 8.2 Test boxplot stats: known dataset → verify min, q1, median, q3, max, outliers match numpy
  - [x] 8.3 Test sample CI: known dataset with known t-critical → verify CI bounds
  - [x] 8.4 Test chart data builder: verify 4 charts produced with correct types and structure
  - [x] 8.5 Test histogram data uses data_for_tests arrays (possibly transformed)
  - [x] 8.6 Test boxplot_variance includes leveneTestPValue and leveneConclusion
  - [x] 8.7 Test boxplot_means includes tTestPValue, tTestConclusion, per-sample CI
  - [x] 8.8 Test instructions: verify 5 markdown sections present, all Spanish text
  - [x] 8.9 Test caveats appear in both technical and terrenal sections when applicable
  - [x] 8.10 Test no raw data in results or instructions (no numpy arrays, no full data lists)
  - [x] 8.11 Test full output builder: verify complete structure matches expected format
  - [x] 8.12 Test edge case: identical samples → valid output with meaningful terrenal
  - [x] 8.13 Test edge case: very small samples (n=2) → valid histogram, boxplot, instructions

- [x] Task 9: Verify build and existing tests (all ACs)
  - [x] 9.1 Run `python3 -m pytest api/tests/test_hipotesis_2_muestras_calculator.py -v` — all 99 tests pass
  - [x] 9.2 Run `python3 -m pytest api/tests/ -v` — 595 passed, 4 pre-existing failures (no regressions)
  - [x] 9.3 Run `npx tsc --noEmit` — zero new TypeScript errors (pre-existing test file errors only)
  - [x] 9.4 Run `npm run build` — successful build

## Dev Notes

### Developer Context

This is **Story 10.4 in Epic 10** (2-Sample Hypothesis Testing — the FINAL story). Stories 10.1 (template + validator + routing), 10.2 (descriptive stats + normality), and 10.3 (Levene + t-test) are all done. This story **completes the Epic** by:
1. Building chart data (4 charts) for frontend visualization
2. Generating markdown instructions (5 parts) for agent presentation
3. Packaging everything into the standard output format

**After this story**, the hipotesis_2_muestras analysis pipeline is complete on the backend. Epic 11 handles frontend TypeScript types, chart components, and agent integration.

**Critical: This story ONLY adds output assembly to the existing calculator module.** All statistical computations are done (Stories 10.2-10.3). This story consumes their results and transforms them into chart data and instructions.

**Cross-story data flow:**
- Story 10.2: `perform_descriptive_normality_analysis()` → descriptive stats, normality, box_cox, data_for_tests
- Story 10.3: `perform_hypothesis_tests()` → extends with variance_test, means_test
- **Story 10.4 (this):** `build_hipotesis_2_muestras_output()` → takes full_results and produces `{ results, chartData, instructions }`

**Module growth pattern — after this story the calculator module will contain:**
- Story 10.2: `perform_descriptive_normality_analysis()` (existing)
- Story 10.3: `perform_levene_test()` + `perform_t_test()` + `perform_hypothesis_tests()` (existing)
- **Story 10.4: `build_hipotesis_2_muestras_output()` + helpers (this story)**

### Technical Requirements

**No scipy allowed.** Vercel 250MB deployment limit. All distribution functions are pure Python. The t-distribution functions (`t_distribution_sf`, `_t_critical`) already exist in the calculator module — reuse them for individual sample CI.

**Python runtime:** Python 3.11 on Vercel serverless. All Python code lives in `api/` (NOT `app/api/`).

**All user-facing text in Spanish.** Instructions, conclusions, chart labels — everything.

**No raw data in output.** The `data_for_tests` numpy arrays must NOT appear in the serialized response. The existing code already strips them. chartData should contain aggregated bins/statistics only, never raw arrays.

**Histogram binning (Sturges' formula):**
```python
import math
k = math.ceil(1 + math.log2(n))  # Number of bins
bin_width = (max_val - min_val) / k
bins = [{'start': edge_i, 'end': edge_i+1, 'count': count_in_bin}]
```
Note: np.histogram provides this natively — use `np.histogram(sample, bins=k)` to get counts and edges, then convert to the PRD format.

**Boxplot statistics:**
```python
{
    'name': str,           # Sample name (e.g., "Muestra A")
    'min': float,          # np.min(sample) (or min of non-outlier values)
    'q1': float,           # np.percentile(sample, 25)
    'median': float,       # np.median(sample)
    'q3': float,           # np.percentile(sample, 75)
    'max': float,          # np.max(sample) (or max of non-outlier values)
    'outliers': list[float],  # From descriptive stats outlier_values
    'mean': float,         # np.mean(sample)
}
```
IMPORTANT for boxplot whiskers: `min` and `max` should be the min/max of **non-outlier** values (standard boxplot convention). Outliers are listed separately. Use the lower/upper fences from the existing IQR analysis to determine: `min = max(actual_min, lower_fence)` only if outliers exist below, otherwise `actual_min`. Simpler: filter out outlier values and take min/max of remaining.

**Individual sample CI (for boxplot_means chart):**
```python
from api.utils.hipotesis_2_muestras_calculator import _t_critical

alpha = 1.0 - confidence_level
t_crit = _t_critical(alpha / 2.0, n - 1)
se = std_dev / math.sqrt(n)
ci_lower = mean - t_crit * se
ci_upper = mean + t_crit * se
```
This is the CI for each individual sample mean, NOT the CI for the difference (which the t-test already computes).

### Architecture Compliance

**Chart data structure must match PRD-v4 `Hipotesis2MChartData` interface:**

```python
chart_data = [
    {
        'type': 'histogram_a',
        'data': {
            'bins': [{'start': float, 'end': float, 'count': int}, ...],
            'mean': float,
            'sampleName': str,  # "Muestra A" or custom column name
            'outliers': [float, ...]  # Outlier values (may be empty)
        }
    },
    {
        'type': 'histogram_b',
        'data': {
            'bins': [{'start': float, 'end': float, 'count': int}, ...],
            'mean': float,
            'sampleName': str,
            'outliers': [float, ...]
        }
    },
    {
        'type': 'boxplot_variance',
        'data': {
            'samples': [
                {
                    'name': str, 'min': float, 'q1': float, 'median': float,
                    'q3': float, 'max': float, 'outliers': [float], 'mean': float
                },
                {  # Same structure for sample B
                    'name': str, 'min': float, 'q1': float, 'median': float,
                    'q3': float, 'max': float, 'outliers': [float], 'mean': float
                }
            ],
            'leveneTestPValue': float,
            'leveneConclusion': str  # Spanish
        }
    },
    {
        'type': 'boxplot_means',
        'data': {
            'samples': [
                {
                    'name': str, 'min': float, 'q1': float, 'median': float,
                    'q3': float, 'max': float, 'outliers': [float], 'mean': float,
                    'ciLower': float,  # Individual sample CI
                    'ciUpper': float
                },
                {  # Same structure for sample B
                    'name': str, 'min': float, 'q1': float, 'median': float,
                    'q3': float, 'max': float, 'outliers': [float], 'mean': float,
                    'ciLower': float,
                    'ciUpper': float
                }
            ],
            'tTestPValue': float,
            'tTestConclusion': str  # Spanish
        }
    }
]
```

**Instructions markdown structure (5 parts, all Spanish):**

```markdown
<!-- AGENT_ONLY -->
El análisis de hipótesis de 2 muestras ha sido completado. Presenta los siguientes resultados al usuario.
Usa los datos a continuación para responder preguntas de seguimiento.
<!-- /AGENT_ONLY -->

# PARTE 1: ESTADÍSTICOS DESCRIPTIVOS

| Estadístico | {sample_a_name} | {sample_b_name} |
|---|---|---|
| n | ... | ... |
| Media | ... | ... |
| Mediana | ... | ... |
| Desv. Estándar | ... | ... |
| Asimetría | ... | ... |
| Outliers | ... | ... |

{sample_size_notes}
{outlier_details}

# PARTE 2: NORMALIDAD

## {sample_a_name}
- Test: Anderson-Darling
- Estadístico A²: ...
- p-value: ...
- Resultado: Normal / No Normal
{robustness_if_applicable}

## {sample_b_name}
(same structure)

{box_cox_section_if_applicable}

# PARTE 3: TEST DE VARIANZAS

- **Método:** Levene (mediana)
- **H₀:** σ²A = σ²B (varianzas iguales)
- **H₁:** σ²A ≠ σ²B (varianzas diferentes)
- **Estadístico F:** ...
- **p-value:** ...
- **α:** ...
- **Conclusión:** {variance_conclusion}

# PARTE 4: TEST DE MEDIAS

- **Método:** {t_test_method} (porque {reason})
- **H₀:** μA - μB = 0
- **H₁:** {alternative_hypothesis_formatted}
- **Estadístico t:** ...
- **Grados de libertad:** ...
- **p-value:** ...
- **IC {confidence}% para la diferencia:** ({ci_lower}, {ci_upper})
- **α:** ...
- **Conclusión:** {means_conclusion}

# PARTE 5: CONCLUSIÓN TERRENAL

{plain_language_interpretation}
{caveats_if_any}
```

### Library & Framework Requirements

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| Numeric arrays | numpy | Already in requirements.txt | Histogram binning, percentiles |
| T-distribution | hipotesis_2_muestras_calculator.py | Internal | REUSE `_t_critical()` for sample CI |
| Math | math (stdlib) | Python 3.11 | `ceil`, `log2`, `sqrt` |

**DO NOT add any new dependencies.** Everything needed is already available.

**DO NOT import scipy** for any reason.

### File Structure Requirements

**Files to MODIFY (add new functions):**
```
api/utils/hipotesis_2_muestras_calculator.py  # Add output builder + helpers
api/tests/test_hipotesis_2_muestras_calculator.py  # Add tests for new functions
api/analyze.py  # Replace manual results assembly with builder call
```

**Files to READ (reference only — do NOT modify):**
```
api/utils/msa_calculator.py                    # Pattern reference: generate_instructions(), format_chart_data()
api/utils/capacidad_proceso_calculator.py      # Pattern reference: build_capacidad_proceso_output(), _build_chart_data()
api/utils/hipotesis_2_muestras_validator.py    # Validated data format reference
api/utils/response.py                          # success_response() signature
```

**DO NOT create new files.** All new functions go in the existing `hipotesis_2_muestras_calculator.py`.

**Naming conventions:**
- Private helpers: `_build_histogram_bins`, `_build_boxplot_stats`, `_calculate_sample_ci`, `_build_chart_data`, `_generate_instructions` (with `_` prefix)
- Public function: `build_hipotesis_2_muestras_output`

### Testing Requirements

**Testing framework:** pytest (Python only — no TypeScript changes in this story)

**Add new test classes to existing `test_hipotesis_2_muestras_calculator.py`:**

1. **Histogram binning** (AC 3):
   - Known dataset [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] → verify Sturges bin count = ceil(1+log2(10)) = 4
   - Verify bins cover full range, counts sum to n
   - Verify mean and sampleName in output
   - Verify outliers list matches descriptive stats

2. **Boxplot statistics** (AC 4):
   - Known dataset → verify q1, median, q3 match numpy percentiles
   - Dataset with outliers → verify min/max are non-outlier extremes
   - Verify outlier values list matches descriptive stats

3. **Individual sample CI** (AC 5):
   - Known dataset with known t-critical → verify CI bounds (e.g., t=2.262 for df=9, 95%)
   - 90%, 95%, 99% confidence levels → CI widths: 90% < 95% < 99%

4. **Chart data builder — structure** (AC 1, 3, 4, 5):
   - Verify exactly 4 charts returned
   - Verify types: histogram_a, histogram_b, boxplot_variance, boxplot_means
   - Verify boxplot_variance has leveneTestPValue and leveneConclusion
   - Verify boxplot_means has tTestPValue, tTestConclusion, ciLower, ciUpper per sample
   - Verify histogram uses data_for_tests arrays (transformed data if Box-Cox applied)

5. **Instructions — structure** (AC 6):
   - Verify all 5 parts present (search for "PARTE 1" through "PARTE 5")
   - Verify AGENT_ONLY header present
   - Verify all text is in Spanish (no English technical terms without translation)
   - Verify no raw data arrays in instructions

6. **Instructions — caveats** (AC 7):
   - Small sample (n < 30) → caveat in sample size section AND terrenal
   - Box-Cox failed → caveat in normality section AND terrenal
   - Non-normal + non-robust → caveat in normality section AND terrenal

7. **Output builder — complete** (AC 1, 2):
   - End-to-end: full_results from pipeline → verify output has results, chartData (list), instructions (string)
   - Verify results dict matches expected keys
   - Verify no numpy arrays in any part of the output

8. **Edge cases:**
   - Identical samples → valid output, terrenal mentions no significant differences
   - Very small samples (n=2) → valid histogram, boxplot, instructions (may have limited bins)
   - One-sided hypothesis → instructions Part 4 correctly formats H₁ as μA > μB or μA < μB

**Integration test in `test_analyze.py` (optional):**
- POST with valid 2-sample data → response has non-empty chartData (list with 4 items) and non-empty instructions

**Verification commands:**
```bash
python3 -m pytest api/tests/test_hipotesis_2_muestras_calculator.py -v
python3 -m pytest api/tests/ -v  # Full suite — expect 580+ pass, ≤4 pre-existing failures
npx tsc --noEmit                  # Zero TypeScript errors
npm run build                     # Successful build
```

**Pre-existing test failures:** 4 MSA chart-related tests are known to fail (pre-existing from before Epic 9). Do NOT attempt to fix these.

**Test count baseline:** Story 10.3 ended with 560 passed, 4 failed. This story should add ~20-25 new tests.

### Previous Story Intelligence

**From Story 10.3 (Levene Variance Test & 2-Sample T-Test):**

1. **`full_results` dict is the input.** `perform_hypothesis_tests()` returns a dict that extends `calc_results` with `variance_test` and `means_test`. Your `build_hipotesis_2_muestras_output()` receives this as input.

2. **`data_for_tests` contains the arrays to chart.** These are Box-Cox transformed if transformation was applied, or original arrays otherwise. Use `full_results['data_for_tests']['sample_a']` and `sample_b` for histogram and boxplot calculations.

3. **analyze.py already builds the results dict manually.** Your task is to move this logic into `build_hipotesis_2_muestras_output()` and have analyze.py call that single function instead of manually constructing the dict.

4. **Bool casting lesson (Story 10.3 debug).** `np.True_` vs Python `bool` caused issues. When building chart data or instructions, always cast numpy types: `bool(value)`, `float(value)`, `int(value)`.

5. **Code review input validation pattern (Story 10.3).** confidence_level and alternative_hypothesis are validated in analyze.py BEFORE reaching the calculator. Your output builder can assume valid inputs.

6. **Rounding convention.** All numeric values in descriptive_a/b are rounded to 6 decimals. For chart data, round to 4 decimals for display cleanliness.

7. **Existing function: `_t_critical(alpha_tail, df)`.** Already in the calculator module at line 43. Returns t > 0 such that P(T > t) = alpha_tail. Use for individual sample CI computation. Import is just a function call within the same module.

8. **Instructions pattern from MSA.** Agent-only header in HTML comments: `<!-- AGENT_ONLY -->...<!-- /AGENT_ONLY -->`. Then technical sections with markdown tables. Then plain language conclusion. Follow this exact pattern.

**From Story 10.2 (Descriptive Statistics & Normality):**

1. **Descriptive stats structure.** Each `descriptive_a`/`descriptive_b` dict includes `outliers.outlier_values` (list of floats) — use this for histogram outlier markers and boxplot outlier points.

2. **Normality result structure.** `normality_a`/`normality_b` include `is_normal`, `ad_statistic`, `p_value`, `is_robust`, `robustness_details`.

3. **Box-Cox structure.** `box_cox` dict includes `applied`, `lambda_a`, `lambda_b`, `normality_improved`, `using_transformed_data`, `warning`.

4. **Sample size structure.** `sample_size.a`/`sample_size.b` include `n`, `tcl_applies`, `small_sample_warning`, `note`.

**From Story 10.1 (Validator):**

1. **Column names.** `validated_data['column_names']` contains the original column names from the Excel file (e.g., ["Muestra A", "Muestra B"]). These are passed through to `descriptive_a.sample_name` / `descriptive_b.sample_name`. Use these as chart labels.

### Git Intelligence

**Recent commit patterns:** `feat:` prefix for features, `fix:` for bugs, concise English summaries.

**Codebase state after Story 10.3:**
- `hipotesis_2_muestras_calculator.py` has 649 lines: descriptive stats, normality analysis, Box-Cox, Levene, t-test, orchestrators
- `analyze.py` routing block (lines 303-341) manually builds results dict, sets `chartData: []` and `instructions: ''`
- `test_hipotesis_2_muestras_calculator.py` has 100+ tests in 12+ test classes
- Test baseline: 560 passed, 4 pre-existing failures
- No pending breaking changes or in-flight refactors

### Project Structure Notes

- All new functions go in `api/utils/hipotesis_2_muestras_calculator.py` — do NOT create new files
- Tests go in existing `api/tests/test_hipotesis_2_muestras_calculator.py` — add new test classes
- `_t_critical()` is in the same module — no import needed, just call it directly
- No frontend changes in this story — all work is Python backend
- The output builder pattern follows `build_capacidad_proceso_output()` in `capacidad_proceso_calculator.py` — same `{ results, chartData, instructions }` structure
- analyze.py uses `success_response(results, chart_data, instructions)` — your builder must return compatible dict

### analyze.py Modification Guide

**Current code (lines 303-341) — replace the results+analysis_output block with:**

```python
elif analysis_type == 'hipotesis_2_muestras':
    # confidence_level and alternative_hypothesis already validated above

    # Descriptive statistics + normality analysis (Story 10.2)
    calc_results = perform_descriptive_normality_analysis(
        validated_data['muestra_a'],
        validated_data['muestra_b'],
        validated_data['column_names'],
    )

    # Levene variance test + 2-sample t-test (Story 10.3)
    full_results = perform_hypothesis_tests(
        calc_results, confidence_level, alternative_hypothesis
    )

    # Add validation warnings
    all_warnings = validated_data.get('warnings', []) + full_results.get('warnings', [])

    # Build complete output: results + chartData + instructions (Story 10.4)
    analysis_output = build_hipotesis_2_muestras_output(
        full_results, all_warnings, confidence_level
    )
```

**Update import at top of analyze.py:**
```python
from api.utils.hipotesis_2_muestras_calculator import (
    perform_descriptive_normality_analysis,
    perform_hypothesis_tests,
    build_hipotesis_2_muestras_output,  # NEW
)
```

### Output Builder Return Structure

**`build_hipotesis_2_muestras_output()` returns:**
```python
{
    'results': {
        'descriptive_a': { ... },     # From full_results, as-is
        'descriptive_b': { ... },     # From full_results, as-is
        'sample_size': { ... },       # From full_results, as-is
        'normality_a': { ... },       # From full_results, as-is
        'normality_b': { ... },       # From full_results, as-is
        'box_cox': { ... },           # From full_results, STRIPPED of transformed_a/b
        'variance_test': { ... },     # From full_results, as-is
        'means_test': { ... },        # From full_results, as-is
        'warnings': list[str],        # Merged validation + analysis warnings
    },
    'chartData': [
        { 'type': 'histogram_a', 'data': { ... } },
        { 'type': 'histogram_b', 'data': { ... } },
        { 'type': 'boxplot_variance', 'data': { ... } },
        { 'type': 'boxplot_means', 'data': { ... } },
    ],
    'instructions': str,  # Markdown with 5 parts, all Spanish
}
```

### Terrenal Conclusion Logic

The Conclusión Terrenal section should dynamically compose a plain-language interpretation:

1. **Variance interpretation:**
   - Equal: "Las dos muestras tienen una variabilidad similar entre sí."
   - Different: "Las dos muestras tienen una variabilidad diferente. {sample_with_higher_std} tiene mayor dispersión."

2. **Means interpretation:**
   - Equal (two-sided): "No hay evidencia estadística de que las medias sean diferentes. Los promedios de {mean_a} y {mean_b} son estadísticamente equivalentes."
   - Different (two-sided): "Las medias son estadísticamente diferentes. {sample_a_name} produce en promedio {mean_a} y {sample_b_name} {mean_b}. Esta diferencia NO se debe al azar."
   - Greater confirmed: "{sample_a_name} tiene una media significativamente mayor que {sample_b_name}."
   - Greater not confirmed: "No hay evidencia de que {sample_a_name} tenga una media mayor que {sample_b_name}."
   - Less confirmed: "{sample_a_name} tiene una media significativamente menor que {sample_b_name}."
   - Less not confirmed: "No hay evidencia de que {sample_a_name} tenga una media menor que {sample_b_name}."

3. **Caveats (append if applicable):**
   - Small sample: "⚠️ Nota: Al menos una muestra tiene menos de 30 observaciones. Los resultados deben interpretarse con precaución."
   - Non-normal non-robust: "⚠️ Nota: Los datos no siguen una distribución normal y no son robustos. Los resultados deben interpretarse con precaución."
   - Box-Cox failed: "⚠️ Nota: La transformación Box-Cox no logró normalidad. Los resultados se basan en datos originales y deben interpretarse con precaución."

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-10, Story 10.4]
- [Source: _bmad-output/planning-artifacts/prd-v4.md#FR-H28, FR-H30, NFR-H4, NFR-H5, NFR-H6]
- [Source: _bmad-output/planning-artifacts/prd-v4.md#Hipotesis2MChartData interface]
- [Source: _bmad-output/planning-artifacts/architecture.md#Python-Analysis-Service]
- [Source: _bmad-output/planning-artifacts/architecture.md#File-Structure-Conventions]
- [Source: _bmad-output/implementation-artifacts/10-3-levene-variance-test-2-sample-t-test.md — previous story learnings]
- [Source: api/utils/hipotesis_2_muestras_calculator.py — existing module to EXTEND]
- [Source: api/utils/capacidad_proceso_calculator.py#build_capacidad_proceso_output — output builder pattern]
- [Source: api/utils/msa_calculator.py#generate_instructions — instructions generation pattern]
- [Source: api/analyze.py#L303-341 — routing block to MODIFY]
- [Source: api/utils/response.py — success_response(results, chart_data, instructions)]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered. All implementations worked on first attempt.

### Completion Notes List

- Implemented `_build_histogram_bins()` using Sturges' formula with `np.histogram` for binning
- Implemented `_build_boxplot_stats()` with non-outlier whisker convention (fence-based filtering for min/max)
- Implemented `_calculate_sample_ci()` reusing existing `_t_critical()` for per-sample confidence intervals
- Implemented `_build_chart_data()` producing 4 charts: histogram_a, histogram_b, boxplot_variance, boxplot_means
- Implemented `_generate_instructions()` with 5 parts in Spanish, AGENT_ONLY header, dynamic caveats
- Implemented `build_hipotesis_2_muestras_output()` orchestrating results assembly, chart data, and instructions
- Updated analyze.py to call `build_hipotesis_2_muestras_output()` instead of manual results construction
- Added 35 new tests covering all new functions, edge cases, and output validation
- All numeric values rounded to 4 decimals in chart data for display cleanliness
- numpy types properly cast to Python native types (float, int, bool) for JSON serialization
- box_cox in results strips transformed_a/b arrays to prevent raw data leakage

### File List

- `api/utils/hipotesis_2_muestras_calculator.py` — MODIFIED: Added 6 new functions (~300 lines): _build_histogram_bins, _build_boxplot_stats, _calculate_sample_ci, _build_chart_data, _generate_instructions, build_hipotesis_2_muestras_output
- `api/tests/test_hipotesis_2_muestras_calculator.py` — MODIFIED: Added 39 new tests in 9 test classes: TestHistogramBinning, TestBoxplotStats, TestSampleCI, TestChartDataBuilder, TestInstructionsGenerator, TestOutputBuilder, TestOneSidedInstructions, TestPerformance
- `api/analyze.py` — MODIFIED: Updated import to include build_hipotesis_2_muestras_output; replaced manual results dict + empty chartData/instructions with single builder call

### Change Log

- 2026-03-14: Story 10.4 implementation complete — added results assembly, chart data (4 charts), instructions generator (5 parts in Spanish), and output builder function. Replaced manual results construction in analyze.py with builder call. 35 new tests added (99 total calculator tests pass, 595 full suite pass).
- 2026-03-14: Code review complete — 7 findings (1 HIGH, 3 MEDIUM, 3 LOW). All HIGH and MEDIUM issues fixed:
  - H1 FIXED: Boxplot outlier filtering used fragile float set comparison; replaced with fence-based numpy boolean indexing using lower_fence/upper_fence from detect_outliers_iqr()
  - M1 FIXED: Added 3 tests for one-sided hypothesis instructions formatting (TestOneSidedInstructions)
  - M2 FIXED: Added performance test validating < 30s for 1000 rows/sample (TestPerformance)
  - M3 ACCEPTED: Histogram/boxplot use data_for_tests (possibly Box-Cox transformed) — this is correct because charts should reflect what statistical tests see
  - L3 FIXED: Removed dead assignment `method_reason = ''`
  - L1, L2: Low-risk, deferred. Final count: 103 calculator tests pass, 599 full suite pass (4 pre-existing MSA failures).
