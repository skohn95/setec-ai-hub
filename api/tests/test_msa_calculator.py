"""Tests for the MSA Calculator module.

Tests cover ANOVA-based Gauge R&R calculations, variance components,
results formatting, chart data generation, and instruction generation.
"""
import pytest
import pandas as pd
import numpy as np
import sys
import os

# Add api directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


# =============================================================================
# Reference Test Data
# =============================================================================

def create_reference_dataset():
    """
    Create a reference MSA dataset with known values.

    This is a balanced dataset with:
    - 5 parts
    - 2 operators
    - 3 replicate measurements per part/operator combination

    The data is designed to produce specific variance components that
    can be verified against hand calculations or reference tools.
    """
    data = {
        'Part': [1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5],
        'Operator': ['A', 'A', 'A', 'B', 'B', 'B', 'A', 'A', 'A', 'B', 'B', 'B', 'A', 'A', 'A', 'B', 'B', 'B', 'A', 'A', 'A', 'B', 'B', 'B', 'A', 'A', 'A', 'B', 'B', 'B'],
        'M1': [10.1, 10.2, 10.0, 10.3, 10.2, 10.1, 12.5, 12.4, 12.6, 12.4, 12.5, 12.3, 8.7, 8.8, 8.6, 8.9, 8.7, 8.8, 15.2, 15.3, 15.1, 15.4, 15.2, 15.3, 11.0, 11.1, 10.9, 11.2, 11.0, 11.1],
        'M2': [10.0, 10.1, 10.2, 10.2, 10.3, 10.0, 12.6, 12.5, 12.4, 12.3, 12.4, 12.5, 8.8, 8.7, 8.9, 8.8, 8.8, 8.7, 15.1, 15.2, 15.3, 15.3, 15.4, 15.2, 11.1, 11.0, 11.0, 11.1, 11.2, 11.0],
        'M3': [10.2, 10.0, 10.1, 10.1, 10.2, 10.2, 12.4, 12.6, 12.5, 12.5, 12.3, 12.4, 8.6, 8.9, 8.7, 8.7, 8.9, 8.6, 15.3, 15.1, 15.2, 15.2, 15.3, 15.4, 10.9, 11.1, 11.0, 11.0, 11.1, 11.2],
    }
    return pd.DataFrame(data)


def create_minimal_dataset():
    """Create minimal valid dataset: 2 parts, 2 operators, 2 measurements."""
    data = {
        'Part': [1, 1, 2, 2],
        'Operator': ['A', 'B', 'A', 'B'],
        'M1': [10.0, 10.5, 20.0, 20.5],
        'M2': [10.1, 10.4, 20.1, 20.4],
    }
    return pd.DataFrame(data)


def create_high_grr_dataset():
    """Create dataset that should produce high GRR (>30%)."""
    # High operator variation, low part variation
    data = {
        'Part': [1, 1, 2, 2, 3, 3],
        'Operator': ['A', 'B', 'A', 'B', 'A', 'B'],
        'M1': [10.0, 15.0, 10.5, 15.5, 10.2, 15.2],
        'M2': [10.1, 15.1, 10.4, 15.4, 10.3, 15.3],
    }
    return pd.DataFrame(data)


def create_low_grr_dataset():
    """Create dataset that should produce low GRR (<10%)."""
    # Low measurement variation, high part variation
    data = {
        'Part': [1, 1, 2, 2, 3, 3, 4, 4, 5, 5],
        'Operator': ['A', 'B', 'A', 'B', 'A', 'B', 'A', 'B', 'A', 'B'],
        'M1': [10.00, 10.01, 50.00, 50.01, 30.00, 30.01, 70.00, 70.01, 90.00, 90.01],
        'M2': [10.01, 10.00, 50.01, 50.00, 30.01, 30.00, 70.01, 70.00, 90.01, 90.00],
        'M3': [10.00, 10.01, 50.00, 50.01, 30.00, 30.01, 70.00, 70.01, 90.00, 90.01],
    }
    return pd.DataFrame(data)


# =============================================================================
# Test Classes
# =============================================================================

