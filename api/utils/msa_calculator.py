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
- ANOVA table with F-statistics and P-values
- Operator statistics (mean, std dev, range)
"""
import pandas as pd
import numpy as np
from typing import TypedDict, Any
import math


# =============================================================================
# P-Value Calculation (Pure Python - No scipy dependency)
# =============================================================================

def _log_beta(a: float, b: float) -> float:
    """
    Compute log of the beta function B(a,b) = Gamma(a)*Gamma(b)/Gamma(a+b).
    Uses math.lgamma from stdlib.
    """
    return math.lgamma(a) + math.lgamma(b) - math.lgamma(a + b)


def _betacf(a: float, b: float, x: float, max_iter: int = 200, eps: float = 3e-12) -> float:
    """
    Evaluates continued fraction for incomplete beta function.
    Based on Numerical Recipes betacf function.
    """
    qab = a + b
    qap = a + 1.0
    qam = a - 1.0
    c = 1.0
    d = 1.0 - qab * x / qap
    if abs(d) < 1e-30:
        d = 1e-30
    d = 1.0 / d
    h = d

    for m in range(1, max_iter + 1):
        m2 = 2 * m
        # Even step
        aa = m * (b - m) * x / ((qam + m2) * (a + m2))
        d = 1.0 + aa * d
        if abs(d) < 1e-30:
            d = 1e-30
        c = 1.0 + aa / c
        if abs(c) < 1e-30:
            c = 1e-30
        d = 1.0 / d
        h *= d * c

        # Odd step
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
        d = 1.0 + aa * d
        if abs(d) < 1e-30:
            d = 1e-30
        c = 1.0 + aa / c
        if abs(c) < 1e-30:
            c = 1e-30
        d = 1.0 / d
        delta = d * c
        h *= delta

        if abs(delta - 1.0) < eps:
            break

    return h


def _betainc(a: float, b: float, x: float) -> float:
    """
    Compute regularized incomplete beta function I_x(a,b).
    Based on Numerical Recipes betai function.

    Args:
        a, b: Shape parameters (positive)
        x: Upper limit of integration (0 <= x <= 1)

    Returns:
        I_x(a,b) = B(x;a,b) / B(a,b)
    """
    if x < 0.0 or x > 1.0:
        raise ValueError("x must be between 0 and 1")

    if x == 0.0 or x == 1.0:
        bt = 0.0
    else:
        # Compute the prefactor x^a * (1-x)^b / B(a,b)
        bt = math.exp(
            math.lgamma(a + b) - math.lgamma(a) - math.lgamma(b)
            + a * math.log(x) + b * math.log(1.0 - x)
        )

    # Use symmetry relation for numerical stability
    if x < (a + 1.0) / (a + b + 2.0):
        return bt * _betacf(a, b, x) / a
    else:
        return 1.0 - bt * _betacf(b, a, 1.0 - x) / b


def f_distribution_sf(f_value: float, df1: int, df2: int) -> float:
    """
    Compute the survival function (1 - CDF) of the F-distribution.
    This gives the p-value for a one-tailed F-test.

    The F-distribution CDF is related to the incomplete beta function by:
    F_CDF(x; d1, d2) = I_{d1*x/(d1*x + d2)}(d1/2, d2/2)

    Args:
        f_value: The F-statistic value
        df1: Degrees of freedom for numerator (between-group)
        df2: Degrees of freedom for denominator (within-group)

    Returns:
        P(F > f_value) - the p-value for the F-test
    """
    if f_value <= 0:
        return 1.0
    if df1 <= 0 or df2 <= 0:
        return None

    # Transform to beta function argument
    x = df1 * f_value / (df1 * f_value + df2)

    # CDF = I_x(df1/2, df2/2)
    cdf = _betainc(df1 / 2, df2 / 2, x)

    # Survival function = 1 - CDF = p-value
    return 1.0 - cdf


# =============================================================================
# Type Definitions
# =============================================================================

class ANOVARow(TypedDict):
    """Structure for a single ANOVA table row."""
    source: str
    df: int
    ss: float
    ms: float
    f_value: float | None
    p_value: float | None


class OperatorStats(TypedDict):
    """Structure for operator statistics."""
    operator: str
    mean: float
    std_dev: float
    range_avg: float
    consistency_score: float  # Lower is better (less variation)
    rank: int  # 1 = best, n = worst


class StudyInfo(TypedDict):
    """Structure for study design information."""
    n_operators: int  # Number of operators
    n_parts: int      # Number of parts (k)
    n_trials: int     # Number of repetitions (r)
    n_total: int      # Total measurements


class VarianceContribution(TypedDict):
    """Structure for variance contribution breakdown."""
    source: str
    variance: float
    pct_contribution: float  # % of total variance
    pct_study_variation: float  # % of 6*sigma study variation
    std_dev: float


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
    # New enhanced fields
    anova_table: list[ANOVARow]
    study_info: StudyInfo
    variance_contributions: list[VarianceContribution]
    operator_stats: list[OperatorStats]
    variance_operator: float
    variance_interaction: float


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
) -> dict[str, Any]:
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
        - anova_table: Full ANOVA table with F-statistics and P-values
        - study_info: Study design information (n, k, r)
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

    # Store study info
    study_info: StudyInfo = {
        'n_operators': n_operators,
        'n_parts': n_parts,
        'n_trials': n_trials,
        'n_total': n_total,
    }

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
    df_total = n_total - 1

    # Calculate Mean Squares (avoid division by zero)
    ms_parts = ss_parts / max(df_parts, 1)
    ms_operators = ss_operators / max(df_operators, 1)
    ms_interaction = ss_interaction / max(df_interaction, 1)
    ms_equipment = ss_equipment / max(df_equipment, 1)

    # Calculate F-statistics and P-values
    # Using fixed effects model (Type II ANOVA) - all F-tests use MS_Equipment as denominator
    # This matches statsmodels anova_lm(model, typ=2) behavior

    f_parts = ms_parts / ms_equipment if ms_equipment > 1e-10 else None
    f_operators = ms_operators / ms_equipment if ms_equipment > 1e-10 else None
    f_interaction = ms_interaction / ms_equipment if ms_equipment > 1e-10 else None

    # Calculate P-values using pure Python F-distribution (no scipy needed)
    p_parts = f_distribution_sf(f_parts, df_parts, df_equipment) if f_parts is not None else None
    p_operators = f_distribution_sf(f_operators, df_operators, df_equipment) if f_operators is not None else None
    p_interaction = f_distribution_sf(f_interaction, df_interaction, df_equipment) if f_interaction is not None else None

    # Build ANOVA table
    anova_table: list[ANOVARow] = [
        {
            'source': 'Parte',
            'df': df_parts,
            'ss': round(ss_parts, 6),
            'ms': round(ms_parts, 6),
            'f_value': round(f_parts, 4) if f_parts is not None else None,
            'p_value': round(p_parts, 4) if p_parts is not None else None,
        },
        {
            'source': 'Operador',
            'df': df_operators,
            'ss': round(ss_operators, 6),
            'ms': round(ms_operators, 6),
            'f_value': round(f_operators, 4) if f_operators is not None else None,
            'p_value': round(p_operators, 4) if p_operators is not None else None,
        },
        {
            'source': 'Operador×Parte',
            'df': df_interaction,
            'ss': round(ss_interaction, 6),
            'ms': round(ms_interaction, 6),
            'f_value': round(f_interaction, 4) if f_interaction is not None else None,
            'p_value': round(p_interaction, 4) if p_interaction is not None else None,
        },
        {
            'source': 'Repetibilidad',
            'df': df_equipment,
            'ss': round(ss_equipment, 6),
            'ms': round(ms_equipment, 6),
            'f_value': None,
            'p_value': None,
        },
        {
            'source': 'Total',
            'df': df_total,
            'ss': round(ss_total, 6),
            'ms': None,
            'f_value': None,
            'p_value': None,
        },
    ]

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

    # Calculate variance contributions (%Contribution and %Study Variation)
    variance_grr = variance_repeatability + variance_reproducibility

    # Avoid division by zero
    if variance_total < 1e-10:
        variance_total = 1e-10

    # Standard deviations for 6*sigma study variation calculation
    sd_repeatability = math.sqrt(variance_repeatability)
    sd_reproducibility = math.sqrt(variance_reproducibility)
    sd_operator = math.sqrt(variance_operator)
    sd_interaction = math.sqrt(variance_interaction)
    sd_grr = math.sqrt(variance_grr)
    sd_part = math.sqrt(variance_part)
    sd_total = math.sqrt(variance_total)

    variance_contributions: list[VarianceContribution] = [
        {
            'source': 'Total Gauge R&R',
            'variance': round(variance_grr, 8),
            'pct_contribution': round(100 * variance_grr / variance_total, 2),
            'pct_study_variation': round(100 * sd_grr / sd_total, 2) if sd_total > 1e-10 else 0,
            'std_dev': round(sd_grr, 6),
        },
        {
            'source': 'Repetibilidad',
            'variance': round(variance_repeatability, 8),
            'pct_contribution': round(100 * variance_repeatability / variance_total, 2),
            'pct_study_variation': round(100 * sd_repeatability / sd_total, 2) if sd_total > 1e-10 else 0,
            'std_dev': round(sd_repeatability, 6),
        },
        {
            'source': 'Reproducibilidad',
            'variance': round(variance_reproducibility, 8),
            'pct_contribution': round(100 * variance_reproducibility / variance_total, 2),
            'pct_study_variation': round(100 * sd_reproducibility / sd_total, 2) if sd_total > 1e-10 else 0,
            'std_dev': round(sd_reproducibility, 6),
        },
        {
            'source': 'Operador',
            'variance': round(variance_operator, 8),
            'pct_contribution': round(100 * variance_operator / variance_total, 2),
            'pct_study_variation': round(100 * sd_operator / sd_total, 2) if sd_total > 1e-10 else 0,
            'std_dev': round(sd_operator, 6),
        },
        {
            'source': 'Operador×Parte',
            'variance': round(variance_interaction, 8),
            'pct_contribution': round(100 * variance_interaction / variance_total, 2),
            'pct_study_variation': round(100 * sd_interaction / sd_total, 2) if sd_total > 1e-10 else 0,
            'std_dev': round(sd_interaction, 6),
        },
        {
            'source': 'Parte a Parte',
            'variance': round(variance_part, 8),
            'pct_contribution': round(100 * variance_part / variance_total, 2),
            'pct_study_variation': round(100 * sd_part / sd_total, 2) if sd_total > 1e-10 else 0,
            'std_dev': round(sd_part, 6),
        },
        {
            'source': 'Variación Total',
            'variance': round(variance_total, 8),
            'pct_contribution': 100.0,
            'pct_study_variation': 100.0,
            'std_dev': round(sd_total, 6),
        },
    ]

    return {
        'variance_repeatability': variance_repeatability,
        'variance_reproducibility': variance_reproducibility,
        'variance_part': variance_part,
        'variance_total': variance_total,
        'variance_operator': variance_operator,
        'variance_interaction': variance_interaction,
        'anova_table': anova_table,
        'study_info': study_info,
        'variance_contributions': variance_contributions,
        'long_df': long_df,  # Pass through for chart data generation
    }


# =============================================================================
# Operator Statistics and Ranking
# =============================================================================

def calculate_operator_stats(
    long_df: pd.DataFrame,
    n_parts: int
) -> list[OperatorStats]:
    """
    Calculate operator statistics and rank them by consistency.

    Args:
        long_df: DataFrame in long format with 'operator', 'part', 'measurement' columns
        n_parts: Number of parts in the study

    Returns:
        List of OperatorStats sorted by rank (best first)
    """
    operator_stats = []

    operators = long_df['operator'].unique()

    for operator in operators:
        op_data = long_df[long_df['operator'] == operator]

        # Calculate mean
        mean = op_data['measurement'].mean()

        # Calculate standard deviation
        std_dev = op_data['measurement'].std(ddof=1) if len(op_data) > 1 else 0.0

        # Calculate average range per part (for R chart)
        ranges = []
        for part in op_data['part'].unique():
            part_measurements = op_data[op_data['part'] == part]['measurement'].values
            if len(part_measurements) > 1:
                ranges.append(part_measurements.max() - part_measurements.min())

        range_avg = np.mean(ranges) if ranges else 0.0

        # Consistency score: lower is better
        # Use coefficient of variation (CV) as consistency measure
        # CV = std_dev / abs(mean) if mean != 0
        if abs(mean) > 1e-10:
            consistency_score = std_dev / abs(mean) * 100
        else:
            consistency_score = std_dev * 100  # Just use std if mean is near zero

        # Convert float operators to int for display (1.0 -> "1")
        op_id = str(int(operator)) if isinstance(operator, float) and operator.is_integer() else str(operator)
        operator_stats.append({
            'operator': op_id,
            'mean': round(mean, 6),
            'std_dev': round(std_dev, 6),
            'range_avg': round(range_avg, 6),
            'consistency_score': round(consistency_score, 4),
            'rank': 0,  # Will be set below
        })

    # Sort by consistency score (lower is better) and assign ranks
    operator_stats.sort(key=lambda x: x['consistency_score'])
    for i, op_stat in enumerate(operator_stats):
        op_stat['rank'] = i + 1

    return operator_stats


# =============================================================================
# GRR Calculations and Classification
# =============================================================================

def calculate_grr_metrics(variance_components: dict[str, Any]) -> dict[str, float]:
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
    variance_components: dict[str, Any],
    grr_metrics: dict[str, float],
    operator_stats: list[OperatorStats]
) -> MSAResults:
    """
    Format MSA results into the expected output structure.

    Args:
        variance_components: Dict with variance values and ANOVA data
        grr_metrics: Dict with GRR metrics and percentages
        operator_stats: List of operator statistics with rankings

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
        # New enhanced fields
        'anova_table': variance_components['anova_table'],
        'study_info': variance_components['study_info'],
        'variance_contributions': variance_components['variance_contributions'],
        'operator_stats': operator_stats,
        'variance_operator': round(variance_components['variance_operator'], 8),
        'variance_interaction': round(variance_components['variance_interaction'], 8),
    }


