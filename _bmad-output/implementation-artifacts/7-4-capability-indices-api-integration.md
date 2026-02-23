# Story 7.4: Capability Indices & API Integration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **capability indices calculated and results returned through the API**,
So that **I receive a complete analysis with Cp, Cpk, Pp, Ppk metrics**.

**FRs covered:** FR-CP17, FR-CP19

**NFRs addressed:** NFR-CP2, NFR-CP3, NFR-CP4

## Acceptance Criteria

1. **Given** LEI (lower spec) and LES (upper spec) are provided, **When** capability indices are calculated, **Then** the system computes:
   - Cp = (LES - LEI) / (6σ) — using within-subgroup std dev (from MR̄/d2)
   - Cpk = min[(LES - μ) / 3σ, (μ - LEI) / 3σ]
   - Pp = (LES - LEI) / (6s) — using overall sample std dev
   - Ppk = min[(LES - μ) / 3s, (μ - LEI) / 3s]
   **And** if data is non-normal with fitted distribution, indices use distribution-based calculations

2. **Given** capability indices are calculated, **When** classification is determined, **Then** the system classifies based on Cpk:
   - Cpk ≥ 1.33 → "Capaz" (green)
   - 1.00 ≤ Cpk < 1.33 → "Marginalmente Capaz" (yellow)
   - Cpk < 1.00 → "No Capaz" (red)

3. **Given** the API endpoint receives a capacidad_proceso request, **When** `/api/analyze.py` routes the request, **Then** `analysis_type='capacidad_proceso'` is recognized and routed to the calculator **And** the response includes `{ results, chartData, instructions }` **And** raw data is NEVER included in the response (only aggregated results) **And** analysis completes in < 30 seconds for up to 1000 rows

4. **Given** the instructions field is generated, **When** the markdown is created, **Then** it includes three sections:
   1. **Análisis Técnico:** tables of statistics, normality result, control limits, rule evaluations, capability indices
   2. **Conclusión Ejecutiva:** stable/unstable, capable/not capable, normal/not normal
   3. **Conclusión "Terrenal":** plain-language explanation and specific recommendations

## Tasks / Subtasks