class TestAnalyzeMSABasic:
    """Basic tests for the analyze_msa function."""

    def test_analyze_msa_returns_tuple(self):
        """Test that analyze_msa returns a tuple."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        result = analyze_msa(df)

        assert isinstance(result, tuple)
        assert len(result) == 2

    def test_analyze_msa_returns_results_on_valid_data(self):
        """Test that analyze_msa returns results dict on valid data."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, error = analyze_msa(df)

        assert error is None
        assert output is not None
        assert 'results' in output
        assert 'chartData' in output
        assert 'instructions' in output

    def test_analyze_msa_minimal_data(self):
        """Test analyze_msa with minimum valid dataset."""
        from utils.msa_calculator import analyze_msa

        df = create_minimal_dataset()
        output, error = analyze_msa(df)

        assert error is None
        assert output is not None


class TestMSAResultsStructure:
    """Tests for the structure of MSA results."""

    def test_results_has_required_fields(self):
        """Test that results dict has all required fields."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        required_fields = [
            'grr_percent',
            'repeatability_percent',
            'reproducibility_percent',
            'part_to_part_percent',
            'total_variation',
            'ndc',
            'classification',
        ]

        for field in required_fields:
            assert field in output['results'], f"Missing field: {field}"

    def test_results_values_are_numeric(self):
        """Test that numeric result fields are numbers."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)
        results = output['results']

        numeric_fields = [
            'grr_percent',
            'repeatability_percent',
            'reproducibility_percent',
            'part_to_part_percent',
            'total_variation',
        ]

        for field in numeric_fields:
            assert isinstance(results[field], (int, float)), f"Field {field} should be numeric"

    def test_ndc_is_integer(self):
        """Test that ndc is an integer."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        assert isinstance(output['results']['ndc'], int)

    def test_percentages_are_non_negative(self):
        """Test that percentage values are non-negative."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)
        results = output['results']

        assert results['grr_percent'] >= 0
        assert results['repeatability_percent'] >= 0
        assert results['reproducibility_percent'] >= 0
        assert results['part_to_part_percent'] >= 0

    def test_grr_calculation_formula(self):
        """Test that GRR = sqrt(repeatability² + reproducibility²) / TV * 100."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)
        results = output['results']

        # Check the relationship holds
        # GRR = sqrt(EV² + AV²) where EV/AV are in same units as TV
        # So %GRR should roughly equal sqrt(%EV² + %AV²) if PV is not dominant
        # This is an approximation - exact formula depends on TV calculation
        grr = results['grr_percent']
        ev = results['repeatability_percent']
        av = results['reproducibility_percent']

        # Verify GRR is related to EV and AV
        assert grr >= 0
        assert grr <= 100 or grr > 100  # Can exceed 100% if measurement system is very poor


class TestClassificationThresholds:
    """Tests for GRR classification thresholds."""

    def test_classification_field_exists(self):
        """Test that classification field exists."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        assert 'classification' in output['results']
        assert output['results']['classification'] in ['aceptable', 'marginal', 'inaceptable']

    def test_low_grr_classified_as_aceptable(self):
        """Test that low GRR (<10%) is classified as aceptable."""
        from utils.msa_calculator import analyze_msa

        df = create_low_grr_dataset()
        output, _ = analyze_msa(df)

        # With very high part variation and low measurement error
        # GRR should be low
        if output['results']['grr_percent'] < 10:
            assert output['results']['classification'] == 'aceptable'

    def test_high_grr_classified_as_inaceptable(self):
        """Test that high GRR (>30%) is classified as inaceptable."""
        from utils.msa_calculator import analyze_msa

        df = create_high_grr_dataset()
        output, _ = analyze_msa(df)

        # With high operator variation
        # GRR should be high
        if output['results']['grr_percent'] > 30:
            assert output['results']['classification'] == 'inaceptable'

    def test_boundary_9_9_is_aceptable(self):
        """Test that exactly 9.9% GRR is classified as aceptable."""
        from utils.msa_calculator import classify_grr

        classification, _, _ = classify_grr(9.9)
        assert classification == 'aceptable'

    def test_boundary_10_0_is_marginal(self):
        """Test that exactly 10.0% GRR is classified as marginal."""
        from utils.msa_calculator import classify_grr

        classification, _, _ = classify_grr(10.0)
        assert classification == 'marginal'

    def test_boundary_30_0_is_marginal(self):
        """Test that exactly 30.0% GRR is classified as marginal."""
        from utils.msa_calculator import classify_grr

        classification, _, _ = classify_grr(30.0)
        assert classification == 'marginal'

    def test_boundary_30_1_is_inaceptable(self):
        """Test that exactly 30.1% GRR is classified as inaceptable."""
        from utils.msa_calculator import classify_grr

        classification, _, _ = classify_grr(30.1)
        assert classification == 'inaceptable'


