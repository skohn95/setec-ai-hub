"""Tests for Tamaño de Muestra (Sample Size) Calculator."""
import math
import time
import unittest

from api.utils.tamano_muestra_calculator import (
    calculate_sample_size,
    classify_sample_size,
    run_sensitivity_analysis,
    calculate_tamano_muestra,
)


class TestCalculateSampleSize(unittest.TestCase):
    """Test sample size calculation formulas."""

    def test_bilateral_known_values(self):
        """AC1: bilateral delta=0.4, sigma=0.6, alpha=0.05, power=0.80 -> n=36."""
        result = calculate_sample_size(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        self.assertEqual(result['n_per_group'], 36)
        self.assertAlmostEqual(result['z_alpha'], 1.96, places=1)
        self.assertAlmostEqual(result['z_beta'], 0.842, places=2)
        self.assertEqual(result['formula_used'], 'bilateral')

    def test_unilateral_smaller_than_bilateral(self):
        """AC2: unilateral n < bilateral n for same parameters."""
        bilateral = calculate_sample_size(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        unilateral = calculate_sample_size(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='greater',
        )
        self.assertLess(unilateral['n_per_group'], bilateral['n_per_group'])
        self.assertEqual(unilateral['formula_used'], 'unilateral')

    def test_unilateral_less(self):
        """Unilateral 'less' uses same formula as 'greater'."""
        greater = calculate_sample_size(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='greater',
        )
        less = calculate_sample_size(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='less',
        )
        self.assertEqual(greater['n_per_group'], less['n_per_group'])

    def test_ceiling_rounding(self):
        """AC3: result is always rounded UP (ceiling)."""
        result = calculate_sample_size(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        # n should be an integer
        self.assertIsInstance(result['n_per_group'], int)
        # Verify it's the ceiling: raw value ~35.34 -> 36
        self.assertEqual(result['n_per_group'], 36)

    def test_larger_sigma_increases_n(self):
        """Larger sigma should increase required n."""
        small_sigma = calculate_sample_size(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        large_sigma = calculate_sample_size(
            delta=0.4, sigma=1.2, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        self.assertGreater(large_sigma['n_per_group'], small_sigma['n_per_group'])

    def test_smaller_delta_increases_n(self):
        """Smaller delta should increase required n."""
        large_delta = calculate_sample_size(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        small_delta = calculate_sample_size(
            delta=0.2, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        self.assertGreater(small_delta['n_per_group'], large_delta['n_per_group'])


class TestClassifySampleSize(unittest.TestCase):
    """Test sample size classification."""

    def test_adequate_n36(self):
        """AC4: n=36 >= 30 -> adequate."""
        result = classify_sample_size(36)
        self.assertEqual(result['category'], 'adequate')
        self.assertIn('Teorema Central del Limite', result['message'])

    def test_adequate_n30(self):
        """Boundary: n=30 -> adequate."""
        result = classify_sample_size(30)
        self.assertEqual(result['category'], 'adequate')

    def test_verify_normality_n22(self):
        """AC5: n=22 -> verify_normality."""
        result = classify_sample_size(22)
        self.assertEqual(result['category'], 'verify_normality')
        self.assertIn('verificación de normalidad', result['message'])

    def test_verify_normality_n15(self):
        """Boundary: n=15 -> verify_normality."""
        result = classify_sample_size(15)
        self.assertEqual(result['category'], 'verify_normality')

    def test_verify_normality_n29(self):
        """Boundary: n=29 -> verify_normality."""
        result = classify_sample_size(29)
        self.assertEqual(result['category'], 'verify_normality')

    def test_weak_n8(self):
        """AC6: n=8 -> weak."""
        result = classify_sample_size(8)
        self.assertEqual(result['category'], 'weak')
        self.assertIn('insuficiente', result['message'])

    def test_weak_n14(self):
        """Boundary: n=14 -> weak."""
        result = classify_sample_size(14)
        self.assertEqual(result['category'], 'weak')

    def test_n2_additional_warning(self):
        """AC12: n=2 -> weak with additional warning."""
        result = classify_sample_size(2)
        self.assertEqual(result['category'], 'weak')
        self.assertIn('extremadamente pequeño', result['message'])
        self.assertIn('2 por grupo', result['message'])

    def test_n1_additional_warning(self):
        """AC12: n=1 -> weak with additional warning."""
        result = classify_sample_size(1)
        self.assertEqual(result['category'], 'weak')
        self.assertIn('extremadamente pequeño', result['message'])


class TestSensitivityAnalysis(unittest.TestCase):
    """Test sensitivity analysis scenarios."""

    def test_produces_4_scenarios(self):
        """AC7: at least 3 alternative + base = 4 scenarios."""
        result = run_sensitivity_analysis(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        self.assertEqual(len(result), 4)
        scenarios = [s['scenario'] for s in result]
        self.assertIn('base', scenarios)
        self.assertIn('delta_half', scenarios)
        self.assertIn('power_90', scenarios)
        self.assertIn('sigma_double', scenarios)

    def test_delta_half_increases_n(self):
        """AC7: delta_half -> n increases significantly."""
        result = run_sensitivity_analysis(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        base_n = next(s['n_per_group'] for s in result if s['scenario'] == 'base')
        delta_half_n = next(s['n_per_group'] for s in result if s['scenario'] == 'delta_half')
        self.assertGreater(delta_half_n, base_n)

    def test_power_90_increases_n(self):
        """AC7: power_90 -> n increases moderately."""
        result = run_sensitivity_analysis(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        base_n = next(s['n_per_group'] for s in result if s['scenario'] == 'base')
        power_90_n = next(s['n_per_group'] for s in result if s['scenario'] == 'power_90')
        self.assertGreater(power_90_n, base_n)

    def test_sigma_double_increases_n(self):
        """AC7: sigma_double -> n increases significantly."""
        result = run_sensitivity_analysis(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        base_n = next(s['n_per_group'] for s in result if s['scenario'] == 'base')
        sigma_double_n = next(s['n_per_group'] for s in result if s['scenario'] == 'sigma_double')
        self.assertGreater(sigma_double_n, base_n)

    def test_each_scenario_has_required_fields(self):
        """AC7: each scenario has scenario, label, parameters, n_per_group."""
        result = run_sensitivity_analysis(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        for scenario in result:
            self.assertIn('scenario', scenario)
            self.assertIn('label', scenario)
            self.assertIn('parameters', scenario)
            self.assertIn('n_per_group', scenario)
            # Parameters should have delta, sigma, alpha, power
            params = scenario['parameters']
            self.assertIn('delta', params)
            self.assertIn('sigma', params)
            self.assertIn('alpha', params)
            self.assertIn('power', params)

    def test_base_scenario_matches_direct_calculation(self):
        """Base scenario n should match direct calculate_sample_size."""
        sensitivity = run_sensitivity_analysis(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        direct = calculate_sample_size(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        base = next(s for s in sensitivity if s['scenario'] == 'base')
        self.assertEqual(base['n_per_group'], direct['n_per_group'])

    def test_power_90_uses_power_95_when_user_power_is_90(self):
        """When user power=0.90, sensitivity uses power_95 to avoid duplicate."""
        result = run_sensitivity_analysis(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.90,
            alternative_hypothesis='two-sided',
        )
        scenarios = [s['scenario'] for s in result]
        self.assertIn('power_95', scenarios)
        self.assertNotIn('power_90', scenarios)
        # power_95 should produce larger n than base
        base_n = next(s['n_per_group'] for s in result if s['scenario'] == 'base')
        power_95_n = next(s['n_per_group'] for s in result if s['scenario'] == 'power_95')
        self.assertGreater(power_95_n, base_n)


class TestInstructions(unittest.TestCase):
    """Test instructions generation."""

    def test_instructions_contain_5_sections(self):
        """AC8: instructions contains 5 Spanish sections."""
        result = calculate_tamano_muestra(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        instructions = result['instructions']
        self.assertIn('## Parametros Utilizados', instructions)
        self.assertIn('## Resultado', instructions)
        self.assertIn('## Evaluacion', instructions)
        self.assertIn('## Analisis de Sensibilidad', instructions)
        self.assertIn('## Recomendaciones', instructions)

    def test_instructions_all_spanish(self):
        """AC8: all text in instructions is in Spanish."""
        result = calculate_tamano_muestra(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        instructions = result['instructions']
        self.assertIn('Tamano de muestra minimo', instructions)
        self.assertIn('por grupo', instructions)
        self.assertIn('mediciones del grupo A', instructions)
        self.assertIn('mediciones del grupo B', instructions)

    def test_instructions_has_agent_only_header(self):
        """Instructions start with AGENT_ONLY comment."""
        result = calculate_tamano_muestra(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        self.assertIn('AGENT_ONLY', result['instructions'])

    def test_instructions_with_optional_means(self):
        """Instructions include current_mean and expected_mean when provided."""
        result = calculate_tamano_muestra(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
            current_mean=15.2,
            expected_mean=14.8,
        )
        self.assertIn('15.2', result['instructions'])
        self.assertIn('14.8', result['instructions'])

    def test_instructions_without_optional_means(self):
        """Instructions show 'No especificada' for missing means."""
        result = calculate_tamano_muestra(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        self.assertIn('No especificada', result['instructions'])

    def test_instructions_no_duplicate_n2_warning(self):
        """H1 fix: n<=2 warning should appear only once in instructions."""
        result = calculate_tamano_muestra(
            delta=10, sigma=1, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        count = result['instructions'].count('extremadamente pequeño')
        self.assertEqual(count, 1, f"Expected 1 occurrence but found {count}")

    def test_instructions_impractical_n_warning(self):
        """AC13: very small delta + large sigma -> impractical n warning."""
        result = calculate_tamano_muestra(
            delta=0.01, sigma=10, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        # n should be > 1000 for this case
        n = result['results']['sample_size']['n_per_group']
        self.assertGreater(n, 1000)
        self.assertIn('no ser', result['instructions'].lower())


class TestResponseStructure(unittest.TestCase):
    """Test response structure matches expected schema."""

    def test_response_has_results_chartdata_instructions(self):
        """AC8: response has results, chartData, instructions."""
        result = calculate_tamano_muestra(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        self.assertIn('results', result)
        self.assertIn('chartData', result)
        self.assertIn('instructions', result)

    def test_chartdata_is_empty_list(self):
        """chartData should be empty list (text-only analysis)."""
        result = calculate_tamano_muestra(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        self.assertEqual(result['chartData'], [])

    def test_results_structure(self):
        """Results contains input_parameters, sample_size, classification, sensitivity."""
        result = calculate_tamano_muestra(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        results = result['results']
        self.assertIn('input_parameters', results)
        self.assertIn('sample_size', results)
        self.assertIn('classification', results)
        self.assertIn('sensitivity', results)

    def test_input_parameters_structure(self):
        """Input parameters match expected fields."""
        result = calculate_tamano_muestra(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
            current_mean=15.2,
            expected_mean=14.8,
        )
        params = result['results']['input_parameters']
        self.assertEqual(params['delta'], 0.4)
        self.assertEqual(params['sigma'], 0.6)
        self.assertEqual(params['alpha'], 0.05)
        self.assertEqual(params['power'], 0.80)
        self.assertEqual(params['alternative_hypothesis'], 'two-sided')
        self.assertEqual(params['current_mean'], 15.2)
        self.assertEqual(params['expected_mean'], 14.8)

    def test_sample_size_structure(self):
        """Sample size has n_per_group, z_alpha, z_beta, formula_used."""
        result = calculate_tamano_muestra(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        ss = result['results']['sample_size']
        self.assertIn('n_per_group', ss)
        self.assertIn('z_alpha', ss)
        self.assertIn('z_beta', ss)
        self.assertIn('formula_used', ss)

    def test_instructions_is_string(self):
        """Instructions should be a markdown string."""
        result = calculate_tamano_muestra(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        self.assertIsInstance(result['instructions'], str)
        self.assertGreater(len(result['instructions']), 0)


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and error handling."""

    def test_delta_zero_raises_error(self):
        """AC10: delta=0 raises error with Spanish message."""
        with self.assertRaises(ValueError) as ctx:
            calculate_tamano_muestra(
                delta=0, sigma=0.6, alpha=0.05, power=0.80,
                alternative_hypothesis='two-sided',
            )
        self.assertIn('delta', str(ctx.exception).lower())
        self.assertIn('cero', str(ctx.exception).lower())

    def test_sigma_zero_raises_error(self):
        """AC11: sigma=0 raises error with Spanish message."""
        with self.assertRaises(ValueError) as ctx:
            calculate_tamano_muestra(
                delta=0.4, sigma=0, alpha=0.05, power=0.80,
                alternative_hypothesis='two-sided',
            )
        self.assertIn('sigma', str(ctx.exception).lower())

    def test_sigma_negative_raises_error(self):
        """AC11: sigma<0 raises error with Spanish message."""
        with self.assertRaises(ValueError) as ctx:
            calculate_tamano_muestra(
                delta=0.4, sigma=-1, alpha=0.05, power=0.80,
                alternative_hypothesis='two-sided',
            )
        self.assertIn('sigma', str(ctx.exception).lower())

    def test_very_small_delta_large_sigma(self):
        """AC13: small delta + large sigma produces large n with warning."""
        result = calculate_tamano_muestra(
            delta=0.01, sigma=10, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        n = result['results']['sample_size']['n_per_group']
        self.assertGreater(n, 1000)
        # Classification should still work
        self.assertIn('category', result['results']['classification'])

    def test_n_equals_1_classification(self):
        """AC12: parameters producing n<=2 -> weak with additional warning."""
        # delta=10, sigma=1 produces n=1 (confirmed)
        result = calculate_tamano_muestra(
            delta=10, sigma=1, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        n = result['results']['sample_size']['n_per_group']
        classification = result['results']['classification']
        self.assertLessEqual(n, 2, f"Expected n<=2 but got n={n}")
        self.assertEqual(classification['category'], 'weak')
        self.assertIn('extremadamente pequeño', classification['message'])

    def test_performance_under_5_seconds(self):
        """AC9: full calculation completes in under 5 seconds."""
        start = time.time()
        calculate_tamano_muestra(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        elapsed = time.time() - start
        self.assertLess(elapsed, 5.0)

    def test_none_means_stored_correctly(self):
        """current_mean and expected_mean can be None."""
        result = calculate_tamano_muestra(
            delta=0.4, sigma=0.6, alpha=0.05, power=0.80,
            alternative_hypothesis='two-sided',
        )
        params = result['results']['input_parameters']
        self.assertIsNone(params['current_mean'])
        self.assertIsNone(params['expected_mean'])


if __name__ == '__main__':
    unittest.main()
