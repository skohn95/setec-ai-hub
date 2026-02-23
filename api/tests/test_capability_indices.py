"""
Tests for Capability Indices Module

Story 7.4: Capability Indices & API Integration
Tests for Cp, Cpk, Pp, Ppk calculations and classifications.

Test coverage:
- sigma_within calculation (MR̄/d2)
- sigma_overall calculation (sample std dev)
- Cp calculation with known values
- Cpk calculation (balanced, Cpu limited, Cpl limited)
- Pp calculation
- Ppk calculation
- Specification limit validation
- Capability classification thresholds
- Edge cases (zero sigma, data at spec limits)
- Non-normal capability calculation
- PPM calculation accuracy
"""
import pytest
import numpy as np

from api.utils.capability_indices import (
    D2_CONSTANT,
    CAPABILITY_THRESHOLDS,
    validate_spec_limits,
    calculate_sigma_within,
    calculate_sigma_overall,
    calculate_cp,
    calculate_cpk,
    calculate_pp,
    calculate_ppk,
    classify_capability,
    calculate_ppm_normal,
    calculate_capability_indices,
    calculate_capability_non_normal,
    generate_capability_instructions,
)


# =============================================================================
# Test Constants
# =============================================================================

class TestConstants:
    """Test module constants are correct."""

    def test_d2_constant(self):
        """d2 should be 1.128 for n=2 moving range."""
        assert D2_CONSTANT == 1.128

    def test_capability_thresholds(self):
        """Capability thresholds should match industry standards."""
        assert CAPABILITY_THRESHOLDS['excellent'] == 1.67
        assert CAPABILITY_THRESHOLDS['adequate'] == 1.33
        assert CAPABILITY_THRESHOLDS['marginal'] == 1.00
        assert CAPABILITY_THRESHOLDS['inadequate'] == 0.67


# =============================================================================
# Test Sigma Calculations
# =============================================================================

class TestSigmaCalculations:
    """Test sigma (standard deviation) calculations."""

    def test_sigma_within_basic(self):
        """sigma_within = MR̄ / d2."""
        mr_bar = 1.128  # MR̄ = d2 → σ = 1.0
        sigma = calculate_sigma_within(mr_bar)
        assert sigma == pytest.approx(1.0, abs=0.0001)

    def test_sigma_within_known_value(self):
        """Test with known MR̄ value."""
        mr_bar = 2.256  # 2 × d2 → σ = 2.0
        sigma = calculate_sigma_within(mr_bar)
        assert sigma == pytest.approx(2.0, abs=0.0001)

    def test_sigma_within_zero(self):
        """Zero MR̄ should return 0."""
        sigma = calculate_sigma_within(0.0)
        assert sigma == 0.0

    def test_sigma_overall_basic(self):
        """sigma_overall uses sample std dev (ddof=1)."""
        values = np.array([2, 4, 4, 4, 5, 5, 7, 9])
        # Mean = 5, sample std dev = 2.138...
        sigma = calculate_sigma_overall(values)
        expected = np.std(values, ddof=1)
        assert sigma == pytest.approx(expected, abs=0.0001)

    def test_sigma_overall_constant_values(self):
        """Constant values should have sigma = 0."""
        values = np.array([5.0, 5.0, 5.0, 5.0])
        sigma = calculate_sigma_overall(values)
        assert sigma == 0.0

    def test_sigma_overall_single_value(self):
        """Single value edge case."""
        values = np.array([5.0])
        # With ddof=1, std of single value is undefined (NaN in numpy)
        # Should return 0 for single value
        sigma = calculate_sigma_overall(values)
        assert sigma == 0.0


# =============================================================================
# Test Cp Calculation
# =============================================================================

