"""
Sigma Estimation Module for Process Capability Analysis

Calculates Within (short-term) and Overall (long-term) sigma estimates
using Moving Range method. Replaces stability_analysis.py (Story 9.1).

Within sigma (σ_within) = MR̄ / d2 where d2 = 1.128 for n=2
Overall sigma (σ_overall) = sample standard deviation (ddof=1)

All calculations use pure Python/NumPy (no scipy) to meet Vercel 250MB limit.

Story 9.1: Create Sigma Estimation Module & Remove Stability Analysis
FRs covered (PRD-v3): FR-CP14
"""
import numpy as np
from typing import Any


# =============================================================================
# Statistical Constants
# =============================================================================

D2_CONSTANT = 1.128  # d2 for n=2 moving range (AIAG SPC Manual)


# =============================================================================
# Moving Range Calculation
# =============================================================================

def calculate_moving_ranges(values: np.ndarray) -> np.ndarray:
    """
    Calculate moving ranges between consecutive points.

    MR[i] = |X[i] - X[i-1]| for i = 1, 2, ..., n-1

    Args:
        values: NumPy array of individual values (n values)

    Returns:
        NumPy array of moving ranges (n-1 values)
    """
    if len(values) < 2:
        return np.array([])
    return np.abs(np.diff(values))


# =============================================================================
# Sigma Within (Short-term)
# =============================================================================

def calculate_sigma_within(values: np.ndarray) -> tuple[float, float]:
    """
    Calculate within-subgroup sigma using MR̄/d2 method.

    σ_within = MR̄ / d2 where d2 = 1.128 for n=2

    Args:
        values: NumPy array of individual measurement values

    Returns:
        Tuple of (sigma_within, mr_bar)
    """
    if len(values) < 2:
        return 0.0, 0.0

    mr = calculate_moving_ranges(values)
    mr_bar = float(np.mean(mr))

    if mr_bar <= 0:
        return 0.0, mr_bar

    sigma_within = mr_bar / D2_CONSTANT
    return float(sigma_within), mr_bar


# =============================================================================
# Sigma Overall (Long-term)
# =============================================================================

def calculate_sigma_overall(values: np.ndarray) -> float:
    """
    Calculate overall sigma as sample standard deviation (ddof=1).

    Args:
        values: NumPy array of individual measurement values

    Returns:
        Overall standard deviation
    """
    if len(values) < 2:
        return 0.0

    std = np.std(values, ddof=1)
    if np.isnan(std):
        return 0.0
    return float(std)


# =============================================================================
# Main Entry Point
# =============================================================================

def estimate_sigma(values: np.ndarray) -> dict[str, Any]:
    """
    Estimate both Within and Overall sigma for capability analysis.

    Args:
        values: NumPy array of individual measurement values

    Returns:
        dict: {
            'sigma_within': float,  # MR̄/d2 - for Cp, Cpk
            'sigma_overall': float,  # sample std dev - for Pp, Ppk
            'mr_bar': float,         # Mean of moving ranges
        }
    """
    sigma_within, mr_bar = calculate_sigma_within(values)
    sigma_overall = calculate_sigma_overall(values)

    return {
        'sigma_within': sigma_within,
        'sigma_overall': sigma_overall,
        'mr_bar': mr_bar,
    }
