"""
Hipótesis 2 Muestras Statistics Calculator Module

Calculates descriptive statistics, sample size evaluation, normality analysis,
robustness assessment, Box-Cox transformation, and output assembly for 2-Sample
Hypothesis Testing.

All calculations use pure Python/NumPy (no scipy) to meet Vercel 250MB limit.
Reuses anderson_darling_normal() and box_cox_transform() from normality_tests.py.
"""
import math
import numpy as np
from typing import Any

from .normality_tests import anderson_darling_normal, box_cox_transform
from .msa_calculator import _betainc, f_distribution_sf


# =============================================================================
# t-Distribution Functions (Pure Python, no scipy)
# =============================================================================

def t_distribution_sf(t_stat: float, df: float) -> float | None:
    """Survival function P(T > t) for Student's t-distribution.

    Uses the relation: for t > 0,
        P(T > t | df) = 0.5 * I_x(df/2, 1/2)
    where x = df / (df + t^2) and I_x is the regularized incomplete beta function.
    """
    if df <= 0:
        return None
    if t_stat == 0:
        return 0.5
    x = df / (df + t_stat ** 2)
    p = 0.5 * _betainc(df / 2.0, 0.5, x)
    if t_stat > 0:
        return p
    else:
        return 1.0 - p


def _t_critical(alpha_tail: float, df: float, tol: float = 1e-10, max_iter: int = 200) -> float:
    """Find t > 0 such that P(T > t) = alpha_tail.

    For two-sided CI at confidence (1-alpha): alpha_tail = alpha/2
    For one-sided CI at confidence (1-alpha): alpha_tail = alpha
    """
    lo, hi = 0.0, 1000.0
    for _ in range(max_iter):
        mid = (lo + hi) / 2.0
        if t_distribution_sf(mid, df) > alpha_tail:
            lo = mid
        else:
            hi = mid
        if (hi - lo) < tol:
            break
    return (lo + hi) / 2.0


# =============================================================================
# Levene's Test for Equality of Variances (Median Variant)
# =============================================================================

def perform_levene_test(sample_a: np.ndarray, sample_b: np.ndarray, alpha: float = 0.05) -> dict:
    """Levene's test for equality of variances (median variant, Minitab-compatible).

    Steps:
    1. Compute absolute deviations from group median: z_ij = |x_ij - median_i|
    2. One-way ANOVA F-test on deviations:
       F = [SSbetween / (k-1)] / [SSwithin / (N-k)]
       where k=2 groups, N = total observations
    3. p-value from F(1, N-2) distribution
    """
    z_a = np.abs(sample_a - np.median(sample_a))
    z_b = np.abs(sample_b - np.median(sample_b))

    n_a, n_b = len(z_a), len(z_b)
    N = n_a + n_b

    z_bar_a = np.mean(z_a)
    z_bar_b = np.mean(z_b)
    z_bar = (np.sum(z_a) + np.sum(z_b)) / N

    ss_between = n_a * (z_bar_a - z_bar)**2 + n_b * (z_bar_b - z_bar)**2
    ss_within = np.sum((z_a - z_bar_a)**2) + np.sum((z_b - z_bar_b)**2)

    if ss_within == 0:
        f_stat = 0.0
        p_value = 1.0
    else:
        f_stat = (ss_between / 1.0) / (ss_within / (N - 2))
        p_value = f_distribution_sf(f_stat, 1, N - 2)

    equal_variances = bool(p_value >= alpha)
    conclusion = "Varianzas estadísticamente iguales" if equal_variances else "Varianzas estadísticamente diferentes"

    return {
        'method': 'Levene (mediana)',
        'f_statistic': round(float(f_stat), 6),
        'p_value': round(float(p_value), 6),
        'df1': 1,
        'df2': N - 2,
        'alpha': alpha,
        'equal_variances': equal_variances,
        'conclusion': conclusion,
    }


# =============================================================================
# 2-Sample T-Test (Pooled and Welch)
# =============================================================================

