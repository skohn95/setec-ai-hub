# Story 11.2: BoxplotChart Component & Chart Container

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see interactive histograms and comparative boxplots for my two samples,
So that I can visually understand the distribution, spread, and means comparison.

## Acceptance Criteria

### AC 1: Histogram Chart for Each Sample
- **Given** histogram chart data for a sample (bins, mean, outliers)
- **When** the histogram renders
- **Then** it displays frequency bars for each bin
- **And** a vertical line marks the mean
- **And** outlier values are visually indicated (different color or marker)
- **And** hover shows bin range and count

### AC 2: BoxplotChart in Variance Mode
- **Given** `boxplot_variance` chart data with two samples
- **When** the BoxplotChart renders in variance mode
- **Then** it shows two side-by-side boxplots (Muestra A and Muestra B)
- **And** each boxplot displays: median line, Q1-Q3 box, whiskers to min/max (excluding outliers), outlier dots
- **And** the title includes the Levene test p-value and conclusion
- **And** hover on any element shows the numeric value

### AC 3: BoxplotChart in Means Mode
- **Given** `boxplot_means` chart data with two samples
- **When** the BoxplotChart renders in means mode
- **Then** it shows the same side-by-side boxplots as variance mode
- **And** additionally overlays confidence interval markers for each sample's mean
- **And** the mean is marked with a distinct symbol (diamond, differentiated from median)
- **And** the title includes the t-test p-value and conclusion

### AC 4: Chart Export
- **Given** any of the 4 charts
- **When** the user clicks the export button
- **Then** the chart is exported as a PNG image

### AC 5: Responsive Layout
- **Given** any of the 4 charts on a desktop viewport (>=1024px)
- **When** the charts render
- **Then** they display at full width within the chat message area
- **And** are responsive (scale down on smaller viewports without breaking)

### AC 6: Container Component
- **Given** the `Hipotesis2MCharts.tsx` container component
- **When** it receives the full chartData array from analysis results
- **Then** it renders all 4 charts in order: Histogram A, Histogram B, Boxplot Varianzas, Boxplot Medias
- **And** each chart has its own export button

### AC 7: Barrel Export and ChatMessage Integration
- **Given** the `components/charts/index.ts` barrel export
- **When** the new components are created
- **Then** `BoxplotChart`, `Hipotesis2MHistogramChart`, and `Hipotesis2MCharts` are exported
- **And** `ChatMessage.tsx` extracts and renders hipotesis2M chart data

## Tasks / Subtasks

- [x] Task 1: Create `Hipotesis2MHistogramChart.tsx` (AC: 1, 4, 5)
  - [x] 1.1 Create component at `components/charts/Hipotesis2MHistogramChart.tsx`
  - [x] 1.2 Accept `Hipotesis2MHistogramData` prop (pre-binned data from Python)
  - [x] 1.3 Render frequency bars using Recharts `Bar` in `ComposedChart`
  - [x] 1.4 Add `ReferenceLine` for mean value
  - [x] 1.5 Render outlier markers (use `Scatter` or `ReferenceLine` for each outlier value)
  - [x] 1.6 Add tooltip showing bin range (start-end) and count
  - [x] 1.7 Add export button using `useRef` + `exportChartToPng` pattern
  - [x] 1.8 Use `sampleName` in chart title (e.g., "Histograma - Muestra A")
  - [x] 1.9 Add legend for mean line and outlier markers

- [x] Task 2: Create `BoxplotChart.tsx` (AC: 2, 3, 4, 5)
  - [x] 2.1 Create component at `components/charts/BoxplotChart.tsx`
  - [x] 2.2 Accept a generic prop: `{ mode: 'variance' | 'means', data: Hipotesis2MBoxplotVarianceData | Hipotesis2MBoxplotMeansData }`
  - [x] 2.3 Render two side-by-side boxplots using custom `BoxPlotBar` shape in `ComposedChart`
  - [x] 2.4 Each boxplot: box (Q1-Q3), median line (red), whiskers (min/max), mean diamond (green)
  - [x] 2.5 Render outlier dots as `Scatter` points outside whiskers
  - [x] 2.6 In means mode: render CI markers (horizontal lines or error bars for `ciLower`/`ciUpper`)
  - [x] 2.7 Set chart title with p-value and conclusion:
    - Variance: "Boxplot - Comparacion de Varianzas (Levene p=X.XXXX: conclusion)"
    - Means: "Boxplot - Comparacion de Medias (t-test p=X.XXXX: conclusion)"
  - [x] 2.8 Add tooltip showing all values (name, min, Q1, median, Q3, max, mean, outliers; plus CI in means mode)
  - [x] 2.9 Add export button using `useRef` + `exportChartToPng` pattern
  - [x] 2.10 Add legend (IQR box, median, mean, whiskers, outliers; plus CI in means mode)

