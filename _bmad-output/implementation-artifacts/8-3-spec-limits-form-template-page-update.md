# Story 8.3: Spec Limits Form & Template Page Update

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to provide specification limits through a form when not included in my message**,
So that **I can complete the analysis even if I forgot to specify LEI/LES initially**.

**FRs covered:** FR-CP3, FR-CP4, FR-CP5, FR-CP6

## Acceptance Criteria

1. **Given** a user uploads a file and requests capacidad_proceso analysis, **When** the agent parses the message for LEI/LES, **Then** it extracts limits from patterns like:
   - "LEI=95, LES=105"
   - "LEI 95 y LES 105"
   - "límite inferior 95, superior 105"
   - "lower spec 95, upper spec 105"
   **And** if found, analysis proceeds directly without showing form

2. **Given** LEI/LES are NOT found in the user's message, **When** the agent responds, **Then** a SpecLimitsForm component is rendered in the chat **And** the form shows detected data summary: "Se detectó 1 variable numérica con {N} valores" **And** the form has two input fields: LEI and LES **And** the form has "Iniciar Análisis" and "Cancelar" buttons

3. **Given** user fills the SpecLimitsForm, **When** they click "Iniciar Análisis", **Then** the form validates: both fields required, LEI < LES, both numeric **And** validation errors show in Spanish below the relevant field **And** on valid submission, values are sent to the chat as a structured message **And** the agent proceeds with analysis using the provided limits

4. **Given** user clicks "Cancelar" on the form, **When** the form is dismissed, **Then** the form disappears from the chat **And** user can upload a different file or provide limits in a new message

5. **Given** the Plantillas page needs updating, **When** the page is modified, **Then** a new card appears for "Análisis de Capacidad de Proceso" **And** the card includes description: "Evalúa si tu proceso cumple con las especificaciones del cliente" **And** clicking "Descargar" downloads `plantilla-capacidad-proceso.xlsx`

## Tasks / Subtasks

