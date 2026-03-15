# Story 12.2: Sample Size Calculator & Sensitivity Engine

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want the system to calculate my minimum sample size accurately with sensitivity analysis,
so that I know exactly how many measurements to collect and how the result changes under different assumptions.

## Acceptance Criteria

1. **Given** delta=0.4, sigma=0.6, alpha=0.05, power=0.80, alternative_hypothesis='two-sided'
   **When** the sample size calculator runs
   **Then** n_per_group = 36 (bilateral formula: n = ceil(((Z_{alpha/2} + Z_beta)^2 * 2*sigma^2) / delta^2))
   **And** z_alpha = 1.96 (Z_0.025), z_beta = 0.842 (Z_0.20)
   **And** the result matches Minitab/G*Power for the same inputs

2. **Given** delta=0.4, sigma=0.6, alpha=0.05, power=0.80, alternative_hypothesis='greater'
   **When** the sample size calculator runs
   **Then** it uses the unilateral formula (Z_alpha instead of Z_{alpha/2})
   **And** n_per_group is smaller than the bilateral case
   **And** the result matches Minitab/G*Power for the same inputs

3. **Given** any valid set of parameters
   **When** the calculator computes n
   **Then** the result is always rounded UP (ceiling) to the next integer
   **And** the result is explicitly labeled as "per group" in the instructions

4. **Given** n_per_group = 36 (>= 30)
   **When** the classification runs
   **Then** category = "adequate", message indicates TCL applies and t-test is robust

5. **Given** n_per_group = 22 (15 <= n < 30)
   **When** the classification runs
   **Then** category = "verify_normality", message indicates normality verification needed

6. **Given** n_per_group = 8 (< 15)
   **When** the classification runs
   **Then** category = "weak", message warns sample may be insufficient

7. **Given** base parameters delta=0.4, sigma=0.6, power=0.80
   **When** sensitivity analysis runs
   **Then** it computes at least 3 alternative scenarios:
      - delta_half: delta=0.2 -> n increases significantly
      - power_90: power=0.90 -> n increases moderately
      - sigma_double: sigma=1.2 -> n increases significantly
   **And** each scenario includes: scenario name, label, changed parameters, computed n_per_group

8. **Given** any valid parameters
   **When** the calculator produces output
   **Then** the response structure is: `{ results: { input_parameters, sample_size, classification, sensitivity }, chartData: [], instructions: "..." }`
   **And** `instructions` is a markdown string with 5 parts: parameters table, result, evaluation, sensitivity table, recommendations
   **And** all text in `instructions` is in Spanish

9. **Given** any valid parameters
   **When** the full calculation (base + 3 sensitivity scenarios) executes
   **Then** it completes in under 5 seconds

10. **Given** delta=0 is provided
    **When** the calculator validates inputs
    **Then** it returns an error: "La diferencia (delta) no puede ser cero"

11. **Given** sigma=0 or sigma < 0 is provided
    **When** the calculator validates inputs
    **Then** it returns an error: "La variabilidad (sigma) debe ser mayor que cero"

12. **Given** parameters that produce n=1 or n=2
    **When** the calculator returns results
    **Then** the classification is "weak" with additional warning about insufficient sample size

13. **Given** a very small delta with large sigma (e.g., delta=0.01, sigma=10)
    **When** the calculator returns results
    **Then** the instructions include a warning that the required n may not be practical

## Tasks / Subtasks

- [x] Task 1: Create `api/utils/tamano_muestra_calculator.py` (AC: 1,2,3,4,5,6,7,8,10,11,12,13)
  - [x] 1.1 Implement `calculate_sample_size(delta, sigma, alpha, power, alternative_hypothesis)` returning n_per_group, z_alpha, z_beta
  - [x] 1.2 Implement `classify_sample_size(n_per_group)` returning category + message in Spanish
  - [x] 1.3 Implement `run_sensitivity_analysis(delta, sigma, alpha, power, alternative_hypothesis)` with 3 scenarios
  - [x] 1.4 Implement `_generate_instructions(input_params, sample_size, classification, sensitivity)` -> Spanish markdown with 5 parts
  - [x] 1.5 Implement main orchestrator `calculate_tamano_muestra(params)` returning full response dict
  - [x] 1.6 Add edge-case handling: n<=2 warning, impractical n warning (n > 1000)