- [x] Task 3: Create `Hipotesis2MCharts.tsx` container (AC: 6)
  - [x] 3.1 Create component at `components/charts/Hipotesis2MCharts.tsx`
  - [x] 3.2 Accept `{ chartData: Hipotesis2MChartDataItem[] }` prop
  - [x] 3.3 Filter and type-guard chart data by type: `histogram_a`, `histogram_b`, `boxplot_variance`, `boxplot_means`
  - [x] 3.4 Render in order: Histogram A, Histogram B, Boxplot Variance, Boxplot Means
  - [x] 3.5 Wrap each in `<div className="space-y-4">` for consistent spacing

- [x] Task 4: Update barrel exports and ChatMessage integration (AC: 7)
  - [x] 4.1 Add exports to `components/charts/index.ts`:
    - `export { default as Hipotesis2MHistogramChart } from './Hipotesis2MHistogramChart'`
    - `export { default as BoxplotChart } from './BoxplotChart'`
    - `export { default as Hipotesis2MCharts } from './Hipotesis2MCharts'`
  - [x] 4.2 In `types/api.ts`, add re-export: `export type { Hipotesis2MChartDataItem, Hipotesis2MHistogramData, Hipotesis2MBoxplotVarianceData, Hipotesis2MBoxplotMeansData } from './analysis'`
  - [x] 4.3 In `components/chat/ChatMessage.tsx`:
    - Import `Hipotesis2MCharts` from `@/components/charts`
    - Import `Hipotesis2MChartDataItem` from `@/types/api`
    - Add extraction block (like `capacidadProcesoChartData` at lines 124-130):
      ```typescript
      const hipotesis2MChartData: Hipotesis2MChartDataItem[] | null = (() => {
        if (!chartData) return null
        const h2mCharts = chartData.filter(
          (d) => d.type === 'histogram_a' || d.type === 'histogram_b' || d.type === 'boxplot_variance' || d.type === 'boxplot_means'
        ) as unknown as Hipotesis2MChartDataItem[]
        return h2mCharts.length > 0 ? h2mCharts : null
      })()
      ```
    - Add render block after the CapacidadProcesoCharts section (after line 215):
      ```tsx
      {hipotesis2MChartData && hipotesis2MChartData.length > 0 && (
        <Hipotesis2MCharts chartData={hipotesis2MChartData} />
      )}
      ```

- [x] Task 5: Build verification (AC: 1-7)
  - [x] 5.1 Run `npx tsc --noEmit` — zero new TypeScript errors
  - [x] 5.2 Run `npm run build` — successful build

## Dev Notes

### Developer Context

This is **Story 11.2 in Epic 11** (2-Sample Hypothesis Visualization & Agent Integration). Story 11.1 (type definitions) is DONE. This story creates the visual chart components to render the analysis results.

**Pre-completed work from Story 11.1:**
- All TypeScript types for chart data are already defined in `types/analysis.ts` (lines 407-460)
- `Hipotesis2MHistogramData`, `Hipotesis2MBoxplotVarianceData`, `Hipotesis2MBoxplotMeansData`, `Hipotesis2MChartDataItem` are all available
- `Hipotesis2MBoxplotSample` and `Hipotesis2MBoxplotMeansSample` (extends with `ciLower`/`ciUpper`) are defined

**After this story:**
- Story 11.3 updates the agent system prompt for conversational flow (will use the charts created here)

### Critical: Hipotesis2M Histograms vs Capacidad Proceso Histograms

**DO NOT reuse the existing `HistogramChart.tsx`.** The data structures are fundamentally different:

