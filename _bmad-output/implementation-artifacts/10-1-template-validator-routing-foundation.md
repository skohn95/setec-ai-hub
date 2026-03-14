# Story 10.1: Template, Validator & Routing Foundation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to download a 2-sample hypothesis testing template and have my uploaded file validated correctly,
so that I can prepare my data with confidence and get clear error messages if something is wrong.

## Acceptance Criteria

### AC 1: Template Download
- **Given** a user navigates to the /plantillas page
- **When** they look for the hypothesis testing template
- **Then** the file `plantilla-hipotesis-2-muestras.xlsx` is available for download
- **And** it contains two columns: "Muestra A" and "Muestra B" with sample data rows

### AC 2: Valid File with Unequal Lengths
- **Given** a valid Excel file with two numeric columns of unequal length (e.g., 45 in A, 40 in B)
- **When** the validator processes the file
- **Then** it returns success with both columns extracted as numeric arrays
- **And** trailing empty cells in the shorter column are handled correctly (not flagged as errors)

### AC 3: Single Column Error
- **Given** an Excel file with only one numeric column
- **When** the validator processes the file
- **Then** it returns a validation error in Spanish: guidance to add a second column

### AC 4: Non-Numeric Values Error
- **Given** an Excel file with non-numeric values (e.g., "N/A" in row 15 of Muestra A)
- **When** the validator processes the file
- **Then** it returns a validation error with specific cell location (column, row)
- **And** the message is in Spanish with guidance on how to fix

### AC 5: Intercalated Empty Cells Error
- **Given** an Excel file with intercalated empty cells (e.g., row 8 of Muestra B is blank but row 9 has data)
- **When** the validator processes the file
- **Then** it reports the empty cell location as a validation error
- **And** distinguishes this from trailing blanks in a shorter column

### AC 6: Minimum Values Error
- **Given** a column with only 1 value
- **When** the validator processes the file
- **Then** it returns a validation error in Spanish (minimum 2 values per sample)

### AC 7: API Routing
- **Given** `analysis_type='hipotesis_2_muestras'` is sent to `POST /api/analyze`
- **When** the endpoint receives the request
- **Then** it routes to the hypothesis 2-sample handler
- **And** the analysis type is added to the valid types in the routing logic

**FRs covered:** FR-H1, FR-H2, FR-H5, FR-H6, FR-H7, FR-H8

## Tasks / Subtasks

- [x] Task 1: Create Excel template file (AC: 1)
  - [x] 1.1 Create `plantilla-hipotesis-2-muestras.xlsx` with columns "Muestra A" and "Muestra B"
  - [x] 1.2 Add sample numeric data rows (unequal lengths to demonstrate the format)
  - [x] 1.3 Place file in `public/templates/`
- [x] Task 2: Register template in frontend constants (AC: 1)
  - [x] 2.1 Add new `TemplateDefinition` entry to `constants/templates.ts` with `analysisType: 'hipotesis_2_muestras'`
- [x] Task 3: Create Python validator module (AC: 2, 3, 4, 5, 6)
  - [x] 3.1 Create `api/utils/hipotesis_2_muestras_validator.py` following `capacidad_proceso_validator.py` pattern
  - [x] 3.2 Implement column detection: expect exactly 2 numeric columns
  - [x] 3.3 Implement trailing blank handling: determine effective length per column, ignore trailing blanks
  - [x] 3.4 Implement intercalated empty cell detection: flag blanks within data range (not trailing)
  - [x] 3.5 Implement non-numeric value detection with cell location reporting (column name + row number)
  - [x] 3.6 Implement minimum values check: at least 2 values per sample
  - [x] 3.7 All error messages in Spanish using `VALIDATION_MESSAGES` dict pattern
  - [x] 3.8 Return tuple `(validated_data | None, error | None)` — validated_data includes `{ muestra_a: np.ndarray, muestra_b: np.ndarray, column_names: list, warnings: list }`
- [x] Task 4: Add API routing for new analysis type (AC: 7)
  - [x] 4.1 Add `'hipotesis_2_muestras'` to `SUPPORTED_ANALYSIS_TYPES` in `api/analyze.py`
  - [x] 4.2 Add routing branch to call `validate_hipotesis_2_muestras_file(df)`
  - [x] 4.3 Return validation-only response for now (calculator comes in Story 10.2-10.3); on validation success return `{ data: { validation: "success", muestra_a_count, muestra_b_count }, error: null }`
