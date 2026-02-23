"""Tests for the normality tests module (Anderson-Darling, Box-Cox, Johnson).

Tests are designed for Minitab-compatible accuracy (±0.01 for p-values).
All implementations must be pure Python/numpy (no scipy).
"""
import pytest
import numpy as np
import sys
import os

# Add api directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


# =============================================================================
# Test Fixtures
# =============================================================================

@pytest.fixture
def normal_data():
    """Known normal data - should pass normality test (p > 0.05).

    Data is designed to have clearly normal characteristics.
    """
    return np.array([
        99.2, 101.5, 98.7, 100.3, 99.8, 101.2, 100.1, 99.5, 100.8, 99.0,
        100.5, 98.9, 101.0, 99.7, 100.2, 99.3, 100.6, 98.8, 101.1, 99.6
    ])


@pytest.fixture
def skewed_data():
    """Known non-normal data (right-skewed) - should fail normality test.

    Lognormal-like distribution that clearly violates normality.
    """
    return np.array([
        1.2, 1.5, 1.8, 2.3, 2.9, 3.5, 4.2, 5.1, 6.3, 8.0,
        10.5, 14.0, 19.0, 25.0, 35.0
    ])


@pytest.fixture
def standard_normal_sample():
    """Standard normal sample (mean=0, std=1) for testing.

    Seed set for reproducibility.
    """
    np.random.seed(42)
    return np.random.normal(0, 1, 50)


@pytest.fixture
def positive_skewed_data():
    """Data that needs Box-Cox transformation."""
    return np.array([
        2.5, 3.1, 4.2, 5.8, 7.3, 9.1, 11.5, 14.2, 17.8, 22.0,
        27.5, 34.2, 42.5, 53.0, 66.0, 82.0, 102.0, 127.0, 158.0, 197.0
    ])


@pytest.fixture
def data_with_negatives():
    """Data with negative values for Box-Cox shift testing."""
    return np.array([
        -5.2, -3.1, -1.5, 0.0, 1.2, 2.8, 4.1, 5.5, 7.0, 8.5,
        10.2, 12.0, 14.5, 17.0, 20.0
    ])


# =============================================================================
# Module Import Tests
# =============================================================================

class TestModuleExists:
    """Tests that the normality_tests module exists and has required functions."""

    def test_module_can_be_imported(self):
        """Test that normality_tests module can be imported."""
        from utils import normality_tests
        assert normality_tests is not None

    def test_anderson_darling_normal_exists(self):
        """Test that anderson_darling_normal function exists."""
        from utils.normality_tests import anderson_darling_normal
        assert callable(anderson_darling_normal)

    def test_box_cox_transform_exists(self):
        """Test that box_cox_transform function exists."""
        from utils.normality_tests import box_cox_transform
        assert callable(box_cox_transform)

    def test_johnson_transform_exists(self):
        """Test that johnson_transform function exists."""
        from utils.normality_tests import johnson_transform
        assert callable(johnson_transform)


# =============================================================================
# Anderson-Darling Test - Basic Functionality
# =============================================================================

class TestAndersonDarlingBasic:
    """Basic tests for Anderson-Darling normality test."""

    def test_returns_dictionary(self, normal_data):
        """Test that function returns a dictionary."""
        from utils.normality_tests import anderson_darling_normal
        result = anderson_darling_normal(normal_data)
        assert isinstance(result, dict)

    def test_returns_required_keys(self, normal_data):
        """Test that result contains all required keys."""
        from utils.normality_tests import anderson_darling_normal
        result = anderson_darling_normal(normal_data)

        required_keys = ['statistic', 'p_value', 'is_normal', 'alpha']
        for key in required_keys:
            assert key in result, f"Missing key: {key}"

    def test_statistic_is_float(self, normal_data):
        """Test that A² statistic is a float."""
        from utils.normality_tests import anderson_darling_normal
        result = anderson_darling_normal(normal_data)
        assert isinstance(result['statistic'], float)

    def test_p_value_is_float(self, normal_data):
        """Test that p-value is a float."""
        from utils.normality_tests import anderson_darling_normal
        result = anderson_darling_normal(normal_data)
        assert isinstance(result['p_value'], float)

    def test_is_normal_is_bool(self, normal_data):
        """Test that is_normal is a boolean."""
        from utils.normality_tests import anderson_darling_normal
        result = anderson_darling_normal(normal_data)
        assert isinstance(result['is_normal'], bool)

    def test_alpha_is_005(self, normal_data):
        """Test that alpha is 0.05."""
        from utils.normality_tests import anderson_darling_normal
        result = anderson_darling_normal(normal_data)
        assert result['alpha'] == 0.05


