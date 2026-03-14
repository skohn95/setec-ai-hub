"""
Tests for Hipótesis 2 Muestras Calculator Module

Tests cover:
- Descriptive statistics (AC 1)
- IQR outlier detection (AC 2)
- Sample size evaluation (AC 3, 4, 5)
- Normality analysis - normal data (AC 6)
- Normality analysis - non-normal robust (AC 7)
- Normality analysis - non-normal not robust (AC 7, 8)
- Box-Cox with zeros/negatives (AC 9)
- Box-Cox normality still fails (AC 10)
- Full orchestrator pipeline (AC 1-10)
"""
import numpy as np
import pytest

from api.utils.hipotesis_2_muestras_calculator import (
    _calculate_skewness,
    detect_outliers_iqr,
    calculate_descriptive_statistics,
    evaluate_sample_size,
    analyze_sample_normality,
    apply_box_cox_if_needed,
    perform_descriptive_normality_analysis,
    t_distribution_sf,
    _t_critical,
    perform_levene_test,
    perform_t_test,
    perform_hypothesis_tests,
    _build_histogram_bins,
    _build_boxplot_stats,
    _calculate_sample_ci,
    _build_chart_data,
    _generate_instructions,
    build_hipotesis_2_muestras_output,
)

# NOTE: analyze_sample_normality does not take sample_name parameter


# =============================================================================
# Test: Descriptive Statistics (AC 1)
# =============================================================================

class TestDescriptiveStatistics:
    """Test descriptive statistics calculation with known dataset."""

    def setup_method(self):
        self.known_data = np.array([10.2, 11.5, 9.8, 12.1, 10.7, 11.3, 10.9, 11.8, 10.4, 11.0])

    def test_descriptive_stats_known_dataset(self):
        result = calculate_descriptive_statistics(self.known_data, "Test Sample")

        assert result['n'] == 10
        assert result['mean'] == pytest.approx(10.97, abs=0.01)
        assert result['median'] == pytest.approx(10.95, abs=0.01)
        assert result['std_dev'] == pytest.approx(0.724, abs=0.01)
        assert result['sample_name'] == "Test Sample"

    def test_descriptive_stats_includes_skewness(self):
        result = calculate_descriptive_statistics(self.known_data, "Test")
        # Nearly symmetric data should have skewness close to 0
        assert 'skewness' in result
        assert abs(result['skewness']) < 1.0

    def test_descriptive_stats_includes_outliers(self):
        result = calculate_descriptive_statistics(self.known_data, "Test")
        assert 'outliers' in result
        assert 'outlier_count' in result['outliers']
        assert 'outlier_values' in result['outliers']

    def test_skewness_symmetric_data(self):
        symmetric = np.array([1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0])
        skew = _calculate_skewness(symmetric)
        assert abs(skew) < 0.1  # Nearly zero for uniform/symmetric

    def test_skewness_less_than_3_values(self):
        assert _calculate_skewness(np.array([1.0, 2.0])) == 0.0

    def test_skewness_constant_values(self):
        assert _calculate_skewness(np.array([5.0, 5.0, 5.0, 5.0])) == 0.0


# =============================================================================
# Test: IQR Outlier Detection (AC 2)
# =============================================================================

class TestOutlierDetection:
    """Test IQR outlier detection."""

    def test_outlier_detected_ac2(self):
        """AC 2: value 50 should be flagged as outlier in [10, 12, 11, 50, 13, 12, 11]."""
        data = np.array([10, 12, 11, 50, 13, 12, 11], dtype=float)
        result = detect_outliers_iqr(data)

        assert result['outlier_count'] >= 1
        assert 50.0 in result['outlier_values']

    def test_no_outliers(self):
        """No outliers in tightly grouped data."""
        data = np.array([5, 6, 7, 8, 9], dtype=float)
        result = detect_outliers_iqr(data)

        assert result['outlier_count'] == 0
        assert result['outlier_values'] == []

    def test_outlier_result_keys(self):
        data = np.array([10, 12, 11, 50, 13, 12, 11], dtype=float)
        result = detect_outliers_iqr(data)

        assert 'q1' in result
        assert 'q3' in result
        assert 'iqr' in result
        assert 'lower_fence' in result
        assert 'upper_fence' in result
        assert 'outlier_count' in result
        assert 'outlier_values' in result
        assert 'outlier_percentage' in result

    def test_outlier_percentage(self):
        data = np.array([10, 12, 11, 50, 13, 12, 11], dtype=float)
        result = detect_outliers_iqr(data)
        # At least 1 outlier out of 7 = ~14.3%
        assert result['outlier_percentage'] > 0


# =============================================================================
# Test: Sample Size Evaluation (AC 3, 4, 5)
# =============================================================================

class TestSampleSizeEvaluation:
    """Test sample size evaluation with TCL threshold at n=30."""

    def test_large_sample_ac3(self):
        """AC 3: n=45 → TCL applies."""
        result = evaluate_sample_size(45, "Test")
        assert result['tcl_applies'] is True
        assert result['small_sample_warning'] is False
        assert result['n'] == 45

    def test_small_sample_ac4(self):
        """AC 4: n=22 → small sample warning."""
        result = evaluate_sample_size(22, "Test")
        assert result['tcl_applies'] is False
        assert result['small_sample_warning'] is True
        assert result['n'] == 22

    def test_boundary_n30(self):
        """n=30 → TCL applies (boundary)."""
        result = evaluate_sample_size(30, "Test")
        assert result['tcl_applies'] is True
        assert result['small_sample_warning'] is False

    def test_minimum_valid_sample(self):
        """n=2 → small sample warning."""
        result = evaluate_sample_size(2, "Test")
        assert result['small_sample_warning'] is True
        assert result['tcl_applies'] is False

    def test_note_present(self):
        """Notes should be in Spanish."""
        result_large = evaluate_sample_size(45, "Test")
        result_small = evaluate_sample_size(22, "Test")
        assert 'TCL' in result_large['note'] or 'Teorema' in result_large['note']
        assert 'crítica' in result_small['note'] or 'pequeña' in result_small['note']


# =============================================================================
# Test: Normality - Normal Data (AC 6)
# =============================================================================

class TestNormalityNormalData:
    """Test normality analysis with data that should pass Anderson-Darling."""

    def test_normal_data_ac6(self):
        """AC 6: Normal data → is_normal=True, A² and p-value reported."""
        # Use a dataset that closely follows normal distribution
        np.random.seed(42)
        normal_data = np.random.normal(loc=50, scale=5, size=50)
        skew = _calculate_skewness(normal_data)
        outliers = detect_outliers_iqr(normal_data)

        result = analyze_sample_normality(
            normal_data, skew, outliers['outlier_count'], len(normal_data)
        )

        assert result['is_normal'] is True
        assert 'ad_statistic' in result
        assert 'p_value' in result
        assert result['p_value'] >= 0.05
        assert result['is_robust'] is None  # Not evaluated when normal
        assert result['robustness_details'] is None

    def test_normal_result_keys(self):
        np.random.seed(42)
        normal_data = np.random.normal(loc=10, scale=2, size=30)
        skew = _calculate_skewness(normal_data)
        outliers = detect_outliers_iqr(normal_data)

        result = analyze_sample_normality(
            normal_data, skew, outliers['outlier_count'], len(normal_data)
        )

        assert 'is_normal' in result
        assert 'ad_statistic' in result
        assert 'p_value' in result
        assert 'alpha' in result
        assert result['alpha'] == 0.05


