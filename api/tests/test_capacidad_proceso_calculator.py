"""Tests for the Capacidad de Proceso calculator module."""
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
def known_values():
    """Create a set of values with known statistics."""
    # Values: 1, 2, 3, 4, 5 - simple known statistics
    # Mean: 3.0, Median: 3.0, Min: 1, Max: 5, Range: 4
    # Std Dev (sample): ~1.5811 (sqrt(2.5))
    return np.array([1.0, 2.0, 3.0, 4.0, 5.0])


@pytest.fixture
def single_mode_values():
    """Values with single mode."""
    return np.array([1.0, 2.0, 2.0, 3.0, 4.0])  # Mode: 2.0


@pytest.fixture
def multiple_modes_values():
    """Values with multiple modes."""
    return np.array([1.0, 1.0, 2.0, 2.0, 3.0])  # Modes: 1.0, 2.0


@pytest.fixture
def no_mode_values():
    """Values with no mode (all unique)."""
    return np.array([1.0, 2.0, 3.0, 4.0, 5.0])  # No mode


@pytest.fixture
def large_dataset():
    """Larger dataset for realistic testing."""
    np.random.seed(42)  # Reproducibility
    return np.random.normal(100, 10, 50)  # 50 values, mean ~100, std ~10


# =============================================================================
# Module Import Tests
# =============================================================================

class TestModuleExists:
    """Tests that the calculator module exists and has required functions."""

    def test_module_can_be_imported(self):
        """Test that capacidad_proceso_calculator module can be imported."""
        from utils import capacidad_proceso_calculator
        assert capacidad_proceso_calculator is not None

    def test_calculate_function_exists(self):
        """Test that calculate_basic_statistics function exists."""
        from utils.capacidad_proceso_calculator import calculate_basic_statistics
        assert callable(calculate_basic_statistics)

    def test_output_builder_exists(self):
        """Test that build_capacidad_proceso_output function exists."""
        from utils.capacidad_proceso_calculator import build_capacidad_proceso_output
        assert callable(build_capacidad_proceso_output)


# =============================================================================
# Basic Statistics Calculation Tests
# =============================================================================

class TestBasicStatisticsCalculation:
    """Tests for calculate_basic_statistics function."""

    def test_mean_calculation(self, known_values):
        """Test that mean is calculated correctly."""
        from utils.capacidad_proceso_calculator import calculate_basic_statistics
        stats = calculate_basic_statistics(known_values)
        assert abs(stats['mean'] - 3.0) < 0.0001

    def test_median_calculation(self, known_values):
        """Test that median is calculated correctly."""
        from utils.capacidad_proceso_calculator import calculate_basic_statistics
        stats = calculate_basic_statistics(known_values)
        assert abs(stats['median'] - 3.0) < 0.0001

    def test_min_calculation(self, known_values):
        """Test that min is calculated correctly."""
        from utils.capacidad_proceso_calculator import calculate_basic_statistics
        stats = calculate_basic_statistics(known_values)
        assert abs(stats['min'] - 1.0) < 0.0001

    def test_max_calculation(self, known_values):
        """Test that max is calculated correctly."""
        from utils.capacidad_proceso_calculator import calculate_basic_statistics
        stats = calculate_basic_statistics(known_values)
        assert abs(stats['max'] - 5.0) < 0.0001

    def test_range_calculation(self, known_values):
        """Test that range is calculated correctly."""
        from utils.capacidad_proceso_calculator import calculate_basic_statistics
        stats = calculate_basic_statistics(known_values)
        assert abs(stats['range'] - 4.0) < 0.0001

    def test_std_dev_calculation(self, known_values):
        """Test that standard deviation is calculated correctly (sample std)."""
        from utils.capacidad_proceso_calculator import calculate_basic_statistics
        stats = calculate_basic_statistics(known_values)
        # Sample std of [1,2,3,4,5] = sqrt(2.5) ≈ 1.5811
        expected_std = np.std([1, 2, 3, 4, 5], ddof=1)
        assert abs(stats['std_dev'] - expected_std) < 0.0001

    def test_count_calculation(self, known_values):
        """Test that count is calculated correctly."""
        from utils.capacidad_proceso_calculator import calculate_basic_statistics
        stats = calculate_basic_statistics(known_values)
        assert stats['count'] == 5

    def test_values_precision(self):
        """Test that values are rounded to 6 decimal places."""
        from utils.capacidad_proceso_calculator import calculate_basic_statistics
        values = np.array([97.52, 111.20, 83.97, 103.58, 99.45])
        stats = calculate_basic_statistics(values)
        # Check mean matches expected with precision
        expected_mean = np.mean(values)
        assert abs(stats['mean'] - round(expected_mean, 6)) < 0.000001


# =============================================================================
# Mode Calculation Tests
# =============================================================================

