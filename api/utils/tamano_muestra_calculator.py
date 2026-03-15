"""
Tamaño de Muestra (Sample Size) Calculator Module

Calculates minimum sample size per group for 2-sample comparison,
classifies the result, runs sensitivity analysis, and generates
Spanish-language instructions.

All calculations use pure Python + norm_ppf from stats_common.py.
No scipy dependency (Vercel 250MB limit).
"""
import math

from .stats_common import norm_ppf


# =============================================================================
# Sample Size Calculation (Subtask 1.1)
# =============================================================================

def calculate_sample_size(
    delta: float,
    sigma: float,
    alpha: float,
    power: float,
    alternative_hypothesis: str,
) -> dict:
    """Calculate minimum sample size per group for 2-sample comparison.

    Bilateral (two-sided):
        z_alpha = norm_ppf(1 - alpha/2)
        z_beta  = norm_ppf(power)
        n = ceil(((z_alpha + z_beta)^2 * 2 * sigma^2) / delta^2)

    Unilateral (greater or less):
        z_alpha = norm_ppf(1 - alpha)
        z_beta  = norm_ppf(power)
        n = ceil(((z_alpha + z_beta)^2 * 2 * sigma^2) / delta^2)

    Args:
        delta: Minimum practical difference (> 0)
        sigma: Estimated standard deviation (> 0)
        alpha: Significance level (0 < alpha < 1)
        power: Statistical power (0 < power < 1)
        alternative_hypothesis: 'two-sided', 'greater', or 'less'

    Returns:
        dict with n_per_group, z_alpha, z_beta, formula_used
    """
    if alternative_hypothesis == 'two-sided':
        z_alpha = norm_ppf(1.0 - alpha / 2.0)
        formula_used = 'bilateral'
    else:
        z_alpha = norm_ppf(1.0 - alpha)
        formula_used = 'unilateral'

    z_beta = norm_ppf(power)

    numerator = ((z_alpha + z_beta) ** 2) * 2.0 * (sigma ** 2)
    denominator = delta ** 2
    n_per_group = math.ceil(numerator / denominator)

    return {
        'n_per_group': n_per_group,
        'z_alpha': round(z_alpha, 4),
        'z_beta': round(z_beta, 4),
        'formula_used': formula_used,
    }


# =============================================================================
# Sample Size Classification (Subtask 1.2)
# =============================================================================

def classify_sample_size(n_per_group: int) -> dict:
    """Classify sample size and return category + Spanish message.

    Thresholds:
        >= 30: adequate (TCL applies)
        15-29: verify_normality
        < 15:  weak

    Args:
        n_per_group: Computed sample size per group

    Returns:
        dict with category and message
    """
    if n_per_group >= 30:
        category = 'adequate'
        message = (
            'Tamaño adecuado. El Teorema Central del Límite aplica; '
            'el t-test será robusto ante desviaciones leves de normalidad.'
        )
    elif n_per_group >= 15:
        category = 'verify_normality'
        message = (
            'Tamaño moderado. Se requerirá verificación de normalidad '
            'al ejecutar el test de hipótesis.'
        )
    else:
        category = 'weak'
        message = (
            'Tamaño pequeño. La muestra puede ser insuficiente y el poder '
            'real podría ser inestable. Considere aumentar el tamaño si es posible.'
        )

    # Additional warning for n <= 2
    if n_per_group <= 2:
        message += (
            f' Advertencia: un tamaño de muestra de {n_per_group} por grupo '
            'es extremadamente pequeño y los resultados no serán confiables.'
        )

    return {
        'category': category,
        'message': message,
    }


# =============================================================================
# Sensitivity Analysis (Subtask 1.3)
# =============================================================================