# =============================================================================
# Test: Normality - Non-Normal Robust (AC 7)
# =============================================================================

class TestNormalityNonNormalRobust:
    """Test normality with non-normal but robust data."""

    def test_non_normal_robust_ac7(self):
        """AC 7: Non-normal with |skewness| < 1.0 and outliers < 5% → is_robust=True."""
        # Use uniform data that reliably fails Anderson-Darling but has low skewness
        np.random.seed(99)
        data = np.random.uniform(0, 10, 50)

        skew = _calculate_skewness(data)
        outliers = detect_outliers_iqr(data)

        result = analyze_sample_normality(
            data, skew, outliers['outlier_count'], len(data)
        )

        # Uniform(0,10) with n=50 should fail AD normality
        assert result['is_normal'] is False, "Expected uniform data to fail normality test"
        # Uniform has low skewness and no outliers → robust
        assert abs(skew) < 1.0, f"Unexpected skewness {skew} for uniform data"
        assert result['is_robust'] is True
        assert result['robustness_details'] is not None
        assert 'robustos' in result['robustness_details']


# =============================================================================
# Test: Normality - Non-Normal Not Robust → Box-Cox (AC 7, 8)
# =============================================================================

class TestNormalityNonNormalNotRobust:
    """Test normality with non-normal, non-robust data requiring Box-Cox."""

    def test_highly_skewed_not_robust(self):
        """AC 7: Highly skewed data → is_robust=False."""
        # Create highly right-skewed data (exponential distribution)
        np.random.seed(42)
        skewed_data = np.exp(np.random.normal(0, 1.5, 30))

        skew = _calculate_skewness(skewed_data)
        outliers = detect_outliers_iqr(skewed_data)

        result = analyze_sample_normality(
            skewed_data, skew, outliers['outlier_count'], len(skewed_data)
        )

        # Exponential data should fail normality and have high skewness
        assert result['is_normal'] is False, "Expected skewed data to fail normality"
        assert abs(skew) >= 1.0 or (outliers['outlier_count'] / len(skewed_data) * 100) >= 5.0, \
            "Expected skewed data to trigger non-robust criteria"
        assert result['is_robust'] is False
        assert result['robustness_details'] is not None


# =============================================================================
# Test: Box-Cox Transformation (AC 8, 9, 10)
# =============================================================================

class TestBoxCoxTransformation:
    """Test Box-Cox transformation logic."""

    def test_boxcox_not_needed_when_normal(self):
        """Box-Cox should not be applied when both samples are normal."""
        np.random.seed(42)
        sample_a = np.random.normal(50, 5, 30)
        sample_b = np.random.normal(55, 5, 30)

        norm_a = {'is_normal': True, 'is_robust': None}
        norm_b = {'is_normal': True, 'is_robust': None}

        result = apply_box_cox_if_needed(sample_a, sample_b, norm_a, norm_b)
        assert result['applied'] is False
        assert result['using_transformed_data'] is False

    def test_boxcox_not_needed_when_robust(self):
        """Box-Cox should not be applied when non-normal but robust."""
        np.random.seed(42)
        sample_a = np.random.normal(50, 5, 30)
        sample_b = np.random.normal(55, 5, 30)

        norm_a = {'is_normal': False, 'is_robust': True}
        norm_b = {'is_normal': False, 'is_robust': True}

        result = apply_box_cox_if_needed(sample_a, sample_b, norm_a, norm_b)
        assert result['applied'] is False

    def test_boxcox_with_zeros_ac9(self):
        """AC 9: Box-Cox skipped when data contains zeros."""
        data_with_zeros = np.array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], dtype=float)
        sample_b = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], dtype=float)

        norm_a = {'is_normal': False, 'is_robust': False}
        norm_b = {'is_normal': False, 'is_robust': False}

        result = apply_box_cox_if_needed(data_with_zeros, sample_b, norm_a, norm_b)
        assert result['applied'] is False
        assert 'Box-Cox no aplicable' in result['warning']
        assert 'datos <= 0' in result['warning']

    def test_boxcox_with_negatives_ac9(self):
        """AC 9: Box-Cox skipped when data contains negatives."""
        data_with_negatives = np.array([-5, -1, 0, 2, 5, 8, 10, 12, 15, 20], dtype=float)
        sample_b = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], dtype=float)

        norm_a = {'is_normal': False, 'is_robust': False}
        norm_b = {'is_normal': False, 'is_robust': False}

        result = apply_box_cox_if_needed(data_with_negatives, sample_b, norm_a, norm_b)
        assert result['applied'] is False
        assert 'Box-Cox no aplicable' in result['warning']

    def test_boxcox_applied_to_both_samples_ac8(self):
        """AC 8: When Box-Cox is needed, applied to BOTH samples."""
        np.random.seed(42)
        # Positive, non-normal data
        sample_a = np.exp(np.random.normal(2, 0.5, 30))
        sample_b = np.exp(np.random.normal(2.5, 0.5, 30))

        norm_a = {'is_normal': False, 'is_robust': False}
        norm_b = {'is_normal': True, 'is_robust': None}  # Only A triggers

        result = apply_box_cox_if_needed(sample_a, sample_b, norm_a, norm_b)
        assert result['applied'] is True
        assert result['lambda_a'] is not None
        assert result['lambda_b'] is not None

    def test_boxcox_normality_still_fails_ac10(self):
        """AC 10: Warning when Box-Cox doesn't achieve normality."""
        # Create strongly bimodal data that Box-Cox cannot normalize
        bimodal = np.concatenate([
            np.array([1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9]),
            np.array([100.0, 101.0, 102.0, 103.0, 104.0, 105.0, 106.0, 107.0, 108.0, 109.0]),
        ])
        sample_b = np.concatenate([
            np.array([2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9]),
            np.array([200.0, 201.0, 202.0, 203.0, 204.0, 205.0, 206.0, 207.0, 208.0, 209.0]),
        ])

        norm_a = {'is_normal': False, 'is_robust': False}
        norm_b = {'is_normal': False, 'is_robust': False}

        result = apply_box_cox_if_needed(bimodal, sample_b, norm_a, norm_b)
        assert result['applied'] is True
        # Bimodal data should not achieve normality via Box-Cox
        assert result['normality_improved'] is False, \
            "Expected bimodal data to resist Box-Cox normalization"
        assert 'no logró normalidad' in result['warning']
        assert result['using_transformed_data'] is False


# =============================================================================
# Test: Full Orchestrator Pipeline (AC 1-10)
# =============================================================================