- [x] Task 5: Write unit tests (AC: 2, 3, 4, 5, 6, 7)
  - [x] 5.1 Create `api/tests/test_hipotesis_2_muestras_validator.py` with tests for all 6 validation ACs
  - [x] 5.2 Add integration test in `api/tests/test_analyze.py` for the new routing path
- [x] Task 6: Verify build and existing tests (all ACs)
  - [x] 6.1 Run `npx tsc --noEmit` — zero new errors
  - [x] 6.2 Run `npm run build` — successful build
  - [x] 6.3 Run `python3 -m pytest api/tests/ -v` — all new tests pass, no regressions

## Dev Notes

### Developer Context

This is the **first story in Epic 10**, which introduces a brand-new analysis type: 2-Sample Hypothesis Testing (`hipotesis_2_muestras`). Story 10.1 lays the foundation — template file, file validator, and API routing — that Stories 10.2-10.4 will build upon with the statistical calculation engine, and Epic 11 will consume for frontend visualization and agent integration.

**Critical context from Epic 9:** The codebase was recently streamlined — stability analysis was removed, I-Chart/MR-Chart deleted, and sigma differentiation (Within vs Overall) was added. The project is now in a clean state with 2 analysis types fully operational: `msa` and `capacidad_proceso`.

**Cross-story dependency:** FR-H1 is shared between Story 10.1 (template file creation) and Story 11.1 (plantillas card UI). This story creates the template file and registers it in constants — Story 11.1 will handle any additional UI if needed, though the existing `TemplateCard` component auto-renders from the `TEMPLATES` array, so the card should appear automatically.

### Technical Requirements

**Analysis type identifier:** `'hipotesis_2_muestras'` — use this exact string everywhere (routing, constants, type definitions).

**No scipy allowed.** The Vercel 250MB deployment limit prohibits scipy. This story doesn't need statistical math (that's 10.2-10.3), but be aware: do NOT import scipy for anything. Use numpy only for array operations in the validator.

