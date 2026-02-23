"""
Capacidad de Proceso Statistics Calculator Module

Calculates basic descriptive statistics and normality analysis for Process Capability.
All calculations use pure Python/NumPy (no scipy) to meet Vercel 250MB limit.

Output structure follows existing MSA calculator patterns.
"""
import numpy as np
from typing import Any

from .normality_tests import analyze_normality, _normal_cdf
from .distribution_fitting import fit_all_distributions, calculate_ppm
from .stability_analysis import perform_stability_analysis
from .capability_indices import (
    calculate_capability_indices,
    generate_capability_instructions,
)


# =============================================================================
# Mode Calculation
# =============================================================================

def _calculate_mode(values: np.ndarray) -> float | list | None:
    """
    Calculate mode - handle multiple modes and no mode cases.

    Args:
        values: NumPy array of numeric values

    Returns:
        - Single float if one mode exists
        - List of floats if multiple modes exist
        - None if no repeated values (no mode)
    """
    if len(values) == 0:
        return None

    unique, counts = np.unique(values, return_counts=True)
    max_count = np.max(counts)

    # No repeated values means no mode
    if max_count == 1:
        return None

    # Find all values with max count
    modes = unique[counts == max_count]

    if len(modes) == 1:
        return float(modes[0])

    return [float(m) for m in modes]


# =============================================================================
# Basic Statistics Calculator
# =============================================================================

def calculate_basic_statistics(values: np.ndarray) -> dict[str, Any]:
    """
    Calculate basic descriptive statistics.

    Uses only numpy - no scipy dependency (Vercel 250MB limit).

    Args:
        values: NumPy array of numeric values

    Returns:
        dict: {
            'mean': float,           # Media
            'median': float,         # Mediana
            'mode': float | list | None,  # Moda
            'std_dev': float,        # Desviación estándar (sample, ddof=1)
            'min': float,            # Mínimo
            'max': float,            # Máximo
            'range': float,          # Rango (max - min)
            'count': int             # Total de valores
        }
    """
    # Handle empty array case
    if len(values) == 0:
        return {
            'mean': None,
            'median': None,
            'mode': None,
            'std_dev': None,
            'min': None,
            'max': None,
            'range': None,
            'count': 0,
        }

    # Calculate statistics using numpy
    mean = float(np.mean(values))
    median = float(np.median(values))
    mode = _calculate_mode(values)

    # Standard deviation with ddof=1 (sample std dev)
    if len(values) > 1:
        std_dev = float(np.std(values, ddof=1))
    else:
        std_dev = 0.0

    min_val = float(np.min(values))
    max_val = float(np.max(values))
    range_val = max_val - min_val

    return {
        'mean': round(mean, 6),
        'median': round(median, 6),
        'mode': mode if mode is None else (
            round(mode, 6) if isinstance(mode, float) else [round(m, 6) for m in mode]
        ),
        'std_dev': round(std_dev, 6),
        'min': round(min_val, 6),
        'max': round(max_val, 6),
        'range': round(range_val, 6),
        'count': int(len(values)),
    }


# =============================================================================
# Output Formatting (matches MSA pattern)
# =============================================================================

# =============================================================================
# Normality Analysis
# =============================================================================