class TestOrchestratorPipeline:
    """Test complete analysis pipeline end-to-end."""

    def test_full_pipeline_normal_data(self):
        """End-to-end test with normal data."""
        np.random.seed(42)
        sample_a = np.random.normal(50, 5, 40)
        sample_b = np.random.normal(55, 5, 40)

        result = perform_descriptive_normality_analysis(
            sample_a, sample_b, ['Muestra A', 'Muestra B']
        )

        # Verify complete structure
        assert 'descriptive_a' in result
        assert 'descriptive_b' in result
        assert 'sample_size' in result
        assert 'normality_a' in result
        assert 'normality_b' in result
        assert 'box_cox' in result
        assert 'warnings' in result
        assert 'data_for_tests' in result

        # Verify descriptive stats
        assert result['descriptive_a']['n'] == 40
        assert result['descriptive_b']['n'] == 40
        assert result['descriptive_a']['sample_name'] == 'Muestra A'
        assert result['descriptive_b']['sample_name'] == 'Muestra B'

        # Verify sample size
        assert result['sample_size']['a']['tcl_applies'] is True
        assert result['sample_size']['b']['tcl_applies'] is True

        # Verify data_for_tests
        assert len(result['data_for_tests']['sample_a']) == 40
        assert len(result['data_for_tests']['sample_b']) == 40

    def test_full_pipeline_mixed_sizes_ac5(self):
        """AC 5: Mixed sample sizes n=50 and n=18."""
        np.random.seed(42)
        sample_a = np.random.normal(50, 5, 50)
        sample_b = np.random.normal(55, 5, 18)

        result = perform_descriptive_normality_analysis(
            sample_a, sample_b, ['Muestra A', 'Muestra B']
        )

        # TCL applies only to A (n=50)
        assert result['sample_size']['a']['tcl_applies'] is True
        assert result['sample_size']['a']['small_sample_warning'] is False

        # Critical warning only for B (n=18)
        assert result['sample_size']['b']['tcl_applies'] is False
        assert result['sample_size']['b']['small_sample_warning'] is True

    def test_full_pipeline_result_structure_keys(self):
        """Verify all expected keys in orchestrator output."""
        np.random.seed(42)
        sample_a = np.random.normal(50, 5, 30)
        sample_b = np.random.normal(55, 5, 30)

        result = perform_descriptive_normality_analysis(
            sample_a, sample_b, ['A', 'B']
        )

        # Top-level keys
        expected_keys = {
            'descriptive_a', 'descriptive_b', 'sample_size',
            'normality_a', 'normality_b', 'box_cox',
            'warnings', 'data_for_tests',
        }
        assert set(result.keys()) == expected_keys

        # Descriptive stats keys
        desc_keys = {'sample_name', 'n', 'mean', 'median', 'std_dev', 'skewness', 'outliers'}
        assert set(result['descriptive_a'].keys()) == desc_keys

        # Sample size keys
        size_keys = {'n', 'tcl_applies', 'small_sample_warning', 'note'}
        assert set(result['sample_size']['a'].keys()) == size_keys

        # Normality keys
        norm_keys = {'is_normal', 'ad_statistic', 'p_value', 'alpha', 'is_robust', 'robustness_details'}
        assert set(result['normality_a'].keys()) == norm_keys

        # Box-Cox keys
        bc_keys = {
            'applied', 'lambda_a', 'lambda_b', 'normality_improved',
            'using_transformed_data', 'transformed_a', 'transformed_b', 'warning',
        }
        assert set(result['box_cox'].keys()) == bc_keys

        # Data for tests keys
        assert set(result['data_for_tests'].keys()) == {'sample_a', 'sample_b'}

    def test_full_pipeline_small_samples(self):
        """Test pipeline with small samples (n < 30)."""
        np.random.seed(42)
        sample_a = np.random.normal(50, 5, 10)
        sample_b = np.random.normal(55, 5, 10)

        result = perform_descriptive_normality_analysis(
            sample_a, sample_b, ['A', 'B']
        )

        assert result['sample_size']['a']['small_sample_warning'] is True
        assert result['sample_size']['b']['small_sample_warning'] is True
        assert len(result['warnings']) >= 2  # Both samples warned

    def test_full_pipeline_warnings_list(self):
        """Warnings list should be a list of strings."""
        np.random.seed(42)
        sample_a = np.random.normal(50, 5, 10)
        sample_b = np.random.normal(55, 5, 10)

        result = perform_descriptive_normality_analysis(
            sample_a, sample_b, ['A', 'B']
        )

        assert isinstance(result['warnings'], list)
        for w in result['warnings']:
            assert isinstance(w, str)


# =============================================================================
# Test: t-Distribution Functions (AC 12)
# =============================================================================

class TestTDistributionFunctions:
    """Test t-distribution survival function and critical value computation."""

    def test_t_sf_zero_returns_half(self):
        """t=0 → sf=0.5 for any df."""
        assert t_distribution_sf(0, 10) == 0.5

    def test_t_sf_known_critical_value_95_two_tailed(self):
        """t=2.228, df=10 → sf ≈ 0.025 (two-tailed 95% critical value)."""
        result = t_distribution_sf(2.228, 10)
        assert result == pytest.approx(0.025, abs=0.002)

    def test_t_sf_known_critical_value_95_one_tailed(self):
        """t=1.812, df=10 → sf ≈ 0.05 (one-tailed 95%)."""
        result = t_distribution_sf(1.812, 10)
        assert result == pytest.approx(0.05, abs=0.002)

    def test_t_sf_negative_t_value(self):
        """Negative t: t=-2.0, df=10 → sf ≈ 0.963."""
        result = t_distribution_sf(-2.0, 10)
        assert result == pytest.approx(0.963, abs=0.005)

    def test_t_sf_large_df(self):
        """Large df approaches standard normal: t=1.96, df=1000 → sf ≈ 0.025."""
        result = t_distribution_sf(1.96, 1000)
        assert result == pytest.approx(0.025, abs=0.002)

    def test_t_sf_invalid_df(self):
        """df <= 0 → returns None."""
        assert t_distribution_sf(1.0, 0) is None
        assert t_distribution_sf(1.0, -1) is None

    def test_t_critical_95_two_sided(self):
        """_t_critical for 95% two-sided CI (alpha_tail=0.025, df=10) ≈ 2.228."""
        result = _t_critical(0.025, 10)
        assert result == pytest.approx(2.228, abs=0.01)

    def test_t_critical_90_two_sided(self):
        """_t_critical for 90% two-sided CI (alpha_tail=0.05, df=10) ≈ 1.812."""
        result = _t_critical(0.05, 10)
        assert result == pytest.approx(1.812, abs=0.01)

    def test_t_critical_99_two_sided(self):
        """_t_critical for 99% two-sided CI (alpha_tail=0.005, df=10) ≈ 3.169."""
        result = _t_critical(0.005, 10)
        assert result == pytest.approx(3.169, abs=0.02)


# =============================================================================
# Test: Levene's Test (AC 1, 2, 3)
# =============================================================================