def format_chart_data(
    results: MSAResults,
    df: pd.DataFrame,
    operator_col: str,
    part_col: str,
    measurement_cols: list[str],
    long_df: pd.DataFrame
) -> list[ChartDataEntry]:
    """
    Format chart data for frontend visualization.

    Creates chart datasets:
    1. variationBreakdown: Horizontal bar chart showing variation sources
    2. operatorComparison: Grouped comparison of operators (mean + std dev)
    3. rChartByOperator: R chart (range) by operator with control limits
    4. xBarChartByOperator: X-bar chart by operator with control limits
    5. measurementsByPart: All measurements grouped by part
    6. measurementsByOperator: All measurements grouped by operator
    7. interactionPlot: Operator×Part interaction plot

    Args:
        results: MSA results dict
        df: Original DataFrame
        operator_col: Name of operator column
        part_col: Name of part column
        measurement_cols: List of measurement column names
        long_df: DataFrame in long format

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
    operators = df[operator_col].unique()
    operator_stats = []

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
            std_dev = np.std(measurements, ddof=1) if len(measurements) > 1 else 0.0
            # Convert float operators to int for display (1.0 -> "1")
            op_id = str(int(operator)) if isinstance(operator, float) and operator.is_integer() else str(operator)
            operator_stats.append({
                'operator': op_id,
                'mean': round(np.mean(measurements), 4),
                'stdDev': round(std_dev, 4) if not np.isnan(std_dev) else 0.0,
            })

    operator_comparison: ChartDataEntry = {
        'type': 'operatorComparison',
        'data': operator_stats
    }

    # R Chart by Operator - Calculate range for each part per operator
    n_trials = len(measurement_cols)
    r_chart_data = []
    all_ranges = []

    for operator in operators:
        op_data = long_df[long_df['operator'] == operator]
        parts = op_data['part'].unique()

        for part in parts:
            part_measurements = op_data[op_data['part'] == part]['measurement'].values
            if len(part_measurements) > 1:
                r = part_measurements.max() - part_measurements.min()
                all_ranges.append(r)
                r_chart_data.append({
                    'operator': str(operator),
                    'part': str(part),
                    'range': round(r, 4),
                })

    # Calculate R-bar (average range) and control limits
    r_bar = np.mean(all_ranges) if all_ranges else 0
    # D3 and D4 constants for control limits (based on subgroup size n)
    # For n=2: D3=0, D4=3.267; n=3: D3=0, D4=2.574; n=4: D3=0, D4=2.282
    d4_constants = {2: 3.267, 3: 2.574, 4: 2.282, 5: 2.114, 6: 2.004}
    d3_constants = {2: 0, 3: 0, 4: 0, 5: 0, 6: 0}
    d4 = d4_constants.get(n_trials, 2.574)  # Default to n=3
    d3 = d3_constants.get(n_trials, 0)

    ucl_r = r_bar * d4
    lcl_r = r_bar * d3

    r_chart: ChartDataEntry = {
        'type': 'rChartByOperator',
        'data': {
            'points': r_chart_data,
            'rBar': round(r_bar, 4),
            'uclR': round(ucl_r, 4),
            'lclR': round(lcl_r, 4),
        }
    }

    # X-bar Chart by Operator - Calculate mean for each part per operator
    xbar_chart_data = []
    all_means = []

    for operator in operators:
        op_data = long_df[long_df['operator'] == operator]
        parts = op_data['part'].unique()

        for part in parts:
            part_measurements = op_data[op_data['part'] == part]['measurement'].values
            if len(part_measurements) > 0:
                x_bar = np.mean(part_measurements)
                all_means.append(x_bar)
                xbar_chart_data.append({
                    'operator': str(operator),
                    'part': str(part),
                    'mean': round(x_bar, 4),
                })

    # Calculate X-double-bar and control limits
    x_double_bar = np.mean(all_means) if all_means else 0
    # A2 constants for X-bar chart (based on subgroup size n)
    a2_constants = {2: 1.880, 3: 1.023, 4: 0.729, 5: 0.577, 6: 0.483}
    a2 = a2_constants.get(n_trials, 1.023)  # Default to n=3

    ucl_xbar = x_double_bar + a2 * r_bar
    lcl_xbar = x_double_bar - a2 * r_bar

    xbar_chart: ChartDataEntry = {
        'type': 'xBarChartByOperator',
        'data': {
            'points': xbar_chart_data,
            'xDoubleBar': round(x_double_bar, 4),
            'uclXBar': round(ucl_xbar, 4),
            'lclXBar': round(lcl_xbar, 4),
        }
    }

    # Measurements by Part - All measurements grouped by part
    parts = long_df['part'].unique()
    measurements_by_part_data = []

    for part in parts:
        part_data = long_df[long_df['part'] == part]
        measurements = part_data['measurement'].values
        measurements_by_part_data.append({
            'part': str(part),
            'measurements': [round(m, 4) for m in measurements],
            'mean': round(np.mean(measurements), 4),
            'min': round(np.min(measurements), 4),
            'max': round(np.max(measurements), 4),
        })

    measurements_by_part: ChartDataEntry = {
        'type': 'measurementsByPart',
        'data': measurements_by_part_data
    }

    # Measurements by Operator - All measurements grouped by operator
    measurements_by_operator_data = []

    for operator in operators:
        op_data = long_df[long_df['operator'] == operator]
        measurements = op_data['measurement'].values
        measurements_by_operator_data.append({
            'operator': str(operator),
            'measurements': [round(m, 4) for m in measurements],
            'mean': round(np.mean(measurements), 4),
            'min': round(np.min(measurements), 4),
            'max': round(np.max(measurements), 4),
        })

    measurements_by_operator: ChartDataEntry = {
        'type': 'measurementsByOperator',
        'data': measurements_by_operator_data
    }

    # Interaction Plot - Operator×Part mean values for line chart
    interaction_data = []

    for operator in operators:
        op_data = long_df[long_df['operator'] == operator]
        part_means = {}

        for part in parts:
            part_measurements = op_data[op_data['part'] == part]['measurement'].values
            if len(part_measurements) > 0:
                part_means[str(part)] = round(np.mean(part_measurements), 4)

        interaction_data.append({
            'operator': str(operator),
            'partMeans': part_means,
        })

    # Also include the list of parts in order for the x-axis
    interaction_plot: ChartDataEntry = {
        'type': 'interactionPlot',
        'data': {
            'operators': interaction_data,
            'parts': [str(p) for p in parts],
        }
    }

    return [
        variation_breakdown,
        operator_comparison,
        r_chart,
        xbar_chart,
        measurements_by_part,
        measurements_by_operator,
        interaction_plot,
    ]


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


def generate_instructions(results: MSAResults, bias_info: dict | None = None) -> tuple[str, str]:
    """
    Generate enhanced markdown instructions for presenting MSA results.

    Three-part format:
    - Part 1: Technical Analysis (ANOVA table, variance components)
    - Part 2: Statistical Conclusions (ASQ/AIAG verdict)
    - Part 3: "Down to Earth" (plain language, operator identification, pass/fail)

    Args:
        results: MSA results dict
        bias_info: Optional dict with specification, grand_mean, bias, bias_percent

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

    # Study info (with defaults for backwards compatibility)
    study_info = results.get('study_info', {})
    n_operators = study_info.get('n_operators', 0)
    n_parts = study_info.get('n_parts', 0)
    n_trials = study_info.get('n_trials', 0)

    # ANOVA table (optional)
    anova_table = results.get('anova_table', [])

    # Variance contributions (optional)
    variance_contributions = results.get('variance_contributions', [])

    # Operator stats
    operator_stats = results.get('operator_stats', [])

    dominant = determine_dominant_variation(ev, av, pv)

    # ndc interpretation
    if ndc >= 5:
        ndc_status = '✅ Adecuado'
    elif ndc >= 2:
        ndc_status = '⚠️ Limitado'
    else:
        ndc_status = '❌ Insuficiente'

    # Build ANOVA table markdown
    # Helper to derive conclusion from p-value
    def get_conclusion(p_val: float | None) -> str:
        if p_val is None:
            return "-"
        return "Significativo" if p_val < 0.05 else "No significativo"

    anova_markdown = """| Fuente | DF | SS | MS | F-Value | P-Value | Conclusión |
|--------|----|----|----|----|---------|------------|
"""
    for row in anova_table:
        f_val = f"{row['f_value']:.2f}" if row['f_value'] is not None else "-"
        p_val = f"{row['p_value']:.4f}" if row['p_value'] is not None else "-"
        ms_val = f"{row['ms']:.6f}" if row['ms'] is not None else "-"
        conclusion = get_conclusion(row['p_value'])
        anova_markdown += f"| {row['source']} | {row['df']} | {row['ss']:.4f} | {ms_val} | {f_val} | {p_val} | {conclusion} |\n"

    # Build variance contributions table
    vc_markdown = """| Fuente | Varianza | %Contrib | %VarEstudio | DesvEst |
|--------|----------|----------|-------------|---------|
"""
    for vc in variance_contributions:
        vc_markdown += f"| {vc['source']} | {vc['variance']:.6f} | {vc['pct_contribution']:.1f}% | {vc['pct_study_variation']:.1f}% | {vc['std_dev']:.6f} |\n"

    # Build operator statistics table (without ranking - all operators contribute differently)
    op_stats_markdown = """| Operador | Media | DesvEst | Rango Prom |
|----------|-------|---------|------------|
"""
    for op in operator_stats:
        op_stats_markdown += f"| {op['operator']} | {op['mean']:.4f} | {op['std_dev']:.4f} | {op['range_avg']:.4f} |\n"

    # Generate recommendations and root cause based on dominant variation
    if dominant == 'repeatability':
        dominant_display = 'REPETIBILIDAD'
        root_cause = "**Instrumento:** El equipo de medición presenta problemas de precisión."
        root_cause_details = [
            "Posible desgaste del instrumento",
            "Problemas de calibración",
            "Resolución insuficiente del equipo",
            "Condiciones ambientales inestables (temperatura, humedad)",
        ]
        recommendations = [
            "Verificar y recalibrar el equipo de medición",
            "Revisar el estado físico y mantenimiento del instrumento",
            "Evaluar si el equipo tiene la resolución necesaria",
            "Estandarizar las condiciones ambientales de medición",
        ]
    elif dominant == 'reproducibility':
        dominant_display = 'REPRODUCIBILIDAD'

        # Check if interaction is significant (more than 50% of reproducibility)
        var_operator = results.get('variance_operator', 0)
        var_interaction = results.get('variance_interaction', 0)

        if var_interaction > var_operator:
            root_cause = "**Método/Sistema:** Interacción significativa Operador×Parte."
            root_cause_details = [
                "Los operadores miden diferente según la pieza",
                "Falta de estandarización del método según tipo de pieza",
                "Posibles puntos de medición inconsistentes",
            ]
            recommendations = [
                "Definir puntos de medición estándar para cada tipo de pieza",
                "Crear instrucciones visuales específicas por tipo de pieza",
                "Implementar dispositivos de sujeción (fixtures)",
                "Entrenar a todos los operadores con el mismo método",
            ]
        else:
            # Check if it's a calibration issue by analyzing bias per operator
            is_calibration_issue = False
            accurate_operator = None
            inaccurate_operators = []

            if bias_info and operator_stats:
                spec_val = bias_info['specification']
                # Calculate bias for each operator
                operator_biases = []
                for op in operator_stats:
                    op_bias = abs(op['mean'] - spec_val)
                    op_bias_pct = abs((op['mean'] - spec_val) / spec_val * 100) if spec_val != 0 else 0
                    operator_biases.append({
                        'operator': op['operator'],
                        'mean': op['mean'],
                        'bias': op['mean'] - spec_val,
                        'bias_abs': op_bias,
                        'bias_pct': op_bias_pct,
                    })

                # Sort by absolute bias (most accurate first)
                operator_biases.sort(key=lambda x: x['bias_abs'])

                # Check if it's a calibration issue:
                # 1. One operator is accurate (< 0.5% bias OR < 0.5 units)
                # 2. There's significant spread in bias between operators
                if len(operator_biases) >= 2:
                    best_bias_op = operator_biases[0]
                    worst_bias_op = operator_biases[-1]
                    bias_spread = worst_bias_op['bias_abs'] - best_bias_op['bias_abs']
                    bias_spread_pct = worst_bias_op['bias_pct'] - best_bias_op['bias_pct']

                    # Best operator is accurate AND there's significant spread between operators
                    best_is_accurate = best_bias_op['bias_pct'] < 0.5 or best_bias_op['bias_abs'] < 0.5
                    significant_spread = bias_spread > 1.0 or bias_spread_pct > 1.5

                    if best_is_accurate and significant_spread:
                        is_calibration_issue = True
                        accurate_operator = best_bias_op
                        # All operators except the best are considered "inaccurate" for calibration
                        inaccurate_operators = [ob for ob in operator_biases if ob['operator'] != best_bias_op['operator']]

            if is_calibration_issue:
                root_cause = "**Calibración/Puesta a Cero:** Diferencia de criterio por calibración del instrumento."
                root_cause_details = [
                    "No es falta de entrenamiento manual (la repetibilidad no es tan mala)",
                    "Es probable falta de **calibración del cero** o **estándar operativo**",
                    "Se observan diferencias sistemáticas entre operadores que sugieren distintos puntos de referencia",
                ]

                recommendations = [
                    "Verificar que todos los operadores realicen la puesta a cero antes de medir",
                    "Establecer un estándar de calibración/verificación diario",
                    "Documentar el procedimiento de 'zeroing' del instrumento",
                    "Revisar la técnica de medición con todos los operadores",
                ]
            else:
                root_cause = "**Operador:** Diferencias en técnica o criterio entre operadores."
                root_cause_details = [
                    "Falta de entrenamiento uniforme",
                    "Diferencias en técnica de medición",
                    "Criterios de posicionamiento inconsistentes",
                ]
                # Note differences in operator measurements without ranking
                if bias_info and operator_stats:
                    spec_val = bias_info['specification']
                    # Find operator with highest deviation from spec for context
                    high_bias_op = max(operator_stats, key=lambda x: abs(x['mean'] - spec_val))
                    root_cause_details.append(f"Se observan diferencias entre operadores (ej: {high_bias_op['operator']} con promedio {high_bias_op['mean']:.2f} vs especificación {spec_val})")

                recommendations = [
                    "Estandarizar el procedimiento de medición",
                    "Crear instrucciones visuales paso a paso",
                    "Implementar re-certificación periódica de operadores",
                    "Revisar criterios de medición con todos los operadores",
                ]
    else:
        dominant_display = 'PARTE A PARTE'
        root_cause = "**Sistema OK:** La variación principal proviene de las diferencias reales entre piezas."
        root_cause_details = [
            "El sistema de medición está funcionando correctamente",
            "La variación observada refleja diferencias reales del proceso",
        ]
        recommendations = [
            "Mantener el programa de calibración actual",
            "Documentar las buenas prácticas actuales",
            "Considerar usar este sistema como referencia",
        ]

    # Build root cause markdown
    root_cause_markdown = f"{root_cause}\n\n"
    for detail in root_cause_details:
        root_cause_markdown += f"- {detail}\n"

    # PART 3: Down to earth conclusion
    if grr < 10:
        pass_fail = "✅ **PASA** - El sistema de medición es confiable."
        plain_explanation = (
            f"Tu sistema de medición está funcionando bien. Solo el **{grr:.1f}%** de la variación "
            f"que ves viene del sistema de medición - el resto ({100-grr:.0f}%) son diferencias reales en tus piezas."
        )
    elif grr <= 30:
        pass_fail = "⚠️ **CONDICIONAL** - Usar con precaución."
        plain_explanation = (
            f"Tu sistema de medición es marginal. Aproximadamente **{grr:.1f}%** de la variación "
            f"viene del sistema de medición. Esto puede enmascarar pequeñas mejoras o diferencias."
        )
    else:
        pass_fail = "❌ **NO PASA** - El sistema necesita mejoras."
        plain_explanation = (
            f"Tu sistema de medición no es confiable. **{grr:.1f}%** de la variación observada "
            f"viene del sistema de medición. Es difícil tomar decisiones de calidad con estos datos."
        )

    # Operator observation - neutral, with correction priority guidance
    if operator_stats and len(operator_stats) > 1:
        # Calculate spread in operator means and std devs
        means = [op['mean'] for op in operator_stats]
        std_devs = [op['std_dev'] for op in operator_stats]
        mean_spread = max(means) - min(means)
        std_spread = max(std_devs) - min(std_devs)

        if std_spread > 0.01 or mean_spread > 0.5:
            # Find operators with lowest variability (most consistent)
            sorted_by_std = sorted(operator_stats, key=lambda x: x['std_dev'])
            low_var_operators = [op['operator'] for op in sorted_by_std[:2]]  # Top 2 most consistent
            high_var_operators = [op['operator'] for op in sorted_by_std[-2:]]  # Top 2 most variable

            operator_trust = f"""Se observan diferencias entre operadores.

**Priorización para correcciones:**
- **{', '.join(low_var_operators)}** (menor variabilidad): Corregir primero con **calibración** si están lejos de la especificación.
- **{', '.join(high_var_operators)}** (mayor variabilidad): Requieren **reentrenamiento** para mejorar precisión."""
        else:
            operator_trust = "Los operadores muestran comportamiento similar en sus mediciones."
    else:
        operator_trust = ""

    # Build the complete instructions
    # Agent-only header is wrapped in HTML comments for easy stripping by frontend
    instructions = f"""<!-- AGENT_ONLY -->
El análisis MSA ha sido completado. Presenta los siguientes resultados al usuario.
Usa los datos a continuación para responder preguntas de seguimiento.
<!-- /AGENT_ONLY -->

# PARTE 1: ANÁLISIS TÉCNICO MSA

## Diseño del Estudio

| Parámetro | Valor |
|-----------|-------|
| Operadores (n) | {n_operators} |
| Piezas (k) | {n_parts} |
| Repeticiones (r) | {n_trials} |
| Total mediciones | {n_operators * n_parts * n_trials} |
"""

    # Add specification to study design if available
    if bias_info:
        spec = bias_info['specification']
        instructions += f"| Especificación (Target) | **{spec}** |\n"

    instructions += f"""
## Tabla ANOVA

{anova_markdown}

*DF: Grados de Libertad | SS: Suma de Cuadrados | MS: Cuadrados Medios*

**Interpretación de P-values:**
- P-value < 0.05: El efecto es estadísticamente significativo
- P-value ≥ 0.05: El efecto no es significativo

## Componentes de Varianza

{vc_markdown}

**Nota:** %VarEstudio se calcula usando 6 desviaciones estándar (método AIAG).

## Estadísticas por Operador

{op_stats_markdown}

## Estudios de Atributos del Sistema

### Estabilidad
"""

    # Add stability analysis
    if bias_info and bias_info.get('rep_means'):
        rep_means_list = bias_info['rep_means']
        if len(rep_means_list) > 1:
            drift = max(rep_means_list) - min(rep_means_list)
            grand_mean = bias_info.get('grand_mean', sum(rep_means_list) / len(rep_means_list))
            # Calculate drift as percentage of mean for relative assessment
            drift_pct = (drift / abs(grand_mean) * 100) if grand_mean != 0 else 0
            # Use relative threshold: <1% drift is stable, 1-3% is moderate, >3% is significant
            stability_status = "✅ Estable" if drift_pct < 1 else ("⚠️ Deriva moderada" if drift_pct < 3 else "❌ Deriva significativa")
            stability_conclusion = "No se observa deriva significativa en el tiempo." if drift_pct < 1 else (
                "Se observa una deriva moderada entre repeticiones." if drift_pct < 3 else
                "Se detecta deriva significativa que puede indicar inestabilidad del instrumento."
            )

            # Format rep means for display
            rep_means_str = ", ".join([f"{m:.1f}" for m in rep_means_list])
            instructions += f"""
Las medias por repetición ({rep_means_str}) {"no muestran" if drift_pct < 1 else "muestran"} deriva significativa en el tiempo.

| Repetición | Media |
|------------|-------|
"""
            for i, mean in enumerate(rep_means_list, 1):
                instructions += f"| Rep {i} | {mean:.4f} |\n"
            instructions += f"""
**Deriva:** {drift:.4f} ({drift_pct:.2f}% de la media) | **Estado:** {stability_status}

{stability_conclusion}
"""
        else:
            instructions += """
*Se requieren múltiples repeticiones para evaluar estabilidad.*
"""
    else:
        instructions += """
*Se requiere especificación para análisis completo de estabilidad.*
"""

    instructions += """
### Linealidad y Sesgo (Bias)
"""

    if bias_info and operator_stats:
        spec_val = bias_info['specification']

        # Calculate bias per operator
        instructions += f"""
Sesgo por operador respecto a la especificación ({spec_val}):

| Operador | Promedio | Sesgo | Evaluación |
|----------|----------|-------|------------|
"""
        operator_biases = []
        for op in operator_stats:
            op_bias = op['mean'] - spec_val
            op_bias_pct = (op_bias / spec_val * 100) if spec_val != 0 else 0
            bias_eval = "✅ Exacto" if abs(op_bias_pct) < 1 else ("⚠️ Moderado" if abs(op_bias_pct) < 3 else "❌ Significativo")
            operator_biases.append((op['operator'], op['mean'], op_bias, op_bias_pct, bias_eval))
            instructions += f"| {op['operator']} | {op['mean']:.2f} | {op_bias:+.2f} ({op_bias_pct:+.1f}%) | {bias_eval} |\n"

        # Analyze operator bias consistency
        bias_values = [b[2] for b in operator_biases]
        max_bias_diff = max(bias_values) - min(bias_values)

        # Find operators with min and max bias for reference (not ranking)
        min_bias_op = min(operator_biases, key=lambda x: abs(x[2]))
        max_bias_op = max(operator_biases, key=lambda x: abs(x[2]))

        if max_bias_diff > 1:  # More than 1 unit difference between operators
            instructions += f"""
**⚠️ Diferencias significativas de sesgo entre operadores:** Rango de {max_bias_diff:.2f} unidades.
- Ejemplo: **{min_bias_op[0]}** (sesgo {min_bias_op[2]:+.2f}) vs **{max_bias_op[0]}** (sesgo {max_bias_op[2]:+.2f})
- Esto sugiere diferencias en técnica de medición o criterio que requieren estandarización.
"""
        else:
            instructions += f"""
**Sesgo entre operadores consistente:** Diferencia de {max_bias_diff:.2f} entre operadores.
"""
    elif bias_info:
        bias_val = bias_info['bias']
        bias_pct = bias_info['bias_percent']
        spec_val = bias_info['specification']
        bias_status = "✅ Aceptable" if abs(bias_pct) < 5 else ("⚠️ Moderado" if abs(bias_pct) < 10 else "❌ Significativo")
        bias_direction = "por debajo" if bias_val < 0 else "por encima"
        instructions += f"""
| Parámetro | Valor |
|-----------|-------|
| Especificación | {spec_val} |
| Sesgo global | {bias_val:+.4f} ({bias_direction} del nominal) |
| % Sesgo | {bias_pct:+.2f}% |
| Estado | {bias_status} |
"""
    else:
        instructions += """
*Se requiere especificación (valor nominal) para calcular el sesgo.*
"""

    # Resolution analysis - signal to noise ratio
    # Get variance values for signal-to-noise calculation
    var_part = results.get('variance_part', 0)
    var_grr = results.get('variance_repeatability', 0) + results.get('variance_reproducibility', 0)

    # Calculate signal-to-noise ratio
    if var_grr > 0 and var_part > 0:
        noise_to_signal = var_grr / var_part
        signal_to_noise_text = f"El error del sistema (R&R = {var_grr:.4f}) es **{noise_to_signal:.1f} veces mayor** que la variación real entre piezas (Parte a Parte = {var_part:.4f})."
    elif var_part == 0 or var_part < 0.0001:
        signal_to_noise_text = "La variación entre piezas es prácticamente nula comparada con el error del sistema."
    else:
        signal_to_noise_text = ""

    resolution_status = "✅ Adecuado" if ndc >= 5 else ("⚠️ Limitado" if ndc >= 2 else "❌ Insuficiente")
    instructions += f"""
### Número de Categorías Distintas (ndc) y Resolución

El **ndc (Number of Distinct Categories)** indica cuántos "grupos" o "categorías" diferentes de piezas puede distinguir confiablemente tu sistema de medición. Es una medida directa de la capacidad de discriminación del sistema.

**Fórmula:** ndc = 1.41 × (Variación de Piezas / Variación del Sistema)

**¿Qué significa en la práctica?**
- Un ndc alto significa que el sistema puede detectar diferencias pequeñas entre piezas
- Un ndc bajo significa que el "ruido" del sistema enmascara las diferencias reales

| ndc | **{ndc}** | {resolution_status} |
|-----|-----------|---------------------|

{signal_to_noise_text}

| ndc | Capacidad del Sistema | Uso Recomendado |
|-----|----------------------|-----------------|
| ≥ 5 | ✅ Excelente discriminación | Control de proceso, análisis de capacidad, mejora continua |
| 2-4 | ⚠️ Discriminación limitada | Solo decisiones pasa/no pasa, inspección básica |
| < 2 | ❌ No discrimina | **No usar** - el sistema no distingue entre piezas diferentes |

{"✅ **El sistema tiene resolución adecuada.** Puede detectar diferencias significativas entre piezas y es apto para control de proceso." if ndc >= 5 else "❌ **Resolución inadecuada.** El 'ruido' del sistema de medición opaca la 'señal' de las diferencias reales entre piezas. Considera mejorar el instrumento o el método de medición."}

---

# PARTE 2: CONCLUSIONES ESTADÍSTICAS (ASQ/AIAG)

## Veredicto

{classification_emoji[classification]} **%GRR = {grr:.1f}% → {classification_display[classification].upper()}**

| Criterio | %GRR | Resultado |
|----------|------|-----------|
| < 10% | Aceptable | {"✅ Cumple" if grr < 10 else "❌ No cumple"} |
| 10-30% | Marginal | {"✅ Dentro" if 10 <= grr <= 30 else "❌ Fuera"} |
| > 30% | Inaceptable | {"⚠️ ALERTA" if grr > 30 else "✅ OK"} |

## Fuente Dominante de Variación

**{dominant_display}** es la fuente principal de variación del sistema de medición.

| Componente | %VarEstudio |
|------------|-------------|
| Repetibilidad | {ev:.1f}% |
| Reproducibilidad | {av:.1f}% |
| Parte a Parte | {pv:.1f}% |

---

# PARTE 3: CONCLUSIÓN "TERRENAL"

## ¿Nuestro sistema de medición es de fiar?

{pass_fail}

{plain_explanation}

## Observaciones sobre Operadores

{operator_trust}

## Análisis de Causa Raíz

{root_cause_markdown}

## Recomendaciones de Mejora

"""

    for i, rec in enumerate(recommendations, 1):
        instructions += f"{i}. {rec}\n"

    # Add bias info to down-to-earth section if available
    if bias_info:
        bias = bias_info['bias']
        spec = bias_info['specification']
        if abs(bias) > 0.01:  # Only mention if bias is significant
            bias_direction = "por debajo" if bias < 0 else "por encima"
            instructions += f"""
## Sesgo del Sistema

El sistema mide consistentemente **{abs(bias):.4f} unidades {bias_direction}** del valor nominal ({spec}). Esto puede requerir ajuste o recalibración del instrumento.
"""

    return instructions, dominant


