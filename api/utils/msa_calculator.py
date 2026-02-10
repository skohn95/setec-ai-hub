"""
MSA (Gauge R&R) Calculator for the Analysis API.

This module performs Measurement System Analysis calculations using
ANOVA-based Gauge R&R methodology following AIAG MSA guidelines.

The calculations determine how much of the total variation in measurements
is due to:
- Repeatability (Equipment Variation - EV): Variation when same operator
  measures same part multiple times
- Reproducibility (Appraiser Variation - AV): Variation between different
  operators measuring the same parts
- Part-to-Part (PV): Actual variation between different parts

Key outputs:
- %GRR: Gauge R&R as percentage of Total Variation
- ndc: Number of Distinct Categories the system can reliably distinguish
- Classification: Aceptable (<10%), Marginal (10-30%), Inaceptable (>30%)
"""
import pandas as pd
import numpy as np
from typing import TypedDict, Any
import math


# =============================================================================
# Type Definitions
# =============================================================================

class MSAResults(TypedDict):
    """Structure for MSA calculation results."""
    grr_percent: float
    repeatability_percent: float
    reproducibility_percent: float
    part_to_part_percent: float
    total_variation: float
    ndc: int
    classification: str
    # Raw variance values for debugging
    variance_repeatability: float
    variance_reproducibility: float
    variance_part: float


class ChartDataEntry(TypedDict):
    """Structure for individual chart data entry."""
    type: str
    data: list[dict[str, Any]]


class MSAOutput(TypedDict):
    """Structure for complete MSA analysis output."""
    results: MSAResults
    chartData: list[ChartDataEntry]
    instructions: str
    dominant_variation: str  # 'repeatability', 'reproducibility', or 'part_to_part'
    classification: str  # 'aceptable', 'marginal', or 'inaceptable'


# =============================================================================
# Column Detection (backup if validated_columns not provided)
# =============================================================================

PART_PATTERNS = ['part', 'parte', 'pieza']
OPERATOR_PATTERNS = ['operator', 'operador', 'op']


def _find_column(df: pd.DataFrame, patterns: list[str]) -> str | None:
    """Find a column matching any of the given patterns (case-insensitive)."""
    for col in df.columns:
        col_lower = str(col).lower().strip()
        if col_lower in patterns:
            return col
    return None


def _find_measurement_columns(df: pd.DataFrame) -> list[str]:
    """Find columns that look like measurement columns."""
    import re
    measurement_patterns = [
        r'^measurement\s*\d*$',
        r'^medici[oó]n\s*\d*$',
        r'^med\s*\d+$',
        r'^m\d+$',
        r'^replica\s*\d*$',
        r'^rep\s*\d+$',
    ]

    measurement_cols = []
    for col in df.columns:
        col_lower = str(col).lower().strip()
        for pattern in measurement_patterns:
            if re.match(pattern, col_lower):
                measurement_cols.append(col)
                break

    return measurement_cols


def detect_columns(df: pd.DataFrame) -> dict[str, Any] | None:
    """Detect required columns in DataFrame."""
    part_col = _find_column(df, PART_PATTERNS)
    operator_col = _find_column(df, OPERATOR_PATTERNS)
    measurement_cols = _find_measurement_columns(df)

    if part_col is None or operator_col is None or len(measurement_cols) < 2:
        return None

    return {
        'part': part_col,
        'operator': operator_col,
        'measurements': measurement_cols,
    }


# =============================================================================
# ANOVA Calculations
# =============================================================================

