# Story 4.2: File Validation with Error Feedback

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **clear feedback when my uploaded file has problems**,
So that **I can fix the issues and re-upload without guessing what went wrong**.

**FRs covered:** FR-TOOL3, FR-TOOL4, FR-TOOL5

## Acceptance Criteria

1. **Given** an MSA file is submitted for analysis, **When** validation runs, **Then** the validator checks for required columns (Part, Operator, Measurement columns), **And** the validator checks that measurement columns contain numeric data, **And** the validator checks for minimum required rows (at least 2 parts, 2 operators, 2 measurements)

2. **Given** the file is missing required columns, **When** validation fails, **Then** the error message specifies which columns are missing, **And** the message is in Spanish: "Faltan columnas requeridas: {column_names}. La plantilla debe incluir Part, Operator, y columnas de medición.", **And** the file status is updated to 'invalid' with validation_errors JSON

3. **Given** a column contains non-numeric data where numbers are expected, **When** validation fails, **Then** the error message specifies the exact row and column, **And** the message is in Spanish: "La celda {column}{row} contiene '{value}' pero se esperaba un número.", **And** all such errors are collected and returned together (not just the first one)

4. **Given** the file has empty required cells, **When** validation fails, **Then** the error message specifies which cells are empty, **And** the message is in Spanish: "Celdas vacías encontradas en: {cell_references}. Todos los campos de medición son requeridos."

5. **Given** validation passes, **When** the file is valid, **Then** the file status is updated to 'valid', **And** processing continues to the calculation step, **And** validated_at timestamp is recorded

6. **Given** a user receives a validation error, **When** they fix their file and re-upload, **Then** the new file is processed independently, **And** the previous failed file remains in history (for reference), **And** the agent acknowledges the re-upload and processes the new file

## Tasks / Subtasks

