# Story 7.3: Stability Analysis with I-MR Control Charts

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **my process stability evaluated using I-MR control charts**,
So that **I know if my process is under statistical control before assessing capability**.

**FRs covered:** FR-CP14, FR-CP15, FR-CP16

## Acceptance Criteria

1. **Given** a valid data set is submitted for analysis, **When** I-Chart (Individual Values) calculations are performed, **Then** the system calculates the center line (X̄ = mean of all values) **And** the system calculates MR̄ (mean of moving ranges between consecutive points) **And** the system calculates UCL = X̄ + 2.66 × MR̄ **And** the system calculates LCL = X̄ - 2.66 × MR̄ **And** points outside UCL/LCL are flagged as out-of-control

2. **Given** MR-Chart calculations are performed, **When** the moving range chart is generated, **Then** the system calculates MR̄ as center line **And** the system calculates UCL = 3.267 × MR̄ **And** LCL = 0 **And** points outside UCL are flagged

3. **Given** stability rules need evaluation, **When** the 7 instability rules are checked, **Then** the system evaluates:
   1. Points beyond 3σ (outside control limits)
   2. 7 consecutive points trending up or down
   3. 7 consecutive points within 1σ of center (stratification)
   4. 7 consecutive points between 2σ and 3σ above center
   5. 7 consecutive points between 2σ and 3σ below center
   6. 7 consecutive points in cyclic pattern
   7. 7 consecutive points above or below center line
   **And** each rule reports: CUMPLE or NO CUMPLE **And** violations include specific point indices where the pattern occurs

4. **Given** stability analysis completes, **When** results are compiled, **Then** the output includes all control limits, flagged points, and rule evaluations **And** an overall stability conclusion is provided: "Proceso Estable" or "Proceso Inestable"

## Tasks / Subtasks

