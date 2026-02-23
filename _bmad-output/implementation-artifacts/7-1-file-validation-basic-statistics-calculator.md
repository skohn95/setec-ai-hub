# Story 7.1: File Validation & Basic Statistics Calculator

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **my uploaded data file validated and basic statistics calculated**,
So that **I know if my data is ready for analysis and see the foundational metrics**.

**FRs covered:** FR-CP1, FR-CP2, FR-CP7, FR-CP8, FR-CP9, FR-CP10, FR-CP11

## Acceptance Criteria

1. **Given** a user uploads a file for capacidad_proceso analysis, **When** the file is processed, **Then** the system validates that at least one numeric column exists **And** the system detects and reports empty cells with specific location (e.g., "Celda vacía en fila 15") **And** the system detects and reports non-numeric values with specific location **And** if < 20 values, a warning is shown: "Se recomienda un mínimo de 20 valores para obtener estimaciones confiables" **And** all error messages are in Spanish with actionable guidance

2. **Given** validation passes, **When** basic statistics are calculated, **Then** the system computes: media, mediana, moda, desviación estándar, mínimo, máximo, rango **And** results are stored in the analysis output structure

3. **Given** the template needs to be available, **When** user visits /plantillas, **Then** they see a card for "Análisis de Capacidad de Proceso" **And** clicking download provides `plantilla-capacidad-proceso.xlsx` **And** the template contains a single column "Valores" with sample numeric data

## Tasks / Subtasks