- [x] **Task 1: Create MSA File Validator Module** (AC: #1)
  - [x] Create `api/utils/msa_validator.py`
  - [x] Define required column names: `Part`, `Operator`, plus measurement columns (pattern: `Measurement*` or `Medicion*`)
  - [x] Function `find_required_columns(df: pd.DataFrame) -> tuple[dict, list[str]]` returns found columns mapping and missing columns list
  - [x] Function `detect_measurement_columns(df: pd.DataFrame) -> list[str]` finds all measurement-like columns
  - [x] Function `validate_minimum_data(df: pd.DataFrame, columns: dict) -> list[str]` checks minimum parts, operators, measurements
  - [x] Add docstrings in English for code clarity
  - [x] All user-facing error messages MUST be in Spanish

- [x] **Task 2: Implement Column Structure Validation** (AC: #1, #2)
  - [x] In `msa_validator.py`, create `validate_column_structure(df: pd.DataFrame) -> tuple[dict | None, dict | None]`
  - [x] Check for required `Part` column (case-insensitive, accept: Part, Parte, PART, PARTE)
  - [x] Check for required `Operator` column (case-insensitive, accept: Operator, Operador, OPERATOR, OPERADOR)
  - [x] Check for at least 2 measurement columns (pattern: starts with Measurement, Medicion, or M1/M2/M3 style)
  - [x] Return `(column_mapping, None)` on success or `(None, error_dict)` on failure
  - [x] Error dict format: `{ 'code': 'MISSING_COLUMNS', 'message': str, 'missing': list[str] }`

- [x] **Task 3: Implement Data Type Validation** (AC: #1, #3)
  - [x] In `msa_validator.py`, create `validate_numeric_data(df: pd.DataFrame, measurement_cols: list[str]) -> list[dict]`
  - [x] For each measurement column, check each cell for numeric data
  - [x] Collect ALL non-numeric cells (don't stop at first error)
  - [x] Return list of error objects: `{ 'column': str, 'row': int, 'value': str }`
  - [x] Handle edge cases: strings that look like numbers with commas (European format), whitespace-padded values
  - [x] Limit to first 20 errors to avoid overwhelming messages

- [x] **Task 4: Implement Empty Cell Detection** (AC: #4)
  - [x] In `msa_validator.py`, create `validate_no_empty_cells(df: pd.DataFrame, measurement_cols: list[str]) -> list[str]`
  - [x] Check all measurement columns for empty/NaN values
  - [x] Return list of cell references in Excel notation (e.g., "C5", "D8")
  - [x] Also check Part and Operator columns for empty values
  - [x] Limit to first 20 empty cells to avoid overwhelming messages

- [x] **Task 5: Implement Minimum Data Requirements** (AC: #1)
  - [x] In `msa_validator.py`, create `validate_data_requirements(df: pd.DataFrame, columns: dict) -> dict | None`
  - [x] Check: at least 2 unique parts
  - [x] Check: at least 2 unique operators
  - [x] Check: at least 2 measurement columns
  - [x] Return None if valid, or error dict with specific violations

- [x] **Task 6: Create Main Validation Orchestrator** (AC: #1, #2, #3, #4, #5)
  - [x] In `msa_validator.py`, create `validate_msa_file(df: pd.DataFrame) -> tuple[dict | None, dict | None]`
  - [x] Call validations in order: column structure → data types → empty cells → data requirements
  - [x] Stop on first category of errors (don't mix column errors with data errors)
  - [x] On success, return `(validated_columns, None)` with normalized column names
  - [x] On failure, return `(None, error_dict)` with comprehensive error info
  - [x] Error dict has: `{ 'code': str, 'message': str, 'details': list[dict] }`

- [x] **Task 7: Format User-Friendly Error Messages** (AC: #2, #3, #4)
  - [x] Create `format_validation_error(error_dict: dict) -> str` for user display
  - [x] For missing columns: "Faltan columnas requeridas: Part, Operator. La plantilla debe incluir Part, Operator, y columnas de medición."
  - [x] For non-numeric: "Las siguientes celdas contienen datos no numéricos:\n- La celda C5 contiene 'abc' pero se esperaba un número.\n- ..."
  - [x] For empty cells: "Celdas vacías encontradas en: C5, D8, E12. Todos los campos de medición son requeridos."
  - [x] For minimum data: "Datos insuficientes: Se requieren al menos 2 partes (encontradas: 1), 2 operadores (encontrados: 1)."

- [x] **Task 8: Update File Status on Validation** (AC: #2, #5)
  - [x] In `api/utils/supabase_client.py`, ensure `update_file_status` can save validation_errors JSON
  - [x] On validation failure: status='invalid', validation_errors=error_dict
  - [x] On validation success: status='valid', validated_at=NOW()
  - [x] Add `update_file_validation(file_id: str, is_valid: bool, errors: dict | None = None) -> bool`

- [x] **Task 9: Integrate Validator into Analysis Pipeline** (AC: #1, #5, #6)
  - [x] Update `api/analyze.py` to call validation before MSA calculation
  - [x] After loading DataFrame, call `validate_msa_file(df)`
  - [x] If validation fails, update file status and return error response
  - [x] If validation passes, update file status to 'valid' and continue to calculation
  - [x] New error code: `FILE_VALIDATION_ERROR` for file validation failures

- [x] **Task 10: Update Response Module for Validation Errors** (AC: #2, #3, #4)
  - [x] In `api/utils/response.py`, add `FILE_VALIDATION_ERROR` to ERROR_MESSAGES dict
  - [x] Create `validation_error_response(error_dict: dict) -> dict` helper
  - [x] Include error details in response for frontend display
  - [x] Response format: `{ data: null, error: { code: 'FILE_VALIDATION_ERROR', message: str, details: {...} } }`

- [x] **Task 11: Create Comprehensive Python Unit Tests** (AC: all)
  - [x] Create `api/tests/test_msa_validator.py`
    - [x] Test valid MSA file structure (all columns present)
    - [x] Test missing Part column
    - [x] Test missing Operator column
    - [x] Test missing measurement columns (only 1 found)
    - [x] Test non-numeric data in measurement column
    - [x] Test multiple non-numeric errors collected
    - [x] Test empty cells detected
    - [x] Test insufficient parts (only 1)
    - [x] Test insufficient operators (only 1)
    - [x] Test case-insensitive column matching (Part, PART, Parte)
    - [x] Test column patterns (Measurement1, Medicion1, M1)
    - [x] Test error message format in Spanish
    - [x] Test maximum 20 errors limit
  - [x] Create test fixtures with sample DataFrames
  - [x] Run with `cd api && python -m pytest tests/test_msa_validator.py -v`

- [x] **Task 12: Integration Test with Endpoint** (AC: #1, #5, #6)
  - [x] Add tests to `api/tests/test_analyze.py`:
    - [x] Test POST with valid file returns 200 and proceeds to analysis
    - [x] Test POST with invalid file structure returns 400 with FILE_VALIDATION_ERROR
    - [x] Test validation errors include Spanish messages
    - [x] Test file status updated to 'invalid' on failure
    - [x] Test file status updated to 'valid' on success

## Dev Notes

### Critical Architecture Patterns

**From Previous Story 4.1 - Existing File Flow:**
The analysis endpoint already has:
1. File fetch from Supabase Storage working
2. Excel loading into pandas DataFrame working
3. Response formatting with `{ data, error }` structure
4. Error codes and Spanish messages defined

**Current Pipeline (before this story):**
```
POST /api/analyze → parse body → fetch file → load DataFrame → MSA calculation → return results
```

**New Pipeline (after this story):**
```
POST /api/analyze → parse body → fetch file → load DataFrame → VALIDATE FILE → update status → MSA calculation → return results
                                                                    │
                                                                    ▼
                                                              (if invalid)
                                                          return error response
```

### Expected File Structure (MSA Template)

The MSA template (`public/templates/plantilla-msa.xlsx`) has this structure:

| Part | Operator | Measurement1 | Measurement2 | Measurement3 |
|------|----------|--------------|--------------|--------------|
| 1    | A        | 10.5         | 10.6         | 10.4         |
| 1    | B        | 10.7         | 10.5         | 10.6         |
| 2    | A        | 11.2         | 11.3         | 11.1         |
| ...  | ...      | ...          | ...          | ...          |

**Validation Requirements:**
- Must have Part column (case-insensitive)
- Must have Operator column (case-insensitive)
- Must have at least 2 measurement columns
- At least 2 unique parts
- At least 2 unique operators
- All measurement cells must be numeric (no text, no empty)

### Column Name Flexibility

Accept these variations (case-insensitive):
- Part: `Part`, `Parte`, `PART`, `PARTE`, `Pieza`
- Operator: `Operator`, `Operador`, `OPERATOR`, `OPERADOR`, `Op`
- Measurements: `Measurement1`, `Medicion1`, `M1`, `Med1`, `Medición1`, `Measurement 1`

### Validation Error Response Format

```python
# On validation failure
{
    "data": None,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "El archivo no cumple con el formato requerido.",
        "details": {
            "type": "missing_columns",  # or "non_numeric", "empty_cells", "insufficient_data"
            "items": [
                {"column": "Part", "missing": True},
                {"column": "C5", "value": "abc", "expected": "número"},
                # etc.
            ]
        }
    }
}
```

### Error Message Templates (Spanish)

```python
VALIDATION_MESSAGES = {
    'MISSING_COLUMNS': 'Faltan columnas requeridas: {columns}. La plantilla debe incluir Part, Operator, y columnas de medición.',
    'NON_NUMERIC_CELL': 'La celda {column}{row} contiene \'{value}\' pero se esperaba un número.',
    'NON_NUMERIC_SUMMARY': 'Las siguientes celdas contienen datos no numéricos:',
    'EMPTY_CELLS': 'Celdas vacías encontradas en: {cells}. Todos los campos de medición son requeridos.',
    'INSUFFICIENT_PARTS': 'Datos insuficientes: Se requieren al menos 2 partes diferentes (encontradas: {count}).',
    'INSUFFICIENT_OPERATORS': 'Datos insuficientes: Se requieren al menos 2 operadores diferentes (encontrados: {count}).',
    'INSUFFICIENT_MEASUREMENTS': 'Datos insuficientes: Se requieren al menos 2 columnas de medición (encontradas: {count}).',
}
```

### File Status Transitions

```
pending → validating → valid → processed
              │
              └──► invalid (terminal for this file; user uploads new file)
```

### Integration with Existing Code

**Files to Modify:**
- `api/analyze.py` - Add validation step after DataFrame loading
- `api/utils/response.py` - Add VALIDATION_ERROR code and message
- `api/utils/supabase_client.py` - Ensure update_file_status handles validation_errors

**New Files:**
- `api/utils/msa_validator.py` - All validation logic
- `api/tests/test_msa_validator.py` - Validation tests

### Previous Story Learnings (Story 4.1)

From the completed Story 4.1:
- Python test structure is in `api/tests/` with pytest
- 47 tests already passing; must not break any
- Error messages use Spanish via `ERROR_MESSAGES` dict in `response.py`
- UUID validation already implemented in `analyze.py`
- File status updates working via `supabase_client.py`
- Response format is standardized: `{ data: {...}, error: null }` or `{ data: null, error: {...} }`

### Testing Strategy

**Unit Tests (New in `test_msa_validator.py`):**
- Test each validation function independently
- Use mock DataFrames with specific error conditions
- Test Spanish message formatting
- Test error collection limits

**Integration Tests (Add to `test_analyze.py`):**
- Mock the Supabase client to return specific file content
- Test full flow from POST to validation error response
- Verify HTTP status codes (400 for validation errors)

**Local Testing:**
```bash
# Run all Python tests
cd api
python -m pytest tests/ -v

# Run only validator tests
python -m pytest tests/test_msa_validator.py -v

# Run with coverage
python -m pytest tests/ -v --cov=utils
```

### Column Detection Algorithm

```python
def detect_measurement_columns(df: pd.DataFrame) -> list[str]:
    """
    Find columns that appear to be measurement columns.

    Patterns to match (case-insensitive):
    - Measurement*, Medicion*, Medición*, Med*
    - M1, M2, M3, etc.
    - Replica*, Rep*
    """
    measurement_cols = []
    patterns = [
        r'^measurement\s*\d*$',
        r'^medici[oó]n\s*\d*$',
        r'^med\s*\d*$',
        r'^m\d+$',
        r'^replica\s*\d*$',
        r'^rep\s*\d*$',
    ]

    for col in df.columns:
        col_lower = col.lower().strip()
        for pattern in patterns:
            if re.match(pattern, col_lower):
                measurement_cols.append(col)
                break

    return measurement_cols
```

### Database Tables Used

**files table (update status):**
```sql
-- Update file status and validation errors
UPDATE files
SET
  status = $status,  -- 'valid' or 'invalid'
  validation_errors = $errors::jsonb,  -- null for valid, error dict for invalid
  validated_at = CASE WHEN $status = 'valid' THEN NOW() ELSE NULL END
WHERE id = $file_id;
```

### Security Considerations

1. **Input Sanitization:** Validate all DataFrame content before processing
2. **Error Message Safety:** Don't expose internal paths or system info in errors
3. **Resource Limits:** Limit error collection to 20 items to prevent memory issues
4. **Logging:** Log validation failures with file_id for debugging (not file content)

### References

- [Source: prd.md#tool-de-análisis-mvp] - FR-TOOL3, FR-TOOL4, FR-TOOL5 validation requirements
- [Source: architecture.md#arquitectura-de-datos-supabase] - files table schema with status, validation_errors
- [Source: epics.md#story-42-file-validation-with-error-feedback] - Story requirements and ACs
- [Source: 4-1-python-analysis-endpoint-structure.md] - Previous story patterns, testing approach
- [Source: architecture.md#patrones-de-proceso] - Error handling patterns and Spanish messages

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- No debug issues encountered

### Completion Notes List

- ✅ Created comprehensive MSA file validator module with all validation functions
- ✅ Implemented column structure validation (Part, Operator, Measurement columns) with case-insensitive matching
- ✅ Implemented data type validation for numeric data in measurement columns
- ✅ Implemented empty cell detection with Excel notation (e.g., "C5", "D8")
- ✅ Implemented minimum data requirements validation (2+ parts, 2+ operators, 2+ measurements)
- ✅ Created main validation orchestrator that stops on first category of errors
- ✅ All user-facing error messages are in Spanish as required
- ✅ Added `update_file_validation()` function to update file status to 'valid' or 'invalid'
- ✅ Integrated validator into analysis pipeline (validates before MSA calculation)
- ✅ Added `validation_error_response()` helper for standardized error responses
- ✅ Created 32 unit tests for the validator module (all passing)
- ✅ Created 4 integration tests for validation in the endpoint (all passing)
- ✅ Total test count: 92 tests passing, 0 failures (after code review fixes)

### Code Review Fixes Applied

1. **HIGH: Fixed broken api/analyze.py** - Removed duplicate import/class definition that broke the file
2. **HIGH: Fixed validated_at timestamp** - Changed from string `'now()'` to proper `datetime.now(timezone.utc).isoformat()` in supabase_client.py
3. **MEDIUM: Added edge case tests** - Added tests for European decimal format, whitespace-padded values, and Pieza column pattern
4. **MEDIUM: Documented European format handling** - Validator correctly handles comma-to-period conversion for European decimal format (10,5 → 10.5)

### Change Log

- 2026-02-05: Code review fixes applied
  - Fixed broken api/analyze.py with duplicate code section
  - Fixed validated_at timestamp to use proper UTC timestamp instead of string literal
  - Added 5 edge case tests for European decimals, whitespace, and Pieza column pattern
  - Test count: 92 tests all passing

- 2026-02-05: Implemented file validation with error feedback (Story 4.2)
  - Created MSA validator module with column detection, data type validation, empty cell detection
  - Integrated validation into analysis pipeline with file status updates
  - Added comprehensive unit and integration tests

### File List

**New Files:**
- api/utils/msa_validator.py
- api/tests/test_msa_validator.py

**Modified Files:**
- api/analyze.py (added validation step after DataFrame loading)
- api/utils/response.py (added FILE_VALIDATION_ERROR and validation_error_response helper)
- api/utils/supabase_client.py (added update_file_validation function)
- api/tests/test_analyze.py (added 4 validation integration tests, updated existing tests to mock validation)
- api/tests/test_supabase_client.py (added 4 tests for update_file_validation function)