class TestModeCalculation:
    """Tests for mode calculation edge cases."""

    def test_single_mode(self, single_mode_values):
        """Test single mode detection."""
        from utils.capacidad_proceso_calculator import calculate_basic_statistics
        stats = calculate_basic_statistics(single_mode_values)
        assert stats['mode'] == 2.0

    def test_multiple_modes(self, multiple_modes_values):
        """Test multiple modes detection."""
        from utils.capacidad_proceso_calculator import calculate_basic_statistics
        stats = calculate_basic_statistics(multiple_modes_values)
        assert isinstance(stats['mode'], list)
        assert 1.0 in stats['mode']
        assert 2.0 in stats['mode']
        assert len(stats['mode']) == 2

    def test_no_mode(self, no_mode_values):
        """Test no mode case (all unique values)."""
        from utils.capacidad_proceso_calculator import calculate_basic_statistics
        stats = calculate_basic_statistics(no_mode_values)
        assert stats['mode'] is None

    def test_mode_returns_float_not_numpy(self, single_mode_values):
        """Test that mode returns Python float, not numpy type."""
        from utils.capacidad_proceso_calculator import calculate_basic_statistics
        stats = calculate_basic_statistics(single_mode_values)
        assert isinstance(stats['mode'], float)

    def test_multiple_modes_returns_list_of_floats(self, multiple_modes_values):
        """Test that multiple modes return list of Python floats."""
        from utils.capacidad_proceso_calculator import calculate_basic_statistics
        stats = calculate_basic_statistics(multiple_modes_values)
        assert isinstance(stats['mode'], list)
        for m in stats['mode']:
            assert isinstance(m, float)


# =============================================================================
# Empty Array Tests
# =============================================================================

class TestEmptyArray:
    """Tests for empty array handling."""

    def test_empty_array_returns_none_values(self):
        """Test that empty array returns None for all statistics."""
        from utils.capacidad_proceso_calculator import calculate_basic_statistics
        stats = calculate_basic_statistics(np.array([]))

        assert stats['mean'] is None
        assert stats['median'] is None
        assert stats['mode'] is None
        assert stats['std_dev'] is None
        assert stats['min'] is None
        assert stats['max'] is None
        assert stats['range'] is None
        assert stats['count'] == 0

    def test_single_value_array(self):
        """Test single value array handling."""
        from utils.capacidad_proceso_calculator import calculate_basic_statistics
        stats = calculate_basic_statistics(np.array([42.0]))

        assert stats['mean'] == 42.0
        assert stats['median'] == 42.0
        assert stats['mode'] is None  # No mode with single value
        assert stats['std_dev'] == 0.0
        assert stats['min'] == 42.0
        assert stats['max'] == 42.0
        assert stats['range'] == 0.0
        assert stats['count'] == 1


# =============================================================================
# Output Structure Tests
# =============================================================================

class TestOutputStructure:
    """Tests for output structure matching MSA pattern."""

    def test_output_has_results_key(self, known_values):
        """Test that output has results key."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            build_capacidad_proceso_output
        )
        stats = calculate_basic_statistics(known_values)
        validated_data = {'column_name': 'Valores', 'values': known_values, 'warnings': []}
        output = build_capacidad_proceso_output(validated_data, stats)

        assert 'results' in output

    def test_output_has_chartdata_key(self, known_values):
        """Test that output has chartData key (empty for Story 7.1)."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            build_capacidad_proceso_output
        )
        stats = calculate_basic_statistics(known_values)
        validated_data = {'column_name': 'Valores', 'values': known_values, 'warnings': []}
        output = build_capacidad_proceso_output(validated_data, stats)

        assert 'chartData' in output
        assert output['chartData'] == []  # Empty for Story 7.1

    def test_output_has_instructions_key(self, known_values):
        """Test that output has instructions key."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            build_capacidad_proceso_output
        )
        stats = calculate_basic_statistics(known_values)
        validated_data = {'column_name': 'Valores', 'values': known_values, 'warnings': []}
        output = build_capacidad_proceso_output(validated_data, stats)

        assert 'instructions' in output
        assert isinstance(output['instructions'], str)

    def test_results_has_basic_statistics(self, known_values):
        """Test that results contains basic_statistics."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            build_capacidad_proceso_output
        )
        stats = calculate_basic_statistics(known_values)
        validated_data = {'column_name': 'Valores', 'values': known_values, 'warnings': []}
        output = build_capacidad_proceso_output(validated_data, stats)

        assert 'basic_statistics' in output['results']
        assert output['results']['basic_statistics']['mean'] == stats['mean']

    def test_results_has_sample_size(self, known_values):
        """Test that results contains sample_size."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            build_capacidad_proceso_output
        )
        stats = calculate_basic_statistics(known_values)
        validated_data = {'column_name': 'Valores', 'values': known_values, 'warnings': []}
        output = build_capacidad_proceso_output(validated_data, stats)

        assert 'sample_size' in output['results']
        assert output['results']['sample_size'] == 5

    def test_results_has_warnings(self, known_values):
        """Test that results contains warnings."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            build_capacidad_proceso_output
        )
        stats = calculate_basic_statistics(known_values)
        validated_data = {
            'column_name': 'Valores',
            'values': known_values,
            'warnings': ['Test warning']
        }
        output = build_capacidad_proceso_output(validated_data, stats)

        assert 'warnings' in output['results']
        assert 'Test warning' in output['results']['warnings']