| Aspect | Capacidad Proceso (`HistogramChart.tsx`) | Hipotesis 2 Muestras (NEW) |
|--------|----------------------------------------|---------------------------|
| Input | Raw `values: number[]` — bins calculated client-side | Pre-binned `bins: { start, end, count }[]` from Python |
| Features | LEI/LES spec lines, distribution curve overlay | Mean line, outlier markers, sample name |
| Type | `HistogramChartData` (has `values`, `lei`, `les`, `std`, `fitted_distribution`) | `Hipotesis2MHistogramData` (has `bins`, `mean`, `sampleName`, `outliers`) |

Create a **new** `Hipotesis2MHistogramChart.tsx` component. The Python API sends pre-calculated bins, so NO client-side binning is needed — just render the bins directly.

### Technical Requirements

**Recharts library (already installed, v2.x):** All charts MUST use Recharts components. Key components needed:
- `ComposedChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `ResponsiveContainer`, `ReferenceLine`, `Scatter`
- Custom shape rendering for boxplots (via `Bar` `shape` prop)

**All UI text in Spanish.** Chart titles, tooltips, legends, axis labels, and export messages must be in Spanish.

**Dark mode support.** Use CSS variables (`hsl(var(--popover))`, `hsl(var(--border))`) for tooltip backgrounds. Use `className="stroke-muted"` for grid, `className="fill-muted-foreground"` for axis text. Follow the exact pattern in `HistogramChart.tsx`.

### Architecture Compliance

**Chart component pattern (from `HistogramChart.tsx` and `MeasurementsByPart.tsx`):**
```typescript
'use client'
// imports...

export default function MyChart({ data }: MyChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  // Data transformation with useMemo
  const processedData = useMemo(() => { ... }, [data])

  // Early return if no data
  if (!processedData.length) return null

  // Export handler
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const filename = generateExportFilename('chart-type')
      await exportChartToPng(chartRef, filename)
      toast.success('Grafico exportado correctamente')
    } catch (error) {
      console.error('Chart export failed:', error)
      const message = error instanceof ChartExportError
        ? 'Error al exportar el grafico'
        : 'Error inesperado al exportar'
      toast.error(message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="relative">
      {/* Export button */}
      <div className="absolute top-2 right-2 z-10">
        <Button variant="outline" size="icon" onClick={handleExport} disabled={isExporting} title="Descargar como imagen">
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        </Button>
      </div>
      {/* Chart content */}
      <div ref={chartRef} data-testid="chart-test-id" className="mb-4 bg-card rounded-lg border p-4">
        <h4 className="text-sm font-medium mb-3 text-foreground">Title</h4>
        <p className="text-xs text-muted-foreground mb-2">Description</p>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={processedData} margin={{ top: 20, right: 20, left: 30, bottom: 30 }}>
            {/* ... */}
          </ComposedChart>
        </ResponsiveContainer>
        {/* Legend */}
      </div>
    </div>
  )
}
```

**Container component pattern (from `CapacidadProcesoCharts.tsx`):**
```typescript
'use client'
// imports...

export default function Hipotesis2MCharts({ chartData }: Props) {
  if (!chartData || chartData.length === 0) return null

  // Type-guard filter for each chart type
  const histogramA = chartData.find((item): item is Hipotesis2MHistogramData => item.type === 'histogram_a')
  const histogramB = chartData.find((item): item is Hipotesis2MHistogramData => item.type === 'histogram_b')
  const boxplotVariance = chartData.find((item): item is Hipotesis2MBoxplotVarianceData => item.type === 'boxplot_variance')
  const boxplotMeans = chartData.find((item): item is Hipotesis2MBoxplotMeansData => item.type === 'boxplot_means')

  return (
    <div data-testid="hipotesis-2m-charts" className="space-y-4">
      {histogramA && <Hipotesis2MHistogramChart data={histogramA} />}
      {histogramB && <Hipotesis2MHistogramChart data={histogramB} />}
      {boxplotVariance && <BoxplotChart mode="variance" data={boxplotVariance} />}
      {boxplotMeans && <BoxplotChart mode="means" data={boxplotMeans} />}
    </div>
  )
}
```

**ChatMessage integration pattern (from lines 124-130, 213-215 of `ChatMessage.tsx`):**
- Import types from `@/types/api` (add re-exports there first)
- Import `Hipotesis2MCharts` from `@/components/charts`
- Add extraction IIFE block filtering by type strings
- Add conditional render block inside the charts container div

**Custom BoxPlotBar shape (from `MeasurementsByPart.tsx` lines 59-116):**
The existing boxplot implementation uses a custom SVG shape with:
- `<rect>` for the IQR box (Q1-Q3), fill `#3B82F6`, stroke `#2563EB`
- `<line>` for median (red `#EF4444`, strokeWidth 2)
- `<polygon>` diamond for mean (green `#10B981`, stroke `#059669`)
- `<line>` for whiskers (gray `#64748B`, strokeWidth 2)

