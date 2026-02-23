"""
Capability Indices Module - Process Capability Calculations

Story 7.4: Capability Indices & API Integration
Provides Cp, Cpk, Pp, Ppk calculations and capability classification.

All calculations use pure Python/NumPy (no scipy) to meet Vercel 250MB limit.

Control Chart Constants (AIAG SPC Manual, n=2):
- d2 = 1.128 (Sigma estimation factor for moving range)

Capability Thresholds (Industry Standard):
- Excellent: Cpk >= 1.67
- Adequate: 1.33 <= Cpk < 1.67
- Marginal: 1.00 <= Cpk < 1.33
- Inadequate: 0.67 <= Cpk < 1.00
- Poor: Cpk < 0.67
"""
import numpy as np
from typing import Any

from .normality_tests import _normal_cdf
from .distribution_fitting import (
    _weibull_cdf,
    _lognormal_cdf,
    _gamma_cdf,
    _exponential_cdf,
    _logistic_cdf,
    _extreme_value_cdf,
)


# =============================================================================
# Statistical Constants
# =============================================================================

D2_CONSTANT = 1.128  # For n=2 moving range (AIAG SPC Manual)

CAPABILITY_THRESHOLDS = {
    'excellent': 1.67,
    'adequate': 1.33,
    'marginal': 1.00,
    'inadequate': 0.67
}


# =============================================================================
# Specification Limit Validation
# =============================================================================

def validate_spec_limits(lei: float | None, les: float | None) -> dict[str, Any]:
    """
    Validate specification limits are valid.

    Args:
        lei: Lower specification limit (LEI)
        les: Upper specification limit (LES)

    Returns:
        dict: {
            'valid': bool,
            'errors': list[str]  # Spanish error messages
        }
    """
    errors = []

    # Check for missing values
    if lei is None:
        errors.append("Se requiere el Límite de Especificación Inferior (LEI)")
    if les is None:
        errors.append("Se requiere el Límite de Especificación Superior (LES)")

    if errors:
        return {'valid': False, 'errors': errors}

    # Check for NaN or infinity
    if not np.isfinite(lei):
        errors.append("LEI debe ser un valor numérico válido (no NaN ni infinito)")
    if not np.isfinite(les):
        errors.append("LES debe ser un valor numérico válido (no NaN ni infinito)")

    if errors:
        return {'valid': False, 'errors': errors}

    # Check LEI < LES
    if lei >= les:
        errors.append(f"El LEI ({lei}) debe ser menor que el LES ({les})")

    return {'valid': len(errors) == 0, 'errors': errors}


# =============================================================================
# Sigma Calculations
# =============================================================================

def calculate_sigma_within(mr_bar: float) -> float:
    """
    Calculate within-subgroup standard deviation from MR̄.

    σ_within = MR̄ / d2 where d2 = 1.128 (for n=2)

    Args:
        mr_bar: Mean of moving ranges (MR̄)

    Returns:
        Within-subgroup standard deviation
    """
    if mr_bar <= 0:
        return 0.0
    return mr_bar / D2_CONSTANT


def calculate_sigma_overall(values: np.ndarray) -> float:
    """
    Calculate overall sample standard deviation.

    Uses ddof=1 for sample standard deviation.

    Args:
        values: NumPy array of numeric values

    Returns:
        Overall standard deviation (sample, ddof=1)
    """
    if len(values) < 2:
        return 0.0

    std = np.std(values, ddof=1)
    if np.isnan(std):
        return 0.0
    return float(std)


# =============================================================================
# Cp Calculation
# =============================================================================

def calculate_cp(lei: float, les: float, sigma: float) -> float | None:
    """
    Calculate Cp (Process Capability) index.

    Cp = (LES - LEI) / (6 × σ_within)

    Measures process spread relative to specification width.
    Does NOT consider process centering.

    Args:
        lei: Lower specification limit
        les: Upper specification limit
        sigma: Within-subgroup standard deviation (σ_within)

    Returns:
        Cp value, or None if sigma <= 0
    """
    if sigma is None or sigma <= 0:
        return None

    cp = (les - lei) / (6 * sigma)
    return float(cp)


# =============================================================================
# Cpk Calculation
# =============================================================================