def calculate_anova_components(
    df: pd.DataFrame,
    part_col: str,
    operator_col: str,
    measurement_cols: list[str]
) -> dict[str, float]:
    """
    Calculate ANOVA variance components for Gauge R&R.

    Uses the ANOVA (Analysis of Variance) method to decompose total variation
    into components for parts, operators, interaction, and repeatability.

    Args:
        df: DataFrame with measurement data
        part_col: Name of the Part column
        operator_col: Name of the Operator column
        measurement_cols: List of measurement column names

    Returns:
        Dictionary with variance components:
        - variance_repeatability: Within-operator, within-part variation
        - variance_reproducibility: Between-operator variation (includes interaction)
        - variance_part: Between-part variation
        - variance_total: Total variance
    """
    # Reshape data to long format for ANOVA
    # Each measurement becomes a separate row
    long_data = []

    for idx, row in df.iterrows():
        part = row[part_col]
        operator = row[operator_col]

        for m_col in measurement_cols:
            value = row[m_col]
            # Handle European decimal format (comma -> period)
            if isinstance(value, str):
                value = float(value.replace(',', '.').strip())
            else:
                value = float(value)

            long_data.append({
                'part': part,
                'operator': operator,
                'measurement': value,
            })

    long_df = pd.DataFrame(long_data)

    # Get counts
    n_parts = long_df['part'].nunique()
    n_operators = long_df['operator'].nunique()
    n_trials = len(measurement_cols)  # Number of replicate measurements
    n_total = len(long_df)

    # Calculate means
    grand_mean = long_df['measurement'].mean()

    # Part means (mean for each part across all operators and trials)
    part_means = long_df.groupby('part')['measurement'].mean()

    # Operator means (mean for each operator across all parts and trials)
    operator_means = long_df.groupby('operator')['measurement'].mean()

    # Cell means (mean for each part-operator combination)
    cell_means = long_df.groupby(['part', 'operator'])['measurement'].mean()

    # Calculate Sum of Squares
    # SS_Total = sum((x_ijk - grand_mean)^2)
    ss_total = ((long_df['measurement'] - grand_mean) ** 2).sum()

    # SS_Parts = n_operators * n_trials * sum((part_mean - grand_mean)^2)
    ss_parts = n_operators * n_trials * ((part_means - grand_mean) ** 2).sum()

    # SS_Operators = n_parts * n_trials * sum((operator_mean - grand_mean)^2)
    ss_operators = n_parts * n_trials * ((operator_means - grand_mean) ** 2).sum()

    # SS_Interaction = n_trials * sum((cell_mean - part_mean - operator_mean + grand_mean)^2)
    ss_interaction = 0
    for (part, operator), cell_mean in cell_means.items():
        part_effect = part_means[part] - grand_mean
        operator_effect = operator_means[operator] - grand_mean
        interaction = cell_mean - grand_mean - part_effect - operator_effect
        ss_interaction += n_trials * (interaction ** 2)

    # SS_Equipment (Repeatability) = SS_Total - SS_Parts - SS_Operators - SS_Interaction
    ss_equipment = ss_total - ss_parts - ss_operators - ss_interaction

    # Calculate degrees of freedom
    df_parts = n_parts - 1
    df_operators = n_operators - 1
    df_interaction = df_parts * df_operators
    df_equipment = n_total - n_parts * n_operators

    # Calculate Mean Squares (avoid division by zero)
    ms_parts = ss_parts / max(df_parts, 1)
    ms_operators = ss_operators / max(df_operators, 1)
    ms_interaction = ss_interaction / max(df_interaction, 1)
    ms_equipment = ss_equipment / max(df_equipment, 1)

    # Calculate Variance Components
    # σ²_equipment (Repeatability) = MS_Equipment
    variance_repeatability = max(0, ms_equipment)

    # σ²_interaction = (MS_Interaction - MS_Equipment) / n_trials
    variance_interaction = max(0, (ms_interaction - ms_equipment) / n_trials)

    # σ²_operator = (MS_Operators - MS_Interaction) / (n_parts * n_trials)
    variance_operator = max(0, (ms_operators - ms_interaction) / (n_parts * n_trials))

    # σ²_reproducibility = σ²_operator + σ²_interaction
    variance_reproducibility = variance_operator + variance_interaction

    # σ²_part = (MS_Parts - MS_Interaction) / (n_operators * n_trials)
    variance_part = max(0, (ms_parts - ms_interaction) / (n_operators * n_trials))

    # Total variance = σ²_part + σ²_reproducibility + σ²_repeatability
    variance_total = variance_part + variance_reproducibility + variance_repeatability

    return {
        'variance_repeatability': variance_repeatability,
        'variance_reproducibility': variance_reproducibility,
        'variance_part': variance_part,
        'variance_total': variance_total,
        'variance_operator': variance_operator,
        'variance_interaction': variance_interaction,
    }


# =============================================================================
# GRR Calculations and Classification
# =============================================================================

