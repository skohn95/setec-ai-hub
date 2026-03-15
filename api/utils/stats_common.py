"""
Shared statistical utility functions.

This module provides common mathematical functions used across
multiple analysis calculators, avoiding cross-module dependencies.
"""
import numpy as np


def norm_ppf(p: float) -> float:
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
        return -norm_ppf(1 - p)

    # Rational approximation for p <= 0.5
    # From Abramowitz and Stegun 26.2.23
    t = np.sqrt(-2.0 * np.log(p))

    # Coefficients
    c0, c1, c2 = 2.515517, 0.802853, 0.010328
    d1, d2, d3 = 1.432788, 0.189269, 0.001308

    numerator = c0 + c1 * t + c2 * t * t
    denominator = 1.0 + d1 * t + d2 * t * t + d3 * t * t * t

    return -(t - numerator / denominator)