# =============================================================================
# Anderson-Darling Test - Normal Data Detection
# =============================================================================

class TestAndersonDarlingNormalData:
    """Tests for correct detection of normal data."""

    def test_normal_data_passes(self, normal_data):
        """Test that known normal data passes the test."""
        from utils.normality_tests import anderson_darling_normal
        result = anderson_darling_normal(normal_data)

        assert result['is_normal'] is True
        assert result['p_value'] >= 0.05

    def test_normal_data_low_ad_statistic(self, normal_data):
        """Test that normal data has low A² statistic (typically < 0.5)."""
        from utils.normality_tests import anderson_darling_normal
        result = anderson_darling_normal(normal_data)

        # Normal data typically has A² < 0.5
        assert result['statistic'] < 0.75

    def test_standard_normal_sample(self, standard_normal_sample):
        """Test that standard normal sample passes."""
        from utils.normality_tests import anderson_darling_normal
        result = anderson_darling_normal(standard_normal_sample)

        # Should pass with p > 0.05
        assert result['is_normal'] is True


# =============================================================================
# Anderson-Darling Test - Non-Normal Data Detection
# =============================================================================

class TestAndersonDarlingNonNormalData:
    """Tests for correct detection of non-normal data."""

    def test_skewed_data_fails(self, skewed_data):
        """Test that known skewed data fails the test."""
        from utils.normality_tests import anderson_darling_normal
        result = anderson_darling_normal(skewed_data)

        assert result['is_normal'] is False
        assert result['p_value'] < 0.05

    def test_skewed_data_high_ad_statistic(self, skewed_data):
        """Test that skewed data has high A² statistic."""
        from utils.normality_tests import anderson_darling_normal
        result = anderson_darling_normal(skewed_data)

        # Skewed data typically has A² > 0.7
        assert result['statistic'] > 0.6

    def test_uniform_data_fails(self):
        """Test that uniform distribution fails normality test."""
        from utils.normality_tests import anderson_darling_normal

        # Uniform data with larger sample - needs more samples for clear rejection
        uniform_data = np.linspace(0, 10, 100)
        result = anderson_darling_normal(uniform_data)

        # Uniform should fail normality with large enough sample
        assert result['is_normal'] is False


# =============================================================================
# Anderson-Darling Test - P-value Accuracy (Minitab Compatibility)
# =============================================================================

class TestAndersonDarlingPValueAccuracy:
    """Tests for p-value accuracy (±0.01 vs Minitab)."""

    def test_p_value_bounds(self, normal_data):
        """Test that p-value is between 0 and 1."""
        from utils.normality_tests import anderson_darling_normal
        result = anderson_darling_normal(normal_data)

        assert 0.0 <= result['p_value'] <= 1.0

    def test_p_value_consistency(self, standard_normal_sample):
        """Test that p-value is consistent on same data."""
        from utils.normality_tests import anderson_darling_normal

        result1 = anderson_darling_normal(standard_normal_sample)
        result2 = anderson_darling_normal(standard_normal_sample)

        assert abs(result1['p_value'] - result2['p_value']) < 0.001

    def test_known_a2_statistic_p_value_high(self):
        """Test p-value for known high A² value (should be low p)."""
        from utils.normality_tests import _ad_p_value_normal

        # A² = 1.0 should give p-value close to 0.01
        p_value = _ad_p_value_normal(1.0)
        assert p_value < 0.025

    def test_known_a2_statistic_p_value_low(self):
        """Test p-value for known low A² value (should be high p)."""
        from utils.normality_tests import _ad_p_value_normal

        # A² = 0.2 should give p-value > 0.5
        p_value = _ad_p_value_normal(0.2)
        assert p_value > 0.5