def calculate_grr_metrics(variance_components: dict[str, float]) -> dict[str, float]:
    """
    Calculate Gauge R&R metrics from variance components.

    Args:
        variance_components: Dict with variance_repeatability, variance_reproducibility,
                           variance_part, variance_total

    Returns:
        Dictionary with:
        - ev: Equipment Variation (Repeatability) standard deviation
        - av: Appraiser Variation (Reproducibility) standard deviation
        - grr: Gauge R&R standard deviation
        - pv: Part Variation standard deviation
        - tv: Total Variation standard deviation
        - grr_percent: %GRR
        - repeatability_percent: %EV
        - reproducibility_percent: %AV
        - part_to_part_percent: %PV
    """
    var_rep = variance_components['variance_repeatability']
    var_repro = variance_components['variance_reproducibility']
    var_part = variance_components['variance_part']
    var_total = variance_components['variance_total']

    # Standard deviations
    ev = math.sqrt(var_rep)  # Equipment Variation
    av = math.sqrt(var_repro)  # Appraiser Variation
    grr = math.sqrt(var_rep + var_repro)  # Gauge R&R
    pv = math.sqrt(var_part)  # Part Variation
    tv = math.sqrt(var_total)  # Total Variation

    # Percentages (relative to Total Variation)
    # Handle case where tv is zero or very small
    if tv < 1e-10:
        grr_percent = 0.0
        repeatability_percent = 0.0
        reproducibility_percent = 0.0
        part_to_part_percent = 0.0
    else:
        grr_percent = (grr / tv) * 100
        repeatability_percent = (ev / tv) * 100
        reproducibility_percent = (av / tv) * 100
        part_to_part_percent = (pv / tv) * 100

    return {
        'ev': ev,
        'av': av,
        'grr': grr,
        'pv': pv,
        'tv': tv,
        'grr_percent': round(grr_percent, 2),
        'repeatability_percent': round(repeatability_percent, 2),
        'reproducibility_percent': round(reproducibility_percent, 2),
        'part_to_part_percent': round(part_to_part_percent, 2),
    }


def classify_grr(grr_percent: float) -> tuple[str, str, str]:
    """
    Classify %GRR according to AIAG guidelines.

    Args:
        grr_percent: Gauge R&R as percentage of Total Variation

    Returns:
        Tuple of (classification, color_code, description)
        - classification: 'aceptable', 'marginal', or 'inaceptable'
        - color_code: Hex color for display
        - description: Human-readable description in Spanish
    """
    if grr_percent < 10:
        return (
            'aceptable',
            '#10B981',  # Green
            'Sistema de medición aceptable'
        )
    elif grr_percent <= 30:
        return (
            'marginal',
            '#F59E0B',  # Yellow/Amber
            'Sistema de medición marginal - puede ser aceptable dependiendo de la importancia'
        )
    else:
        return (
            'inaceptable',
            '#EF4444',  # Red
            'Sistema de medición inaceptable - necesita mejoras'
        )


def calculate_ndc(pv: float, grr: float) -> int:
    """
    Calculate Number of Distinct Categories (ndc).

    ndc = floor(1.41 * PV / GRR)

    A ndc >= 5 indicates the measurement system can adequately distinguish
    between parts for process control.

    Args:
        pv: Part Variation standard deviation
        grr: Gauge R&R standard deviation

    Returns:
        Number of distinct categories (integer, minimum 0)
    """
    if grr < 1e-10:
        # Perfect measurement system - cap at reasonable value
        return 999

    ndc = int(math.floor(1.41 * pv / grr))
    return max(0, ndc)


# =============================================================================
# Results Formatting
# =============================================================================

def format_msa_results(
    variance_components: dict[str, float],
    grr_metrics: dict[str, float]
) -> MSAResults:
    """
    Format MSA results into the expected output structure.

    Args:
        variance_components: Dict with variance values
        grr_metrics: Dict with GRR metrics and percentages

    Returns:
        MSAResults TypedDict
    """
    classification, _, _ = classify_grr(grr_metrics['grr_percent'])
    ndc = calculate_ndc(grr_metrics['pv'], grr_metrics['grr'])

    return {
        'grr_percent': grr_metrics['grr_percent'],
        'repeatability_percent': grr_metrics['repeatability_percent'],
        'reproducibility_percent': grr_metrics['reproducibility_percent'],
        'part_to_part_percent': grr_metrics['part_to_part_percent'],
        'total_variation': round(grr_metrics['tv'], 6),
        'ndc': ndc,
        'classification': classification,
        'variance_repeatability': round(variance_components['variance_repeatability'], 8),
        'variance_reproducibility': round(variance_components['variance_reproducibility'], 8),
        'variance_part': round(variance_components['variance_part'], 8),
    }