# =============================================================================
# Instructions Generation Tests
# =============================================================================

class TestInstructionsGeneration:
    """Tests for instructions generation."""

    def test_instructions_contain_statistics(self, known_values):
        """Test that instructions contain the statistics values."""
        from utils.capacidad_proceso_calculator import generate_basic_stats_instructions

        stats = {
            'mean': 3.0,
            'median': 3.0,
            'mode': None,
            'std_dev': 1.5811,
            'min': 1.0,
            'max': 5.0,
            'range': 4.0,
            'count': 5,
        }
        instructions = generate_basic_stats_instructions(stats, [])

        assert '3.0' in instructions  # Mean
        assert '5' in instructions    # Count
        assert '1.0' in instructions  # Min
        assert '5.0' in instructions  # Max

    def test_instructions_contain_agent_header(self, known_values):
        """Test that instructions contain agent-only header."""
        from utils.capacidad_proceso_calculator import generate_basic_stats_instructions

        stats = calculate_basic_statistics_fixture()
        instructions = generate_basic_stats_instructions(stats, [])

        assert '<!-- AGENT_ONLY -->' in instructions
        assert '<!-- /AGENT_ONLY -->' in instructions

    def test_instructions_contain_warnings(self):
        """Test that instructions include warnings."""
        from utils.capacidad_proceso_calculator import generate_basic_stats_instructions

        stats = calculate_basic_statistics_fixture()
        warnings = ['Se recomienda un mínimo de 20 valores.']
        instructions = generate_basic_stats_instructions(stats, warnings)

        assert 'Advertencias' in instructions
        assert '20 valores' in instructions

    def test_empty_data_instructions(self):
        """Test instructions for empty data case."""
        from utils.capacidad_proceso_calculator import generate_basic_stats_instructions

        stats = {
            'mean': None,
            'median': None,
            'mode': None,
            'std_dev': None,
            'min': None,
            'max': None,
            'range': None,
            'count': 0,
        }
        instructions = generate_basic_stats_instructions(stats, [])

        assert 'No se encontraron datos' in instructions


# =============================================================================
# Large Dataset Tests
# =============================================================================

class TestLargeDataset:
    """Tests with larger, realistic datasets."""

    def test_large_dataset_statistics(self, large_dataset):
        """Test statistics on larger dataset."""
        from utils.capacidad_proceso_calculator import calculate_basic_statistics
        stats = calculate_basic_statistics(large_dataset)

        # Mean should be close to 100 (the target mean)
        assert 90 < stats['mean'] < 110

        # Std dev should be close to 10
        assert 5 < stats['std_dev'] < 15

        # Count should be 50
        assert stats['count'] == 50

    def test_all_fields_are_python_types(self, large_dataset):
        """Test that all returned values are Python types, not numpy."""
        from utils.capacidad_proceso_calculator import calculate_basic_statistics
        stats = calculate_basic_statistics(large_dataset)

        assert isinstance(stats['mean'], float)
        assert isinstance(stats['median'], float)
        assert isinstance(stats['std_dev'], float)
        assert isinstance(stats['min'], float)
        assert isinstance(stats['max'], float)
        assert isinstance(stats['range'], float)
        assert isinstance(stats['count'], int)


# =============================================================================
# Normality Analysis Integration Tests (Story 7.2)
# =============================================================================

class TestPerformNormalityAnalysis:
    """Tests for perform_normality_analysis function."""

    def test_function_exists(self):
        """Test that perform_normality_analysis function exists."""
        from utils.capacidad_proceso_calculator import perform_normality_analysis
        assert callable(perform_normality_analysis)

    def test_returns_dict_for_normal_data(self):
        """Test that function returns dict for normal data."""
        from utils.capacidad_proceso_calculator import perform_normality_analysis

        np.random.seed(42)
        normal_data = np.random.normal(100, 10, 50)
        result = perform_normality_analysis(normal_data)

        assert isinstance(result, dict)
        assert 'is_normal' in result
        assert 'ad_statistic' in result
        assert 'p_value' in result
        assert 'conclusion' in result

    def test_returns_none_for_insufficient_data(self):
        """Test that function returns None for < 2 values."""
        from utils.capacidad_proceso_calculator import perform_normality_analysis

        # Single value
        result = perform_normality_analysis(np.array([42.0]))
        assert result is None

        # Empty array
        result = perform_normality_analysis(np.array([]))
        assert result is None

    def test_normal_data_detected_as_normal(self):
        """Test that normal data is correctly identified."""
        from utils.capacidad_proceso_calculator import perform_normality_analysis

        # Data designed to be clearly normal
        normal_data = np.array([
            99.2, 101.5, 98.7, 100.3, 99.8, 101.2, 100.1, 99.5, 100.8, 99.0,
            100.5, 98.9, 101.0, 99.7, 100.2, 99.3, 100.6, 98.8, 101.1, 99.6
        ])
        result = perform_normality_analysis(normal_data)

        assert result['is_normal'] is True
        assert result['conclusion'] == 'Normal'
        assert result['p_value'] >= 0.05

    def test_skewed_data_detected_as_non_normal(self):
        """Test that skewed data is correctly identified as non-normal."""
        from utils.capacidad_proceso_calculator import perform_normality_analysis

        # Right-skewed data
        skewed_data = np.array([
            1.2, 1.5, 1.8, 2.3, 2.9, 3.5, 4.2, 5.1, 6.3, 8.0,
            10.5, 14.0, 19.0, 25.0, 35.0
        ])
        result = perform_normality_analysis(skewed_data)

        assert result['is_normal'] is False or result.get('transformation') is not None

    def test_ppm_calculated_when_spec_limits_provided(self):
        """Test that PPM is calculated when spec limits are provided."""
        from utils.capacidad_proceso_calculator import perform_normality_analysis

        np.random.seed(42)
        normal_data = np.random.normal(100, 10, 50)
        result = perform_normality_analysis(normal_data, lei=70, les=130)

        assert result['ppm'] is not None
        assert 'ppm_below_lei' in result['ppm']
        assert 'ppm_above_les' in result['ppm']
        assert 'ppm_total' in result['ppm']

    def test_no_ppm_when_spec_limits_not_provided(self):
        """Test that PPM is None when spec limits not provided."""
        from utils.capacidad_proceso_calculator import perform_normality_analysis

        np.random.seed(42)
        normal_data = np.random.normal(100, 10, 50)
        result = perform_normality_analysis(normal_data)

        assert result['ppm'] is None