def run_sensitivity_analysis(
    delta: float,
    sigma: float,
    alpha: float,
    power: float,
    alternative_hypothesis: str,
) -> list[dict]:
    """Run sensitivity analysis with base + 3 alternative scenarios.

    Scenarios:
        - base: original parameters
        - delta_half: delta halved
        - power_90: power increased to 0.90
        - sigma_double: sigma doubled

    Returns:
        List of 4 scenario dicts with scenario, label, parameters, n_per_group
    """
    scenarios = [
        {
            'key': 'base',
            'label': 'Escenario base',
            'delta': delta,
            'sigma': sigma,
            'alpha': alpha,
            'power': power,
        },
        {
            'key': 'delta_half',
            'label': 'Delta reducida a la mitad',
            'delta': delta * 0.5,
            'sigma': sigma,
            'alpha': alpha,
            'power': power,
        },
        {
            'key': 'power_90' if power < 0.90 else 'power_95',
            'label': 'Poder aumentado a 90%' if power < 0.90 else 'Poder aumentado a 95%',
            'delta': delta,
            'sigma': sigma,
            'alpha': alpha,
            'power': 0.90 if power < 0.90 else 0.95,
        },
        {
            'key': 'sigma_double',
            'label': 'Variabilidad duplicada',
            'delta': delta,
            'sigma': sigma * 2.0,
            'alpha': alpha,
            'power': power,
        },
    ]

    results = []
    for s in scenarios:
        calc = calculate_sample_size(
            s['delta'], s['sigma'], s['alpha'], s['power'], alternative_hypothesis,
        )
        results.append({
            'scenario': s['key'],
            'label': s['label'],
            'parameters': {
                'delta': s['delta'],
                'sigma': s['sigma'],
                'alpha': s['alpha'],
                'power': s['power'],
            },
            'n_per_group': calc['n_per_group'],
        })

    return results


# =============================================================================
# Instructions Generator (Subtask 1.4)
# =============================================================================

def _generate_instructions(
    input_params: dict,
    sample_size: dict,
    classification: dict,
    sensitivity: list[dict],
) -> str:
    """Generate Spanish markdown instructions with 5 parts.

    Parts:
        1. Parámetros Utilizados
        2. Resultado
        3. Evaluación
        4. Análisis de Sensibilidad
        5. Recomendaciones

    Returns:
        Markdown string
    """
    n = sample_size['n_per_group']
    delta = input_params['delta']
    sigma = input_params['sigma']
    alpha = input_params['alpha']
    power = input_params['power']
    alt = input_params['alternative_hypothesis']
    current_mean = input_params.get('current_mean')
    expected_mean = input_params.get('expected_mean')

    test_type = 'Bilateral' if alt == 'two-sided' else 'Unilateral'
    current_mean_str = str(current_mean) if current_mean is not None else 'No especificada'
    expected_mean_str = str(expected_mean) if expected_mean is not None else 'No especificada'

    # Formula description (KaTeX inline math)
    if alt == 'two-sided':
        formula_desc = (
            f'Bilateral: $n = \\lceil \\frac{{(Z_{{\\alpha/2}} + Z_\\beta)^2 \\cdot 2\\sigma^2}}{{\\Delta^2}} \\rceil$ '
            f'con $Z_{{\\alpha/2}} = {sample_size["z_alpha"]}$, $Z_\\beta = {sample_size["z_beta"]}$'
        )
    else:
        formula_desc = (
            f'Unilateral: $n = \\lceil \\frac{{(Z_\\alpha + Z_\\beta)^2 \\cdot 2\\sigma^2}}{{\\Delta^2}} \\rceil$ '
            f'con $Z_\\alpha = {sample_size["z_alpha"]}$, $Z_\\beta = {sample_size["z_beta"]}$'
        )

    parts = []

    # Part 1: Parameters
    part1 = (
        '## Parámetros Utilizados\n\n'
        '| Parámetro | Valor |\n'
        '|---|---|\n'
        f'| Media actual estimada | {current_mean_str} |\n'
        f'| Media esperada | {expected_mean_str} |\n'
        f'| Diferencia mínima relevante (Delta) | {delta} |\n'
        f'| Desviación estándar estimada (Sigma) | {sigma} |\n'
        f'| Nivel de significancia (Alpha) | {alpha} |\n'
        f'| Poder estadístico | {power} |\n'
        f'| Tipo de test | {test_type} |'
    )
    parts.append(part1)

    # Part 2: Result
    part2 = (
        '## Resultado\n\n'
        f'**Tamaño de muestra mínimo: {n} por grupo**\n\n'
        f'Fórmula utilizada: {formula_desc}\n\n'
        f'> Esto significa que necesita recolectar al menos **{n} mediciones del grupo A** '
        f'y **{n} mediciones del grupo B**.'
    )
    parts.append(part2)

    # Part 3: Evaluation
    # Note: classification message already includes n<=2 warning from classify_sample_size()
    # n>1000 warning is in Recommendations (Part 5) where it's actionable
    part3 = f'## Evaluación\n\n{classification["message"]}'
    parts.append(part3)

    # Part 4: Sensitivity Analysis
    sens_rows = []
    for s in sensitivity:
        if s['scenario'] == 'base':
            sens_rows.append(f'| Escenario base | - | - | {s["n_per_group"]} |')
        elif s['scenario'] == 'delta_half':
            sens_rows.append(
                f'| Delta reducida | Delta = {s["parameters"]["delta"]} | '
                f'{s["parameters"]["delta"]} | {s["n_per_group"]} |'
            )
        elif s['scenario'] in ('power_90', 'power_95'):
            power_val = s['parameters']['power']
            power_pct = int(power_val * 100)
            sens_rows.append(
                f'| Poder {power_pct}% | Poder = {power_val} | {power_val} | {s["n_per_group"]} |'
            )
        elif s['scenario'] == 'sigma_double':
            sens_rows.append(
                f'| Variabilidad x2 | Sigma = {s["parameters"]["sigma"]} | '
                f'{s["parameters"]["sigma"]} | {s["n_per_group"]} |'
            )

    part4 = (
        '## Análisis de Sensibilidad\n\n'
        '| Escenario | Parámetro modificado | Valor | n por grupo |\n'
        '|---|---|---|---|\n'
        + '\n'.join(sens_rows)
    )
    parts.append(part4)

    # Part 5: Recommendations
    recs = []
    if n < 15:
        recs.append(
            'Considere aumentar el tamaño de muestra para obtener resultados más confiables.'
        )
    if n >= 30:
        recs.append(
            'El tamaño calculado es adecuado para aplicar el t-test sin preocuparse por la normalidad.'
        )
    recs.append('Verifique la estabilidad del proceso antes de recolectar los datos.')
    recs.append(
        "Una vez recolectados los datos, puede utilizar el análisis "
        "'Test de Hipótesis: 2 Muestras' para ejecutar la prueba."
    )

    # Sensitivity-based recommendation
    delta_half_scenario = next((s for s in sensitivity if s['scenario'] == 'delta_half'), None)
    if delta_half_scenario and delta_half_scenario['n_per_group'] > n:
        recs.append(
            f'Si necesita detectar diferencias más pequeñas ({delta * 0.5}), '
            f'el tamaño requerido aumenta a {delta_half_scenario["n_per_group"]} por grupo.'
        )

    if n > 1000:
        recs.append(
            f'Advertencia: el tamaño de muestra calculado ({n}) es muy grande '
            'y podría no ser práctico. Considere si el delta elegido es realista.'
        )

    part5 = '## Recomendaciones\n\n' + '\n\n'.join(f'- {r}' for r in recs)
    parts.append(part5)

    return '\n\n'.join(parts)