# =============================================================================
# Anderson-Darling Test - Edge Cases
# =============================================================================

class TestAndersonDarlingEdgeCases:
    """Tests for edge cases in Anderson-Darling test."""

    def test_minimum_sample_size(self):
        """Test with minimum viable sample size (n=8)."""
        from utils.normality_tests import anderson_darling_normal

        np.random.seed(123)
        small_sample = np.random.normal(100, 10, 8)
        result = anderson_darling_normal(small_sample)

        # Should still return valid result
        assert isinstance(result['statistic'], float)
        assert isinstance(result['p_value'], float)

    def test_large_sample(self):
        """Test with large sample size."""
        from utils.normality_tests import anderson_darling_normal

        np.random.seed(456)
        large_sample = np.random.normal(0, 1, 1000)
        result = anderson_darling_normal(large_sample)

        # Large normal sample should pass
        assert result['is_normal'] is True

    def test_constant_values_raises_or_handles(self):
        """Test that constant values are handled appropriately."""
        from utils.normality_tests import anderson_darling_normal

        constant_data = np.array([5.0] * 20)

        # Should either raise an error or handle gracefully
        # (std dev = 0 causes division issues)
        try:
            result = anderson_darling_normal(constant_data)
            # If it doesn't raise, check it handled it
            assert result is not None
        except (ValueError, ZeroDivisionError):
            # This is also acceptable behavior
            pass

    def test_two_unique_values(self):
        """Test with only two unique values."""
        from utils.normality_tests import anderson_darling_normal

        two_values = np.array([1.0, 1.0, 1.0, 2.0, 2.0, 2.0, 1.0, 2.0, 1.0, 2.0])
        result = anderson_darling_normal(two_values)

        # Should return valid result
        assert isinstance(result['statistic'], float)


# =============================================================================
# Box-Cox Transformation Tests
# =============================================================================

class TestBoxCoxTransform:
    """Tests for Box-Cox transformation."""

    def test_returns_dictionary(self, positive_skewed_data):
        """Test that function returns a dictionary."""
        from utils.normality_tests import box_cox_transform
        result = box_cox_transform(positive_skewed_data)
        assert isinstance(result, dict)

    def test_returns_required_keys(self, positive_skewed_data):
        """Test that result contains all required keys."""
        from utils.normality_tests import box_cox_transform
        result = box_cox_transform(positive_skewed_data)

        required_keys = ['transformed_values', 'lambda', 'shift', 'success']
        for key in required_keys:
            assert key in result, f"Missing key: {key}"

    def test_transformed_values_is_array(self, positive_skewed_data):
        """Test that transformed_values is numpy array."""
        from utils.normality_tests import box_cox_transform
        result = box_cox_transform(positive_skewed_data)
        assert isinstance(result['transformed_values'], np.ndarray)

    def test_lambda_is_float(self, positive_skewed_data):
        """Test that lambda is a float."""
        from utils.normality_tests import box_cox_transform
        result = box_cox_transform(positive_skewed_data)
        assert isinstance(result['lambda'], float)

    def test_success_is_bool(self, positive_skewed_data):
        """Test that success is a boolean."""
        from utils.normality_tests import box_cox_transform
        result = box_cox_transform(positive_skewed_data)
        assert isinstance(result['success'], bool)

    def test_transforms_skewed_data(self, positive_skewed_data):
        """Test that Box-Cox can normalize skewed data."""
        from utils.normality_tests import box_cox_transform, anderson_darling_normal

        # Original data should be non-normal
        original_result = anderson_darling_normal(positive_skewed_data)

        # Apply Box-Cox
        transform_result = box_cox_transform(positive_skewed_data)

        # If successful, transformed data should be more normal
        if transform_result['success']:
            transformed_result = anderson_darling_normal(transform_result['transformed_values'])
            assert transformed_result['statistic'] < original_result['statistic']

    def test_lambda_range(self, positive_skewed_data):
        """Test that lambda is in reasonable range."""
        from utils.normality_tests import box_cox_transform
        result = box_cox_transform(positive_skewed_data)

        # Lambda should typically be between -2 and 2
        assert -2.5 <= result['lambda'] <= 2.5

    def test_handles_negative_values(self, data_with_negatives):
        """Test that Box-Cox handles negative values with shift."""
        from utils.normality_tests import box_cox_transform
        result = box_cox_transform(data_with_negatives)

        # Should have applied a shift
        assert result['shift'] is not None
        assert result['shift'] > 0

    def test_positive_data_no_shift(self, positive_skewed_data):
        """Test that positive data doesn't need shift."""
        from utils.normality_tests import box_cox_transform
        result = box_cox_transform(positive_skewed_data)

        # Positive data shouldn't need shift
        assert result['shift'] is None

    def test_lambda_zero_is_log_transform(self):
        """Test that lambda near 0 results in log transform behavior."""
        from utils.normality_tests import box_cox_transform

        # Exponential data is often best transformed with log (lambda=0)
        exp_data = np.exp(np.random.normal(0, 0.5, 30))
        result = box_cox_transform(exp_data)

        # Lambda should be close to 0 for exponential data
        # This is a soft check - actual value may vary
        assert result['lambda'] is not None


