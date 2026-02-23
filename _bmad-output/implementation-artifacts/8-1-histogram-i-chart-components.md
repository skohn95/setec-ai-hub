# Story 8.1: Histogram & I-Chart Components

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to see my data visualized as a histogram and individual values chart**,
So that **I can visually understand my data distribution and process behavior over time**.

**FRs covered:** FR-CP20 (partial), FR-CP21 (partial)

## Acceptance Criteria

1. **Given** analysis results include chartData for histogram, **When** the HistogramChart component renders, **Then** it displays frequency bars for data bins **And** it shows LEI as a red vertical line with label **And** it shows LES as a red vertical line with label **And** it shows the mean as a blue vertical line **And** it shows LCI and LCS as green dashed lines (control limits) **And** if a distribution was fitted, a superimposed curve is displayed **And** hovering shows exact values in tooltip

2. **Given** analysis results include chartData for I-Chart, **When** the IChart component renders, **Then** it displays data points connected by lines (run chart style) **And** it shows center line (X̄) as solid line **And** it shows UCL and LCL as dashed lines **And** points outside control limits are highlighted in red **And** instability signals are marked with indicators showing which rule was violated **And** hovering shows point index and value

3. **Given** charts need to be exportable, **When** user clicks export button on either chart, **Then** the chart is downloaded as PNG with filename including chart type and timestamp **And** export happens client-side without server round-trip

## Tasks / Subtasks