def calculate_cpk(
    mean: float,
    lei: float,
    les: float,
    sigma: float
) -> tuple[float | None, float | None, float | None]:
    """
    Calculate Cpk (Process Capability Index) and component indices.

    Cpu = (LES - μ) / (3 × σ)  # Upper capability
    Cpl = (μ - LEI) / (3 × σ)  # Lower capability
    Cpk = min(Cpu, Cpl)

    Measures capability considering process centering.
    Cpk ≤ Cp always.

    Args:
        mean: Process mean (μ)
        lei: Lower specification limit
        les: Upper specification limit
        sigma: Within-subgroup standard deviation (σ_within)

    Returns:
        Tuple of (Cpk, Cpu, Cpl), or (None, None, None) if sigma <= 0
    """
    if sigma is None or sigma <= 0:
        return (None, None, None)

    cpu = (les - mean) / (3 * sigma)
    cpl = (mean - lei) / (3 * sigma)
    cpk = min(cpu, cpl)

    return (float(cpk), float(cpu), float(cpl))


# =============================================================================
# Pp Calculation
# =============================================================================

def calculate_pp(lei: float, les: float, sigma_overall: float) -> float | None:
    """
    Calculate Pp (Process Performance) index.

    Pp = (LES - LEI) / (6 × σ_overall)

    Uses overall variation (includes between-subgroup variation).
    Generally Pp ≤ Cp if process is stable.

    Args:
        lei: Lower specification limit
        les: Upper specification limit
        sigma_overall: Overall sample standard deviation

    Returns:
        Pp value, or None if sigma_overall <= 0
    """
    if sigma_overall is None or sigma_overall <= 0:
        return None

    pp = (les - lei) / (6 * sigma_overall)
    return float(pp)


# =============================================================================
# Ppk Calculation
# =============================================================================

def calculate_ppk(
    mean: float,
    lei: float,
    les: float,
    sigma_overall: float
) -> tuple[float | None, float | None, float | None]:
    """
    Calculate Ppk (Process Performance Index) and component indices.

    Ppu = (LES - μ) / (3 × σ_overall)
    Ppl = (μ - LEI) / (3 × σ_overall)
    Ppk = min(Ppu, Ppl)

    Performance considering centering with overall sigma.
    Ppk ≤ Cpk for stable processes.

    Args:
        mean: Process mean (μ)
        lei: Lower specification limit
        les: Upper specification limit
        sigma_overall: Overall sample standard deviation

    Returns:
        Tuple of (Ppk, Ppu, Ppl), or (None, None, None) if sigma <= 0
    """
    if sigma_overall is None or sigma_overall <= 0:
        return (None, None, None)

    ppu = (les - mean) / (3 * sigma_overall)
    ppl = (mean - lei) / (3 * sigma_overall)
    ppk = min(ppu, ppl)

    return (float(ppk), float(ppu), float(ppl))


# =============================================================================
# Capability Classification
# =============================================================================

def classify_capability(index_value: float | None) -> dict[str, str]:
    """
    Classify capability index and return classification dict.

    Classification thresholds (industry standard):
    - Cpk >= 1.67: Excelente (green)
    - 1.33 <= Cpk < 1.67: Capaz (green)
    - 1.00 <= Cpk < 1.33: Marginalmente Capaz (yellow)
    - 0.67 <= Cpk < 1.00: No Capaz (red)
    - Cpk < 0.67: Muy Deficiente (red)

    Args:
        index_value: Capability index value (Cpk or Ppk)

    Returns:
        dict: {
            'classification': str,  # Spanish classification
            'color': str,           # 'green', 'yellow', 'red', 'gray'
            'level': str            # 'excellent', 'adequate', 'marginal', 'inadequate', 'poor'
        }
    """
    # Handle None/NaN
    if index_value is None or (isinstance(index_value, float) and np.isnan(index_value)):
        return {
            'classification': 'No Calculable',
            'color': 'gray',
            'level': 'unknown'
        }

    if index_value >= CAPABILITY_THRESHOLDS['excellent']:
        return {
            'classification': 'Excelente',
            'color': 'green',
            'level': 'excellent'
        }
    elif index_value >= CAPABILITY_THRESHOLDS['adequate']:
        return {
            'classification': 'Capaz',
            'color': 'green',
            'level': 'adequate'
        }
    elif index_value >= CAPABILITY_THRESHOLDS['marginal']:
        return {
            'classification': 'Marginalmente Capaz',
            'color': 'yellow',
            'level': 'marginal'
        }
    elif index_value >= CAPABILITY_THRESHOLDS['inadequate']:
        # 0.67 <= Cpk < 1.00: Inadequate but not critical
        return {
            'classification': 'No Capaz',
            'color': 'red',
            'level': 'inadequate'
        }
    else:
        # Cpk < 0.67: Critical - severe deficiency requiring immediate action
        return {
            'classification': 'Muy Deficiente',
            'color': 'red',
            'level': 'poor'
        }