def perform_normality_analysis(
    values: np.ndarray,
    lei: float | None = None,
    les: float | None = None
) -> dict[str, Any] | None:
    """
    Perform complete normality analysis workflow.

    Steps:
    1. Run Anderson-Darling normality test
    2. If not normal, try Box-Cox transformation
    3. If Box-Cox fails, try Johnson transformation
    4. If all transformations fail, fit alternative distributions
    5. Calculate PPM if specification limits are provided

    Args:
        values: NumPy array of numeric values
        lei: Lower specification limit (optional)
        les: Upper specification limit (optional)

    Returns:
        dict: {
            'is_normal': bool,
            'ad_statistic': float,
            'p_value': float,
            'conclusion': 'Normal' | 'No Normal',
            'transformation': dict | None,
            'fitted_distribution': dict | None,
            'ppm': dict | None
        }
        None if insufficient data for normality testing (< 2 values)
    """
    # Handle edge case: insufficient data for normality testing
    if len(values) < 2:
        return None

    # Run normality analysis workflow
    normality_result = analyze_normality(values)

    # Build base result structure
    result = {
        'is_normal': normality_result['is_normal'],
        'ad_statistic': round(normality_result['ad_statistic'], 6),
        'p_value': round(normality_result['p_value'], 6),
        'conclusion': normality_result['conclusion'],
        'transformation': None,
        'fitted_distribution': None,
        'ppm': None
    }

    # Add transformation details if applied
    if normality_result.get('transformation') is not None:
        result['transformation'] = normality_result['transformation']

    # If data is not normal and transformations failed, fit alternative distributions
    if not result['is_normal'] and normality_result.get('method') == 'none':
        fit_result = fit_all_distributions(values)
        result['fitted_distribution'] = {
            'name': fit_result['distribution'],
            'params': fit_result['params'],
            'ad_statistic': round(fit_result['ad_statistic'], 6),
            'aic': round(fit_result['aic'], 2)
        }

    # Calculate PPM if specification limits are provided
    if lei is not None and les is not None:
        if result['is_normal']:
            # Use normal distribution with data's mean and std
            ppm_params = {
                'mean': float(np.mean(values)),
                'std': float(np.std(values, ddof=1))
            }
            result['ppm'] = calculate_ppm('normal', ppm_params, lei, les)
        elif result['fitted_distribution'] is not None:
            # Use the fitted distribution
            result['ppm'] = calculate_ppm(
                result['fitted_distribution']['name'],
                result['fitted_distribution']['params'],
                lei,
                les
            )

    return result


def generate_normality_instructions(normality_result: dict[str, Any]) -> str:
    """
    Generate markdown instructions for normality test results.

    Args:
        normality_result: Result from perform_normality_analysis

    Returns:
        Markdown string with normality interpretation
    """
    # Conclusion text
    if normality_result['is_normal']:
        conclusion_text = "✅ **Los datos siguen una distribución normal** (p-value ≥ 0.05)"
        interpretation = "Los datos son adecuados para el cálculo de índices de capacidad estándar (Cp, Cpk, Pp, Ppk)."
    else:
        conclusion_text = "⚠️ **Los datos NO siguen una distribución normal** (p-value < 0.05)"
        interpretation = "Los datos no cumplen el supuesto de normalidad. Se requieren métodos alternativos."

    # Build transformation section
    transformation_text = ""
    if normality_result.get('transformation') is not None:
        trans = normality_result['transformation']
        if trans['applied']:
            trans_type = trans.get('type', 'unknown')
            if trans_type == 'box_cox':
                lambda_val = trans.get('lambda', 'N/A')
                shift_val = trans.get('shift', None)
                shift_text = f" (datos desplazados +{shift_val})" if shift_val else ""
                transformation_text = f"""
### Transformación Aplicada

Se aplicó transformación **Box-Cox** con λ = {lambda_val}{shift_text}.
"""
                if trans.get('normalized_after', False):
                    transformation_text += "Los datos transformados **sí** pasan la prueba de normalidad.\n"
                else:
                    transformation_text += "Los datos transformados **no** logran normalidad.\n"

            elif trans_type == 'johnson':
                family = trans.get('family', 'SU')
                transformation_text = f"""
### Transformación Aplicada

Se aplicó transformación **Johnson {family}**.
"""
                if trans.get('normalized_after', False):
                    transformation_text += "Los datos transformados **sí** pasan la prueba de normalidad.\n"
                else:
                    transformation_text += "Los datos transformados **no** logran normalidad.\n"

    # Build fitted distribution section
    distribution_text = ""
    if normality_result.get('fitted_distribution') is not None:
        dist = normality_result['fitted_distribution']
        dist_name_map = {
            'weibull': 'Weibull',
            'lognormal': 'Lognormal',
            'gamma': 'Gamma',
            'exponential': 'Exponencial',
            'logistic': 'Logística',
            'extreme_value': 'Valor Extremo (Gumbel)'
        }
        dist_display = dist_name_map.get(dist['name'], dist['name'].title())

        params_text = ', '.join(f"{k}={v:.4f}" for k, v in dist['params'].items())
        distribution_text = f"""
### Distribución Alternativa Ajustada

**Mejor ajuste:** {dist_display}
**Parámetros:** {params_text}
**Estadístico AD:** {dist['ad_statistic']:.4f}
**AIC:** {dist['aic']:.2f}
"""

    # Build PPM section
    ppm_text = ""
    if normality_result.get('ppm') is not None:
        ppm = normality_result['ppm']
        ppm_text = f"""
### PPM (Partes Por Millón) Fuera de Especificación

| Ubicación | PPM |
|-----------|-----|
| **Debajo de LEI** | {ppm['ppm_below_lei']:,} |
| **Arriba de LES** | {ppm['ppm_above_les']:,} |
| **Total** | {ppm['ppm_total']:,} |
"""

    instructions = f"""
## Prueba de Normalidad (Anderson-Darling)

| Métrica | Valor |
|---------|-------|
| **Estadístico A²** | {normality_result['ad_statistic']:.4f} |
| **p-value** | {normality_result['p_value']:.4f} |
| **Nivel de significancia (α)** | 0.05 |

{conclusion_text}

**Interpretación:** {interpretation}
{transformation_text}{distribution_text}{ppm_text}"""

    return instructions