def format_chart_data(
    results: MSAResults,
    df: pd.DataFrame,
    operator_col: str,
    measurement_cols: list[str]
) -> list[ChartDataEntry]:
    """
    Format chart data for frontend visualization.

    Creates two chart datasets:
    1. variationBreakdown: Horizontal bar chart showing variation sources
    2. operatorComparison: Grouped comparison of operators

    Args:
        results: MSA results dict
        df: Original DataFrame
        operator_col: Name of operator column
        measurement_cols: List of measurement column names

    Returns:
        List of chart data entries
    """
    # Get classification color for GRR Total
    _, grr_color, _ = classify_grr(results['grr_percent'])

    # Variation Breakdown Chart
    variation_breakdown: ChartDataEntry = {
        'type': 'variationBreakdown',
        'data': [
            {
                'source': 'GRR Total',
                'percentage': results['grr_percent'],
                'color': grr_color,
            },
            {
                'source': 'Repetibilidad',
                'percentage': results['repeatability_percent'],
                'color': '#3B82F6',  # Blue
            },
            {
                'source': 'Reproducibilidad',
                'percentage': results['reproducibility_percent'],
                'color': '#F97316',  # Orange
            },
            {
                'source': 'Parte a Parte',
                'percentage': results['part_to_part_percent'],
                'color': '#10B981',  # Green
            },
        ]
    }

    # Operator Comparison Chart
    operator_stats = []
    operators = df[operator_col].unique()

    for operator in operators:
        operator_data = df[df[operator_col] == operator]
        measurements = []

        for m_col in measurement_cols:
            for value in operator_data[m_col]:
                if pd.notna(value):
                    if isinstance(value, str):
                        measurements.append(float(value.replace(',', '.').strip()))
                    else:
                        measurements.append(float(value))

        if measurements:
            # Handle edge case where there's only 1 measurement (std returns NaN with ddof=1)
            std_dev = np.std(measurements, ddof=1) if len(measurements) > 1 else 0.0
            operator_stats.append({
                'operator': str(operator),
                'mean': round(np.mean(measurements), 4),
                'stdDev': round(std_dev, 4) if not np.isnan(std_dev) else 0.0,
            })

    operator_comparison: ChartDataEntry = {
        'type': 'operatorComparison',
        'data': operator_stats
    }

    return [variation_breakdown, operator_comparison]


# =============================================================================
# Instruction Generation
# =============================================================================

def determine_dominant_variation(ev: float, av: float, pv: float) -> str:
    """
    Determine the dominant source of variation.

    Args:
        ev: Repeatability percentage
        av: Reproducibility percentage
        pv: Part-to-part percentage

    Returns:
        'repeatability', 'reproducibility', or 'part_to_part'
    """
    if ev > av and ev > pv:
        return 'repeatability'
    elif av > ev and av > pv:
        return 'reproducibility'
    else:
        return 'part_to_part'