def perform_t_test(
    sample_a: np.ndarray,
    sample_b: np.ndarray,
    equal_variances: bool,
    confidence_level: float = 0.95,
    alternative_hypothesis: str = 'two-sided',
) -> dict:
    """2-sample t-test for equality of means.

    Automatically selects pooled or Welch t-test based on equal_variances flag.
    """
    n1 = len(sample_a)
    n2 = len(sample_b)
    mean1 = float(np.mean(sample_a))
    mean2 = float(np.mean(sample_b))
    s1 = float(np.std(sample_a, ddof=1))
    s2 = float(np.std(sample_b, ddof=1))
    diff = mean1 - mean2
    alpha = 1.0 - confidence_level

    if equal_variances:
        # Pooled t-test
        sp2 = ((n1 - 1) * s1**2 + (n2 - 1) * s2**2) / (n1 + n2 - 2)
        se = float(np.sqrt(sp2 * (1.0 / n1 + 1.0 / n2)))
        df = float(n1 + n2 - 2)
        method = 't-test (varianzas agrupadas)'
    else:
        # Welch t-test
        v1 = s1**2 / n1
        v2 = s2**2 / n2
        se = float(np.sqrt(v1 + v2))
        denom = v1**2 / (n1 - 1) + v2**2 / (n2 - 1)
        if denom == 0:
            df = float(n1 + n2 - 2)  # Fallback to pooled df when both variances are zero
        else:
            df = (v1 + v2)**2 / denom
        method = 't-test de Welch'

    # Guard against zero SE
    if se == 0:
        t_stat = 0.0
    else:
        t_stat = diff / se

    # P-value computation
    if alternative_hypothesis == 'two-sided':
        p_value = 2.0 * t_distribution_sf(abs(t_stat), df)
    elif alternative_hypothesis == 'greater':
        p_value = t_distribution_sf(t_stat, df)
    else:  # 'less'
        p_value = 1.0 - t_distribution_sf(t_stat, df)

    # Confidence interval for difference of means
    if alternative_hypothesis == 'two-sided':
        t_crit = _t_critical(alpha / 2.0, df)
        ci_lower = diff - t_crit * se
        ci_upper = diff + t_crit * se
    elif alternative_hypothesis == 'greater':
        t_crit = _t_critical(alpha, df)
        ci_lower = diff - t_crit * se
        ci_upper = None
    else:  # 'less'
        t_crit = _t_critical(alpha, df)
        ci_lower = None
        ci_upper = diff + t_crit * se

    # Conclusion in Spanish
    if p_value < alpha:
        conclusion = "Medias estadísticamente diferentes"
    else:
        conclusion = "Medias estadísticamente iguales"

    return {
        'method': method,
        't_statistic': round(t_stat, 6),
        'degrees_of_freedom': round(df, 4) if not equal_variances else int(df),
        'p_value': round(p_value, 6),
        'ci_lower': round(ci_lower, 6) if ci_lower is not None else None,
        'ci_upper': round(ci_upper, 6) if ci_upper is not None else None,
        'difference': round(diff, 6),
        'alpha': alpha,
        'confidence_level': confidence_level,
        'alternative_hypothesis': alternative_hypothesis,
        'equal_variances': equal_variances,
        'conclusion': conclusion,
    }


# =============================================================================
# Hypothesis Tests Orchestrator
# =============================================================================

def perform_hypothesis_tests(
    calc_results: dict,
    confidence_level: float = 0.95,
    alternative_hypothesis: str = 'two-sided',
) -> dict:
    """Pipeline: extract data_for_tests -> Levene -> t-test (pooled or Welch).

    Extends calc_results with variance_test and means_test sections.
    """
    alpha = 1.0 - confidence_level
    sample_a = calc_results['data_for_tests']['sample_a']
    sample_b = calc_results['data_for_tests']['sample_b']

    # Levene's test for variance equality
    variance_test = perform_levene_test(sample_a, sample_b, alpha=alpha)

    # T-test: pooled or Welch based on Levene result
    means_test = perform_t_test(
        sample_a, sample_b,
        equal_variances=variance_test['equal_variances'],
        confidence_level=confidence_level,
        alternative_hypothesis=alternative_hypothesis,
    )

    # Extend results (don't replace)
    result = dict(calc_results)
    result['variance_test'] = variance_test
    result['means_test'] = means_test
    return result


# =============================================================================
# Histogram Binning (Story 10.4, Task 1)
# =============================================================================

def _build_histogram_bins(sample: np.ndarray, sample_name: str, outliers_info: dict) -> dict:
    """Build histogram bin data for a single sample using Sturges' formula.

    Args:
        sample: NumPy array of numeric values
        sample_name: Display name for the sample
        outliers_info: Outlier detection results from detect_outliers_iqr()

    Returns:
        dict matching PRD Hipotesis2MChartData histogram structure
    """
    n = len(sample)
    k = max(1, math.ceil(1 + math.log2(n))) if n > 1 else 1

    counts, edges = np.histogram(sample, bins=k)

    bins = []
    for i in range(len(counts)):
        bins.append({
            'start': round(float(edges[i]), 4),
            'end': round(float(edges[i + 1]), 4),
            'count': int(counts[i]),
        })

    return {
        'type': 'histogram',
        'data': {
            'bins': bins,
            'mean': round(float(np.mean(sample)), 4),
            'sampleName': sample_name,
            'outliers': [round(float(v), 4) for v in outliers_info.get('outlier_values', [])],
        },
    }


# =============================================================================
# Boxplot Statistics (Story 10.4, Task 2)
# =============================================================================