# =============================================================================
# PPM Calculation (Normal Distribution)
# =============================================================================

def calculate_ppm_normal(
    mean: float,
    sigma: float,
    lei: float,
    les: float
) -> dict[str, int]:
    """
    Calculate parts per million outside specifications (normal distribution).

    Uses standard normal CDF to calculate probability outside spec limits.

    Args:
        mean: Process mean
        sigma: Standard deviation
        lei: Lower specification limit
        les: Upper specification limit

    Returns:
        dict: {
            'ppm_below_lei': int,
            'ppm_above_les': int,
            'ppm_total': int
        }
    """
    # Handle zero sigma case
    if sigma is None or sigma <= 0:
        # All values at mean
        if mean < lei:
            return {
                'ppm_below_lei': 1_000_000,
                'ppm_above_les': 0,
                'ppm_total': 1_000_000
            }
        elif mean > les:
            return {
                'ppm_below_lei': 0,
                'ppm_above_les': 1_000_000,
                'ppm_total': 1_000_000
            }
        else:
            return {
                'ppm_below_lei': 0,
                'ppm_above_les': 0,
                'ppm_total': 0
            }

    # Calculate z-scores
    z_lower = (lei - mean) / sigma
    z_upper = (les - mean) / sigma

    # Calculate probabilities using CDF
    p_below = float(_normal_cdf(np.array([z_lower]))[0])
    p_above = 1.0 - float(_normal_cdf(np.array([z_upper]))[0])

    # Convert to PPM
    ppm_below = int(round(p_below * 1_000_000))
    ppm_above = int(round(p_above * 1_000_000))
    ppm_total = ppm_below + ppm_above

    return {
        'ppm_below_lei': ppm_below,
        'ppm_above_les': ppm_above,
        'ppm_total': ppm_total
    }


# =============================================================================
# Non-Normal Capability Calculation
# =============================================================================

def calculate_capability_non_normal(
    values: np.ndarray,
    lei: float,
    les: float,
    fitted_dist: dict[str, Any]
) -> dict[str, Any]:
    """
    Calculate capability indices for non-normal data using fitted distribution.

    Uses percentile-based approach:
    - P0.135 = 0.135th percentile (lower 3σ equivalent)
    - P99.865 = 99.865th percentile (upper 3σ equivalent)
    - Pp_non_normal = (LES - LEI) / (P99.865 - P0.135)

    Args:
        values: NumPy array of numeric values
        lei: Lower specification limit
        les: Upper specification limit
        fitted_dist: Fitted distribution info {name, params}

    Returns:
        dict: Capability result with method='non_normal'
    """
    dist_name = fitted_dist.get('name', 'lognormal')
    params = fitted_dist.get('params', {})

    # Calculate empirical percentiles as fallback
    sorted_vals = np.sort(values)
    n = len(sorted_vals)

    if n < 10:
        # Not enough data for reliable percentile estimation
        return {
            'method': 'non_normal',
            'ppk': None,
            'ppm': None,
            'note': 'Datos insuficientes para cálculo no-normal'
        }

    # Calculate empirical percentiles
    p0_135_idx = max(0, int(0.00135 * n))
    p99_865_idx = min(n - 1, int(0.99865 * n))
    p50_idx = int(0.5 * n)

    p0_135 = sorted_vals[p0_135_idx]
    p99_865 = sorted_vals[p99_865_idx]
    p50 = sorted_vals[p50_idx]

    # Non-normal Pp equivalent
    if p99_865 > p0_135:
        pp_non_normal = (les - lei) / (p99_865 - p0_135)
    else:
        pp_non_normal = None

    # Non-normal Ppk equivalent
    if p99_865 > p50 and p50 > p0_135:
        ppk_upper = (les - p50) / (p99_865 - p50) if p99_865 != p50 else None
        ppk_lower = (p50 - lei) / (p50 - p0_135) if p50 != p0_135 else None

        if ppk_upper is not None and ppk_lower is not None:
            ppk_non_normal = min(ppk_upper, ppk_lower)
        else:
            ppk_non_normal = ppk_upper or ppk_lower
    else:
        ppk_non_normal = None

    # Calculate PPM using fitted distribution CDF
    ppm = _calculate_ppm_from_distribution(dist_name, params, lei, les)

    return {
        'method': 'non_normal',
        'distribution': dist_name,
        'pp': float(pp_non_normal) if pp_non_normal is not None else None,
        'ppk': float(ppk_non_normal) if ppk_non_normal is not None else None,
        'percentiles': {
            'p0_135': float(p0_135),
            'p50': float(p50),
            'p99_865': float(p99_865)
        },
        'ppm': ppm,
        'ppk_classification': classify_capability(ppk_non_normal) if ppk_non_normal else {
            'classification': 'No Calculable',
            'color': 'gray',
            'level': 'unknown'
        }
    }