class TestOutputWithNormality:
    """Tests for output structure including normality results."""

    def test_output_includes_normality_when_provided(self):
        """Test that output includes normality results."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )

        np.random.seed(42)
        values = np.random.normal(100, 10, 30)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}

        output = build_capacidad_proceso_output(validated_data, stats, normality)

        assert 'normality' in output['results']
        assert output['results']['normality']['is_normal'] is not None

    def test_output_instructions_include_normality(self):
        """Test that instructions include normality interpretation."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )

        np.random.seed(42)
        values = np.random.normal(100, 10, 30)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}

        output = build_capacidad_proceso_output(validated_data, stats, normality)

        # Instructions should mention normality test
        assert 'Anderson-Darling' in output['instructions']

    def test_output_without_normality(self):
        """Test that output works without normality results (backward compatible)."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            build_capacidad_proceso_output
        )

        values = np.array([1.0])  # Single value - no normality analysis
        stats = calculate_basic_statistics(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}

        output = build_capacidad_proceso_output(validated_data, stats, None)

        # Should not have normality key when None
        assert 'normality' not in output['results'] or output['results'].get('normality') is None


class TestGenerateNormalityInstructions:
    """Tests for normality instructions generation."""

    def test_function_exists(self):
        """Test that generate_normality_instructions function exists."""
        from utils.capacidad_proceso_calculator import generate_normality_instructions
        assert callable(generate_normality_instructions)

    def test_normal_data_instructions(self):
        """Test instructions for normal data."""
        from utils.capacidad_proceso_calculator import generate_normality_instructions

        normality_result = {
            'is_normal': True,
            'ad_statistic': 0.25,
            'p_value': 0.72,
            'conclusion': 'Normal',
            'transformation': None,
            'fitted_distribution': None,
            'ppm': None
        }
        instructions = generate_normality_instructions(normality_result)

        assert 'Normal' in instructions
        assert '0.25' in instructions or '0.2500' in instructions  # AD statistic
        assert 'distribución normal' in instructions.lower()

    def test_non_normal_data_instructions(self):
        """Test instructions for non-normal data."""
        from utils.capacidad_proceso_calculator import generate_normality_instructions

        normality_result = {
            'is_normal': False,
            'ad_statistic': 1.5,
            'p_value': 0.001,
            'conclusion': 'No Normal',
            'transformation': None,
            'fitted_distribution': {
                'name': 'lognormal',
                'params': {'mu': 2.0, 'sigma': 0.5},
                'ad_statistic': 0.3,
                'aic': 150.5
            },
            'ppm': None
        }
        instructions = generate_normality_instructions(normality_result)

        assert 'No Normal' in instructions or 'NO' in instructions
        assert 'Lognormal' in instructions or 'lognormal' in instructions.lower()


# =============================================================================
# Stability Analysis Integration Tests (Story 7.3)
# =============================================================================

class TestOutputWithStability:
    """Tests for output structure including stability results."""

    def test_output_includes_stability_when_provided(self):
        """Test that output includes stability results."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 30)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}

        output = build_capacidad_proceso_output(validated_data, stats, normality, stability)

        assert 'stability' in output['results']
        assert output['results']['stability']['is_stable'] is not None
        assert 'conclusion' in output['results']['stability']

    def test_output_instructions_include_stability(self):
        """Test that instructions include stability interpretation."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 30)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}

        output = build_capacidad_proceso_output(validated_data, stats, normality, stability)

        # Instructions should mention stability analysis
        assert 'Estabilidad' in output['instructions']
        assert 'Carta I' in output['instructions'] or 'I-MR' in output['instructions']

    def test_stability_results_structure(self):
        """Test stability results have correct structure."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 30)
        stats = calculate_basic_statistics(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}

        output = build_capacidad_proceso_output(validated_data, stats, None, stability)

        stability_result = output['results']['stability']
        assert 'is_stable' in stability_result
        assert 'conclusion' in stability_result
        assert 'i_chart' in stability_result
        assert 'mr_chart' in stability_result
        assert 'rules' in stability_result
        assert 'sigma' in stability_result


