"""Tests for the hipotesis_2_muestras_validator module."""
import pytest
import pandas as pd
import numpy as np
import sys
import os

# Add api directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from utils.hipotesis_2_muestras_validator import validate_hipotesis_2_muestras_file


# =============================================================================
# Test Fixtures
# =============================================================================

@pytest.fixture
def valid_equal_length_df():
    """Valid DataFrame with two equal-length numeric columns."""
    return pd.DataFrame({
        'Muestra A': [10.1, 10.2, 10.3, 10.4, 10.5],
        'Muestra B': [11.1, 11.2, 11.3, 11.4, 11.5],
    })


@pytest.fixture
def valid_unequal_length_df():
    """Valid DataFrame with two unequal-length numeric columns (trailing blanks)."""
    return pd.DataFrame({
        'Muestra A': [10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7],
        'Muestra B': [11.1, 11.2, 11.3, 11.4, 11.5, np.nan, np.nan],
    })


@pytest.fixture
def single_column_df():
    """DataFrame with only one numeric column."""
    return pd.DataFrame({
        'Muestra A': [10.1, 10.2, 10.3],
        'Etiqueta': ['a', 'b', 'c'],
    })


@pytest.fixture
def non_numeric_df():
    """DataFrame with non-numeric values in data."""
    return pd.DataFrame({
        'Muestra A': [10.1, 10.2, 'N/A', 10.4, 10.5],
        'Muestra B': [11.1, 11.2, 11.3, 11.4, 11.5],
    })


@pytest.fixture
def intercalated_empty_df():
    """DataFrame with intercalated empty cells (gap within data range)."""
    return pd.DataFrame({
        'Muestra A': [10.1, 10.2, 10.3, 10.4, 10.5],
        'Muestra B': [11.1, 11.2, np.nan, 11.4, 11.5],
    })


@pytest.fixture
def minimum_values_df():
    """DataFrame where one column has only 1 value."""
    return pd.DataFrame({
        'Muestra A': [10.1, np.nan],
        'Muestra B': [11.1, 11.2],
    })


# =============================================================================
# Test: Valid Files
# =============================================================================

class TestValidFiles:
    """Tests for valid file scenarios."""

    def test_valid_equal_length_columns(self, valid_equal_length_df):
        """AC 2: Valid file with equal-length columns returns success."""
        data, error = validate_hipotesis_2_muestras_file(valid_equal_length_df)

        assert error is None
        assert data is not None
        assert isinstance(data['muestra_a'], np.ndarray)
        assert isinstance(data['muestra_b'], np.ndarray)
        assert len(data['muestra_a']) == 5
        assert len(data['muestra_b']) == 5
        assert len(data['column_names']) == 2

    def test_valid_unequal_length_columns(self, valid_unequal_length_df):
        """AC 2: Valid file with unequal-length columns handles trailing blanks correctly."""
        data, error = validate_hipotesis_2_muestras_file(valid_unequal_length_df)

        assert error is None
        assert data is not None
        assert len(data['muestra_a']) == 7
        assert len(data['muestra_b']) == 5
        # Trailing blanks should NOT be flagged as errors
        assert data['column_names'] == ['Muestra A', 'Muestra B']

    def test_valid_file_returns_numpy_arrays(self, valid_equal_length_df):
        """Validate that extracted values are numpy arrays of floats."""
        data, error = validate_hipotesis_2_muestras_file(valid_equal_length_df)

        assert error is None
        np.testing.assert_array_almost_equal(
            data['muestra_a'], [10.1, 10.2, 10.3, 10.4, 10.5]
        )
        np.testing.assert_array_almost_equal(
            data['muestra_b'], [11.1, 11.2, 11.3, 11.4, 11.5]
        )

    def test_valid_file_sample_size_warnings(self):
        """Warns when sample sizes are below 20."""
        df = pd.DataFrame({
            'A': [1.0, 2.0, 3.0],
            'B': [4.0, 5.0, 6.0],
        })
        data, error = validate_hipotesis_2_muestras_file(df)

        assert error is None
        assert len(data['warnings']) == 2
        for w in data['warnings']:
            assert '20' in w

    def test_valid_file_no_warnings_large_sample(self):
        """No warnings when sample sizes >= 20."""
        df = pd.DataFrame({
            'A': list(range(25)),
            'B': list(range(25)),
        })
        data, error = validate_hipotesis_2_muestras_file(df)

        assert error is None
        assert len(data['warnings']) == 0

    def test_european_decimal_format(self):
        """Handle European decimal format (comma as decimal separator)."""
        df = pd.DataFrame({
            'A': ['10,1', '10,2', '10,3'],
            'B': ['11,1', '11,2', '11,3'],
        })
        data, error = validate_hipotesis_2_muestras_file(df)

        assert error is None
        np.testing.assert_array_almost_equal(data['muestra_a'], [10.1, 10.2, 10.3])
        np.testing.assert_array_almost_equal(data['muestra_b'], [11.1, 11.2, 11.3])