- [x] Task 2: Integrate calculator into `api/analyze.py` (AC: 8)
  - [x] 2.1 Replace placeholder response (lines 296-301) with call to `calculate_tamano_muestra`
  - [x] 2.2 Pass optional `current_mean` and `expected_mean` from request body
- [x] Task 3: Create `api/tests/test_tamano_muestra_calculator.py` (AC: 1,2,3,4,5,6,7,9,10,11,12,13)
  - [x] 3.1 Test bilateral formula with known values (delta=0.4, sigma=0.6, alpha=0.05, power=0.80 -> n=36)
  - [x] 3.2 Test unilateral formula produces smaller n than bilateral
  - [x] 3.3 Test all three classification categories
  - [x] 3.4 Test sensitivity analysis produces 3 scenarios with correct parameter changes
  - [x] 3.5 Test instructions contain all 5 Spanish sections
  - [x] 3.6 Test edge cases: very small delta/large sigma, n<=2 results
  - [x] 3.7 Test response structure matches expected schema
  - [x] 3.8 Test performance: full calculation < 5 seconds
- [x] Task 4: Verify integration end-to-end (AC: 8,9)
  - [x] 4.1 Run all existing tests to confirm no regressions
  - [x] 4.2 Run new tamano_muestra tests
  - [x] 4.3 Verify TypeScript build still passes (no TS changes needed in this story)

## Dev Notes

### Critical Constraints

- **NO SCIPY** — Vercel 250MB deployment limit. Use `norm_ppf` from `api/utils/stats_common.py` (Abramowitz & Stegun, accuracy ~4.5e-4). This is accurate enough to match Minitab/G*Power results after ceiling rounding.
- **Pure Python + NumPy only** — dependencies are: pandas, numpy, openpyxl, supabase. No new deps.
- **All user-facing text in Spanish** — error messages, classification messages, instructions markdown.
- **chartData is empty array** — this is a text-only analysis, no visualization. Return `chartData: []` (not null).

### Formulas

**Bilateral (two-sided):**
```
z_alpha = norm_ppf(1 - alpha/2)   # e.g., alpha=0.05 -> norm_ppf(0.975) = 1.96
z_beta  = norm_ppf(1 - (1-power)) # i.e., norm_ppf(power), e.g., power=0.80 -> norm_ppf(0.80) = 0.842
n = ceil(((z_alpha + z_beta)^2 * 2 * sigma^2) / delta^2)
```

**Unilateral (greater or less):**
```
z_alpha = norm_ppf(1 - alpha)     # e.g., alpha=0.05 -> norm_ppf(0.95) = 1.645
z_beta  = norm_ppf(power)         # same as bilateral
n = ceil(((z_alpha + z_beta)^2 * 2 * sigma^2) / delta^2)
```

**Verification values (bilateral, alpha=0.05, power=0.80, delta=0.4, sigma=0.6):**
- z_alpha = norm_ppf(0.975) = 1.9600
- z_beta = norm_ppf(0.80) = 0.8416
- numerator = (1.96 + 0.8416)^2 * 2 * 0.36 = 7.8533 * 0.72 = 5.6544
- denominator = 0.16
- n = ceil(5.6544 / 0.16) = ceil(35.34) = 36

### Classification Thresholds

| n_per_group | category | Spanish message |
|---|---|---|
| >= 30 | "adequate" | "Tamaño adecuado. El Teorema Central del Limite aplica; el t-test será robusto ante desviaciones leves de normalidad." |
| 15-29 | "verify_normality" | "Tamaño moderado. Se requerirá verificación de normalidad al ejecutar el test de hipótesis." |
| < 15 | "weak" | "Tamaño pequeño. La muestra puede ser insuficiente y el poder real podría ser inestable. Considere aumentar el tamaño si es posible." |