class TestCpCalculation:
    """Test Cp (Process Capability) calculation."""

    def test_cp_perfect_process(self):
        """Cp = 1.0 when tolerance = 6σ."""
        lei, les = 0.0, 6.0  # Tolerance = 6
        sigma = 1.0          # 6σ = 6
        cp = calculate_cp(lei, les, sigma)
        # Cp = (6 - 0) / (6 × 1) = 1.0
        assert cp == pytest.approx(1.0, abs=0.001)

    def test_cp_capable_process(self):
        """Cp > 1.33 indicates capable process."""
        lei, les = 0.0, 12.0  # Tolerance = 12
        sigma = 1.5           # 6σ = 9
        cp = calculate_cp(lei, les, sigma)
        # Cp = 12 / 9 = 1.333...
        assert cp == pytest.approx(1.333, abs=0.001)

    def test_cp_incapable_process(self):
        """Cp < 1.0 indicates incapable process."""
        lei, les = 0.0, 4.0  # Tolerance = 4
        sigma = 1.0          # 6σ = 6
        cp = calculate_cp(lei, les, sigma)
        # Cp = 4 / 6 = 0.667
        assert cp == pytest.approx(0.667, abs=0.001)

    def test_cp_zero_sigma(self):
        """Zero sigma should return None (undefined)."""
        cp = calculate_cp(0.0, 6.0, 0.0)
        assert cp is None

    def test_cp_negative_sigma(self):
        """Negative sigma (invalid) should return None."""
        cp = calculate_cp(0.0, 6.0, -1.0)
        assert cp is None


# =============================================================================
# Test Cpk Calculation
# =============================================================================

class TestCpkCalculation:
    """Test Cpk (Process Capability Index) calculation."""

    def test_cpk_centered_process(self):
        """Cpk = Cp when process is perfectly centered."""
        mean = 5.0
        lei, les = 2.0, 8.0  # Centered at 5, tolerance = 6
        sigma = 1.0
        cpk, cpu, cpl = calculate_cpk(mean, lei, les, sigma)
        # Cpu = (8 - 5) / 3 = 1.0
        # Cpl = (5 - 2) / 3 = 1.0
        # Cpk = min(1.0, 1.0) = 1.0
        assert cpk == pytest.approx(1.0, abs=0.001)
        assert cpu == pytest.approx(1.0, abs=0.001)
        assert cpl == pytest.approx(1.0, abs=0.001)

    def test_cpk_shifted_toward_upper(self):
        """Cpk limited by upper spec when mean is high."""
        mean = 7.0  # Shifted toward upper limit
        lei, les = 2.0, 8.0
        sigma = 1.0
        cpk, cpu, cpl = calculate_cpk(mean, lei, les, sigma)
        # Cpu = (8 - 7) / 3 = 0.333
        # Cpl = (7 - 2) / 3 = 1.667
        # Cpk = min(0.333, 1.667) = 0.333
        assert cpk == pytest.approx(0.333, abs=0.001)
        assert cpu == pytest.approx(0.333, abs=0.001)
        assert cpl == pytest.approx(1.667, abs=0.001)

    def test_cpk_shifted_toward_lower(self):
        """Cpk limited by lower spec when mean is low."""
        mean = 3.0  # Shifted toward lower limit
        lei, les = 2.0, 8.0
        sigma = 1.0
        cpk, cpu, cpl = calculate_cpk(mean, lei, les, sigma)
        # Cpu = (8 - 3) / 3 = 1.667
        # Cpl = (3 - 2) / 3 = 0.333
        # Cpk = min(1.667, 0.333) = 0.333
        assert cpk == pytest.approx(0.333, abs=0.001)
        assert cpu == pytest.approx(1.667, abs=0.001)
        assert cpl == pytest.approx(0.333, abs=0.001)

    def test_cpk_zero_sigma(self):
        """Zero sigma should return None."""
        result = calculate_cpk(5.0, 2.0, 8.0, 0.0)
        assert result == (None, None, None)

    def test_cpk_mean_at_lei(self):
        """Mean exactly at LEI should give Cpl = 0."""
        mean = 2.0  # At LEI
        lei, les = 2.0, 8.0
        sigma = 1.0
        cpk, cpu, cpl = calculate_cpk(mean, lei, les, sigma)
        assert cpl == pytest.approx(0.0, abs=0.001)
        assert cpk == pytest.approx(0.0, abs=0.001)

    def test_cpk_mean_at_les(self):
        """Mean exactly at LES should give Cpu = 0."""
        mean = 8.0  # At LES
        lei, les = 2.0, 8.0
        sigma = 1.0
        cpk, cpu, cpl = calculate_cpk(mean, lei, les, sigma)
        assert cpu == pytest.approx(0.0, abs=0.001)
        assert cpk == pytest.approx(0.0, abs=0.001)


# =============================================================================
# Test Pp Calculation
# =============================================================================