# =============================================================================
# Test: Column Structure Errors
# =============================================================================

class TestColumnStructureErrors:
    """Tests for column structure validation."""

    def test_single_column_error(self, single_column_df):
        """AC 3: Single column returns error with Spanish guidance."""
        data, error = validate_hipotesis_2_muestras_file(single_column_df)

        assert data is None
        assert error is not None
        assert error['code'] == 'SINGLE_COLUMN'
        assert 'segunda columna' in error['message'].lower() or 'agregue' in error['message'].lower()

    def test_no_numeric_columns_error(self):
        """Empty file / no numeric columns returns appropriate error."""
        df = pd.DataFrame({
            'Texto': ['a', 'b', 'c'],
            'Otro': ['x', 'y', 'z'],
        })
        data, error = validate_hipotesis_2_muestras_file(df)

        assert data is None
        assert error is not None
        assert error['code'] == 'NO_NUMERIC_COLUMNS'

    def test_too_many_columns_error(self):
        """More than 2 numeric columns returns error."""
        df = pd.DataFrame({
            'A': [1.0, 2.0, 3.0],
            'B': [4.0, 5.0, 6.0],
            'C': [7.0, 8.0, 9.0],
        })
        data, error = validate_hipotesis_2_muestras_file(df)

        assert data is None
        assert error is not None
        assert error['code'] == 'TOO_MANY_COLUMNS'

    def test_empty_dataframe_error(self):
        """Empty DataFrame returns appropriate error."""
        df = pd.DataFrame()
        data, error = validate_hipotesis_2_muestras_file(df)

        assert data is None
        assert error is not None
        assert error['code'] == 'NO_NUMERIC_COLUMNS'


# =============================================================================
# Test: Non-Numeric Value Errors
# =============================================================================

class TestNonNumericErrors:
    """Tests for non-numeric value detection."""

    def test_non_numeric_value_with_location(self, non_numeric_df):
        """AC 4: Non-numeric values report specific cell location."""
        data, error = validate_hipotesis_2_muestras_file(non_numeric_df)

        assert data is None
        assert error is not None
        assert error['code'] == 'NON_NUMERIC_VALUES'
        # Should mention column name and row
        assert 'Muestra A' in error['message']
        # Row 4 in Excel (index 2 + header + 1-indexed)
        assert '4' in error['message']
        # Should mention the bad value
        assert 'N/A' in error['message']

    def test_non_numeric_in_both_columns(self):
        """Non-numeric values in both columns are reported."""
        df = pd.DataFrame({
            'A': [1.0, 'bad', 3.0],
            'B': [4.0, 5.0, 'worse'],
        })
        data, error = validate_hipotesis_2_muestras_file(df)

        assert data is None
        assert error is not None
        assert error['code'] == 'NON_NUMERIC_VALUES'
        assert len(error['details']) == 2

    def test_non_numeric_message_in_spanish(self, non_numeric_df):
        """AC 4: Error message is in Spanish with guidance."""
        data, error = validate_hipotesis_2_muestras_file(non_numeric_df)

        assert error is not None
        # Check message contains Spanish text
        assert 'numérico' in error['message'].lower() or 'números' in error['message'].lower()


# =============================================================================
# Test: Intercalated Empty Cell Errors
# =============================================================================

class TestIntercalatedEmptyCells:
    """Tests for intercalated empty cell detection."""

    def test_intercalated_empty_detected(self, intercalated_empty_df):
        """AC 5: Intercalated empty cells are reported with location."""
        data, error = validate_hipotesis_2_muestras_file(intercalated_empty_df)

        assert data is None
        assert error is not None
        assert error['code'] == 'INTERCALATED_EMPTY_CELLS'
        # Should report the empty cell in Muestra B, row 4 (index 2 + 2)
        assert 'Muestra B' in error['message']
        assert '4' in error['message']

    def test_trailing_blanks_not_flagged(self, valid_unequal_length_df):
        """AC 5: Trailing blanks in shorter column are NOT errors."""
        data, error = validate_hipotesis_2_muestras_file(valid_unequal_length_df)

        assert error is None
        assert data is not None
        # Shorter column (B) should have 5 values, not errors for trailing NaN

    def test_intercalated_distinguished_from_trailing(self):
        """AC 5: Intercalated blanks vs trailing blanks correctly distinguished."""
        # Column A: 5 values, Column B: 3 values then blank then value (intercalated)
        df = pd.DataFrame({
            'A': [1.0, 2.0, 3.0, 4.0, 5.0],
            'B': [1.0, 2.0, 3.0, np.nan, 5.0],
        })
        data, error = validate_hipotesis_2_muestras_file(df)

        assert data is None
        assert error is not None
        assert error['code'] == 'INTERCALATED_EMPTY_CELLS'


