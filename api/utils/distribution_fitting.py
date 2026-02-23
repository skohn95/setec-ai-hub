"""
Distribution Fitting Module - Pure Python Implementation

Provides distribution fitting and PPM calculation for Process Capability analysis.
All implementations use pure Python/NumPy (no scipy) to meet Vercel 250MB limit.

Supported distributions:
- Weibull
- Lognormal
- Gamma
- Exponential
- Logistic
- Extreme Value (Gumbel)

Also includes PPM (Parts Per Million) calculation for specification limits.
"""
import numpy as np
from typing import Any


# =============================================================================
# Import helper functions from normality_tests
# =============================================================================

from .normality_tests import _normal_cdf, _erf


# =============================================================================
# CDF Functions for Each Distribution
# =============================================================================

def _weibull_cdf(x: float, k: float, lam: float) -> float:
    """
    Weibull CDF: F(x) = 1 - exp(-(x/λ)^k)

    Args:
        x: Value to evaluate
        k: Shape parameter (> 0)
        lam: Scale parameter (> 0)

    Returns:
        Cumulative probability
    """
    if x <= 0:
        return 0.0
    return 1.0 - np.exp(-np.power(x / lam, k))


def _lognormal_cdf(x: float, mu: float, sigma: float) -> float:
    """
    Lognormal CDF: F(x) = Φ((ln(x) - μ) / σ)

    Args:
        x: Value to evaluate
        mu: Mean of log(X)
        sigma: Std dev of log(X)

    Returns:
        Cumulative probability
    """
    if x <= 0:
        return 0.0
    z = (np.log(x) - mu) / sigma
    return float(_normal_cdf(np.array([z]))[0])


def _gamma_cdf(x: float, alpha: float, beta: float) -> float:
    """
    Gamma CDF using regularized incomplete gamma function approximation.

    Args:
        x: Value to evaluate
        alpha: Shape parameter (> 0)
        beta: Scale parameter (> 0)

    Returns:
        Cumulative probability
    """
    if x <= 0:
        return 0.0

    # Validate parameters to avoid numerical issues
    if alpha <= 0 or beta <= 0:
        return 0.0

    # Scale x
    y = x / beta

    # Handle extreme values that could cause numerical issues
    if y > 700:  # Prevent overflow in exp calculations
        return 1.0
    if y < 1e-10 and alpha > 1:
        return 0.0

    # Use series expansion for regularized incomplete gamma
    # P(a, x) = γ(a, x) / Γ(a)

    # For small x, use series expansion
    # For large x, use continued fraction
    try:
        if y < alpha + 1:
            # Series expansion
            return _gamma_cdf_series(alpha, y)
        else:
            # Continued fraction (Lentz's method)
            return 1.0 - _gamma_cdf_continued_fraction(alpha, y)
    except (OverflowError, FloatingPointError):
        # Fallback for numerical issues
        return 0.5  # Return neutral value


def _gamma_cdf_series(a: float, x: float) -> float:
    """Series expansion for regularized incomplete gamma."""
    # P(a, x) = e^(-x) * x^a * sum(x^n / gamma(a + n + 1))
    max_iter = 200
    eps = 1e-10

    # Use log-gamma for numerical stability
    log_gamma_a = _log_gamma(a)

    term = 1.0 / a
    sum_val = term

    for n in range(1, max_iter):
        term *= x / (a + n)
        sum_val += term
        if abs(term) < eps * abs(sum_val):
            break

    result = np.exp(-x + a * np.log(x) - log_gamma_a) * sum_val
    return float(np.clip(result, 0.0, 1.0))


