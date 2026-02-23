"""
Stability Analysis Module - I-MR Control Charts

Provides I-MR control chart calculations and 7 stability rules evaluation
for Process Capability analysis. All implementations use pure Python/NumPy
(no scipy) to meet Vercel 250MB limit.

Story 7.3: Stability Analysis with I-MR Control Charts
FRs covered: FR-CP14, FR-CP15, FR-CP16

Control Chart Constants (AIAG SPC Manual, n=2):
- E2 = 2.66 (I-Chart control limit factor)
- D4 = 3.267 (MR-Chart upper control limit factor)
- D3 = 0 (MR-Chart lower control limit factor)
- d2 = 1.128 (Sigma estimation factor)
"""
import numpy as np
from typing import Any


# =============================================================================
# Statistical Constants (AIAG SPC Manual, n=2 for Moving Range)
# =============================================================================

E2 = 2.66    # I-Chart control limit factor
D4 = 3.267   # MR-Chart upper control limit factor
D3 = 0       # MR-Chart lower control limit factor
d2 = 1.128   # Sigma estimation factor


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
    return np.abs(np.diff(values))


# =============================================================================
# I-Chart Control Limits
# =============================================================================

def calculate_i_chart_limits(values: np.ndarray, moving_ranges: np.ndarray) -> dict[str, float]:
    """
    Calculate I-Chart (Individual Values) control limits.

    Control limits:
    - Center line (CL) = X̄ (mean of all individual values)
    - UCL = X̄ + E2 × MR̄ = X̄ + 2.66 × MR̄
    - LCL = X̄ - E2 × MR̄ = X̄ - 2.66 × MR̄

    Args:
        values: NumPy array of individual values
        moving_ranges: NumPy array of moving ranges

    Returns:
        dict: {
            'center': float,  # X̄ - Center line
            'ucl': float,     # Upper Control Limit
            'lcl': float,     # Lower Control Limit
            'mr_bar': float   # Mean of moving ranges
        }
    """
    x_bar = float(np.mean(values))
    mr_bar = float(np.mean(moving_ranges))

    ucl = x_bar + E2 * mr_bar
    lcl = x_bar - E2 * mr_bar

    return {
        'center': x_bar,
        'ucl': ucl,
        'lcl': lcl,
        'mr_bar': mr_bar
    }


# =============================================================================
# MR-Chart Control Limits
# =============================================================================

def calculate_mr_chart_limits(moving_ranges: np.ndarray) -> dict[str, float]:
    """
    Calculate MR-Chart (Moving Range) control limits.

    Control limits:
    - Center line (CL) = MR̄ (mean of moving ranges)
    - UCL = D4 × MR̄ = 3.267 × MR̄
    - LCL = D3 × MR̄ = 0

    Args:
        moving_ranges: NumPy array of moving ranges

    Returns:
        dict: {
            'center': float,  # MR̄ - Center line
            'ucl': float,     # Upper Control Limit
            'lcl': float      # Lower Control Limit (always 0)
        }
    """
    mr_bar = float(np.mean(moving_ranges))

    ucl = D4 * mr_bar
    lcl = D3 * mr_bar  # Always 0

    return {
        'center': mr_bar,
        'ucl': ucl,
        'lcl': lcl
    }


# =============================================================================
# Out-of-Control Point Detection
# =============================================================================

def find_ooc_points_i_chart(values: np.ndarray, limits: dict[str, float]) -> list[dict[str, Any]]:
    """
    Find out-of-control points on I-Chart.

    Points are out of control if:
    - value > UCL (above upper control limit)
    - value < LCL (below lower control limit)

    Args:
        values: NumPy array of individual values
        limits: I-Chart limits dict with 'ucl' and 'lcl' keys

    Returns:
        List of dicts: [{'index': int, 'value': float, 'limit': 'UCL'|'LCL'}, ...]
    """
    ucl = limits['ucl']
    lcl = limits['lcl']
    ooc_points = []

    for i, val in enumerate(values):
        if val > ucl:
            ooc_points.append({
                'index': int(i),
                'value': float(val),
                'limit': 'UCL'
            })
        elif val < lcl:
            ooc_points.append({
                'index': int(i),
                'value': float(val),
                'limit': 'LCL'
            })

    return ooc_points