def generate_instructions(results: MSAResults) -> tuple[str, str]:
    """
    Generate enhanced markdown instructions for presenting MSA results.

    Includes:
    - Executive summary section
    - Detailed results
    - Metric explanations
    - Contextual interpretation
    - Actionable recommendations based on dominant variation source
    - ndc interpretation

    Args:
        results: MSA results dict

    Returns:
        Tuple of (markdown instructions string, dominant_variation string)
    """
    classification, color, description = classify_grr(results['grr_percent'])

    # Classification labels for display
    classification_display = {
        'aceptable': 'Aceptable',
        'marginal': 'Marginal',
        'inaceptable': 'Inaceptable',
    }

    # Classification emoji indicators
    classification_emoji = {
        'aceptable': '🟢',
        'marginal': '🟡',
        'inaceptable': '🔴',
    }

    # Determine dominant variation source
    ev = results['repeatability_percent']
    av = results['reproducibility_percent']
    pv = results['part_to_part_percent']
    grr = results['grr_percent']
    ndc = results['ndc']

    dominant = determine_dominant_variation(ev, av, pv)

    # Generate dominant variation explanation and recommendations
    if dominant == 'repeatability':
        dominant_display = 'REPETIBILIDAD'
        dominant_explanation = (
            f'La **repetibilidad** ({ev:.1f}%) es la fuente dominante de variación del sistema de medición. '
            'Esto indica variación en las mediciones repetidas por el MISMO operador midiendo la MISMA pieza.'
        )
        recommendations = [
            'Verificar la calibración del equipo de medición',
            'Revisar el estado y mantenimiento del instrumento',
            'Estandarizar las condiciones ambientales de medición',
            'Considerar actualizar o reemplazar el equipo si es obsoleto',
        ]
    elif dominant == 'reproducibility':
        dominant_display = 'REPRODUCIBILIDAD'
        dominant_explanation = (
            f'La **reproducibilidad** ({av:.1f}%) es la fuente dominante de variación del sistema de medición. '
            'Esto indica diferencias significativas entre cómo miden DIFERENTES operadores las mismas piezas.'
        )
        recommendations = [
            'Estandarizar el procedimiento de medición entre operadores',
            'Proporcionar entrenamiento uniforme a todos los operadores',
            'Crear instrucciones visuales paso a paso',
            'Verificar que todos usen la misma técnica de posicionamiento',
        ]
    else:
        dominant_display = 'PARTE A PARTE'
        dominant_explanation = (
            f'La variación **parte a parte** ({pv:.1f}%) es dominante, '
            'lo cual es deseable ya que refleja las diferencias reales entre las piezas.'
        )
        recommendations = [
            'El sistema de medición está funcionando correctamente',
            'Mantener el programa de calibración actual',
            'Documentar las buenas prácticas actuales',
        ]

    # ndc interpretation
    if ndc >= 5:
        ndc_interpretation = (
            f'Con **ndc = {ndc}**, el sistema puede distinguir {ndc} categorías distintas. '
            'Esto es adecuado para control de proceso (se recomiendan ≥5 categorías).'
        )
        ndc_status = '✅ Adecuado'
    elif ndc >= 2:
        ndc_interpretation = (
            f'Con **ndc = {ndc}**, el sistema tiene resolución limitada. '
            'Puede servir para decisiones pasa/no pasa, pero no para control de proceso detallado.'
        )
        ndc_status = '⚠️ Limitado'
    else:
        ndc_interpretation = (
            f'Con **ndc = {ndc}**, el sistema no puede distinguir entre partes diferentes. '
            'Se necesita mejorar significativamente el sistema de medición.'
        )
        ndc_status = '❌ Insuficiente'

    # Contextual interpretation - what does this GRR mean practically?
    if grr < 10:
        practical_meaning = (
            f'Esto significa que **menos del 10%** de la variación que observas en tus mediciones '
            f'viene del sistema de medición. El **{100-grr:.0f}%** restante refleja diferencias reales '
            'en tu proceso o producto.'
        )
    elif grr <= 30:
        practical_meaning = (
            f'Un GRR de **{grr:.1f}%** significa que aproximadamente **1 de cada {int(100/grr)}** '
            f'unidades de variación que observas viene del sistema de medición, no del proceso real. '
            'Pequeñas mejoras del proceso podrían ser enmascaradas por el ruido de medición.'
        )
    else:
        practical_meaning = (
            f'Con un GRR de **{grr:.1f}%**, más de un tercio de la variación observada '
            'proviene del sistema de medición. Esto puede enmascarar problemas reales '
            'o crear falsos rechazos. Es difícil tomar decisiones confiables con estos datos.'
        )

    # Build enhanced markdown instructions
    instructions = f"""## INSTRUCCIONES PARA EL AGENTE

PRESENTAR LOS RESULTADOS EN ESTE ORDEN:

---

### 1. RESUMEN EJECUTIVO

{classification_emoji[classification]} **Clasificación: {classification_display[classification].upper()}**

| Métrica | Valor |
|---------|-------|
| %GRR Total | **{grr:.1f}%** |
| Fuente Dominante | {dominant_display} |
| Categorías Distintas (ndc) | {ndc} ({ndc_status}) |

**Veredicto:** {description}

---

### 2. RESULTADOS DETALLADOS

Presentar con formato claro:

| Componente | Porcentaje | Descripción |
|------------|------------|-------------|
| **%GRR Total** | {grr:.1f}% | Variación total del sistema de medición |
| **Repetibilidad (EV)** | {ev:.1f}% | Variación del equipo |
| **Reproducibilidad (AV)** | {av:.1f}% | Variación entre operadores |
| **Parte a Parte (PV)** | {pv:.1f}% | Variación real entre piezas |

---

### 3. EXPLICACIÓN DE MÉTRICAS

Explicar al usuario en términos simples:

- **Repetibilidad (EV):** Variación cuando el MISMO operador mide la MISMA pieza múltiples veces. Refleja la precisión del instrumento.
- **Reproducibilidad (AV):** Variación entre DIFERENTES operadores midiendo las mismas piezas. Refleja consistencia del método.
- **ndc (Categorías Distintas):** Número de grupos distintos que el sistema puede distinguir confiablemente. Se recomiendan ≥5 para control de proceso.

---

### 4. INTERPRETACIÓN CONTEXTUAL

{practical_meaning}

---

### 5. FUENTE DOMINANTE DE VARIACIÓN

{dominant_explanation}

---

### 6. RECOMENDACIONES

Basado en los resultados del análisis:

"""

    for i, rec in enumerate(recommendations, 1):
        instructions += f'{i}. {rec}\n'

    # Add additional context for high GRR
    if grr > 30:
        instructions += """
**⚠️ ATENCIÓN:** Con un %GRR > 30%, se recomienda abordar estos problemas ANTES de usar el sistema para decisiones de calidad.
"""

    # Add threshold reference
    instructions += f"""
---

### 7. REFERENCIA DE UMBRALES (AIAG)

| %GRR | Clasificación | Color | Interpretación |
|------|--------------|-------|----------------|
| < 10% | Aceptable | 🟢 Verde | Sistema de medición confiable |
| 10-30% | Marginal | 🟡 Amarillo | Usar con precaución, considerar mejoras |
| > 30% | Inaceptable | 🔴 Rojo | Requiere mejora antes de usar |

---

### 8. NÚMERO DE CATEGORÍAS DISTINTAS (ndc)

{ndc_interpretation}

| ndc | Interpretación |
|-----|----------------|
| ≥ 5 | Adecuado para control de proceso |
| 2-4 | Útil para decisiones pasa/no pasa |
| < 2 | Sistema no discrimina entre partes |
"""

    return instructions, dominant