**Python runtime:** Python 3.11 on Vercel serverless. All Python code lives in `api/` (NOT `app/api/` — that's Node.js Route Handlers).

**All user-facing messages must be in Spanish.** Error messages, warnings, validation feedback — everything the user might see.

**Data format:** Single Excel file with 2 columns. Columns may have unequal row counts (e.g., 45 values in Muestra A, 40 in Muestra B). Trailing blanks in the shorter column are NOT errors. Intercalated blanks (gaps within data) ARE errors.

### Architecture Compliance

**Follow the established validator pattern exactly.** Reference: `api/utils/capacidad_proceso_validator.py` [Source: architecture.md#Python-Analysis-Service]

Key patterns to replicate:
1. **Module-level `VALIDATION_MESSAGES` dict** for all Spanish error/warning strings
2. **`MAX_ERRORS = 20`** constant to limit error output
3. **Sequential 4-stage validation** (stop at first category of errors):
   - Stage 1: Column structure (detect exactly 2 numeric columns)
   - Stage 2: Empty cell detection (intercalated only, not trailing)
   - Stage 3: Non-numeric value detection (with cell location)
   - Stage 4: Minimum data requirements (>= 2 values per sample)
4. **Return signature:** `tuple[dict | None, dict | None]` — `(validated_data, error)`
5. **Error dict format:** `{ "code": str, "message": str, "details": list }`
6. **Orchestrator function:** `validate_hipotesis_2_muestras_file(df)` at module bottom

**Routing in `analyze.py`** follows the existing pattern [Source: api/analyze.py]:
1. Add to `SUPPORTED_ANALYSIS_TYPES` set
2. Add `elif analysis_type == 'hipotesis_2_muestras':` branch
3. Call validator, return validation result
4. For now, return validation-only response (no calculator yet — that's Story 10.2+)

**Frontend constants** follow the `TEMPLATES` array pattern [Source: constants/templates.ts]:
- Add a new `TemplateDefinition` object with: `id`, `title`, `description`, `filename`, `downloadPath`, `analysisType`
- The existing `TemplateCard` component and plantillas page will auto-render the new entry

### Library & Framework Requirements

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| Excel parsing | openpyxl (via pandas) | Already in requirements.txt | Used by `file_loader.py` |
| Numeric arrays | numpy | Already in requirements.txt | For validator data extraction |
| Template creation | openpyxl | Already available | To create the .xlsx template file |
| Frontend constants | TypeScript | 5.x strict | Type-safe template definitions |

**DO NOT add any new dependencies.** Everything needed is already available.

### File Structure Requirements

**Files to CREATE:**
```
public/templates/plantilla-hipotesis-2-muestras.xlsx    # Template file (AC 1)
api/utils/hipotesis_2_muestras_validator.py              # Validator module (AC 2-6)
api/tests/test_hipotesis_2_muestras_validator.py         # Validator tests
```

**Files to MODIFY:**
```
api/analyze.py                                           # Add routing (AC 7)
constants/templates.ts                                   # Add template definition (AC 1)
api/tests/test_analyze.py                                # Add routing integration test (AC 7)
```

**Files to READ (reference only — do NOT modify):**
```
api/utils/capacidad_proceso_validator.py                 # Pattern reference for validator
api/utils/msa_validator.py                               # Pattern reference for cell location errors
api/utils/file_loader.py                                 # Understand how Excel -> DataFrame works
constants/templates.ts                                   # Understand existing template entries
```

**Naming conventions:**
- Python modules: `snake_case.py` matching the analysis type
- Test files: `test_<module_name>.py` mirroring the module name exactly
- Template files: `plantilla-<analysis-name>.xlsx` in `public/templates/`

### Testing Requirements

**Testing framework:** pytest (Python), Vitest (TypeScript)

**Required test coverage for validator (`test_hipotesis_2_muestras_validator.py`):**
1. Valid file with equal-length columns → success with 2 numpy arrays
2. Valid file with unequal-length columns → success, trailing blanks handled (AC 2)
3. Single column file → error with Spanish message (AC 3)
4. Non-numeric values → error with cell location (AC 4)
5. Intercalated empty cells → error with cell location, distinguished from trailing (AC 5)
6. Minimum values (1 value only) → error (AC 6)
7. Empty file / no numeric columns → appropriate error
8. European decimal format (comma) → handled correctly if applicable

**Required integration test (`test_analyze.py`):**
- POST with `analysis_type='hipotesis_2_muestras'` routes correctly
- Invalid analysis type still returns error

**Verification commands:**
```bash
python3 -m pytest api/tests/test_hipotesis_2_muestras_validator.py -v
python3 -m pytest api/tests/test_analyze.py -v
python3 -m pytest api/tests/ -v  # Full suite — expect 464+ pass, ≤4 pre-existing failures
npx tsc --noEmit                  # Zero TypeScript errors
npm run build                     # Successful build
```

**Pre-existing test failures:** 4 MSA chart-related tests are known to fail (pre-existing from before Epic 9). Do NOT attempt to fix these — they are out of scope.

### Previous Story Intelligence

**From Epic 9 (Stories 9.1-9.4):**
- Validators follow a clean pattern — study `capacidad_proceso_validator.py` as the closest analog
- The `file_loader.py` utility handles Excel → DataFrame; the validator receives a DataFrame, not raw bytes
- Error messages use Excel-style cell references (e.g., "Columna 'Muestra A', fila 15") for user clarity
- All tests are co-located in `api/tests/` with naming convention `test_<module>.py`
- Build verification: always run `npx tsc --noEmit` + `npm run build` + `python3 -m pytest api/tests/ -v`

**Key learnings:**
- Keep validators focused — do NOT mix calculation logic into validators
- The orchestrator function at the bottom of the validator module is the public API
- Use `MAX_ERRORS = 20` to prevent overwhelming error output
- Sequential validation stages: stop at first category of errors for clean UX

### Git Intelligence

**Recent commit patterns:** `feat:` prefix for features, `fix:` for bugs, concise English summaries.

**Recent commits relevant to this story:**
- `3512f51` feat: Remove Estabilidad and Linealidad y Sesgo from MSA analysis
- `944e23b` feat: Complete Epic 9 — codebase is clean and ready for new analysis type
- `30b86c4` feat: Complete Epic 7 & 8 — Process Capability Analysis (established the capacidad_proceso pattern this story follows)

### Project Structure Notes

- Template file goes in `public/templates/` (same location as `plantilla-msa.xlsx` and `plantilla-capacidad-proceso.xlsx`)
- Validator goes in `api/utils/` (same location as `msa_validator.py` and `capacidad_proceso_validator.py`)
- The `constants/templates.ts` barrel-exports via `constants/index.ts` — verify the export path
- The plantillas page (`app/(dashboard)/plantillas/page.tsx`) iterates over the `TEMPLATES` array automatically — no page modification needed

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-10, Stories 10.1-10.4]
- [Source: _bmad-output/planning-artifacts/prd-v4.md#FR-H1 through FR-H8]
- [Source: _bmad-output/planning-artifacts/architecture.md#Python-Analysis-Service]
- [Source: _bmad-output/planning-artifacts/architecture.md#File-Structure-Conventions]
- [Source: api/utils/capacidad_proceso_validator.py — primary pattern reference]
- [Source: api/utils/msa_validator.py — cell location error pattern reference]
- [Source: api/analyze.py — routing pattern reference]
- [Source: constants/templates.ts — template definition pattern reference]

## Change Log

- 2026-03-14: Implemented Story 10.1 — Template, Validator & Routing Foundation for 2-Sample Hypothesis Testing (hipotesis_2_muestras). Created Excel template, Python validator with 4-stage validation, API routing, 25 unit tests + 3 integration tests. All tests pass, build successful.
- 2026-03-14: Code review (Claude Opus 4.6) — Found 7 issues (2 High, 3 Medium, 2 Low). Fixed: updated stale analyze.py docstring, added missing test for 2-numeric+text-column scenario, eliminated redundant `_find_effective_length` calls via pre-computed lengths, cleaned unused test imports, documented sprint-status.yaml in File List. Remaining: M3 (first-value column detection heuristic, pre-existing pattern) and L2 (em dash style) accepted as-is.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- One test fix required: `test_single_value_error` — pandas cannot create DataFrame with unequal-length lists directly; fixed by padding shorter column with `np.nan`.

### Completion Notes List

- Template created with openpyxl: "Muestra A" (15 values) and "Muestra B" (12 values) demonstrating unequal column lengths with styled headers.
- Validator follows `capacidad_proceso_validator.py` pattern exactly: `VALIDATION_MESSAGES` dict, `MAX_ERRORS = 20`, 4-stage sequential validation, orchestrator function at module bottom.
- Key design decision: `_find_effective_length()` scans from bottom-up to determine trailing blank boundary, enabling clean distinction between intercalated and trailing empty cells.
- API routing returns validation-only response with `muestra_a_count` and `muestra_b_count` (calculator deferred to Stories 10.2-10.3).
- European decimal format (comma → period) handled in both numeric detection and value extraction.
- Test results: 493 passed, 4 failed (pre-existing MSA chart failures, out of scope). 29 new tests (26 validator + 3 routing). Zero new TypeScript errors. Build successful.
- Code review: Fixed stale docstring in analyze.py, added test for 2-numeric+text column scenario, eliminated redundant `_find_effective_length` calls, cleaned unused test imports.

### File List

**Created:**
- `public/templates/plantilla-hipotesis-2-muestras.xlsx` — Excel template with "Muestra A" and "Muestra B" columns
- `api/utils/hipotesis_2_muestras_validator.py` — Python validator module (4-stage validation with pre-computed effective lengths)
- `api/tests/test_hipotesis_2_muestras_validator.py` — 26 unit tests for validator

**Modified:**
- `api/analyze.py` — Added `hipotesis_2_muestras` to SUPPORTED_ANALYSIS_TYPES, import, validation branch, routing branch, and updated module docstring
- `constants/templates.ts` — Added TemplateDefinition entry for hipotesis_2_muestras
- `api/tests/test_analyze.py` — Added 3 integration tests for routing (TestHipotesis2MuestrasRouting class)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Updated story status (ready-for-dev → in-progress → review → done)