class TestPpCalculation:
    """Test Pp (Process Performance) calculation."""

    def test_pp_basic(self):
        """Pp uses overall sigma."""
        lei, les = 0.0, 6.0
        sigma_overall = 1.0
        pp = calculate_pp(lei, les, sigma_overall)
        # Pp = (6 - 0) / (6 × 1) = 1.0
        assert pp == pytest.approx(1.0, abs=0.001)

    def test_pp_zero_sigma(self):
        """Zero sigma should return None."""
        pp = calculate_pp(0.0, 6.0, 0.0)
        assert pp is None


# =============================================================================
# Test Ppk Calculation
# =============================================================================

class TestPpkCalculation:
    """Test Ppk (Process Performance Index) calculation."""

    def test_ppk_centered(self):
        """Ppk for centered process."""
        mean = 5.0
        lei, les = 2.0, 8.0
        sigma_overall = 1.0
        ppk, ppu, ppl = calculate_ppk(mean, lei, les, sigma_overall)
        assert ppk == pytest.approx(1.0, abs=0.001)
        assert ppu == pytest.approx(1.0, abs=0.001)
        assert ppl == pytest.approx(1.0, abs=0.001)

    def test_ppk_zero_sigma(self):
        """Zero sigma should return None."""
        result = calculate_ppk(5.0, 2.0, 8.0, 0.0)
        assert result == (None, None, None)


# =============================================================================
# Test Specification Limit Validation
# =============================================================================

class TestSpecLimitValidation:
    """Test specification limit validation."""

    def test_valid_spec_limits(self):
        """Valid LEI < LES should pass."""
        result = validate_spec_limits(2.0, 8.0)
        assert result['valid'] is True
        assert result['errors'] == []

    def test_missing_lei(self):
        """Missing LEI should fail with Spanish error."""
        result = validate_spec_limits(None, 8.0)
        assert result['valid'] is False
        assert len(result['errors']) == 1
        assert 'LEI' in result['errors'][0] or 'Inferior' in result['errors'][0]

    def test_missing_les(self):
        """Missing LES should fail with Spanish error."""
        result = validate_spec_limits(2.0, None)
        assert result['valid'] is False
        assert len(result['errors']) == 1
        assert 'LES' in result['errors'][0] or 'Superior' in result['errors'][0]

    def test_missing_both(self):
        """Missing both limits should report both errors."""
        result = validate_spec_limits(None, None)
        assert result['valid'] is False
        assert len(result['errors']) == 2

    def test_lei_greater_than_les(self):
        """LEI > LES should fail."""
        result = validate_spec_limits(10.0, 5.0)
        assert result['valid'] is False
        assert len(result['errors']) == 1
        assert 'menor' in result['errors'][0] or '<' in result['errors'][0]

    def test_lei_equals_les(self):
        """LEI = LES should fail."""
        result = validate_spec_limits(5.0, 5.0)
        assert result['valid'] is False

    def test_nan_values(self):
        """NaN values should fail."""
        result = validate_spec_limits(float('nan'), 8.0)
        assert result['valid'] is False

    def test_inf_values(self):
        """Infinity values should fail."""
        result = validate_spec_limits(2.0, float('inf'))
        assert result['valid'] is False


# =============================================================================
# Test Capability Classification
# =============================================================================

class TestCapabilityClassification:
    """Test capability index classification."""

    def test_excellent_capability(self):
        """Cpk >= 1.67 is excellent."""
        result = classify_capability(1.70)
        assert result['classification'] == 'Excelente'
        assert result['color'] == 'green'
        assert result['level'] == 'excellent'

    def test_adequate_capability(self):
        """1.33 <= Cpk < 1.67 is adequate (Capaz)."""
        result = classify_capability(1.50)
        assert result['classification'] == 'Capaz'
        assert result['color'] == 'green'
        assert result['level'] == 'adequate'

    def test_marginal_capability(self):
        """1.00 <= Cpk < 1.33 is marginal."""
        result = classify_capability(1.10)
        assert result['classification'] == 'Marginalmente Capaz'
        assert result['color'] == 'yellow'
        assert result['level'] == 'marginal'

    def test_inadequate_capability(self):
        """0.67 <= Cpk < 1.00 is inadequate (No Capaz)."""
        result = classify_capability(0.80)
        assert result['classification'] == 'No Capaz'
        assert result['color'] == 'red'
        assert result['level'] == 'inadequate'

    def test_poor_capability(self):
        """Cpk < 0.67 is poor (Muy Deficiente)."""
        result = classify_capability(0.50)
        assert result['classification'] == 'Muy Deficiente'
        assert result['color'] == 'red'
        assert result['level'] == 'poor'

    def test_boundary_excellent_adequate(self):
        """Exactly 1.67 should be excellent."""
        result = classify_capability(1.67)
        assert result['level'] == 'excellent'

    def test_boundary_adequate_marginal(self):
        """Exactly 1.33 should be adequate."""
        result = classify_capability(1.33)
        assert result['level'] == 'adequate'

    def test_boundary_marginal_inadequate(self):
        """Exactly 1.00 should be marginal."""
        result = classify_capability(1.00)
        assert result['level'] == 'marginal'

    def test_boundary_inadequate_poor(self):
        """Exactly 0.67 should be inadequate."""
        result = classify_capability(0.67)
        assert result['level'] == 'inadequate'

    def test_none_value(self):
        """None Cpk should be handled gracefully."""
        result = classify_capability(None)
        assert result['classification'] == 'No Calculable'
        assert result['color'] == 'gray'

    def test_nan_value(self):
        """NaN Cpk should be handled gracefully."""
        result = classify_capability(float('nan'))
        assert result['classification'] == 'No Calculable'
        assert result['color'] == 'gray'


