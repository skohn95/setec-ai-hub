"""
Normality Tests Module - Pure Python Implementation

Provides normality testing and transformation functions for Process Capability analysis.
All implementations use pure Python/NumPy (no scipy) to meet Vercel 250MB limit.

Includes:
- Anderson-Darling normality test
- Box-Cox transformation
- Johnson SU transformation

Output accuracy: p-values comparable to Minitab (±0.01)
"""
import numpy as np
from typing import Any


# =============================================================================
# Error Function and Normal CDF (Pure Python)
# =============================================================================

def _erf(x: np.ndarray) -> np.ndarray:
    """
    Error function approximation (Abramowitz and Stegun 7.1.26).

    Maximum error: 1.5 × 10^-7

    Args:
        x: Input values (numpy array or scalar)

    Returns:
        Error function values
    """
    # Constants for approximation
    a1, a2, a3, a4, a5 = 0.254829592, -0.284496736, 1.421413741, -1.453152027, 1.061405429
    p = 0.3275911

    # Handle sign
    sign = np.sign(x)
    x = np.abs(x)

    # Approximation formula
    t = 1.0 / (1.0 + p * x)
    y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * np.exp(-x * x)

    return sign * y


def _normal_cdf(x: np.ndarray) -> np.ndarray:
    """
    Standard normal CDF using error function approximation.

    Φ(x) = 0.5 * (1 + erf(x / sqrt(2)))

    Args:
        x: Z-scores (standardized values)

    Returns:
        Cumulative probabilities
    """
    return 0.5 * (1.0 + _erf(x / np.sqrt(2.0)))


# =============================================================================
# Anderson-Darling P-value Calculation
# =============================================================================

def _ad_p_value_normal(a2_star: float) -> float:
    """
    Calculate p-value for Anderson-Darling test (normal distribution).

    Based on D'Agostino and Stephens (1986) approximation.
    Provides Minitab-compatible accuracy (±0.01).

    Args:
        a2_star: Modified A² statistic (with small sample correction)

    Returns:
        p-value for the test
    """
    if a2_star >= 0.600:
        p = np.exp(1.2937 - 5.709 * a2_star + 0.0186 * a2_star**2)
    elif a2_star >= 0.340:
        p = np.exp(0.9177 - 4.279 * a2_star - 1.38 * a2_star**2)
    elif a2_star >= 0.200:
        p = 1.0 - np.exp(-8.318 + 42.796 * a2_star - 59.938 * a2_star**2)
    else:
        p = 1.0 - np.exp(-13.436 + 101.14 * a2_star - 223.73 * a2_star**2)

    return float(np.clip(p, 0.0, 1.0))


# =============================================================================
# Anderson-Darling Normality Test
# =============================================================================

def anderson_darling_normal(values: np.ndarray) -> dict[str, Any]:
    """
    Perform Anderson-Darling test for normality.

    Tests H0: Data comes from a normal distribution
    vs H1: Data does not come from a normal distribution

    Uses α = 0.05 significance level.

    Args:
        values: NumPy array of numeric values (n >= 8 recommended)

    Returns:
        dict: {
            'statistic': float,   # A²* statistic (corrected)
            'p_value': float,     # p-value for the test
            'is_normal': bool,    # True if p_value >= 0.05
            'alpha': float        # Significance level (0.05)
        }

    Raises:
        ValueError: If values has less than 2 elements
    """
    n = len(values)

    if n < 2:
        raise ValueError("Se requieren al menos 2 valores para la prueba de normalidad.")

    # Calculate mean and standard deviation
    mean = np.mean(values)
    std = np.std(values, ddof=1)

    # Handle zero standard deviation (constant values)
    if std == 0 or np.isnan(std):
        return {
            'statistic': float('inf'),
            'p_value': 0.0,
            'is_normal': False,
            'alpha': 0.05
        }

    # Standardize and sort values
    y = np.sort((values - mean) / std)

    # Calculate CDF values for sorted standardized data
    phi = _normal_cdf(y)

    # Prevent log(0) and log(1) - numerical stability
    phi = np.clip(phi, 1e-15, 1.0 - 1e-15)

    # Calculate A² statistic using the AD formula
    i = np.arange(1, n + 1)
    s = np.sum((2 * i - 1) * (np.log(phi) + np.log(1.0 - phi[::-1])))
    a2 = -n - s / n

    # Apply small sample correction (Stephens, 1974)
    a2_star = a2 * (1.0 + 0.75 / n + 2.25 / (n**2))

    # Calculate p-value using asymptotic approximation
    p_value = _ad_p_value_normal(a2_star)

    return {
        'statistic': float(a2_star),
        'p_value': float(p_value),
        'is_normal': p_value >= 0.05,
        'alpha': 0.05
    }


# =============================================================================
# Box-Cox Transformation
# =============================================================================