def find_ooc_points_mr_chart(moving_ranges: np.ndarray, limits: dict[str, float]) -> list[dict[str, Any]]:
    """
    Find out-of-control points on MR-Chart.

    Points are out of control if:
    - MR > UCL (above upper control limit)

    Note: LCL = 0 for MR chart, and MR values are always >= 0,
    so no lower limit violations are possible.

    Args:
        moving_ranges: NumPy array of moving ranges
        limits: MR-Chart limits dict with 'ucl' key

    Returns:
        List of dicts: [{'index': int, 'value': float}, ...]
    """
    ucl = limits['ucl']
    ooc_points = []

    for i, mr in enumerate(moving_ranges):
        if mr > ucl:
            ooc_points.append({
                'index': int(i),
                'value': float(mr)
            })

    return ooc_points


# =============================================================================
# Sigma Zone Calculation
# =============================================================================

def _calculate_sigma_zones(center: float, ucl: float, lcl: float) -> dict[str, float]:
    """
    Calculate sigma zones for stability rules 3, 4, 5.

    The distance from center to UCL represents 3σ (three sigma).
    Zones are:
    - 1σ zone: center ± (1/3) × (UCL - center)
    - 2σ zone: center ± (2/3) × (UCL - center)
    - 3σ zone: center to UCL/LCL

    Args:
        center: Center line (X̄)
        ucl: Upper Control Limit
        lcl: Lower Control Limit

    Returns:
        dict with zone boundaries
    """
    three_sigma = ucl - center
    one_sigma = three_sigma / 3
    two_sigma = (2 / 3) * three_sigma

    return {
        'center': center,
        '1_sigma_upper': center + one_sigma,
        '1_sigma_lower': center - one_sigma,
        '2_sigma_upper': center + two_sigma,
        '2_sigma_lower': center - two_sigma,
        '3_sigma_upper': ucl,
        '3_sigma_lower': lcl,
    }


# =============================================================================
# Stability Rules Implementation
# =============================================================================

def _rule_1_beyond_limits(values: np.ndarray, ucl: float, lcl: float) -> dict[str, Any]:
    """
    Rule 1: Points beyond 3σ (outside control limits).

    Detects points that are outside the upper or lower control limits.

    Args:
        values: Individual values array
        ucl: Upper Control Limit
        lcl: Lower Control Limit

    Returns:
        dict: {'cumple': bool, 'violations': list}
    """
    violations = []
    for i, val in enumerate(values):
        if val > ucl:
            violations.append({
                'index': int(i),
                'value': float(val),
                'limit': 'UCL'
            })
        elif val < lcl:
            violations.append({
                'index': int(i),
                'value': float(val),
                'limit': 'LCL'
            })

    return {'cumple': len(violations) == 0, 'violations': violations}


def _rule_2_trending(values: np.ndarray) -> dict[str, Any]:
    """
    Rule 2: 7 consecutive points trending up or down.

    Detects monotonic trends of 7 or more consecutive points.

    Args:
        values: Individual values array

    Returns:
        dict: {'cumple': bool, 'violations': list}
    """
    if len(values) < 7:
        return {'cumple': True, 'violations': []}

    violations = []
    n = len(values)

    # Calculate direction of change between consecutive points
    # +1 = increasing, -1 = decreasing, 0 = same
    directions = np.sign(np.diff(values))

    # Find runs of same non-zero direction
    run_start = 0
    run_direction = directions[0] if len(directions) > 0 else 0
    run_length = 1

    for i in range(1, len(directions)):
        if directions[i] == run_direction and run_direction != 0:
            run_length += 1
        else:
            # Check if completed run is >= 6 differences (7 points)
            if run_length >= 6:
                violations.append({
                    'start': int(run_start),
                    'end': int(run_start + run_length),
                    'direction': 'up' if run_direction > 0 else 'down'
                })
            run_start = i
            run_direction = directions[i]
            run_length = 1

    # Check final run
    if run_length >= 6:
        violations.append({
            'start': int(run_start),
            'end': int(run_start + run_length),
            'direction': 'up' if run_direction > 0 else 'down'
        })

    return {'cumple': len(violations) == 0, 'violations': violations}