class TestLeveneTest:
    """Test Levene's test for equality of variances (median variant)."""

    def test_equal_variances_ac2(self):
        """AC 2: Two samples with similar spread → p-value high, equal_variances=True."""
        np.random.seed(42)
        sample_a = np.random.normal(100, 5, 50)
        sample_b = np.random.normal(100, 5, 50)

        result = perform_levene_test(sample_a, sample_b, alpha=0.05)

        assert result['p_value'] >= 0.05
        assert result['equal_variances'] is True
        assert result['conclusion'] == 'Varianzas estadísticamente iguales'
        assert result['method'] == 'Levene (mediana)'
        assert result['df1'] == 1
        assert result['df2'] == 98  # N - 2 = 100 - 2

    def test_different_variances_ac3(self):
        """AC 3: Two samples with very different spread → p-value low, equal_variances=False."""
        np.random.seed(42)
        sample_a = np.random.normal(100, 2, 50)
        sample_b = np.random.normal(100, 10, 50)

        result = perform_levene_test(sample_a, sample_b, alpha=0.05)

        assert result['p_value'] < 0.05
        assert result['equal_variances'] is False
        assert result['conclusion'] == 'Varianzas estadísticamente diferentes'

    def test_levene_result_keys(self):
        """Verify all expected keys in Levene result."""
        np.random.seed(42)
        sample_a = np.random.normal(100, 5, 30)
        sample_b = np.random.normal(100, 5, 30)

        result = perform_levene_test(sample_a, sample_b)

        expected_keys = {'method', 'f_statistic', 'p_value', 'df1', 'df2',
                         'alpha', 'equal_variances', 'conclusion'}
        assert set(result.keys()) == expected_keys

    def test_levene_alpha_090(self):
        """Levene with alpha=0.10 threshold."""
        np.random.seed(42)
        sample_a = np.random.normal(100, 5, 50)
        sample_b = np.random.normal(100, 5, 50)

        result = perform_levene_test(sample_a, sample_b, alpha=0.10)
        assert result['alpha'] == 0.10


# =============================================================================
# Test: Pooled T-Test (AC 4, 6, 9)
# =============================================================================

class TestPooledTTest:
    """Test pooled (equal variance) t-test."""

    def test_pooled_t_test_known_dataset(self):
        """AC 4, 6: Pooled t-test with known verifiable results."""
        # Small dataset for hand-verifiable results
        sample_a = np.array([10.2, 11.5, 9.8, 12.1, 10.7], dtype=float)
        sample_b = np.array([13.4, 14.2, 12.8, 13.9, 14.5], dtype=float)

        result = perform_t_test(sample_a, sample_b, equal_variances=True,
                                confidence_level=0.95, alternative_hypothesis='two-sided')

        assert result['method'] == 't-test (varianzas agrupadas)'
        assert result['degrees_of_freedom'] == 8  # n1+n2-2 = 5+5-2
        assert result['t_statistic'] < 0  # mean_a < mean_b → negative t
        assert result['p_value'] < 0.05  # Means are clearly different
        assert result['ci_lower'] is not None
        assert result['ci_upper'] is not None
        assert result['equal_variances'] is True

    def test_pooled_t_test_result_keys(self):
        """Verify all expected keys in t-test result."""
        sample_a = np.array([10.0, 11.0, 12.0, 13.0, 14.0], dtype=float)
        sample_b = np.array([15.0, 16.0, 17.0, 18.0, 19.0], dtype=float)

        result = perform_t_test(sample_a, sample_b, equal_variances=True,
                                confidence_level=0.95, alternative_hypothesis='two-sided')

        expected_keys = {'method', 't_statistic', 'degrees_of_freedom', 'p_value',
                         'ci_lower', 'ci_upper', 'difference', 'alpha',
                         'confidence_level', 'alternative_hypothesis',
                         'equal_variances', 'conclusion'}
        assert set(result.keys()) == expected_keys

    def test_pooled_ci_contains_true_difference(self):
        """AC 9: CI should contain the true difference for equal-mean samples."""
        np.random.seed(42)
        sample_a = np.random.normal(100, 5, 50)
        sample_b = np.random.normal(100, 5, 50)

        result = perform_t_test(sample_a, sample_b, equal_variances=True,
                                confidence_level=0.95, alternative_hypothesis='two-sided')

        # True difference is 0; CI should contain 0
        assert result['ci_lower'] <= 0 <= result['ci_upper']


# =============================================================================
# Test: Welch T-Test (AC 5, 6, 9)
# =============================================================================

class TestWelchTTest:
    """Test Welch (unequal variance) t-test."""

    def test_welch_t_test(self):
        """AC 5, 6: Welch t-test with unequal variances."""
        np.random.seed(42)
        sample_a = np.random.normal(100, 2, 30)
        sample_b = np.random.normal(105, 10, 30)

        result = perform_t_test(sample_a, sample_b, equal_variances=False,
                                confidence_level=0.95, alternative_hypothesis='two-sided')

        assert result['method'] == 't-test de Welch'
        assert result['equal_variances'] is False
        # Welch df is fractional (not integer)
        assert isinstance(result['degrees_of_freedom'], float)
        assert result['degrees_of_freedom'] < 58  # Less than n1+n2-2 for unequal variances

    def test_welch_ci(self):
        """AC 9: Welch t-test CI for difference of means."""
        sample_a = np.array([10.2, 11.5, 9.8, 12.1, 10.7], dtype=float)
        sample_b = np.array([13.4, 14.2, 12.8, 13.9, 14.5], dtype=float)

        result = perform_t_test(sample_a, sample_b, equal_variances=False,
                                confidence_level=0.95, alternative_hypothesis='two-sided')

        # CI should not contain 0 since means are clearly different
        assert result['ci_upper'] < 0 or result['ci_lower'] > 0


# =============================================================================
# Test: One-Sided Hypotheses (AC 7, 8)
# =============================================================================

class TestOneSidedHypotheses:
    """Test one-sided alternative hypotheses."""

    def setup_method(self):
        np.random.seed(42)
        self.sample_a = np.random.normal(100, 5, 30)
        self.sample_b = np.random.normal(105, 5, 30)

    def test_greater_hypothesis_ac7(self):
        """AC 7: greater hypothesis (H1: muA > muB)."""
        result = perform_t_test(self.sample_a, self.sample_b, equal_variances=True,
                                confidence_level=0.95, alternative_hypothesis='greater')

        assert result['alternative_hypothesis'] == 'greater'
        # Since mean_a < mean_b, p-value for "greater" should be large
        assert result['p_value'] > 0.5
        # One-sided CI: only lower bound
        assert result['ci_lower'] is not None
        assert result['ci_upper'] is None

    def test_less_hypothesis_ac8(self):
        """AC 8: less hypothesis (H1: muA < muB)."""
        result = perform_t_test(self.sample_a, self.sample_b, equal_variances=True,
                                confidence_level=0.95, alternative_hypothesis='less')

        assert result['alternative_hypothesis'] == 'less'
        # Since mean_a < mean_b, p-value for "less" should be small
        assert result['p_value'] < 0.05
        # One-sided CI: only upper bound
        assert result['ci_lower'] is None
        assert result['ci_upper'] is not None

    def test_p_value_relationships(self):
        """Verify p-value relationships between alternatives."""
        two_sided = perform_t_test(self.sample_a, self.sample_b, equal_variances=True,
                                   confidence_level=0.95, alternative_hypothesis='two-sided')
        greater = perform_t_test(self.sample_a, self.sample_b, equal_variances=True,
                                  confidence_level=0.95, alternative_hypothesis='greater')
        less = perform_t_test(self.sample_a, self.sample_b, equal_variances=True,
                               confidence_level=0.95, alternative_hypothesis='less')

        # Two-sided p ≈ 2 * min(greater_p, less_p)
        assert two_sided['p_value'] == pytest.approx(2 * min(greater['p_value'], less['p_value']), abs=0.001)
        # greater_p + less_p ≈ 1.0
        assert greater['p_value'] + less['p_value'] == pytest.approx(1.0, abs=0.001)