def _gamma_cdf_continued_fraction(a: float, x: float) -> float:
    """Continued fraction for complementary incomplete gamma."""
    # Q(a, x) = e^(-x) * x^a / Γ(a) * continued_fraction
    max_iter = 200
    eps = 1e-10

    log_gamma_a = _log_gamma(a)

    # Modified Lentz's method
    b = x + 1 - a
    c = 1.0 / 1e-30
    d = 1.0 / b
    h = d

    for i in range(1, max_iter):
        an = -i * (i - a)
        b += 2.0
        d = an * d + b
        if abs(d) < 1e-30:
            d = 1e-30
        c = b + an / c
        if abs(c) < 1e-30:
            c = 1e-30
        d = 1.0 / d
        delta = d * c
        h *= delta
        if abs(delta - 1.0) < eps:
            break

    result = np.exp(-x + a * np.log(x) - log_gamma_a) * h
    return float(np.clip(result, 0.0, 1.0))


def _log_gamma(x: float) -> float:
    """Log-gamma function using Stirling's approximation."""
    if x <= 0:
        return float('inf')

    # Use recursion to shift to larger values for better approximation
    if x < 7:
        # Recursion: Γ(x) = Γ(x+1) / x
        n = int(7 - x) + 1
        prod = 1.0
        for i in range(n):
            prod *= (x + i)
        return _log_gamma(x + n) - np.log(prod)

    # Stirling's approximation for large x
    # ln Γ(x) ≈ (x - 0.5) * ln(x) - x + 0.5 * ln(2π) + 1/(12x) - ...
    coeffs = [
        76.18009172947146,
        -86.50532032941677,
        24.01409824083091,
        -1.231739572450155,
        0.1208650973866179e-2,
        -0.5395239384953e-5
    ]

    tmp = x + 5.5
    tmp -= (x + 0.5) * np.log(tmp)
    ser = 1.000000000190015

    for j, c in enumerate(coeffs):
        ser += c / (x + j + 1)

    return -tmp + np.log(2.5066282746310005 * ser / x)


def _exponential_cdf(x: float, lam: float) -> float:
    """
    Exponential CDF: F(x) = 1 - exp(-λx)

    Args:
        x: Value to evaluate
        lam: Rate parameter (> 0)

    Returns:
        Cumulative probability
    """
    if x <= 0:
        return 0.0
    return 1.0 - np.exp(-lam * x)


def _logistic_cdf(x: float, mu: float, s: float) -> float:
    """
    Logistic CDF: F(x) = 1 / (1 + exp(-(x-μ)/s))

    Args:
        x: Value to evaluate
        mu: Location parameter
        s: Scale parameter (> 0)

    Returns:
        Cumulative probability
    """
    z = (x - mu) / s
    # Use numerically stable form
    if z >= 0:
        return 1.0 / (1.0 + np.exp(-z))
    else:
        exp_z = np.exp(z)
        return exp_z / (1.0 + exp_z)


def _extreme_value_cdf(x: float, mu: float, beta: float) -> float:
    """
    Extreme Value (Gumbel) CDF: F(x) = exp(-exp(-(x-μ)/β))

    Args:
        x: Value to evaluate
        mu: Location parameter
        beta: Scale parameter (> 0)

    Returns:
        Cumulative probability
    """
    z = (x - mu) / beta
    return np.exp(-np.exp(-z))


# =============================================================================
# Distribution Fitting Functions
# =============================================================================