def _build_boxplot_stats(sample: np.ndarray, sample_name: str, outliers_info: dict) -> dict:
    """Build boxplot statistics for a single sample.

    Whiskers: min/max of non-outlier values (standard boxplot convention).

    Args:
        sample: NumPy array of numeric values
        sample_name: Display name for the sample
        outliers_info: Outlier detection results from detect_outliers_iqr()

    Returns:
        dict with boxplot statistics
    """
    outlier_values = outliers_info.get('outlier_values', [])
    lower_fence = outliers_info.get('lower_fence', float('-inf'))
    upper_fence = outliers_info.get('upper_fence', float('inf'))

    if outlier_values:
        non_outlier = sample[(sample >= lower_fence) & (sample <= upper_fence)]
        if len(non_outlier) == 0:
            non_outlier = sample
    else:
        non_outlier = sample

    return {
        'name': sample_name,
        'min': round(float(np.min(non_outlier)), 4),
        'q1': round(float(np.percentile(sample, 25)), 4),
        'median': round(float(np.median(sample)), 4),
        'q3': round(float(np.percentile(sample, 75)), 4),
        'max': round(float(np.max(non_outlier)), 4),
        'outliers': [round(float(v), 4) for v in outlier_values],
        'mean': round(float(np.mean(sample)), 4),
    }


# =============================================================================
# Individual Sample CI (Story 10.4, Task 3)
# =============================================================================

def _calculate_sample_ci(sample: np.ndarray, confidence_level: float) -> tuple[float, float]:
    """Calculate confidence interval for a single sample mean.

    Formula: mean ± t_critical(α/2, n-1) × (std_dev / sqrt(n))

    Args:
        sample: NumPy array of numeric values
        confidence_level: Confidence level (e.g., 0.95)

    Returns:
        (ci_lower, ci_upper) tuple
    """
    n = len(sample)
    mean = float(np.mean(sample))
    std_dev = float(np.std(sample, ddof=1)) if n > 1 else 0.0
    alpha = 1.0 - confidence_level
    df = max(n - 1, 1)

    t_crit = _t_critical(alpha / 2.0, float(df))
    se = std_dev / math.sqrt(n) if n > 0 else 0.0
    margin = t_crit * se

    return (round(mean - margin, 4), round(mean + margin, 4))


# =============================================================================
# Chart Data Builder (Story 10.4, Task 4)
# =============================================================================

def _build_chart_data(full_results: dict, confidence_level: float) -> list[dict]:
    """Build chart data array with 4 charts for 2-sample hypothesis testing.

    Charts: histogram_a, histogram_b, boxplot_variance, boxplot_means

    Args:
        full_results: Complete results from perform_hypothesis_tests()
        confidence_level: Confidence level for CI calculations

    Returns:
        List of 4 chart data dictionaries
    """
    sample_a = full_results['data_for_tests']['sample_a']
    sample_b = full_results['data_for_tests']['sample_b']
    desc_a = full_results['descriptive_a']
    desc_b = full_results['descriptive_b']
    outliers_a = desc_a['outliers']
    outliers_b = desc_b['outliers']
    name_a = desc_a['sample_name']
    name_b = desc_b['sample_name']

    # Histogram A
    hist_a = _build_histogram_bins(sample_a, name_a, outliers_a)
    hist_a['type'] = 'histogram_a'

    # Histogram B
    hist_b = _build_histogram_bins(sample_b, name_b, outliers_b)
    hist_b['type'] = 'histogram_b'

    # Boxplot stats for both samples
    bp_a = _build_boxplot_stats(sample_a, name_a, outliers_a)
    bp_b = _build_boxplot_stats(sample_b, name_b, outliers_b)

    # Boxplot Variance
    variance_test = full_results['variance_test']
    boxplot_variance = {
        'type': 'boxplot_variance',
        'data': {
            'samples': [bp_a, bp_b],
            'leveneTestPValue': round(float(variance_test['p_value']), 4),
            'leveneConclusion': str(variance_test['conclusion']),
        },
    }

    # Boxplot Means (with per-sample CI)
    means_test = full_results['means_test']
    ci_a = _calculate_sample_ci(sample_a, confidence_level)
    ci_b = _calculate_sample_ci(sample_b, confidence_level)

    bp_a_means = dict(bp_a)
    bp_a_means['ciLower'] = ci_a[0]
    bp_a_means['ciUpper'] = ci_a[1]

    bp_b_means = dict(bp_b)
    bp_b_means['ciLower'] = ci_b[0]
    bp_b_means['ciUpper'] = ci_b[1]

    boxplot_means = {
        'type': 'boxplot_means',
        'data': {
            'samples': [bp_a_means, bp_b_means],
            'tTestPValue': round(float(means_test['p_value']), 4),
            'tTestConclusion': str(means_test['conclusion']),
        },
    }

    return [hist_a, hist_b, boxplot_variance, boxplot_means]


# =============================================================================
# Instructions Generator (Story 10.4, Task 5)
# =============================================================================