# =============================================================================
# Test: Confidence Levels (AC 10, 11)
# =============================================================================

class TestConfidenceLevels:
    """Test different confidence levels."""

    def setup_method(self):
        np.random.seed(42)
        self.sample_a = np.random.normal(100, 5, 30)
        self.sample_b = np.random.normal(105, 5, 30)

    def test_ci_widths_increase_with_confidence(self):
        """AC 10, 11: CI widths: 90% < 95% < 99%."""
        ci_90 = perform_t_test(self.sample_a, self.sample_b, equal_variances=True,
                                confidence_level=0.90, alternative_hypothesis='two-sided')
        ci_95 = perform_t_test(self.sample_a, self.sample_b, equal_variances=True,
                                confidence_level=0.95, alternative_hypothesis='two-sided')
        ci_99 = perform_t_test(self.sample_a, self.sample_b, equal_variances=True,
                                confidence_level=0.99, alternative_hypothesis='two-sided')

        width_90 = ci_90['ci_upper'] - ci_90['ci_lower']
        width_95 = ci_95['ci_upper'] - ci_95['ci_lower']
        width_99 = ci_99['ci_upper'] - ci_99['ci_lower']

        assert width_90 < width_95 < width_99

    def test_confidence_level_in_result(self):
        """Confidence level is stored in result."""
        result = perform_t_test(self.sample_a, self.sample_b, equal_variances=True,
                                confidence_level=0.90, alternative_hypothesis='two-sided')
        assert result['confidence_level'] == 0.90
        assert result['alpha'] == pytest.approx(0.10)


# =============================================================================
# Test: Full Hypothesis Tests Orchestrator (AC 1-12)
# =============================================================================

class TestHypothesisTestsOrchestrator:
    """Test perform_hypothesis_tests end-to-end."""

    def test_full_pipeline_structure(self):
        """End-to-end: verify complete output structure."""
        np.random.seed(42)
        sample_a = np.random.normal(50, 5, 40)
        sample_b = np.random.normal(55, 5, 40)

        # First get descriptive/normality results
        calc_results = perform_descriptive_normality_analysis(
            sample_a, sample_b, ['Muestra A', 'Muestra B']
        )

        full_results = perform_hypothesis_tests(calc_results, 0.95, 'two-sided')

        # Should have all original keys plus new ones
        assert 'descriptive_a' in full_results
        assert 'descriptive_b' in full_results
        assert 'variance_test' in full_results
        assert 'means_test' in full_results
        assert 'data_for_tests' in full_results

    def test_pipeline_levene_drives_t_test_selection(self):
        """Levene result should determine pooled vs Welch."""
        np.random.seed(42)
        # Equal variance samples
        sample_a = np.random.normal(50, 5, 40)
        sample_b = np.random.normal(55, 5, 40)

        calc_results = perform_descriptive_normality_analysis(
            sample_a, sample_b, ['A', 'B']
        )
        full_results = perform_hypothesis_tests(calc_results, 0.95, 'two-sided')

        levene_eq = full_results['variance_test']['equal_variances']
        if levene_eq:
            assert full_results['means_test']['method'] == 't-test (varianzas agrupadas)'
        else:
            assert full_results['means_test']['method'] == 't-test de Welch'

    def test_pipeline_with_alternative_hypothesis(self):
        """Pipeline works with different alternative hypotheses."""
        np.random.seed(42)
        sample_a = np.random.normal(50, 5, 30)
        sample_b = np.random.normal(55, 5, 30)

        calc_results = perform_descriptive_normality_analysis(
            sample_a, sample_b, ['A', 'B']
        )

        for alt in ['two-sided', 'greater', 'less']:
            result = perform_hypothesis_tests(calc_results, 0.95, alt)
            assert result['means_test']['alternative_hypothesis'] == alt


# =============================================================================
# Test: Edge Cases
# =============================================================================

class TestEdgeCases:
    """Test edge cases for Levene and t-test."""

    def test_identical_samples(self):
        """Identical samples → t≈0, p≈1.0, CI includes 0."""
        data = np.array([10.0, 11.0, 12.0, 13.0, 14.0])
        result = perform_t_test(data, data.copy(), equal_variances=True,
                                confidence_level=0.95, alternative_hypothesis='two-sided')

        assert result['t_statistic'] == pytest.approx(0.0, abs=0.001)
        assert result['p_value'] == pytest.approx(1.0, abs=0.01)
        assert result['ci_lower'] <= 0 <= result['ci_upper']

    def test_very_small_samples_n2(self):
        """Very small samples (n=2 each) → valid results with large CI."""
        sample_a = np.array([10.0, 12.0])
        sample_b = np.array([15.0, 17.0])

        result = perform_t_test(sample_a, sample_b, equal_variances=True,
                                confidence_level=0.95, alternative_hypothesis='two-sided')

        assert result['degrees_of_freedom'] == 2  # n1+n2-2 = 2
        assert result['ci_lower'] is not None
        assert result['ci_upper'] is not None
        # CI should be wide due to small sample
        ci_width = result['ci_upper'] - result['ci_lower']
        assert ci_width > 5  # Wide CI for n=2

    def test_large_samples(self):
        """Large samples (n=200 each) → valid results."""
        np.random.seed(42)
        sample_a = np.random.normal(100, 5, 200)
        sample_b = np.random.normal(102, 5, 200)

        result = perform_t_test(sample_a, sample_b, equal_variances=True,
                                confidence_level=0.95, alternative_hypothesis='two-sided')

        assert result['degrees_of_freedom'] == 398  # 200+200-2
        assert result['p_value'] >= 0  # Valid p-value
        assert result['p_value'] <= 1

    def test_levene_identical_variance(self):
        """Levene with identical data → f_stat=0, p=1."""
        data = np.array([10.0, 11.0, 12.0, 13.0, 14.0])
        result = perform_levene_test(data, data.copy())

        assert result['f_statistic'] == pytest.approx(0.0, abs=0.001)
        assert result['equal_variances'] is True

    def test_zero_variance_samples(self):
        """Constant samples (zero variance) → t=0, valid result."""
        sample_a = np.array([5.0, 5.0, 5.0, 5.0, 5.0])
        sample_b = np.array([10.0, 10.0, 10.0, 10.0, 10.0])

        result = perform_t_test(sample_a, sample_b, equal_variances=True,
                                confidence_level=0.95, alternative_hypothesis='two-sided')

        # SE = 0 → t_stat guarded to 0
        assert result['t_statistic'] == 0.0

    def test_zero_variance_welch_no_crash(self):
        """Zero-variance samples with Welch should not crash (ZeroDivisionError guard)."""
        sample_a = np.array([5.0, 5.0, 5.0, 5.0, 5.0])
        sample_b = np.array([10.0, 10.0, 10.0, 10.0, 10.0])

        result = perform_t_test(sample_a, sample_b, equal_variances=False,
                                confidence_level=0.95, alternative_hypothesis='two-sided')

        assert result['t_statistic'] == 0.0
        assert result['method'] == 't-test de Welch'
        assert result['degrees_of_freedom'] == 8.0  # Fallback to pooled df

    def test_t_test_conclusion_spanish(self):
        """Conclusions should be in Spanish."""
        sample_a = np.array([10.0, 11.0, 12.0, 13.0, 14.0])
        sample_b = np.array([50.0, 51.0, 52.0, 53.0, 54.0])

        result = perform_t_test(sample_a, sample_b, equal_variances=True,
                                confidence_level=0.95, alternative_hypothesis='two-sided')

        assert result['conclusion'] == "Medias estadísticamente diferentes"

    def test_t_test_equal_means_conclusion(self):
        """Equal means → conclusion in Spanish."""
        np.random.seed(42)
        sample_a = np.random.normal(100, 5, 50)
        sample_b = np.random.normal(100, 5, 50)

        result = perform_t_test(sample_a, sample_b, equal_variances=True,
                                confidence_level=0.95, alternative_hypothesis='two-sided')

        assert result['conclusion'] == "Medias estadísticamente iguales"