def fit_weibull(values: np.ndarray) -> dict[str, Any]:
    """
    Fit Weibull distribution using Maximum Likelihood Estimation.

    Weibull PDF: f(x) = (k/λ) * (x/λ)^(k-1) * exp(-(x/λ)^k)

    Args:
        values: Positive numeric values

    Returns:
        dict: {
            'distribution': 'weibull',
            'params': {'k': float, 'lambda': float},
            'ad_statistic': float,
            'aic': float
        }
    """
    # Ensure positive values
    data = values[values > 0]
    n = len(data)

    if n < 2:
        # Use filtered data mean if available, otherwise fallback
        fallback_lambda = float(np.mean(data)) if len(data) > 0 else 1.0
        return {
            'distribution': 'weibull',
            'params': {'k': 1.0, 'lambda': fallback_lambda},
            'ad_statistic': float('inf'),
            'aic': float('inf')
        }

    # Initial estimate using method of moments
    mean = np.mean(data)
    std = np.std(data, ddof=1)
    cv = std / mean if mean > 0 else 1.0

    # Approximate k from coefficient of variation
    if cv < 0.3:
        k_init = 4.0
    elif cv < 0.5:
        k_init = 2.5
    elif cv < 0.8:
        k_init = 1.5
    else:
        k_init = 1.0

    # Newton-Raphson iteration for k
    k = k_init
    log_data = np.log(data)

    for _ in range(50):
        xk = np.power(data, k)
        log_x = log_data
        xk_log_x = xk * log_x
        sum_xk = np.sum(xk)

        if sum_xk == 0:
            break

        f = np.sum(log_x) / n + 1/k - np.sum(xk_log_x) / sum_xk

        xk_log_x2 = xk * log_x**2
        f_prime = -1/k**2 - (np.sum(xk_log_x2) * sum_xk - np.sum(xk_log_x)**2) / sum_xk**2

        if abs(f_prime) < 1e-10:
            break

        k_new = k - f / f_prime
        if abs(k_new - k) < 1e-6:
            break
        k = max(0.1, min(k_new, 20.0))

    # Calculate scale (λ) from k
    lam = np.power(np.mean(np.power(data, k)), 1/k)

    # Calculate AD statistic for Weibull
    sorted_data = np.sort(data)
    phi = np.array([_weibull_cdf(x, k, lam) for x in sorted_data])
    phi = np.clip(phi, 1e-15, 1 - 1e-15)

    i = np.arange(1, n + 1)
    s = np.sum((2 * i - 1) * (np.log(phi) + np.log(1 - phi[::-1])))
    ad_statistic = -n - s / n

    # Calculate AIC
    # Log-likelihood for Weibull
    log_lik = n * np.log(k / lam) + (k - 1) * np.sum(log_data - np.log(lam)) - np.sum(np.power(data / lam, k))
    aic = -2 * log_lik + 2 * 2  # 2 parameters

    return {
        'distribution': 'weibull',
        'params': {'k': float(k), 'lambda': float(lam)},
        'ad_statistic': float(ad_statistic),
        'aic': float(aic)
    }


def fit_lognormal(values: np.ndarray) -> dict[str, Any]:
    """
    Fit Lognormal distribution.

    If X ~ Lognormal(μ, σ), then ln(X) ~ Normal(μ, σ)

    Args:
        values: Positive numeric values

    Returns:
        dict: {
            'distribution': 'lognormal',
            'params': {'mu': float, 'sigma': float},
            'ad_statistic': float,
            'aic': float
        }
    """
    # Ensure positive values
    data = values[values > 0]
    n = len(data)

    if n < 2:
        return {
            'distribution': 'lognormal',
            'params': {'mu': 0.0, 'sigma': 1.0},
            'ad_statistic': float('inf'),
            'aic': float('inf')
        }

    log_data = np.log(data)
    mu = np.mean(log_data)
    sigma = np.std(log_data, ddof=1)

    # Prevent zero sigma
    sigma = max(sigma, 0.001)

    # Calculate AD statistic
    sorted_data = np.sort(data)
    phi = np.array([_lognormal_cdf(x, mu, sigma) for x in sorted_data])
    phi = np.clip(phi, 1e-15, 1 - 1e-15)

    i = np.arange(1, n + 1)
    s = np.sum((2 * i - 1) * (np.log(phi) + np.log(1 - phi[::-1])))
    ad_statistic = -n - s / n

    # Calculate AIC
    # Log-likelihood for Lognormal
    log_lik = -n/2 * np.log(2 * np.pi) - n * np.log(sigma) - np.sum(log_data) - np.sum((log_data - mu)**2) / (2 * sigma**2)
    aic = -2 * log_lik + 2 * 2  # 2 parameters

    return {
        'distribution': 'lognormal',
        'params': {'mu': float(mu), 'sigma': float(sigma)},
        'ad_statistic': float(ad_statistic),
        'aic': float(aic)
    }