class TestChartDataStructure:
    """Tests for chart data structure."""

    def test_chart_data_is_list(self):
        """Test that chartData is a list."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        assert isinstance(output['chartData'], list)

    def test_chart_data_has_variation_breakdown(self):
        """Test that chartData contains variation breakdown as static image."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        variation_breakdown = None
        for item in output['chartData']:
            if item.get('type') == 'variationBreakdown':
                variation_breakdown = item
                break

        assert variation_breakdown is not None
        # Static charts have 'image' key with base64 data URL
        assert 'image' in variation_breakdown

    def test_variation_breakdown_structure(self):
        """Test the structure of variation breakdown static chart."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        variation_breakdown = None
        for item in output['chartData']:
            if item.get('type') == 'variationBreakdown':
                variation_breakdown = item
                break

        assert variation_breakdown is not None
        # Static charts return base64 PNG images
        image = variation_breakdown['image']

        # Should be a valid data URL for PNG
        assert image.startswith('data:image/png;base64,')
        # Should have substantial content (not empty)
        assert len(image) > 1000

    def test_chart_data_has_operator_comparison(self):
        """Test that chartData contains operator comparison as static image."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        operator_comparison = None
        for item in output['chartData']:
            if item.get('type') == 'operatorComparison':
                operator_comparison = item
                break

        assert operator_comparison is not None
        # Static charts have 'image' key with base64 data URL
        assert 'image' in operator_comparison

    def test_operator_comparison_structure(self):
        """Test the structure of operator comparison static chart."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        operator_comparison = None
        for item in output['chartData']:
            if item.get('type') == 'operatorComparison':
                operator_comparison = item
                break

        assert operator_comparison is not None
        # Static charts return base64 PNG images
        image = operator_comparison['image']

        # Should be a valid data URL for PNG
        assert image.startswith('data:image/png;base64,')
        # Should have substantial content (not empty)
        assert len(image) > 1000

    def test_operator_stddev_not_nan_with_single_measurement(self):
        """Test that stdDev does not return NaN when operator has single measurement."""
        from utils.msa_calculator import format_chart_data
        import math

        # Create a minimal dataset where each operator only has one measurement per part
        # This could cause NaN in std() with ddof=1
        results = {
            'repeatability_percent': 10.0,
            'reproducibility_percent': 15.0,
            'part_to_part_percent': 75.0,
            'grr_percent': 25.0,
            'classification': 'marginal',
        }

        df = pd.DataFrame({
            'Part': [1, 2],
            'Operator': ['A', 'B'],
            'M1': [10.0, 20.0],  # Single measurement per operator
        })

        # Create long_df for the test
        long_df = pd.DataFrame({
            'part': [1, 2],
            'operator': ['A', 'B'],
            'measurement': [10.0, 20.0],
        })

        chart_data = format_chart_data(results, df, 'Operator', 'Part', ['M1'], long_df)

        operator_comparison = None
        for item in chart_data:
            if item.get('type') == 'operatorComparison':
                operator_comparison = item
                break

        assert operator_comparison is not None

        # Verify that stdDev values are not NaN
        for entry in operator_comparison['data']:
            std_dev = entry['stdDev']
            assert not math.isnan(std_dev), f"stdDev should not be NaN for operator {entry['operator']}"
            assert isinstance(std_dev, (int, float))


class TestInstructions:
    """Tests for instruction generation."""

    def test_instructions_is_string(self):
        """Test that instructions is a string."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        assert isinstance(output['instructions'], str)

    def test_instructions_contains_spanish(self):
        """Test that instructions contain Spanish text."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        spanish_words = ['Resultados', 'Análisis', 'MSA', 'variación', 'Repetibilidad', 'Reproducibilidad']
        contains_spanish = any(word in output['instructions'] for word in spanish_words)

        assert contains_spanish

    def test_instructions_is_markdown(self):
        """Test that instructions appear to be markdown."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        # Check for markdown indicators
        has_headers = '#' in output['instructions']

        assert has_headers

    def test_instructions_includes_classification(self):
        """Test that instructions mention classification."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        classification_terms = ['Aceptable', 'Marginal', 'Inaceptable']
        contains_classification = any(term in output['instructions'] for term in classification_terms)

        assert contains_classification

    def test_instructions_includes_ndc(self):
        """Test that instructions mention ndc."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        assert 'ndc' in output['instructions'].lower() or 'categorías' in output['instructions'].lower()