def generate_basic_stats_instructions(basic_stats: dict[str, Any], warnings: list[str]) -> str:
    """
    Generate markdown instructions for presenting basic statistics results.

    Follows the MSA output pattern with agent-only header.

    Args:
        basic_stats: Dictionary with basic statistics
        warnings: List of warning messages (e.g., sample size)

    Returns:
        Markdown string with presentation instructions
    """
    # Handle empty data case
    if basic_stats['count'] == 0:
        return """<!-- AGENT_ONLY -->
El archivo no contiene datos válidos para el análisis.
<!-- /AGENT_ONLY -->

# Estadísticas Básicas

⚠️ No se encontraron datos numéricos para analizar.

Por favor, verifica que el archivo contenga valores numéricos en la columna "Valores".
"""

    # Format mode for display
    mode_val = basic_stats['mode']
    if mode_val is None:
        mode_display = "Sin moda (todos los valores son únicos)"
    elif isinstance(mode_val, list):
        mode_display = f"Multimodal: {', '.join(str(m) for m in mode_val)}"
    else:
        mode_display = str(mode_val)

    # Build warnings section
    warnings_section = ""
    if warnings:
        warnings_section = "\n## ⚠️ Advertencias\n\n"
        for warning in warnings:
            warnings_section += f"- {warning}\n"
        warnings_section += "\n"

    instructions = f"""<!-- AGENT_ONLY -->
El análisis de estadísticas básicas ha sido completado.
Presenta los siguientes resultados al usuario.
Estos datos son la base para el análisis de capacidad de proceso.
<!-- /AGENT_ONLY -->

# Estadísticas Básicas del Proceso

## Resumen de Datos

| Estadística | Valor |
|-------------|-------|
| **N (cantidad de valores)** | {basic_stats['count']} |
| **Media (μ)** | {basic_stats['mean']} |
| **Mediana** | {basic_stats['median']} |
| **Moda** | {mode_display} |
| **Desviación Estándar (σ)** | {basic_stats['std_dev']} |
| **Mínimo** | {basic_stats['min']} |
| **Máximo** | {basic_stats['max']} |
| **Rango** | {basic_stats['range']} |

{warnings_section}## Interpretación

**Media vs Mediana:** {"Las medidas centrales son similares, sugiriendo una distribución relativamente simétrica." if basic_stats['median'] is not None and abs(basic_stats['mean'] - basic_stats['median']) < basic_stats['std_dev'] * 0.5 else "Hay diferencia entre la media y la mediana, lo que puede indicar asimetría en los datos o presencia de valores atípicos."}

**Variabilidad:** La desviación estándar de {basic_stats['std_dev']} indica la dispersión típica de los valores respecto a la media.

---

💡 **Próximos pasos:** Para un análisis completo de capacidad de proceso, se realizarán pruebas de normalidad, análisis de estabilidad y cálculo de índices de capacidad (Cp, Cpk, Pp, Ppk).
"""

    return instructions