- [x] **Task 1: Create Capability Indices Module** (AC: #1)
  - [x] Create `/api/utils/capability_indices.py` module
  - [x] Implement `calculate_sigma_within(mr_bar: float) -> float` function
    - [x] Calculate σ_within = MR̄ / d2 where d2 = 1.128 (for n=2)
    - [x] Return within-subgroup standard deviation
  - [x] Implement `calculate_sigma_overall(values: np.ndarray) -> float` function
    - [x] Calculate overall sample standard deviation using np.std(ddof=1)
    - [x] Return overall standard deviation
  - [x] Implement `calculate_cp(lei: float, les: float, sigma: float) -> float` function
    - [x] Cp = (LES - LEI) / (6 × σ_within)
    - [x] Handle edge case: if σ ≤ 0, return None or infinity marker
  - [x] Implement `calculate_cpk(mean: float, lei: float, les: float, sigma: float) -> float` function
    - [x] Cpu = (LES - μ) / (3 × σ)
    - [x] Cpl = (μ - LEI) / (3 × σ)
    - [x] Cpk = min(Cpu, Cpl)
    - [x] Handle edge case: if σ ≤ 0, return None
  - [x] Implement `calculate_pp(lei: float, les: float, sigma_overall: float) -> float` function
    - [x] Pp = (LES - LEI) / (6 × σ_overall)
  - [x] Implement `calculate_ppk(mean: float, lei: float, les: float, sigma_overall: float) -> float` function
    - [x] Ppu = (LES - μ) / (3 × σ_overall)
    - [x] Ppl = (μ - LEI) / (3 × σ_overall)
    - [x] Ppk = min(Ppu, Ppl)

- [x] **Task 2: Implement Specification Limit Validation** (AC: #1)
  - [x] Implement `validate_spec_limits(lei: float, les: float) -> dict` function
    - [x] Check that both LEI and LES are provided (not None)
    - [x] Check that LEI < LES
    - [x] Check that both are finite numbers (not NaN, not inf)
    - [x] Return `{'valid': bool, 'errors': list[str]}`
  - [x] Add Spanish error messages for validation failures:
    - [x] "Se requiere el Límite de Especificación Inferior (LEI)"
    - [x] "Se requiere el Límite de Especificación Superior (LES)"
    - [x] "El LEI ({lei}) debe ser menor que el LES ({les})"
    - [x] "LEI y LES deben ser valores numéricos válidos"

- [x] **Task 3: Implement Capability Classification** (AC: #2)
  - [x] Implement `classify_capability(cpk: float) -> dict` function
    - [x] If Cpk ≥ 1.33 → `{'classification': 'Capaz', 'color': 'green', 'level': 'adequate'}`
    - [x] If 1.00 ≤ Cpk < 1.33 → `{'classification': 'Marginalmente Capaz', 'color': 'yellow', 'level': 'marginal'}`
    - [x] If Cpk < 1.00 → `{'classification': 'No Capaz', 'color': 'red', 'level': 'inadequate'}`
    - [x] Handle None/NaN Cpk gracefully
  - [x] Implement same classification for Ppk
  - [x] Add capability interpretation constants in Python:
    - [x] CAPABILITY_THRESHOLD_EXCELLENT = 1.67
    - [x] CAPABILITY_THRESHOLD_ADEQUATE = 1.33
    - [x] CAPABILITY_THRESHOLD_MARGINAL = 1.00

- [x] **Task 4: Create Capability Wrapper Function** (AC: #1, #3)
  - [x] Implement `calculate_capability_indices(values: np.ndarray, lei: float, les: float, stability_result: dict) -> dict` main function
    - [x] Validate specification limits
    - [x] Extract mean from values
    - [x] Extract sigma_within from stability_result (MR̄/d2)
    - [x] Calculate sigma_overall from values
    - [x] Calculate Cp, Cpk using sigma_within
    - [x] Calculate Pp, Ppk using sigma_overall
    - [x] Classify Cpk and Ppk
    - [x] Calculate expected defects (PPM) using normal assumption or fitted distribution
  - [x] Return comprehensive result dict:
    ```python
    {
        'cp': float | None,
        'cpk': float | None,
        'pp': float | None,
        'ppk': float | None,
        'cpu': float | None,  # Upper capability
        'cpl': float | None,  # Lower capability
        'ppu': float | None,  # Upper performance
        'ppl': float | None,  # Lower performance
        'sigma_within': float,
        'sigma_overall': float,
        'lei': float,
        'les': float,
        'mean': float,
        'cpk_classification': {
            'classification': str,
            'color': str,
            'level': str
        },
        'ppk_classification': {
            'classification': str,
            'color': str,
            'level': str
        },
        'ppm': {
            'ppm_below_lei': int,
            'ppm_above_les': int,
            'ppm_total': int
        }
    }
    ```

- [x] **Task 5: Handle Non-Normal Distribution Capability** (AC: #1)
  - [x] Implement `calculate_capability_non_normal(values: np.ndarray, lei: float, les: float, fitted_dist: dict) -> dict`
    - [x] Use fitted distribution from normality analysis
    - [x] Calculate percentile-based Ppk: Ppk = min[(P99.865 - median) / (P99.865 - P50), (median - P0.135) / (P50 - P0.135)]
    - [x] Alternative: Use Z-bench calculation from PPM
    - [x] Return indices with flag `'method': 'non_normal'`
  - [x] Add documentation note: "When data is non-normal, capability indices are estimated using the fitted distribution"

- [x] **Task 6: Generate Capability Instructions Markdown** (AC: #4)
  - [x] Implement `generate_capability_instructions(capability_result: dict) -> str` function
    - [x] Generate specification limits display
    - [x] Generate capability indices table (Cp, Cpk, Pp, Ppk)
    - [x] Generate one-sided indices table (Cpu, Cpl, Ppu, Ppl)
    - [x] Generate classification with color emoji (🟢🟡🔴)
    - [x] Generate sigma values table (within vs overall)
    - [x] Generate PPM breakdown (below LEI, above LES, total)
  - [x] Add interpretation guidance based on classification

- [x] **Task 7: Generate Three-Part Interpretation Markdown** (AC: #4)
  - [x] Implement `generate_full_interpretation(results: dict) -> str` function that includes:
    - [x] **Part 1 - Análisis Técnico:**
      - [x] Basic statistics table
      - [x] Normality test results
      - [x] Stability analysis (control limits, rules)
      - [x] Capability indices tables
    - [x] **Part 2 - Conclusión Ejecutiva:**
      - [x] Stability conclusion (Estable/Inestable)
      - [x] Normality conclusion (Normal/No Normal)
      - [x] Capability conclusion (Capaz/Marginalmente Capaz/No Capaz)
      - [x] Key metric summary
    - [x] **Part 3 - Conclusión Terrenal:**
      - [x] Plain language explanation of what the numbers mean
      - [x] Specific recommendations based on results
      - [x] Action items prioritized by impact

- [x] **Task 8: Integrate Capability into Calculator** (AC: #3)
  - [x] Update `/api/utils/capacidad_proceso_calculator.py`
  - [x] Import `calculate_capability_indices` from capability_indices
  - [x] Update `build_capacidad_proceso_output()`:
    - [x] Check if spec_limits provided
    - [x] If yes, call `calculate_capability_indices(values, lei, les, stability_result)`
    - [x] Add `'capability': capability_result` to results dict
    - [x] Generate capability instructions and append to markdown
  - [x] Update function signature: `build_capacidad_proceso_output(values, spec_limits=None)`

- [x] **Task 9: Update analyze.py Response Structure** (AC: #3)
  - [x] Update capacidad_proceso routing in analyze.py
  - [x] Extract spec_limits from request body if present
  - [x] Pass spec_limits to calculator
  - [x] Ensure response structure includes capability results
  - [x] Verify raw data is NOT included in response
  - [x] Add performance check: ensure < 30s for 1000 rows

- [x] **Task 10: Update TypeScript Types** (AC: #1, #2, #3)
  - [x] Add to `/types/analysis.ts`:
    - [x] `CapabilityIndices` interface
    - [x] `CapabilityClassification` interface
    - [x] `PPMBreakdown` interface
    - [x] `CapabilityAnalysisResult` interface
  - [x] Update `CapacidadProcesoResult` to include optional `capability` property
  - [x] Add `spec_limits` to request types if not present

- [x] **Task 11: Add Spanish Messages for Capability** (AC: #2, #4)
  - [x] Add to `/constants/messages.ts`:
    - [x] `CAPABILITY_CLASSIFICATIONS` - Spanish descriptions
    - [x] `CAPABILITY_INTERPRETATIONS` - Contextual guidance
    - [x] `CAPABILITY_RECOMMENDATIONS` - Action items per level

- [x] **Task 12: Add Capability Constants** (AC: #2)
  - [x] Add to `/constants/analysis.ts`:
    - [x] `CAPABILITY_THRESHOLDS` - { excellent: 1.67, adequate: 1.33, marginal: 1.00 }
    - [x] `D2_CONSTANT` = 1.128 (for n=2 moving range)
    - [x] Add reference documentation for constants source

- [x] **Task 13: Write Unit Tests** (AC: #1, #2, #3, #4)
  - [x] Create `/api/tests/test_capability_indices.py`
    - [x] Test Cp calculation with known values
    - [x] Test Cpk calculation (both sides balanced, Cpu limited, Cpl limited)
    - [x] Test Pp calculation with overall std dev
    - [x] Test Ppk calculation
    - [x] Test spec limit validation (valid, LEI > LES, missing limits)
    - [x] Test classification thresholds (exactly at boundaries)
    - [x] Test with zero sigma (edge case)
    - [x] Test with data exactly at spec limits
    - [x] Test non-normal capability calculation
    - [x] Test PPM calculation accuracy
  - [x] Update `/api/tests/test_capacidad_proceso_calculator.py`
    - [x] Test capability integration with full workflow
    - [x] Test without spec limits (capability section absent)
    - [x] Test with spec limits (capability section present)
  - [x] Update `/api/tests/test_analyze.py`
    - [x] Test endpoint with spec_limits parameter
    - [x] Test endpoint without spec_limits parameter
    - [x] Test response structure includes all required fields

## Dev Notes

### Critical Architecture Patterns

**Follow existing module patterns exactly - this is Story 7.4 completing the Capacidad de Proceso series:**

1. **Module Pattern** (see `normality_tests.py`, `stability_analysis.py`):
   - Pure Python with numpy only (NO scipy)
   - Functions return structured dicts
   - All calculations follow statistical formulas exactly
   - Document source of constants

2. **Calculator Integration Pattern** (see existing `capacidad_proceso_calculator.py`):
   - Import new module functions
   - Add wrapper function for full workflow
   - Generate markdown instructions
   - Build into output structure

3. **Response Pattern**:
   - Results nested under appropriate key
   - Instructions generated with Spanish markdown
   - chartData prepared for Epic 8 (structure now, implement visualization later)

### Capability Index Formulas

**Cp (Process Capability):**
```
Cp = (LES - LEI) / (6 × σ_within)
where σ_within = MR̄ / d2 = MR̄ / 1.128
```
- Measures spread relative to specification width
- Does NOT consider process centering
- Higher is better (≥1.33 typically required)

**Cpk (Process Capability Index):**
```
Cpu = (LES - μ) / (3 × σ_within)    # Upper capability
Cpl = (μ - LEI) / (3 × σ_within)    # Lower capability
Cpk = min(Cpu, Cpl)
```
- Measures capability considering centering
- Penalized by being off-center
- Cpk ≤ Cp always

**Pp (Process Performance):**
```
Pp = (LES - LEI) / (6 × σ_overall)
where σ_overall = sample standard deviation (ddof=1)
```
- Uses overall variation (includes between-subgroup variation)
- Generally ≤ Cp if process is stable

**Ppk (Process Performance Index):**
```
Ppu = (LES - μ) / (3 × σ_overall)
Ppl = (μ - LEI) / (3 × σ_overall)
Ppk = min(Ppu, Ppl)
```
- Performance considering centering with overall sigma
- Ppk ≤ Cpk for stable processes

### Classification Thresholds (Industry Standard)

| Cpk/Ppk Value | Classification | Risk Level | Action |
|---------------|----------------|------------|--------|
| ≥ 1.67 | Excelente | Very Low | No immediate action needed |
| 1.33 - 1.67 | Capaz | Low | Monitor, no urgent action |
| 1.00 - 1.33 | Marginalmente Capaz | Moderate | Investigate, improve if possible |
| 0.67 - 1.00 | No Capaz | High | Improvement required |
| < 0.67 | Muy Deficiente | Very High | Urgent action required |

### Non-Normal Distribution Capability

When normality tests fail (Story 7.2), capability must be calculated differently:

**Option 1: Percentile Method**
```python
# Using fitted distribution CDF inverse (percent point function)
P0_135 = ppf(0.00135)   # Lower 3σ equivalent
P99_865 = ppf(0.99865)  # Upper 3σ equivalent
P50 = median

# Non-normal Pp equivalent
Pp_non_normal = (LES - LEI) / (P99_865 - P0_135)

# Non-normal Ppk equivalent
Ppk_upper = (LES - P50) / (P99_865 - P50)
Ppk_lower = (P50 - LEI) / (P50 - P0_135)
Ppk_non_normal = min(Ppk_upper, Ppk_lower)
```

**Option 2: Z-Bench Method (from PPM)**
```python
# Calculate PPM from fitted distribution
ppm_total = ppm_below_lei + ppm_above_les

# Convert to Z-score equivalent
z_bench = scipy_equivalent_ppf(1 - ppm_total/1e6)  # Need pure Python inverse normal

# Equivalent Ppk
Ppk_equivalent = z_bench / 3
```

### PPM Calculation

```python
def calculate_ppm(mean, sigma, lei, les):
    """Calculate parts per million outside specifications."""
    # Normal distribution assumption
    z_lower = (lei - mean) / sigma
    z_upper = (les - mean) / sigma

    ppm_below = normal_cdf(z_lower) * 1_000_000
    ppm_above = (1 - normal_cdf(z_upper)) * 1_000_000

    return {
        'ppm_below_lei': int(round(ppm_below)),
        'ppm_above_les': int(round(ppm_above)),
        'ppm_total': int(round(ppm_below + ppm_above))
    }
```

### Python Module Structure

```python
# capability_indices.py signature

# Constants
D2_CONSTANT = 1.128  # for n=2 moving range
CAPABILITY_THRESHOLDS = {
    'excellent': 1.67,
    'adequate': 1.33,
    'marginal': 1.00,
    'inadequate': 0.67
}

def validate_spec_limits(lei: float, les: float) -> dict:
    """Validate specification limits are valid."""
    pass

def calculate_sigma_within(mr_bar: float) -> float:
    """Calculate within-subgroup standard deviation from MR̄."""
    pass

def calculate_sigma_overall(values: np.ndarray) -> float:
    """Calculate overall standard deviation."""
    pass

def calculate_cp(lei: float, les: float, sigma: float) -> float:
    """Calculate Cp process capability index."""
    pass

def calculate_cpk(mean: float, lei: float, les: float, sigma: float) -> tuple:
    """Calculate Cpk and component indices (Cpu, Cpl)."""
    pass

def calculate_pp(lei: float, les: float, sigma_overall: float) -> float:
    """Calculate Pp process performance index."""
    pass

def calculate_ppk(mean: float, lei: float, les: float, sigma_overall: float) -> tuple:
    """Calculate Ppk and component indices (Ppu, Ppl)."""
    pass

def classify_capability(index_value: float) -> dict:
    """Classify capability index and return classification dict."""
    pass

def calculate_ppm_normal(mean: float, sigma: float, lei: float, les: float) -> dict:
    """Calculate PPM outside specifications assuming normal distribution."""
    pass

def calculate_capability_non_normal(values: np.ndarray, lei: float, les: float, fitted_dist: dict) -> dict:
    """Calculate capability indices for non-normal data using fitted distribution."""
    pass

def calculate_capability_indices(values: np.ndarray, lei: float, les: float, stability_result: dict, normality_result: dict = None) -> dict:
    """Main wrapper: calculates all capability indices and classifications."""
    pass
```

### TypeScript Types

```typescript
// In /types/analysis.ts

export interface CapabilityIndices {
  cp: number | null;
  cpk: number | null;
  pp: number | null;
  ppk: number | null;
  cpu: number | null;   // Upper capability (short-term)
  cpl: number | null;   // Lower capability (short-term)
  ppu: number | null;   // Upper performance (long-term)
  ppl: number | null;   // Lower performance (long-term)
}

export interface CapabilityClassification {
  classification: 'Excelente' | 'Capaz' | 'Marginalmente Capaz' | 'No Capaz' | 'Muy Deficiente';
  color: 'green' | 'yellow' | 'red';
  level: 'excellent' | 'adequate' | 'marginal' | 'inadequate' | 'poor';
}

export interface PPMBreakdown {
  ppm_below_lei: number;
  ppm_above_les: number;
  ppm_total: number;
}

export interface SpecificationLimits {
  lei: number;
  les: number;
}

export interface CapabilityAnalysisResult {
  indices: CapabilityIndices;
  sigma_within: number;
  sigma_overall: number;
  spec_limits: SpecificationLimits;
  mean: number;
  cpk_classification: CapabilityClassification;
  ppk_classification: CapabilityClassification;
  ppm: PPMBreakdown;
  method: 'normal' | 'non_normal';
  non_normal_distribution?: string;  // e.g., "Weibull", "Lognormal"
}

// Update CapacidadProcesoResult
export interface CapacidadProcesoResult {
  basic_statistics: CapacidadProcesoBasicStats;
  normality?: NormalityAnalysis;
  stability?: StabilityAnalysisResult;
  capability?: CapabilityAnalysisResult;  // NEW - Story 7.4
  sample_size: number;
  warnings: string[];
}

// Request type update
export interface AnalyzeCapacidadProcesoRequest {
  analysis_type: 'capacidad_proceso';
  file_id: string;
  message_id?: string;
  spec_limits?: SpecificationLimits;
}
```

### Spanish Messages for Capability

```typescript
// In /constants/messages.ts

export const CAPABILITY_CLASSIFICATIONS = {
  excellent: 'Excelente - El proceso supera ampliamente los requisitos',
  adequate: 'Capaz - El proceso cumple con los requisitos de capacidad',
  marginal: 'Marginalmente Capaz - El proceso apenas cumple los requisitos mínimos',
  inadequate: 'No Capaz - El proceso no cumple con los requisitos de capacidad',
  poor: 'Muy Deficiente - El proceso requiere acción inmediata'
};

export const CAPABILITY_INTERPRETATIONS = {
  excellent: 'Con un Cpk ≥ 1.67, su proceso tiene margen de seguridad significativo. La probabilidad de producir defectos es extremadamente baja.',
  adequate: 'Con un Cpk entre 1.33 y 1.67, su proceso cumple los estándares industriales. Continúe monitoreando para mantener este nivel.',
  marginal: 'Con un Cpk entre 1.00 y 1.33, su proceso está en el límite. Se recomienda investigar fuentes de variación y mejorar el centrado.',
  inadequate: 'Con un Cpk < 1.00, su proceso genera defectos a una tasa inaceptable. Se requieren acciones de mejora prioritarias.',
  poor: 'Con un Cpk < 0.67, su proceso está severamente fuera de especificación. Considere detener la producción hasta resolver.'
};

export const CAPABILITY_RECOMMENDATIONS = {
  centering_issue: 'El proceso no está centrado entre las especificaciones. Ajuste el proceso hacia el valor objetivo.',
  spread_issue: 'La variación del proceso es excesiva. Identifique y elimine fuentes de variación.',
  both_issues: 'El proceso tiene problemas de centrado y variación. Priorice reducir la variación primero.',
  stable_capable: 'El proceso es estable y capaz. Continúe con monitoreo de control estadístico.',
  unstable_warning: 'El proceso es inestable. Los índices de capacidad pueden no ser confiables hasta lograr estabilidad.',
  non_normal_note: 'Los datos no siguen una distribución normal. Los índices se calcularon usando la distribución ajustada.'
};
```

### Markdown Instructions Generation

```python
def generate_capability_instructions(capability_result: dict) -> str:
    """Generate markdown for capability analysis results."""

    indices = capability_result['indices']
    cpk_class = capability_result['cpk_classification']
    ppk_class = capability_result['ppk_classification']
    ppm = capability_result['ppm']

    # Classification emoji
    color_emoji = {'green': '🟢', 'yellow': '🟡', 'red': '🔴'}
    cpk_emoji = color_emoji.get(cpk_class['color'], '⚪')
    ppk_emoji = color_emoji.get(ppk_class['color'], '⚪')

    return f"""
## Análisis de Capacidad de Proceso

### Límites de Especificación

| Parámetro | Valor |
|-----------|-------|
| **LEI (Límite Inferior)** | {capability_result['spec_limits']['lei']:.4f} |
| **LES (Límite Superior)** | {capability_result['spec_limits']['les']:.4f} |
| **Valor Objetivo (μ)** | {capability_result['mean']:.4f} |

### Índices de Capacidad

| Índice | Valor | Interpretación |
|--------|-------|---------------|
| **Cp** | {indices['cp']:.3f} | Capacidad potencial (sin considerar centrado) |
| **Cpk** | {indices['cpk']:.3f} | {cpk_emoji} {cpk_class['classification']} |
| **Pp** | {indices['pp']:.3f} | Desempeño potencial (variación total) |
| **Ppk** | {indices['ppk']:.3f} | {ppk_emoji} {ppk_class['classification']} |

### Índices Unilaterales

| Índice | Valor | Descripción |
|--------|-------|-------------|
| **Cpu** | {indices['cpu']:.3f} | Capacidad superior |
| **Cpl** | {indices['cpl']:.3f} | Capacidad inferior |
| **Ppu** | {indices['ppu']:.3f} | Desempeño superior |
| **Ppl** | {indices['ppl']:.3f} | Desempeño inferior |

### Desviaciones Estándar

| Tipo | Valor | Uso |
|------|-------|-----|
| **σ (dentro del subgrupo)** | {capability_result['sigma_within']:.4f} | Cp, Cpk |
| **s (general)** | {capability_result['sigma_overall']:.4f} | Pp, Ppk |

### Defectos Esperados (PPM)

| Ubicación | PPM | % |
|-----------|-----|---|
| Debajo de LEI | {ppm['ppm_below_lei']:,} | {ppm['ppm_below_lei']/10000:.4f}% |
| Arriba de LES | {ppm['ppm_above_les']:,} | {ppm['ppm_above_les']/10000:.4f}% |
| **Total** | **{ppm['ppm_total']:,}** | **{ppm['ppm_total']/10000:.4f}%** |

### Clasificación

{cpk_emoji} **Cpk = {indices['cpk']:.3f}** — {cpk_class['classification']}

{CAPABILITY_INTERPRETATIONS[cpk_class['level']]}
"""

def generate_full_interpretation(results: dict) -> str:
    """Generate complete three-part interpretation markdown."""

    # Part 1: Technical Analysis
    part1 = "# Análisis Técnico\n\n"
    part1 += generate_basic_stats_instructions(results['basic_statistics'])
    part1 += "\n\n"
    if 'normality' in results:
        part1 += generate_normality_instructions(results['normality'])
        part1 += "\n\n"
    if 'stability' in results:
        part1 += generate_stability_instructions(results['stability'])
        part1 += "\n\n"
    if 'capability' in results:
        part1 += generate_capability_instructions(results['capability'])
        part1 += "\n\n"

    # Part 2: Executive Summary
    part2 = "# Conclusión Ejecutiva\n\n"
    conclusions = []

    if 'stability' in results:
        stability_icon = "✅" if results['stability']['is_stable'] else "⚠️"
        stability_text = results['stability']['conclusion']
        conclusions.append(f"**Estabilidad:** {stability_icon} {stability_text}")

    if 'normality' in results:
        normal_icon = "✅" if results['normality']['is_normal'] else "ℹ️"
        normal_text = "Normal" if results['normality']['is_normal'] else "No Normal"
        conclusions.append(f"**Normalidad:** {normal_icon} Distribución {normal_text}")

    if 'capability' in results:
        cpk = results['capability']['indices']['cpk']
        cpk_class = results['capability']['cpk_classification']
        cap_icon = {'green': '✅', 'yellow': '⚠️', 'red': '❌'}[cpk_class['color']]
        conclusions.append(f"**Capacidad:** {cap_icon} Cpk = {cpk:.3f} ({cpk_class['classification']})")

    part2 += "\n".join(conclusions)

    # Part 3: Plain Language Summary
    part3 = "\n\n# Conclusión Terrenal\n\n"
    part3 += generate_plain_language_summary(results)

    return part1 + part2 + part3
```

### Previous Story Learnings (Stories 7.1, 7.2, 7.3)

1. **Pure Python constraint:** numpy ONLY - no scipy (Vercel 250MB limit)
2. **Test coverage:** Previous stories added 60-130+ tests each - maintain this level
3. **Spanish messages:** All user-facing text in Spanish
4. **Integration tests:** Include integration tests in test_analyze.py
5. **Calculator wrapper:** Add `perform_*` wrapper function that orchestrates the workflow
6. **Instructions generation:** Create `generate_*_instructions()` for markdown output
7. **Type safety:** Update TypeScript types for new result structures
8. **Code review fixes:** Be thorough - previous stories had 3+ HIGH issues found
9. **Edge cases:** Handle zero sigma, missing spec limits, non-normal data

### Git Intelligence

Recent relevant commits:
- `804e9dc`: Fixed numeric display in MSA - precision and formatting matters
- Stories 7.1, 7.2, 7.3 were just completed - patterns are fresh

### File Structure

```
api/
├── analyze.py                           # UPDATE: Pass spec_limits to calculator
└── utils/
    ├── capacidad_proceso_validator.py   # Exists (Story 7.1)
    ├── capacidad_proceso_calculator.py  # UPDATE: Add capability integration
    ├── normality_tests.py               # Exists (Story 7.2)
    ├── distribution_fitting.py          # Exists (Story 7.2)
    ├── stability_analysis.py            # Exists (Story 7.3)
    └── capability_indices.py            # NEW: Cp, Cpk, Pp, Ppk calculations

api/tests/
├── test_capacidad_proceso_validator.py  # Exists
├── test_capacidad_proceso_calculator.py # UPDATE: Add capability tests
├── test_normality_tests.py              # Exists
├── test_distribution_fitting.py         # Exists
├── test_stability_analysis.py           # Exists
├── test_analyze.py                      # UPDATE: Add capability integration tests
└── test_capability_indices.py           # NEW: Capability indices tests

types/
└── analysis.ts                          # UPDATE: Add capability types

constants/
├── analysis.ts                          # UPDATE: Add capability thresholds
└── messages.ts                          # UPDATE: Add capability messages
```

### Critical Constraints

1. **Pure Python ONLY** - scipy is forbidden due to Vercel size limits
2. **Constants must be exact:** d2 = 1.128 (for n=2 moving range)
3. **Thresholds are industry standard:** 1.33 (adequate), 1.00 (marginal)
4. **Spanish messages** - All conclusions and guidance in Spanish
5. **3-part output** - Technical, Executive, Terrenal sections required
6. **Spec limits validation** - LEI must be < LES, both must be numeric
7. **Handle non-normal** - Use fitted distribution when normality fails
8. **PPM accuracy** - Use correct CDF calculations

### Dependencies

**Existing (no new dependencies):**
- numpy>=1.24.0
- pandas>=2.0.0

### Integration with Previous Stories

**From Story 7.1 (Basic Statistics):**
- Use `basic_statistics['mean']` for centering calculations
- Use `basic_statistics['std_dev']` for sigma_overall (but may recalculate for ddof=1)

**From Story 7.2 (Normality):**
- Check `normality['is_normal']` to decide calculation method
- If not normal, use `normality['fitted_distribution']` for PPM
- Use existing PPM calculation infrastructure if available

**From Story 7.3 (Stability):**
- Use `stability['sigma']` (MR̄/d2) for sigma_within
- Use `stability['i_chart']['mr_bar']` to calculate sigma_within
- Warn user if process is unstable before presenting capability indices

### Epic 8 Preparation

This story completes the Python backend for Capacidad de Proceso. Epic 8 stories will:
- Story 8.1: Add Histogram and I-Chart frontend components
- Story 8.2: Add MR-Chart and Normality Plot components
- Story 8.3: Add SpecLimitsForm and update Templates page
- Story 8.4: Add agent tool integration and chat flow

**chartData preparation in this story:**
```python
# Prepare chart data structure for Epic 8
chart_data = {
    'histogram': {
        'data': values.tolist(),  # Raw values for bins
        'lei': lei,
        'les': les,
        'mean': mean,
        'std': sigma_overall
    },
    'i_chart': {
        'values': values.tolist(),
        'center': stability['i_chart']['center'],
        'ucl': stability['i_chart']['ucl'],
        'lcl': stability['i_chart']['lcl'],
        'ooc_points': stability['i_chart']['ooc_points']
    },
    'mr_chart': {
        'values': moving_ranges.tolist(),
        'center': stability['mr_chart']['center'],
        'ucl': stability['mr_chart']['ucl'],
        'ooc_points': stability['mr_chart']['ooc_points']
    },
    'normality_plot': {
        'values': sorted_values,
        'theoretical_quantiles': theoretical_quantiles,
        'ad_statistic': normality['ad_statistic'],
        'p_value': normality['p_value']
    }
}
```

### Project Structure Notes

**Files to create:**
- `/api/utils/capability_indices.py` - Cp, Cpk, Pp, Ppk calculations
- `/api/tests/test_capability_indices.py` - Comprehensive capability tests

**Files to modify:**
- `/api/utils/capacidad_proceso_calculator.py` - Add capability integration
- `/api/analyze.py` - Pass spec_limits, include capability in response
- `/types/analysis.ts` - Add capability-related types
- `/constants/messages.ts` - Add capability Spanish messages
- `/constants/analysis.ts` - Add capability thresholds
- `/api/tests/test_capacidad_proceso_calculator.py` - Add capability integration tests
- `/api/tests/test_analyze.py` - Add capability endpoint tests

### References

- [Source: epics.md#story-74-capability-indices-api-integration] - Story requirements
- [Source: prd-v2.md#requisitos-funcionales-capacidad-de-proceso] - FR-CP17, FR-CP19
- [Source: architecture.md#pure-python-statistical-implementation] - No scipy constraint
- [Source: 7-1-file-validation-basic-statistics-calculator.md] - Story 7.1 patterns
- [Source: 7-2-normality-testing-distribution-fitting.md] - Story 7.2 patterns
- [Source: 7-3-stability-analysis-i-mr-control-charts.md] - Story 7.3 patterns
- [Source: api/utils/capacidad_proceso_calculator.py] - Calculator integration reference
- [Source: api/utils/normality_tests.py] - Pure Python pattern reference
- [Source: api/utils/stability_analysis.py] - Stability integration reference

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 60 new capability indices tests pass
- All 152 capacidad_proceso tests pass (60 capability + 92 existing)
- 4 pre-existing MSA test failures unrelated to this story (test_analyze.py expecting 'image' field in chart data)
- Total test suite: 485 tests (481 pass, 4 unrelated failures)

### Completion Notes List

**Code Review Fixes Applied (2026-02-20):**
- Added `constants/templates.ts` to File List (was modified but not documented)
- Added explicit "Conclusión Ejecutiva" and "Conclusión Terrenal" sections to capability instructions (AC #4 compliance)
- Updated TypeScript interface `CapabilityAnalysisResult` with proper documentation and optional field markers
- Added 2 new tests for `normality_result=None` edge case (62 tests total now)
- Added clarifying comments for PPM calculation method and classification boundaries

1. **Pure Python Implementation**: All capability calculations implemented using numpy only (no scipy) per Vercel 250MB constraint
2. **d2 Constant**: Used exact value 1.128 for n=2 moving range per AIAG SPC Manual
3. **Classification Thresholds**: Implemented 5-tier classification (Excelente ≥1.67, Capaz ≥1.33, Marginalmente Capaz ≥1.00, No Capaz ≥0.67, Muy Deficiente <0.67)
4. **Non-Normal Capability**: Implemented percentile-based approach using distribution PPF for non-normal data
5. **PPM Calculation**: Uses pure Python normal CDF via error function (imported from normality_tests)
6. **Spanish Localization**: All user-facing messages, classifications, and recommendations in Spanish
7. **Three-Part Output**: Instructions include Análisis Técnico, Conclusión Ejecutiva, and Conclusión Terrenal sections
8. **Integration Pattern**: Follows existing pattern from Stories 7.1-7.3 for calculator integration
9. **TypeScript Types**: Added comprehensive type definitions for frontend consumption in Epic 8

### File List

**Created:**
- `/api/utils/capability_indices.py` - Core capability indices calculations (Cp, Cpk, Pp, Ppk, PPM, classifications)
- `/api/tests/test_capability_indices.py` - 62 comprehensive tests for capability module (60 original + 2 review fixes)

**Modified:**
- `/api/utils/capacidad_proceso_calculator.py` - Added capability integration with spec_limits parameter
- `/api/analyze.py` - Updated to pass spec_limits to calculator
- `/types/analysis.ts` - Added CapabilityIndices, CapabilityClassification, PPMBreakdown, CapabilityAnalysisResult, NonNormalCapabilityResult interfaces
- `/constants/analysis.ts` - Added CAPABILITY_THRESHOLDS, D2_CONSTANT, CAPABILITY_CLASSIFICATIONS
- `/constants/messages.ts` - Added CAPABILITY_CLASSIFICATIONS_MESSAGES, CAPABILITY_INTERPRETATIONS, CAPABILITY_RECOMMENDATIONS, CAPABILITY_INDEX_DESCRIPTIONS, CAPABILITY_SPEC_LIMIT_ERRORS
- `/constants/templates.ts` - Added capacidad_proceso template definition
- `/api/tests/test_capacidad_proceso_calculator.py` - Added 7 capability integration tests (TestOutputWithCapability class)
- `/api/tests/test_analyze.py` - Added 5 capability endpoint tests (TestAnalyzeEndpointCapacidadProcesoCapability class)
- `/_bmad-output/implementation-artifacts/sprint-status.yaml` - Updated story status to in-progress → review
