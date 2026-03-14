# Story 10.3: Levene Variance Test & 2-Sample T-Test (Pure Python)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want variance and means tests calculated with Minitab-comparable accuracy,
so that I can trust the statistical conclusions for my decision-making.

## Acceptance Criteria

### AC 1: Levene's Test (Median Variant)
- **Given** two samples and confidence_level = 0.95 (α = 0.05)
- **When** Levene's test (median variant) is calculated
- **Then** the F-statistic and p-value are produced
- **And** the p-value is comparable to Minitab (±0.01)
- **And** the Levene implementation uses pure Python (no scipy)

### AC 2: Variance Interpretation — Equal
- **Given** Levene p-value ≥ α
- **When** variance interpretation runs
- **Then** conclusion is "Varianzas estadísticamente iguales" (H₀ not rejected)
- **And** the `equal_variances` flag is set to true

### AC 3: Variance Interpretation — Different
- **Given** Levene p-value < α
- **When** variance interpretation runs
- **Then** conclusion is "Varianzas estadísticamente diferentes" (H₀ rejected)
- **And** the `equal_variances` flag is set to false

### AC 4: Pooled T-Test (Equal Variances)
- **Given** equal_variances = true
- **When** the means test executes
- **Then** it uses the pooled (equal variance) t-test

### AC 5: Welch T-Test (Unequal Variances)
- **Given** equal_variances = false
- **When** the means test executes
- **Then** it uses the Welch (unequal variance) t-test with Welch-Satterthwaite degrees of freedom

### AC 6: Two-Sided Hypothesis (μA ≠ μB)
- **Given** alternative_hypothesis = 'two-sided'
- **When** the t-test calculates the p-value
- **Then** it computes the two-tailed p-value
- **And** the result is comparable to Minitab's 2-Sample t output (±0.01)

### AC 7: Greater Hypothesis (μA > μB)
- **Given** alternative_hypothesis = 'greater'
- **When** the t-test calculates the p-value
- **Then** it computes the one-tailed p-value for the upper tail

### AC 8: Less Hypothesis (μA < μB)
- **Given** alternative_hypothesis = 'less'
- **When** the t-test calculates the p-value
- **Then** it computes the one-tailed p-value for the lower tail

### AC 9: Complete T-Test Results
- **Given** any t-test result
- **When** calculation completes
- **Then** the result includes: t-statistic, degrees of freedom, p-value, and confidence interval for the difference of means
- **And** the CI width matches the chosen confidence level

### AC 10: Confidence Level 0.90
- **Given** confidence_level = 0.90 (α = 0.10)
- **When** Levene and t-test run
- **Then** both tests use α = 0.10 for their rejection thresholds
- **And** the CI is a 90% confidence interval

### AC 11: Confidence Level 0.99
- **Given** confidence_level = 0.99 (α = 0.01)
- **When** Levene and t-test run
- **Then** both tests use α = 0.01
- **And** the CI is a 99% confidence interval

### AC 12: Pure Python T-Distribution
- **Given** the t-distribution function is implemented
- **When** p-values are calculated
- **Then** the implementation is pure Python (no scipy)
- **And** uses the existing beta function infrastructure (betainc, betacf) from msa_calculator.py

**FRs covered:** FR-H19, FR-H20, FR-H21, FR-H22, FR-H23, FR-H24, FR-H25
**NFRs covered:** NFR-H1, NFR-H2, NFR-H3

## Tasks / Subtasks

- [x] Task 1: Implement t-distribution functions (AC: 12)
  - [x] 1.1 Import `_betainc` from `api.utils.msa_calculator` into `hipotesis_2_muestras_calculator.py`
  - [x] 1.2 Implement `t_distribution_sf(t_stat: float, df: float) -> float` — survival function P(T > t) using betainc
  - [x] 1.3 Implement `_t_critical(alpha_tail: float, df: float) -> float` — inverse t-distribution via bisection for CI computation

- [x] Task 2: Implement Levene's test (AC: 1, 2, 3)
  - [x] 2.1 Import `f_distribution_sf` from `api.utils.msa_calculator`
  - [x] 2.2 Implement `perform_levene_test(sample_a: np.ndarray, sample_b: np.ndarray, alpha: float) -> dict`
  - [x] 2.3 Use median variant: compute absolute deviations from median per group, then one-way ANOVA F-test on deviations
  - [x] 2.4 Return: f_statistic, p_value, equal_variances (bool), conclusion (Spanish), alpha

