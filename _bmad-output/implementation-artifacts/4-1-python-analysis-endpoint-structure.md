# Story 4.1: Python Analysis Endpoint Structure

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **system**,
I want **a Python serverless endpoint that routes analysis requests**,
So that **different analysis types can be handled by a single API**.

**FRs covered:** FR-TOOL7

## Acceptance Criteria

1. **Given** the analysis endpoint needs to be created, **When** `/api/analyze.py` is implemented, **Then** it accepts POST requests with `{ analysis_type: string, file_id: string }`, **And** it routes internally based on analysis_type (MVP: only 'msa'), **And** it returns JSON with structure `{ results, chartData, instructions }` on success, **And** it returns JSON with structure `{ error: { code, message, details } }` on failure

2. **Given** the Python environment needs dependencies, **When** requirements.txt is configured, **Then** it includes pandas>=2.0.0, numpy>=1.24.0, openpyxl>=3.1.0, scipy>=1.11.0

3. **Given** the endpoint receives a request for an unknown analysis_type, **When** the routing logic executes, **Then** it returns an error: `{ error: { code: 'UNKNOWN_ANALYSIS_TYPE', message: 'Tipo de análisis no soportado.' } }`, **And** HTTP status 400 is returned

4. **Given** the endpoint needs to fetch the file, **When** file_id is provided, **Then** the file is fetched from Supabase Storage using the service role key, **And** the file content is loaded into a pandas DataFrame, **And** if file fetch fails, an appropriate error is returned

5. **Given** the endpoint completes successfully, **When** results are returned, **Then** the file status in the files table is updated to 'processed', **And** the analysis_results table is populated with the results

## Tasks / Subtasks