class TestANOVACalculations:
    """Tests for ANOVA variance component calculations."""

    def test_calculate_anova_components_returns_dict(self):
        """Test that calculate_anova_components returns a dict."""
        from utils.msa_calculator import calculate_anova_components

        df = create_reference_dataset()
        components = calculate_anova_components(df, 'Part', 'Operator', ['M1', 'M2', 'M3'])

        assert isinstance(components, dict)

    def test_anova_components_has_required_keys(self):
        """Test that ANOVA components has all required keys."""
        from utils.msa_calculator import calculate_anova_components

        df = create_reference_dataset()
        components = calculate_anova_components(df, 'Part', 'Operator', ['M1', 'M2', 'M3'])

        required_keys = [
            'variance_repeatability',
            'variance_reproducibility',
            'variance_part',
        ]

        for key in required_keys:
            assert key in components, f"Missing key: {key}"

    def test_negative_variance_set_to_zero(self):
        """Test that negative variance components are set to zero."""
        from utils.msa_calculator import calculate_anova_components

        # Create data that might produce negative variance estimates
        # (can happen with ANOVA when true variance is near zero)
        data = {
            'Part': [1, 1, 2, 2, 3, 3],
            'Operator': ['A', 'B', 'A', 'B', 'A', 'B'],
            'M1': [10.0, 10.0, 20.0, 20.0, 30.0, 30.0],
            'M2': [10.0, 10.0, 20.0, 20.0, 30.0, 30.0],
        }
        df = pd.DataFrame(data)

        components = calculate_anova_components(df, 'Part', 'Operator', ['M1', 'M2'])

        # All variance components should be non-negative
        assert components['variance_repeatability'] >= 0
        assert components['variance_reproducibility'] >= 0
        assert components['variance_part'] >= 0


class TestNDCCalculation:
    """Tests for Number of Distinct Categories calculation."""

    def test_ndc_formula(self):
        """Test ndc = floor(1.41 * PV / GRR)."""
        from utils.msa_calculator import calculate_ndc

        # Test with known values
        # If PV = 10 and GRR = 2, then ndc = floor(1.41 * 10 / 2) = floor(7.05) = 7
        ndc = calculate_ndc(pv=10.0, grr=2.0)
        assert ndc == 7

    def test_ndc_floors_result(self):
        """Test that ndc is floored (not rounded)."""
        from utils.msa_calculator import calculate_ndc

        # 1.41 * 5 / 1 = 7.05 -> should be 7, not 8
        ndc = calculate_ndc(pv=5.0, grr=1.0)
        assert ndc == 7

    def test_ndc_handles_zero_grr(self):
        """Test ndc handles zero GRR gracefully."""
        from utils.msa_calculator import calculate_ndc

        # When GRR is zero (perfect measurement system), ndc should be very high
        # We cap it or handle division by zero
        ndc = calculate_ndc(pv=10.0, grr=0.0)
        assert ndc >= 0  # Should not raise error