def _generate_instructions(full_results: dict) -> str:
    """Generate markdown instructions with 5 parts, all in Spanish.

    Parts: Descriptivos, Normalidad, Varianzas, Medias, Conclusión Terrenal

    Args:
        full_results: Complete results from perform_hypothesis_tests()

    Returns:
        Markdown string with AGENT_ONLY header and 5 parts
    """
    desc_a = full_results['descriptive_a']
    desc_b = full_results['descriptive_b']
    norm_a = full_results['normality_a']
    norm_b = full_results['normality_b']
    box_cox = full_results['box_cox']
    sample_size = full_results['sample_size']
    variance_test = full_results['variance_test']
    means_test = full_results['means_test']
    name_a = desc_a['sample_name']
    name_b = desc_b['sample_name']

    parts = []

    # AGENT_ONLY header
    parts.append(
        '<!-- AGENT_ONLY -->\n'
        'El análisis de hipótesis de 2 muestras ha sido completado. '
        'Presenta los siguientes resultados al usuario.\n'
        'Usa los datos a continuación para responder preguntas de seguimiento.\n'
        '<!-- /AGENT_ONLY -->'
    )

    # PART 1: Descriptive Statistics
    outlier_a_str = str(desc_a['outliers']['outlier_count'])
    outlier_b_str = str(desc_b['outliers']['outlier_count'])
    if desc_a['outliers']['outlier_count'] > 0:
        outlier_a_str += f" ({', '.join(str(v) for v in desc_a['outliers']['outlier_values'])})"
    if desc_b['outliers']['outlier_count'] > 0:
        outlier_b_str += f" ({', '.join(str(v) for v in desc_b['outliers']['outlier_values'])})"

    part1 = (
        f'# PARTE 1: ESTADÍSTICOS DESCRIPTIVOS\n\n'
        f'| Estadístico | {name_a} | {name_b} |\n'
        f'|---|---|---|\n'
        f'| n | {desc_a["n"]} | {desc_b["n"]} |\n'
        f'| Media | {desc_a["mean"]} | {desc_b["mean"]} |\n'
        f'| Mediana | {desc_a["median"]} | {desc_b["median"]} |\n'
        f'| Desv. Estándar | {desc_a["std_dev"]} | {desc_b["std_dev"]} |\n'
        f'| Asimetría | {desc_a["skewness"]} | {desc_b["skewness"]} |\n'
        f'| Outliers | {outlier_a_str} | {outlier_b_str} |'
    )

    # Sample size notes
    sample_notes = []
    if sample_size['a']['small_sample_warning']:
        sample_notes.append(f'⚠️ {name_a}: {sample_size["a"]["note"]}')
    if sample_size['b']['small_sample_warning']:
        sample_notes.append(f'⚠️ {name_b}: {sample_size["b"]["note"]}')
    if sample_notes:
        part1 += '\n\n' + '\n'.join(sample_notes)

    parts.append(part1)

    # PART 2: Normality
    def _normality_section(name: str, norm: dict) -> str:
        result_str = 'Normal' if norm['is_normal'] else 'No Normal'
        section = (
            f'## {name}\n'
            f'- Test: Anderson-Darling\n'
            f'- Estadístico A²: {norm["ad_statistic"]}\n'
            f'- p-value: {norm["p_value"]}\n'
            f'- Resultado: {result_str}'
        )
        if not norm['is_normal'] and norm.get('robustness_details'):
            section += f'\n- Robustez: {norm["robustness_details"]}'
        return section

    part2 = '# PARTE 2: NORMALIDAD\n\n'
    part2 += _normality_section(name_a, norm_a) + '\n\n'
    part2 += _normality_section(name_b, norm_b)

    if box_cox['applied']:
        part2 += '\n\n## Transformación Box-Cox\n'
        part2 += f'- Lambda {name_a}: {box_cox["lambda_a"]}\n'
        part2 += f'- Lambda {name_b}: {box_cox["lambda_b"]}\n'
        if box_cox['normality_improved']:
            part2 += '- Resultado: Normalidad alcanzada con datos transformados\n'
            part2 += '- Los análisis posteriores usan datos transformados'
        else:
            part2 += '- Resultado: La transformación no logró normalidad\n'
            part2 += '- Los análisis usan datos originales'

    parts.append(part2)

    # PART 3: Variance Test
    part3 = (
        '# PARTE 3: TEST DE VARIANZAS\n\n'
        f'- **Método:** {variance_test["method"]}\n'
        f'- **H₀:** σ²A = σ²B (varianzas iguales)\n'
        f'- **H₁:** σ²A ≠ σ²B (varianzas diferentes)\n'
        f'- **Estadístico F:** {variance_test["f_statistic"]}\n'
        f'- **p-value:** {variance_test["p_value"]}\n'
        f'- **α:** {variance_test["alpha"]}\n'
        f'- **Conclusión:** {variance_test["conclusion"]}'
    )
    parts.append(part3)

    # PART 4: Means Test
    alt = means_test['alternative_hypothesis']
    if alt == 'two-sided':
        h1_str = 'μA ≠ μB (medias diferentes)'
    elif alt == 'greater':
        h1_str = 'μA > μB'
    else:
        h1_str = 'μA < μB'

    if means_test['equal_variances']:
        method_reason = 'porque el test de Levene no rechazó igualdad de varianzas'
    else:
        method_reason = 'porque el test de Levene rechazó igualdad de varianzas'

    ci_str = ''
    conf_pct = int(means_test['confidence_level'] * 100)
    if means_test['ci_lower'] is not None and means_test['ci_upper'] is not None:
        ci_str = f'- **IC {conf_pct}% para la diferencia:** ({means_test["ci_lower"]}, {means_test["ci_upper"]})\n'
    elif means_test['ci_lower'] is not None:
        ci_str = f'- **IC {conf_pct}% para la diferencia:** ({means_test["ci_lower"]}, +∞)\n'
    elif means_test['ci_upper'] is not None:
        ci_str = f'- **IC {conf_pct}% para la diferencia:** (-∞, {means_test["ci_upper"]})\n'

    part4 = (
        '# PARTE 4: TEST DE MEDIAS\n\n'
        f'- **Método:** {means_test["method"]} ({method_reason})\n'
        f'- **H₀:** μA - μB = 0\n'
        f'- **H₁:** {h1_str}\n'
        f'- **Estadístico t:** {means_test["t_statistic"]}\n'
        f'- **Grados de libertad:** {means_test["degrees_of_freedom"]}\n'
        f'- **p-value:** {means_test["p_value"]}\n'
        f'{ci_str}'
        f'- **α:** {means_test["alpha"]}\n'
        f'- **Conclusión:** {means_test["conclusion"]}'
    )
    parts.append(part4)

    # PART 5: Conclusión Terrenal
    terrenal_lines = []

    # Variance interpretation
    if variance_test['equal_variances']:
        terrenal_lines.append('Las dos muestras tienen una variabilidad similar entre sí.')
    else:
        std_a = desc_a['std_dev']
        std_b = desc_b['std_dev']
        higher = name_a if std_a > std_b else name_b
        terrenal_lines.append(
            f'Las dos muestras tienen una variabilidad diferente. '
            f'{higher} tiene mayor dispersión.'
        )

    # Means interpretation
    mean_a_val = desc_a['mean']
    mean_b_val = desc_b['mean']
    alpha = means_test['alpha']
    p_val = means_test['p_value']

    if alt == 'two-sided':
        if p_val >= alpha:
            terrenal_lines.append(
                f'No hay evidencia estadística de que las medias sean diferentes. '
                f'Los promedios de {mean_a_val} y {mean_b_val} son estadísticamente equivalentes.'
            )
        else:
            terrenal_lines.append(
                f'Las medias son estadísticamente diferentes. '
                f'{name_a} produce en promedio {mean_a_val} y {name_b} {mean_b_val}. '
                f'Esta diferencia NO se debe al azar.'
            )
    elif alt == 'greater':
        if p_val < alpha:
            terrenal_lines.append(
                f'{name_a} tiene una media significativamente mayor que {name_b}.'
            )
        else:
            terrenal_lines.append(
                f'No hay evidencia de que {name_a} tenga una media mayor que {name_b}.'
            )
    else:  # less
        if p_val < alpha:
            terrenal_lines.append(
                f'{name_a} tiene una media significativamente menor que {name_b}.'
            )
        else:
            terrenal_lines.append(
                f'No hay evidencia de que {name_a} tenga una media menor que {name_b}.'
            )

    # Caveats
    caveats = []
    if sample_size['a']['small_sample_warning'] or sample_size['b']['small_sample_warning']:
        caveats.append(
            '⚠️ Nota: Al menos una muestra tiene menos de 30 observaciones. '
            'Los resultados deben interpretarse con precaución.'
        )

    if not norm_a['is_normal'] and norm_a.get('is_robust') is False:
        if not box_cox['applied'] or not box_cox.get('normality_improved'):
            caveats.append(
                f'⚠️ Nota: {name_a} no sigue una distribución normal y no es robusta. '
                'Los resultados deben interpretarse con precaución.'
            )
    if not norm_b['is_normal'] and norm_b.get('is_robust') is False:
        if not box_cox['applied'] or not box_cox.get('normality_improved'):
            caveats.append(
                f'⚠️ Nota: {name_b} no sigue una distribución normal y no es robusta. '
                'Los resultados deben interpretarse con precaución.'
            )

    if box_cox['applied'] and not box_cox.get('normality_improved'):
        caveats.append(
            '⚠️ Nota: La transformación Box-Cox no logró normalidad. '
            'Los resultados se basan en datos originales y deben interpretarse con precaución.'
        )

    part5 = '# PARTE 5: CONCLUSIÓN TERRENAL\n\n'
    part5 += '\n\n'.join(terrenal_lines)
    if caveats:
        part5 += '\n\n' + '\n\n'.join(caveats)

    parts.append(part5)

    return '\n\n'.join(parts)