- [x] **Task 1: Update Python Endpoint Structure** (AC: #1, #3)
  - [x] Replace placeholder in `api/analyze.py` with full implementation
  - [x] Create `handler` class extending `BaseHTTPRequestHandler`
  - [x] Parse JSON body: `{ analysis_type: string, file_id: string }`
  - [x] Validate required fields (return 400 if missing)
  - [x] Create routing logic for `analysis_type`
  - [x] Return 400 error for unknown analysis types
  - [x] Handle OPTIONS for CORS preflight

- [x] **Task 2: Create Supabase Integration Module** (AC: #4)
  - [x] Create `api/utils/__init__.py` (empty, makes it a package)
  - [x] Create `api/utils/supabase_client.py`
  - [x] Function `create_supabase_client()` using `SUPABASE_SERVICE_ROLE_KEY`
  - [x] Function `fetch_file_from_storage(file_id: str) -> bytes`
  - [x] Query files table to get `storage_path`
  - [x] Download file bytes from storage bucket
  - [x] Handle file not found errors

- [x] **Task 3: Create File Loading Utilities** (AC: #4)
  - [x] Create `api/utils/file_loader.py`
  - [x] Function `load_excel_to_dataframe(file_bytes: bytes) -> pd.DataFrame`
  - [x] Use pandas with openpyxl engine
  - [x] Handle corrupted or unreadable files
  - [x] Return clear error if file cannot be parsed

- [x] **Task 4: Create Database Update Module** (AC: #5)
  - [x] Add to `api/utils/supabase_client.py`
  - [x] Function `update_file_status(file_id: str, status: str, validation_errors: dict = None) -> bool`
  - [x] Function `save_analysis_results(message_id: str, file_id: str, analysis_type: str, results: dict, chart_data: list, instructions: str) -> bool`
  - [x] Handle database errors gracefully

- [x] **Task 5: Create MSA Analysis Placeholder** (AC: #1)
  - [x] Create `api/utils/msa_calculator.py`
  - [x] Function `analyze_msa(df: pd.DataFrame) -> dict` (placeholder)
  - [x] Return placeholder `{ results: {}, chartData: [], instructions: "" }`
  - [x] Add `# TODO: Implement in Story 4.3` comment
  - [x] Structure prepares for full implementation

- [x] **Task 6: Create Response Helpers** (AC: #1, #3)
  - [x] Create `api/utils/response.py`
  - [x] Function `success_response(results, chart_data, instructions) -> dict`
  - [x] Function `error_response(code, message, details=None) -> dict`
  - [x] Standard error codes: `UNKNOWN_ANALYSIS_TYPE`, `FILE_NOT_FOUND`, `FILE_FETCH_ERROR`, `INVALID_FILE`, `ANALYSIS_ERROR`, `DATABASE_ERROR`

- [x] **Task 7: Integrate All Components in Endpoint** (AC: #1, #3, #4, #5)
  - [x] Import all utility modules
  - [x] Implement full POST handler flow:
    1. Parse and validate request body
    2. Fetch file from Supabase Storage
    3. Load file into DataFrame
    4. Route to appropriate analyzer (MSA for MVP)
    5. Update file status to 'processed'
    6. Save results to analysis_results table (if message_id provided)
    7. Return success response
  - [x] Add comprehensive error handling at each step
  - [x] Log errors for debugging (use print for Vercel logs)

- [x] **Task 8: Add Environment Variables Handling** (AC: #4)
  - [x] Update `api/utils/supabase_client.py`
  - [x] Read `SUPABASE_URL` from environment
  - [x] Read `SUPABASE_SERVICE_ROLE_KEY` from environment
  - [x] Raise clear error if env vars missing

- [x] **Task 9: Update Requirements** (AC: #2)
  - [x] Verify `api/requirements.txt` has all dependencies
  - [x] Add `supabase>=2.0.0` for Python Supabase client
  - [x] Ensure versions are compatible

- [x] **Task 10: Add Request/Response Types Documentation** (AC: #1)
  - [x] Add docstrings to `api/analyze.py`
  - [x] Document request body schema
  - [x] Document success response schema
  - [x] Document error response schema
  - [x] Document all error codes and messages

- [x] **Task 11: Create Python Unit Tests** (AC: all)
  - [x] Create `api/tests/__init__.py`
  - [x] Create `api/tests/test_analyze.py`
    - [x] Test POST with valid request structure
    - [x] Test POST with missing analysis_type (400)
    - [x] Test POST with missing file_id (400)
    - [x] Test POST with unknown analysis_type (400)
    - [x] Test error response format
  - [x] Create `api/tests/test_file_loader.py`
    - [x] Test load_excel_to_dataframe success
    - [x] Test load_excel_to_dataframe with invalid bytes
  - [x] Create `api/tests/test_response.py`
    - [x] Test success_response format
    - [x] Test error_response format

- [x] **Task 12: Add CORS Headers** (AC: #1)
  - [x] Add Access-Control-Allow-Origin header
  - [x] Add Access-Control-Allow-Methods header
  - [x] Add Access-Control-Allow-Headers header
  - [x] Handle OPTIONS preflight requests

## Dev Notes

### Critical Architecture Patterns

**From Architecture Document - Python Serverless Configuration:**

```json
// vercel.json (already configured)
{
  "functions": {
    "api/*.py": {
      "runtime": "python3.11",
      "maxDuration": 60
    }
  },
  "rewrites": [
    { "source": "/api/analyze", "destination": "/api/analyze.py" }
  ]
}
```

**From Architecture Document - API Response Format:**

All responses MUST follow this structure:
```typescript
// Success response
{
  data: {
    results: { /* numerical analysis data */ },
    chartData: [ /* structured data for frontend charts */ ],
    instructions: "markdown presentation guidance"
  },
  error: null
}

// Error response
{
  data: null,
  error: {
    code: 'ERROR_CODE',
    message: 'Mensaje en español para el usuario',
    details?: { /* technical details for debugging */ }
  }
}
```

**From PRD - Tool de Análisis Architecture:**

```
Tool de Análisis:
- Endpoint único: POST /api/analyze
- Input: { analysis_type: string, file_id: string }
- Routea internamente al script Python apropiado basado en analysis_type
- El script Python valida estructura del archivo y tipos de datos
- Retorna:
  {
    "results": { /* datos numéricos del análisis */ },
    "chartData": [ /* datos estructurados para renderizar gráficos */ ],
    "instructions": "markdown con guía de presentación"
  }
```

### File Fetch Flow

```
POST /api/analyze
  { analysis_type: "msa", file_id: "uuid" }
        │
        ▼
┌───────────────────────────────────────────┐
│  1. Parse request body                     │
│     Validate: analysis_type, file_id       │
└─────────────────┬─────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────────┐
│  2. Query Supabase: files table            │
│     SELECT storage_path FROM files         │
│     WHERE id = file_id                     │
└─────────────────┬─────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────────┐
│  3. Fetch from Supabase Storage            │
│     GET analysis-files/{storage_path}      │
│     Returns: file bytes                    │
└─────────────────┬─────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────────┐
│  4. Load into pandas DataFrame             │
│     pd.read_excel(BytesIO(bytes))          │
└─────────────────┬─────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────────┐
│  5. Route to analyzer (msa_calculator)     │
│     Returns: results, chartData, instrs    │
└─────────────────┬─────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────────┐
│  6. Update file status → 'processed'       │
│  7. Save to analysis_results table         │
└─────────────────┬─────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────────────┐
│  8. Return success response                │
│     { data: {...}, error: null }           │
└───────────────────────────────────────────┘
```

### Supabase Python Client Setup

```python
# api/utils/supabase_client.py
import os
from supabase import create_client, Client

def get_supabase_client() -> Client:
    """
    Create Supabase client using service role key.
    Service role bypasses RLS for server-side operations.
    """
    url = os.environ.get('SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

    if not url or not key:
        raise ValueError('Missing Supabase environment variables')

    return create_client(url, key)


def fetch_file_from_storage(file_id: str) -> tuple[bytes, str | None]:
    """
    Fetch file bytes from Supabase Storage.

    Returns:
        tuple: (file_bytes, error_message)
        - On success: (bytes, None)
        - On error: (None, error_message)
    """
    supabase = get_supabase_client()

    # Get file record to retrieve storage path
    result = supabase.table('files').select('storage_path').eq('id', file_id).single().execute()

    if not result.data:
        return None, 'FILE_NOT_FOUND'

    storage_path = result.data['storage_path']

    # Download file from storage
    try:
        response = supabase.storage.from_('analysis-files').download(storage_path)
        return response, None
    except Exception as e:
        print(f'Storage download error: {e}')
        return None, 'FILE_FETCH_ERROR'
```

### File Loading with Pandas

```python
# api/utils/file_loader.py
import pandas as pd
from io import BytesIO

def load_excel_to_dataframe(file_bytes: bytes) -> tuple[pd.DataFrame | None, str | None]:
    """
    Load Excel file bytes into pandas DataFrame.

    Returns:
        tuple: (DataFrame, error_message)
        - On success: (DataFrame, None)
        - On error: (None, error_message)
    """
    try:
        df = pd.read_excel(BytesIO(file_bytes), engine='openpyxl')
        return df, None
    except Exception as e:
        print(f'Excel parse error: {e}')
        return None, 'INVALID_FILE'
```

### Error Response Standards

All error messages MUST be in Spanish:

```python
ERROR_MESSAGES = {
    'UNKNOWN_ANALYSIS_TYPE': 'Tipo de análisis no soportado.',
    'FILE_NOT_FOUND': 'El archivo no fue encontrado.',
    'FILE_FETCH_ERROR': 'No se pudo obtener el archivo del almacenamiento.',
    'INVALID_FILE': 'El archivo no es un Excel válido o está corrupto.',
    'ANALYSIS_ERROR': 'Ocurrió un error durante el análisis.',
    'DATABASE_ERROR': 'Error al guardar los resultados.',
    'MISSING_FIELD': 'Faltan campos requeridos: {fields}.',
    'VALIDATION_ERROR': 'Error de validación: {details}.',
}
```

### Python Project Structure

```
api/
├── analyze.py                  # Main endpoint handler
├── requirements.txt            # Python dependencies (already exists)
├── utils/
│   ├── __init__.py            # Package marker
│   ├── supabase_client.py     # Supabase integration
│   ├── file_loader.py         # Excel file loading
│   ├── msa_calculator.py      # MSA analysis (placeholder)
│   └── response.py            # Response helpers
└── tests/
    ├── __init__.py            # Package marker
    ├── test_analyze.py        # Endpoint tests
    ├── test_file_loader.py    # File loader tests
    └── test_response.py       # Response helper tests
```

### Database Tables Used

**files table (read + update):**
```sql
-- Query to get storage path
SELECT storage_path FROM files WHERE id = $file_id;

-- Update file status after processing
UPDATE files
SET status = 'processed', processed_at = NOW()
WHERE id = $file_id;
```

**analysis_results table (insert):**
```sql
INSERT INTO analysis_results (
  message_id,
  file_id,
  analysis_type,
  results,
  chart_data,
  instructions,
  python_version
) VALUES (
  $message_id,  -- Optional, may be NULL if standalone analysis
  $file_id,
  $analysis_type,
  $results::jsonb,
  $chart_data::jsonb,
  $instructions,
  '1.0.0'
);
```

### Vercel Environment Variables Required

```bash
# Already configured in Vercel (from Story 1.1):
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# For local development, add to .env.local:
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### CORS Configuration

```python
def send_cors_headers(self):
    """Add CORS headers for frontend access."""
    self.send_header('Access-Control-Allow-Origin', '*')
    self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
    self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

def do_OPTIONS(self):
    """Handle CORS preflight requests."""
    self.send_response(204)
    self.send_cors_headers()
    self.end_headers()
```

### MSA Calculator Placeholder Structure

```python
# api/utils/msa_calculator.py
import pandas as pd
from typing import TypedDict

class MSAResults(TypedDict):
    total_variation: float
    repeatability: float
    reproducibility: float
    part_to_part: float
    grr_percentage: float
    ndc: int

class MSAOutput(TypedDict):
    results: MSAResults
    chartData: list[dict]
    instructions: str

def analyze_msa(df: pd.DataFrame) -> tuple[MSAOutput | None, str | None]:
    """
    Perform MSA (Gauge R&R) analysis on measurement data.

    TODO: Full implementation in Story 4.3

    Args:
        df: DataFrame with columns: Part, Operator, Measurement1, Measurement2, ...

    Returns:
        tuple: (MSAOutput, error_message)
    """
    # Placeholder - will be implemented in Story 4.3
    return {
        'results': {
            'total_variation': 0.0,
            'repeatability': 0.0,
            'reproducibility': 0.0,
            'part_to_part': 0.0,
            'grr_percentage': 0.0,
            'ndc': 0
        },
        'chartData': [],
        'instructions': '# Análisis MSA\n\nPlaceholder - implementación completa en Story 4.3'
    }, None
```

### Testing Strategy

**Unit Tests (Python):**
- Use pytest for Python testing
- Mock Supabase client for database tests
- Mock storage for file fetch tests
- Test error conditions and edge cases

**Integration Points:**
- Verify endpoint accepts POST requests
- Verify request validation returns proper errors
- Verify response format matches specification
- Verify file fetch from Supabase works

**Local Testing:**
```bash
# Run Python tests
cd api
python -m pytest tests/ -v

# Test endpoint locally (requires Vercel CLI)
vercel dev
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"analysis_type":"msa","file_id":"test-uuid"}'
```

### Previous Story Learnings (Epic 3)

**Patterns to follow from Story 3.3:**
- Files table already has `status` field with values: 'pending', 'validating', 'valid', 'invalid', 'processed'
- File service in `lib/supabase/files.ts` handles file operations from Node.js side
- Storage bucket is named `analysis-files`
- File path pattern: `{user_id}/{conversation_id}/{file_id}.xlsx`
- Service role key required for server-side access

**Dependencies confirmed working:**
- Supabase Storage API working for uploads/downloads
- Files table RLS policies allow access via service role
- vercel.json correctly routes `/api/analyze` to Python function

### Security Considerations

1. **Service Role Key:** Only used server-side, never exposed to client
2. **File Access:** Python endpoint uses service role to bypass RLS
3. **Input Validation:** All inputs validated before processing
4. **Error Messages:** User-facing errors in Spanish, no stack traces
5. **Logging:** Sensitive data not logged, only error codes

### References

- [Source: prd.md#tool-de-análisis-mvp] - FR-TOOL7 endpoint specification
- [Source: prd.md#arquitectura-técnica] - Two-agent architecture with Python tool
- [Source: architecture.md#configuración-de-python-function] - Python serverless setup
- [Source: architecture.md#estructura-de-api-routes] - API route structure
- [Source: architecture.md#arquitectura-de-datos-supabase] - analysis_results table schema
- [Source: epics.md#story-41-python-analysis-endpoint-structure] - Story requirements and ACs
- [Source: 3-3-file-storage-display-in-conversation.md] - Previous story patterns and file service

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- No blocking issues encountered during implementation

### Completion Notes List

- ✅ Implemented complete Python analysis endpoint structure for POST /api/analyze
- ✅ Created modular utility structure in api/utils/ with:
  - response.py: Standardized success/error response formatting with Spanish error messages
  - file_loader.py: Excel file loading using pandas with openpyxl engine
  - supabase_client.py: Supabase client integration for file fetch, status update, and results storage
  - msa_calculator.py: Placeholder MSA analysis returning stub results (full implementation in Story 4.3)
- ✅ Endpoint accepts POST { analysis_type: "msa", file_id: "uuid" } and routes to MSA analyzer
- ✅ Full error handling with appropriate HTTP status codes (400, 404, 500)
- ✅ All error messages in Spanish per project requirements
- ✅ CORS headers configured for frontend access
- ✅ Added supabase>=2.0.0 to requirements.txt
- ✅ Created comprehensive test suite with 47 passing Python tests
- ✅ All 574 existing TypeScript/JavaScript tests continue to pass (no regressions)

**Code Review Fixes (2026-02-05):**
- ✅ Added UUID validation for file_id and message_id parameters
- ✅ Created comprehensive tests for supabase_client.py (19 new tests)
- ✅ Added test for invalid JSON body handling
- ✅ Added tests for UUID validation
- ✅ Improved error logging with traceback information for debugging

### Change Log

- 2026-02-05: Implemented Story 4.1 - Python Analysis Endpoint Structure (all 12 tasks completed)
- 2026-02-05: Code review fixes - Added UUID validation, supabase_client tests, improved error logging

### File List

**New Files:**
- api/utils/__init__.py
- api/utils/response.py
- api/utils/file_loader.py
- api/utils/supabase_client.py
- api/utils/msa_calculator.py
- api/tests/__init__.py
- api/tests/test_analyze.py
- api/tests/test_file_loader.py
- api/tests/test_response.py
- api/tests/test_supabase_client.py

**Modified Files:**
- api/analyze.py (replaced placeholder with full implementation, added UUID validation, improved error logging)
- api/requirements.txt (added supabase>=2.0.0)