def generate_stability_instructions(stability_result: dict[str, Any]) -> str:
    """
    Generate markdown instructions for stability analysis results.

    Args:
        stability_result: Result from perform_stability_analysis

    Returns:
        Markdown string with stability interpretation
    """
    # Overall conclusion
    if stability_result['is_stable']:
        conclusion = "✅ **Proceso Estable**"
        interpretation = "El proceso está bajo control estadístico. Es apropiado calcular índices de capacidad."
    else:
        conclusion = "⚠️ **Proceso Inestable**"
        interpretation = "Se detectaron señales de causa especial. Investigar antes de calcular capacidad."

    # I-Chart limits
    i_chart = stability_result['i_chart']
    mr_chart = stability_result['mr_chart']

    # Rules evaluation table
    rules = stability_result['rules']

    rule_descriptions = {
        'rule_1': 'Puntos fuera de límites (3σ)',
        'rule_2': 'Tendencia (7 consecutivos)',
        'rule_3': 'Estratificación (7 en 1σ)',
        'rule_4': 'Zona superior (7 en 2-3σ arriba)',
        'rule_5': 'Zona inferior (7 en 2-3σ abajo)',
        'rule_6': 'Patrón cíclico (alternante)',
        'rule_7': 'Un lado (7 arriba/abajo centro)',
    }

    rules_table = "| Regla | Descripción | Resultado |\n|-------|-------------|----------|\n"
    for rule_key, desc in rule_descriptions.items():
        rule_result = rules.get(rule_key, {'cumple': True})
        status = "✅ CUMPLE" if rule_result['cumple'] else "❌ NO CUMPLE"
        rules_table += f"| {rule_key.replace('_', ' ').title()} | {desc} | {status} |\n"

    # Out-of-control points summary
    i_ooc = i_chart.get('ooc_points', [])
    mr_ooc = mr_chart.get('ooc_points', [])

    ooc_text = ""
    if i_ooc:
        # 1-indexed for user readability
        i_indices = [str(p['index'] + 1) for p in i_ooc]
        ooc_text += f"\n**Puntos fuera de control (Carta I):** {', '.join(i_indices)}"
    if mr_ooc:
        mr_indices = [str(p['index'] + 1) for p in mr_ooc]
        ooc_text += f"\n**Puntos fuera de control (Carta MR):** {', '.join(mr_indices)}"

    instructions = f"""
## Análisis de Estabilidad (Cartas I-MR)

### Límites de Control

**Carta I (Valores Individuales):**
| Parámetro | Valor |
|-----------|-------|
| **Línea Central (X̄)** | {i_chart['center']:.4f} |
| **UCL** | {i_chart['ucl']:.4f} |
| **LCL** | {i_chart['lcl']:.4f} |

**Carta MR (Rangos Móviles):**
| Parámetro | Valor |
|-----------|-------|
| **Línea Central (MR̄)** | {mr_chart['center']:.4f} |
| **UCL** | {mr_chart['ucl']:.4f} |
| **LCL** | 0 |

**Desviación estándar dentro del subgrupo (σ):** {stability_result['sigma']:.4f}

### Evaluación de Reglas de Estabilidad

{rules_table}
### Conclusión

{conclusion}

**Interpretación:** {interpretation}
{ooc_text}
"""

    return instructions


def _build_fitted_distribution_curve(normality_result: dict[str, Any] | None) -> dict | None:
    """
    Build fitted distribution curve data for histogram overlay.

    Args:
        normality_result: Normality analysis results

    Returns:
        dict with name and params, or None if no fitted distribution
    """
    if normality_result is None:
        return None

    fitted_dist = normality_result.get('fitted_distribution')
    if fitted_dist is None:
        return None

    return {
        'name': fitted_dist.get('name'),
        'params': fitted_dist.get('params', {})
    }