# =============================================================================
# Test PPM Calculation
# =============================================================================

class TestPPMCalculation:
    """Test Parts Per Million calculation."""

    def test_ppm_centered_normal(self):
        """Centered normal process PPM calculation."""
        mean = 5.0
        sigma = 1.0
        lei, les = 2.0, 8.0  # ±3σ limits
        ppm = calculate_ppm_normal(mean, sigma, lei, les)
        # At ±3σ, PPM total ≈ 2700 (0.135% each tail)
        assert ppm['ppm_below_lei'] == pytest.approx(1350, rel=0.1)
        assert ppm['ppm_above_les'] == pytest.approx(1350, rel=0.1)
        assert ppm['ppm_total'] == pytest.approx(2700, rel=0.1)

    def test_ppm_six_sigma_process(self):
        """Six sigma process should have very low PPM."""
        mean = 5.0
        sigma = 0.5  # 6σ within tolerance of 6
        lei, les = 2.0, 8.0  # ±6σ limits
        ppm = calculate_ppm_normal(mean, sigma, lei, les)
        # At ±6σ, PPM total should be < 4
        assert ppm['ppm_total'] < 10

    def test_ppm_shifted_process(self):
        """Shifted process has asymmetric PPM."""
        mean = 7.0  # Shifted toward upper limit
        sigma = 1.0
        lei, les = 2.0, 8.0
        ppm = calculate_ppm_normal(mean, sigma, lei, les)
        # More PPM above LES than below LEI
        assert ppm['ppm_above_les'] > ppm['ppm_below_lei']

    def test_ppm_zero_sigma(self):
        """Zero sigma should return 0 PPM if mean is within limits."""
        # When sigma = 0, all values are at mean
        # If mean is between LEI and LES, PPM = 0
        ppm = calculate_ppm_normal(5.0, 0.0, 2.0, 8.0)
        assert ppm['ppm_total'] == 0

    def test_ppm_zero_sigma_out_of_spec(self):
        """Zero sigma with mean outside spec should return 1M PPM."""
        # If mean < LEI with zero sigma, 100% below LEI
        ppm = calculate_ppm_normal(1.0, 0.0, 2.0, 8.0)
        assert ppm['ppm_below_lei'] == 1_000_000


# =============================================================================
# Test Full Capability Calculation
# =============================================================================