- [x] Task 3: Implement 2-sample t-test (AC: 4, 5, 6, 7, 8, 9)
  - [x] 3.1 Implement `perform_t_test(sample_a, sample_b, equal_variances, confidence_level, alternative_hypothesis) -> dict`
  - [x] 3.2 If equal_variances=True: pooled (equal variance) t-test with df = n1+n2-2
  - [x] 3.3 If equal_variances=False: Welch t-test with Welch-Satterthwaite df
  - [x] 3.4 Support three alternative hypotheses: 'two-sided', 'greater', 'less' — compute correct p-value for each
  - [x] 3.5 Compute confidence interval for difference of means using _t_critical
  - [x] 3.6 Return: method, t_statistic, degrees_of_freedom, p_value, ci_lower, ci_upper, difference, conclusion (Spanish), alpha

- [x] Task 4: Implement higher-level orchestrator (AC: 1-12)
  - [x] 4.1 Implement `perform_hypothesis_tests(calc_results: dict, confidence_level: float, alternative_hypothesis: str) -> dict`
  - [x] 4.2 Pipeline: extract data_for_tests → Levene → t-test (pooled or Welch based on Levene result)
  - [x] 4.3 Return combined results extending calc_results with variance_test and means_test sections

- [x] Task 5: Update analyze.py routing (AC: 1-12)
  - [x] 5.1 Parse `confidence_level` (default 0.95) and `alternative_hypothesis` (default 'two-sided') from request body
  - [x] 5.2 Import `perform_hypothesis_tests` from calculator module
  - [x] 5.3 After descriptive/normality analysis, call `perform_hypothesis_tests(calc_results, confidence_level, alternative_hypothesis)`
  - [x] 5.4 Add `variance_test` and `means_test` to results dict
  - [x] 5.5 Keep chartData=[] and instructions='' (Story 10.4)

- [x] Task 6: Write unit tests (AC: 1-12)
  - [x] 6.1 Add tests to existing `api/tests/test_hipotesis_2_muestras_calculator.py`
  - [x] 6.2 Test t_distribution_sf against known values (verify Minitab compatibility)
  - [x] 6.3 Test Levene with equal-variance samples → p-value high, equal_variances=True (AC 1, 2)
  - [x] 6.4 Test Levene with different-variance samples → p-value low, equal_variances=False (AC 3)
  - [x] 6.5 Test pooled t-test with known dataset → verify t, df, p-value match Minitab (AC 4, 6)
  - [x] 6.6 Test Welch t-test with known dataset → verify t, df, p-value match Minitab (AC 5, 6)
  - [x] 6.7 Test one-sided hypotheses: greater and less → correct p-values (AC 7, 8)
  - [x] 6.8 Test CI computation for 90%, 95%, 99% confidence levels (AC 9, 10, 11)
  - [x] 6.9 Test full orchestrator pipeline end-to-end (AC 1-12)
  - [x] 6.10 Test edge cases: identical samples, very small samples (n=2), large samples

- [x] Task 7: Verify build and existing tests (all ACs)
  - [x] 7.1 Run `python3 -m pytest api/tests/test_hipotesis_2_muestras_calculator.py -v` — all tests pass
  - [x] 7.2 Run `python3 -m pytest api/tests/ -v` — no regressions (523+ passed, ≤4 pre-existing failures)
  - [x] 7.3 Run `npx tsc --noEmit` — zero new TypeScript errors
  - [x] 7.4 Run `npm run build` — successful build

## Dev Notes

### Developer Context

This is **Story 10.3 in Epic 10** (2-Sample Hypothesis Testing). Stories 10.1 (template + validator + routing) and 10.2 (descriptive stats + normality) are done. This story adds **Levene's variance test** and **2-sample t-test** to the existing `hipotesis_2_muestras_calculator.py` module. Story 10.4 will then assemble the complete output with chartData and instructions.

**Critical: This story adds calculation functions to the existing calculator module.** Do NOT create new files — add `perform_levene_test()`, `perform_t_test()`, and helper functions to `api/utils/hipotesis_2_muestras_calculator.py`. Add new test classes to the existing test file `api/tests/test_hipotesis_2_muestras_calculator.py`.