# =============================================================================
# MR-Chart Data Builder (Story 8.2)
# =============================================================================

def _build_mr_chart_data(stability_result: dict[str, Any]) -> dict:
    """
    Build data structure for MR (Moving Range) control chart.

    MR chart shows the moving ranges between consecutive observations,
    with center line at MR̄ and UCL at 3.267 × MR̄.

    Args:
        stability_result: Result from perform_stability_analysis

    Returns:
        dict: {
            'type': 'mr_chart',
            'data': {
                'values': list,       # MR values (n-1 points for n observations)
                'center': float,      # MR̄ (mean of moving ranges)
                'ucl': float,         # Upper control limit
                'lcl': float,         # Lower control limit (always 0)
                'ooc_points': list    # Points exceeding UCL
            }
        }
    """
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


# =============================================================================
# Normality Plot (Q-Q Plot) Data Builder (Story 8.2)
# =============================================================================

def _norm_ppf(p: float) -> float:
    """
    Inverse of the standard normal CDF (percent point function).

    Uses Abramowitz and Stegun rational approximation (formula 26.2.23).
    Accurate to about 4.5e-4.

    Args:
        p: Probability value (0 < p < 1)

    Returns:
        z-score corresponding to probability p
    """
    if p <= 0 or p >= 1:
        raise ValueError(f"Probability must be between 0 and 1, got {p}")

    # Handle symmetric case
    if p > 0.5:
        return -_norm_ppf(1 - p)

    # Rational approximation for p <= 0.5
    # From Abramowitz and Stegun 26.2.23
    t = np.sqrt(-2.0 * np.log(p))

    # Coefficients
    c0, c1, c2 = 2.515517, 0.802853, 0.010328
    d1, d2, d3 = 1.432788, 0.189269, 0.001308

    numerator = c0 + c1 * t + c2 * t * t
    denominator = 1.0 + d1 * t + d2 * t * t + d3 * t * t * t

    return -(t - numerator / denominator)


def _linear_regression(x: list, y: np.ndarray) -> tuple[float, float]:
    """
    Simple linear regression: y = slope * x + intercept.

    Args:
        x: Independent variable (list of floats)
        y: Dependent variable (numpy array)

    Returns:
        tuple: (slope, intercept)
    """
    x_arr = np.array(x)
    n = len(x_arr)

    x_mean = np.mean(x_arr)
    y_mean = np.mean(y)

    # Calculate slope
    numerator = np.sum((x_arr - x_mean) * (y - y_mean))
    denominator = np.sum((x_arr - x_mean) ** 2)

    if denominator == 0:
        return 0.0, float(y_mean)

    slope = numerator / denominator
    intercept = y_mean - slope * x_mean

    return float(slope), float(intercept)


def _calculate_confidence_bands(
    expected_quantiles: list,
    n: int,
    std: float,
    slope: float,
    intercept: float
) -> dict[str, list]:
    """
    Calculate 95% confidence bands for normality plot.

    Uses the standard error formula for Q-Q plot confidence intervals:
    SE = σ / √n × √(1 + z² / (2n))

    Args:
        expected_quantiles: List of theoretical normal quantiles (z-scores)
        n: Sample size
        std: Sample standard deviation
        slope: Regression slope
        intercept: Regression intercept

    Returns:
        dict: {
            'lower': list of lower band values,
            'upper': list of upper band values
        }
    """
    lower = []
    upper = []

    for z in expected_quantiles:
        # Standard error at each quantile
        se = std / np.sqrt(n) * np.sqrt(1 + z * z / (2 * n))

        # Fitted value at this quantile
        fitted = slope * z + intercept

        # 95% confidence interval (1.96 for 95%)
        margin = 1.96 * se

        lower.append(round(fitted - margin, 6))
        upper.append(round(fitted + margin, 6))

    return {'lower': lower, 'upper': upper}


