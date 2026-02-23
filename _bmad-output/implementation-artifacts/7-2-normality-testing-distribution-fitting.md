# Story 7.2: Normality Testing & Distribution Fitting

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **my data tested for normality and alternative distributions fitted if needed**,
So that **I know if my data follows a normal distribution or requires special handling**.

**FRs covered:** FR-CP12, FR-CP13, FR-CP18

**NFRs addressed:** NFR-CP1 (Anderson-Darling p-values comparable to Minitab ±0.01)

## Acceptance Criteria

1. **Given** a valid data set is submitted for analysis, **When** normality testing is performed, **Then** the system calculates the Anderson-Darling statistic (A²) **And** the system calculates p-value using an algorithm compatible with Minitab (±0.01 accuracy) **And** the system compares p-value against α = 0.05 **And** the system concludes "Normal" or "No Normal"

2. **Given** data is NOT normal (p-value < 0.05), **When** transformation is attempted, **Then** the system applies Box-Cox transformation (preferred) or Johnson transformation **And** the system re-tests normality on transformed data **And** if transformation succeeds, the system stores transformation type and parameters (λ for Box-Cox)

3. **Given** transformation does not achieve normality, **When** alternative distribution fitting is performed, **Then** the system fits: Weibull, Lognormal, Gamma, Exponential, Logistic, Extreme Value **And** the system selects the distribution with best fit (lowest Anderson-Darling or AIC) **And** the system stores: distribution name, parameters, goodness-of-fit metric **And** the system calculates PPM (parts per million) outside specification using the fitted distribution

4. **Given** all normality/distribution work is pure Python, **When** implemented, **Then** no scipy dependency is used (Vercel 250MB limit) **And** all statistical functions are implemented in pure Python with numpy

## Tasks / Subtasks