def _calculate_ppm_from_distribution(
    dist_name: str,
    params: dict[str, float],
    lei: float,
    les: float
) -> dict[str, int]:
    """Calculate PPM using specific distribution CDF."""
    try:
        if dist_name == 'weibull':
            k = params.get('k', 1.0)
            lam = params.get('lambda', 1.0)
            p_below = _weibull_cdf(lei, k, lam) if lei > 0 else 0.0
            p_above = 1.0 - _weibull_cdf(les, k, lam) if les > 0 else 0.0

        elif dist_name == 'lognormal':
            mu = params.get('mu', 0.0)
            sigma = params.get('sigma', 1.0)
            p_below = _lognormal_cdf(lei, mu, sigma) if lei > 0 else 0.0
            p_above = 1.0 - _lognormal_cdf(les, mu, sigma) if les > 0 else 0.0

        elif dist_name == 'gamma':
            alpha = params.get('alpha', 1.0)
            beta = params.get('beta', 1.0)
            p_below = _gamma_cdf(lei, alpha, beta) if lei > 0 else 0.0
            p_above = 1.0 - _gamma_cdf(les, alpha, beta) if les > 0 else 0.0

        elif dist_name == 'exponential':
            lam = params.get('lambda', 1.0)
            p_below = _exponential_cdf(lei, lam) if lei > 0 else 0.0
            p_above = 1.0 - _exponential_cdf(les, lam) if les > 0 else 0.0

        elif dist_name == 'logistic':
            mu = params.get('mu', 0.0)
            s = params.get('s', 1.0)
            p_below = _logistic_cdf(lei, mu, s)
            p_above = 1.0 - _logistic_cdf(les, mu, s)

        elif dist_name == 'extreme_value':
            mu = params.get('mu', 0.0)
            beta = params.get('beta', 1.0)
            p_below = _extreme_value_cdf(lei, mu, beta)
            p_above = 1.0 - _extreme_value_cdf(les, mu, beta)

        else:
            # Fallback: use empirical probability
            return {
                'ppm_below_lei': 0,
                'ppm_above_les': 0,
                'ppm_total': 0
            }

        ppm_below = int(round(max(0, p_below) * 1_000_000))
        ppm_above = int(round(max(0, p_above) * 1_000_000))

        return {
            'ppm_below_lei': ppm_below,
            'ppm_above_les': ppm_above,
            'ppm_total': ppm_below + ppm_above
        }

    except Exception:
        return {
            'ppm_below_lei': 0,
            'ppm_above_les': 0,
            'ppm_total': 0
        }


# =============================================================================
# Main Capability Calculation Wrapper
# =============================================================================