# =============================================================================
# Main Orchestrator (Subtask 1.5)
# =============================================================================

def calculate_tamano_muestra(
    delta: float,
    sigma: float,
    alpha: float,
    power: float,
    alternative_hypothesis: str,
    current_mean: float | None = None,
    expected_mean: float | None = None,
) -> dict:
    """Main orchestrator: validate, calculate, classify, sensitivity, instructions.

    Args:
        delta: Minimum practical difference (> 0)
        sigma: Estimated standard deviation (> 0)
        alpha: Significance level (0 < alpha < 1)
        power: Statistical power (0 < power < 1)
        alternative_hypothesis: 'two-sided', 'greater', or 'less'
        current_mean: Optional current process mean
        expected_mean: Optional expected process mean

    Returns:
        dict: { results, chartData, instructions }
    """
    # Input validation (Subtask 1.6 edge cases)
    if delta == 0:
        raise ValueError('La diferencia (delta) no puede ser cero')
    if sigma <= 0:
        raise ValueError('La variabilidad (sigma) debe ser mayor que cero')

    # Calculate sample size
    sample_size = calculate_sample_size(delta, sigma, alpha, power, alternative_hypothesis)

    # Classify
    classification = classify_sample_size(sample_size['n_per_group'])

    # Sensitivity analysis
    sensitivity = run_sensitivity_analysis(delta, sigma, alpha, power, alternative_hypothesis)

    # Build input parameters record
    input_parameters = {
        'delta': delta,
        'sigma': sigma,
        'alpha': alpha,
        'power': power,
        'alternative_hypothesis': alternative_hypothesis,
        'current_mean': current_mean,
        'expected_mean': expected_mean,
    }

    # Generate instructions
    instructions = _generate_instructions(input_parameters, sample_size, classification, sensitivity)

    return {
        'results': {
            'input_parameters': input_parameters,
            'sample_size': sample_size,
            'classification': classification,
            'sensitivity': sensitivity,
        },
        'chartData': [],
        'instructions': instructions,
    }