**Cross-story data flow:**
- Story 10.2 orchestrator (`perform_descriptive_normality_analysis()`) returns `data_for_tests.sample_a` and `data_for_tests.sample_b` — these are already Box-Cox transformed if transformation was applied, or original arrays otherwise
- This story's `perform_levene_test()` and `perform_t_test()` consume these arrays
- Story 10.4 will consume ALL results (descriptive + normality + variance + means) to build chartData and instructions

**Module growth pattern:** After this story, the calculator module will contain:
- Story 10.2: `perform_descriptive_normality_analysis()` (existing)
- Story 10.3: `perform_levene_test()` + `perform_t_test()` + `perform_hypothesis_tests()` (this story)
- Story 10.4: `build_hipotesis_2_muestras_output()` (next story)

### Technical Requirements

**No scipy allowed.** Vercel 250MB deployment limit prohibits scipy. All statistical distribution functions must be pure Python. The beta function infrastructure (`_betainc`, `_betacf`) already exists in `api/utils/msa_calculator.py` — import and reuse it.

**Python runtime:** Python 3.11 on Vercel serverless. All Python code lives in `api/` (NOT `app/api/`).

**All user-facing messages in Spanish.** Conclusions, interpretations — everything that might appear in results.

**Analysis type identifier:** `'hipotesis_2_muestras'` — unchanged from Stories 10.1-10.2.

**Parameters from request body:**
- `confidence_level`: float, one of 0.90, 0.95, 0.99. Default: 0.95
- `alternative_hypothesis`: string, one of 'two-sided', 'greater', 'less'. Default: 'two-sided'
- These must be parsed from the request body in `analyze.py` and passed through to the calculator

**α derivation:** α = 1 - confidence_level. Example: confidence_level=0.95 → α=0.05. This α is used for BOTH Levene and t-test rejection thresholds. Note: normality's Anderson-Darling always uses α=0.05 regardless (handled in Story 10.2).

### Architecture Compliance

**Import beta function infrastructure from `msa_calculator.py`:**

```python
from api.utils.msa_calculator import _betainc, f_distribution_sf
```

- `_betainc(a, b, x)` — regularized incomplete beta function I_x(a,b). Located at `msa_calculator.py:86-114`. Uses Lentz continued fraction algorithm via `_betacf()`.
- `f_distribution_sf(f_value, df1, df2)` — F-distribution survival function P(F > f). Located at `msa_calculator.py:117-145`. Used for Levene's test p-value.

Both are production-tested (used by MSA analysis for years). The `_` prefix on `_betainc` is Python convention only — it imports normally.

**t-Distribution survival function** — implement NEW in `hipotesis_2_muestras_calculator.py`:

```python
def t_distribution_sf(t_stat: float, df: float) -> float:
    """Survival function P(T > t) for Student's t-distribution.

    Uses the relation: for t > 0,
        P(T > t | df) = 0.5 * I_x(df/2, 1/2)
    where x = df / (df + t²) and I_x is the regularized incomplete beta function.
    """
    if df <= 0:
        return None
    if t_stat == 0:
        return 0.5
    x = df / (df + t_stat ** 2)
    p = 0.5 * _betainc(df / 2.0, 0.5, x)
    if t_stat > 0:
        return p
    else:
        return 1.0 - p
```

**t-Distribution inverse (critical value)** — implement NEW for CI computation:

```python
def _t_critical(alpha_tail: float, df: float, tol: float = 1e-10, max_iter: int = 200) -> float:
    """Find t > 0 such that P(T > t) = alpha_tail.

    For two-sided CI at confidence (1-α): alpha_tail = α/2
    For one-sided CI at confidence (1-α): alpha_tail = α
    """
    lo, hi = 0.0, 1000.0
    for _ in range(max_iter):
        mid = (lo + hi) / 2.0
        if t_distribution_sf(mid, df) > alpha_tail:
            lo = mid
        else:
            hi = mid
        if (hi - lo) < tol:
            break
    return (lo + hi) / 2.0
```

**Levene's Test Formula (Median Variant):**