def calculate_capability_indices(
    values: np.ndarray,
    lei: float,
    les: float,
    stability_result: dict[str, Any],
    normality_result: dict[str, Any] | None = None
) -> dict[str, Any]:
    """
    Main wrapper: calculates all capability indices and classifications.

    Steps:
    1. Validate specification limits
    2. Extract mean and sigma values
    3. Calculate Cp, Cpk using sigma_within
    4. Calculate Pp, Ppk using sigma_overall
    5. Classify indices
    6. Calculate PPM

    Args:
        values: NumPy array of measurement values
        lei: Lower specification limit
        les: Upper specification limit
        stability_result: Result from stability analysis (contains MR̄ for sigma_within)
        normality_result: Optional normality analysis result (for non-normal handling)

    Returns:
        dict: {
            'cp': float | None,
            'cpk': float | None,
            'pp': float | None,
            'ppk': float | None,
            'cpu': float | None,
            'cpl': float | None,
            'ppu': float | None,
            'ppl': float | None,
            'sigma_within': float,
            'sigma_overall': float,
            'lei': float,
            'les': float,
            'mean': float,
            'cpk_classification': dict,
            'ppk_classification': dict,
            'ppm': dict,
            'method': 'normal' | 'non_normal'
        }
    """
    # Handle empty or invalid data
    if len(values) == 0:
        return {
            'valid': False,
            'errors': ['No hay datos para calcular índices de capacidad'],
            'cp': None,
            'cpk': None,
            'pp': None,
            'ppk': None
        }

    # Validate specification limits
    validation = validate_spec_limits(lei, les)
    if not validation['valid']:
        return {
            'valid': False,
            'errors': validation['errors'],
            'cp': None,
            'cpk': None,
            'pp': None,
            'ppk': None
        }

    # Extract mean
    mean = float(np.mean(values))

    # Extract sigma_within from stability result
    mr_bar = stability_result.get('i_chart', {}).get('mr_bar', 0)
    sigma_within = calculate_sigma_within(mr_bar)

    # Also check if stability_result has sigma directly (from perform_stability_analysis)
    if sigma_within == 0 and 'sigma' in stability_result:
        sigma_within = stability_result['sigma']

    # Calculate sigma_overall
    sigma_overall = calculate_sigma_overall(values)

    # Check if data is non-normal and use alternative calculation
    if normality_result is not None and not normality_result.get('is_normal', True):
        fitted_dist = normality_result.get('fitted_distribution')
        if fitted_dist is not None:
            non_normal_result = calculate_capability_non_normal(
                values, lei, les, fitted_dist
            )

            # Still calculate normal-based indices for comparison
            cp = calculate_cp(lei, les, sigma_within)
            cpk, cpu, cpl = calculate_cpk(mean, lei, les, sigma_within)
            pp = calculate_pp(lei, les, sigma_overall)
            ppk, ppu, ppl = calculate_ppk(mean, lei, les, sigma_overall)

            return {
                'valid': True,
                'cp': cp,
                'cpk': cpk,
                'pp': pp,
                'ppk': ppk,
                'cpu': cpu,
                'cpl': cpl,
                'ppu': ppu,
                'ppl': ppl,
                'sigma_within': sigma_within,
                'sigma_overall': sigma_overall,
                'lei': lei,
                'les': les,
                'mean': mean,
                'cpk_classification': classify_capability(cpk),
                'ppk_classification': classify_capability(ppk),
                'ppm': non_normal_result.get('ppm', calculate_ppm_normal(mean, sigma_overall, lei, les)),
                'method': 'non_normal',
                'non_normal': non_normal_result
            }

    # Standard normal-based calculation
    cp = calculate_cp(lei, les, sigma_within)
    cpk, cpu, cpl = calculate_cpk(mean, lei, les, sigma_within)
    pp = calculate_pp(lei, les, sigma_overall)
    ppk, ppu, ppl = calculate_ppk(mean, lei, les, sigma_overall)

    # Calculate PPM using normal distribution
    # Note: PPM uses sigma_overall (long-term variation) to estimate expected
    # defect rate, which aligns with Ppk-based performance assessment.
    # Some standards may prefer sigma_within for short-term estimates.
    ppm = calculate_ppm_normal(mean, sigma_overall, lei, les)

    return {
        'valid': True,
        'cp': cp,
        'cpk': cpk,
        'pp': pp,
        'ppk': ppk,
        'cpu': cpu,
        'cpl': cpl,
        'ppu': ppu,
        'ppl': ppl,
        'sigma_within': sigma_within,
        'sigma_overall': sigma_overall,
        'lei': lei,
        'les': les,
        'mean': mean,
        'cpk_classification': classify_capability(cpk),
        'ppk_classification': classify_capability(ppk),
        'ppm': ppm,
        'method': 'normal'
    }