# =============================================================================
# Main Analysis Function
# =============================================================================

def analyze_msa(
    df: pd.DataFrame,
    validated_columns: dict[str, Any] | None = None,
    specification: float | None = None
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
        specification: Optional target/nominal value for bias calculation

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

        # Calculate operator statistics and ranking
        long_df = variance_components['long_df']
        operator_stats = calculate_operator_stats(
            long_df,
            variance_components['study_info']['n_parts']
        )

        # Calculate bias if specification is provided
        bias_info = None
        if specification is not None:
            grand_mean = long_df['measurement'].mean()
            bias = grand_mean - specification
            bias_percent = (bias / specification) * 100 if specification != 0 else 0

            # Calculate stability metrics (mean per repetition)
            n_trials = variance_components['study_info']['n_trials']
            rep_means = []
            for i, m_col in enumerate(measurement_cols):
                rep_data = []
                for idx, row in df.iterrows():
                    value = row[m_col]
                    if isinstance(value, str):
                        value = float(value.replace(',', '.').strip())
                    else:
                        value = float(value)
                    rep_data.append(value)
                rep_means.append(np.mean(rep_data))

            bias_info = {
                'specification': specification,
                'grand_mean': round(grand_mean, 4),
                'bias': round(bias, 4),
                'bias_percent': round(bias_percent, 2),
                'rep_means': [round(m, 4) for m in rep_means],
            }

        # Format results
        results = format_msa_results(variance_components, grr_metrics, operator_stats)

        # Add bias info to results if available
        if bias_info:
            results['bias_info'] = bias_info

        # Format chart data (JSON structure for chart generation)
        chart_data_json = format_chart_data(
            results, df, operator_col, part_col, measurement_cols, long_df
        )

        # Return chart data as JSON for frontend rendering
        chart_data = chart_data_json

        # Generate instructions and get dominant variation
        instructions, dominant_variation = generate_instructions(results, bias_info)

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