# =============================================================================
# Output Builder (Story 10.4, Task 6)
# =============================================================================

def build_hipotesis_2_muestras_output(
    full_results: dict,
    all_warnings: list[str],
    confidence_level: float,
) -> dict:
    """Build complete output structure: results + chartData + instructions.

    Args:
        full_results: Complete results from perform_hypothesis_tests()
        all_warnings: Merged validation + analysis warnings
        confidence_level: Confidence level for CI calculations

    Returns:
        dict: { 'results': dict, 'chartData': list, 'instructions': str }
    """
    # Build results dict (strip numpy arrays and non-serializable data)
    results = {
        'descriptive_a': full_results['descriptive_a'],
        'descriptive_b': full_results['descriptive_b'],
        'sample_size': full_results['sample_size'],
        'normality_a': full_results['normality_a'],
        'normality_b': full_results['normality_b'],
        'box_cox': {
            k: v for k, v in full_results['box_cox'].items()
            if k not in ('transformed_a', 'transformed_b')
        },
        'variance_test': full_results['variance_test'],
        'means_test': full_results['means_test'],
        'warnings': all_warnings,
    }

    # Build chart data
    chart_data = _build_chart_data(full_results, confidence_level)

    # Generate instructions
    instructions = _generate_instructions(full_results)

    return {
        'results': results,
        'chartData': chart_data,
        'instructions': instructions,
    }