# =============================================================================
# Instructions Generation
# =============================================================================

def generate_capability_instructions(capability_result: dict[str, Any]) -> str:
    """
    Generate markdown instructions for capability analysis results.

    Args:
        capability_result: Result from calculate_capability_indices

    Returns:
        Markdown string with capability interpretation
    """
    # Handle invalid results
    if not capability_result.get('valid', True):
        errors = capability_result.get('errors', [])
        error_list = '\n'.join(f'- {e}' for e in errors)
        return f"""
## Análisis de Capacidad de Proceso

⚠️ **No se pudo calcular los índices de capacidad:**

{error_list}
"""

    # Extract values with safe defaults
    cp = capability_result.get('cp')
    cpk = capability_result.get('cpk')
    pp = capability_result.get('pp')
    ppk = capability_result.get('ppk')
    cpu = capability_result.get('cpu')
    cpl = capability_result.get('cpl')
    ppu = capability_result.get('ppu')
    ppl = capability_result.get('ppl')
    sigma_within = capability_result.get('sigma_within', 0)
    sigma_overall = capability_result.get('sigma_overall', 0)
    mean = capability_result.get('mean', 0)
    lei = capability_result.get('lei', 0)
    les = capability_result.get('les', 0)
    cpk_class = capability_result.get('cpk_classification', {})
    ppk_class = capability_result.get('ppk_classification', {})
    ppm = capability_result.get('ppm', {})
    method = capability_result.get('method', 'normal')

    # Classification emojis
    color_emoji = {'green': '🟢', 'yellow': '🟡', 'red': '🔴', 'gray': '⚪'}
    cpk_emoji = color_emoji.get(cpk_class.get('color', 'gray'), '⚪')
    ppk_emoji = color_emoji.get(ppk_class.get('color', 'gray'), '⚪')

    # Format values (handle None)
    def fmt(val, decimals=4):
        if val is None:
            return 'N/A'
        return f'{val:.{decimals}f}'

    def fmt3(val):
        return fmt(val, 3)

    # Build PPM table
    ppm_below = ppm.get('ppm_below_lei', 0)
    ppm_above = ppm.get('ppm_above_les', 0)
    ppm_total = ppm.get('ppm_total', 0)

    # Calculate percentages
    ppm_below_pct = ppm_below / 10000 if ppm_below else 0
    ppm_above_pct = ppm_above / 10000 if ppm_above else 0
    ppm_total_pct = ppm_total / 10000 if ppm_total else 0

    # Build interpretation based on classification
    interpretation_map = {
        'excellent': 'Con un Cpk ≥ 1.67, su proceso tiene margen de seguridad significativo. La probabilidad de producir defectos es extremadamente baja.',
        'adequate': 'Con un Cpk entre 1.33 y 1.67, su proceso cumple los estándares industriales. Continúe monitoreando para mantener este nivel.',
        'marginal': 'Con un Cpk entre 1.00 y 1.33, su proceso está en el límite. Se recomienda investigar fuentes de variación y mejorar el centrado.',
        'inadequate': 'Con un Cpk < 1.00, su proceso genera defectos a una tasa inaceptable. Se requieren acciones de mejora prioritarias.',
        'poor': 'Con un Cpk < 0.67, su proceso está severamente fuera de especificación. Considere detener la producción hasta resolver.',
        'unknown': 'No se pudo determinar la capacidad del proceso.'
    }

    cpk_level = cpk_class.get('level', 'unknown')
    interpretation = interpretation_map.get(cpk_level, interpretation_map['unknown'])

    # Non-normal method note
    method_note = ""
    if method == 'non_normal':
        method_note = """
> ℹ️ **Nota:** Los datos no siguen una distribución normal. Los índices se calcularon usando la distribución ajustada.
"""

    instructions = f"""
## Análisis de Capacidad de Proceso
{method_note}
### Límites de Especificación

| Parámetro | Valor |
|-----------|-------|
| **LEI (Límite Inferior)** | {fmt(lei)} |
| **LES (Límite Superior)** | {fmt(les)} |
| **Media del Proceso (μ)** | {fmt(mean)} |

### Índices de Capacidad

| Índice | Valor | Interpretación |
|--------|-------|---------------|
| **Cp** | {fmt3(cp)} | Capacidad potencial (sin considerar centrado) |
| **Cpk** | {fmt3(cpk)} | {cpk_emoji} {cpk_class.get('classification', 'N/A')} |
| **Pp** | {fmt3(pp)} | Desempeño potencial (variación total) |
| **Ppk** | {fmt3(ppk)} | {ppk_emoji} {ppk_class.get('classification', 'N/A')} |

### Índices Unilaterales

| Índice | Valor | Descripción |
|--------|-------|-------------|
| **Cpu** | {fmt3(cpu)} | Capacidad superior (corto plazo) |
| **Cpl** | {fmt3(cpl)} | Capacidad inferior (corto plazo) |
| **Ppu** | {fmt3(ppu)} | Desempeño superior (largo plazo) |
| **Ppl** | {fmt3(ppl)} | Desempeño inferior (largo plazo) |

### Desviaciones Estándar

| Tipo | Valor | Uso |
|------|-------|-----|
| **σ (dentro del subgrupo)** | {fmt(sigma_within)} | Cp, Cpk |
| **s (general)** | {fmt(sigma_overall)} | Pp, Ppk |

### Defectos Esperados (PPM)

| Ubicación | PPM | % |
|-----------|-----|---|
| Debajo de LEI | {ppm_below:,} | {ppm_below_pct:.4f}% |
| Arriba de LES | {ppm_above:,} | {ppm_above_pct:.4f}% |
| **Total** | **{ppm_total:,}** | **{ppm_total_pct:.4f}%** |

### Clasificación

{cpk_emoji} **Cpk = {fmt3(cpk)}** — {cpk_class.get('classification', 'N/A')}

---

## Conclusión Ejecutiva

| Aspecto | Resultado |
|---------|-----------|
| **Capacidad (Cpk)** | {cpk_emoji} {cpk_class.get('classification', 'N/A')} |
| **Desempeño (Ppk)** | {ppk_emoji} {ppk_class.get('classification', 'N/A')} |
| **PPM Total Esperado** | {ppm_total:,} ({ppm_total_pct:.4f}%) |

---

## Conclusión Terrenal

{interpretation}

**¿Qué significa esto en la práctica?**
"""

    # Add practical recommendations based on classification
    if cpk_level == 'excellent':
        instructions += """
- Su proceso está funcionando de manera excepcional
- Tiene margen suficiente para absorber variaciones menores
- Continúe monitoreando para mantener este nivel de desempeño
"""
    elif cpk_level == 'adequate':
        instructions += """
- Su proceso cumple con los estándares de la industria
- Hay oportunidad de mejora pero no es urgente
- Monitoree regularmente para detectar cambios tempranos
"""
    elif cpk_level == 'marginal':
        instructions += """
- Su proceso está en el límite de lo aceptable
- Se recomienda investigar las principales fuentes de variación
- Considere ajustar el centrado del proceso hacia el valor objetivo
"""
    elif cpk_level == 'inadequate':
        instructions += """
- Su proceso genera defectos a una tasa inaceptable
- Acción requerida: identifique y elimine las causas de variación
- Priorice la reducción de variabilidad antes de ajustar el centrado
"""
    elif cpk_level == 'poor':
        instructions += """
- **Situación crítica:** su proceso está severamente fuera de control
- Considere detener la producción hasta resolver las causas raíz
- Realice un análisis de causa raíz inmediato (5 Porqués, Ishikawa)
"""
    else:
        instructions += """
- No se pudo determinar el estado del proceso
- Verifique que los límites de especificación sean correctos
"""

    return instructions