- [x] **Task 1: Create Capacidad de Proceso Validator** (AC: #1)
  - [x] Create `/api/utils/capacidad_proceso_validator.py`
  - [x] Implement `validate_capacidad_proceso_file(df)` function
  - [x] Detect and validate numeric column exists (column named "Valores" or first numeric column)
  - [x] Detect empty cells and report with specific row numbers
  - [x] Detect non-numeric values and report with specific row numbers
  - [x] Return warning (not error) if < 20 values
  - [x] All error messages in Spanish following existing pattern
  - [x] Return validated column name for downstream processing

- [x] **Task 2: Create Basic Statistics Calculator** (AC: #2)
  - [x] Create `/api/utils/capacidad_proceso_calculator.py`
  - [x] Implement `calculate_basic_statistics(values)` function (pure Python, no scipy)
  - [x] Calculate mean (media) using numpy
  - [x] Calculate median (mediana) using numpy
  - [x] Calculate mode (moda) - handle multiple modes and no mode cases
  - [x] Calculate standard deviation (desviación estándar) using numpy
  - [x] Calculate min, max, range (mínimo, máximo, rango)
  - [x] Return structured dict matching existing MSA output patterns

- [x] **Task 3: Add Routing in analyze.py** (AC: #1, #2)
  - [x] Add 'capacidad_proceso' to SUPPORTED_ANALYSIS_TYPES
  - [x] Import capacidad_proceso_validator and calculator
  - [x] Add routing logic for analysis_type == 'capacidad_proceso'
  - [x] Handle spec_limits parameter from request body (optional for Story 7.1)
  - [x] Return basic statistics in results field

- [x] **Task 4: Create Excel Template** (AC: #3)
  - [x] Create `/public/templates/plantilla-capacidad-proceso.xlsx`
  - [x] Add header "Valores" in cell A1
  - [x] Add 10-20 sample numeric values as example data
  - [x] Ensure file is valid Excel format (.xlsx)

- [x] **Task 5: Update Plantillas Page** (AC: #3)
  - [x] Add new card in `/app/(dashboard)/plantillas/page.tsx`
  - [x] Card title: "Análisis de Capacidad de Proceso"
  - [x] Card description: "Evalúa si tu proceso cumple con las especificaciones del cliente"
  - [x] Download button links to `/templates/plantilla-capacidad-proceso.xlsx`
  - [x] Follow existing MSA card styling pattern

- [x] **Task 6: Update Constants and Types** (AC: #1, #2)
  - [x] Add 'capacidad_proceso' to ANALYSIS_TYPES in `/constants/analysis.ts`
  - [x] Add `CapacidadProcesoResult` interface in `/types/analysis.ts`
  - [x] Add Spanish error messages to `/constants/messages.ts`

- [x] **Task 7: Write Unit Tests** (AC: #1, #2)
  - [x] Create `/api/tests/test_capacidad_proceso_validator.py`
  - [x] Test valid file with numeric column
  - [x] Test file with empty cells - verify error messages
  - [x] Test file with non-numeric values - verify error messages
  - [x] Test file with < 20 values - verify warning
  - [x] Test file with exactly 20+ values - no warning
  - [x] Create `/api/tests/test_capacidad_proceso_calculator.py`
  - [x] Test basic statistics calculation with known values
  - [x] Test mode calculation edge cases
  - [x] Verify results match expected precision

## Dev Notes

### Critical Architecture Patterns

**Follow existing MSA patterns exactly - this is a parallel implementation:**

1. **Validator Pattern** (see `msa_validator.py`):
   - Return tuple: `(validated_data, error_dict)`
   - Error dict structure: `{'code': str, 'message': str, 'details': list}`
   - Spanish messages with actionable guidance
   - Specific cell/row references in errors

2. **Calculator Pattern** (see `msa_calculator.py`):
   - Return tuple: `(output_dict, error_string)`
   - Output dict must have: `results`, `chartData`, `instructions`
   - Pure Python - NO scipy (Vercel 250MB limit)
   - Use numpy for calculations

3. **Response Pattern** (see `response.py`):
   - Success: `{'data': {...}, 'error': null}`
   - Error: `{'data': null, 'error': {'code': str, 'message': str}}`

### Python Files Structure

```
api/
├── analyze.py                           # Add routing for 'capacidad_proceso'
└── utils/
    ├── capacidad_proceso_validator.py   # NEW - File validation
    └── capacidad_proceso_calculator.py  # NEW - Statistics calculation
```

### Validator Implementation Details

```python
# capacidad_proceso_validator.py signature
def validate_capacidad_proceso_file(df: pd.DataFrame) -> tuple[dict, dict | None]:
    """
    Validate Capacidad de Proceso file structure.

    Returns:
        tuple: (validated_data, error) where:
            - validated_data: {'column_name': str, 'values': np.ndarray, 'warnings': list}
            - error: None if valid, or {'code': str, 'message': str, 'details': list}
    """
```

**Validation Logic:**
1. Check for "Valores" column (case-insensitive) OR detect first numeric column
2. Extract numeric values, tracking non-numeric cells
3. Track empty cells with row numbers
4. Count valid values for sample size warning
5. Return validated values array if valid

**Error Codes:**
- `NO_NUMERIC_COLUMN`: No numeric data found
- `EMPTY_CELLS`: Empty cells detected (includes row list)
- `NON_NUMERIC_VALUES`: Non-numeric values found (includes row list)

### Calculator Implementation Details

```python
# capacidad_proceso_calculator.py signature
def calculate_basic_statistics(values: np.ndarray) -> dict:
    """
    Calculate basic descriptive statistics.

    Returns:
        dict: {
            'mean': float,
            'median': float,
            'mode': float | list | None,
            'std_dev': float,
            'min': float,
            'max': float,
            'range': float,
            'count': int
        }
    """
```

**Mode Calculation (Pure Python):**
```python
def _calculate_mode(values: np.ndarray) -> float | list | None:
    """Calculate mode - handle multiple modes."""
    unique, counts = np.unique(values, return_counts=True)
    max_count = np.max(counts)
    if max_count == 1:  # No repeated values
        return None
    modes = unique[counts == max_count]
    if len(modes) == 1:
        return float(modes[0])
    return [float(m) for m in modes]
```

### analyze.py Routing Addition

```python
# In analyze.py - Add to imports
from api.utils.capacidad_proceso_validator import validate_capacidad_proceso_file
from api.utils.capacidad_proceso_calculator import calculate_basic_statistics

# Add to SUPPORTED_ANALYSIS_TYPES
SUPPORTED_ANALYSIS_TYPES = {'msa', 'capacidad_proceso'}

# Add routing logic after MSA validation
if analysis_type == 'capacidad_proceso':
    validated_data, validation_error = validate_capacidad_proceso_file(df)
    if validation_error:
        update_file_validation(file_id, is_valid=False, errors=validation_error)
        response = validation_error_response(validation_error)
        self.send_json_response(400, response)
        return

    # Update file status
    update_file_validation(file_id, is_valid=True)

    # Calculate basic statistics (Story 7.1 scope)
    basic_stats = calculate_basic_statistics(validated_data['values'])

    # Build response (minimal for Story 7.1 - expanded in later stories)
    analysis_output = {
        'results': {
            'basic_statistics': basic_stats,
            'sample_size': len(validated_data['values']),
            'warnings': validated_data.get('warnings', [])
        },
        'chartData': [],  # Empty for Story 7.1 - charts added in Epic 8
        'instructions': _generate_basic_stats_instructions(basic_stats)
    }
```

### Plantillas Page Card Pattern

Follow existing MSA card exactly:

```tsx
// In /app/(dashboard)/plantillas/page.tsx
<Card>
  <CardHeader>
    <CardTitle>Análisis de Capacidad de Proceso</CardTitle>
    <CardDescription>
      Evalúa si tu proceso cumple con las especificaciones del cliente
    </CardDescription>
  </CardHeader>
  <CardContent>
    <a href="/templates/plantilla-capacidad-proceso.xlsx" download>
      <Button>
        <Download className="mr-2 h-4 w-4" />
        Descargar Plantilla
      </Button>
    </a>
  </CardContent>
</Card>
```

### Excel Template Structure

```
plantilla-capacidad-proceso.xlsx
Sheet1:
┌─────────┐
│ Valores │ ← Header (row 1)
├─────────┤
│  97.52  │ ← Sample data (rows 2-21)
│ 111.20  │
│  83.97  │
│ 103.58  │
│  99.45  │
│ 102.33  │
│  95.67  │
│ 108.12  │
│ 100.89  │
│  98.23  │
│ 104.56  │
│  96.78  │
│ 101.34  │
│ 105.67  │
│  99.01  │
│ 107.45  │
│  94.56  │
│ 103.21  │
│ 100.00  │
│ 102.88  │
└─────────┘
```

### TypeScript Types Addition

```typescript
// In /types/analysis.ts
export interface CapacidadProcesoBasicStats {
  mean: number;
  median: number;
  mode: number | number[] | null;
  std_dev: number;
  min: number;
  max: number;
  range: number;
  count: number;
}

export interface CapacidadProcesoResult {
  basic_statistics: CapacidadProcesoBasicStats;
  sample_size: number;
  warnings: string[];
}
```

### Spanish Error Messages

Add to `/constants/messages.ts`:

```typescript
export const CAPACIDAD_PROCESO_ERRORS = {
  NO_NUMERIC_COLUMN: 'No se encontró una columna numérica. El archivo debe contener una columna "Valores" con datos numéricos.',
  EMPTY_CELLS: 'Se encontraron celdas vacías en las siguientes filas: {rows}. Por favor, completa todos los valores.',
  NON_NUMERIC_VALUES: 'Se encontraron valores no numéricos en las siguientes filas: {rows}. Todos los valores deben ser números.',
  SAMPLE_SIZE_WARNING: 'Se recomienda un mínimo de 20 valores para obtener estimaciones confiables de capacidad. El archivo contiene {count} valores.',
};
```

### Previous Story Learnings (Epic 6)

From Story 6.2 and 6.3:
- 976+ tests passing - maintain test coverage
- All error messages must be in Spanish
- Console-free production code (no console.log in production)
- Follow Setec brand colors consistently
- Use existing response utilities from `api/utils/response.py`

### Git Intelligence

Recent commits show:
- `804e9dc`: Fix display of operator IDs in MSA output - numeric formatting matters
- `56f7925`: Improved MSA output and chart separation - modular chart data
- `4852b2e`: Removed unused token_usage table - clean unused code

### Testing Standards

**Pytest patterns from existing tests:**

```python
# test_capacidad_proceso_validator.py
import pytest
import pandas as pd
from api.utils.capacidad_proceso_validator import validate_capacidad_proceso_file

def test_valid_file_with_valores_column():
    df = pd.DataFrame({'Valores': [1.0, 2.0, 3.0, 4.0, 5.0] * 5})
    validated, error = validate_capacidad_proceso_file(df)
    assert error is None
    assert 'values' in validated
    assert len(validated['values']) == 25
    assert validated['warnings'] == []

def test_empty_cells_reports_row_numbers():
    df = pd.DataFrame({'Valores': [1.0, None, 3.0, None, 5.0]})
    validated, error = validate_capacidad_proceso_file(df)
    assert error is not None
    assert error['code'] == 'EMPTY_CELLS'
    assert '3' in error['message']  # Row 3 (0-indexed row 2 + 1 header)
    assert '5' in error['message']  # Row 5

def test_sample_size_warning_below_20():
    df = pd.DataFrame({'Valores': [1.0, 2.0, 3.0, 4.0, 5.0]})
    validated, error = validate_capacidad_proceso_file(df)
    assert error is None
    assert len(validated['warnings']) == 1
    assert '20' in validated['warnings'][0]
```

### Critical Constraints

1. **NO scipy** - Vercel 250MB limit; use numpy only
2. **Pure Python for all statistics** - Follow msa_calculator.py pattern
3. **Spanish-only error messages** - Match existing error patterns
4. **Row numbers are 1-indexed in UI** - Account for header row + 0-indexing
5. **Story 7.1 ONLY outputs basic stats** - No charts, no normality, no control charts (those are Stories 7.2-7.4)

### Dependencies

**Python (already installed via requirements.txt):**
- pandas>=2.0.0
- numpy>=1.24.0
- openpyxl>=3.1.0

**No new dependencies required for this story.**

### Out of Scope for Story 7.1

These features are covered in later stories:
- Anderson-Darling normality test (Story 7.2)
- Box-Cox/Johnson transformations (Story 7.2)
- Distribution fitting (Story 7.2)
- I-MR control charts (Story 7.3)
- Stability rules evaluation (Story 7.3)
- Cp/Cpk/Pp/Ppk indices (Story 7.4)
- Chart components (Epic 8)
- SpecLimitsForm component (Epic 8)

### Project Structure Notes

**Files to create:**
- `/api/utils/capacidad_proceso_validator.py` - Validation logic
- `/api/utils/capacidad_proceso_calculator.py` - Statistics calculation
- `/api/tests/test_capacidad_proceso_validator.py` - Validator tests
- `/api/tests/test_capacidad_proceso_calculator.py` - Calculator tests
- `/public/templates/plantilla-capacidad-proceso.xlsx` - Excel template

**Files to modify:**
- `/api/analyze.py` - Add routing for 'capacidad_proceso'
- `/app/(dashboard)/plantillas/page.tsx` - Add template card
- `/constants/analysis.ts` - Add analysis type
- `/types/analysis.ts` - Add result interface
- `/constants/messages.ts` - Add Spanish error messages

### References

- [Source: epics.md#story-71-file-validation-basic-statistics-calculator] - Story requirements
- [Source: prd-v2.md#requisitos-funcionales-capacidad-de-proceso] - FR-CP1 through FR-CP11
- [Source: architecture.md#pure-python-statistical-implementation] - No scipy constraint
- [Source: architecture.md#estructura-de-respuestas-api] - Response patterns
- [Source: api/analyze.py] - Current endpoint implementation
- [Source: api/utils/msa_validator.py] - Validator pattern reference
- [Source: api/utils/msa_calculator.py] - Calculator pattern reference

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A - No debugging issues encountered.

### Completion Notes List

- ✅ Created `capacidad_proceso_validator.py` with full validation logic following MSA validator patterns
- ✅ Created `capacidad_proceso_calculator.py` with basic statistics calculator (pure numpy, no scipy)
- ✅ Added routing in `analyze.py` for 'capacidad_proceso' analysis type
- ✅ Created Excel template with 20 sample values following the exact structure from Dev Notes
- ✅ Updated templates constant to add Capacidad de Proceso template card
- ✅ Added TypeScript types `CapacidadProcesoBasicStats` and `CapacidadProcesoResult`
- ✅ Added Spanish error messages constant `CAPACIDAD_PROCESO_ERRORS`
- ✅ Added `ANALYSIS_TYPES` constant for supported analysis types
- ✅ Created 30 validator tests (all passing)
- ✅ Created 30 calculator tests (all passing)
- ✅ All 60 new tests pass
- ✅ No regressions in existing tests (4 pre-existing MSA chart test failures unrelated to this story)
- ✅ All TypeScript linting passes for modified files

**Code Review Fixes Applied (2026-02-20):**
- ✅ Fixed HIGH #1: Added 'capacidad_proceso' to AnalysisType union in types/analysis.ts
- ✅ Fixed HIGH #2: Added CapacidadProcesoResult to AnalysisResult.results union type
- ✅ Fixed HIGH #3: Added 6 integration tests for capacidad_proceso routing in test_analyze.py
- ✅ Fixed MEDIUM #4: Updated docstring in analyze.py to mention both MSA and Process Capability
- ✅ Fixed MEDIUM #5: Updated GET endpoint message from "MSA Analysis" to "Statistical Analysis"
- ✅ MEDIUM #6: Verified - empty DataFrame test already exists in validator tests, added integration test
- ✅ Total tests: 221 passing (6 new integration tests added)

### Change Log

| Date | Change |
|------|--------|
| 2026-02-20 | Story implementation completed - all 7 tasks finished |
| 2026-02-20 | Code review fixes applied - 3 HIGH, 2 MEDIUM issues fixed, status → done |

### File List

**New Files:**
- `api/utils/capacidad_proceso_validator.py` - Capacidad de Proceso file validation
- `api/utils/capacidad_proceso_calculator.py` - Basic statistics calculator
- `api/tests/test_capacidad_proceso_validator.py` - 30 validator tests
- `api/tests/test_capacidad_proceso_calculator.py` - 30 calculator tests
- `public/templates/plantilla-capacidad-proceso.xlsx` - Excel template with sample data

**Modified Files:**
- `api/analyze.py` - Added 'capacidad_proceso' to SUPPORTED_ANALYSIS_TYPES and routing logic; updated docstring and GET message
- `api/tests/test_analyze.py` - Added 6 integration tests for capacidad_proceso routing (TestAnalyzeEndpointCapacidadProcesoIntegration)
- `constants/analysis.ts` - Added ANALYSIS_TYPES constant
- `constants/templates.ts` - Added Capacidad de Proceso template definition
- `constants/messages.ts` - Added CAPACIDAD_PROCESO_ERRORS constant
- `types/analysis.ts` - Added CapacidadProcesoBasicStats, CapacidadProcesoResult interfaces; updated AnalysisType union and AnalysisResult.results
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Updated story status