For the Hipotesis2M boxplot, reuse this visual pattern but adapt for:
1. **Two categorical items** on X-axis (Sample A, Sample B) — NOT N parts
2. **Outlier dots** rendered outside whiskers (the data already provides `outliers: number[]`)
3. **CI markers** in means mode (horizontal error bars or vertical CI lines at each sample position)

**yScale approach (from `MeasurementsByPart.tsx` lines 239-249):**
The custom shape gets `x`, `width`, `payload`, and `background` from Recharts. Build a yScale function from `background.height`, `background.y`, and Y-axis domain to map data values to pixel coordinates. This is critical for correct boxplot rendering.

### Library & Framework Requirements

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| Charts | Recharts | 2.x (already installed) | ComposedChart, Bar, Scatter, etc. |
| Icons | lucide-react | (already installed) | Download, Loader2 |
| UI | shadcn/ui Button | (already installed) | Export button |
| Toast | sonner | (already installed) | Export feedback |
| Export | canvg | (already installed) | PNG export via `exportChartToPng` |
| TypeScript | TypeScript | 5.x strict mode | Type-safe components |
| Next.js | Next.js | 16 with App Router | `'use client'` directive required |
| React | React | 19.2.3 | useRef, useState, useMemo hooks |

**No new dependencies.** All work uses existing libraries.

### File Structure Requirements

**Files to CREATE:**
```
components/charts/Hipotesis2MHistogramChart.tsx   # Histogram from pre-binned data
components/charts/BoxplotChart.tsx                 # Boxplot with variance/means modes
components/charts/Hipotesis2MCharts.tsx            # Container routing all 4 chart types
```

**Files to MODIFY:**
```
components/charts/index.ts                         # Add 3 new barrel exports
components/chat/ChatMessage.tsx                    # Add chart data extraction + render
types/api.ts                                       # Re-export Hipotesis2M chart types
```

**Files to READ (reference only — do NOT modify):**
```
components/charts/HistogramChart.tsx                # Pattern reference (DO NOT reuse for H2M)
components/charts/MeasurementsByPart.tsx            # BoxPlotBar shape reference
components/charts/CapacidadProcesoCharts.tsx        # Container pattern reference
components/charts/ExportableChart.tsx               # Export wrapper (available but optional)
types/analysis.ts                                   # Type definitions (already done in 11.1)
lib/utils/download-utils.ts                         # Export utility functions
```

### Tooltip Style Pattern

All tooltips MUST use this exact inline style pattern (from `HistogramChart.tsx`):
```typescript
<Tooltip
  content={({ active, payload }) => {
    if (!active || !payload || !payload[0]) return null
    const item = payload[0].payload
    return (
      <div style={{
        backgroundColor: 'hsl(var(--popover))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '6px',
        fontSize: '12px',
        padding: '8px 12px',
      }}>
        <div style={{ fontWeight: 600, marginBottom: '4px' }}>Title</div>
        <div>Field: {value}</div>
      </div>
    )
  }}
/>
```

### Color Constants

Use these established color constants for consistency:
- **Bar fill:** `rgba(59, 130, 246, 0.6)` — blue with transparency
- **Bar stroke:** `#3B82F6` — blue-500
- **Mean indicator:** `#10B981` (diamond fill), `#059669` (diamond stroke) — green
- **Median line:** `#EF4444` — red-500
- **Whiskers:** `#64748B` — slate-500
- **Outliers:** `#F97316` — orange-500 (use for outlier dots to differentiate)
- **CI markers:** `#8B5CF6` — purple-500 (use for confidence interval lines in means mode)
- **Second sample color:** Consider using `#F97316` (orange) for Sample B to differentiate from Sample A (`#3B82F6` blue)