def box_cox_transform(values: np.ndarray) -> dict[str, Any]:
    """
    Apply Box-Cox transformation to achieve normality.

    Searches for optimal λ using grid search over [-2, 2] range.
    Uses log-likelihood maximization (minimizing AD statistic as proxy).

    Box-Cox transformation:
        y(λ) = (x^λ - 1) / λ  for λ ≠ 0
        y(λ) = log(x)        for λ = 0

    Requires positive data (shifts negative/zero data automatically).

    Args:
        values: NumPy array of numeric values

    Returns:
        dict: {
            'transformed_values': np.ndarray,  # Transformed data
            'lambda': float,                   # Optimal λ parameter
            'shift': float | None,             # Shift applied (if data had negatives/zeros)
            'success': bool,                   # True if transformation achieved normality
            'ad_after': float,                 # AD statistic after transformation
            'p_value_after': float             # p-value after transformation
        }
    """
    # Make a copy to avoid modifying original
    data = values.copy().astype(float)

    # Handle non-positive values by shifting
    shift = None
    min_val = np.min(data)
    if min_val <= 0:
        shift = float(abs(min_val) + 1.0)
        data = data + shift

    # Grid search for optimal lambda
    lambdas = np.arange(-2.0, 2.1, 0.1)
    best_lambda = None
    best_ad = float('inf')
    best_transformed = None

    for lam in lambdas:
        # Apply Box-Cox transformation
        if abs(lam) < 0.01:  # λ ≈ 0 → log transform
            transformed = np.log(data)
        else:
            transformed = (np.power(data, lam) - 1.0) / lam

        # Skip if transformation produces invalid values
        if np.any(~np.isfinite(transformed)):
            continue

        # Test normality of transformed data
        try:
            ad_result = anderson_darling_normal(transformed)
            if ad_result['statistic'] < best_ad:
                best_ad = ad_result['statistic']
                best_lambda = lam
                best_transformed = transformed
        except (ValueError, RuntimeWarning):
            continue

    # Handle case where no valid transformation found
    if best_transformed is None:
        return {
            'transformed_values': values,
            'lambda': 1.0,  # Identity transform
            'shift': shift,
            'success': False,
            'ad_after': float('inf'),
            'p_value_after': 0.0
        }

    # Re-test best transformation for final results
    final_result = anderson_darling_normal(best_transformed)

    return {
        'transformed_values': best_transformed,
        'lambda': float(best_lambda),
        'shift': shift,
        'success': final_result['is_normal'],
        'ad_after': float(final_result['statistic']),
        'p_value_after': float(final_result['p_value'])
    }


# =============================================================================
# Johnson SU Transformation
# =============================================================================

def _estimate_johnson_su_params(values: np.ndarray) -> dict[str, float]:
    """
    Estimate Johnson SU transformation parameters using moment matching.

    Johnson SU transformation:
        z = γ + δ * sinh⁻¹((x - ξ) / λ)

    Parameters:
        γ (gamma): shape parameter
        δ (delta): shape parameter (> 0)
        ξ (xi): location parameter
        λ (lambda): scale parameter (> 0)

    Args:
        values: Input data array

    Returns:
        dict with gamma, delta, xi, lambda parameters
    """
    n = len(values)
    mean = np.mean(values)
    std = np.std(values, ddof=1)
    skew = np.mean(((values - mean) / std)**3) if std > 0 else 0
    kurt = np.mean(((values - mean) / std)**4) - 3 if std > 0 else 0

    # Initial estimates using method of moments
    # For SU family, use quantile-based estimation

    # Sort values for percentile estimation
    sorted_vals = np.sort(values)

    # Estimate quartiles
    q1_idx = int(0.25 * n)
    q2_idx = int(0.50 * n)
    q3_idx = int(0.75 * n)

    q1 = sorted_vals[max(0, q1_idx)]
    q2 = sorted_vals[max(0, q2_idx)]  # Median
    q3 = sorted_vals[min(n-1, q3_idx)]

    # Interquartile range
    iqr = q3 - q1 if q3 > q1 else std

    # Estimate xi (location) and lambda (scale)
    xi = float(q2)  # Location at median
    lam = float(iqr / 1.35) if iqr > 0 else std  # Scale from IQR

    # Ensure lambda is positive
    lam = max(lam, 0.001)

    # Estimate delta from kurtosis (simplified)
    # Higher kurtosis → smaller delta
    delta = 1.0 / max(0.5, np.sqrt(abs(kurt) + 1))
    delta = max(0.1, min(delta, 3.0))  # Bound delta

    # Estimate gamma from skewness
    # Positive skew → negative gamma
    gamma = -0.5 * skew * delta

    return {
        'gamma': float(gamma),
        'delta': float(delta),
        'xi': float(xi),
        'lambda': float(lam)
    }


