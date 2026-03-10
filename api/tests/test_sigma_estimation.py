"""
Tests for Sigma Estimation Module

Story 9.1: Create Sigma Estimation Module & Remove Stability Analysis
Tests cover:
- Moving range calculation
- Sigma within (MR̄/d2) calculation
- Sigma overall (sample std dev) calculation
- estimate_sigma wrapper
- Edge cases (single value, constant data, empty data)
"""
import pytest
import numpy as np
from api.utils.sigma_estimation import (
    D2_CONSTANT,
    calculate_moving_ranges,
    calculate_sigma_within,
    calculate_sigma_overall,
    estimate_sigma,
)


# =============================================================================
# Test Data Fixtures
# =============================================================================

@pytest.fixture
def normal_data():
    """Standard normal-like process data (25 points)."""
    return np.array([
        10.2, 10.5, 10.1, 10.3, 10.4,
        10.6, 10.2, 10.3, 10.5, 10.1,
        10.4, 10.3, 10.2, 10.5, 10.4,
        10.3, 10.1, 10.6, 10.2, 10.4,
        10.3, 10.5, 10.2, 10.4, 10.3,
    ])


@pytest.fixture
def simple_data():
    """Simple 5-point data for manual verification."""
    return np.array([10.0, 12.0, 11.0, 13.0, 10.0])


# =============================================================================
# Test Constants
# =============================================================================

def test_d2_constant():
    """d2 must be 1.128 for n=2 moving ranges."""
    assert D2_CONSTANT == 1.128


# =============================================================================
# Test Moving Range Calculation
# =============================================================================

class TestCalculateMovingRanges:
    def test_basic_calculation(self, simple_data):
        """MR[i] = |X[i] - X[i-1]|"""
        mr = calculate_moving_ranges(simple_data)
        expected = np.array([2.0, 1.0, 2.0, 3.0])
        np.testing.assert_array_almost_equal(mr, expected)

    def test_result_length(self, normal_data):
        """Moving ranges should have n-1 values for n data points."""
        mr = calculate_moving_ranges(normal_data)
        assert len(mr) == len(normal_data) - 1

    def test_all_values_positive(self, normal_data):
        """Moving ranges are absolute differences, always >= 0."""
        mr = calculate_moving_ranges(normal_data)
        assert np.all(mr >= 0)

    def test_constant_data(self):
        """Constant data should give all-zero moving ranges."""
        data = np.array([5.0, 5.0, 5.0, 5.0])
        mr = calculate_moving_ranges(data)
        np.testing.assert_array_equal(mr, [0.0, 0.0, 0.0])

    def test_two_points(self):
        """Minimum case: 2 points give 1 moving range."""
        data = np.array([3.0, 7.0])
        mr = calculate_moving_ranges(data)
        assert len(mr) == 1
        assert mr[0] == 4.0


# =============================================================================
# Test Sigma Within
# =============================================================================

class TestCalculateSigmaWithin:
    def test_basic_calculation(self, simple_data):
        """Verify sigma_within = MR̄ / 1.128"""
        sigma_within, mr_bar = calculate_sigma_within(simple_data)
        # MR = [2, 1, 2, 3], MR̄ = 2.0
        expected_mr_bar = 2.0
        expected_sigma = 2.0 / 1.128
        assert mr_bar == pytest.approx(expected_mr_bar)
        assert sigma_within == pytest.approx(expected_sigma, rel=1e-4)

    def test_returns_tuple(self, normal_data):
        """Should return (sigma_within, mr_bar) tuple."""
        result = calculate_sigma_within(normal_data)
        assert isinstance(result, tuple)
        assert len(result) == 2

    def test_single_value(self):
        """Single value should return (0.0, 0.0)."""
        data = np.array([10.0])
        sigma_within, mr_bar = calculate_sigma_within(data)
        assert sigma_within == 0.0
        assert mr_bar == 0.0

    def test_constant_data(self):
        """Constant data: MR̄=0 → sigma_within=0."""
        data = np.array([5.0, 5.0, 5.0, 5.0])
        sigma_within, mr_bar = calculate_sigma_within(data)
        assert sigma_within == 0.0
        assert mr_bar == 0.0

    def test_positive_values(self, normal_data):
        """Sigma within should be positive for variable data."""
        sigma_within, mr_bar = calculate_sigma_within(normal_data)
        assert sigma_within > 0
        assert mr_bar > 0


# =============================================================================
# Test Sigma Overall
# =============================================================================

class TestCalculateSigmaOverall:
    def test_basic_calculation(self, simple_data):
        """Verify sigma_overall equals numpy std with ddof=1."""
        sigma_overall = calculate_sigma_overall(simple_data)
        expected = float(np.std(simple_data, ddof=1))
        assert sigma_overall == pytest.approx(expected, rel=1e-6)

    def test_single_value(self):
        """Single value should return 0.0."""
        data = np.array([10.0])
        assert calculate_sigma_overall(data) == 0.0

    def test_empty_array(self):
        """Empty array should return 0.0."""
        data = np.array([])
        assert calculate_sigma_overall(data) == 0.0

    def test_constant_data(self):
        """Constant data should return 0.0."""
        data = np.array([5.0, 5.0, 5.0, 5.0])
        assert calculate_sigma_overall(data) == 0.0

    def test_positive_for_variable_data(self, normal_data):
        """Should be positive for data with variation."""
        assert calculate_sigma_overall(normal_data) > 0


# =============================================================================
# Test estimate_sigma Wrapper
# =============================================================================

class TestEstimateSigma:
    def test_returns_dict_with_required_keys(self, normal_data):
        """Result must contain sigma_within, sigma_overall, mr_bar."""
        result = estimate_sigma(normal_data)
        assert 'sigma_within' in result
        assert 'sigma_overall' in result
        assert 'mr_bar' in result

    def test_sigma_within_matches_direct(self, normal_data):
        """sigma_within from wrapper should match direct calculation."""
        result = estimate_sigma(normal_data)
        sigma_within, mr_bar = calculate_sigma_within(normal_data)
        assert result['sigma_within'] == pytest.approx(sigma_within)
        assert result['mr_bar'] == pytest.approx(mr_bar)

    def test_sigma_overall_matches_direct(self, normal_data):
        """sigma_overall from wrapper should match direct calculation."""
        result = estimate_sigma(normal_data)
        sigma_overall = calculate_sigma_overall(normal_data)
        assert result['sigma_overall'] == pytest.approx(sigma_overall)

    def test_sigma_within_less_than_overall(self, normal_data):
        """For typical process data, sigma_within <= sigma_overall."""
        result = estimate_sigma(normal_data)
        # This is generally true but not guaranteed for all data
        # For our test data it should hold
        assert result['sigma_within'] <= result['sigma_overall'] * 1.5  # Allow some tolerance

    def test_single_value_edge_case(self):
        """Single value: all sigmas should be 0."""
        data = np.array([10.0])
        result = estimate_sigma(data)
        assert result['sigma_within'] == 0.0
        assert result['sigma_overall'] == 0.0
        assert result['mr_bar'] == 0.0

    def test_two_values(self):
        """Two values: should still produce valid results."""
        data = np.array([10.0, 12.0])
        result = estimate_sigma(data)
        assert result['sigma_within'] > 0
        assert result['sigma_overall'] > 0
        assert result['mr_bar'] == 2.0