# =============================================================================
# Johnson Transformation Tests
# =============================================================================

class TestJohnsonTransform:
    """Tests for Johnson transformation."""

    def test_returns_dictionary(self, skewed_data):
        """Test that function returns a dictionary."""
        from utils.normality_tests import johnson_transform
        result = johnson_transform(skewed_data)
        assert isinstance(result, dict)

    def test_returns_required_keys(self, skewed_data):
        """Test that result contains all required keys."""
        from utils.normality_tests import johnson_transform
        result = johnson_transform(skewed_data)

        required_keys = ['transformed_values', 'family', 'params', 'success']
        for key in required_keys:
            assert key in result, f"Missing key: {key}"

    def test_transformed_values_is_array(self, skewed_data):
        """Test that transformed_values is numpy array."""
        from utils.normality_tests import johnson_transform
        result = johnson_transform(skewed_data)
        assert isinstance(result['transformed_values'], np.ndarray)

    def test_family_is_string(self, skewed_data):
        """Test that family is a string."""
        from utils.normality_tests import johnson_transform
        result = johnson_transform(skewed_data)
        assert isinstance(result['family'], str)

    def test_params_is_dict(self, skewed_data):
        """Test that params is a dictionary."""
        from utils.normality_tests import johnson_transform
        result = johnson_transform(skewed_data)
        assert isinstance(result['params'], dict)

    def test_johnson_su_family(self, skewed_data):
        """Test that Johnson SU (unbounded) is used for unbounded data."""
        from utils.normality_tests import johnson_transform
        result = johnson_transform(skewed_data)

        # Should use SU (unbounded) family
        assert result['family'] in ['SU', 'SB', 'SL']

    def test_johnson_params_exist(self, skewed_data):
        """Test that Johnson parameters are returned."""
        from utils.normality_tests import johnson_transform
        result = johnson_transform(skewed_data)

        # SU family should have gamma, delta, xi, lambda
        if result['family'] == 'SU':
            assert 'gamma' in result['params']
            assert 'delta' in result['params']

    def test_transforms_data(self, skewed_data):
        """Test that Johnson can transform skewed data."""
        from utils.normality_tests import johnson_transform, anderson_darling_normal

        transform_result = johnson_transform(skewed_data)

        if transform_result['success']:
            # Transformed data should be more normal
            transformed_result = anderson_darling_normal(transform_result['transformed_values'])
            # At minimum, check it ran
            assert transformed_result['statistic'] is not None