# =============================================================================
# Skewness Calculation (Adjusted Fisher-Pearson, Minitab-compatible)
# =============================================================================

def _calculate_skewness(values: np.ndarray) -> float:
    """
    Calculate adjusted Fisher-Pearson skewness coefficient.

    Compatible with Minitab, Excel, SAS, and SPSS.

    Args:
        values: NumPy array of numeric values

    Returns:
        Skewness coefficient (float)
    """
    n = len(values)
    if n < 3:
        return 0.0
    mean = np.mean(values)
    std = np.std(values, ddof=1)
    if std == 0:
        return 0.0
    z = (values - mean) / std
    g1 = np.mean(z ** 3)  # biased skewness
    G1 = g1 * np.sqrt(n * (n - 1)) / (n - 2)  # adjusted (unbiased)
    return float(G1)


# =============================================================================
# IQR Outlier Detection
# =============================================================================

def detect_outliers_iqr(values: np.ndarray) -> dict[str, Any]:
    """
    Detect outliers using the IQR (Interquartile Range) method.

    Outlier if: value < Q1 - 1.5*IQR OR value > Q3 + 1.5*IQR

    Args:
        values: NumPy array of numeric values

    Returns:
        dict: {
            'q1': float, 'q3': float, 'iqr': float,
            'lower_fence': float, 'upper_fence': float,
            'outlier_count': int, 'outlier_values': list[float],
            'outlier_percentage': float
        }
    """
    if len(values) == 0:
        return {
            'q1': 0.0, 'q3': 0.0, 'iqr': 0.0,
            'lower_fence': 0.0, 'upper_fence': 0.0,
            'outlier_count': 0, 'outlier_values': [],
            'outlier_percentage': 0.0,
        }

    q1 = float(np.percentile(values, 25, method='linear'))
    q3 = float(np.percentile(values, 75, method='linear'))
    iqr = q3 - q1
    lower_fence = q1 - 1.5 * iqr
    upper_fence = q3 + 1.5 * iqr

    outlier_mask = (values < lower_fence) | (values > upper_fence)
    outlier_values = values[outlier_mask].tolist()
    outlier_count = len(outlier_values)
    n = len(values)
    outlier_percentage = (outlier_count / n * 100) if n > 0 else 0.0

    return {
        'q1': round(q1, 6),
        'q3': round(q3, 6),
        'iqr': round(iqr, 6),
        'lower_fence': round(lower_fence, 6),
        'upper_fence': round(upper_fence, 6),
        'outlier_count': outlier_count,
        'outlier_values': [round(v, 6) for v in outlier_values],
        'outlier_percentage': round(outlier_percentage, 2),
    }


# =============================================================================
# Descriptive Statistics Per Sample
# =============================================================================