# =============================================================================
# Test: Histogram Binning (Story 10.4, AC 3)
# =============================================================================

class TestHistogramBinning:
    """Test histogram binning function."""

    def test_histogram_bin_count_sturges(self):
        """Sturges' formula: k = ceil(1 + log2(10)) = 4 for n=10."""
        import math
        data = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], dtype=float)
        outliers_info = detect_outliers_iqr(data)
        result = _build_histogram_bins(data, "Muestra A", outliers_info)

        expected_k = math.ceil(1 + math.log2(10))  # 4
        assert len(result['data']['bins']) == expected_k

    def test_histogram_bins_cover_full_range(self):
        """Bins should cover the full data range."""
        data = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], dtype=float)
        outliers_info = detect_outliers_iqr(data)
        result = _build_histogram_bins(data, "Test", outliers_info)

        bins = result['data']['bins']
        assert bins[0]['start'] <= 1.0
        assert bins[-1]['end'] >= 10.0

    def test_histogram_counts_sum_to_n(self):
        """Sum of all bin counts should equal n."""
        data = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], dtype=float)
        outliers_info = detect_outliers_iqr(data)
        result = _build_histogram_bins(data, "Test", outliers_info)

        total = sum(b['count'] for b in result['data']['bins'])
        assert total == len(data)

    def test_histogram_includes_mean_and_sample_name(self):
        """Output should include mean and sampleName."""
        data = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], dtype=float)
        outliers_info = detect_outliers_iqr(data)
        result = _build_histogram_bins(data, "Muestra A", outliers_info)

        assert result['data']['mean'] == pytest.approx(5.5, abs=0.01)
        assert result['data']['sampleName'] == "Muestra A"

    def test_histogram_outliers_from_descriptive(self):
        """Outliers list should match descriptive stats outlier_values."""
        data = np.array([10, 12, 11, 50, 13, 12, 11], dtype=float)
        outliers_info = detect_outliers_iqr(data)
        result = _build_histogram_bins(data, "Test", outliers_info)

        assert 50.0 in result['data']['outliers']

    def test_histogram_type_field(self):
        """Result should have correct type field."""
        data = np.array([1, 2, 3, 4, 5], dtype=float)
        outliers_info = detect_outliers_iqr(data)
        result = _build_histogram_bins(data, "Test", outliers_info)

        assert result['type'] == 'histogram'

    def test_histogram_small_sample_n2(self):
        """Very small sample (n=2) should produce valid histogram."""
        data = np.array([5.0, 10.0])
        outliers_info = detect_outliers_iqr(data)
        result = _build_histogram_bins(data, "Test", outliers_info)

        assert len(result['data']['bins']) >= 1
        total = sum(b['count'] for b in result['data']['bins'])
        assert total == 2


# =============================================================================
# Test: Boxplot Statistics (Story 10.4, AC 4)
# =============================================================================

class TestBoxplotStats:
    """Test boxplot statistics function."""

    def test_boxplot_quartiles_known_dataset(self):
        """Verify q1, median, q3 match numpy percentiles."""
        data = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], dtype=float)
        outliers_info = detect_outliers_iqr(data)
        result = _build_boxplot_stats(data, "Test", outliers_info)

        assert result['median'] == pytest.approx(float(np.median(data)), abs=0.01)
        assert result['q1'] == pytest.approx(float(np.percentile(data, 25)), abs=0.01)
        assert result['q3'] == pytest.approx(float(np.percentile(data, 75)), abs=0.01)

    def test_boxplot_whiskers_non_outlier_extremes(self):
        """Min/max should be non-outlier extremes when outliers exist."""
        data = np.array([10, 11, 12, 13, 14, 50], dtype=float)
        outliers_info = detect_outliers_iqr(data)
        result = _build_boxplot_stats(data, "Test", outliers_info)

        # If 50 is an outlier, max should be 14 (last non-outlier)
        if outliers_info['outlier_count'] > 0:
            assert result['max'] < 50
        assert result['mean'] == pytest.approx(float(np.mean(data)), abs=0.01)

    def test_boxplot_outlier_values_match(self):
        """Outlier values should match descriptive stats."""
        data = np.array([10, 12, 11, 50, 13, 12, 11], dtype=float)
        outliers_info = detect_outliers_iqr(data)
        result = _build_boxplot_stats(data, "Test", outliers_info)

        assert 50.0 in result['outliers']

    def test_boxplot_result_keys(self):
        """Verify all expected keys."""
        data = np.array([1, 2, 3, 4, 5], dtype=float)
        outliers_info = detect_outliers_iqr(data)
        result = _build_boxplot_stats(data, "Test", outliers_info)

        expected_keys = {'name', 'min', 'q1', 'median', 'q3', 'max', 'outliers', 'mean'}
        assert set(result.keys()) == expected_keys

    def test_boxplot_no_outliers(self):
        """No outliers → min/max are actual extremes."""
        data = np.array([5, 6, 7, 8, 9], dtype=float)
        outliers_info = detect_outliers_iqr(data)
        result = _build_boxplot_stats(data, "Test", outliers_info)

        assert result['min'] == 5.0
        assert result['max'] == 9.0
        assert result['outliers'] == []