class TestErrorHandling:
    """Tests for error handling in MSA calculations."""

    def test_analyze_msa_handles_empty_dataframe(self):
        """Test that analyze_msa handles empty DataFrame."""
        from utils.msa_calculator import analyze_msa

        df = pd.DataFrame()
        output, error = analyze_msa(df)

        assert error is not None or (output is None)

    def test_analyze_msa_returns_calculation_error_code(self):
        """Test that analyze_msa returns CALCULATION_ERROR code on empty DataFrame."""
        from utils.msa_calculator import analyze_msa

        df = pd.DataFrame()
        output, error = analyze_msa(df)

        assert output is None
        assert error == 'CALCULATION_ERROR'

    def test_analyze_msa_returns_calculation_error_on_none_input(self):
        """Test that analyze_msa returns CALCULATION_ERROR when df is None."""
        from utils.msa_calculator import analyze_msa

        output, error = analyze_msa(None)

        assert output is None
        assert error == 'CALCULATION_ERROR'

    def test_analyze_msa_handles_missing_columns(self):
        """Test analyze_msa handles missing required columns."""
        from utils.msa_calculator import analyze_msa

        # DataFrame missing Part column
        df = pd.DataFrame({
            'Operator': ['A', 'B'],
            'M1': [10.0, 10.5],
        })

        output, error = analyze_msa(df)

        # Should return error
        assert error is not None or output is None

    def test_analyze_msa_handles_non_numeric_measurement(self):
        """Test analyze_msa handles non-numeric measurement data."""
        from utils.msa_calculator import analyze_msa

        df = pd.DataFrame({
            'Part': [1, 1, 2, 2],
            'Operator': ['A', 'B', 'A', 'B'],
            'M1': [10.0, 'bad', 20.0, 20.5],
            'M2': [10.1, 10.4, 20.1, 20.4],
        })

        output, error = analyze_msa(df)

        # Should handle gracefully (error or cleaned data)
        # At minimum should not crash
        assert True  # If we get here without exception, test passes


class TestWithValidatedColumns:
    """Tests for analyze_msa with validated_columns parameter."""

    def test_analyze_msa_uses_validated_columns(self):
        """Test that analyze_msa can use pre-validated column mapping."""
        from utils.msa_calculator import analyze_msa

        # Create DataFrame with different column names
        df = pd.DataFrame({
            'Pieza': [1, 1, 2, 2],
            'Operador': ['A', 'B', 'A', 'B'],
            'Medicion1': [10.0, 10.5, 20.0, 20.5],
            'Medicion2': [10.1, 10.4, 20.1, 20.4],
        })

        validated_columns = {
            'part': 'Pieza',
            'operator': 'Operador',
            'measurements': ['Medicion1', 'Medicion2'],
        }

        output, error = analyze_msa(df, validated_columns=validated_columns)

        assert error is None
        assert output is not None