class TestCapabilityIndicesCalculation:
    """Test the main calculate_capability_indices function."""

    def test_basic_capability_calculation(self):
        """Test complete capability calculation."""
        # Create data centered at 5 with std ~1
        np.random.seed(42)
        values = np.random.normal(5.0, 1.0, 100)
        lei, les = 2.0, 8.0

        # Mock stability result with known mr_bar
        stability_result = {
            'i_chart': {'mr_bar': 1.128},  # σ_within = 1.0
            'sigma': 1.0
        }

        result = calculate_capability_indices(values, lei, les, stability_result)

        # Check structure
        assert 'cp' in result
        assert 'cpk' in result
        assert 'pp' in result
        assert 'ppk' in result
        assert 'cpu' in result
        assert 'cpl' in result
        assert 'ppu' in result
        assert 'ppl' in result
        assert 'sigma_within' in result
        assert 'sigma_overall' in result
        assert 'mean' in result
        assert 'cpk_classification' in result
        assert 'ppk_classification' in result
        assert 'ppm' in result

    def test_capability_with_invalid_spec_limits(self):
        """Invalid spec limits should return error result."""
        values = np.array([1, 2, 3, 4, 5])
        stability_result = {'i_chart': {'mr_bar': 1.128}, 'sigma': 1.0}

        result = calculate_capability_indices(values, 10.0, 5.0, stability_result)  # LEI > LES

        assert result.get('valid') is False
        assert 'errors' in result

    def test_capability_indices_relationship(self):
        """Cpk <= Cp and Ppk <= Pp for stable processes."""
        np.random.seed(42)
        values = np.random.normal(5.0, 1.0, 100)
        lei, les = 2.0, 8.0
        stability_result = {'i_chart': {'mr_bar': 1.128}, 'sigma': 1.0}

        result = calculate_capability_indices(values, lei, les, stability_result)

        # Cpk should be <= Cp (centering penalty)
        if result['cp'] is not None and result['cpk'] is not None:
            assert result['cpk'] <= result['cp'] + 0.001

        # Ppk should be <= Pp
        if result['pp'] is not None and result['ppk'] is not None:
            assert result['ppk'] <= result['pp'] + 0.001

    def test_capability_with_none_normality_result(self):
        """Explicit test for normality_result=None (uses normal method)."""
        np.random.seed(42)
        values = np.random.normal(5.0, 1.0, 50)
        lei, les = 2.0, 8.0
        stability_result = {'i_chart': {'mr_bar': 1.128}, 'sigma': 1.0}

        # Explicitly pass normality_result=None
        result = calculate_capability_indices(
            values, lei, les, stability_result, normality_result=None
        )

        # Should use normal method when normality_result is None
        assert result.get('valid', True) is True
        assert result.get('method') == 'normal'
        assert result['cp'] is not None
        assert result['cpk'] is not None

    def test_capability_with_normal_normality_result(self):
        """Test when normality_result indicates data IS normal."""
        np.random.seed(42)
        values = np.random.normal(5.0, 1.0, 50)
        lei, les = 2.0, 8.0
        stability_result = {'i_chart': {'mr_bar': 1.128}, 'sigma': 1.0}

        # Normal data - should use normal method
        normality_result = {'is_normal': True, 'fitted_distribution': None}

        result = calculate_capability_indices(
            values, lei, les, stability_result, normality_result
        )

        assert result.get('method') == 'normal'


# =============================================================================
# Test Non-Normal Capability Calculation
# =============================================================================

class TestNonNormalCapability:
    """Test capability calculation for non-normal data."""

    def test_non_normal_with_fitted_distribution(self):
        """Non-normal capability uses fitted distribution."""
        # Create lognormal-like data
        np.random.seed(42)
        values = np.exp(np.random.normal(1.0, 0.5, 100))
        lei, les = 0.5, 10.0

        fitted_dist = {
            'name': 'lognormal',
            'params': {'mu': 1.0, 'sigma': 0.5}
        }

        result = calculate_capability_non_normal(values, lei, les, fitted_dist)

        assert result['method'] == 'non_normal'
        assert 'ppk' in result or 'indices' in result

    def test_non_normal_weibull(self):
        """Test with Weibull distribution."""
        np.random.seed(42)
        values = np.abs(np.random.weibull(2.0, 100) * 5)
        lei, les = 0.0, 15.0

        fitted_dist = {
            'name': 'weibull',
            'params': {'k': 2.0, 'lambda': 5.0}
        }

        result = calculate_capability_non_normal(values, lei, les, fitted_dist)

        assert result['method'] == 'non_normal'


# =============================================================================
# Test Instructions Generation
# =============================================================================