- [x] **Task 1: Implement Anderson-Darling Test (Pure Python)** (AC: #1, #4)
  - [x] Create `/api/utils/normality_tests.py` module
  - [x] Implement `anderson_darling_normal(values)` function
    - [x] Calculate sorted standardized values (z-scores)
    - [x] Calculate A² statistic using AD formula
    - [x] Implement p-value calculation for normal distribution (interpolation table or asymptotic approximation)
  - [x] Validate against known Minitab results (±0.01 accuracy)
  - [x] Return dict: `{'statistic': float, 'p_value': float, 'is_normal': bool, 'alpha': 0.05}`
  - [x] All calculations pure Python/numpy (no scipy)

- [x] **Task 2: Implement Box-Cox Transformation (Pure Python)** (AC: #2, #4)
  - [x] Add `box_cox_transform(values)` to normality_tests.py
  - [x] Implement lambda optimization using Brent's method or grid search
    - [x] Grid search over λ values from -2 to 2 (step 0.1)
    - [x] Use log-likelihood maximization for optimal λ
  - [x] Handle edge cases: λ = 0 (log transform), negative values (shift data)
  - [x] Return dict: `{'transformed_values': array, 'lambda': float, 'shift': float | None}`
  - [x] Re-test transformed data for normality

- [x] **Task 3: Implement Johnson Transformation (Pure Python)** (AC: #2, #4)
  - [x] Add `johnson_transform(values)` to normality_tests.py
  - [x] Implement Johnson SU (unbounded) transformation
    - [x] Estimate γ, δ, ξ, λ parameters using moment-matching or MLE
    - [x] Apply transformation: z = γ + δ * sinh⁻¹((x - ξ) / λ)
  - [x] Return dict: `{'transformed_values': array, 'family': 'SU', 'params': {...}}`
  - [x] Re-test transformed data for normality

- [x] **Task 4: Implement Distribution Fitting (Pure Python)** (AC: #3, #4)
  - [x] Create `/api/utils/distribution_fitting.py` module
  - [x] Implement parameter estimation for each distribution:
    - [x] `fit_weibull(values)` - shape (k) and scale (λ) using MLE
    - [x] `fit_lognormal(values)` - μ and σ of log(X)
    - [x] `fit_gamma(values)` - shape (α) and scale (β)
    - [x] `fit_exponential(values)` - rate (λ)
    - [x] `fit_logistic(values)` - location (μ) and scale (s)
    - [x] `fit_extreme_value(values)` - location (μ) and scale (β), Gumbel distribution
  - [x] Implement Anderson-Darling test for each distribution type
  - [x] Select best-fit distribution by lowest AD statistic or AIC
  - [x] Return dict: `{'distribution': str, 'params': dict, 'ad_statistic': float, 'aic': float}`

- [x] **Task 5: Implement PPM Calculator** (AC: #3, #4)
  - [x] Add `calculate_ppm(distribution_params, lei, les)` to distribution_fitting.py
  - [x] Implement CDF for each supported distribution (pure Python)
    - [x] Normal CDF (already have error function approximation)
    - [x] Weibull CDF: F(x) = 1 - exp(-(x/λ)^k)
    - [x] Lognormal CDF: F(x) = Φ((ln(x) - μ) / σ)
    - [x] Gamma CDF: regularized incomplete gamma function
    - [x] Exponential CDF: F(x) = 1 - exp(-λx)
    - [x] Logistic CDF: F(x) = 1 / (1 + exp(-(x-μ)/s))
    - [x] Extreme Value CDF: F(x) = exp(-exp(-(x-μ)/β))
  - [x] Calculate PPM = (1 - P(LEI < X < LES)) * 1,000,000
  - [x] Return dict: `{'ppm_below_lei': int, 'ppm_above_les': int, 'ppm_total': int}`

- [x] **Task 6: Integrate Normality Module into Calculator** (AC: #1, #2, #3)
  - [x] Update `/api/utils/capacidad_proceso_calculator.py`
  - [x] Import normality_tests and distribution_fitting modules
  - [x] Add `perform_normality_analysis(values)` wrapper function:
    - [x] Run Anderson-Darling test
    - [x] If normal → return normality results
    - [x] If not normal → try Box-Cox transformation
    - [x] If Box-Cox fails → try Johnson transformation
    - [x] If transformations fail → fit alternative distributions
  - [x] Update `build_capacidad_proceso_output` to include normality results
  - [x] Add normality results to output structure

- [x] **Task 7: Update analyze.py Response Structure** (AC: #1, #2, #3)
  - [x] Update capacidad_proceso routing in analyze.py
  - [x] Add spec_limits (lei, les) handling to request body parsing
  - [x] Include normality results in response:
    - [x] `normality.is_normal`, `normality.ad_statistic`, `normality.p_value`
    - [x] `normality.transformation` (if applied)
    - [x] `normality.fitted_distribution` (if non-normal and untransformable)
    - [x] `normality.ppm` (if spec limits provided)
  - [x] Update instructions generation to include normality interpretation

- [x] **Task 8: Update TypeScript Types** (AC: #1, #2, #3)
  - [x] Add to `/types/analysis.ts`:
    - [x] `NormalityTestResult` interface
    - [x] `TransformationResult` interface
    - [x] `DistributionFitResult` interface
    - [x] `PPMResult` interface
  - [x] Update `CapacidadProcesoResult` to include normality property

- [x] **Task 9: Write Unit Tests** (AC: #1, #2, #3, #4)
  - [x] Create `/api/tests/test_normality_tests.py`
    - [x] Test Anderson-Darling against known values (Minitab comparison)
    - [x] Test p-value accuracy (±0.01)
    - [x] Test Box-Cox with known optimal lambda
    - [x] Test Johnson transformation
  - [x] Create `/api/tests/test_distribution_fitting.py`
    - [x] Test each distribution fitting with generated data
    - [x] Test best distribution selection
    - [x] Test PPM calculation against known values
  - [x] Update existing capacidad_proceso tests to include normality

## Dev Notes

### Critical Constraint: Pure Python (NO scipy)

**Vercel has a 250MB unzipped deployment limit.** scipy alone is ~150MB. All statistical functions MUST be implemented in pure Python using only numpy.

Reference: [Source: architecture.md#pure-python-statistical-implementation]

### Anderson-Darling Test Implementation

The Anderson-Darling statistic for normality testing:

```python
def anderson_darling_normal(values: np.ndarray) -> dict:
    """
    Perform Anderson-Darling test for normality.

    Returns:
        dict: {
            'statistic': float,   # A² statistic
            'p_value': float,     # p-value for the test
            'is_normal': bool,    # True if p_value >= 0.05
            'alpha': float        # Significance level (0.05)
        }
    """
    n = len(values)

    # Standardize and sort
    mean = np.mean(values)
    std = np.std(values, ddof=1)
    y = np.sort((values - mean) / std)

    # Calculate CDF values using standard normal
    phi = _normal_cdf(y)  # Must implement

    # Prevent log(0) and log(1)
    phi = np.clip(phi, 1e-15, 1 - 1e-15)

    # Calculate A² statistic
    i = np.arange(1, n + 1)
    s = np.sum((2 * i - 1) * (np.log(phi) + np.log(1 - phi[::-1])))
    a2 = -n - s / n

    # Apply correction for small sample size
    a2_star = a2 * (1 + 0.75/n + 2.25/n**2)

    # Calculate p-value using asymptotic approximation
    p_value = _ad_p_value_normal(a2_star)

    return {
        'statistic': float(a2_star),
        'p_value': float(p_value),
        'is_normal': p_value >= 0.05,
        'alpha': 0.05
    }
```

**P-value calculation for normal distribution:**

```python
def _ad_p_value_normal(a2_star: float) -> float:
    """
    Calculate p-value for Anderson-Darling test (normal distribution).

    Based on D'Agostino and Stephens (1986) approximation.
    """
    if a2_star >= 0.600:
        p = np.exp(1.2937 - 5.709 * a2_star + 0.0186 * a2_star**2)
    elif a2_star >= 0.340:
        p = np.exp(0.9177 - 4.279 * a2_star - 1.38 * a2_star**2)
    elif a2_star >= 0.200:
        p = 1 - np.exp(-8.318 + 42.796 * a2_star - 59.938 * a2_star**2)
    else:
        p = 1 - np.exp(-13.436 + 101.14 * a2_star - 223.73 * a2_star**2)

    return np.clip(p, 0.0, 1.0)
```

### Normal CDF Implementation

```python
def _normal_cdf(x: np.ndarray) -> np.ndarray:
    """
    Standard normal CDF using error function approximation.

    Uses Abramowitz and Stegun approximation 7.1.26.
    """
    return 0.5 * (1 + _erf(x / np.sqrt(2)))

def _erf(x: np.ndarray) -> np.ndarray:
    """
    Error function approximation (Abramowitz and Stegun 7.1.26).
    Maximum error: 1.5 × 10^-7
    """
    # Constants
    a1, a2, a3, a4, a5 = 0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429
    p = 0.3275911

    sign = np.sign(x)
    x = np.abs(x)

    t = 1.0 / (1.0 + p * x)
    y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * np.exp(-x * x)

    return sign * y
```

### Box-Cox Transformation

```python
def box_cox_transform(values: np.ndarray) -> dict:
    """
    Apply Box-Cox transformation to achieve normality.

    Returns:
        dict: {
            'transformed_values': np.ndarray,
            'lambda': float,
            'shift': float | None,  # If data was shifted to make positive
            'success': bool
        }
    """
    # Handle non-positive values by shifting
    shift = None
    if np.min(values) <= 0:
        shift = abs(np.min(values)) + 1
        values = values + shift

    # Grid search for optimal lambda
    lambdas = np.arange(-2, 2.1, 0.1)
    best_lambda = None
    best_ad = float('inf')
    best_transformed = None

    for lam in lambdas:
        if abs(lam) < 0.01:  # λ ≈ 0 → log transform
            transformed = np.log(values)
        else:
            transformed = (values**lam - 1) / lam

        # Test normality
        ad_result = anderson_darling_normal(transformed)
        if ad_result['statistic'] < best_ad:
            best_ad = ad_result['statistic']
            best_lambda = lam
            best_transformed = transformed

    # Re-test best transformation
    final_result = anderson_darling_normal(best_transformed)

    return {
        'transformed_values': best_transformed,
        'lambda': float(best_lambda),
        'shift': shift,
        'success': final_result['is_normal'],
        'ad_after': final_result['statistic'],
        'p_value_after': final_result['p_value']
    }
```

### Distribution Parameter Estimation

**Weibull MLE (pure Python):**

```python
def fit_weibull(values: np.ndarray) -> dict:
    """
    Fit Weibull distribution using Maximum Likelihood Estimation.

    Weibull PDF: f(x) = (k/λ) * (x/λ)^(k-1) * exp(-(x/λ)^k)
    """
    n = len(values)

    # Initial guess using method of moments
    mean = np.mean(values)
    std = np.std(values)
    cv = std / mean  # Coefficient of variation

    # Approximate k from CV (empirical relationship)
    if cv < 0.3:
        k_init = 4.0
    elif cv < 0.5:
        k_init = 2.5
    else:
        k_init = 1.2

    # Newton-Raphson iteration for k
    k = k_init
    for _ in range(50):  # Max iterations
        xk = values ** k
        log_x = np.log(values)
        xk_log_x = xk * log_x

        f = np.sum(log_x) / n + 1/k - np.sum(xk_log_x) / np.sum(xk)
        f_prime = -1/k**2 - (np.sum(xk * log_x**2) * np.sum(xk) - np.sum(xk_log_x)**2) / np.sum(xk)**2

        k_new = k - f / f_prime
        if abs(k_new - k) < 1e-6:
            break
        k = max(0.1, k_new)  # Keep k positive

    # Calculate scale (λ) from k
    lam = (np.mean(values ** k)) ** (1/k)

    # Calculate AD statistic for this distribution
    # ... (implement Weibull-specific AD test)

    return {
        'distribution': 'weibull',
        'params': {'k': float(k), 'lambda': float(lam)},
        'ad_statistic': None,  # Calculate separately
        'aic': None  # Calculate separately
    }
```

**Lognormal fitting (simpler):**

```python
def fit_lognormal(values: np.ndarray) -> dict:
    """
    Fit Lognormal distribution.

    If X ~ Lognormal(μ, σ), then ln(X) ~ Normal(μ, σ)
    """
    log_values = np.log(values)
    mu = np.mean(log_values)
    sigma = np.std(log_values, ddof=1)

    return {
        'distribution': 'lognormal',
        'params': {'mu': float(mu), 'sigma': float(sigma)},
        'ad_statistic': None,
        'aic': None
    }
```

### PPM Calculation

```python
def calculate_ppm(dist_name: str, params: dict, lei: float, les: float) -> dict:
    """
    Calculate Parts Per Million outside specification limits.

    PPM = (1 - P(LEI < X < LES)) * 1,000,000
    """
    cdf = _get_cdf(dist_name, params)

    p_below_lei = cdf(lei)
    p_above_les = 1 - cdf(les)

    ppm_below = int(round(p_below_lei * 1_000_000))
    ppm_above = int(round(p_above_les * 1_000_000))
    ppm_total = ppm_below + ppm_above

    return {
        'ppm_below_lei': ppm_below,
        'ppm_above_les': ppm_above,
        'ppm_total': ppm_total
    }
```

### Response Structure Update

```python
# In analyze.py - capacidad_proceso response
analysis_output = {
    'results': {
        'basic_statistics': basic_stats,  # From Story 7.1
        'normality': {
            'is_normal': True/False,
            'ad_statistic': float,
            'p_value': float,
            'conclusion': 'Normal' | 'No Normal',
            'transformation': {
                'applied': True/False,
                'type': 'box_cox' | 'johnson' | None,
                'lambda': float | None,
                'params': dict | None,
                'normalized_after': True/False
            } | None,
            'fitted_distribution': {
                'name': str,
                'params': dict,
                'ad_statistic': float,
                'aic': float
            } | None,
            'ppm': {
                'ppm_below_lei': int,
                'ppm_above_les': int,
                'ppm_total': int
            } | None  # Only if spec_limits provided
        },
        'sample_size': int,
        'warnings': list
    },
    'chartData': [],  # Still empty - charts in Epic 8
    'instructions': str  # Updated to include normality interpretation
}
```

### TypeScript Types

```typescript
// In /types/analysis.ts

export interface NormalityTestResult {
  is_normal: boolean;
  ad_statistic: number;
  p_value: number;
  conclusion: 'Normal' | 'No Normal';
}

export interface TransformationResult {
  applied: boolean;
  type: 'box_cox' | 'johnson' | null;
  lambda?: number;
  params?: Record<string, number>;
  normalized_after: boolean;
}

export interface DistributionFitResult {
  name: string;
  params: Record<string, number>;
  ad_statistic: number;
  aic: number;
}

export interface PPMResult {
  ppm_below_lei: number;
  ppm_above_les: number;
  ppm_total: number;
}

export interface NormalityAnalysis {
  is_normal: boolean;
  ad_statistic: number;
  p_value: number;
  conclusion: 'Normal' | 'No Normal';
  transformation?: TransformationResult;
  fitted_distribution?: DistributionFitResult;
  ppm?: PPMResult;
}

// Update CapacidadProcesoResult
export interface CapacidadProcesoResult {
  basic_statistics: CapacidadProcesoBasicStats;
  normality: NormalityAnalysis;  // NEW
  sample_size: number;
  warnings: string[];
}
```

### Test Data for Validation

**Minitab comparison data for Anderson-Darling:**

```python
# Known normal data - should pass (p > 0.05)
normal_data = [99.2, 101.5, 98.7, 100.3, 99.8, 101.2, 100.1, 99.5, 100.8, 99.0,
               100.5, 98.9, 101.0, 99.7, 100.2, 99.3, 100.6, 98.8, 101.1, 99.6]
# Expected: A² ≈ 0.2-0.3, p-value > 0.5

# Known non-normal data (right-skewed) - should fail
skewed_data = [1.2, 1.5, 1.8, 2.3, 2.9, 3.5, 4.2, 5.1, 6.3, 8.0,
               10.5, 14.0, 19.0, 25.0, 35.0]
# Expected: A² > 0.7, p-value < 0.05
```

### Previous Story Learnings (Story 7.1)

From the previous story implementation:

1. **Follow validator/calculator patterns exactly** - see `capacidad_proceso_validator.py` and `capacidad_proceso_calculator.py`
2. **Use existing error response patterns** - `{'code': str, 'message': str, 'details': list}`
3. **Spanish error messages** - All user-facing messages in Spanish
4. **Test coverage** - Story 7.1 added 60 tests; maintain this level
5. **Pure Python constraint** - numpy is OK, scipy is NOT

### Git Intelligence

Recent relevant commits:
- `804e9dc`: Fixed numeric display - precision matters in statistical output
- No recent scipy usage - confirms pure Python approach

### File Structure

```
api/
├── analyze.py                           # UPDATE: Add normality to response
├── utils/
│   ├── capacidad_proceso_validator.py   # Exists from Story 7.1
│   ├── capacidad_proceso_calculator.py  # UPDATE: Add normality analysis
│   ├── normality_tests.py               # NEW: AD test, Box-Cox, Johnson
│   └── distribution_fitting.py          # NEW: Distribution fitting + PPM
└── tests/
    ├── test_capacidad_proceso_validator.py
    ├── test_capacidad_proceso_calculator.py
    ├── test_normality_tests.py          # NEW
    └── test_distribution_fitting.py     # NEW
```

### Critical Constraints

1. **Pure Python ONLY** - scipy is forbidden due to Vercel size limits
2. **Minitab accuracy (±0.01)** - p-values must match Minitab within 0.01
3. **Handle edge cases** - Small samples, negative values, zero variance
4. **Spanish messages** - All conclusions and interpretations in Spanish

### Dependencies

**Existing (no new dependencies):**
- numpy>=1.24.0
- pandas>=2.0.0

### Out of Scope for Story 7.2

These features are covered in later stories:
- I-MR control charts (Story 7.3)
- Stability rules evaluation (Story 7.3)
- Cp/Cpk/Pp/Ppk indices (Story 7.4)
- Chart components (Epic 8)
- SpecLimitsForm component (Epic 8)

### Project Structure Notes

**Files to create:**
- `/api/utils/normality_tests.py` - Anderson-Darling, Box-Cox, Johnson
- `/api/utils/distribution_fitting.py` - Distribution fitting + PPM
- `/api/tests/test_normality_tests.py` - Normality tests
- `/api/tests/test_distribution_fitting.py` - Distribution fitting tests

**Files to modify:**
- `/api/utils/capacidad_proceso_calculator.py` - Add normality analysis integration
- `/api/analyze.py` - Update response structure for normality
- `/types/analysis.ts` - Add normality-related types
- `/constants/messages.ts` - Add normality-related Spanish messages

### References

- [Source: epics.md#story-72-normality-testing-distribution-fitting] - Story requirements
- [Source: prd-v2.md#requisitos-funcionales-capacidad-de-proceso] - FR-CP12, FR-CP13, FR-CP18
- [Source: architecture.md#pure-python-statistical-implementation] - No scipy constraint
- [Source: 7-1-file-validation-basic-statistics-calculator.md] - Previous story patterns
- [Source: api/utils/capacidad_proceso_calculator.py] - Calculator pattern reference
- [Source: api/utils/msa_calculator.py] - Pure Python F-distribution reference

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No debugging issues encountered

### Completion Notes List

1. **Task 1-3 (Normality Tests Module):** Created `/api/utils/normality_tests.py` with Anderson-Darling test, Box-Cox transformation, and Johnson SU transformation - all pure Python/numpy implementations. D'Agostino-Stephens approximation used for p-value calculation to match Minitab accuracy.

2. **Task 4-5 (Distribution Fitting Module):** Created `/api/utils/distribution_fitting.py` with MLE-based fitting for Weibull, Lognormal, Gamma, Exponential, Logistic, and Extreme Value (Gumbel) distributions. Implemented pure Python CDFs including regularized incomplete gamma function for Gamma distribution. PPM calculation supports all distribution types.

3. **Task 6 (Calculator Integration):** Updated `capacidad_proceso_calculator.py` with `perform_normality_analysis()` wrapper function that orchestrates the full normality workflow: AD test → Box-Cox → Johnson → Distribution Fitting → PPM calculation. Added `generate_normality_instructions()` for Spanish markdown output.

4. **Task 7 (API Integration):** Updated `analyze.py` to include spec_limits handling and normality analysis in capacidad_proceso response. Edge case handled: empty/insufficient data (< 2 values) skips normality analysis gracefully.

5. **Task 8 (TypeScript Types):** Added `NormalityTestResult`, `TransformationResult`, `DistributionFitResult`, `PPMResult`, `NormalityAnalysis`, and `SpecLimits` interfaces to `/types/analysis.ts`. Updated `CapacidadProcesoResult` with optional `normality` property.

6. **Task 9 (Unit Tests):** Created 114 new tests across `test_normality_tests.py` (53 tests) and `test_distribution_fitting.py` (61 tests). All tests pass. Full regression suite (201 related tests) passes.

7. **Code Review Fixes:** Added 13 integration tests for `perform_normality_analysis()` in `test_capacidad_proceso_calculator.py`. Fixed numerical stability in gamma CDF (added parameter validation and overflow protection). Fixed Weibull fitting fallback to use filtered positive data. Documented Johnson transform grid search limitation in docstring. Updated File List to include all modified files.

### File List

**New Files:**
- api/utils/normality_tests.py
- api/utils/distribution_fitting.py
- api/tests/test_normality_tests.py
- api/tests/test_distribution_fitting.py

**Modified Files:**
- api/utils/capacidad_proceso_calculator.py
- api/analyze.py
- api/tests/test_analyze.py
- types/analysis.ts
- constants/analysis.ts
- constants/messages.ts
- constants/templates.ts

## Change Log

| Date | Change |
|------|--------|
| 2026-02-20 | Story 7.2 implementation complete - Normality testing (Anderson-Darling), Box-Cox/Johnson transformations, distribution fitting (6 distributions), PPM calculation, all pure Python/numpy |
| 2026-02-20 | Code review fixes: Updated File List, added 13 integration tests for perform_normality_analysis, fixed numerical stability in gamma CDF, fixed Weibull fallback edge case, documented Johnson transform limitation |