```python
def perform_levene_test(sample_a: np.ndarray, sample_b: np.ndarray, alpha: float = 0.05) -> dict:
    """Levene's test for equality of variances (median variant, Minitab-compatible).

    Steps:
    1. Compute absolute deviations from group median: z_ij = |x_ij - median_i|
    2. One-way ANOVA F-test on deviations:
       F = [SSbetween / (k-1)] / [SSwithin / (N-k)]
       where k=2 groups, N = total observations
    3. p-value from F(1, N-2) distribution
    """
    # Deviations from median
    z_a = np.abs(sample_a - np.median(sample_a))
    z_b = np.abs(sample_b - np.median(sample_b))

    n_a, n_b = len(z_a), len(z_b)
    N = n_a + n_b

    z_bar_a = np.mean(z_a)
    z_bar_b = np.mean(z_b)
    z_bar = (np.sum(z_a) + np.sum(z_b)) / N

    # Between-group sum of squares
    ss_between = n_a * (z_bar_a - z_bar)**2 + n_b * (z_bar_b - z_bar)**2

    # Within-group sum of squares
    ss_within = np.sum((z_a - z_bar_a)**2) + np.sum((z_b - z_bar_b)**2)

    # F-statistic: (SSbetween / 1) / (SSwithin / (N-2))
    f_stat = (ss_between / 1.0) / (ss_within / (N - 2))

    # p-value from F(1, N-2) distribution
    p_value = f_distribution_sf(f_stat, 1, N - 2)

    equal_variances = p_value >= alpha
    conclusion = "Varianzas estadísticamente iguales" if equal_variances else "Varianzas estadísticamente diferentes"

    return {
        'method': 'Levene (mediana)',
        'f_statistic': round(f_stat, 6),
        'p_value': round(p_value, 6),
        'df1': 1,
        'df2': N - 2,
        'alpha': alpha,
        'equal_variances': equal_variances,
        'conclusion': conclusion,
    }
```

**Pooled T-Test Formula:**

```
Sp² = [(n1-1)*s1² + (n2-1)*s2²] / (n1+n2-2)
SE = sqrt(Sp² * (1/n1 + 1/n2))
t = (x̄1 - x̄2) / SE
df = n1 + n2 - 2
```

**Welch T-Test Formula:**

```
SE = sqrt(s1²/n1 + s2²/n2)
t = (x̄1 - x̄2) / SE
df = (s1²/n1 + s2²/n2)² / [(s1²/n1)²/(n1-1) + (s2²/n2)²/(n2-1)]
```

**P-value computation by alternative hypothesis:**
- `'two-sided'`: p = 2 * t_distribution_sf(|t|, df)
- `'greater'` (H₁: μA > μB): p = t_distribution_sf(t, df)
- `'less'` (H₁: μA < μB): p = 1.0 - t_distribution_sf(t, df)

**CI for difference of means:**
- Two-sided: t_crit = _t_critical(α/2, df) → CI = (diff - t_crit*SE, diff + t_crit*SE)
- Greater: t_crit = _t_critical(α, df) → CI = (diff - t_crit*SE, None) — lower bound only
- Less: t_crit = _t_critical(α, df) → CI = (None, diff + t_crit*SE) — upper bound only

**Use `np.std(values, ddof=1)`** for sample standard deviation (same as Story 10.2, Minitab-compatible).

### Library & Framework Requirements

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| Numeric arrays | numpy | Already in requirements.txt | All statistical calculations |
| Beta functions | msa_calculator.py | Internal module | REUSE _betainc, f_distribution_sf |
| Normality tests | normality_tests.py | Internal module | Already used by Story 10.2 |

**DO NOT add any new dependencies.** Everything needed is already available.

**DO NOT import scipy** for any reason. All distribution functions (F, t) use the existing betainc infrastructure.

### File Structure Requirements

**Files to MODIFY (add new functions):**
```
api/utils/hipotesis_2_muestras_calculator.py  # Add Levene, t-test, orchestrator functions
api/tests/test_hipotesis_2_muestras_calculator.py  # Add new test classes for Levene/t-test
api/analyze.py  # Parse confidence_level/alternative_hypothesis, call hypothesis tests
```

**Files to READ (reference only — do NOT modify):**
```
api/utils/msa_calculator.py             # _betainc, f_distribution_sf to import
api/utils/normality_tests.py            # anderson_darling_normal (already imported by 10.2)
api/utils/hipotesis_2_muestras_validator.py  # Validated data format reference
api/utils/response.py                   # Response format helpers
```

**DO NOT create new files.** All calculator functions go in the existing module.

**Naming conventions:**
- Private helpers: `_t_critical`, `_calculate_pooled_t`, `_calculate_welch_t` (with `_` prefix)
- Public functions: `t_distribution_sf`, `perform_levene_test`, `perform_t_test`, `perform_hypothesis_tests`

### Testing Requirements

**Testing framework:** pytest (Python only — no TypeScript changes in this story)