def _build_normality_plot_data(
    values: np.ndarray,
    normality_result: dict[str, Any]
) -> dict:
    """
    Build data structure for normality probability plot (Q-Q plot).

    The normality plot compares sample quantiles against theoretical
    normal quantiles. Points should fall along a straight line if
    data is normally distributed.

    Args:
        values: NumPy array of data values
        normality_result: Result from perform_normality_analysis

    Returns:
        dict: {
            'type': 'normality_plot',
            'data': {
                'points': [{'actual': float, 'expected': float, 'index': int}, ...],
                'fit_line': {'slope': float, 'intercept': float},
                'confidence_bands': {'lower': list, 'upper': list},
                'anderson_darling': {
                    'statistic': float,
                    'p_value': float,
                    'is_normal': bool
                }
            }
        }
    """
    sorted_values = np.sort(values)
    n = len(sorted_values)

    # Plotting positions using median rank approximation
    # (i - 0.375) / (n + 0.25) - Blom's formula
    plotting_positions = [(i - 0.375) / (n + 0.25) for i in range(1, n + 1)]

    # Expected normal quantiles (z-scores)
    expected_quantiles = [_norm_ppf(p) for p in plotting_positions]

    # Fit line (linear regression)
    slope, intercept = _linear_regression(expected_quantiles, sorted_values)

    # Calculate confidence bands
    std = float(np.std(sorted_values, ddof=1)) if n > 1 else 0.0
    confidence_bands = _calculate_confidence_bands(
        expected_quantiles, n, std, slope, intercept
    )

    # Build points array
    points = [
        {
            'actual': round(float(sorted_values[i]), 6),
            'expected': round(float(expected_quantiles[i]), 6),
            'index': i
        }
        for i in range(n)
    ]

    return {
        'type': 'normality_plot',
        'data': {
            'points': points,
            'fit_line': {
                'slope': round(slope, 6),
                'intercept': round(intercept, 6)
            },
            'confidence_bands': confidence_bands,
            'anderson_darling': {
                'statistic': round(normality_result.get('ad_statistic', 0), 6),
                'p_value': round(normality_result.get('p_value', 0), 6),
                'is_normal': normality_result.get('is_normal', False)
            }
        }
    }


def _extract_rules_violations(stability_result: dict[str, Any]) -> list[dict]:
    """
    Extract rules violations from stability analysis for I-Chart visualization.

    Args:
        stability_result: Stability analysis results

    Returns:
        List of rule violation dictionaries with rule name and violation details
    """
    violations = []

    rules = stability_result.get('rules', {})
    for rule_key, rule_data in rules.items():
        if not rule_data.get('cumple', True):  # Rule is violated (cumple = False)
            for violation in rule_data.get('violations', []):
                violations.append({
                    'rule': rule_key,
                    'start_index': violation.get('start'),
                    'end_index': violation.get('end'),
                    'index': violation.get('index'),
                    'direction': violation.get('direction'),
                    'side': violation.get('side'),
                    'limit': violation.get('limit'),
                })

    return violations


def _build_chart_data(
    values: np.ndarray | None,
    spec_limits: dict[str, float] | None,
    stability_result: dict[str, Any] | None,
    normality_result: dict[str, Any] | None
) -> list[dict]:
    """
    Build chartData array for Capacidad de Proceso visualization.

    Chart order: Histogram, I-Chart, MR-Chart, Normality Plot

    Args:
        values: NumPy array of data values
        spec_limits: Specification limits {lei, les}
        stability_result: Stability analysis results
        normality_result: Normality analysis results

    Returns:
        List of chart data dictionaries for all chart types
    """
    chart_data = []

    if values is None or len(values) == 0:
        return chart_data

    # 1. Add histogram chart data (requires spec limits for LEI/LES)
    if spec_limits is not None:
        lei = spec_limits.get('lei')
        les = spec_limits.get('les')

        if lei is not None and les is not None:
            histogram_data = {
                'type': 'histogram',
                'data': {
                    'values': values.tolist(),
                    'lei': lei,
                    'les': les,
                    'mean': float(np.mean(values)),
                    'std': float(np.std(values, ddof=1)) if len(values) > 1 else 0.0,
                    'lcl': stability_result['i_chart']['lcl'] if stability_result else None,
                    'ucl': stability_result['i_chart']['ucl'] if stability_result else None,
                    'fitted_distribution': _build_fitted_distribution_curve(normality_result)
                }
            }
            chart_data.append(histogram_data)

    # 2. Add I-Chart data (requires stability analysis)
    if stability_result is not None:
        i_chart_data = {
            'type': 'i_chart',
            'data': {
                'values': values.tolist(),
                'center': stability_result['i_chart']['center'],
                'ucl': stability_result['i_chart']['ucl'],
                'lcl': stability_result['i_chart']['lcl'],
                'ooc_points': stability_result['i_chart'].get('ooc_points', []),
                'rules_violations': _extract_rules_violations(stability_result)
            }
        }
        chart_data.append(i_chart_data)

        # 3. Add MR-Chart data (Story 8.2)
        mr_chart_data = _build_mr_chart_data(stability_result)
        chart_data.append(mr_chart_data)

    # 4. Add Normality Plot data (Story 8.2)
    if normality_result is not None and len(values) >= 2:
        normality_plot_data = _build_normality_plot_data(values, normality_result)
        chart_data.append(normality_plot_data)

    return chart_data