### Boxplot-Specific Implementation Details

**Data shape from Python (already typed in `types/analysis.ts`):**

```typescript
// Each boxplot has exactly 2 samples (tuple)
interface Hipotesis2MBoxplotVarianceData {
  type: 'boxplot_variance'
  data: {
    samples: [Hipotesis2MBoxplotSample, Hipotesis2MBoxplotSample]  // [A, B]
    leveneTestPValue: number
    leveneConclusion: string
  }
}

interface Hipotesis2MBoxplotSample {
  name: string       // "Muestra A" or "Muestra B"
  min: number
  q1: number
  median: number
  q3: number
  max: number
  outliers: number[]  // values outside fences
  mean: number
}

// Means mode adds CI
interface Hipotesis2MBoxplotMeansSample extends Hipotesis2MBoxplotSample {
  ciLower: number
  ciUpper: number
}
```

**Outlier rendering approach:**
- Whiskers extend from box to min/max of the data EXCLUDING outliers (the `min`/`max` values from Python already exclude outliers — they represent the fence-bounded range)
- Outlier values are in the `outliers: number[]` array
- Render each outlier as a circle dot at the correct Y position, using `<circle>` in the custom shape

**CI rendering approach (means mode only):**
- For each sample, render vertical CI lines from `ciLower` to `ciUpper`
- Use a different color (purple `#8B5CF6`) to differentiate from whiskers
- Render horizontal caps at ciLower and ciUpper
- Place CI markers slightly offset from the boxplot center to avoid overlap

### Histogram-Specific Implementation Details

**Data shape from Python (already typed):**
```typescript
interface Hipotesis2MHistogramData {
  type: 'histogram_a' | 'histogram_b'
  data: {
    bins: { start: number; end: number; count: number }[]
    mean: number
    sampleName: string
    outliers: number[]
  }
}
```

**Key differences from Capacidad Proceso HistogramChart:**
- Bins come PRE-CALCULATED from Python — no `calculateBins()` needed
- Use `binMidpoint = (start + end) / 2` for X-axis positioning
- No LEI/LES spec limits — only mean line
- No distribution curve overlay — simpler chart
- Outlier values shown as subtle markers or noted in subtitle
- Use `sampleName` in title: "Histograma - {sampleName}"

### Testing Requirements

**No unit tests needed for chart components.** This is consistent with existing chart components in the project — none of them have unit tests. TypeScript compiler validation + build verification + manual visual inspection is the testing approach.

**Verification commands:**
```bash
npx tsc --noEmit        # Zero new TypeScript errors
npm run build            # Successful build
```

**Pre-existing test failures:** Some MSA chart-related tests are known to fail. Do NOT fix these.

### Previous Story Intelligence

**From Story 11.1 (Type Definitions, Tool Parameters & Plantillas Integration):**

1. **All TypeScript types are complete.** `Hipotesis2MHistogramData`, `Hipotesis2MBoxplotVarianceData`, `Hipotesis2MBoxplotMeansData`, `Hipotesis2MChartDataItem`, `Hipotesis2MBoxplotSample`, `Hipotesis2MBoxplotMeansSample` are all defined in `types/analysis.ts` lines 407-460.

2. **Chart data uses camelCase keys.** Python chart data builder uses camelCase for chart data keys (e.g., `sampleName`, `leveneTestPValue`, `ciLower`). TypeScript chart interfaces match.

3. **Results dict uses snake_case.** But chart components only deal with `chartData`, not `results`. All chart data keys are camelCase.

4. **Code review feedback from 11.1:** Stale JSDoc and header issues were fixed. No open issues relevant to 11.2.

5. **`types/api.ts` already re-exports Capacidad Proceso chart types** (lines 293-297). Follow the same pattern for Hipotesis2M types.

6. **`ChatMessage.tsx` imports chart types from `@/types/api`** (line 30), not from `@/types/analysis`. Must add re-exports in `types/api.ts` first.

### Git Intelligence