def calculate_descriptive_statistics(sample: np.ndarray, sample_name: str) -> dict[str, Any]:
    """
    Calculate descriptive statistics for a single sample.

    Args:
        sample: NumPy array of numeric values
        sample_name: Name of the sample (e.g., "Muestra A")

    Returns:
        dict: {
            'sample_name': str,
            'n': int, 'mean': float, 'median': float,
            'std_dev': float, 'skewness': float,
            'outliers': dict (from detect_outliers_iqr)
        }
    """
    n = len(sample)
    mean = float(np.mean(sample))
    median = float(np.median(sample))
    std_dev = float(np.std(sample, ddof=1)) if n > 1 else 0.0
    skewness = _calculate_skewness(sample)
    outliers = detect_outliers_iqr(sample)

    return {
        'sample_name': sample_name,
        'n': n,
        'mean': round(mean, 6),
        'median': round(median, 6),
        'std_dev': round(std_dev, 6),
        'skewness': round(skewness, 6),
        'outliers': outliers,
    }


# =============================================================================
# Sample Size Evaluation
# =============================================================================

def evaluate_sample_size(n: int, sample_name: str) -> dict[str, Any]:
    """
    Evaluate sample size and determine TCL applicability.

    Threshold: n >= 30 for Central Limit Theorem to apply.

    Args:
        n: Sample size
        sample_name: Name of the sample

    Returns:
        dict: {
            'n': int, 'tcl_applies': bool,
            'small_sample_warning': bool, 'note': str
        }
    """
    tcl_applies = n >= 30
    small_sample_warning = n < 30

    if tcl_applies:
        note = (
            f"Con n={n}, el Teorema Central del Límite (TCL) aplica. "
            f"La prueba t es robusta ante desviaciones leves de normalidad."
        )
    else:
        note = (
            f"Con n={n}, la muestra es pequeña. "
            f"La normalidad de los datos es crítica para la validez de la prueba t."
        )

    return {
        'n': n,
        'tcl_applies': tcl_applies,
        'small_sample_warning': small_sample_warning,
        'note': note,
    }


# =============================================================================
# Normality Analysis with Robustness Evaluation
# =============================================================================

def analyze_sample_normality(
    sample: np.ndarray,
    skewness: float,
    outlier_count: int,
    n: int,
) -> dict[str, Any]:
    """
    Analyze normality of a sample with robustness evaluation if non-normal.

    Robustness criteria (if not normal):
    - |skewness| < 1.0 AND outliers < 5% of data → robust

    Args:
        sample: NumPy array of numeric values
        skewness: Pre-computed skewness value
        outlier_count: Number of outliers detected
        n: Sample size

    Returns:
        dict: {
            'is_normal': bool, 'ad_statistic': float,
            'p_value': float, 'alpha': 0.05,
            'is_robust': bool | None, 'robustness_details': str | None
        }
    """
    ad_result = anderson_darling_normal(sample)

    result = {
        'is_normal': ad_result['is_normal'],
        'ad_statistic': round(ad_result['statistic'], 6),
        'p_value': round(ad_result['p_value'], 6),
        'alpha': 0.05,
        'is_robust': None,
        'robustness_details': None,
    }

    if not ad_result['is_normal']:
        outlier_pct = (outlier_count / n * 100) if n > 0 else 0.0
        skew_ok = abs(skewness) < 1.0
        outliers_ok = outlier_pct < 5.0

        is_robust = skew_ok and outliers_ok
        result['is_robust'] = is_robust

        if is_robust:
            result['robustness_details'] = (
                f"Datos no normales pero robustos: |asimetría|={abs(skewness):.3f} < 1.0 "
                f"y outliers={outlier_pct:.1f}% < 5%. Se puede continuar con datos originales."
            )
        else:
            reasons = []
            if not skew_ok:
                reasons.append(f"|asimetría|={abs(skewness):.3f} >= 1.0")
            if not outliers_ok:
                reasons.append(f"outliers={outlier_pct:.1f}% >= 5%")
            result['robustness_details'] = (
                f"Datos no normales y no robustos: {', '.join(reasons)}. "
                f"Se requiere transformación Box-Cox."
            )

    return result


# =============================================================================
# Box-Cox Transformation Logic
# =============================================================================