# =============================================================================
# Test: Individual Sample CI (Story 10.4, AC 5)
# =============================================================================

class TestSampleCI:
    """Test individual sample confidence interval computation."""

    def test_sample_ci_known_values(self):
        """Known dataset: t=2.262 for df=9, 95%."""
        data = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], dtype=float)
        ci_lower, ci_upper = _calculate_sample_ci(data, 0.95)

        mean = float(np.mean(data))
        assert ci_lower < mean < ci_upper

    def test_sample_ci_widths_increase_with_confidence(self):
        """CI widths: 90% < 95% < 99%."""
        data = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], dtype=float)

        ci90_l, ci90_u = _calculate_sample_ci(data, 0.90)
        ci95_l, ci95_u = _calculate_sample_ci(data, 0.95)
        ci99_l, ci99_u = _calculate_sample_ci(data, 0.99)

        width_90 = ci90_u - ci90_l
        width_95 = ci95_u - ci95_l
        width_99 = ci99_u - ci99_l

        assert width_90 < width_95 < width_99

    def test_sample_ci_symmetric_around_mean(self):
        """CI should be symmetric around the mean."""
        data = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], dtype=float)
        ci_lower, ci_upper = _calculate_sample_ci(data, 0.95)

        mean = float(np.mean(data))
        assert (mean - ci_lower) == pytest.approx(ci_upper - mean, abs=0.001)


# =============================================================================
# Test: Chart Data Builder (Story 10.4, AC 1, 3, 4, 5)
# =============================================================================

class TestChartDataBuilder:
    """Test chart data builder function."""

    def _make_full_results(self, seed=42):
        """Helper to create full_results from pipeline."""
        np.random.seed(seed)
        sample_a = np.random.normal(50, 5, 40)
        sample_b = np.random.normal(55, 5, 40)

        calc_results = perform_descriptive_normality_analysis(
            sample_a, sample_b, ['Muestra A', 'Muestra B']
        )
        return perform_hypothesis_tests(calc_results, 0.95, 'two-sided')

    def test_chart_data_returns_4_charts(self):
        """Exactly 4 charts returned."""
        full_results = self._make_full_results()
        charts = _build_chart_data(full_results, 0.95)
        assert len(charts) == 4

    def test_chart_data_types(self):
        """Chart types: histogram_a, histogram_b, boxplot_variance, boxplot_means."""
        full_results = self._make_full_results()
        charts = _build_chart_data(full_results, 0.95)

        types = [c['type'] for c in charts]
        assert types == ['histogram_a', 'histogram_b', 'boxplot_variance', 'boxplot_means']

    def test_boxplot_variance_includes_levene(self):
        """boxplot_variance has leveneTestPValue and leveneConclusion."""
        full_results = self._make_full_results()
        charts = _build_chart_data(full_results, 0.95)

        bpv = next(c for c in charts if c['type'] == 'boxplot_variance')
        assert 'leveneTestPValue' in bpv['data']
        assert 'leveneConclusion' in bpv['data']

    def test_boxplot_means_includes_ttest(self):
        """boxplot_means has tTestPValue, tTestConclusion, per-sample CI."""
        full_results = self._make_full_results()
        charts = _build_chart_data(full_results, 0.95)

        bpm = next(c for c in charts if c['type'] == 'boxplot_means')
        assert 'tTestPValue' in bpm['data']
        assert 'tTestConclusion' in bpm['data']
        for sample in bpm['data']['samples']:
            assert 'ciLower' in sample
            assert 'ciUpper' in sample

    def test_histogram_uses_data_for_tests(self):
        """Histograms should use data_for_tests arrays (possibly transformed)."""
        full_results = self._make_full_results()
        charts = _build_chart_data(full_results, 0.95)

        hist_a = next(c for c in charts if c['type'] == 'histogram_a')
        # Bin counts should sum to len(data_for_tests.sample_a)
        total = sum(b['count'] for b in hist_a['data']['bins'])
        assert total == len(full_results['data_for_tests']['sample_a'])


# =============================================================================
# Test: Instructions Generator (Story 10.4, AC 6, 7, 9)
# =============================================================================

class TestInstructionsGenerator:
    """Test instructions markdown generator."""

    def _make_full_results(self, seed=42):
        np.random.seed(seed)
        sample_a = np.random.normal(50, 5, 40)
        sample_b = np.random.normal(55, 5, 40)
        calc_results = perform_descriptive_normality_analysis(
            sample_a, sample_b, ['Muestra A', 'Muestra B']
        )
        return perform_hypothesis_tests(calc_results, 0.95, 'two-sided')

    def test_instructions_5_parts(self):
        """All 5 parts present."""
        full_results = self._make_full_results()
        instructions = _generate_instructions(full_results)

        assert 'PARTE 1' in instructions
        assert 'PARTE 2' in instructions
        assert 'PARTE 3' in instructions
        assert 'PARTE 4' in instructions
        assert 'PARTE 5' in instructions

    def test_instructions_agent_only_header(self):
        """AGENT_ONLY header present."""
        full_results = self._make_full_results()
        instructions = _generate_instructions(full_results)

        assert '<!-- AGENT_ONLY -->' in instructions
        assert '<!-- /AGENT_ONLY -->' in instructions

    def test_instructions_spanish_text(self):
        """All text should be in Spanish."""
        full_results = self._make_full_results()
        instructions = _generate_instructions(full_results)

        assert 'ESTADÍSTICOS DESCRIPTIVOS' in instructions
        assert 'NORMALIDAD' in instructions
        assert 'VARIANZAS' in instructions
        assert 'MEDIAS' in instructions
        assert 'CONCLUSIÓN TERRENAL' in instructions

    def test_instructions_no_raw_data(self):
        """No raw data arrays in instructions."""
        full_results = self._make_full_results()
        instructions = _generate_instructions(full_results)

        # Should not contain numpy array representations
        assert 'array(' not in instructions
        assert 'dtype=' not in instructions

    def test_instructions_caveats_small_sample(self):
        """Small sample caveat appears in terrenal section."""
        np.random.seed(42)
        sample_a = np.random.normal(50, 5, 10)  # n < 30
        sample_b = np.random.normal(55, 5, 10)
        calc_results = perform_descriptive_normality_analysis(
            sample_a, sample_b, ['A', 'B']
        )
        full_results = perform_hypothesis_tests(calc_results, 0.95, 'two-sided')

        instructions = _generate_instructions(full_results)

        assert 'precaución' in instructions.lower() or 'menos de 30' in instructions

    def test_instructions_caveats_boxcox_failed(self):
        """Box-Cox failed caveat should appear when applicable."""
        np.random.seed(42)
        # Create data that triggers Box-Cox but fails
        bimodal_a = np.concatenate([
            np.array([1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9]),
            np.array([100.0, 101.0, 102.0, 103.0, 104.0, 105.0, 106.0, 107.0, 108.0, 109.0]),
        ])
        bimodal_b = np.concatenate([
            np.array([2.0, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9]),
            np.array([200.0, 201.0, 202.0, 203.0, 204.0, 205.0, 206.0, 207.0, 208.0, 209.0]),
        ])
        calc_results = perform_descriptive_normality_analysis(
            bimodal_a, bimodal_b, ['A', 'B']
        )
        full_results = perform_hypothesis_tests(calc_results, 0.95, 'two-sided')

        instructions = _generate_instructions(full_results)

        # Box-Cox section or warning should be present if box_cox was applied
        if full_results['box_cox']['applied']:
            assert 'Box-Cox' in instructions