- [x] **Task 1: Create Stability Analysis Module** (AC: #1, #2)
  - [x] Create `/api/utils/stability_analysis.py` module
  - [x] Implement `calculate_moving_ranges(values)` function
    - [x] Calculate consecutive point differences: MR[i] = |X[i] - X[i-1]|
    - [x] Return numpy array of moving ranges (n-1 values)
  - [x] Implement `calculate_i_chart_limits(values, moving_ranges)` function
    - [x] Calculate X̄ (mean of all individual values)
    - [x] Calculate MR̄ (mean of moving ranges)
    - [x] Calculate UCL_I = X̄ + 2.66 × MR̄
    - [x] Calculate LCL_I = X̄ - 2.66 × MR̄
    - [x] Return dict: `{'center': float, 'ucl': float, 'lcl': float, 'mr_bar': float}`
  - [x] Implement `calculate_mr_chart_limits(moving_ranges)` function
    - [x] Calculate MR̄ as center line
    - [x] Calculate UCL_MR = 3.267 × MR̄
    - [x] LCL_MR = 0
    - [x] Return dict: `{'center': float, 'ucl': float, 'lcl': float}`

- [x] **Task 2: Implement Out-of-Control Point Detection** (AC: #1, #2)
  - [x] Implement `find_ooc_points_i_chart(values, limits)` function
    - [x] Compare each value against UCL and LCL
    - [x] Return list of indices where value > UCL or value < LCL
    - [x] Include value and limit type (UCL/LCL) in results
  - [x] Implement `find_ooc_points_mr_chart(moving_ranges, limits)` function
    - [x] Compare each MR against UCL
    - [x] Return list of indices where MR > UCL
    - [x] Note: LCL = 0 so no lower violations possible for MR

- [x] **Task 3: Implement 7 Stability Rules (Pure Python)** (AC: #3)
  - [x] Implement `evaluate_stability_rules(values, limits)` function
  - [x] **Rule 1: Points beyond 3σ** (outside control limits)
    - [x] Same as out-of-control point detection
    - [x] Report: list of violating indices
  - [x] **Rule 2: 7 consecutive points trending up or down**
    - [x] Detect 7+ consecutive increasing or decreasing values
    - [x] Report: start/end indices of trend
  - [x] **Rule 3: 7 consecutive points within 1σ of center (stratification)**
    - [x] Calculate 1σ zone: X̄ ± (1/3) × (UCL - X̄)
    - [x] Detect 7+ consecutive points in this zone
    - [x] Report: start/end indices
  - [x] **Rule 4: 7 consecutive points between 2σ and 3σ above center**
    - [x] Calculate 2σ zone: X̄ + (2/3) × (UCL - X̄) to UCL
    - [x] Detect 7+ consecutive points in upper zone
  - [x] **Rule 5: 7 consecutive points between 2σ and 3σ below center**
    - [x] Calculate 2σ zone: LCL to X̄ - (2/3) × (X̄ - LCL)
    - [x] Detect 7+ consecutive points in lower zone
  - [x] **Rule 6: 7 consecutive points in cyclic pattern**
    - [x] Detect alternating up-down-up-down pattern for 14+ points
    - [x] Simplified: detect 7+ alternating direction changes
  - [x] **Rule 7: 7 consecutive points above or below center line**
    - [x] Detect 7+ consecutive points all above X̄ or all below X̄
    - [x] Report: start/end indices and side (above/below)
  - [x] Return structured dict with each rule's result: `{'cumple': bool, 'violations': list}`

- [x] **Task 4: Create Stability Wrapper Function** (AC: #4)
  - [x] Implement `perform_stability_analysis(values)` main function
    - [x] Calculate moving ranges
    - [x] Calculate I-Chart limits
    - [x] Calculate MR-Chart limits
    - [x] Find out-of-control points for both charts
    - [x] Evaluate all 7 stability rules
    - [x] Determine overall stability conclusion
  - [x] Return comprehensive result dict:
    ```python
    {
        'is_stable': bool,
        'conclusion': 'Proceso Estable' | 'Proceso Inestable',
        'i_chart': {
            'center': float,
            'ucl': float,
            'lcl': float,
            'ooc_points': list  # Out-of-control points
        },
        'mr_chart': {
            'center': float,
            'ucl': float,
            'lcl': float,
            'ooc_points': list
        },
        'rules': {
            'rule_1': {'cumple': bool, 'violations': list},
            'rule_2': {'cumple': bool, 'violations': list},
            ...
        },
        'sigma': float  # Within-subgroup std dev from MR̄/d2
    }
    ```

- [x] **Task 5: Integrate Stability into Calculator** (AC: #1, #2, #3, #4)
  - [x] Update `/api/utils/capacidad_proceso_calculator.py`
  - [x] Import `perform_stability_analysis` from stability_analysis
  - [x] Add stability results to `build_capacidad_proceso_output`:
    - [x] Call `perform_stability_analysis(values)`
    - [x] Add `'stability': stability_result` to results dict
  - [x] Implement `generate_stability_instructions(stability_result)` function
    - [x] Generate markdown table for control limits
    - [x] Generate markdown list of rule evaluations
    - [x] Include overall stability conclusion with emoji
    - [x] List specific out-of-control points by index

- [x] **Task 6: Update analyze.py Response Structure** (AC: #4)
  - [x] Update capacidad_proceso routing in analyze.py
  - [x] Ensure stability analysis is called after basic stats and normality
  - [x] Include stability results in response structure
  - [x] Update instructions to include stability interpretation

- [x] **Task 7: Update TypeScript Types** (AC: #1, #2, #3, #4)
  - [x] Add to `/types/analysis.ts`:
    - [x] `IChartLimits` interface
    - [x] `MRChartLimits` interface
    - [x] `OutOfControlPoint` interface
    - [x] `StabilityRuleResult` interface
    - [x] `StabilityAnalysisResult` interface
  - [x] Update `CapacidadProcesoResult` to include optional `stability` property

- [x] **Task 8: Add Spanish Messages for Stability** (AC: #3, #4)
  - [x] Add to `/constants/messages.ts`:
    - [x] `STABILITY_RULE_DESCRIPTIONS` - Spanish descriptions for each rule
    - [x] `STABILITY_CONCLUSIONS` - Stable/Unstable messages
    - [x] `STABILITY_INTERPRETATION` - Actionable guidance

- [x] **Task 9: Write Unit Tests** (AC: #1, #2, #3, #4)
  - [x] Create `/api/tests/test_stability_analysis.py`
    - [x] Test moving range calculation with known values
    - [x] Test I-Chart limits calculation (verify 2.66 constant)
    - [x] Test MR-Chart limits calculation (verify 3.267 constant)
    - [x] Test out-of-control point detection - I-Chart
    - [x] Test out-of-control point detection - MR-Chart
    - [x] Test Rule 1 (beyond limits) with fabricated data
    - [x] Test Rule 2 (trending) with 7+ increasing values
    - [x] Test Rule 3 (stratification) with values in center zone
    - [x] Test Rule 4 (upper zone) with values in upper zone
    - [x] Test Rule 5 (lower zone) with values in lower zone
    - [x] Test Rule 6 (cyclic) with alternating pattern
    - [x] Test Rule 7 (one side) with values all above/below center
    - [x] Test stable process (no violations)
    - [x] Test unstable process (multiple violations)
  - [x] Update existing capacidad_proceso tests to include stability
  - [x] Validate constants (2.66, 3.267) match statistical tables

## Dev Notes

### Critical Architecture Patterns

**Follow existing module patterns exactly - this is Story 7.3 in the Capacidad de Proceso series:**

1. **Module Pattern** (see `normality_tests.py`, `distribution_fitting.py`):
   - Pure Python with numpy only (NO scipy)
   - Functions return structured dicts
   - All calculations follow statistical formulas exactly
   - Document source of constants

2. **Calculator Integration Pattern** (see `capacidad_proceso_calculator.py`):
   - Import new module functions
   - Add wrapper function for full workflow
   - Generate markdown instructions
   - Build into output structure

3. **Response Pattern**:
   - Results nested under appropriate key
   - Instructions generated with Spanish markdown
   - chartData prepared for Epic 8 (structure now, implement later)

### Control Chart Constants

**I-Chart (Individual Values):**
- UCL = X̄ + E2 × MR̄ where E2 = 2.66 (for n=2, moving range)
- LCL = X̄ - E2 × MR̄
- Source: AIAG SPC Manual, Table for d2 and E2 constants

**MR-Chart (Moving Range):**
- UCL = D4 × MR̄ where D4 = 3.267 (for n=2)
- LCL = D3 × MR̄ where D3 = 0 (for n=2)
- Source: AIAG SPC Manual

**Within-subgroup standard deviation (for capability indices):**
- σ_within = MR̄ / d2 where d2 = 1.128 (for n=2)

### Python Module Structure

```python
# stability_analysis.py signature

def calculate_moving_ranges(values: np.ndarray) -> np.ndarray:
    """Calculate moving ranges between consecutive points."""
    pass

def calculate_i_chart_limits(values: np.ndarray, mr: np.ndarray) -> dict:
    """Calculate I-Chart control limits."""
    pass

def calculate_mr_chart_limits(mr: np.ndarray) -> dict:
    """Calculate MR-Chart control limits."""
    pass

def find_ooc_points_i_chart(values: np.ndarray, limits: dict) -> list:
    """Find out-of-control points on I-Chart."""
    pass

def find_ooc_points_mr_chart(mr: np.ndarray, limits: dict) -> list:
    """Find out-of-control points on MR-Chart."""
    pass

def evaluate_stability_rules(values: np.ndarray, limits: dict) -> dict:
    """Evaluate all 7 stability rules."""
    pass

def perform_stability_analysis(values: np.ndarray) -> dict:
    """Main wrapper: performs complete stability analysis."""
    pass
```

### 7 Stability Rules Implementation Details

```python
# Rule 1: Points beyond 3σ (outside control limits)
def _rule_1_beyond_limits(values: np.ndarray, ucl: float, lcl: float) -> dict:
    """Detect points outside control limits."""
    violations = []
    for i, val in enumerate(values):
        if val > ucl:
            violations.append({'index': i, 'value': float(val), 'limit': 'UCL'})
        elif val < lcl:
            violations.append({'index': i, 'value': float(val), 'limit': 'LCL'})
    return {'cumple': len(violations) == 0, 'violations': violations}

# Rule 2: 7 consecutive points trending up or down
def _rule_2_trending(values: np.ndarray) -> dict:
    """Detect 7+ consecutive increasing or decreasing points."""
    violations = []
    n = len(values)

    # Track direction: +1 = up, -1 = down, 0 = same
    directions = np.sign(np.diff(values))

    # Find runs of same direction
    run_start = 0
    run_direction = directions[0] if len(directions) > 0 else 0
    run_length = 1

    for i in range(1, len(directions)):
        if directions[i] == run_direction and run_direction != 0:
            run_length += 1
        else:
            if run_length >= 6:  # 6 differences = 7 consecutive points
                violations.append({
                    'start': run_start,
                    'end': run_start + run_length,
                    'direction': 'up' if run_direction > 0 else 'down'
                })
            run_start = i
            run_direction = directions[i]
            run_length = 1

    # Check final run
    if run_length >= 6:
        violations.append({
            'start': run_start,
            'end': run_start + run_length,
            'direction': 'up' if run_direction > 0 else 'down'
        })

    return {'cumple': len(violations) == 0, 'violations': violations}

# Rule 7: 7 consecutive points above or below center line
def _rule_7_one_side(values: np.ndarray, center: float) -> dict:
    """Detect 7+ consecutive points on one side of center."""
    violations = []
    n = len(values)

    # Track side: +1 = above, -1 = below
    sides = np.sign(values - center)

    # Find runs on same side
    run_start = 0
    run_side = sides[0]
    run_length = 1

    for i in range(1, n):
        if sides[i] == run_side and run_side != 0:
            run_length += 1
        else:
            if run_length >= 7:
                violations.append({
                    'start': run_start,
                    'end': run_start + run_length - 1,
                    'side': 'above' if run_side > 0 else 'below'
                })
            run_start = i
            run_side = sides[i]
            run_length = 1

    # Check final run
    if run_length >= 7:
        violations.append({
            'start': run_start,
            'end': run_start + run_length - 1,
            'side': 'above' if run_side > 0 else 'below'
        })

    return {'cumple': len(violations) == 0, 'violations': violations}
```

### Sigma Zones for Rules 3, 4, 5

```python
def _calculate_sigma_zones(center: float, ucl: float, lcl: float) -> dict:
    """Calculate sigma zones for stability rules."""
    # Distance from center to UCL (this is 3σ)
    three_sigma = ucl - center
    one_sigma = three_sigma / 3
    two_sigma = (2 / 3) * three_sigma

    return {
        'center': center,
        '1_sigma_upper': center + one_sigma,
        '1_sigma_lower': center - one_sigma,
        '2_sigma_upper': center + two_sigma,
        '2_sigma_lower': center - two_sigma,
        '3_sigma_upper': ucl,
        '3_sigma_lower': lcl,
    }
```

### TypeScript Types

```typescript
// In /types/analysis.ts

export interface IChartLimits {
  center: number;  // X̄
  ucl: number;     // Upper Control Limit
  lcl: number;     // Lower Control Limit
  mr_bar: number;  // Mean of moving ranges
}

export interface MRChartLimits {
  center: number;  // MR̄
  ucl: number;     // Upper Control Limit
  lcl: number;     // Always 0 for MR chart
}

export interface OutOfControlPoint {
  index: number;      // 0-based index in data array
  value: number;      // The actual value
  limit?: 'UCL' | 'LCL';  // Which limit was violated
}

export interface StabilityRuleResult {
  cumple: boolean;              // CUMPLE (true) or NO CUMPLE (false)
  violations: Array<{
    start?: number;
    end?: number;
    index?: number;
    value?: number;
    direction?: 'up' | 'down';
    side?: 'above' | 'below';
    limit?: 'UCL' | 'LCL';
  }>;
}

export interface StabilityAnalysisResult {
  is_stable: boolean;
  conclusion: 'Proceso Estable' | 'Proceso Inestable';
  i_chart: IChartLimits & { ooc_points: OutOfControlPoint[] };
  mr_chart: MRChartLimits & { ooc_points: OutOfControlPoint[] };
  rules: {
    rule_1: StabilityRuleResult;
    rule_2: StabilityRuleResult;
    rule_3: StabilityRuleResult;
    rule_4: StabilityRuleResult;
    rule_5: StabilityRuleResult;
    rule_6: StabilityRuleResult;
    rule_7: StabilityRuleResult;
  };
  sigma: number;  // Within-subgroup std dev (MR̄/d2)
}

// Update CapacidadProcesoResult
export interface CapacidadProcesoResult {
  basic_statistics: CapacidadProcesoBasicStats;
  normality?: NormalityAnalysis;
  stability?: StabilityAnalysisResult;  // NEW - Story 7.3
  sample_size: number;
  warnings: string[];
}
```

### Spanish Messages for Stability

```typescript
// In /constants/messages.ts

export const STABILITY_RULE_DESCRIPTIONS = {
  rule_1: 'Regla 1: Puntos fuera de los límites de control (más allá de 3σ)',
  rule_2: 'Regla 2: 7 puntos consecutivos con tendencia ascendente o descendente',
  rule_3: 'Regla 3: 7 puntos consecutivos dentro de 1σ del centro (estratificación)',
  rule_4: 'Regla 4: 7 puntos consecutivos entre 2σ y 3σ arriba del centro',
  rule_5: 'Regla 5: 7 puntos consecutivos entre 2σ y 3σ debajo del centro',
  rule_6: 'Regla 6: 7 puntos consecutivos en patrón cíclico (alternante)',
  rule_7: 'Regla 7: 7 puntos consecutivos arriba o debajo de la línea central',
};

export const STABILITY_CONCLUSIONS = {
  stable: '✅ **Proceso Estable:** El proceso está bajo control estadístico.',
  unstable: '⚠️ **Proceso Inestable:** Se detectaron señales de causa especial.',
};

export const STABILITY_INTERPRETATION = {
  stable: 'Los datos no muestran patrones de variación por causas especiales. Es apropiado calcular índices de capacidad.',
  unstable: 'El proceso presenta variación por causas especiales. Se recomienda investigar y eliminar estas causas antes de calcular índices de capacidad.',
};
```

### Markdown Instructions Generation

```python
def generate_stability_instructions(stability_result: dict) -> str:
    """Generate markdown for stability analysis results."""

    # Overall conclusion
    if stability_result['is_stable']:
        conclusion = "✅ **Proceso Estable**"
        interpretation = "El proceso está bajo control estadístico. Es apropiado calcular índices de capacidad."
    else:
        conclusion = "⚠️ **Proceso Inestable**"
        interpretation = "Se detectaron señales de causa especial. Investigar antes de calcular capacidad."

    # I-Chart limits table
    i_chart = stability_result['i_chart']
    mr_chart = stability_result['mr_chart']

    # Rules evaluation table
    rules = stability_result['rules']
    rules_table = "| Regla | Descripción | Resultado |\n|-------|-------------|----------|\n"

    rule_descriptions = {
        'rule_1': 'Puntos fuera de límites (3σ)',
        'rule_2': 'Tendencia (7 consecutivos)',
        'rule_3': 'Estratificación (7 en 1σ)',
        'rule_4': 'Zona superior (7 en 2-3σ arriba)',
        'rule_5': 'Zona inferior (7 en 2-3σ abajo)',
        'rule_6': 'Patrón cíclico (alternante)',
        'rule_7': 'Un lado (7 arriba/abajo centro)',
    }

    for rule_key, desc in rule_descriptions.items():
        rule_result = rules.get(rule_key, {'cumple': True})
        status = "✅ CUMPLE" if rule_result['cumple'] else "❌ NO CUMPLE"
        rules_table += f"| {rule_key.replace('_', ' ').title()} | {desc} | {status} |\n"

    return f"""
## Análisis de Estabilidad (Cartas I-MR)

### Límites de Control

**Carta I (Valores Individuales):**
| Parámetro | Valor |
|-----------|-------|
| **Línea Central (X̄)** | {i_chart['center']:.4f} |
| **UCL** | {i_chart['ucl']:.4f} |
| **LCL** | {i_chart['lcl']:.4f} |

**Carta MR (Rangos Móviles):**
| Parámetro | Valor |
|-----------|-------|
| **Línea Central (MR̄)** | {mr_chart['center']:.4f} |
| **UCL** | {mr_chart['ucl']:.4f} |
| **LCL** | 0 |

**Desviación estándar dentro del subgrupo (σ):** {stability_result['sigma']:.4f}

### Evaluación de Reglas de Estabilidad

{rules_table}

### Conclusión

{conclusion}

**Interpretación:** {interpretation}
"""
```

### Previous Story Learnings (Stories 7.1 and 7.2)

1. **Pure Python constraint:** numpy ONLY - no scipy (Vercel 250MB limit)
2. **Test coverage:** Stories 7.1 and 7.2 added 60+ and 114+ tests respectively - maintain this level
3. **Spanish messages:** All user-facing text in Spanish
4. **Integration tests:** Include integration tests in test_analyze.py
5. **Calculator wrapper:** Add `perform_*` wrapper function that orchestrates the workflow
6. **Instructions generation:** Create `generate_*_instructions()` for markdown output
7. **Type safety:** Update TypeScript types for new result structures
8. **Code review fixes:** Be thorough - previous stories had 3+ HIGH issues found

### Git Intelligence

Recent relevant commits:
- `804e9dc`: Fixed numeric display in MSA - precision and formatting matters
- Stories 7.1 and 7.2 were just completed - patterns are fresh

### File Structure

```
api/
├── analyze.py                           # UPDATE: Integrate stability into response
└── utils/
    ├── capacidad_proceso_validator.py   # Exists (Story 7.1)
    ├── capacidad_proceso_calculator.py  # UPDATE: Add stability integration
    ├── normality_tests.py               # Exists (Story 7.2)
    ├── distribution_fitting.py          # Exists (Story 7.2)
    └── stability_analysis.py            # NEW: I-MR charts & stability rules

api/tests/
├── test_capacidad_proceso_validator.py  # Exists
├── test_capacidad_proceso_calculator.py # UPDATE: Add stability tests
├── test_normality_tests.py              # Exists
├── test_distribution_fitting.py         # Exists
├── test_analyze.py                      # UPDATE: Add stability integration tests
└── test_stability_analysis.py           # NEW: Stability analysis tests
```

### Critical Constraints

1. **Pure Python ONLY** - scipy is forbidden due to Vercel size limits
2. **Constants must be exact:** 2.66 (E2), 3.267 (D4), 1.128 (d2)
3. **7 consecutive points** - Rules 2-7 require exactly 7, not 6 or 8
4. **Spanish messages** - All conclusions and rule descriptions in Spanish
5. **1-indexed for UI** - When reporting point indices to user, add 1 for readability

### Dependencies

**Existing (no new dependencies):**
- numpy>=1.24.0
- pandas>=2.0.0

### Out of Scope for Story 7.3

These features are covered in later stories:
- Cp/Cpk/Pp/Ppk indices (Story 7.4)
- Chart components visualization (Epic 8 - Stories 8.1, 8.2)
- SpecLimitsForm component (Epic 8 - Story 8.3)
- Agent tool integration (Epic 8 - Story 8.4)

### Project Structure Notes

**Files to create:**
- `/api/utils/stability_analysis.py` - I-MR calculations & stability rules
- `/api/tests/test_stability_analysis.py` - Comprehensive stability tests

**Files to modify:**
- `/api/utils/capacidad_proceso_calculator.py` - Add stability integration
- `/api/analyze.py` - Include stability in response structure
- `/types/analysis.ts` - Add stability-related types
- `/constants/messages.ts` - Add stability Spanish messages
- `/api/tests/test_capacidad_proceso_calculator.py` - Add stability integration tests
- `/api/tests/test_analyze.py` - Add stability endpoint tests

### References

- [Source: epics.md#story-73-stability-analysis-i-mr-control-charts] - Story requirements
- [Source: prd-v2.md#requisitos-funcionales-capacidad-de-proceso] - FR-CP14, FR-CP15, FR-CP16
- [Source: architecture.md#pure-python-statistical-implementation] - No scipy constraint
- [Source: 7-1-file-validation-basic-statistics-calculator.md] - Story 7.1 patterns
- [Source: 7-2-normality-testing-distribution-fitting.md] - Story 7.2 patterns
- [Source: api/utils/capacidad_proceso_calculator.py] - Calculator integration reference
- [Source: api/utils/normality_tests.py] - Pure Python pattern reference

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation proceeded without errors.

### Completion Notes List

- Created `stability_analysis.py` module with I-MR control chart calculations and 7 stability rules evaluation
- All constants match AIAG SPC Manual: E2=2.66, D4=3.267, d2=1.128
- Implemented `perform_stability_analysis()` wrapper function that returns comprehensive stability results
- Added `generate_stability_instructions()` for Spanish markdown output with control limits tables and rule evaluations
- Updated `build_capacidad_proceso_output()` to include stability results
- Updated `analyze.py` to call stability analysis in capacidad_proceso workflow
- Added TypeScript types for stability analysis results (IChartLimits, MRChartLimits, StabilityRuleResult, StabilityAnalysisResult)
- Added Spanish messages for stability (STABILITY_RULE_DESCRIPTIONS, STABILITY_CONCLUSIONS, STABILITY_INTERPRETATION)
- Created comprehensive test suite with 51 tests covering all stability functions and rules
- Added integration tests to test_capacidad_proceso_calculator.py and test_analyze.py
- All 131 Story 7.3-related tests pass

### File List

**New files:**
- api/utils/stability_analysis.py
- api/tests/test_stability_analysis.py

**Modified files:**
- api/analyze.py
- types/analysis.ts
- constants/messages.ts
- api/tests/test_analyze.py

**Note:** The following files were created in Stories 7.1/7.2 and remain untracked in git:
- api/utils/capacidad_proceso_calculator.py (created Story 7.1, updated Story 7.3)
- api/tests/test_capacidad_proceso_calculator.py (created Story 7.1, updated Story 7.3)

## Change Log

- 2026-02-20: Story 7.3 implementation complete - I-MR control charts with 7 stability rules evaluation
- 2026-02-20: Code review fixes applied:
  - Added `mr_bar` to i_chart result (TypeScript interface compliance)
  - Added zero-variation guards in Rules 3, 4, 5 to prevent false positives
  - Improved test coverage for Rules 3, 4, 5 with proper violation detection
  - Added tests for minimum data points and constant values edge cases
  - Added TypeScript documentation for 0-indexed vs 1-indexed values
  - Added documentation note for Epic 8 frontend constants
  - Fixed file list documentation accuracy