def apply_box_cox_if_needed(
    sample_a: np.ndarray,
    sample_b: np.ndarray,
    normality_a: dict[str, Any],
    normality_b: dict[str, Any],
) -> dict[str, Any]:
    """
    Apply Box-Cox transformation if either sample is not normal AND not robust.

    If Box-Cox is needed, it is applied to BOTH samples (even if only one triggered it).

    Args:
        sample_a: First sample values
        sample_b: Second sample values
        normality_a: Normality results for sample A
        normality_b: Normality results for sample B

    Returns:
        dict: {
            'applied': bool,
            'lambda_a': float | None, 'lambda_b': float | None,
            'normality_improved': bool | None,
            'using_transformed_data': bool,
            'transformed_a': np.ndarray | None,
            'transformed_b': np.ndarray | None,
            'warning': str | None
        }
    """
    # Determine if Box-Cox is needed
    needs_boxcox_a = not normality_a['is_normal'] and normality_a.get('is_robust') is False
    needs_boxcox_b = not normality_b['is_normal'] and normality_b.get('is_robust') is False
    needs_boxcox = needs_boxcox_a or needs_boxcox_b

    if not needs_boxcox:
        return {
            'applied': False,
            'lambda_a': None,
            'lambda_b': None,
            'normality_improved': None,
            'using_transformed_data': False,
            'transformed_a': None,
            'transformed_b': None,
            'warning': None,
        }

    # Check for zeros/negatives in either sample
    has_nonpositive_a = np.any(sample_a <= 0)
    has_nonpositive_b = np.any(sample_b <= 0)

    if has_nonpositive_a or has_nonpositive_b:
        return {
            'applied': False,
            'lambda_a': None,
            'lambda_b': None,
            'normality_improved': None,
            'using_transformed_data': False,
            'transformed_a': None,
            'transformed_b': None,
            'warning': 'Box-Cox no aplicable (datos <= 0)',
        }

    # Apply Box-Cox to BOTH samples
    bc_a = box_cox_transform(sample_a)
    bc_b = box_cox_transform(sample_b)

    # Use box_cox_transform's built-in normality re-test (avoids redundant AD computation)
    both_normal = bc_a['success'] and bc_b['success']

    if both_normal:
        return {
            'applied': True,
            'lambda_a': round(bc_a['lambda'], 6),
            'lambda_b': round(bc_b['lambda'], 6),
            'normality_improved': True,
            'using_transformed_data': True,
            'transformed_a': bc_a['transformed_values'],
            'transformed_b': bc_b['transformed_values'],
            'warning': None,
        }
    else:
        # Transformation did not achieve normality
        return {
            'applied': True,
            'lambda_a': round(bc_a['lambda'], 6),
            'lambda_b': round(bc_b['lambda'], 6),
            'normality_improved': False,
            'using_transformed_data': False,
            'transformed_a': None,
            'transformed_b': None,
            'warning': 'La transformación no logró normalidad',
        }


# =============================================================================
# Analysis Orchestrator
# =============================================================================

def perform_descriptive_normality_analysis(
    muestra_a: np.ndarray,
    muestra_b: np.ndarray,
    column_names: list[str],
) -> dict[str, Any]:
    """
    Complete descriptive statistics and normality analysis pipeline.

    Pipeline: descriptive stats → outlier detection → sample size eval →
    normality → robustness → Box-Cox (if needed)

    Args:
        muestra_a: First sample numeric values
        muestra_b: Second sample numeric values
        column_names: Original column names [col_a, col_b]

    Returns:
        Complete results dict for downstream consumption by Stories 10.3 and 10.4
    """
    name_a = column_names[0] if column_names else 'Muestra A'
    name_b = column_names[1] if len(column_names) > 1 else 'Muestra B'
    warnings = []

    # 1. Descriptive statistics per sample
    descriptive_a = calculate_descriptive_statistics(muestra_a, name_a)
    descriptive_b = calculate_descriptive_statistics(muestra_b, name_b)

    # 2. Sample size evaluation
    sample_size_a = evaluate_sample_size(descriptive_a['n'], name_a)
    sample_size_b = evaluate_sample_size(descriptive_b['n'], name_b)

    if sample_size_a['small_sample_warning']:
        warnings.append(sample_size_a['note'])
    if sample_size_b['small_sample_warning']:
        warnings.append(sample_size_b['note'])

    # 3. Normality analysis with robustness
    normality_a = analyze_sample_normality(
        muestra_a,
        descriptive_a['skewness'],
        descriptive_a['outliers']['outlier_count'],
        descriptive_a['n'],
    )
    normality_b = analyze_sample_normality(
        muestra_b,
        descriptive_b['skewness'],
        descriptive_b['outliers']['outlier_count'],
        descriptive_b['n'],
    )

    # 4. Box-Cox transformation if needed
    box_cox_result = apply_box_cox_if_needed(
        muestra_a, muestra_b, normality_a, normality_b
    )

    if box_cox_result.get('warning'):
        warnings.append(box_cox_result['warning'])

    # 5. Determine data to use for downstream tests (Story 10.3)
    if box_cox_result['using_transformed_data']:
        data_a = box_cox_result['transformed_a']
        data_b = box_cox_result['transformed_b']
    else:
        data_a = muestra_a
        data_b = muestra_b

    return {
        'descriptive_a': descriptive_a,
        'descriptive_b': descriptive_b,
        'sample_size': {
            'a': sample_size_a,
            'b': sample_size_b,
        },
        'normality_a': normality_a,
        'normality_b': normality_b,
        'box_cox': box_cox_result,
        'warnings': warnings,
        'data_for_tests': {
            'sample_a': data_a,
            'sample_b': data_b,
        },
    }