Additional warning for n <= 2: "Advertencia: un tamaño de muestra de {n} por grupo es extremadamente pequeño y los resultados no serán confiables."

### Sensitivity Scenarios

| Scenario Key | Label (Spanish) | Changed Parameter | Description |
|---|---|---|---|
| "base" | "Escenario base" | (none) | Original parameters |
| "delta_half" | "Delta reducida a la mitad" | delta = delta * 0.5 | Shows impact of detecting smaller differences |
| "power_90" | "Poder aumentado a 90%" | power = 0.90 | Shows cost of higher detection probability |
| "sigma_double" | "Variabilidad duplicada" | sigma = sigma * 2 | Shows impact of higher process variability |

### Response Structure

```python
{
    "results": {
        "input_parameters": {
            "delta": 0.4,
            "sigma": 0.6,
            "alpha": 0.05,
            "power": 0.80,
            "alternative_hypothesis": "two-sided",
            "current_mean": 15.2,    # optional, may be None
            "expected_mean": 14.8    # optional, may be None
        },
        "sample_size": {
            "n_per_group": 36,
            "z_alpha": 1.96,
            "z_beta": 0.842,
            "formula_used": "bilateral"  # or "unilateral"
        },
        "classification": {
            "category": "adequate",  # "adequate" | "verify_normality" | "weak"
            "message": "Tamaño adecuado. El Teorema Central del Limite aplica..."
        },
        "sensitivity": [
            {
                "scenario": "base",
                "label": "Escenario base",
                "parameters": {"delta": 0.4, "sigma": 0.6, "alpha": 0.05, "power": 0.80},
                "n_per_group": 36
            },
            {
                "scenario": "delta_half",
                "label": "Delta reducida a la mitad",
                "parameters": {"delta": 0.2, "sigma": 0.6, "alpha": 0.05, "power": 0.80},
                "n_per_group": 143
            },
            {
                "scenario": "power_90",
                "label": "Poder aumentado a 90%",
                "parameters": {"delta": 0.4, "sigma": 0.6, "alpha": 0.05, "power": 0.90},
                "n_per_group": 48
            },
            {
                "scenario": "sigma_double",
                "label": "Variabilidad duplicada",
                "parameters": {"delta": 0.4, "sigma": 1.2, "alpha": 0.05, "power": 0.80},
                "n_per_group": 143
            }
        ]
    },
    "chartData": [],
    "instructions": "# Resultado del Calculo de Tamano de Muestra\n\n..."
}
```

### Instructions Markdown Template (5 Parts)

The `instructions` string must follow this structure (all in Spanish):

```markdown
<!-- AGENT_ONLY: Present these results following the 5-part structure below -->

## Parametros Utilizados

| Parametro | Valor |
|---|---|
| Media actual estimada | {current_mean or 'No especificada'} |
| Media esperada | {expected_mean or 'No especificada'} |
| Diferencia minima relevante (Delta) | {delta} |
| Desviacion estandar estimada (Sigma) | {sigma} |
| Nivel de significancia (Alpha) | {alpha} |
| Poder estadistico | {power} |
| Tipo de test | {Bilateral / Unilateral} |

## Resultado

**Tamano de muestra minimo: {n_per_group} por grupo**

Formula utilizada: {bilateral_or_unilateral_formula_description}

> Esto significa que necesita recolectar al menos **{n_per_group} mediciones del grupo A** y **{n_per_group} mediciones del grupo B**.

## Evaluacion

{classification_message}

{additional_warnings_if_any}

## Analisis de Sensibilidad

| Escenario | Parametro modificado | Valor | n por grupo |
|---|---|---|---|
| Escenario base | - | - | {base_n} |
| Delta reducida | Delta = {delta/2} | {delta*0.5} | {scenario_n} |
| Poder 90% | Poder = 0.90 | 0.90 | {scenario_n} |
| Variabilidad x2 | Sigma = {sigma*2} | {sigma*2} | {scenario_n} |

## Recomendaciones

{dynamic_recommendations_based_on_results}
```