**Recent commits:** `feat:` prefix for features, concise English summaries.

**Codebase state:** Story 11.1 is complete. All types are in place. This story creates the visual components that use those types.

**No pending refactors.** Clean starting point.

### Project Structure Notes

- All chart components are in `components/charts/` directory
- Each chart is a default export in its own file
- Barrel exports in `components/charts/index.ts`
- Container components group related charts (e.g., `CapacidadProcesoCharts.tsx`)
- Chart data flows: Python API response -> message metadata -> ChatMessage extraction -> Container -> Individual charts
- `'use client'` directive required for all chart components (they use React hooks)
- Export functionality uses `useRef` + `exportChartToPng` from `lib/utils/download-utils.ts`
- Toast notifications via `sonner` for export feedback

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-11, Story 11.2 — Lines 2298-2346]
- [Source: _bmad-output/planning-artifacts/prd-v4.md#FR-H11, FR-H26, FR-H27]
- [Source: types/analysis.ts#L407-460 — Hipotesis2M chart type definitions]
- [Source: components/charts/HistogramChart.tsx — Chart pattern reference (DO NOT reuse)]
- [Source: components/charts/MeasurementsByPart.tsx#L59-116 — BoxPlotBar shape reference]
- [Source: components/charts/CapacidadProcesoCharts.tsx — Container pattern reference]
- [Source: components/charts/index.ts — Barrel exports to extend]
- [Source: components/chat/ChatMessage.tsx#L124-130 — Chart data extraction pattern]
- [Source: components/chat/ChatMessage.tsx#L213-215 — Chart render pattern]
- [Source: types/api.ts#L293-297 — Chart type re-export pattern]
- [Source: lib/utils/download-utils.ts — Export utility functions]
- [Source: _bmad-output/implementation-artifacts/11-1-type-definitions-tool-parameters-plantillas-integration.md — Previous story context]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation with no blocking issues.

### Completion Notes List

- **Task 1:** Created `Hipotesis2MHistogramChart.tsx` — renders pre-binned histogram data from Python API using Recharts `ComposedChart` + `Bar`. Features: mean ReferenceLine (green), outlier ReferenceLine markers (orange dashed), tooltip with bin range/count, export button, Spanish labels, dark mode support via CSS variables.
- **Task 2:** Created `BoxplotChart.tsx` — dual-mode component (variance/means) rendering two side-by-side boxplots using custom `BoxPlotShape` SVG rendering inside Recharts `Bar` shape prop. Features: IQR box (blue), median line (red), mean diamond (green), whiskers (gray), outlier dots (orange circles), CI markers in means mode (purple vertical lines with caps), dynamic title with p-value/conclusion, comprehensive tooltip, export button, responsive legend.
- **Task 3:** Created `Hipotesis2MCharts.tsx` container — type-guards and renders all 4 chart types in order (Histogram A, Histogram B, Boxplot Variance, Boxplot Means) with consistent spacing.
- **Task 4:** Updated barrel exports (`components/charts/index.ts`), type re-exports (`types/api.ts`), and `ChatMessage.tsx` integration (import, extraction IIFE, conditional render block).
- **Task 5:** Verified zero new TypeScript errors and successful production build.

### File List

**Created:**
- `components/charts/Hipotesis2MHistogramChart.tsx`
- `components/charts/BoxplotChart.tsx`
- `components/charts/Hipotesis2MCharts.tsx`

**Modified:**
- `components/charts/index.ts`
- `components/chat/ChatMessage.tsx`
- `types/api.ts`

### Change Log

- **2026-03-14:** Implemented Story 11.2 — Created 3 new chart components (Hipotesis2MHistogramChart, BoxplotChart, Hipotesis2MCharts), updated barrel exports, type re-exports, and ChatMessage integration for 2-Sample Hypothesis Testing visualization.
- **2026-03-14:** Code review completed — Fixed 4 issues: (1) HIGH: Added missing Spanish accents across all UI text in both chart components to match existing codebase patterns; (2) MEDIUM: Replaced messy outlier legend div with clean SVG dashed line; (3) MEDIUM: Added outlier values to histogram X-axis domain calculation for robustness; (4) LOW: Added mode-specific data-testid to BoxplotChart. Build verified.