def build_capacidad_proceso_output(
    validated_data: dict[str, Any],
    basic_stats: dict[str, Any],
    normality_result: dict[str, Any] | None = None,
    stability_result: dict[str, Any] | None = None,
    spec_limits: dict[str, float] | None = None
) -> dict[str, Any]:
    """
    Build complete output structure for Capacidad de Proceso analysis.

    Matches MSA output pattern: results, chartData, instructions.

    Args:
        validated_data: Validated data from validator (column_name, values, warnings)
        basic_stats: Basic statistics dictionary
        normality_result: Normality analysis results (optional, from perform_normality_analysis)
        stability_result: Stability analysis results (optional, from perform_stability_analysis)
        spec_limits: Specification limits {lei, les} (optional, for capability indices)

    Returns:
        dict: {
            'results': {
                'basic_statistics': dict,
                'normality': dict | None,  # Story 7.2 - normality analysis results
                'stability': dict | None,  # Story 7.3 - stability analysis results
                'capability': dict | None,  # Story 7.4 - capability indices
                'sample_size': int,
                'warnings': list,
            },
            'chartData': list,  # Story 8.1 - histogram and I-Chart data
            'instructions': str,
        }
    """
    warnings = validated_data.get('warnings', [])
    values = validated_data.get('values')

    # Generate basic stats instructions
    basic_instructions = generate_basic_stats_instructions(basic_stats, warnings)

    # Add normality instructions if available
    instructions = basic_instructions
    if normality_result is not None:
        normality_instructions = generate_normality_instructions(normality_result)
        instructions = instructions + "\n" + normality_instructions

    # Add stability instructions if available
    if stability_result is not None:
        stability_instructions = generate_stability_instructions(stability_result)
        instructions = instructions + "\n" + stability_instructions

    # Build results structure
    results = {
        'basic_statistics': basic_stats,
        'sample_size': basic_stats['count'],
        'warnings': warnings,
    }

    # Add normality if available
    if normality_result is not None:
        results['normality'] = normality_result

    # Add stability if available
    if stability_result is not None:
        results['stability'] = stability_result

    # Calculate and add capability indices if spec_limits provided (Story 7.4)
    capability_result = None
    if spec_limits is not None and stability_result is not None and values is not None:
        lei = spec_limits.get('lei')
        les = spec_limits.get('les')

        if lei is not None and les is not None:
            capability_result = calculate_capability_indices(
                values,
                lei,
                les,
                stability_result,
                normality_result
            )

            # Only add if calculation was successful
            if capability_result.get('valid', True):
                results['capability'] = capability_result

                # Add capability instructions
                capability_instructions = generate_capability_instructions(capability_result)
                instructions = instructions + "\n" + capability_instructions

    # Build chartData for visualization (Story 8.1)
    chart_data = _build_chart_data(values, spec_limits, stability_result, normality_result)

    return {
        'results': results,
        'chartData': chart_data,
        'instructions': instructions,
    }