**Add new test classes to existing `test_hipotesis_2_muestras_calculator.py`:**

1. **t_distribution_sf verification** (AC 12):
   - t=0, df=10 → sf=0.5
   - t=2.228, df=10 → sf ≈ 0.025 (two-tailed 95% critical value)
   - t=1.812, df=10 → sf ≈ 0.05 (one-tailed 95%)
   - Negative t: t=-2.0, df=10 → sf ≈ 0.963
   - Verify against known t-distribution table values

2. **Levene's test — equal variances** (AC 1, 2):
   - Two samples from similar spread → p-value high (≥ 0.05), equal_variances=True
   - Use `np.random.seed(42)`: sample_a = np.random.normal(100, 5, 50), sample_b = np.random.normal(100, 5, 50)

3. **Levene's test — different variances** (AC 3):
   - Two samples with clearly different spread → p-value low (< 0.05), equal_variances=False
   - Use `np.random.seed(42)`: sample_a = np.random.normal(100, 2, 50), sample_b = np.random.normal(100, 10, 50)

4. **Pooled t-test** (AC 4, 6, 9):
   - Known dataset with verifiable results. Use a small dataset where hand-calculation is possible
   - Verify: t_statistic, df, p_value, ci_lower, ci_upper
   - Use `pytest.approx(expected, abs=0.01)` for Minitab compatibility

5. **Welch t-test** (AC 5, 6, 9):
   - Dataset with unequal variances → Welch automatically selected
   - Verify: fractional degrees of freedom (Welch-Satterthwaite), t_statistic, p_value

6. **One-sided hypotheses** (AC 7, 8):
   - Same dataset, three alternative_hypothesis values → verify p-value relationships:
     - Two-sided p ≈ 2 * min(greater_p, less_p)
     - greater_p + less_p ≈ 1.0

7. **Confidence levels 0.90, 0.95, 0.99** (AC 10, 11):
   - Same dataset, three confidence levels → CI widths: 90% < 95% < 99%
   - Verify α is correctly applied to Levene threshold

8. **Edge cases:**
   - Identical samples (means equal) → t≈0, p≈1.0, CI includes 0
   - Very small samples (n=2 each) → valid results with large CI
   - Very large samples (n=200 each) → valid results, df close to n1+n2-2 for pooled

9. **Full orchestrator pipeline** (AC 1-12):
   - End-to-end: provide two samples + confidence_level + alternative_hypothesis → verify complete output structure

**Integration test in `test_analyze.py` (optional):**
- POST with valid 2-sample data + confidence_level + alternative_hypothesis → response includes variance_test and means_test

**Verification commands:**
```bash
python3 -m pytest api/tests/test_hipotesis_2_muestras_calculator.py -v
python3 -m pytest api/tests/ -v  # Full suite — expect 553+ pass, ≤4 pre-existing failures
npx tsc --noEmit                  # Zero TypeScript errors
npm run build                     # Successful build
```

**Pre-existing test failures:** 4 MSA chart-related tests are known to fail (pre-existing from before Epic 9). Do NOT attempt to fix these.

**Test count baseline:** Story 10.2 ended with 523 passed, 4 failed. This story should add ~15-20 new tests.

### Previous Story Intelligence

**From Story 10.2 (Descriptive Statistics, Sample Size & Normality):**

1. **`data_for_tests` is the critical handoff.** The orchestrator returns `data_for_tests.sample_a` and `data_for_tests.sample_b` — these arrays are already Box-Cox transformed if transformation was applied. Use these for Levene and t-test, NOT the original validated_data arrays.

2. **The results dict structure matters.** Story 10.2 returns a specific dict structure. Your orchestrator (`perform_hypothesis_tests`) should EXTEND this dict, not replace it. Add `variance_test` and `means_test` keys alongside existing keys.

3. **Redundant computation lesson.** Story 10.2 code review (M1) caught redundant Anderson-Darling calls. Lesson: don't recalculate standard deviations or means — extract them from the existing `descriptive_a`/`descriptive_b` results.

4. **Edge case guards.** Story 10.2 added empty array guard to `detect_outliers_iqr` after code review (M2). Apply same defensive coding: guard against division by zero in SE calculations, zero variance, df ≤ 0.

5. **Test pattern established.** Story 10.2 uses seeded random data (`np.random.seed()`) for deterministic tests. Follow this pattern for Levene and t-test tests.