- [x] **Task 1: Create SpecLimitsForm Component** (AC: #2, #3, #4)
  - [x] Create `/components/chat/SpecLimitsForm.tsx`
  - [x] Use shadcn/ui Input, Button, Label components
  - [x] Add two numeric input fields: LEI and LES
  - [x] Display detected data summary from props: "Se detectó 1 variable numérica con {N} valores"
  - [x] Add "Iniciar Análisis" primary button and "Cancelar" secondary button
  - [x] Implement form state with React useState
  - [x] Style consistently with existing chat components

- [x] **Task 2: Implement Form Validation** (AC: #3)
  - [x] Validate both fields are required (not empty)
  - [x] Validate both fields are numeric (parseFloat)
  - [x] Validate LEI < LES (lower limit must be less than upper)
  - [x] Display validation errors in Spanish below relevant field:
    - Empty field: "Este campo es requerido"
    - Non-numeric: "Debe ser un valor numérico"
    - LEI >= LES: "El límite inferior debe ser menor que el límite superior"
  - [x] Clear errors when user modifies input
  - [x] Prevent submission while validation errors exist

- [x] **Task 3: Implement Form Submission** (AC: #3)
  - [x] On valid submission, call `onSubmit` prop with `{ lei: number, les: number }`
  - [x] Form should be disabled during submission (loading state)
  - [x] Clear form after successful submission

- [x] **Task 4: Implement Cancel Behavior** (AC: #4)
  - [x] On cancel click, call `onCancel` prop
  - [x] Parent component handles form removal from chat

- [x] **Task 5: Create SpecLimitsForm Tests** (AC: #2, #3, #4)
  - [x] Create `/components/chat/SpecLimitsForm.test.tsx`
  - [x] Test renders with data summary correctly
  - [x] Test both input fields render with labels
  - [x] Test required validation errors display
  - [x] Test numeric validation errors display
  - [x] Test LEI < LES validation error displays
  - [x] Test valid submission calls onSubmit with correct values
  - [x] Test cancel button calls onCancel
  - [x] Test form disabled state during submission
  - [x] Test clearing validation errors on input change

- [x] **Task 6: Verify Plantillas Page Already Has Capacidad de Proceso** (AC: #5)
  - [x] Verify `/constants/templates.ts` already includes capacidad_proceso template
  - [x] Verify `/public/templates/plantilla-capacidad-proceso.xlsx` exists
  - [x] If template file missing, create basic Excel template with "Valores" column
  - [x] Test download works correctly on plantillas page

- [x] **Task 7: Update Chat Index Exports** (AC: #2)
  - [x] Update `/components/chat/index.ts` to export SpecLimitsForm

## Dev Notes

### Critical Architecture Patterns

**Follow existing chat component patterns exactly (see ChatInput.tsx, FileUpload.tsx):**

1. **Component Structure:**
   - Use `'use client'` directive
   - Use React useState for form state
   - Props interface for callbacks (onSubmit, onCancel)
   - Controlled inputs with value + onChange

2. **Form Pattern:**
   ```typescript
   interface SpecLimitsFormProps {
     detectedCount: number  // Number of data values detected
     onSubmit: (limits: { lei: number; les: number }) => void
     onCancel: () => void
     isSubmitting?: boolean
   }
   ```

3. **Styling Pattern:**
   - Use CSS variables for theme compatibility: `hsl(var(--foreground))`
   - Background: `bg-card rounded-lg border p-4`
   - Use shadcn/ui components (Input, Button, Label)
   - Consistent spacing with existing components

### Form Component Implementation

```typescript
// components/chat/SpecLimitsForm.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SpecLimitsFormProps {
  detectedCount: number
  onSubmit: (limits: { lei: number; les: number }) => void
  onCancel: () => void
  isSubmitting?: boolean
}

interface FormErrors {
  lei?: string
  les?: string
}

export function SpecLimitsForm({
  detectedCount,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: SpecLimitsFormProps) {
  const [lei, setLei] = useState('')
  const [les, setLes] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    if (!lei.trim()) {
      newErrors.lei = 'Este campo es requerido'
    } else if (isNaN(parseFloat(lei))) {
      newErrors.lei = 'Debe ser un valor numérico'
    }

    if (!les.trim()) {
      newErrors.les = 'Este campo es requerido'
    } else if (isNaN(parseFloat(les))) {
      newErrors.les = 'Debe ser un valor numérico'
    }

    if (!newErrors.lei && !newErrors.les) {
      if (parseFloat(lei) >= parseFloat(les)) {
        newErrors.lei = 'El límite inferior debe ser menor que el límite superior'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validate()) {
      onSubmit({ lei: parseFloat(lei), les: parseFloat(les) })
    }
  }

  // ... rest of implementation
}
```

### Spanish Labels and Messages

```typescript
const FORM_LABELS = {
  title: 'Límites de Especificación',
  summary: (count: number) => `Se detectó 1 variable numérica con ${count} valores`,
  lei: 'Límite Inferior de Especificación (LEI)',
  les: 'Límite Superior de Especificación (LES)',
  submit: 'Iniciar Análisis',
  cancel: 'Cancelar',
}

const VALIDATION_ERRORS = {
  required: 'Este campo es requerido',
  notNumeric: 'Debe ser un valor numérico',
  leiNotLessThanLes: 'El límite inferior debe ser menor que el límite superior',
}
```

### Existing Template Configuration

The template is **already configured** in `/constants/templates.ts`:

```typescript
{
  id: 'capacidad_proceso',
  title: 'Análisis de Capacidad de Proceso',
  description: 'Evalúa si tu proceso cumple con las especificaciones del cliente...',
  filename: 'plantilla-capacidad-proceso.xlsx',
  downloadPath: '/templates/plantilla-capacidad-proceso.xlsx',
  analysisType: 'capacidad_proceso',
}
```

**IMPORTANT:** The template file `plantilla-capacidad-proceso.xlsx` must exist in `/public/templates/`. Check if it exists; if not, create it with a single "Valores" column containing sample numeric data.

### Previous Story Learnings (Stories 8.1, 8.2)

1. **Vitest over Jest:** Use `vi.mock` not `jest.mock` for mocking
2. **JSDOM limitations:** Document in test comments when testing Recharts/complex interactions
3. **Spanish messages:** All user-facing text must be in Spanish
4. **Component styling:** Use existing shadcn/ui patterns, follow ChatMessage styling
5. **Test structure:** Co-locate tests with components (SpecLimitsForm.test.tsx)
6. **Dark mode compatibility:** Use CSS variables like `hsl(var(--card))` not hardcoded colors

### Git Intelligence (Recent Commits)

```
804e9dc fix: Display operator IDs as integers instead of floats in MSA output
866c1be chore: Add supabase/.temp/ to gitignore
56f7925 feat: Improve MSA analysis output and chart separation
```

- Recent work focuses on output formatting and UI improvements
- Follow consistent patterns from existing MSA implementation

### File Structure

```
components/chat/
├── SpecLimitsForm.tsx           # NEW: Form for LEI/LES input
├── SpecLimitsForm.test.tsx      # NEW: Form tests
├── ChatInput.tsx                # REFERENCE: For input patterns
├── FileUpload.tsx               # REFERENCE: For validation patterns
├── index.ts                     # UPDATE: Export SpecLimitsForm
└── ...

public/templates/
├── plantilla-msa.xlsx           # Existing
└── plantilla-capacidad-proceso.xlsx  # VERIFY/CREATE: Must exist
```

### Critical Constraints

1. **Form renders in chat** - Component is embedded in chat message flow
2. **Spanish only** - All labels, errors, buttons in Spanish
3. **Validation before submit** - Client-side validation is required
4. **Theme compatible** - Must work in light/dark mode
5. **No external dependencies** - Use only existing shadcn/ui components

### Visual Design Specifications

**Form Container:**
- Background: `bg-card rounded-lg border p-4`
- Shadow: subtle shadow for depth
- Max width: consistent with chat message bubbles

**Input Fields:**
- Use shadcn/ui Input component
- Labels above inputs
- Error messages in red below inputs

**Buttons:**
- Primary (Submit): `bg-gradient-to-r from-setec-orange to-orange-500` (match existing CTA style)
- Secondary (Cancel): `variant="outline"`

### Integration Notes

**This story creates the SpecLimitsForm component only.**

Story 8.4 will handle:
- Tool definition updates in `lib/openai/tools.ts`
- LEI/LES parsing in agent prompts
- Chat route integration for form rendering and submission
- SpecLimitsForm rendering in ChatMessage or chat flow

For this story, focus on:
- Creating a reusable, well-tested form component
- Ensuring proper validation logic
- Making the component export available

### Project Structure Notes

**Alignment with architecture:**
- Form components in `/components/chat/` per architecture.md
- Tests co-located with components
- All text in Spanish
- shadcn/ui components for consistency

### References

- [Source: epics.md#story-83-spec-limits-form-template-page-update] - Story requirements
- [Source: prd-v2.md#requisitos-funcionales-capacidad-de-proceso] - FR-CP3, FR-CP4, FR-CP5, FR-CP6
- [Source: architecture.md#frontend-architecture] - Component patterns
- [Source: constants/templates.ts] - Existing template configuration
- [Source: components/chat/ChatInput.tsx] - Reference for input patterns
- [Source: components/chat/FileUpload.tsx] - Reference for validation patterns
- [Source: 8-2-mr-chart-normality-plot-components.md] - Previous story patterns

## Senior Developer Review (AI)

**Review Date:** 2026-02-21
**Reviewer:** Claude Opus 4.5 (Code Review Workflow)
**Outcome:** ✅ Approved (after fixes)

### Issues Found & Resolved

| Severity | Issue | Resolution |
|----------|-------|------------|
| MEDIUM | Form not clearing after successful submission | Added setLei('') and setLes('') after onSubmit |
| MEDIUM | Spanish grammar error ("valores" instead of "valor" for count=1) | Added conditional plural/singular |
| MEDIUM | Missing test for form clearing behavior | Added new test case |
| MEDIUM | Missing accessibility attributes for error messages | Added aria-invalid and aria-describedby |
| LOW | Props interface not exported | Deferred to Story 8.4 integration |
| LOW | Placeholder text could be more descriptive | Acceptable as-is |

**All HIGH and MEDIUM issues resolved. Story approved.**

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation proceeded without issues.

### Completion Notes List

- Created SpecLimitsForm component with complete validation logic
- All 24 unit tests pass covering rendering, validation, submission, and cancel behavior
- Component uses shadcn/ui components (Input, Button, Label) for consistency
- Spanish labels and error messages as required
- Theme-compatible styling using CSS variables (bg-card, text-foreground, etc.)
- Setec orange gradient styling on submit button for brand consistency
- Template file already exists at /public/templates/plantilla-capacidad-proceso.xlsx
- Template configuration already present in constants/templates.ts
- Component exported from components/chat/index.ts

### File List

- components/chat/SpecLimitsForm.tsx (NEW)
- components/chat/SpecLimitsForm.test.tsx (NEW)
- components/chat/index.ts (MODIFIED)

### Change Log

- 2026-02-21: Story 8.3 implemented - Created SpecLimitsForm component with validation, tests, and exports
- 2026-02-21: Code review fixes applied:
  - Fixed Spanish grammar for singular/plural "valor/valores"
  - Added form clearing after successful submission
  - Added accessibility attributes (aria-invalid, aria-describedby) for error messages
  - Added test for form clearing behavior (now 25 tests total)