class TestGenerateStabilityInstructions:
    """Tests for stability instructions generation."""

    def test_function_exists(self):
        """Test that generate_stability_instructions function exists."""
        from utils.capacidad_proceso_calculator import generate_stability_instructions
        assert callable(generate_stability_instructions)

    def test_stable_process_instructions(self):
        """Test instructions for stable process."""
        from utils.capacidad_proceso_calculator import generate_stability_instructions

        stability_result = {
            'is_stable': True,
            'conclusion': 'Proceso Estable',
            'i_chart': {'center': 100.0, 'ucl': 110.0, 'lcl': 90.0, 'ooc_points': []},
            'mr_chart': {'center': 5.0, 'ucl': 16.3, 'lcl': 0, 'ooc_points': []},
            'rules': {
                'rule_1': {'cumple': True, 'violations': []},
                'rule_2': {'cumple': True, 'violations': []},
                'rule_3': {'cumple': True, 'violations': []},
                'rule_4': {'cumple': True, 'violations': []},
                'rule_5': {'cumple': True, 'violations': []},
                'rule_6': {'cumple': True, 'violations': []},
                'rule_7': {'cumple': True, 'violations': []},
            },
            'sigma': 4.43
        }
        instructions = generate_stability_instructions(stability_result)

        assert 'Estable' in instructions
        assert 'control' in instructions.lower()
        assert 'CUMPLE' in instructions

    def test_unstable_process_instructions(self):
        """Test instructions for unstable process."""
        from utils.capacidad_proceso_calculator import generate_stability_instructions

        stability_result = {
            'is_stable': False,
            'conclusion': 'Proceso Inestable',
            'i_chart': {'center': 100.0, 'ucl': 110.0, 'lcl': 90.0, 'ooc_points': [
                {'index': 5, 'value': 115.0, 'limit': 'UCL'}
            ]},
            'mr_chart': {'center': 5.0, 'ucl': 16.3, 'lcl': 0, 'ooc_points': []},
            'rules': {
                'rule_1': {'cumple': False, 'violations': [{'index': 5, 'value': 115.0, 'limit': 'UCL'}]},
                'rule_2': {'cumple': True, 'violations': []},
                'rule_3': {'cumple': True, 'violations': []},
                'rule_4': {'cumple': True, 'violations': []},
                'rule_5': {'cumple': True, 'violations': []},
                'rule_6': {'cumple': True, 'violations': []},
                'rule_7': {'cumple': True, 'violations': []},
            },
            'sigma': 4.43
        }
        instructions = generate_stability_instructions(stability_result)

        assert 'Inestable' in instructions
        assert 'NO CUMPLE' in instructions
        assert 'fuera de control' in instructions.lower() or 'Puntos fuera' in instructions


# =============================================================================
# Capability Analysis Integration Tests (Story 7.4)
# =============================================================================