def _rule_3_stratification(values: np.ndarray, zones: dict[str, float]) -> dict[str, Any]:
    """
    Rule 3: 7 consecutive points within 1σ of center (stratification).

    Detects unusual lack of variation - points too close to center.

    Args:
        values: Individual values array
        zones: Sigma zone boundaries

    Returns:
        dict: {'cumple': bool, 'violations': list}
    """
    if len(values) < 7:
        return {'cumple': True, 'violations': []}

    # Skip rule if no variation (all zones collapse to center)
    if zones['3_sigma_upper'] == zones['center']:
        return {'cumple': True, 'violations': []}

    violations = []
    upper_1sigma = zones['1_sigma_upper']
    lower_1sigma = zones['1_sigma_lower']

    # Check if value is within 1σ of center
    in_zone = (values >= lower_1sigma) & (values <= upper_1sigma)

    # Find runs of 7+ consecutive points in zone
    run_start = 0
    run_length = 0

    for i in range(len(values)):
        if in_zone[i]:
            if run_length == 0:
                run_start = i
            run_length += 1
        else:
            if run_length >= 7:
                violations.append({
                    'start': int(run_start),
                    'end': int(run_start + run_length - 1)
                })
            run_length = 0

    # Check final run
    if run_length >= 7:
        violations.append({
            'start': int(run_start),
            'end': int(run_start + run_length - 1)
        })

    return {'cumple': len(violations) == 0, 'violations': violations}


def _rule_4_upper_zone(values: np.ndarray, zones: dict[str, float]) -> dict[str, Any]:
    """
    Rule 4: 7 consecutive points between 2σ and 3σ above center.

    Detects points clustering in the upper zone near the control limit.

    Args:
        values: Individual values array
        zones: Sigma zone boundaries

    Returns:
        dict: {'cumple': bool, 'violations': list}
    """
    if len(values) < 7:
        return {'cumple': True, 'violations': []}

    # Skip rule if no variation (all zones collapse to center)
    if zones['3_sigma_upper'] == zones['center']:
        return {'cumple': True, 'violations': []}

    violations = []
    upper_2sigma = zones['2_sigma_upper']
    upper_3sigma = zones['3_sigma_upper']

    # Check if value is between 2σ and 3σ above center
    in_zone = (values >= upper_2sigma) & (values <= upper_3sigma)

    # Find runs of 7+ consecutive points in zone
    run_start = 0
    run_length = 0

    for i in range(len(values)):
        if in_zone[i]:
            if run_length == 0:
                run_start = i
            run_length += 1
        else:
            if run_length >= 7:
                violations.append({
                    'start': int(run_start),
                    'end': int(run_start + run_length - 1)
                })
            run_length = 0

    # Check final run
    if run_length >= 7:
        violations.append({
            'start': int(run_start),
            'end': int(run_start + run_length - 1)
        })

    return {'cumple': len(violations) == 0, 'violations': violations}


def _rule_5_lower_zone(values: np.ndarray, zones: dict[str, float]) -> dict[str, Any]:
    """
    Rule 5: 7 consecutive points between 2σ and 3σ below center.

    Detects points clustering in the lower zone near the control limit.

    Args:
        values: Individual values array
        zones: Sigma zone boundaries

    Returns:
        dict: {'cumple': bool, 'violations': list}
    """
    if len(values) < 7:
        return {'cumple': True, 'violations': []}

    # Skip rule if no variation (all zones collapse to center)
    if zones['3_sigma_upper'] == zones['center']:
        return {'cumple': True, 'violations': []}

    violations = []
    lower_2sigma = zones['2_sigma_lower']
    lower_3sigma = zones['3_sigma_lower']

    # Check if value is between 2σ and 3σ below center
    in_zone = (values >= lower_3sigma) & (values <= lower_2sigma)

    # Find runs of 7+ consecutive points in zone
    run_start = 0
    run_length = 0

    for i in range(len(values)):
        if in_zone[i]:
            if run_length == 0:
                run_start = i
            run_length += 1
        else:
            if run_length >= 7:
                violations.append({
                    'start': int(run_start),
                    'end': int(run_start + run_length - 1)
                })
            run_length = 0

    # Check final run
    if run_length >= 7:
        violations.append({
            'start': int(run_start),
            'end': int(run_start + run_length - 1)
        })

    return {'cumple': len(violations) == 0, 'violations': violations}