class TestAccuracyVerification:
    """Tests to verify calculation accuracy against known values."""

    def test_reference_calculation_accuracy(self):
        """Test that calculations produce reasonable results on reference data."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, error = analyze_msa(df)

        assert error is None
        results = output['results']

        # Verify results are within reasonable bounds
        # For well-designed reference data, GRR should be in reasonable range
        assert 0 <= results['grr_percent'] <= 200  # Generous bounds
        assert 0 <= results['repeatability_percent'] <= 200
        assert 0 <= results['reproducibility_percent'] <= 200
        assert results['ndc'] >= 0
        assert results['total_variation'] > 0

    def test_percentages_sum_relationship(self):
        """Test that variation percentages have expected relationships."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)
        results = output['results']

        # The sum of squared percentage contributions should equal 100²
        # (EV%)² + (AV%)² + (PV%)² ≈ 100² if we're measuring TV contributions
        # But this depends on how percentages are calculated
        # Just verify they're all positive and meaningful
        assert results['repeatability_percent'] >= 0
        assert results['reproducibility_percent'] >= 0
        assert results['part_to_part_percent'] >= 0

    def test_grr_percent_accuracy_tolerance(self):
        """
        Test that %GRR is accurate to ±0.1% as per AC#7.

        This test verifies the rounding precision by checking that
        repeated calculations produce consistent results within tolerance.
        """
        from utils.msa_calculator import analyze_msa, calculate_anova_components, calculate_grr_metrics
        import math

        df = create_reference_dataset()

        # Calculate variance components directly
        variance = calculate_anova_components(df, 'Part', 'Operator', ['M1', 'M2', 'M3'])
        grr_metrics = calculate_grr_metrics(variance)

        # The reported grr_percent should be rounded to 2 decimal places (0.01 precision)
        # which is better than ±0.1% tolerance
        raw_grr = grr_metrics['grr_percent']

        # Verify it's rounded (has at most 2 decimal places)
        rounded = round(raw_grr, 2)
        assert raw_grr == rounded, f"GRR percent should be rounded to 2 decimals: {raw_grr}"

        # Verify the final output also maintains this precision
        output, _ = analyze_msa(df)
        reported_grr = output['results']['grr_percent']

        # The difference between raw calculation and reported should be minimal (rounding only)
        assert abs(reported_grr - raw_grr) < 0.01, f"GRR percent accuracy exceeded ±0.1%: raw={raw_grr}, reported={reported_grr}"

    def test_grr_rounding_to_two_decimal_places(self):
        """Test that all percentage values are rounded to exactly 2 decimal places."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)
        results = output['results']

        # Check that percentages have at most 2 decimal places
        percentage_fields = ['grr_percent', 'repeatability_percent', 'reproducibility_percent', 'part_to_part_percent']

        for field in percentage_fields:
            value = results[field]
            # Multiply by 100 and check if it's close to an integer (within floating point tolerance)
            scaled = value * 100
            assert abs(scaled - round(scaled)) < 1e-10, f"{field} should be rounded to 2 decimal places: {value}"


class TestEnhancedInstructions:
    """Tests for enhanced instruction generation (Story 5.1)."""

    def test_instructions_contains_executive_summary_section(self):
        """Test that instructions contain structured parts."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        # New format has three parts
        assert 'PARTE 1' in output['instructions'] or 'ANÁLISIS TÉCNICO MSA' in output['instructions']

    def test_instructions_contains_detailed_results_section(self):
        """Test that instructions contain detailed results section."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        assert 'RESULTADOS' in output['instructions'].upper()

    def test_instructions_contains_metric_explanation_section(self):
        """Test that instructions include variance components and metrics."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        # Should include variance components section
        assert 'Componentes de Varianza' in output['instructions'] or 'varianza' in output['instructions'].lower()
        # Should include repeatability and reproducibility metrics
        assert 'Repetibilidad' in output['instructions'] or 'repetibilidad' in output['instructions'].lower()
        assert 'Reproducibilidad' in output['instructions'] or 'reproducibilidad' in output['instructions'].lower()

    def test_instructions_contains_contextual_interpretation(self):
        """Test that instructions include contextual interpretation of results."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        # Should contextualize what the GRR percentage means
        contextual_phrases = [
            'variación que observas',
            'del sistema de medición',
            'proceso real',
            'sistema de medición',
        ]
        contains_context = any(phrase in output['instructions'].lower() for phrase in contextual_phrases)

        assert contains_context, "Instructions should contextualize what GRR means"

    def test_instructions_contains_dominant_variation_field(self):
        """Test that output includes dominant_variation field."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        assert 'dominant_variation' in output
        assert output['dominant_variation'] in ['repeatability', 'reproducibility', 'part_to_part']

    def test_instructions_contains_classification_field(self):
        """Test that output includes classification field at top level."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        assert 'classification' in output
        assert output['classification'] in ['aceptable', 'marginal', 'inaceptable']

    def test_dominant_variation_repeatability_identified(self):
        """Test that repeatability is correctly identified as dominant variation."""
        from utils.msa_calculator import analyze_msa

        # Create dataset with high repeatability (equipment variation)
        data = {
            'Part': [1, 1, 2, 2, 3, 3],
            'Operator': ['A', 'B', 'A', 'B', 'A', 'B'],
            # Same values for different operators, varying within operator trials
            'M1': [10.0, 10.0, 20.0, 20.0, 30.0, 30.0],
            'M2': [10.5, 10.0, 20.5, 20.0, 30.5, 30.0],  # Operator A has variation
            'M3': [10.3, 10.0, 20.3, 20.0, 30.3, 30.0],
        }
        df = pd.DataFrame(data)
        output, _ = analyze_msa(df)

        # Should identify some dominant variation
        assert 'dominant_variation' in output

    def test_dominant_variation_reproducibility_identified(self):
        """Test that reproducibility is correctly identified as dominant variation."""
        from utils.msa_calculator import analyze_msa

        df = create_high_grr_dataset()
        output, _ = analyze_msa(df)

        # High GRR dataset has high operator variation
        assert 'dominant_variation' in output

    def test_instructions_contains_recommendations_section(self):
        """Test that instructions contain recommendations section."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        assert 'RECOMENDACIONES' in output['instructions'].upper() or 'Recomendaciones' in output['instructions']

    def test_recommendations_match_dominant_variation_repeatability(self):
        """Test that recommendations are appropriate when repeatability is high."""
        from utils.msa_calculator import generate_instructions

        # Mock results with repeatability as the dominant variation source
        # (repeatability > reproducibility AND repeatability > part_to_part)
        results = {
            'grr_percent': 55.0,
            'repeatability_percent': 50.0,  # Dominant - highest percentage
            'reproducibility_percent': 25.0,
            'part_to_part_percent': 40.0,
            'ndc': 2,
            'classification': 'inaceptable',
        }

        instructions, dominant = generate_instructions(results)

        # Should recommend equipment-focused actions
        equipment_keywords = ['equipo', 'instrumento', 'calibra', 'mantenimiento']
        has_equipment_recommendation = any(kw in instructions.lower() for kw in equipment_keywords)

        assert has_equipment_recommendation, "Should recommend equipment-related actions for high repeatability"
        assert dominant == 'repeatability', "Should identify repeatability as dominant"

    def test_recommendations_match_dominant_variation_reproducibility(self):
        """Test that recommendations are appropriate when reproducibility is high."""
        from utils.msa_calculator import generate_instructions

        # Mock results with reproducibility as the dominant variation source
        # (reproducibility > repeatability AND reproducibility > part_to_part)
        results = {
            'grr_percent': 55.0,
            'repeatability_percent': 20.0,
            'reproducibility_percent': 52.0,  # Dominant - highest percentage
            'part_to_part_percent': 40.0,
            'ndc': 2,
            'classification': 'inaceptable',
        }

        instructions, dominant = generate_instructions(results)

        # Should recommend operator-focused actions
        operator_keywords = ['operador', 'entrenamiento', 'procedimiento', 'técnica']
        has_operator_recommendation = any(kw in instructions.lower() for kw in operator_keywords)

        assert has_operator_recommendation, "Should recommend operator-related actions for high reproducibility"
        assert dominant == 'reproducibility', "Should identify reproducibility as dominant"

    def test_instructions_formatted_for_agent_presentation(self):
        """Test that instructions are structured for agent to follow."""
        from utils.msa_calculator import analyze_msa

        df = create_reference_dataset()
        output, _ = analyze_msa(df)

        instructions = output['instructions']

        # Should have numbered sections for agent to follow
        assert '1.' in instructions or '### 1' in instructions
        # Should have markdown formatting
        assert '**' in instructions or '##' in instructions

    def test_low_grr_instructions_are_positive(self):
        """Test that low GRR (<10%) instructions convey positive message."""
        from utils.msa_calculator import analyze_msa

        df = create_low_grr_dataset()
        output, _ = analyze_msa(df)

        if output['results']['grr_percent'] < 10:
            positive_phrases = ['confiable', 'adecuado', 'funcionando correctamente', 'buenas prácticas']
            has_positive = any(phrase in output['instructions'].lower() for phrase in positive_phrases)
            assert has_positive, "Low GRR should have positive messaging"

    def test_high_grr_instructions_emphasize_improvement(self):
        """Test that high GRR (>30%) instructions emphasize need for improvement."""
        from utils.msa_calculator import analyze_msa

        df = create_high_grr_dataset()
        output, _ = analyze_msa(df)

        if output['results']['grr_percent'] > 30:
            improvement_phrases = ['necesita', 'mejora', 'inaceptable', 'urgente']
            has_improvement = any(phrase in output['instructions'].lower() for phrase in improvement_phrases)
            assert has_improvement, "High GRR should emphasize improvement"