- [x] **Task 1: Update Python API to Include chartData** (AC: #1, #2)
  - [x] Update `/api/utils/capacidad_proceso_calculator.py` to build chartData array
  - [x] Add histogram chart data structure:
    ```python
    {
        'type': 'histogram',
        'data': {
            'values': values.tolist(),  # Raw data for binning
            'bins': calculated_bins,     # Pre-calculated bin edges
            'frequencies': frequencies,  # Pre-calculated frequencies
            'lei': lei,
            'les': les,
            'mean': mean,
            'std': sigma_overall,
            'lcl': i_chart_lcl,
            'ucl': i_chart_ucl,
            'fitted_distribution': fitted_dist_curve_points if non_normal
        }
    }
    ```
  - [x] Add I-Chart data structure:
    ```python
    {
        'type': 'i_chart',
        'data': {
            'values': values.tolist(),
            'center': stability['i_chart']['center'],
            'ucl': stability['i_chart']['ucl'],
            'lcl': stability['i_chart']['lcl'],
            'ooc_points': stability['i_chart']['ooc_points'],
            'rules_violations': extract_rule_violations(stability)
        }
    }
    ```
  - [x] Update `build_capacidad_proceso_output()` to populate chartData

- [x] **Task 2: Add TypeScript Types for Capacidad Proceso Charts** (AC: #1, #2)
  - [x] Add to `/types/analysis.ts`:
    - [x] `HistogramChartData` interface
    - [x] `IChartData` interface
    - [x] `ChartPoint` interface for I-Chart data points
    - [x] `FittedDistributionCurve` interface
  - [x] Add to `/types/api.ts` or relevant location:
    - [x] `CapacidadProcesoChartDataItem` type
    - [x] Update `ChartDataItem` union type if needed

- [x] **Task 3: Create HistogramChart Component** (AC: #1, #3)
  - [x] Create `/components/charts/HistogramChart.tsx`
  - [x] Use Recharts BarChart for histogram bars
  - [x] Calculate bins from raw values (use Sturges' rule: k = ceil(log2(n) + 1))
  - [x] Style bars with semi-transparent fill
  - [x] Add LEI vertical reference line (red solid, labeled "LEI")
  - [x] Add LES vertical reference line (red solid, labeled "LES")
  - [x] Add mean vertical reference line (blue solid, labeled "μ")
  - [x] Add UCL reference line (green dashed, labeled "LCS")
  - [x] Add LCL reference line (green dashed, labeled "LCI")
  - [x] Add normal curve overlay using ReferenceLine or custom shape
  - [x] If fitted_distribution present, overlay fitted distribution curve
  - [x] Implement hover tooltip showing bin range and count
  - [x] Add export button using ExportableChart pattern
  - [x] Use ResponsiveContainer for responsive sizing
  - [x] Follow existing chart styling (colors from CHART_COLORS)

- [x] **Task 4: Create IChart Component** (AC: #2, #3)
  - [x] Create `/components/charts/IChart.tsx`
  - [x] Use Recharts LineChart for run chart
  - [x] Plot data points as connected line with dots
  - [x] Add center line (X̄) as horizontal ReferenceLine (solid green)
  - [x] Add UCL as horizontal ReferenceLine (dashed red, labeled "LCS")
  - [x] Add LCL as horizontal ReferenceLine (dashed red, labeled "LCI")
  - [x] Highlight out-of-control points:
    - [x] Use conditional dot fill (red for OOC, blue for normal)
    - [x] Add larger dot size for OOC points
  - [x] Mark rule violations with visual indicators:
    - [x] Consider annotations or colored segments for trend/pattern rules
  - [x] Implement hover tooltip showing:
    - [x] Point index (1-indexed for user readability)
    - [x] Value
    - [x] OOC status and which limit violated
  - [x] X-axis: observation number (1 to N)
  - [x] Y-axis: measured value with auto-scale including UCL/LCL
  - [x] Add export button using ExportableChart pattern
  - [x] Follow existing chart styling patterns

- [x] **Task 5: Add Histogram Legend Component** (AC: #1)
  - [x] Create legend showing:
    - [x] LEI/LES (spec limits) - red lines
    - [x] Mean (μ) - blue line
    - [x] LCI/LCS (control limits) - green dashed lines
    - [x] Normal/fitted distribution curve (if present)
  - [x] Style consistently with ThresholdLegend from GaugeRRChart

- [x] **Task 6: Add I-Chart Legend Component** (AC: #2)
  - [x] Create legend showing:
    - [x] Center line (X̄) - solid green
    - [x] Control limits (LCI/LCS) - dashed red
    - [x] Normal points - blue dots
    - [x] Out-of-control points - red dots
  - [x] Style consistently with existing chart legends

- [x] **Task 7: Create Chart Container/Wrapper** (AC: #1, #2, #3)
  - [x] Create `/components/charts/CapacidadProcesoCharts.tsx`
  - [x] Accept chartData array from analysis results
  - [x] Render HistogramChart when type='histogram' present
  - [x] Render IChart when type='i_chart' present
  - [x] Handle empty/missing chart data gracefully
  - [x] Add section headers for each chart type
  - [x] Integrate with message rendering in chat

- [x] **Task 8: Integrate with Chat Message Rendering** (AC: #1, #2)
  - [x] Update `/components/chat/ChatMessage.tsx` or message renderer
  - [x] Detect capacidad_proceso analysis results
  - [x] Render CapacidadProcesoCharts when chartData present
  - [x] Ensure charts render below text interpretation
  - [x] Handle loading states while charts render

- [x] **Task 9: Write Unit Tests - HistogramChart** (AC: #1, #3)
  - [x] Create `/components/charts/HistogramChart.test.tsx`
  - [x] Test rendering with valid histogram data
  - [x] Test all reference lines render (LEI, LES, mean, UCL, LCL)
  - [x] Test tooltip appears on hover
  - [x] Test fitted distribution curve renders when present
  - [x] Test empty data handling
  - [x] Test export button functionality

- [x] **Task 10: Write Unit Tests - IChart** (AC: #2, #3)
  - [x] Create `/components/charts/IChart.test.tsx`
  - [x] Test rendering with valid I-Chart data
  - [x] Test center line and control limits render
  - [x] Test normal points render with blue color
  - [x] Test OOC points highlighted in red
  - [x] Test tooltip shows correct information
  - [x] Test export button functionality
  - [x] Test empty data handling

- [x] **Task 11: Write Python API Tests** (AC: #1, #2)
  - [x] Update `/api/tests/test_capacidad_proceso_calculator.py`
  - [x] Test chartData structure includes histogram type
  - [x] Test chartData structure includes i_chart type
  - [x] Test histogram data contains required fields
  - [x] Test i_chart data contains required fields
  - [x] Test OOC points correctly included in chartData

## Dev Notes

### Critical Architecture Patterns

**Follow existing chart component patterns exactly (see GaugeRRChart.tsx):**

1. **Component Structure:**
   - Use `'use client'` directive
   - Ref for chart container (for export)
   - useState for isExporting
   - ResponsiveContainer wrapper
   - ExportButton component pattern

2. **Export Pattern (see download-utils.ts):**
   ```typescript
   import { exportChartToPng, generateExportFilename, ChartExportError } from '@/lib/utils/download-utils'

   const handleExport = async () => {
     setIsExporting(true)
     try {
       const filename = generateExportFilename('histograma')  // or 'carta-i'
       await exportChartToPng(chartRef, filename)
       toast.success('Gráfico exportado correctamente')
     } catch (error) {
       // Handle error
     } finally {
       setIsExporting(false)
     }
   }
   ```

3. **Styling Pattern:**
   - Use CSS variables for theme compatibility: `hsl(var(--foreground))`
   - Use CHART_COLORS constants from `/constants/analysis.ts`
   - Background: `bg-card rounded-lg border p-4`
   - Consistent font sizes and spacing

### Recharts Component Usage

**For Histogram (BarChart):**
```typescript
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

// Transform raw values to bin data
const binData = calculateBins(values)
// binData = [{ bin: '10-15', count: 5, binStart: 10, binEnd: 15 }, ...]
```

**For I-Chart (LineChart):**
```typescript
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Dot,
} from 'recharts'

// Custom dot component for OOC highlighting
const CustomDot = (props: any) => {
  const { cx, cy, payload, oocPoints } = props
  const isOOC = oocPoints.some(p => p.index === payload.index)
  return (
    <Dot
      cx={cx}
      cy={cy}
      r={isOOC ? 6 : 4}
      fill={isOOC ? '#EF4444' : '#3B82F6'}
      stroke={isOOC ? '#EF4444' : '#3B82F6'}
    />
  )
}
```

### Histogram Binning Algorithm (Sturges' Rule)

```typescript
function calculateBins(values: number[]): BinData[] {
  const n = values.length
  const numBins = Math.ceil(Math.log2(n) + 1)  // Sturges' formula

  const min = Math.min(...values)
  const max = Math.max(...values)
  const binWidth = (max - min) / numBins

  const bins: BinData[] = []
  for (let i = 0; i < numBins; i++) {
    const binStart = min + i * binWidth
    const binEnd = min + (i + 1) * binWidth
    const count = values.filter(v =>
      i === numBins - 1
        ? v >= binStart && v <= binEnd  // Include right edge for last bin
        : v >= binStart && v < binEnd
    ).length
    bins.push({
      bin: `${binStart.toFixed(2)}-${binEnd.toFixed(2)}`,
      count,
      binStart,
      binEnd,
      binMidpoint: (binStart + binEnd) / 2
    })
  }
  return bins
}
```

### Chart Data Types (TypeScript)

```typescript
// In /types/analysis.ts

export interface HistogramChartData {
  type: 'histogram'
  data: {
    values: number[]
    lei: number
    les: number
    mean: number
    std: number
    lcl: number
    ucl: number
    fitted_distribution?: {
      name: string
      points: { x: number; y: number }[]
    }
  }
}

export interface IChartData {
  type: 'i_chart'
  data: {
    values: number[]
    center: number
    ucl: number
    lcl: number
    ooc_points: OutOfControlPoint[]
    rules_violations?: {
      rule: string
      start_index: number
      end_index: number
    }[]
  }
}

export type CapacidadProcesoChartDataItem = HistogramChartData | IChartData
```

### Python chartData Structure Update

```python
# In capacidad_proceso_calculator.py

def build_capacidad_proceso_output(...):
    # ... existing code ...

    # Build chartData array
    chart_data = []

    # Add histogram chart data
    if spec_limits is not None and values is not None:
        chart_data.append({
            'type': 'histogram',
            'data': {
                'values': values.tolist(),
                'lei': spec_limits.get('lei'),
                'les': spec_limits.get('les'),
                'mean': float(np.mean(values)),
                'std': float(np.std(values, ddof=1)),
                'lcl': stability_result['i_chart']['lcl'] if stability_result else None,
                'ucl': stability_result['i_chart']['ucl'] if stability_result else None,
                'fitted_distribution': build_fitted_dist_curve(normality_result) if normality_result else None
            }
        })

    # Add I-Chart data
    if stability_result is not None and values is not None:
        chart_data.append({
            'type': 'i_chart',
            'data': {
                'values': values.tolist(),
                'center': stability_result['i_chart']['center'],
                'ucl': stability_result['i_chart']['ucl'],
                'lcl': stability_result['i_chart']['lcl'],
                'ooc_points': stability_result['i_chart']['ooc_points'],
                'rules_violations': extract_rules_violations(stability_result)
            }
        })

    return {
        'results': results,
        'chartData': chart_data,  # Now populated
        'instructions': instructions,
    }
```

### Spanish Labels for Charts

```typescript
// Chart titles and labels - all in Spanish
const HISTOGRAM_LABELS = {
  title: 'Histograma de Datos',
  xAxis: 'Valor',
  yAxis: 'Frecuencia',
  lei: 'LEI',
  les: 'LES',
  mean: 'μ',
  lcl: 'LCI',
  ucl: 'LCS',
}

const I_CHART_LABELS = {
  title: 'Carta I (Valores Individuales)',
  xAxis: 'Observación',
  yAxis: 'Valor',
  center: 'X̄',
  lcl: 'LCI',
  ucl: 'LCS',
}
```

### Previous Story Learnings (Epic 7)

1. **Pure Python constraint:** All Python code uses numpy only - no scipy
2. **Spanish messages:** All user-facing text in Spanish
3. **Export pattern:** Use existing exportChartToPng from download-utils.ts
4. **Test coverage:** Previous stories had 60-130+ tests each - maintain this level
5. **Chart styling:** Follow GaugeRRChart patterns exactly for consistency
6. **Type safety:** All chart data should have TypeScript interfaces
7. **Responsive design:** Use ResponsiveContainer for all charts
8. **Toast notifications:** Use sonner toast for export feedback

### Git Intelligence

Recent relevant commits:
- `804e9dc`: Fixed numeric display in MSA - precision and formatting matters
- `5884ec5`: Used canvg library for SVG-to-canvas rendering (chart export)
- `96fd3f4`: Pure SVG-to-canvas export implementation
- Story 7.4 just completed - capability indices are available for charts

### File Structure

```
components/charts/
├── HistogramChart.tsx           # NEW: Histogram with spec limits & distribution curve
├── HistogramChart.test.tsx      # NEW: Histogram tests
├── IChart.tsx                   # NEW: I-Chart (Individual Values Control Chart)
├── IChart.test.tsx              # NEW: I-Chart tests
├── CapacidadProcesoCharts.tsx   # NEW: Container for capacidad_proceso charts
├── ExportableChart.tsx          # Existing - wrapper for export functionality
├── GaugeRRChart.tsx             # Existing - reference for patterns
└── ...

api/utils/
├── capacidad_proceso_calculator.py  # UPDATE: Add chartData population

types/
├── analysis.ts                  # UPDATE: Add HistogramChartData, IChartData types
```

### Visual Design Specifications

**Histogram:**
- Bar color: Semi-transparent blue (#3B82F6 with 60% opacity)
- LEI/LES lines: Red (#EF4444), solid, 2px width
- Mean line: Blue (#3B82F6), solid, 2px width
- Control limits (LCI/LCS): Green (#10B981), dashed, 2px width
- Distribution curve: Orange (#F97316), smooth line

**I-Chart:**
- Data points: Blue (#3B82F6), 4px radius
- OOC points: Red (#EF4444), 6px radius
- Connecting line: Blue (#3B82F6), 1.5px width
- Center line: Green (#10B981), solid, 2px width
- Control limits: Red (#EF4444), dashed, 2px width

### Critical Constraints

1. **Charts render in chat messages** - Integrate with existing message rendering
2. **Export to PNG** - Use existing exportChartToPng utility
3. **Spanish labels** - All text visible to users in Spanish
4. **Responsive** - Charts must resize with container
5. **Theme compatible** - Use CSS variables for light/dark mode
6. **No scipy** - Any Python calculations must use numpy only

### Dependencies

**Existing (no new dependencies needed):**
- Recharts (already installed)
- canvg (already installed for chart export)
- lucide-react (for icons)
- sonner (for toast notifications)

### Integration with Story 8.2

This story creates the foundation. Story 8.2 will add:
- MRChart component (similar to IChart)
- NormalityPlot component (Q-Q plot or probability plot)
- Both will follow the same patterns established here

### Project Structure Notes

**Alignment with architecture:**
- Charts in `/components/charts/` per architecture.md
- Tests co-located with components
- Types in `/types/analysis.ts`
- Spanish messages in components (not separate constants for charts)

**Files to create:**
- `/components/charts/HistogramChart.tsx`
- `/components/charts/HistogramChart.test.tsx`
- `/components/charts/IChart.tsx`
- `/components/charts/IChart.test.tsx`
- `/components/charts/CapacidadProcesoCharts.tsx`

**Files to modify:**
- `/api/utils/capacidad_proceso_calculator.py` - Add chartData population
- `/types/analysis.ts` - Add chart data types
- `/components/chat/ChatMessage.tsx` or message renderer - Integrate charts

### References

- [Source: epics.md#story-81-histogram-i-chart-components] - Story requirements
- [Source: prd-v2.md#requisitos-funcionales-capacidad-de-proceso] - FR-CP20, FR-CP21
- [Source: architecture.md#librería-de-gráficos-recharts] - Recharts patterns
- [Source: components/charts/GaugeRRChart.tsx] - Reference chart component
- [Source: components/charts/ExportableChart.tsx] - Export wrapper pattern
- [Source: lib/utils/download-utils.ts] - PNG export utilities
- [Source: 7-4-capability-indices-api-integration.md] - Previous story patterns
- [Source: api/utils/capacidad_proceso_calculator.py] - Calculator to update
- [Source: types/analysis.ts] - Type definitions to extend

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation completed without blocking issues.

### Completion Notes List

- **Task 1:** Updated `capacidad_proceso_calculator.py` to build chartData array with histogram and I-Chart data structures. Added helper functions `_build_fitted_distribution_curve()`, `_extract_rules_violations()`, and `_build_chart_data()`.
- **Task 2:** Added TypeScript types for HistogramChartData, IChartData, FittedDistributionCurve, RuleViolation, ChartPoint, and CapacidadProcesoChartDataItem union type in `types/analysis.ts`. Re-exported types in `types/api.ts`.
- **Task 3:** Created HistogramChart component with Recharts BarChart, Sturges' rule binning, reference lines for LEI/LES/mean/UCL/LCL, export functionality, and responsive sizing.
- **Task 4:** Created IChart component with LineChart, custom dot component for OOC highlighting, control limit reference lines, export functionality, and OOC count display.
- **Task 5:** Added HistogramLegend component showing spec limits, mean, and control limits.
- **Task 6:** Added IChartLegend component showing center line, control limits, normal points, and OOC points.
- **Task 7:** Created CapacidadProcesoCharts container component that renders histogram and I-Chart based on chartData type.
- **Task 8:** Integrated CapacidadProcesoCharts into ChatMessage.tsx to render charts for capacidad_proceso analysis results.
- **Task 9:** Created comprehensive Vitest tests for HistogramChart (19 tests covering rendering, empty data, reference lines, export, fitted distribution, and binning).
- **Task 10:** Created comprehensive Vitest tests for IChart (26 tests covering rendering, empty data, OOC points, control limits, export, and edge cases).
- **Task 11:** Added Python API tests for chartData structure (11 tests in TestChartDataStructure class).

### File List

**Created:**
- `/components/charts/HistogramChart.tsx`
- `/components/charts/HistogramChart.test.tsx`
- `/components/charts/IChart.tsx`
- `/components/charts/IChart.test.tsx`
- `/components/charts/CapacidadProcesoCharts.tsx`

**Modified:**
- `/api/utils/capacidad_proceso_calculator.py` - Added chartData population with histogram and I-Chart data
- `/api/tests/test_capacidad_proceso_calculator.py` - Added TestChartDataStructure tests
- `/types/analysis.ts` - Added chart data types
- `/types/api.ts` - Re-exported chart data types
- `/components/charts/index.ts` - Added exports for new chart components
- `/components/chat/ChatMessage.tsx` - Integrated CapacidadProcesoCharts rendering

### Change Log

- 2026-02-20: Implemented Story 8.1 - Histogram & I-Chart Components
  - Added Python API chartData population
  - Created HistogramChart and IChart React components
  - Integrated charts into chat message rendering
  - Added comprehensive test coverage (45 frontend tests, 11 Python tests)

- 2026-02-20: Code Review Fixes (7 issues addressed)
  1. **AC #1 Fix - Fitted Distribution Curve:** Added ComposedChart with Line overlay for distribution curve rendering in HistogramChart. Implemented normalPDF and lognormalPDF functions. Curve displays expected frequency at each bin midpoint.
  2. **AC #2 Fix - Rule Violations in Tooltip:** Connected rules_violations data to IChart tooltip. Added RULE_DESCRIPTIONS mapping for Spanish display. Tooltip now shows which rule was violated at each point.
  3. **Performance Fix:** Replaced O(n²) OOC lookup in IChart with O(n) Map-based implementation.
  4. **Test Coverage Fix:** Added test_i_chart_rules_violations_structure test to Python tests for rules_violations field validation.
  5. **CSS Fix:** Fixed legend dashed line visual by using border-t-2 border-dashed instead of confusing layered styles.
  6. **Test Documentation:** Added comments to Tooltip test sections documenting JSDOM limitations for Recharts hover testing.
  7. **Legend Enhancement:** Updated HistogramLegend to show fitted distribution curve with dynamic label.