def _rule_6_cyclic(values: np.ndarray) -> dict[str, Any]:
    """
    Rule 6: 7 consecutive points in cyclic pattern (alternating).

    Detects alternating up-down-up-down pattern for 14+ points
    (which corresponds to 7+ alternating direction changes).

    Simplified: detect 7+ alternating direction changes.

    Args:
        values: Individual values array

    Returns:
        dict: {'cumple': bool, 'violations': list}
    """
    if len(values) < 8:  # Need at least 8 points for 7 alternations
        return {'cumple': True, 'violations': []}

    violations = []

    # Calculate direction of change between consecutive points
    directions = np.sign(np.diff(values))

    # Remove zeros (no change)
    non_zero_mask = directions != 0

    # Check for alternating pattern
    run_start = 0
    alternating_count = 0
    prev_direction = 0

    for i in range(len(directions)):
        if directions[i] == 0:
            # No change, reset alternation count
            if alternating_count >= 7:
                violations.append({
                    'start': int(run_start),
                    'end': int(i - 1),
                    'pattern': 'alternating'
                })
            alternating_count = 0
            prev_direction = 0
            continue

        if prev_direction == 0:
            # First direction in potential alternating sequence
            run_start = i
            prev_direction = directions[i]
            alternating_count = 1
        elif directions[i] != prev_direction:
            # Direction changed (alternation continues)
            alternating_count += 1
            prev_direction = directions[i]
        else:
            # Same direction (alternation broken)
            if alternating_count >= 7:
                violations.append({
                    'start': int(run_start),
                    'end': int(i - 1),
                    'pattern': 'alternating'
                })
            run_start = i
            prev_direction = directions[i]
            alternating_count = 1

    # Check final sequence
    if alternating_count >= 7:
        violations.append({
            'start': int(run_start),
            'end': int(len(directions) - 1),
            'pattern': 'alternating'
        })

    return {'cumple': len(violations) == 0, 'violations': violations}


def _rule_7_one_side(values: np.ndarray, center: float) -> dict[str, Any]:
    """
    Rule 7: 7 consecutive points above or below center line.

    Detects points clustering on one side of the center line.

    Args:
        values: Individual values array
        center: Center line (X̄)

    Returns:
        dict: {'cumple': bool, 'violations': list}
    """
    if len(values) < 7:
        return {'cumple': True, 'violations': []}

    violations = []

    # Determine which side of center each point is on
    # +1 = above, -1 = below, 0 = exactly at center
    sides = np.sign(values - center)

    # Find runs of 7+ consecutive points on same side
    run_start = 0
    run_side = sides[0]
    run_length = 1

    for i in range(1, len(values)):
        if sides[i] == run_side and run_side != 0:
            run_length += 1
        else:
            if run_length >= 7:
                violations.append({
                    'start': int(run_start),
                    'end': int(run_start + run_length - 1),
                    'side': 'above' if run_side > 0 else 'below'
                })
            run_start = i
            run_side = sides[i]
            run_length = 1

    # Check final run
    if run_length >= 7:
        violations.append({
            'start': int(run_start),
            'end': int(run_start + run_length - 1),
            'side': 'above' if run_side > 0 else 'below'
        })

    return {'cumple': len(violations) == 0, 'violations': violations}


# =============================================================================
# Evaluate All Stability Rules
# =============================================================================