# =============================================================================
# Main Analysis Function
# =============================================================================

def analyze_msa(
    df: pd.DataFrame,
    validated_columns: dict[str, Any] | None = None
) -> tuple[MSAOutput | None, str | None]:
    """
    Perform MSA (Gauge R&R) analysis on measurement data.

    Uses ANOVA-based method to calculate variance components and
    determine measurement system capability.

    Args:
        df: DataFrame with Part, Operator, and Measurement columns
        validated_columns: Optional pre-validated column mapping from validator.
            If not provided, will attempt to detect columns automatically.
            Format: {'part': str, 'operator': str, 'measurements': list[str]}

    Returns:
        tuple: (MSAOutput, error_code)
        - On success: (MSAOutput dict with results/chartData/instructions, None)
        - On error: (None, error_code string)

    Error codes:
        - CALCULATION_ERROR: Error during statistical calculations
        - MISSING_COLUMNS: Required columns not found in DataFrame
    """
    try:
        # Validate input
        if df is None or df.empty:
            return None, 'CALCULATION_ERROR'

        # Get column mapping
        if validated_columns is not None:
            columns = validated_columns
        else:
            columns = detect_columns(df)
            if columns is None:
                return None, 'MISSING_COLUMNS'

        part_col = columns['part']
        operator_col = columns['operator']
        measurement_cols = columns['measurements']

        # Verify columns exist in DataFrame
        if part_col not in df.columns:
            return None, 'MISSING_COLUMNS'
        if operator_col not in df.columns:
            return None, 'MISSING_COLUMNS'
        for m_col in measurement_cols:
            if m_col not in df.columns:
                return None, 'MISSING_COLUMNS'

        # Calculate ANOVA variance components
        variance_components = calculate_anova_components(
            df, part_col, operator_col, measurement_cols
        )

        # Calculate GRR metrics
        grr_metrics = calculate_grr_metrics(variance_components)

        # Format results
        results = format_msa_results(variance_components, grr_metrics)

        # Format chart data
        chart_data = format_chart_data(results, df, operator_col, measurement_cols)

        # Generate instructions and get dominant variation
        instructions, dominant_variation = generate_instructions(results)

        output: MSAOutput = {
            'results': results,
            'chartData': chart_data,
            'instructions': instructions,
            'dominant_variation': dominant_variation,
            'classification': results['classification'],
        }

        return output, None

    except Exception as e:
        print(f'MSA calculation error: {type(e).__name__}: {e}')
        return None, 'CALCULATION_ERROR'