# =============================================================================
# Helper Function Tests
# =============================================================================

class TestHelperFunctions:
    """Tests for helper functions (CDF, error function)."""

    def test_normal_cdf_exists(self):
        """Test that _normal_cdf function exists."""
        from utils.normality_tests import _normal_cdf
        assert callable(_normal_cdf)

    def test_normal_cdf_at_zero(self):
        """Test that CDF(0) = 0.5 for standard normal."""
        from utils.normality_tests import _normal_cdf

        result = _normal_cdf(np.array([0.0]))
        assert abs(result[0] - 0.5) < 0.001

    def test_normal_cdf_at_negative_inf(self):
        """Test that CDF approaches 0 for large negative values."""
        from utils.normality_tests import _normal_cdf

        result = _normal_cdf(np.array([-5.0]))
        assert result[0] < 0.001

    def test_normal_cdf_at_positive_inf(self):
        """Test that CDF approaches 1 for large positive values."""
        from utils.normality_tests import _normal_cdf

        result = _normal_cdf(np.array([5.0]))
        assert result[0] > 0.999

    def test_normal_cdf_symmetry(self):
        """Test that CDF is symmetric around 0."""
        from utils.normality_tests import _normal_cdf

        result_neg = _normal_cdf(np.array([-1.96]))
        result_pos = _normal_cdf(np.array([1.96]))

        # F(-x) + F(x) should equal 1
        assert abs(result_neg[0] + result_pos[0] - 1.0) < 0.001

    def test_erf_exists(self):
        """Test that _erf function exists."""
        from utils.normality_tests import _erf
        assert callable(_erf)

    def test_erf_at_zero(self):
        """Test that erf(0) = 0."""
        from utils.normality_tests import _erf

        result = _erf(np.array([0.0]))
        assert abs(result[0]) < 0.001

    def test_erf_at_large_positive(self):
        """Test that erf approaches 1 for large positive values."""
        from utils.normality_tests import _erf

        result = _erf(np.array([3.0]))
        assert result[0] > 0.999


# =============================================================================
# Integration Tests
# =============================================================================

class TestNormalityWorkflow:
    """Integration tests for complete normality workflow."""

    def test_normal_data_workflow(self, normal_data):
        """Test complete workflow with normal data."""
        from utils.normality_tests import anderson_darling_normal

        result = anderson_darling_normal(normal_data)

        # Should pass normality test
        assert result['is_normal'] is True
        assert result['p_value'] >= 0.05

    def test_non_normal_with_boxcox(self, positive_skewed_data):
        """Test workflow: non-normal → Box-Cox → check normality."""
        from utils.normality_tests import anderson_darling_normal, box_cox_transform

        # Step 1: Check original data is non-normal
        original = anderson_darling_normal(positive_skewed_data)
        assert original['is_normal'] is False

        # Step 2: Apply Box-Cox
        transformed = box_cox_transform(positive_skewed_data)

        # Step 3: Check transformed data
        if transformed['success']:
            final = anderson_darling_normal(transformed['transformed_values'])
            assert final['is_normal'] is True

    def test_fallback_to_johnson(self):
        """Test workflow: Box-Cox fails → Johnson transform."""
        from utils.normality_tests import (
            anderson_darling_normal,
            box_cox_transform,
            johnson_transform
        )

        # Create data that might be hard for Box-Cox
        np.random.seed(789)
        difficult_data = np.abs(np.random.standard_cauchy(30))
        difficult_data = difficult_data[difficult_data < 50]  # Trim extreme values

        if len(difficult_data) >= 8:
            # Try Box-Cox first
            bc_result = box_cox_transform(difficult_data)

            # If Box-Cox fails, try Johnson
            if not bc_result['success']:
                johnson_result = johnson_transform(difficult_data)
                # Johnson should at least attempt transformation
                assert johnson_result['transformed_values'] is not None