def evaluate_stability_rules(values: np.ndarray, limits: dict[str, float]) -> dict[str, dict[str, Any]]:
    """
    Evaluate all 7 stability rules.

    Rules:
    1. Points beyond 3σ (outside control limits)
    2. 7 consecutive points trending up or down
    3. 7 consecutive points within 1σ of center (stratification)
    4. 7 consecutive points between 2σ and 3σ above center
    5. 7 consecutive points between 2σ and 3σ below center
    6. 7 consecutive points in cyclic pattern (alternating)
    7. 7 consecutive points above or below center line

    Args:
        values: NumPy array of individual values
        limits: I-Chart limits dict with 'center', 'ucl', 'lcl'

    Returns:
        dict: {
            'rule_1': {'cumple': bool, 'violations': list},
            'rule_2': {'cumple': bool, 'violations': list},
            ...
            'rule_7': {'cumple': bool, 'violations': list}
        }
    """
    center = limits['center']
    ucl = limits['ucl']
    lcl = limits['lcl']

    # Calculate sigma zones for rules 3, 4, 5
    zones = _calculate_sigma_zones(center, ucl, lcl)

    return {
        'rule_1': _rule_1_beyond_limits(values, ucl, lcl),
        'rule_2': _rule_2_trending(values),
        'rule_3': _rule_3_stratification(values, zones),
        'rule_4': _rule_4_upper_zone(values, zones),
        'rule_5': _rule_5_lower_zone(values, zones),
        'rule_6': _rule_6_cyclic(values),
        'rule_7': _rule_7_one_side(values, center),
    }


# =============================================================================
# Main Stability Analysis Wrapper
# =============================================================================

def perform_stability_analysis(values: np.ndarray) -> dict[str, Any]:
    """
    Perform complete stability analysis using I-MR control charts.

    Steps:
    1. Calculate moving ranges
    2. Calculate I-Chart control limits
    3. Calculate MR-Chart control limits
    4. Find out-of-control points for both charts
    5. Evaluate all 7 stability rules
    6. Determine overall stability conclusion

    Args:
        values: NumPy array of individual measurement values

    Returns:
        dict: {
            'is_stable': bool,
            'conclusion': 'Proceso Estable' | 'Proceso Inestable',
            'i_chart': {
                'center': float,
                'ucl': float,
                'lcl': float,
                'ooc_points': list
            },
            'mr_chart': {
                'center': float,
                'ucl': float,
                'lcl': float,
                'ooc_points': list
            },
            'rules': {
                'rule_1': {'cumple': bool, 'violations': list},
                ...
                'rule_7': {'cumple': bool, 'violations': list}
            },
            'sigma': float  # Within-subgroup std dev (MR̄/d2)
        }
    """
    # Step 1: Calculate moving ranges
    mr = calculate_moving_ranges(values)

    # Step 2: Calculate I-Chart limits
    i_limits = calculate_i_chart_limits(values, mr)

    # Step 3: Calculate MR-Chart limits
    mr_limits = calculate_mr_chart_limits(mr)

    # Step 4: Find out-of-control points
    i_ooc = find_ooc_points_i_chart(values, i_limits)
    mr_ooc = find_ooc_points_mr_chart(mr, mr_limits)

    # Step 5: Evaluate all 7 stability rules
    rules = evaluate_stability_rules(values, i_limits)

    # Step 6: Determine overall stability
    # Process is unstable if ANY rule is violated or ANY OOC point exists
    is_stable = all(rule['cumple'] for rule in rules.values())
    is_stable = is_stable and len(i_ooc) == 0 and len(mr_ooc) == 0

    # Calculate sigma (within-subgroup standard deviation)
    # σ_within = MR̄ / d2 where d2 = 1.128 for n=2
    mr_bar = i_limits['mr_bar']
    sigma = mr_bar / d2 if mr_bar > 0 else 0.0

    return {
        'is_stable': bool(is_stable),
        'conclusion': 'Proceso Estable' if is_stable else 'Proceso Inestable',
        'i_chart': {
            'center': float(i_limits['center']),
            'ucl': float(i_limits['ucl']),
            'lcl': float(i_limits['lcl']),
            'mr_bar': float(i_limits['mr_bar']),
            'ooc_points': i_ooc
        },
        'mr_chart': {
            'values': mr.tolist(),  # Moving range values for MR-Chart visualization
            'center': float(mr_limits['center']),
            'ucl': float(mr_limits['ucl']),
            'lcl': float(mr_limits['lcl']),
            'ooc_points': mr_ooc
        },
        'rules': rules,
        'sigma': float(sigma)
    }