### Recommendations Logic

Generate recommendations dynamically based on results:
- If n < 15: "Considere aumentar el tamano de muestra para obtener resultados mas confiables."
- If n >= 30: "El tamano calculado es adecuado para aplicar el t-test sin preocuparse por la normalidad."
- Always include: "Verifique la estabilidad del proceso antes de recolectar los datos."
- Always include: "Una vez recolectados los datos, puede utilizar el analisis 'Test de Hipotesis: 2 Muestras' para ejecutar la prueba."
- If sensitivity shows large n for delta_half: "Si necesita detectar diferencias mas pequenas ({delta/2}), el tamano requerido aumenta a {n_delta_half} por grupo."
- If n > 1000: "Advertencia: el tamano de muestra calculado ({n}) es muy grande y podria no ser practico. Considere si el delta elegido es realista."

### File to Create

**`api/utils/tamano_muestra_calculator.py`** — follow the pattern of `hipotesis_2_muestras_calculator.py`:
- Import `norm_ppf` from `api.utils.stats_common`
- Import `math.ceil` for rounding
- Import `numpy as np` only if needed (likely not needed — pure math.ceil and norm_ppf suffice)
- Main function signature: `calculate_tamano_muestra(delta, sigma, alpha, power, alternative_hypothesis, current_mean=None, expected_mean=None) -> dict`
- Internal helper functions for each sub-calculation
- All rounding to 4 decimal places for z-scores (use `round(val, 4)`)

### File to Modify

**`api/analyze.py`** — lines 296-301:
Replace placeholder:
```python
# Placeholder response — real calculator in Story 12.2
analysis_output = {
    'results': {},
    'chartData': [],
    'instructions': '',
}
```
With:
```python
from api.utils.tamano_muestra_calculator import calculate_tamano_muestra
# ... (import at top of file)

current_mean = body.get('current_mean')
expected_mean = body.get('expected_mean')
if current_mean is not None:
    current_mean = float(current_mean)
if expected_mean is not None:
    expected_mean = float(expected_mean)

analysis_output = calculate_tamano_muestra(
    delta=delta,
    sigma=sigma,
    alpha=alpha,
    power=power,
    alternative_hypothesis=alt_hyp,
    current_mean=current_mean,
    expected_mean=expected_mean,
)
```

### Project Structure Notes

- Calculator goes in `api/utils/tamano_muestra_calculator.py` — consistent with `msa_calculator.py`, `capacidad_proceso_calculator.py`, `hipotesis_2_muestras_calculator.py`
- Tests go in `api/tests/test_tamano_muestra_calculator.py` — consistent with existing test files
- No new TypeScript files needed (types, constants, tool params already set up in Story 12-1)
- No new npm dependencies
- No new Python dependencies
- No database changes needed (migration already done in Story 12-1)

### Previous Story Intelligence (12-1)

Key learnings from Story 12-1:
- `norm_ppf` is in `api/utils/stats_common.py` and tested with 11 tests. Import as: `from api.utils.stats_common import norm_ppf`
- `save_analysis_results` already handles `file_id=None` (updated in 12-1)
- `analyze.py` already validates all tamano_muestra params with Spanish errors
- TypeScript types `TamanoMuestraResult` and constant `ANALYSIS_TYPES.TAMANO_MUESTRA` already exist
- `tools.ts` already has all params (delta, sigma, alpha, power, alternative_hypothesis, current_mean, expected_mean)
- `app/api/chat/route.ts` already builds sampleSizeParams and passes to invokeAnalysisTool
- Code review found and fixed: stale docstrings, double-set params, non-null assertions, debug logging issues
- All 70 existing tests pass post-12-1