# =============================================================================
# Test: Minimum Values Errors
# =============================================================================

class TestMinimumValues:
    """Tests for minimum values validation."""

    def test_single_value_error(self):
        """AC 6: Column with only 1 value returns error."""
        df = pd.DataFrame({
            'A': [10.1, np.nan],
            'B': [11.1, 11.2],
        })
        data, error = validate_hipotesis_2_muestras_file(df)

        assert data is None
        assert error is not None
        assert error['code'] == 'MINIMUM_VALUES'
        assert '2' in error['message']  # Minimum 2 values

    def test_minimum_values_message_in_spanish(self):
        """AC 6: Error message is in Spanish."""
        df = pd.DataFrame({
            'A': [10.1],
            'B': [11.1],
        })
        data, error = validate_hipotesis_2_muestras_file(df)

        assert error is not None
        assert 'valor' in error['message'].lower()

    def test_two_values_passes(self):
        """Exactly 2 values per column passes minimum check."""
        df = pd.DataFrame({
            'A': [10.1, 10.2],
            'B': [11.1, 11.2],
        })
        data, error = validate_hipotesis_2_muestras_file(df)

        assert error is None
        assert data is not None


# =============================================================================
# Test: Validation Stage Order
# =============================================================================

class TestValidationOrder:
    """Tests that validation stops at first category of errors."""

    def test_column_error_stops_before_numeric_check(self):
        """Column structure error prevents further checks."""
        df = pd.DataFrame({
            'A': [1.0, 'bad', 3.0],
        })
        data, error = validate_hipotesis_2_muestras_file(df)

        assert error is not None
        # Should be column error, not numeric error
        assert error['code'] in ('SINGLE_COLUMN', 'NO_NUMERIC_COLUMNS')

    def test_empty_cell_error_stops_before_numeric_check(self):
        """Intercalated empty cell error stops before non-numeric check."""
        df = pd.DataFrame({
            'A': [1.0, np.nan, 'bad', 4.0, 5.0],
            'B': [1.0, 2.0, 3.0, 4.0, 5.0],
        })
        data, error = validate_hipotesis_2_muestras_file(df)

        assert error is not None
        assert error['code'] == 'INTERCALATED_EMPTY_CELLS'


# =============================================================================
# Test: Edge Cases
# =============================================================================

class TestEdgeCases:
    """Tests for edge cases and boundary conditions."""

    def test_mixed_integer_float_columns(self):
        """Handles mixed integer and float columns correctly."""
        df = pd.DataFrame({
            'A': [1, 2, 3, 4, 5],
            'B': [1.1, 2.2, 3.3, 4.4, 5.5],
        })
        data, error = validate_hipotesis_2_muestras_file(df)

        assert error is None
        assert len(data['muestra_a']) == 5

    def test_large_unequal_lengths(self):
        """Handles significantly different column lengths."""
        a_values = list(range(1, 46))
        b_values = list(range(1, 41))
        b_padded = b_values + [np.nan] * (len(a_values) - len(b_values))
        df = pd.DataFrame({
            'Muestra A': a_values,
            'Muestra B': b_padded,
        })
        data, error = validate_hipotesis_2_muestras_file(df)

        assert error is None
        assert len(data['muestra_a']) == 45
        assert len(data['muestra_b']) == 40

    def test_column_names_preserved(self, valid_equal_length_df):
        """Column names are preserved in output."""
        data, error = validate_hipotesis_2_muestras_file(valid_equal_length_df)

        assert error is None
        assert data['column_names'] == ['Muestra A', 'Muestra B']

    def test_two_numeric_plus_text_column(self):
        """Common real-world scenario: 2 numeric + 1 non-numeric column passes validation."""
        df = pd.DataFrame({
            'Muestra A': [10.1, 10.2, 10.3, 10.4, 10.5],
            'Muestra B': [11.1, 11.2, 11.3, 11.4, 11.5],
            'Comentarios': ['OK', 'Revisar', 'OK', 'Ajustar', 'OK'],
        })
        data, error = validate_hipotesis_2_muestras_file(df)

        assert error is None
        assert data is not None
        assert len(data['muestra_a']) == 5
        assert len(data['muestra_b']) == 5
        assert data['column_names'] == ['Muestra A', 'Muestra B']

    def test_max_errors_limit(self):
        """Error output is limited to MAX_ERRORS."""
        # Create DataFrame with many non-numeric values
        df = pd.DataFrame({
            'A': ['bad'] * 30,
            'B': [1.0] * 30,
        })
        data, error = validate_hipotesis_2_muestras_file(df)

        assert error is not None
        assert len(error['details']) <= 20