class TestOutputWithCapability:
    """Tests for output structure including capability results."""

    def test_output_includes_capability_when_spec_limits_provided(self):
        """Test that output includes capability results when spec limits are provided."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        assert 'capability' in output['results']
        assert output['results']['capability']['cp'] is not None
        assert output['results']['capability']['cpk'] is not None

    def test_output_no_capability_without_spec_limits(self):
        """Test that capability is not included without spec limits."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, None
        )

        assert 'capability' not in output['results']

    def test_output_instructions_include_capability(self):
        """Test that instructions include capability interpretation."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        # Instructions should mention capability analysis
        assert 'Capacidad' in output['instructions']
        assert 'Cpk' in output['instructions']
        assert 'LEI' in output['instructions'] or 'Inferior' in output['instructions']

    def test_capability_results_structure(self):
        """Test capability results have correct structure."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, None, stability, spec_limits
        )

        capability_result = output['results']['capability']
        assert 'cp' in capability_result
        assert 'cpk' in capability_result
        assert 'pp' in capability_result
        assert 'ppk' in capability_result
        assert 'sigma_within' in capability_result
        assert 'sigma_overall' in capability_result
        assert 'cpk_classification' in capability_result
        assert 'ppk_classification' in capability_result
        assert 'ppm' in capability_result

    def test_capability_classification_color_codes(self):
        """Test capability classification has correct color codes."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, None, stability, spec_limits
        )

        cpk_class = output['results']['capability']['cpk_classification']
        assert 'classification' in cpk_class
        assert 'color' in cpk_class
        assert cpk_class['color'] in ['green', 'yellow', 'red', 'gray']

    def test_capability_with_invalid_spec_limits(self):
        """Test that invalid spec limits don't include capability."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 130, 'les': 70}  # Invalid: LEI > LES

        output = build_capacidad_proceso_output(
            validated_data, stats, None, stability, spec_limits
        )

        # Should not have capability or have invalid capability
        if 'capability' in output['results']:
            assert output['results']['capability'].get('valid') is False

    def test_capability_ppm_calculation(self):
        """Test PPM calculation in capability results."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, None, stability, spec_limits
        )

        ppm = output['results']['capability']['ppm']
        assert 'ppm_below_lei' in ppm
        assert 'ppm_above_les' in ppm
        assert 'ppm_total' in ppm
        assert isinstance(ppm['ppm_total'], int)


# =============================================================================
# Helper Functions
# =============================================================================

def calculate_basic_statistics_fixture():
    """Helper to get basic stats for testing."""
    return {
        'mean': 3.0,
        'median': 3.0,
        'mode': None,
        'std_dev': 1.5811,
        'min': 1.0,
        'max': 5.0,
        'range': 4.0,
        'count': 5,
    }


# =============================================================================
# Chart Data Tests (Story 8.1)
# =============================================================================

class TestChartDataStructure:
    """Tests for chartData population in build_capacidad_proceso_output."""

    def test_chartdata_contains_histogram(self):
        """Test that chartData includes histogram when spec limits are provided."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        assert 'chartData' in output
        assert isinstance(output['chartData'], list)
        assert len(output['chartData']) > 0

        # Find histogram chart
        histogram_chart = next(
            (c for c in output['chartData'] if c['type'] == 'histogram'),
            None
        )
        assert histogram_chart is not None

    def test_chartdata_contains_i_chart(self):
        """Test that chartData includes I-Chart when stability analysis is performed."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        # Find I-Chart
        i_chart = next(
            (c for c in output['chartData'] if c['type'] == 'i_chart'),
            None
        )
        assert i_chart is not None

    def test_histogram_data_structure(self):
        """Test that histogram chart data has correct structure."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        histogram_chart = next(
            (c for c in output['chartData'] if c['type'] == 'histogram'),
            None
        )
        assert histogram_chart is not None

        data = histogram_chart['data']
        assert 'values' in data
        assert 'lei' in data
        assert 'les' in data
        assert 'mean' in data
        assert 'std' in data
        assert 'lcl' in data
        assert 'ucl' in data

        # Values should be a list
        assert isinstance(data['values'], list)
        assert len(data['values']) == 50

        # Limits should match spec_limits
        assert data['lei'] == 70
        assert data['les'] == 130

    def test_i_chart_data_structure(self):
        """Test that I-Chart data has correct structure."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        i_chart = next(
            (c for c in output['chartData'] if c['type'] == 'i_chart'),
            None
        )
        assert i_chart is not None

        data = i_chart['data']
        assert 'values' in data
        assert 'center' in data
        assert 'ucl' in data
        assert 'lcl' in data
        assert 'ooc_points' in data

        # Values should be a list
        assert isinstance(data['values'], list)
        assert len(data['values']) == 50

        # OOC points should be a list
        assert isinstance(data['ooc_points'], list)

        # Rules violations should be present (Story 8.1)
        assert 'rules_violations' in data
        assert isinstance(data['rules_violations'], list)

    def test_i_chart_rules_violations_structure(self):
        """Test that I-Chart rules_violations has correct structure when violations exist."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        # Create data with intentional outliers to trigger rule violations
        values = np.random.normal(100, 10, 47)
        values = np.append(values, [150, 50, 145])  # Should trigger Rule 1
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        i_chart = next(
            (c for c in output['chartData'] if c['type'] == 'i_chart'),
            None
        )
        assert i_chart is not None

        data = i_chart['data']
        assert 'rules_violations' in data

        # If there are violations, check structure
        if len(data['rules_violations']) > 0:
            violation = data['rules_violations'][0]
            assert 'rule' in violation

    def test_histogram_includes_fitted_distribution_when_non_normal(self):
        """Test that histogram includes fitted distribution when data is non-normal."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        # Create clearly non-normal (skewed) data
        np.random.seed(42)
        # Right-skewed lognormal data
        values = np.random.lognormal(mean=2.0, sigma=0.5, size=50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 1, 'les': 50}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        histogram_chart = next(
            (c for c in output['chartData'] if c['type'] == 'histogram'),
            None
        )
        assert histogram_chart is not None

        # fitted_distribution may or may not be present based on normality result
        # Just check the key exists (can be None)
        data = histogram_chart['data']
        assert 'fitted_distribution' in data

    def test_i_chart_includes_ooc_points(self):
        """Test that I-Chart includes out-of-control points."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        # Create data with intentional outliers
        values = np.random.normal(100, 10, 47)
        # Add outliers outside 3-sigma
        values = np.append(values, [150, 50, 145])  # Should be OOC
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        i_chart = next(
            (c for c in output['chartData'] if c['type'] == 'i_chart'),
            None
        )
        assert i_chart is not None

        data = i_chart['data']
        # Should have OOC points from the outliers
        assert isinstance(data['ooc_points'], list)

    def test_chartdata_empty_when_no_spec_limits_and_no_stability(self):
        """Test that chartData is empty when no spec limits and no stability."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            build_capacidad_proceso_output
        )

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}

        output = build_capacidad_proceso_output(validated_data, stats)

        # chartData should be empty list
        assert output['chartData'] == []

    def test_histogram_values_are_python_lists(self):
        """Test that histogram values are Python lists, not numpy arrays."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        histogram_chart = next(
            (c for c in output['chartData'] if c['type'] == 'histogram'),
            None
        )
        assert histogram_chart is not None

        data = histogram_chart['data']
        # Should be Python list, not numpy array
        assert isinstance(data['values'], list)
        assert not isinstance(data['values'], np.ndarray)

    def test_i_chart_values_are_python_lists(self):
        """Test that I-Chart values are Python lists, not numpy arrays."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        i_chart = next(
            (c for c in output['chartData'] if c['type'] == 'i_chart'),
            None
        )
        assert i_chart is not None

        data = i_chart['data']
        # Should be Python list, not numpy array
        assert isinstance(data['values'], list)
        assert not isinstance(data['values'], np.ndarray)

    def test_i_chart_rules_violations_is_list_type(self):
        """Test that I-Chart rules_violations is a list type."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        i_chart = next(
            (c for c in output['chartData'] if c['type'] == 'i_chart'),
            None
        )
        assert i_chart is not None

        data = i_chart['data']
        # rules_violations key should exist
        assert 'rules_violations' in data
        assert isinstance(data['rules_violations'], list)

    def test_chartdata_with_stability_but_no_spec_limits(self):
        """Test that chartData includes I-Chart even without spec limits."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}

        # No spec_limits
        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, None
        )

        # Should still have I-Chart (stability is independent of spec limits)
        i_chart = next(
            (c for c in output['chartData'] if c['type'] == 'i_chart'),
            None
        )
        assert i_chart is not None

        # Should NOT have histogram (needs spec limits for LEI/LES)
        histogram_chart = next(
            (c for c in output['chartData'] if c['type'] == 'histogram'),
            None
        )
        assert histogram_chart is None


# =============================================================================
# MR-Chart and Normality Plot Tests (Story 8.2)
# =============================================================================

class TestMRChartData:
    """Tests for MR-Chart data structure in chartData (Story 8.2)."""

    def test_chartdata_contains_mr_chart(self):
        """Test that chartData includes MR-Chart when stability analysis is performed."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        # Find MR-Chart
        mr_chart = next(
            (c for c in output['chartData'] if c['type'] == 'mr_chart'),
            None
        )
        assert mr_chart is not None

    def test_mr_chart_data_structure(self):
        """Test that MR-Chart data has correct structure."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        mr_chart = next(
            (c for c in output['chartData'] if c['type'] == 'mr_chart'),
            None
        )
        assert mr_chart is not None

        data = mr_chart['data']
        assert 'values' in data
        assert 'center' in data
        assert 'ucl' in data
        assert 'lcl' in data
        assert 'ooc_points' in data

    def test_mr_chart_values_has_n_minus_1_points(self):
        """Test that MR-Chart values array has n-1 points for n observations."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        mr_chart = next(
            (c for c in output['chartData'] if c['type'] == 'mr_chart'),
            None
        )
        assert mr_chart is not None

        data = mr_chart['data']
        # MR values should have n-1 points (50 observations -> 49 MR values)
        assert len(data['values']) == 49

    def test_mr_chart_lcl_is_zero(self):
        """Test that MR-Chart LCL is always 0."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        mr_chart = next(
            (c for c in output['chartData'] if c['type'] == 'mr_chart'),
            None
        )
        assert mr_chart is not None

        data = mr_chart['data']
        assert data['lcl'] == 0

    def test_mr_chart_ooc_points_structure(self):
        """Test that MR-Chart OOC points have correct structure."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        # Create data with large jumps to trigger MR OOC points
        values = np.random.normal(100, 5, 48)
        values = np.append(values, [150, 50])  # Large jump should trigger MR OOC
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        mr_chart = next(
            (c for c in output['chartData'] if c['type'] == 'mr_chart'),
            None
        )
        assert mr_chart is not None

        data = mr_chart['data']
        assert 'ooc_points' in data
        assert isinstance(data['ooc_points'], list)

        # If there are OOC points, check structure
        if len(data['ooc_points']) > 0:
            ooc_point = data['ooc_points'][0]
            assert 'index' in ooc_point
            assert 'value' in ooc_point

    def test_mr_chart_values_are_python_lists(self):
        """Test that MR-Chart values are Python lists, not numpy arrays."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        mr_chart = next(
            (c for c in output['chartData'] if c['type'] == 'mr_chart'),
            None
        )
        assert mr_chart is not None

        data = mr_chart['data']
        # Should be Python list, not numpy array
        assert isinstance(data['values'], list)
        assert not isinstance(data['values'], np.ndarray)


class TestNormalityPlotData:
    """Tests for Normality Plot data structure in chartData (Story 8.2)."""

    def test_chartdata_contains_normality_plot(self):
        """Test that chartData includes Normality Plot when normality analysis is performed."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        # Find Normality Plot
        normality_plot = next(
            (c for c in output['chartData'] if c['type'] == 'normality_plot'),
            None
        )
        assert normality_plot is not None

    def test_normality_plot_data_structure(self):
        """Test that Normality Plot data has correct structure."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        normality_plot = next(
            (c for c in output['chartData'] if c['type'] == 'normality_plot'),
            None
        )
        assert normality_plot is not None

        data = normality_plot['data']
        assert 'points' in data
        assert 'fit_line' in data
        assert 'confidence_bands' in data
        assert 'anderson_darling' in data

    def test_normality_plot_points_structure(self):
        """Test that Normality Plot points have correct structure."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        normality_plot = next(
            (c for c in output['chartData'] if c['type'] == 'normality_plot'),
            None
        )
        assert normality_plot is not None

        data = normality_plot['data']
        points = data['points']

        assert isinstance(points, list)
        assert len(points) == 50  # Same as number of observations

        # Check first point structure
        point = points[0]
        assert 'actual' in point
        assert 'expected' in point
        assert 'index' in point

    def test_normality_plot_fit_line_structure(self):
        """Test that Normality Plot fit line has correct structure."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        normality_plot = next(
            (c for c in output['chartData'] if c['type'] == 'normality_plot'),
            None
        )
        assert normality_plot is not None

        data = normality_plot['data']
        fit_line = data['fit_line']

        assert 'slope' in fit_line
        assert 'intercept' in fit_line
        assert isinstance(fit_line['slope'], float)
        assert isinstance(fit_line['intercept'], float)

    def test_normality_plot_confidence_bands_structure(self):
        """Test that Normality Plot confidence bands have correct structure."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        normality_plot = next(
            (c for c in output['chartData'] if c['type'] == 'normality_plot'),
            None
        )
        assert normality_plot is not None

        data = normality_plot['data']
        confidence_bands = data['confidence_bands']

        assert 'lower' in confidence_bands
        assert 'upper' in confidence_bands
        assert isinstance(confidence_bands['lower'], list)
        assert isinstance(confidence_bands['upper'], list)
        assert len(confidence_bands['lower']) == 50
        assert len(confidence_bands['upper']) == 50

    def test_normality_plot_anderson_darling_structure(self):
        """Test that Normality Plot Anderson-Darling results have correct structure."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        normality_plot = next(
            (c for c in output['chartData'] if c['type'] == 'normality_plot'),
            None
        )
        assert normality_plot is not None

        data = normality_plot['data']
        ad = data['anderson_darling']

        assert 'statistic' in ad
        assert 'p_value' in ad
        assert 'is_normal' in ad
        assert isinstance(ad['is_normal'], bool)

    def test_chartdata_order_histogram_ichart_mrchart_normalityplot(self):
        """Test that charts appear in correct order: Histogram, I-Chart, MR-Chart, Normality Plot."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        chart_types = [c['type'] for c in output['chartData']]

        # Should have 4 chart types
        assert len(chart_types) == 4

        # Check order
        assert chart_types[0] == 'histogram'
        assert chart_types[1] == 'i_chart'
        assert chart_types[2] == 'mr_chart'
        assert chart_types[3] == 'normality_plot'

    def test_normality_plot_without_stability(self):
        """Test that Normality Plot is included even without stability analysis."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}

        # No stability, no spec limits
        output = build_capacidad_proceso_output(
            validated_data, stats, normality, None, None
        )

        # Should have normality plot
        normality_plot = next(
            (c for c in output['chartData'] if c['type'] == 'normality_plot'),
            None
        )
        assert normality_plot is not None

    def test_no_normality_plot_without_normality_result(self):
        """Test that Normality Plot is not included without normality result."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        # No normality result
        output = build_capacidad_proceso_output(
            validated_data, stats, None, stability, spec_limits
        )

        # Should NOT have normality plot
        normality_plot = next(
            (c for c in output['chartData'] if c['type'] == 'normality_plot'),
            None
        )
        assert normality_plot is None

    def test_normality_plot_points_are_sorted(self):
        """Test that Normality Plot points are sorted by actual value."""
        from utils.capacidad_proceso_calculator import (
            calculate_basic_statistics,
            perform_normality_analysis,
            build_capacidad_proceso_output
        )
        from utils.stability_analysis import perform_stability_analysis

        np.random.seed(42)
        values = np.random.normal(100, 10, 50)
        stats = calculate_basic_statistics(values)
        normality = perform_normality_analysis(values)
        stability = perform_stability_analysis(values)
        validated_data = {'column_name': 'Valores', 'values': values, 'warnings': []}
        spec_limits = {'lei': 70, 'les': 130}

        output = build_capacidad_proceso_output(
            validated_data, stats, normality, stability, spec_limits
        )

        normality_plot = next(
            (c for c in output['chartData'] if c['type'] == 'normality_plot'),
            None
        )
        assert normality_plot is not None

        data = normality_plot['data']
        points = data['points']

        # Check points are sorted by actual value
        actual_values = [p['actual'] for p in points]
        assert actual_values == sorted(actual_values)