### Git Intelligence

Recent commit patterns:
- Conventional commits: `feat:` for new features, `fix:` for fixes
- Each feature touches full stack but this story is **Python-only** (calculator + tests + analyze.py integration)
- Co-Authored-By: Claude Opus 4.6 in commits
- Recent work (Epics 9-11) established patterns for calculators, validators, chart components

### Testing Standards

- Python tests use `unittest` with `python3 -m pytest api/tests/`
- Test file naming: `test_tamano_muestra_calculator.py`
- Test class naming: `TestCalculateSampleSize`, `TestClassifySampleSize`, `TestSensitivityAnalysis`, `TestInstructions`, `TestEdgeCases`
- Use `assertAlmostEqual` for floating point comparisons
- Test known statistical values against reference (Minitab/G*Power)
- Run all tests after implementation: `python3 -m pytest api/tests/ -v`

### References

- [Source: _bmad-output/planning-artifacts/prd-v5.md#FR-TM8-FR-TM15] — Calculation formulas, classification, sensitivity, presentation
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-12-Story-12.2] — Acceptance criteria and NFRs
- [Source: _bmad-output/planning-artifacts/architecture.md#Python-Analysis-Endpoint] — Response format, constraints
- [Source: api/utils/stats_common.py] — norm_ppf function to import
- [Source: api/utils/hipotesis_2_muestras_calculator.py] — Pattern reference for calculator structure
- [Source: api/analyze.py#L296-L301] — Placeholder to replace
- [Source: _bmad-output/implementation-artifacts/12-1-architecture-foundation-file-id-optional-shared-stats-module.md] — Previous story learnings

## Change Log

- 2026-03-14: Implemented sample size calculator with sensitivity analysis, classification, and Spanish instructions. Integrated into analyze.py replacing placeholder. 40 new tests added, all passing. Updated existing test_analyze.py placeholder test to validate real calculator results.
- 2026-03-14: Code review fixes — removed duplicate n<=2 and n>1000 warnings in instructions, fixed vacuous test_n_equals_2_classification test, added error handling for current_mean/expected_mean float conversion in analyze.py, added power_95 fallback when user power is already 0.90. 2 new tests added (42 total).

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

No blocking issues encountered during implementation.

### Completion Notes List

- Created `api/utils/tamano_muestra_calculator.py` with 5 functions: `calculate_sample_size`, `classify_sample_size`, `run_sensitivity_analysis`, `_generate_instructions`, `calculate_tamano_muestra`
- Bilateral formula verified: delta=0.4, sigma=0.6, alpha=0.05, power=0.80 -> n=36 (matches Minitab/G*Power)
- Unilateral formula produces smaller n than bilateral (verified)
- Classification thresholds: adequate (>=30), verify_normality (15-29), weak (<15) with n<=2 additional warning
- Sensitivity analysis: 4 scenarios (base + delta_half + power_90 + sigma_double)
- Instructions in Spanish with 5 parts: Parameters, Result, Evaluation, Sensitivity, Recommendations
- Edge cases: delta=0 ValueError, sigma<=0 ValueError, n>1000 impractical warning
- Integrated into `api/analyze.py` replacing placeholder (import + calculator call with optional means)
- Updated `api/tests/test_analyze.py` to validate real calculator results instead of empty placeholder
- 42 new tests: all pass in 0.06s (well under 5s performance requirement)
- 671/675 total tests pass (4 pre-existing MSA chart data failures unrelated to this story)
- TypeScript build: pre-existing test-only errors, no new issues introduced
- No new dependencies added (pure Python + math.ceil + norm_ppf from stats_common)

### File List

- api/utils/tamano_muestra_calculator.py (new)
- api/tests/test_tamano_muestra_calculator.py (new)
- api/analyze.py (modified - import + replaced placeholder with calculator call)
- api/tests/test_analyze.py (modified - updated placeholder test to validate real results)