def fit_gamma(values: np.ndarray) -> dict[str, Any]:
    """
    Fit Gamma distribution using method of moments.

    Gamma PDF: f(x) = x^(α-1) * exp(-x/β) / (β^α * Γ(α))

    Args:
        values: Positive numeric values

    Returns:
        dict: {
            'distribution': 'gamma',
            'params': {'alpha': float, 'beta': float},
            'ad_statistic': float,
            'aic': float
        }
    """
    # Ensure positive values
    data = values[values > 0]
    n = len(data)

    if n < 2:
        return {
            'distribution': 'gamma',
            'params': {'alpha': 1.0, 'beta': 1.0},
            'ad_statistic': float('inf'),
            'aic': float('inf')
        }

    mean = np.mean(data)
    var = np.var(data, ddof=1)

    # Method of moments estimates
    # mean = alpha * beta, var = alpha * beta^2
    # => alpha = mean^2 / var, beta = var / mean
    if var > 0 and mean > 0:
        alpha = mean**2 / var
        beta = var / mean
    else:
        alpha = 1.0
        beta = mean if mean > 0 else 1.0

    # Ensure positive parameters
    alpha = max(alpha, 0.1)
    beta = max(beta, 0.001)

    # Calculate AD statistic
    sorted_data = np.sort(data)
    phi = np.array([_gamma_cdf(x, alpha, beta) for x in sorted_data])
    phi = np.clip(phi, 1e-15, 1 - 1e-15)

    i = np.arange(1, n + 1)
    s = np.sum((2 * i - 1) * (np.log(phi) + np.log(1 - phi[::-1])))
    ad_statistic = -n - s / n

    # Calculate AIC
    # Log-likelihood for Gamma (approximation)
    log_lik = (alpha - 1) * np.sum(np.log(data)) - np.sum(data) / beta - n * alpha * np.log(beta) - n * _log_gamma(alpha)
    aic = -2 * log_lik + 2 * 2  # 2 parameters

    return {
        'distribution': 'gamma',
        'params': {'alpha': float(alpha), 'beta': float(beta)},
        'ad_statistic': float(ad_statistic),
        'aic': float(aic)
    }


def fit_exponential(values: np.ndarray) -> dict[str, Any]:
    """
    Fit Exponential distribution.

    MLE for exponential: λ = 1 / mean(x)

    Args:
        values: Positive numeric values

    Returns:
        dict: {
            'distribution': 'exponential',
            'params': {'lambda': float},
            'ad_statistic': float,
            'aic': float
        }
    """
    # Ensure positive values
    data = values[values > 0]
    n = len(data)

    if n < 2:
        return {
            'distribution': 'exponential',
            'params': {'lambda': 1.0},
            'ad_statistic': float('inf'),
            'aic': float('inf')
        }

    mean = np.mean(data)
    lam = 1.0 / mean if mean > 0 else 1.0

    # Calculate AD statistic
    sorted_data = np.sort(data)
    phi = np.array([_exponential_cdf(x, lam) for x in sorted_data])
    phi = np.clip(phi, 1e-15, 1 - 1e-15)

    i = np.arange(1, n + 1)
    s = np.sum((2 * i - 1) * (np.log(phi) + np.log(1 - phi[::-1])))
    ad_statistic = -n - s / n

    # Calculate AIC
    log_lik = n * np.log(lam) - lam * np.sum(data)
    aic = -2 * log_lik + 2 * 1  # 1 parameter

    return {
        'distribution': 'exponential',
        'params': {'lambda': float(lam)},
        'ad_statistic': float(ad_statistic),
        'aic': float(aic)
    }