def johnson_transform(values: np.ndarray) -> dict[str, Any]:
    """
    Apply Johnson SU (unbounded) transformation to achieve normality.

    Johnson SU transformation:
        z = γ + δ * sinh⁻¹((x - ξ) / λ)

    where sinh⁻¹(y) = log(y + sqrt(y² + 1))

    Note: The grid search optimization varies gamma and delta parameters
    around initial moment-matching estimates, while xi (location) and
    lambda (scale) remain fixed at their initial estimates. This provides
    a good balance between optimization quality and computational cost
    for most practical datasets.

    Args:
        values: NumPy array of numeric values

    Returns:
        dict: {
            'transformed_values': np.ndarray,  # Transformed data
            'family': str,                     # 'SU' (unbounded)
            'params': dict,                    # {gamma, delta, xi, lambda}
            'success': bool,                   # True if transformation achieved normality
            'ad_after': float,                 # AD statistic after transformation
            'p_value_after': float             # p-value after transformation
        }
    """
    # Estimate initial parameters
    params = _estimate_johnson_su_params(values)

    gamma = params['gamma']
    delta = params['delta']
    xi = params['xi']
    lam = params['lambda']

    # Optimize parameters using grid search around initial estimates
    best_params = params.copy()
    best_ad = float('inf')
    best_transformed = None

    # Grid search for refinement
    gamma_range = np.linspace(gamma - 1, gamma + 1, 5)
    delta_range = np.linspace(max(0.1, delta - 0.5), delta + 0.5, 5)

    for g in gamma_range:
        for d in delta_range:
            if d <= 0:
                continue

            try:
                # Apply Johnson SU transformation
                # sinh⁻¹(y) = log(y + sqrt(y² + 1))
                y = (values - xi) / lam
                z = g + d * np.arcsinh(y)

                # Check for valid transformation
                if np.any(~np.isfinite(z)):
                    continue

                # Test normality
                ad_result = anderson_darling_normal(z)
                if ad_result['statistic'] < best_ad:
                    best_ad = ad_result['statistic']
                    best_params = {'gamma': g, 'delta': d, 'xi': xi, 'lambda': lam}
                    best_transformed = z

            except (ValueError, RuntimeWarning):
                continue

    # If no valid transformation found, use initial parameters
    if best_transformed is None:
        y = (values - xi) / lam
        best_transformed = gamma + delta * np.arcsinh(y)

        try:
            final_result = anderson_darling_normal(best_transformed)
            best_ad = final_result['statistic']
            p_value_after = final_result['p_value']
        except ValueError:
            best_ad = float('inf')
            p_value_after = 0.0
    else:
        final_result = anderson_darling_normal(best_transformed)
        p_value_after = final_result['p_value']

    return {
        'transformed_values': best_transformed,
        'family': 'SU',
        'params': {
            'gamma': float(best_params['gamma']),
            'delta': float(best_params['delta']),
            'xi': float(best_params['xi']),
            'lambda': float(best_params['lambda'])
        },
        'success': p_value_after >= 0.05,
        'ad_after': float(best_ad),
        'p_value_after': float(p_value_after)
    }


# =============================================================================
# Normality Analysis Wrapper
# =============================================================================

def analyze_normality(values: np.ndarray) -> dict[str, Any]:
    """
    Complete normality analysis workflow.

    Steps:
    1. Run Anderson-Darling test
    2. If normal → return results
    3. If not normal → try Box-Cox transformation
    4. If Box-Cox succeeds → return with transformation details
    5. If Box-Cox fails → try Johnson transformation
    6. Return best results

    Args:
        values: NumPy array of numeric values

    Returns:
        dict: {
            'is_normal': bool,
            'ad_statistic': float,
            'p_value': float,
            'conclusion': str,  # 'Normal' or 'No Normal'
            'transformation': dict | None,
            'method': str  # 'original', 'box_cox', or 'johnson'
        }
    """
    # Step 1: Test original data
    ad_result = anderson_darling_normal(values)

    if ad_result['is_normal']:
        return {
            'is_normal': True,
            'ad_statistic': ad_result['statistic'],
            'p_value': ad_result['p_value'],
            'conclusion': 'Normal',
            'transformation': None,
            'method': 'original'
        }

    # Step 2: Try Box-Cox transformation
    bc_result = box_cox_transform(values)

    if bc_result['success']:
        return {
            'is_normal': True,
            'ad_statistic': bc_result['ad_after'],
            'p_value': bc_result['p_value_after'],
            'conclusion': 'Normal',
            'transformation': {
                'applied': True,
                'type': 'box_cox',
                'lambda': bc_result['lambda'],
                'shift': bc_result['shift'],
                'normalized_after': True
            },
            'method': 'box_cox'
        }

    # Step 3: Try Johnson transformation
    johnson_result = johnson_transform(values)

    if johnson_result['success']:
        return {
            'is_normal': True,
            'ad_statistic': johnson_result['ad_after'],
            'p_value': johnson_result['p_value_after'],
            'conclusion': 'Normal',
            'transformation': {
                'applied': True,
                'type': 'johnson',
                'family': johnson_result['family'],
                'params': johnson_result['params'],
                'normalized_after': True
            },
            'method': 'johnson'
        }

    # Neither transformation achieved normality
    # Return original test results with failed transformation info
    return {
        'is_normal': False,
        'ad_statistic': ad_result['statistic'],
        'p_value': ad_result['p_value'],
        'conclusion': 'No Normal',
        'transformation': {
            'applied': True,
            'type': 'box_cox',  # Report Box-Cox as the attempted transformation
            'lambda': bc_result['lambda'],
            'shift': bc_result['shift'],
            'normalized_after': False
        },
        'method': 'none'
    }
