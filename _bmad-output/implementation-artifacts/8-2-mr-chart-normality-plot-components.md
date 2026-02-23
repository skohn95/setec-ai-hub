# Story 8.2: MR-Chart & Normality Plot Components

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **user**,
I want **to see moving range and normality probability charts**,
So that **I can assess measurement variation and data distribution visually**.

**FRs covered:** FR-CP20 (partial), FR-CP21 (partial)

## Acceptance Criteria

1. **Given** analysis results include chartData for MR-Chart, **When** the MRChart component renders, **Then** it displays moving range points connected by lines **And** it shows center line (MR̄) as solid line **And** it shows UCL as dashed line (LCL = 0, may be omitted) **And** points outside UCL are highlighted in red **And** hovering shows point index and MR value

2. **Given** analysis results include chartData for Normality Plot, **When** the NormalityPlot component renders, **Then** it displays data points plotted against theoretical normal distribution **And** it shows a fit line through the points **And** it shows 95% confidence bands **And** it displays the Anderson-Darling statistic and p-value on the chart **And** hovering shows actual vs expected values

3. **Given** all chart components follow consistent patterns, **When** implemented, **Then** they use Recharts with ResponsiveContainer **And** they match existing MSA chart styling (colors, fonts, tooltips) **And** they are responsive and readable on desktop (1024px+)

4. **Given** charts need to be exportable, **When** user clicks export button on either chart, **Then** the chart is downloaded as PNG with filename including chart type and timestamp **And** export happens client-side without server round-trip

## Tasks / Subtasks

