"""Tests for the distribution fitting module.

Tests distribution parameter estimation, Anderson-Darling tests for non-normal
distributions, best distribution selection, and PPM calculation.

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
def weibull_data():
    """Data following Weibull distribution (shape k=2, scale λ=10)."""
    np.random.seed(42)
    # Generate Weibull data using inverse transform
    u = np.random.uniform(0, 1, 100)
    k, lam = 2.0, 10.0
    return lam * (-np.log(1 - u)) ** (1/k)


@pytest.fixture
def lognormal_data():
    """Data following Lognormal distribution (mu=1, sigma=0.5)."""
    np.random.seed(42)
    return np.random.lognormal(1.0, 0.5, 100)


@pytest.fixture
def gamma_data():
    """Data following Gamma distribution (shape=2, scale=3)."""
    np.random.seed(42)
    # Approximate gamma using sum of exponentials
    shape = 2
    scale = 3
    data = np.zeros(100)
    for i in range(100):
        # Sum of 'shape' exponential(scale) random variables
        data[i] = sum(np.random.exponential(scale) for _ in range(shape))
    return data


@pytest.fixture
def exponential_data():
    """Data following Exponential distribution (rate=0.5)."""
    np.random.seed(42)
    return np.random.exponential(2.0, 100)  # scale = 1/rate = 2


@pytest.fixture
def logistic_data():
    """Data following Logistic distribution (mu=10, s=2)."""
    np.random.seed(42)
    u = np.random.uniform(0, 1, 100)
    mu, s = 10.0, 2.0
    return mu + s * np.log(u / (1 - u))


@pytest.fixture
def extreme_value_data():
    """Data following Extreme Value (Gumbel) distribution (mu=5, beta=2)."""
    np.random.seed(42)
    u = np.random.uniform(0, 1, 100)
    mu, beta = 5.0, 2.0
    return mu - beta * np.log(-np.log(u))


@pytest.fixture
def normal_data():
    """Normal data for PPM calculations."""
    np.random.seed(42)
    return np.random.normal(100, 10, 100)


# =============================================================================
# Module Import Tests
# =============================================================================

class TestModuleExists:
    """Tests that the distribution_fitting module exists and has required functions."""

    def test_module_can_be_imported(self):
        """Test that distribution_fitting module can be imported."""
        from utils import distribution_fitting
        assert distribution_fitting is not None

    def test_fit_weibull_exists(self):
        """Test that fit_weibull function exists."""
        from utils.distribution_fitting import fit_weibull
        assert callable(fit_weibull)

    def test_fit_lognormal_exists(self):
        """Test that fit_lognormal function exists."""
        from utils.distribution_fitting import fit_lognormal
        assert callable(fit_lognormal)

    def test_fit_gamma_exists(self):
        """Test that fit_gamma function exists."""
        from utils.distribution_fitting import fit_gamma
        assert callable(fit_gamma)

    def test_fit_exponential_exists(self):
        """Test that fit_exponential function exists."""
        from utils.distribution_fitting import fit_exponential
        assert callable(fit_exponential)

    def test_fit_logistic_exists(self):
        """Test that fit_logistic function exists."""
        from utils.distribution_fitting import fit_logistic
        assert callable(fit_logistic)

    def test_fit_extreme_value_exists(self):
        """Test that fit_extreme_value function exists."""
        from utils.distribution_fitting import fit_extreme_value
        assert callable(fit_extreme_value)

    def test_fit_all_distributions_exists(self):
        """Test that fit_all_distributions function exists."""
        from utils.distribution_fitting import fit_all_distributions
        assert callable(fit_all_distributions)

    def test_calculate_ppm_exists(self):
        """Test that calculate_ppm function exists."""
        from utils.distribution_fitting import calculate_ppm
        assert callable(calculate_ppm)


# =============================================================================
# Weibull Fitting Tests
# =============================================================================

class TestFitWeibull:
    """Tests for Weibull distribution fitting."""

    def test_returns_dictionary(self, weibull_data):
        """Test that function returns a dictionary."""
        from utils.distribution_fitting import fit_weibull
        result = fit_weibull(weibull_data)
        assert isinstance(result, dict)

    def test_returns_required_keys(self, weibull_data):
        """Test that result contains all required keys."""
        from utils.distribution_fitting import fit_weibull
        result = fit_weibull(weibull_data)

        required_keys = ['distribution', 'params', 'ad_statistic', 'aic']
        for key in required_keys:
            assert key in result, f"Missing key: {key}"

    def test_distribution_name_is_weibull(self, weibull_data):
        """Test that distribution name is 'weibull'."""
        from utils.distribution_fitting import fit_weibull
        result = fit_weibull(weibull_data)
        assert result['distribution'] == 'weibull'

    def test_params_has_k_and_lambda(self, weibull_data):
        """Test that params contains k (shape) and lambda (scale)."""
        from utils.distribution_fitting import fit_weibull
        result = fit_weibull(weibull_data)

        assert 'k' in result['params']
        assert 'lambda' in result['params']

    def test_k_is_positive(self, weibull_data):
        """Test that shape parameter k is positive."""
        from utils.distribution_fitting import fit_weibull
        result = fit_weibull(weibull_data)
        assert result['params']['k'] > 0

    def test_lambda_is_positive(self, weibull_data):
        """Test that scale parameter lambda is positive."""
        from utils.distribution_fitting import fit_weibull
        result = fit_weibull(weibull_data)
        assert result['params']['lambda'] > 0

    def test_estimates_close_to_true_params(self, weibull_data):
        """Test that estimated parameters are close to true values."""
        from utils.distribution_fitting import fit_weibull
        result = fit_weibull(weibull_data)

        # True params: k=2, lambda=10
        # Allow generous tolerance for MLE estimation
        assert 1.0 < result['params']['k'] < 4.0
        assert 5.0 < result['params']['lambda'] < 15.0


# =============================================================================
# Lognormal Fitting Tests
# =============================================================================

class TestFitLognormal:
    """Tests for Lognormal distribution fitting."""

    def test_returns_dictionary(self, lognormal_data):
        """Test that function returns a dictionary."""
        from utils.distribution_fitting import fit_lognormal
        result = fit_lognormal(lognormal_data)
        assert isinstance(result, dict)

    def test_params_has_mu_and_sigma(self, lognormal_data):
        """Test that params contains mu and sigma."""
        from utils.distribution_fitting import fit_lognormal
        result = fit_lognormal(lognormal_data)

        assert 'mu' in result['params']
        assert 'sigma' in result['params']

    def test_sigma_is_positive(self, lognormal_data):
        """Test that sigma is positive."""
        from utils.distribution_fitting import fit_lognormal
        result = fit_lognormal(lognormal_data)
        assert result['params']['sigma'] > 0

    def test_estimates_close_to_true_params(self, lognormal_data):
        """Test that estimated parameters are close to true values."""
        from utils.distribution_fitting import fit_lognormal
        result = fit_lognormal(lognormal_data)

        # True params: mu=1, sigma=0.5
        assert 0.5 < result['params']['mu'] < 1.5
        assert 0.2 < result['params']['sigma'] < 0.8


# =============================================================================
# Gamma Fitting Tests
# =============================================================================

class TestFitGamma:
    """Tests for Gamma distribution fitting."""

    def test_returns_dictionary(self, gamma_data):
        """Test that function returns a dictionary."""
        from utils.distribution_fitting import fit_gamma
        result = fit_gamma(gamma_data)
        assert isinstance(result, dict)

    def test_params_has_alpha_and_beta(self, gamma_data):
        """Test that params contains alpha (shape) and beta (scale)."""
        from utils.distribution_fitting import fit_gamma
        result = fit_gamma(gamma_data)

        assert 'alpha' in result['params']
        assert 'beta' in result['params']

    def test_alpha_is_positive(self, gamma_data):
        """Test that shape parameter alpha is positive."""
        from utils.distribution_fitting import fit_gamma
        result = fit_gamma(gamma_data)
        assert result['params']['alpha'] > 0

    def test_beta_is_positive(self, gamma_data):
        """Test that scale parameter beta is positive."""
        from utils.distribution_fitting import fit_gamma
        result = fit_gamma(gamma_data)
        assert result['params']['beta'] > 0


# =============================================================================
# Exponential Fitting Tests
# =============================================================================

class TestFitExponential:
    """Tests for Exponential distribution fitting."""

    def test_returns_dictionary(self, exponential_data):
        """Test that function returns a dictionary."""
        from utils.distribution_fitting import fit_exponential
        result = fit_exponential(exponential_data)
        assert isinstance(result, dict)

    def test_params_has_lambda(self, exponential_data):
        """Test that params contains lambda (rate)."""
        from utils.distribution_fitting import fit_exponential
        result = fit_exponential(exponential_data)

        assert 'lambda' in result['params']

    def test_lambda_is_positive(self, exponential_data):
        """Test that rate parameter lambda is positive."""
        from utils.distribution_fitting import fit_exponential
        result = fit_exponential(exponential_data)
        assert result['params']['lambda'] > 0

    def test_estimate_close_to_true(self, exponential_data):
        """Test that estimated rate is close to true value."""
        from utils.distribution_fitting import fit_exponential
        result = fit_exponential(exponential_data)

        # True rate = 0.5 (scale = 2)
        assert 0.2 < result['params']['lambda'] < 1.0


# =============================================================================
# Logistic Fitting Tests
# =============================================================================

class TestFitLogistic:
    """Tests for Logistic distribution fitting."""

    def test_returns_dictionary(self, logistic_data):
        """Test that function returns a dictionary."""
        from utils.distribution_fitting import fit_logistic
        result = fit_logistic(logistic_data)
        assert isinstance(result, dict)

    def test_params_has_mu_and_s(self, logistic_data):
        """Test that params contains mu (location) and s (scale)."""
        from utils.distribution_fitting import fit_logistic
        result = fit_logistic(logistic_data)

        assert 'mu' in result['params']
        assert 's' in result['params']

    def test_s_is_positive(self, logistic_data):
        """Test that scale parameter s is positive."""
        from utils.distribution_fitting import fit_logistic
        result = fit_logistic(logistic_data)
        assert result['params']['s'] > 0


# =============================================================================
# Extreme Value (Gumbel) Fitting Tests
# =============================================================================

class TestFitExtremeValue:
    """Tests for Extreme Value (Gumbel) distribution fitting."""

    def test_returns_dictionary(self, extreme_value_data):
        """Test that function returns a dictionary."""
        from utils.distribution_fitting import fit_extreme_value
        result = fit_extreme_value(extreme_value_data)
        assert isinstance(result, dict)

    def test_params_has_mu_and_beta(self, extreme_value_data):
        """Test that params contains mu (location) and beta (scale)."""
        from utils.distribution_fitting import fit_extreme_value
        result = fit_extreme_value(extreme_value_data)

        assert 'mu' in result['params']
        assert 'beta' in result['params']

    def test_beta_is_positive(self, extreme_value_data):
        """Test that scale parameter beta is positive."""
        from utils.distribution_fitting import fit_extreme_value
        result = fit_extreme_value(extreme_value_data)
        assert result['params']['beta'] > 0


# =============================================================================
# AD Statistic and AIC Tests
# =============================================================================

class TestADandAIC:
    """Tests for Anderson-Darling statistic and AIC calculation."""

    def test_ad_statistic_is_float(self, weibull_data):
        """Test that AD statistic is a float."""
        from utils.distribution_fitting import fit_weibull
        result = fit_weibull(weibull_data)
        assert isinstance(result['ad_statistic'], float)

    def test_ad_statistic_is_non_negative(self, weibull_data):
        """Test that AD statistic is non-negative."""
        from utils.distribution_fitting import fit_weibull
        result = fit_weibull(weibull_data)
        assert result['ad_statistic'] >= 0

    def test_aic_is_float(self, weibull_data):
        """Test that AIC is a float."""
        from utils.distribution_fitting import fit_weibull
        result = fit_weibull(weibull_data)
        assert isinstance(result['aic'], float)

    def test_good_fit_has_low_ad(self, weibull_data):
        """Test that good fit has low AD statistic."""
        from utils.distribution_fitting import fit_weibull
        result = fit_weibull(weibull_data)

        # For data that actually follows Weibull, AD should be reasonable
        assert result['ad_statistic'] < 5.0


# =============================================================================
# Fit All Distributions Tests
# =============================================================================

class TestFitAllDistributions:
    """Tests for fitting all distributions and selecting best."""

    def test_returns_dictionary(self, lognormal_data):
        """Test that function returns a dictionary."""
        from utils.distribution_fitting import fit_all_distributions
        result = fit_all_distributions(lognormal_data)
        assert isinstance(result, dict)

    def test_returns_best_distribution(self, lognormal_data):
        """Test that result contains best distribution."""
        from utils.distribution_fitting import fit_all_distributions
        result = fit_all_distributions(lognormal_data)

        assert 'distribution' in result
        assert result['distribution'] in ['weibull', 'lognormal', 'gamma',
                                          'exponential', 'logistic', 'extreme_value']

    def test_returns_all_fits(self, lognormal_data):
        """Test that result contains all distribution fits."""
        from utils.distribution_fitting import fit_all_distributions
        result = fit_all_distributions(lognormal_data)

        assert 'all_fits' in result
        assert len(result['all_fits']) >= 1

    def test_selects_lognormal_for_lognormal_data(self, lognormal_data):
        """Test that lognormal is selected for lognormal data."""
        from utils.distribution_fitting import fit_all_distributions
        result = fit_all_distributions(lognormal_data)

        # Lognormal data should ideally fit lognormal best
        # But allow some flexibility due to sampling variation
        assert result['distribution'] in ['lognormal', 'weibull', 'gamma']


# =============================================================================
# PPM Calculation Tests
# =============================================================================

class TestCalculatePPM:
    """Tests for PPM (Parts Per Million) calculation."""

    def test_returns_dictionary(self, normal_data):
        """Test that function returns a dictionary."""
        from utils.distribution_fitting import calculate_ppm

        result = calculate_ppm('normal', {'mean': 100, 'std': 10}, 70, 130)
        assert isinstance(result, dict)

    def test_returns_required_keys(self, normal_data):
        """Test that result contains all required keys."""
        from utils.distribution_fitting import calculate_ppm

        result = calculate_ppm('normal', {'mean': 100, 'std': 10}, 70, 130)

        required_keys = ['ppm_below_lei', 'ppm_above_les', 'ppm_total']
        for key in required_keys:
            assert key in result, f"Missing key: {key}"

    def test_ppm_values_are_integers(self, normal_data):
        """Test that PPM values are integers."""
        from utils.distribution_fitting import calculate_ppm

        result = calculate_ppm('normal', {'mean': 100, 'std': 10}, 70, 130)

        assert isinstance(result['ppm_below_lei'], int)
        assert isinstance(result['ppm_above_les'], int)
        assert isinstance(result['ppm_total'], int)

    def test_ppm_values_are_non_negative(self, normal_data):
        """Test that PPM values are non-negative."""
        from utils.distribution_fitting import calculate_ppm

        result = calculate_ppm('normal', {'mean': 100, 'std': 10}, 70, 130)

        assert result['ppm_below_lei'] >= 0
        assert result['ppm_above_les'] >= 0
        assert result['ppm_total'] >= 0

    def test_total_equals_sum(self, normal_data):
        """Test that total PPM equals sum of below and above."""
        from utils.distribution_fitting import calculate_ppm

        result = calculate_ppm('normal', {'mean': 100, 'std': 10}, 70, 130)

        assert result['ppm_total'] == result['ppm_below_lei'] + result['ppm_above_les']

    def test_narrow_limits_high_ppm(self, normal_data):
        """Test that narrow spec limits result in high PPM."""
        from utils.distribution_fitting import calculate_ppm

        # Very narrow limits should give high PPM
        result = calculate_ppm('normal', {'mean': 100, 'std': 10}, 99, 101)

        # Should have significant PPM outside
        assert result['ppm_total'] > 100000  # At least 10%

    def test_wide_limits_low_ppm(self, normal_data):
        """Test that wide spec limits result in low PPM."""
        from utils.distribution_fitting import calculate_ppm

        # Wide limits (±6 sigma) should give very low PPM
        result = calculate_ppm('normal', {'mean': 100, 'std': 10}, 40, 160)

        # Should have very low PPM
        assert result['ppm_total'] < 10000


# =============================================================================
# PPM for Different Distributions
# =============================================================================

class TestPPMDifferentDistributions:
    """Tests for PPM calculation with different distributions."""

    def test_ppm_weibull(self):
        """Test PPM calculation for Weibull distribution."""
        from utils.distribution_fitting import calculate_ppm

        result = calculate_ppm('weibull', {'k': 2, 'lambda': 10}, 2, 20)
        assert result['ppm_total'] >= 0
        assert result['ppm_total'] <= 1_000_000

    def test_ppm_lognormal(self):
        """Test PPM calculation for Lognormal distribution."""
        from utils.distribution_fitting import calculate_ppm

        result = calculate_ppm('lognormal', {'mu': 2, 'sigma': 0.5}, 3, 20)
        assert result['ppm_total'] >= 0
        assert result['ppm_total'] <= 1_000_000

    def test_ppm_exponential(self):
        """Test PPM calculation for Exponential distribution."""
        from utils.distribution_fitting import calculate_ppm

        result = calculate_ppm('exponential', {'lambda': 0.5}, 0.1, 10)
        assert result['ppm_total'] >= 0
        assert result['ppm_total'] <= 1_000_000

    def test_ppm_logistic(self):
        """Test PPM calculation for Logistic distribution."""
        from utils.distribution_fitting import calculate_ppm

        result = calculate_ppm('logistic', {'mu': 10, 's': 2}, 2, 18)
        assert result['ppm_total'] >= 0
        assert result['ppm_total'] <= 1_000_000

    def test_ppm_extreme_value(self):
        """Test PPM calculation for Extreme Value distribution."""
        from utils.distribution_fitting import calculate_ppm

        result = calculate_ppm('extreme_value', {'mu': 5, 'beta': 2}, 0, 15)
        assert result['ppm_total'] >= 0
        assert result['ppm_total'] <= 1_000_000

    def test_ppm_gamma(self):
        """Test PPM calculation for Gamma distribution."""
        from utils.distribution_fitting import calculate_ppm

        result = calculate_ppm('gamma', {'alpha': 2, 'beta': 3}, 1, 20)
        assert result['ppm_total'] >= 0
        assert result['ppm_total'] <= 1_000_000


# =============================================================================
# CDF Function Tests
# =============================================================================

class TestCDFFunctions:
    """Tests for CDF helper functions."""

    def test_weibull_cdf_exists(self):
        """Test that _weibull_cdf function exists."""
        from utils.distribution_fitting import _weibull_cdf
        assert callable(_weibull_cdf)

    def test_lognormal_cdf_exists(self):
        """Test that _lognormal_cdf function exists."""
        from utils.distribution_fitting import _lognormal_cdf
        assert callable(_lognormal_cdf)

    def test_weibull_cdf_bounds(self):
        """Test that Weibull CDF is between 0 and 1."""
        from utils.distribution_fitting import _weibull_cdf

        k, lam = 2.0, 10.0
        cdf_value = _weibull_cdf(5.0, k, lam)

        assert 0 <= cdf_value <= 1

    def test_weibull_cdf_at_zero(self):
        """Test that Weibull CDF(0) = 0."""
        from utils.distribution_fitting import _weibull_cdf

        cdf_value = _weibull_cdf(0.0, 2.0, 10.0)
        assert abs(cdf_value) < 0.001


# =============================================================================
# Integration Tests
# =============================================================================

class TestDistributionFittingIntegration:
    """Integration tests for distribution fitting workflow."""

    def test_complete_workflow_weibull(self, weibull_data):
        """Test complete workflow with Weibull data."""
        from utils.distribution_fitting import fit_all_distributions, calculate_ppm

        # Fit distributions
        fit_result = fit_all_distributions(weibull_data)

        # Calculate PPM using fitted parameters
        ppm_result = calculate_ppm(
            fit_result['distribution'],
            fit_result['params'],
            lei=2.0,
            les=20.0
        )

        assert ppm_result['ppm_total'] >= 0

    def test_handles_edge_case_small_sample(self):
        """Test handling of small sample sizes."""
        from utils.distribution_fitting import fit_all_distributions

        # Small sample
        small_data = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0])
        result = fit_all_distributions(small_data)

        # Should still return a result
        assert result['distribution'] is not None