6. **analyze.py current state.** The hipotesis_2_muestras routing block (lines 263-292) calls `perform_descriptive_normality_analysis()` then strips numpy arrays from box_cox. You need to extend this block to also call `perform_hypothesis_tests()` and merge the variance_test/means_test results. Also strip `data_for_tests` from the response (numpy arrays, not serializable).

7. **`data_for_tests` is already stripped from response.** Looking at the current analyze.py code, it manually constructs the results dict and does NOT include `data_for_tests`. This means you can safely add `data_for_tests` consumption in the calculator without worrying about serialization — just don't include it in the response dict.

**From Story 10.1 (Template, Validator & Routing):**

1. **analyze.py request parsing.** Currently parses `analysis_type`, `file_id`, `message_id`, and `spec_limits` from request body. You need to add parsing for `confidence_level` and `alternative_hypothesis` with defaults.

### Git Intelligence

**Recent commit patterns:** `feat:` prefix for features, `fix:` for bugs, concise English summaries.

**Codebase state after Story 10.2:**
- `hipotesis_2_muestras_calculator.py` has 7 public functions + 1 private helper, ending with `perform_descriptive_normality_analysis()` orchestrator
- `analyze.py` has full routing for hipotesis_2_muestras but only calls descriptive/normality analysis
- `test_hipotesis_2_muestras_calculator.py` has 30 tests in 7 test classes
- Test baseline: 523 passed, 4 pre-existing failures
- No pending breaking changes or in-flight refactors

### Project Structure Notes

- All new functions go in `api/utils/hipotesis_2_muestras_calculator.py` — do NOT create new files
- Tests go in existing `api/tests/test_hipotesis_2_muestras_calculator.py` — add new test classes
- Import `_betainc` and `f_distribution_sf` from `api.utils.msa_calculator` — they are stable, production-tested
- The `api/utils/__init__.py` exists — no need to create it
- No frontend changes in this story — all work is Python backend
- `analyze.py` uses `BaseHTTPRequestHandler` pattern with `success_response()` and `error_response()` helpers

### Levene + T-Test Return Structure

**`perform_levene_test()` returns:**
```python
{
    'method': 'Levene (mediana)',
    'f_statistic': float,
    'p_value': float,
    'df1': 1,
    'df2': int,       # N - 2
    'alpha': float,
    'equal_variances': bool,
    'conclusion': str,  # Spanish
}
```

**`perform_t_test()` returns:**
```python
{
    'method': str,             # 't-test (varianzas agrupadas)' or 't-test de Welch'
    't_statistic': float,
    'degrees_of_freedom': float,  # int for pooled, float for Welch
    'p_value': float,
    'ci_lower': float | None,  # None for one-sided 'less'
    'ci_upper': float | None,  # None for one-sided 'greater'
    'difference': float,       # x̄A - x̄B
    'alpha': float,
    'confidence_level': float,
    'alternative_hypothesis': str,
    'equal_variances': bool,
    'conclusion': str,  # Spanish: "Medias estadísticamente iguales/diferentes"
}
```

**`perform_hypothesis_tests()` returns (extends calc_results):**
```python
{
    # All keys from perform_descriptive_normality_analysis() (Story 10.2)
    'descriptive_a': { ... },
    'descriptive_b': { ... },
    'sample_size': { ... },
    'normality_a': { ... },
    'normality_b': { ... },
    'box_cox': { ... },
    'warnings': list[str],
    'data_for_tests': { ... },
    # NEW keys added by this story:
    'variance_test': { ... },  # Levene result
    'means_test': { ... },     # T-test result
}
```

### analyze.py Modification Guide

**Current code (lines 263-292) — replace with:**

```python
elif analysis_type == 'hipotesis_2_muestras':
    # Parse optional parameters with defaults
    confidence_level = float(body.get('confidence_level', 0.95))
    alternative_hypothesis = body.get('alternative_hypothesis', 'two-sided')

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

    # Build response (exclude non-serializable numpy arrays)
    results = {
        'descriptive_a': full_results['descriptive_a'],
        'descriptive_b': full_results['descriptive_b'],
        'sample_size': full_results['sample_size'],
        'normality_a': full_results['normality_a'],
        'normality_b': full_results['normality_b'],
        'box_cox': {
            k: v for k, v in full_results['box_cox'].items()
            if k not in ('transformed_a', 'transformed_b')
        },
        'variance_test': full_results['variance_test'],
        'means_test': full_results['means_test'],
        'warnings': all_warnings,
    }

    analysis_output = {
        'results': results,
        'chartData': [],      # Story 10.4
        'instructions': '',   # Story 10.4
    }
```