def fit_logistic(values: np.ndarray) -> dict[str, Any]:
    """
    Fit Logistic distribution using method of moments.

    Logistic: mean = μ, var = π²s²/3

    Args:
        values: Numeric values

    Returns:
        dict: {
            'distribution': 'logistic',
            'params': {'mu': float, 's': float},
            'ad_statistic': float,
            'aic': float
        }
    """
    n = len(values)

    if n < 2:
        return {
            'distribution': 'logistic',
            'params': {'mu': 0.0, 's': 1.0},
            'ad_statistic': float('inf'),
            'aic': float('inf')
        }

    mu = np.mean(values)
    var = np.var(values, ddof=1)

    # s = sqrt(3 * var) / π
    s = np.sqrt(3 * var) / np.pi if var > 0 else 1.0
    s = max(s, 0.001)

    # Calculate AD statistic
    sorted_data = np.sort(values)
    phi = np.array([_logistic_cdf(x, mu, s) for x in sorted_data])
    phi = np.clip(phi, 1e-15, 1 - 1e-15)

    i = np.arange(1, n + 1)
    s_sum = np.sum((2 * i - 1) * (np.log(phi) + np.log(1 - phi[::-1])))
    ad_statistic = -n - s_sum / n

    # Calculate AIC
    # Log-likelihood for Logistic
    z = (values - mu) / s
    log_lik = -np.sum(z) - 2 * np.sum(np.log(1 + np.exp(-z))) - n * np.log(s)
    aic = -2 * log_lik + 2 * 2  # 2 parameters

    return {
        'distribution': 'logistic',
        'params': {'mu': float(mu), 's': float(s)},
        'ad_statistic': float(ad_statistic),
        'aic': float(aic)
    }


def fit_extreme_value(values: np.ndarray) -> dict[str, Any]:
    """
    Fit Extreme Value (Gumbel) distribution using method of moments.

    Gumbel: mean = μ + γβ (Euler-Mascheroni γ ≈ 0.5772)
            var = π²β²/6

    Args:
        values: Numeric values

    Returns:
        dict: {
            'distribution': 'extreme_value',
            'params': {'mu': float, 'beta': float},
            'ad_statistic': float,
            'aic': float
        }
    """
    n = len(values)

    if n < 2:
        return {
            'distribution': 'extreme_value',
            'params': {'mu': 0.0, 'beta': 1.0},
            'ad_statistic': float('inf'),
            'aic': float('inf')
        }

    euler_gamma = 0.5772156649

    mean = np.mean(values)
    var = np.var(values, ddof=1)

    # β = sqrt(6 * var) / π
    beta = np.sqrt(6 * var) / np.pi if var > 0 else 1.0
    beta = max(beta, 0.001)

    # μ = mean - γβ
    mu = mean - euler_gamma * beta

    # Calculate AD statistic
    sorted_data = np.sort(values)
    phi = np.array([_extreme_value_cdf(x, mu, beta) for x in sorted_data])
    phi = np.clip(phi, 1e-15, 1 - 1e-15)

    i = np.arange(1, n + 1)
    s = np.sum((2 * i - 1) * (np.log(phi) + np.log(1 - phi[::-1])))
    ad_statistic = -n - s / n

    # Calculate AIC
    # Log-likelihood for Gumbel
    z = (values - mu) / beta
    log_lik = -np.sum(z) - np.sum(np.exp(-z)) - n * np.log(beta)
    aic = -2 * log_lik + 2 * 2  # 2 parameters

    return {
        'distribution': 'extreme_value',
        'params': {'mu': float(mu), 'beta': float(beta)},
        'ad_statistic': float(ad_statistic),
        'aic': float(aic)
    }


# =============================================================================
# Fit All Distributions and Select Best
# =============================================================================