class TestCapabilityInstructions:
    """Test markdown instructions generation."""

    def test_instructions_contains_sections(self):
        """Instructions should contain all required sections."""
        capability_result = {
            'cp': 1.5,
            'cpk': 1.4,
            'pp': 1.4,
            'ppk': 1.3,
            'cpu': 1.4,
            'cpl': 1.5,
            'ppu': 1.3,
            'ppl': 1.4,
            'sigma_within': 1.0,
            'sigma_overall': 1.1,
            'mean': 5.0,
            'lei': 2.0,
            'les': 8.0,
            'cpk_classification': {
                'classification': 'Capaz',
                'color': 'green',
                'level': 'adequate'
            },
            'ppk_classification': {
                'classification': 'Capaz',
                'color': 'green',
                'level': 'adequate'
            },
            'ppm': {
                'ppm_below_lei': 100,
                'ppm_above_les': 100,
                'ppm_total': 200
            }
        }

        instructions = generate_capability_instructions(capability_result)

        # Check sections exist
        assert 'Capacidad' in instructions
        assert 'LEI' in instructions or 'Inferior' in instructions
        assert 'LES' in instructions or 'Superior' in instructions
        assert 'Cp' in instructions
        assert 'Cpk' in instructions
        assert 'Pp' in instructions
        assert 'Ppk' in instructions
        assert 'PPM' in instructions

    def test_instructions_contains_color_emojis(self):
        """Instructions should use color emojis for classification."""
        capability_result = {
            'cp': 1.5,
            'cpk': 1.4,
            'pp': 1.4,
            'ppk': 1.3,
            'cpu': 1.4,
            'cpl': 1.5,
            'ppu': 1.3,
            'ppl': 1.4,
            'sigma_within': 1.0,
            'sigma_overall': 1.1,
            'mean': 5.0,
            'lei': 2.0,
            'les': 8.0,
            'cpk_classification': {
                'classification': 'Capaz',
                'color': 'green',
                'level': 'adequate'
            },
            'ppk_classification': {
                'classification': 'Marginalmente Capaz',
                'color': 'yellow',
                'level': 'marginal'
            },
            'ppm': {
                'ppm_below_lei': 100,
                'ppm_above_les': 100,
                'ppm_total': 200
            }
        }

        instructions = generate_capability_instructions(capability_result)

        # Should contain emoji indicators
        assert any(emoji in instructions for emoji in ['', '', '', ''])


# =============================================================================
# Edge Cases
# =============================================================================

class TestEdgeCases:
    """Test edge cases and boundary conditions."""

    def test_empty_values_array(self):
        """Empty values should be handled."""
        values = np.array([])
        stability_result = {'i_chart': {'mr_bar': 0}, 'sigma': 0}

        result = calculate_capability_indices(values, 0.0, 10.0, stability_result)

        # Should return error or None values
        assert result.get('valid') is False or result.get('cpk') is None

    def test_single_value(self):
        """Single value should handle gracefully."""
        values = np.array([5.0])
        stability_result = {'i_chart': {'mr_bar': 0}, 'sigma': 0}

        result = calculate_capability_indices(values, 0.0, 10.0, stability_result)

        # Should not raise, may have None indices
        assert 'cpk' in result or 'valid' in result

    def test_data_exactly_at_spec_limits(self):
        """Data at spec limits should handle correctly."""
        values = np.array([2.0, 8.0, 5.0, 5.0, 5.0])  # Some at LEI/LES
        lei, les = 2.0, 8.0
        stability_result = {'i_chart': {'mr_bar': 1.0}, 'sigma': 0.885}

        result = calculate_capability_indices(values, lei, les, stability_result)

        assert result['cp'] is not None or result['pp'] is not None

    def test_negative_specification_limits(self):
        """Negative spec limits should work."""
        values = np.array([-5.0, -4.0, -3.0, -2.0, -1.0])
        lei, les = -6.0, 0.0
        stability_result = {'i_chart': {'mr_bar': 1.0}, 'sigma': 0.885}

        result = calculate_capability_indices(values, lei, les, stability_result)

        assert result['cp'] is not None

    def test_very_small_sigma(self):
        """Very small sigma should not cause numerical issues."""
        values = np.array([5.0, 5.0001, 5.0002, 4.9999, 4.9998])
        lei, les = 0.0, 10.0
        stability_result = {'i_chart': {'mr_bar': 0.0001}, 'sigma': 0.0001 / 1.128}

        result = calculate_capability_indices(values, lei, les, stability_result)

        # Cp should be very high but not infinite
        if result['cp'] is not None:
            assert result['cp'] > 100

    def test_large_dataset(self):
        """Large dataset performance check."""
        np.random.seed(42)
        values = np.random.normal(5.0, 1.0, 1000)
        lei, les = 2.0, 8.0
        stability_result = {'i_chart': {'mr_bar': 1.128}, 'sigma': 1.0}

        result = calculate_capability_indices(values, lei, les, stability_result)

        assert result['cp'] is not None
        assert result['cpk'] is not None