**Also add import at top of analyze.py:**
```python
from api.utils.hipotesis_2_muestras_calculator import perform_descriptive_normality_analysis, perform_hypothesis_tests
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-10, Story 10.3]
- [Source: _bmad-output/planning-artifacts/prd-v4.md#FR-H19 through FR-H25, NFR-H1 through NFR-H3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Python-Analysis-Service]
- [Source: _bmad-output/planning-artifacts/architecture.md#File-Structure-Conventions]
- [Source: _bmad-output/implementation-artifacts/10-2-descriptive-statistics-sample-size-normality-analysis.md — previous story learnings]
- [Source: _bmad-output/implementation-artifacts/10-1-template-validator-routing-foundation.md — validator/routing patterns]
- [Source: api/utils/msa_calculator.py#L86-145 — _betainc(), f_distribution_sf() to REUSE]
- [Source: api/utils/hipotesis_2_muestras_calculator.py — existing module to EXTEND]
- [Source: api/analyze.py#L263-292 — routing block to MODIFY]
- [Source: api/utils/response.py — success_response(), error_response() helpers]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed `np.True_`/`np.False_` vs Python `bool` issue in Levene test by casting with `bool()`

### Completion Notes List

- Task 1: Implemented `t_distribution_sf()` and `_t_critical()` using existing `_betainc` infrastructure from `msa_calculator.py`. Bisection method for inverse t-distribution.
- Task 2: Implemented `perform_levene_test()` using median variant (Minitab-compatible). Uses `f_distribution_sf` from msa_calculator. Added zero-variance guard.
- Task 3: Implemented `perform_t_test()` supporting pooled and Welch t-tests, three alternative hypotheses (two-sided, greater, less), and confidence interval computation.
- Task 4: Implemented `perform_hypothesis_tests()` orchestrator that chains Levene -> t-test selection -> execution.
- Task 5: Updated `analyze.py` to parse `confidence_level` and `alternative_hypothesis` from request body, call the new orchestrator, and include `variance_test` and `means_test` in response.
- Task 6: Added 33 new tests covering t-distribution, Levene (equal/different variances), pooled t-test, Welch t-test, one-sided hypotheses, confidence levels, orchestrator pipeline, and edge cases.
- Task 7: Full suite: 556 passed, 4 pre-existing failures (MSA chart tests). No regressions. Build and TypeScript check successful.

### Code Review Fixes

- **M1 FIXED**: Added input validation for `confidence_level` in analyze.py — rejects values outside {0.90, 0.95, 0.99} with 400, validates numeric type before float conversion
- **M2 FIXED**: Added input validation for `alternative_hypothesis` in analyze.py — rejects values outside {'two-sided', 'greater', 'less'} with 400
- **M3 FIXED**: Added Welch-Satterthwaite df zero-division guard in `perform_t_test` — falls back to pooled df when both variances are zero
- **L1 FIXED**: Updated `t_distribution_sf` return type hint from `-> float` to `-> float | None`
- Moved parameter validation BEFORE file fetch in analyze.py for efficiency and testability
- Added 4 new tests: 3 validation tests in test_analyze.py + 1 Welch zero-variance test in calculator tests
- Final suite: 560 passed, 4 pre-existing failures (MSA chart tests)

### Change Log

- 2026-03-14: Implemented Levene variance test and 2-sample t-test (pooled/Welch) with pure Python t-distribution functions. Added 33 new tests. Updated analyze.py routing.
- 2026-03-14: Code review fixes — input validation for confidence_level and alternative_hypothesis, Welch zero-variance guard, type hint fix. Added 4 new tests.

### File List

- api/utils/hipotesis_2_muestras_calculator.py (modified) — Added t_distribution_sf, _t_critical, perform_levene_test, perform_t_test, perform_hypothesis_tests; code review: Welch df guard, type hint fix
- api/tests/test_hipotesis_2_muestras_calculator.py (modified) — Added 34 new tests in 8 test classes (33 original + 1 code review)
- api/analyze.py (modified) — Added confidence_level/alternative_hypothesis parsing with validation, perform_hypothesis_tests call, variance_test/means_test in response
- api/tests/test_analyze.py (modified) — Added 3 validation tests for confidence_level and alternative_hypothesis