def fit_all_distributions(values: np.ndarray) -> dict[str, Any]:
    """
    Fit all supported distributions and select the best fit.

    Best fit is selected by lowest Anderson-Darling statistic.

    Args:
        values: Numeric values

    Returns:
        dict: {
            'distribution': str,       # Name of best-fit distribution
            'params': dict,            # Parameters of best-fit
            'ad_statistic': float,     # AD statistic of best-fit
            'aic': float,              # AIC of best-fit
            'all_fits': list           # All distribution fits (sorted by AD)
        }
    """
    fits = []

    # Fit each distribution
    try:
        fits.append(fit_weibull(values))
    except Exception:
        pass

    try:
        fits.append(fit_lognormal(values))
    except Exception:
        pass

    try:
        fits.append(fit_gamma(values))
    except Exception:
        pass

    try:
        fits.append(fit_exponential(values))
    except Exception:
        pass

    try:
        fits.append(fit_logistic(values))
    except Exception:
        pass

    try:
        fits.append(fit_extreme_value(values))
    except Exception:
        pass

    # Sort by AD statistic (lowest is best)
    fits = [f for f in fits if f['ad_statistic'] != float('inf')]
    fits.sort(key=lambda x: x['ad_statistic'])

    if not fits:
        # Return a default if no fits succeeded
        return {
            'distribution': 'lognormal',
            'params': {'mu': np.mean(np.log(np.abs(values) + 1)), 'sigma': 1.0},
            'ad_statistic': float('inf'),
            'aic': float('inf'),
            'all_fits': []
        }

    best = fits[0]

    return {
        'distribution': best['distribution'],
        'params': best['params'],
        'ad_statistic': best['ad_statistic'],
        'aic': best['aic'],
        'all_fits': fits
    }


# =============================================================================
# PPM (Parts Per Million) Calculation
# =============================================================================

def calculate_ppm(
    distribution: str,
    params: dict[str, float],
    lei: float,
    les: float
) -> dict[str, int]:
    """
    Calculate Parts Per Million outside specification limits.

    PPM = (1 - P(LEI < X < LES)) * 1,000,000

    Args:
        distribution: Distribution name ('normal', 'weibull', 'lognormal', etc.)
        params: Distribution parameters
        lei: Lower specification limit (LEI)
        les: Upper specification limit (LES)

    Returns:
        dict: {
            'ppm_below_lei': int,   # PPM below lower limit
            'ppm_above_les': int,   # PPM above upper limit
            'ppm_total': int        # Total PPM outside limits
        }
    """
    # Select appropriate CDF
    if distribution == 'normal':
        mean = params.get('mean', params.get('mu', 0))
        std = params.get('std', params.get('sigma', 1))

        def cdf(x):
            z = (x - mean) / std
            return float(_normal_cdf(np.array([z]))[0])

    elif distribution == 'weibull':
        k = params['k']
        lam = params['lambda']
        cdf = lambda x: _weibull_cdf(x, k, lam)

    elif distribution == 'lognormal':
        mu = params['mu']
        sigma = params['sigma']
        cdf = lambda x: _lognormal_cdf(x, mu, sigma)

    elif distribution == 'gamma':
        alpha = params['alpha']
        beta = params['beta']
        cdf = lambda x: _gamma_cdf(x, alpha, beta)

    elif distribution == 'exponential':
        lam = params['lambda']
        cdf = lambda x: _exponential_cdf(x, lam)

    elif distribution == 'logistic':
        mu = params['mu']
        s = params['s']
        cdf = lambda x: _logistic_cdf(x, mu, s)

    elif distribution == 'extreme_value':
        mu = params['mu']
        beta = params['beta']
        cdf = lambda x: _extreme_value_cdf(x, mu, beta)

    else:
        # Default to normal-like calculation
        mean = params.get('mean', 0)
        std = params.get('std', 1)

        def cdf(x):
            z = (x - mean) / std
            return float(_normal_cdf(np.array([z]))[0])

    # Calculate probabilities
    p_below_lei = cdf(lei)
    p_above_les = 1.0 - cdf(les)

    # Convert to PPM
    ppm_below = int(round(p_below_lei * 1_000_000))
    ppm_above = int(round(p_above_les * 1_000_000))
    ppm_total = ppm_below + ppm_above

    return {
        'ppm_below_lei': ppm_below,
        'ppm_above_les': ppm_above,
        'ppm_total': ppm_total
    }