# =============================================================================
# Test: Output Builder (Story 10.4, AC 1, 2)
# =============================================================================

class TestOutputBuilder:
    """Test build_hipotesis_2_muestras_output end-to-end."""

    def _make_full_results(self, seed=42):
        np.random.seed(seed)
        sample_a = np.random.normal(50, 5, 40)
        sample_b = np.random.normal(55, 5, 40)
        calc_results = perform_descriptive_normality_analysis(
            sample_a, sample_b, ['Muestra A', 'Muestra B']
        )
        return perform_hypothesis_tests(calc_results, 0.95, 'two-sided')

    def test_output_structure(self):
        """Output has results, chartData, instructions."""
        full_results = self._make_full_results()
        output = build_hipotesis_2_muestras_output(full_results, [], 0.95)

        assert 'results' in output
        assert 'chartData' in output
        assert 'instructions' in output

    def test_output_results_keys(self):
        """Results dict has all required sections."""
        full_results = self._make_full_results()
        output = build_hipotesis_2_muestras_output(full_results, [], 0.95)

        results = output['results']
        expected_keys = {
            'descriptive_a', 'descriptive_b', 'sample_size',
            'normality_a', 'normality_b', 'box_cox',
            'variance_test', 'means_test', 'warnings',
        }
        assert set(results.keys()) == expected_keys

    def test_output_chart_data_is_list_of_4(self):
        """chartData is a list with 4 items."""
        full_results = self._make_full_results()
        output = build_hipotesis_2_muestras_output(full_results, [], 0.95)

        assert isinstance(output['chartData'], list)
        assert len(output['chartData']) == 4

    def test_output_instructions_is_string(self):
        """instructions is a non-empty string."""
        full_results = self._make_full_results()
        output = build_hipotesis_2_muestras_output(full_results, [], 0.95)

        assert isinstance(output['instructions'], str)
        assert len(output['instructions']) > 100

    def test_output_no_numpy_arrays(self):
        """No numpy arrays anywhere in output."""
        full_results = self._make_full_results()
        output = build_hipotesis_2_muestras_output(full_results, [], 0.95)

        import json
        # Should be JSON-serializable (no numpy)
        json_str = json.dumps(output)
        assert 'array' not in json_str

    def test_output_box_cox_stripped(self):
        """box_cox in results should NOT have transformed_a/b."""
        full_results = self._make_full_results()
        output = build_hipotesis_2_muestras_output(full_results, [], 0.95)

        bc = output['results']['box_cox']
        assert 'transformed_a' not in bc
        assert 'transformed_b' not in bc

    def test_output_warnings_merged(self):
        """Warnings from validation and analysis should be merged."""
        full_results = self._make_full_results()
        val_warnings = ['Advertencia de validación']
        output = build_hipotesis_2_muestras_output(full_results, val_warnings, 0.95)

        assert 'Advertencia de validación' in output['results']['warnings']

    def test_output_identical_samples(self):
        """Identical samples → valid output with meaningful terrenal."""
        data = np.array([10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0])
        calc_results = perform_descriptive_normality_analysis(
            data, data.copy(), ['A', 'B']
        )
        full_results = perform_hypothesis_tests(calc_results, 0.95, 'two-sided')
        output = build_hipotesis_2_muestras_output(full_results, [], 0.95)

        assert len(output['chartData']) == 4
        assert len(output['instructions']) > 50

    def test_output_very_small_samples_n2(self):
        """Very small samples (n=2) → valid output."""
        sample_a = np.array([10.0, 12.0])
        sample_b = np.array([15.0, 17.0])
        calc_results = perform_descriptive_normality_analysis(
            sample_a, sample_b, ['A', 'B']
        )
        full_results = perform_hypothesis_tests(calc_results, 0.95, 'two-sided')
        output = build_hipotesis_2_muestras_output(full_results, [], 0.95)

        assert len(output['chartData']) == 4
        assert isinstance(output['instructions'], str)


# =============================================================================
# Test: One-Sided Hypothesis Instructions Formatting (M1 review fix)
# =============================================================================

class TestOneSidedInstructions:
    """Test instructions correctly format one-sided hypothesis text."""

    def _make_full_results(self, alternative):
        np.random.seed(42)
        sample_a = np.random.normal(50, 5, 40)
        sample_b = np.random.normal(55, 5, 40)
        calc_results = perform_descriptive_normality_analysis(
            sample_a, sample_b, ['Muestra A', 'Muestra B']
        )
        return perform_hypothesis_tests(calc_results, 0.95, alternative)

    def test_greater_hypothesis_instructions(self):
        """Instructions for 'greater' should show H₁: μA > μB."""
        full_results = self._make_full_results('greater')
        instructions = _generate_instructions(full_results)

        assert 'μA > μB' in instructions
        assert 'μA ≠ μB' not in instructions

    def test_less_hypothesis_instructions(self):
        """Instructions for 'less' should show H₁: μA < μB."""
        full_results = self._make_full_results('less')
        instructions = _generate_instructions(full_results)

        assert 'μA < μB' in instructions
        assert 'μA ≠ μB' not in instructions

    def test_two_sided_hypothesis_instructions(self):
        """Instructions for 'two-sided' should show H₁: μA ≠ μB."""
        full_results = self._make_full_results('two-sided')
        instructions = _generate_instructions(full_results)

        assert 'μA ≠ μB' in instructions


# =============================================================================
# Test: Performance (Story 10.4, AC 8)
# =============================================================================

class TestPerformance:
    """Test performance requirement: < 30s for 1000 rows per sample."""

    def test_full_pipeline_under_30_seconds(self):
        """AC 8: Complete pipeline (1000 rows/sample) finishes in < 30s."""
        import time

        np.random.seed(42)
        sample_a = np.random.normal(100, 15, 1000)
        sample_b = np.random.normal(105, 15, 1000)

        start = time.time()

        calc_results = perform_descriptive_normality_analysis(
            sample_a, sample_b, ['Muestra A', 'Muestra B']
        )
        full_results = perform_hypothesis_tests(calc_results, 0.95, 'two-sided')
        output = build_hipotesis_2_muestras_output(full_results, [], 0.95)

        elapsed = time.time() - start

        assert elapsed < 30.0, f"Pipeline took {elapsed:.2f}s, exceeds 30s limit"
        assert len(output['chartData']) == 4
        assert isinstance(output['instructions'], str)