- [x] **Task 1: Update Python API to Include MR-Chart and Normality Plot chartData** (AC: #1, #2)
  - [x] Update `/api/utils/capacidad_proceso_calculator.py` to add MR-Chart data structure:
    ```python
    {
        'type': 'mr_chart',
        'data': {
            'values': mr_values.tolist(),  # Moving range values
            'center': mr_bar,               # MR̄ (mean of moving ranges)
            'ucl': mr_ucl,                  # 3.267 × MR̄
            'lcl': 0,                       # Always 0 for MR chart
            'ooc_points': mr_ooc_points     # Points exceeding UCL
        }
    }
    ```
  - [x] Add Normality Plot data structure:
    ```python
    {
        'type': 'normality_plot',
        'data': {
            'points': [
                {'actual': sorted_value, 'expected': normal_quantile, 'index': i}
            ],
            'fit_line': {
                'slope': slope,
                'intercept': intercept
            },
            'confidence_bands': {
                'lower': [...],
                'upper': [...]
            },
            'anderson_darling': {
                'statistic': ad_stat,
                'p_value': p_value,
                'is_normal': p_value >= 0.05
            }
        }
    }
    ```
  - [x] Update `build_capacidad_proceso_output()` to include both chart types in chartData array
  - [x] Add helper function `_build_normality_plot_data()` for normality plot calculations

- [x] **Task 2: Add TypeScript Types for MR-Chart and Normality Plot** (AC: #1, #2)
  - [x] Add to `/types/analysis.ts`:
    - [x] `MRChartData` interface
    - [x] `NormalityPlotData` interface
    - [x] `NormalityPlotPoint` interface
    - [x] `FitLine` interface
    - [x] `ConfidenceBands` interface
    - [x] `AndersonDarlingResult` interface
  - [x] Update `CapacidadProcesoChartDataItem` union type to include new types

- [x] **Task 3: Create MRChart Component** (AC: #1, #3, #4)
  - [x] Create `/components/charts/MRChart.tsx`
  - [x] Use Recharts LineChart for run chart style
  - [x] Plot moving range points as connected line with dots
  - [x] Add center line (MR̄) as horizontal ReferenceLine (solid green)
  - [x] Add UCL as horizontal ReferenceLine (dashed red, labeled "LCS")
  - [x] LCL = 0: optionally show as x-axis or thin gray line
  - [x] Highlight out-of-control points:
    - [x] Use conditional dot fill (red for OOC, blue for normal)
    - [x] Add larger dot size for OOC points
  - [x] Implement hover tooltip showing:
    - [x] Point index (1-indexed for user readability)
    - [x] MR value with appropriate precision
    - [x] OOC status if exceeds UCL
  - [x] X-axis: observation number (1 to N-1, since MR has one less point)
  - [x] Y-axis: moving range value with auto-scale
  - [x] Add MRChartLegend component
  - [x] Add export button using ExportableChart pattern
  - [x] Follow existing chart styling patterns from IChart.tsx

- [x] **Task 4: Create NormalityPlot Component** (AC: #2, #3, #4)
  - [x] Create `/components/charts/NormalityPlot.tsx`
  - [x] Use Recharts ScatterChart or ComposedChart for Q-Q plot style
  - [x] Plot data points as scatter (actual vs expected normal quantiles)
  - [x] Add fit line using ReferenceLine or custom line component
  - [x] Add 95% confidence bands using Area component with semi-transparent fill
  - [x] Display Anderson-Darling results in chart header or annotation:
    - [x] "A² = {statistic}"
    - [x] "p-value = {p_value}" or "p-value < 0.005" for very small values
    - [x] Color-coded indicator: green checkmark if normal, red X if not
  - [x] Implement hover tooltip showing:
    - [x] Actual value (measured data)
    - [x] Expected value (theoretical normal quantile)
    - [x] Point index
  - [x] X-axis: Expected normal quantile (labeled "Cuantil Teórico")
  - [x] Y-axis: Actual value (labeled "Valor Observado")
  - [x] Add NormalityPlotLegend showing:
    - [x] Data points
    - [x] Fit line
    - [x] Confidence bands
  - [x] Add export button using ExportableChart pattern
  - [x] Follow existing chart styling patterns

- [x] **Task 5: Add MRChart Legend Component** (AC: #1)
  - [x] Create legend showing:
    - [x] Center line (MR̄) - solid green
    - [x] UCL (LCS) - dashed red
    - [x] Normal points - blue dots
    - [x] Out-of-control points - red dots
  - [x] Style consistently with IChartLegend

- [x] **Task 6: Add NormalityPlot Legend Component** (AC: #2)
  - [x] Create legend showing:
    - [x] Data points - blue dots
    - [x] Fit line - solid blue line
    - [x] 95% confidence bands - semi-transparent blue area
  - [x] Style consistently with existing chart legends

- [x] **Task 7: Update CapacidadProcesoCharts Container** (AC: #1, #2, #3)
  - [x] Update `/components/charts/CapacidadProcesoCharts.tsx`
  - [x] Add rendering for 'mr_chart' type
  - [x] Add rendering for 'normality_plot' type
  - [x] Ensure correct order of charts (Histogram, I-Chart, MR-Chart, Normality Plot)
  - [x] Add section headers for new chart types:
    - [x] "Carta MR (Rango Móvil)"
    - [x] "Gráfico de Probabilidad Normal"
  - [x] Handle empty/missing chart data gracefully

- [x] **Task 8: Write Unit Tests - MRChart** (AC: #1, #3, #4)
  - [x] Create `/components/charts/MRChart.test.tsx`
  - [x] Test rendering with valid MR-Chart data
  - [x] Test center line renders correctly
  - [x] Test UCL renders as dashed red line
  - [x] Test normal points render with blue color
  - [x] Test OOC points highlighted in red with larger size
  - [x] Test tooltip shows correct information (JSDOM limitations noted)
  - [x] Test export button functionality
  - [x] Test empty data handling
  - [x] Test single point edge case (MR needs at least 2 data points)

- [x] **Task 9: Write Unit Tests - NormalityPlot** (AC: #2, #3, #4)
  - [x] Create `/components/charts/NormalityPlot.test.tsx`
  - [x] Test rendering with valid normality plot data
  - [x] Test fit line renders correctly
  - [x] Test confidence bands render
  - [x] Test Anderson-Darling results display
  - [x] Test normal conclusion display (green checkmark)
  - [x] Test non-normal conclusion display (red X)
  - [x] Test tooltip shows actual vs expected
  - [x] Test export button functionality
  - [x] Test empty data handling
  - [x] Test edge cases (perfect normal data, highly skewed data)

- [x] **Task 10: Write Python API Tests** (AC: #1, #2)
  - [x] Update `/api/tests/test_capacidad_proceso_calculator.py`
  - [x] Test chartData structure includes mr_chart type
  - [x] Test chartData structure includes normality_plot type
  - [x] Test MR-Chart data contains required fields (values, center, ucl, lcl, ooc_points)
  - [x] Test normality plot data contains required fields (points, fit_line, confidence_bands, anderson_darling)
  - [x] Test MR-Chart ooc_points correctly calculated
  - [x] Test confidence bands are valid arrays
  - [x] Test anderson_darling contains statistic, p_value, is_normal

- [x] **Task 11: Update Chart Index Exports** (AC: #1, #2, #3)
  - [x] Update `/components/charts/index.ts` to export MRChart and NormalityPlot

## Dev Notes

### Critical Architecture Patterns

**Follow existing chart component patterns exactly (see IChart.tsx from Story 8.1):**

1. **Component Structure:**
   - Use `'use client'` directive
   - Ref for chart container (for export)
   - useState for isExporting
   - ResponsiveContainer wrapper (height 300px)
   - ExportButton component pattern

2. **Export Pattern (from download-utils.ts):**
   ```typescript
   import { exportChartToPng, generateExportFilename } from '@/lib/utils/download-utils'

   const handleExport = async () => {
     setIsExporting(true)
     try {
       const filename = generateExportFilename('carta-mr')  // or 'normalidad'
       await exportChartToPng(chartRef, filename)
       toast.success('Gráfico exportado correctamente')
     } catch (error) {
       toast.error('Error al exportar el gráfico')
     } finally {
       setIsExporting(false)
     }
   }
   ```

3. **OOC Detection Pattern (from IChart.tsx):**
   ```typescript
   // Use Map for O(1) lookup instead of array.includes
   const oocPointsMap = useMemo(() => {
     const map = new Map<number, OutOfControlPoint>()
     oocPoints?.forEach((point) => {
       map.set(point.index, point)
     })
     return map
   }, [oocPoints])
   ```

### MR-Chart Specific Implementation

**Moving Range Calculation (already done in Python):**
- MR[i] = |X[i] - X[i-1]| for i = 1 to n-1
- MR̄ = mean of all MR values
- UCL = 3.267 × MR̄
- LCL = 0

**Data Points:**
- MR chart has n-1 points for n data values
- First MR point corresponds to observation 2 (between obs 1 and 2)
- X-axis should show observation numbers 2 to n

```typescript
// Transform MR data for chart
const chartData = values.map((value, index) => ({
  observation: index + 2,  // MR[0] is between obs 1 and 2
  value,
  isOOC: oocPointsMap.has(index)
}))
```

### Normality Plot (Q-Q Plot) Implementation

**Theoretical Background:**
- Normal Q-Q plot compares sample quantiles to theoretical normal quantiles
- Points should fall on a straight line if data is normal
- Confidence bands show expected variation

**Calculating Expected Normal Quantiles (already in Python):**
```python
# Median rank approximation for plotting positions
n = len(sorted_values)
plotting_positions = [(i - 0.375) / (n + 0.25) for i in range(1, n + 1)]
# Convert to z-scores
expected_quantiles = [norm_ppf(p) for p in plotting_positions]
```

**Fit Line Calculation:**
- Simple linear regression: actual = slope × expected + intercept
- Perfect normality: slope ≈ σ, intercept ≈ μ

**95% Confidence Bands:**
```python
# Standard error increases near tails
se = std / sqrt(n) * sqrt(1 + z^2 / (2*n))
lower = expected - 1.96 * se
upper = expected + 1.96 * se
```

### Recharts Component Usage

**For MR-Chart (similar to IChart):**
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
const CustomDot = (props: DotProps & { isOOC?: boolean }) => {
  const { cx, cy, isOOC } = props
  if (!cx || !cy) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={isOOC ? 6 : 4}
      fill={isOOC ? '#EF4444' : '#3B82F6'}
      stroke={isOOC ? '#EF4444' : '#3B82F6'}
    />
  )
}
```

**For Normality Plot (ScatterChart with Area):**
```typescript
import {
  ComposedChart,
  Scatter,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// Scatter for data points, Line for fit line, Area for confidence bands
<ComposedChart data={chartData}>
  <Area
    type="monotone"
    dataKey="upper"
    stroke="none"
    fill="#3B82F6"
    fillOpacity={0.1}
    activeDot={false}
  />
  <Area
    type="monotone"
    dataKey="lower"
    stroke="none"
    fill="#FFFFFF"
    activeDot={false}
  />
  <Line
    type="linear"
    dataKey="fit"
    stroke="#3B82F6"
    strokeWidth={2}
    dot={false}
  />
  <Scatter
    dataKey="actual"
    fill="#3B82F6"
    shape={<circle r={4} />}
  />
</ComposedChart>
```

### Spanish Labels for Charts

```typescript
// Chart titles and labels - all in Spanish
const MR_CHART_LABELS = {
  title: 'Carta MR (Rango Móvil)',
  xAxis: 'Observación',
  yAxis: 'Rango Móvil',
  center: 'MR̄',
  ucl: 'LCS',
}

const NORMALITY_PLOT_LABELS = {
  title: 'Gráfico de Probabilidad Normal',
  xAxis: 'Cuantil Teórico',
  yAxis: 'Valor Observado',
  fitLine: 'Línea de Ajuste',
  confidenceBands: 'Bandas de Confianza 95%',
  normalConclusion: 'Los datos siguen una distribución normal',
  nonNormalConclusion: 'Los datos NO siguen una distribución normal',
}
```

### Python chartData Structure Update

```python
# In capacidad_proceso_calculator.py

def _build_normality_plot_data(values: np.ndarray, normality_result: dict) -> dict:
    """Build data structure for normality probability plot."""
    sorted_values = np.sort(values)
    n = len(sorted_values)

    # Plotting positions (median rank approximation)
    plotting_positions = [(i - 0.375) / (n + 0.25) for i in range(1, n + 1)]

    # Expected normal quantiles (z-scores)
    expected_quantiles = [_norm_ppf(p) for p in plotting_positions]

    # Fit line (linear regression)
    slope, intercept = _linear_regression(expected_quantiles, sorted_values)

    # Confidence bands
    std = np.std(sorted_values, ddof=1)
    confidence_bands = _calculate_confidence_bands(expected_quantiles, n, std, slope, intercept)

    points = [
        {
            'actual': float(sorted_values[i]),
            'expected': float(expected_quantiles[i]),
            'index': i
        }
        for i in range(n)
    ]

    return {
        'type': 'normality_plot',
        'data': {
            'points': points,
            'fit_line': {
                'slope': float(slope),
                'intercept': float(intercept)
            },
            'confidence_bands': {
                'lower': confidence_bands['lower'],
                'upper': confidence_bands['upper']
            },
            'anderson_darling': {
                'statistic': normality_result['anderson_darling']['statistic'],
                'p_value': normality_result['anderson_darling']['p_value'],
                'is_normal': normality_result['is_normal']
            }
        }
    }

def _build_mr_chart_data(stability_result: dict) -> dict:
    """Build data structure for MR control chart."""
    mr_data = stability_result.get('mr_chart', {})
    return {
        'type': 'mr_chart',
        'data': {
            'values': mr_data.get('values', []),
            'center': mr_data.get('center'),
            'ucl': mr_data.get('ucl'),
            'lcl': 0,  # Always 0 for MR chart
            'ooc_points': mr_data.get('ooc_points', [])
        }
    }
```

### Chart Data Types (TypeScript)

```typescript
// In /types/analysis.ts

export interface MRChartData {
  type: 'mr_chart'
  data: {
    values: number[]
    center: number       // MR̄
    ucl: number          // Upper control limit
    lcl: number          // Lower control limit (0)
    ooc_points: OutOfControlPoint[]
  }
}

export interface NormalityPlotPoint {
  actual: number         // Actual (observed) value
  expected: number       // Expected normal quantile
  index: number
}

export interface FitLine {
  slope: number
  intercept: number
}

export interface ConfidenceBands {
  lower: number[]        // Lower confidence band values
  upper: number[]        // Upper confidence band values
}

export interface AndersonDarlingResult {
  statistic: number      // A² value
  p_value: number
  is_normal: boolean     // p_value >= 0.05
}

export interface NormalityPlotData {
  type: 'normality_plot'
  data: {
    points: NormalityPlotPoint[]
    fit_line: FitLine
    confidence_bands: ConfidenceBands
    anderson_darling: AndersonDarlingResult
  }
}

// Update union type
export type CapacidadProcesoChartDataItem =
  | HistogramChartData
  | IChartData
  | MRChartData
  | NormalityPlotData
```

### Previous Story Learnings (Story 8.1)

1. **OOC lookup performance:** Use Map for O(1) lookup instead of O(n²) array search
2. **JSDOM limitations:** Recharts hover testing limited - document in test comments
3. **Fitted curve rendering:** Use ComposedChart when mixing chart types (Line + Area)
4. **Legend styling:** Use `border-t-2 border-dashed` for dashed lines, not layered styles
5. **Export pattern:** Use existing exportChartToPng from download-utils.ts
6. **Responsive sizing:** ResponsiveContainer with fixed height (300px)
7. **Color constants:** Use CHART_COLORS from constants or define inline
8. **Spanish labels:** All user-facing text in Spanish

### Visual Design Specifications

**MR-Chart:**
- Data points: Blue (#3B82F6), 4px radius
- OOC points: Red (#EF4444), 6px radius
- Connecting line: Blue (#3B82F6), 1.5px width
- Center line (MR̄): Green (#10B981), solid, 2px width
- UCL: Red (#EF4444), dashed, 2px width
- Background: bg-card rounded-lg border p-4

**Normality Plot:**
- Data points: Blue (#3B82F6), 4px radius
- Fit line: Blue (#3B82F6), solid, 2px width
- Confidence bands: Blue (#3B82F6) with 10% opacity
- A-D stats box: Gray background, monospace font for values
- Normal indicator: Green checkmark (#10B981)
- Non-normal indicator: Red X (#EF4444)

### File Structure

```
components/charts/
├── MRChart.tsx                  # NEW: MR (Moving Range) Control Chart
├── MRChart.test.tsx             # NEW: MR-Chart tests
├── NormalityPlot.tsx            # NEW: Normal Q-Q Probability Plot
├── NormalityPlot.test.tsx       # NEW: Normality Plot tests
├── HistogramChart.tsx           # Existing from 8.1
├── IChart.tsx                   # Existing from 8.1
├── CapacidadProcesoCharts.tsx   # UPDATE: Add MR-Chart and NormalityPlot rendering
├── index.ts                     # UPDATE: Export new components
└── ...

api/utils/
├── capacidad_proceso_calculator.py  # UPDATE: Add MR-Chart and NormalityPlot chartData

api/tests/
├── test_capacidad_proceso_calculator.py  # UPDATE: Add tests for new chartData

types/
├── analysis.ts                  # UPDATE: Add MRChartData, NormalityPlotData types
```

### Critical Constraints

1. **Charts render in chat messages** - Already integrated via CapacidadProcesoCharts
2. **Export to PNG** - Use existing exportChartToPng utility
3. **Spanish labels** - All text visible to users in Spanish
4. **Responsive** - Charts must resize with container
5. **Theme compatible** - Use CSS variables for light/dark mode
6. **No scipy** - Any Python calculations must use numpy only (pure Python)
7. **MR has n-1 points** - Handle data transformation correctly
8. **Confidence bands** - Calculate using standard error formula

### Dependencies

**Existing (no new dependencies needed):**
- Recharts (already installed)
- canvg (already installed for chart export)
- lucide-react (for icons - CheckCircle2, XCircle for normal/non-normal)
- sonner (for toast notifications)

### Integration with Completed Stories

This story completes the visualization set for Capacidad de Proceso:
- **Story 7.1-7.4:** Backend calculations (already done)
- **Story 8.1:** Histogram + I-Chart components (already done)
- **Story 8.2 (this):** MR-Chart + Normality Plot (now implementing)
- **Story 8.3:** Spec Limits Form + Template page update (next)
- **Story 8.4:** Agent tool update + Chat flow (final)

### Project Structure Notes

**Alignment with architecture:**
- Charts in `/components/charts/` per architecture.md
- Tests co-located with components
- Types in `/types/analysis.ts`
- Spanish messages in components

**Files to create:**
- `/components/charts/MRChart.tsx`
- `/components/charts/MRChart.test.tsx`
- `/components/charts/NormalityPlot.tsx`
- `/components/charts/NormalityPlot.test.tsx`

**Files to modify:**
- `/api/utils/capacidad_proceso_calculator.py` - Add chartData for MR-Chart and Normality Plot
- `/api/tests/test_capacidad_proceso_calculator.py` - Add tests for new chartData
- `/types/analysis.ts` - Add MRChartData, NormalityPlotData types
- `/components/charts/CapacidadProcesoCharts.tsx` - Render new chart types
- `/components/charts/index.ts` - Export new components

### References

- [Source: epics.md#story-82-mr-chart-normality-plot-components] - Story requirements
- [Source: prd-v2.md#requisitos-funcionales-capacidad-de-proceso] - FR-CP20, FR-CP21
- [Source: architecture.md#librería-de-gráficos-recharts] - Recharts patterns
- [Source: components/charts/IChart.tsx] - Reference chart component (OOC pattern)
- [Source: components/charts/HistogramChart.tsx] - Reference for ComposedChart
- [Source: lib/utils/download-utils.ts] - PNG export utilities
- [Source: 8-1-histogram-i-chart-components.md] - Previous story patterns and learnings
- [Source: api/utils/capacidad_proceso_calculator.py] - Calculator to update
- [Source: types/analysis.ts] - Type definitions to extend

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All Python tests pass: 83 tests in test_capacidad_proceso_calculator.py
- All component tests pass: 54 tests (28 MRChart + 26 NormalityPlot)
- Build succeeds: `npm run build` completes without errors

### Completion Notes List

1. **Python API Updates (Task 1)**:
   - Added `_build_mr_chart_data()` function to extract MR values from stability result
   - Implemented pure Python `_norm_ppf()` inverse normal CDF using Abramowitz and Stegun rational approximation (no scipy dependency)
   - Added `_linear_regression()` for fit line calculation
   - Added `_calculate_confidence_bands()` for 95% Q-Q plot bands
   - Added `_build_normality_plot_data()` to generate complete normality plot structure
   - Updated `stability_analysis.py` to include `values` in mr_chart output for chart visualization
   - Chart order: Histogram → I-Chart → MR-Chart → Normality Plot

2. **TypeScript Types (Task 2)**:
   - Added MRChartData, NormalityPlotPoint, FitLine, ConfidenceBands, AndersonDarlingResult, NormalityPlotData interfaces
   - Extended CapacidadProcesoChartDataItem union type

3. **MRChart Component (Tasks 3, 5)**:
   - LineChart with custom CustomDot component for OOC highlighting (red, larger radius)
   - Reference lines for center (MR̄) and UCL (LCS)
   - OOC points Map for O(1) lookup (following IChart pattern)
   - X-axis shows observation numbers 2 to n (MR[0] between obs 1 and 2)
   - Legend inline with chart, consistent with IChart styling

4. **NormalityPlot Component (Tasks 4, 6)**:
   - ComposedChart with Scatter (data points), Line (fit), Area (confidence bands)
   - ADStatsDisplay subcomponent shows A² statistic, p-value, normal/non-normal indicator
   - Green CheckCircle2 for normal, Red XCircle for non-normal
   - Very small p-values displayed as "< 0.005"
   - Custom tooltip showing point index, actual value, expected quantile, fitted value

5. **Testing Notes**:
   - Initial test files used Jest syntax (`jest.mock`) - corrected to Vitest (`vi.mock`)
   - JSDOM limitations documented for Recharts tooltip/hover testing
   - Edge cases tested: empty data, minimal data, large datasets, all OOC points, perfect/skewed distributions

6. **Code Review Fixes (2026-02-21)**:
   - Fixed dark mode issue: Changed confidence band lower Area fill from `#FFFFFF` to `hsl(var(--card))` for theme compatibility
   - Fixed chart height inconsistency: Changed ResponsiveContainer height from 280 to 300px in both MRChart and NormalityPlot
   - Fixed duplicate test method name: Renamed `test_i_chart_rules_violations_structure` to `test_i_chart_rules_violations_is_list_type`
   - Added missing tests: Created `CapacidadProcesoCharts.test.tsx` with 15 tests for chart container component

### File List

**Created:**
- `/components/charts/MRChart.tsx` - MR (Moving Range) control chart component
- `/components/charts/MRChart.test.tsx` - 28 unit tests for MRChart
- `/components/charts/NormalityPlot.tsx` - Normal Q-Q probability plot component
- `/components/charts/NormalityPlot.test.tsx` - 26 unit tests for NormalityPlot

**Modified:**
- `/api/utils/capacidad_proceso_calculator.py` - Added MR-Chart and Normality Plot chart data builders, helper functions
- `/api/utils/stability_analysis.py` - Added MR values to mr_chart output
- `/api/tests/test_capacidad_proceso_calculator.py` - Added 18 new tests for chart data structures
- `/types/analysis.ts` - Added MRChartData, NormalityPlotData and related interfaces
- `/components/charts/CapacidadProcesoCharts.tsx` - Added rendering for MRChart and NormalityPlot
- `/components/charts/CapacidadProcesoCharts.test.tsx` - Created 15 unit tests for chart container (added during code review)
- `/components/charts/index.ts` - Added exports for MRChart and NormalityPlot

### Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-02-21 | Initial implementation of Story 8.2 | Complete MR-Chart and Normality Plot visualization components |
| 2026-02-21 | Code review fixes | Fixed dark mode confidence band fill, chart heights to 300px, duplicate test name, added CapacidadProcesoCharts tests |
