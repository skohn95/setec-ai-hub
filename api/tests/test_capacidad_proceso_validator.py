"""Tests for the Capacidad de Proceso file validator module."""
import pytest
import pandas as pd
import numpy as np
import sys
import os

# Add api directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


# =============================================================================
# Test Fixtures
# =============================================================================

@pytest.fixture
def valid_df_valores():
    """Create a valid DataFrame with Valores column (25 values)."""
    return pd.DataFrame({'Valores': [1.0, 2.0, 3.0, 4.0, 5.0] * 5})


@pytest.fixture
def valid_df_valores_20_plus():
    """Create a valid DataFrame with 25 values (no warning)."""
    return pd.DataFrame({'Valores': list(range(1, 26))})


@pytest.fixture
def valid_df_valores_below_20():
    """Create a valid DataFrame with only 5 values (warning expected)."""
    return pd.DataFrame({'Valores': [1.0, 2.0, 3.0, 4.0, 5.0]})


@pytest.fixture
def valid_df_numeric_first():
    """Create a DataFrame with first numeric column (not named Valores)."""
    return pd.DataFrame({
        'Data': [10.5, 11.2, 12.8, 13.1, 14.5] * 4  # 20 values
    })


@pytest.fixture
def df_empty_cells():
    """DataFrame with empty cells."""
    return pd.DataFrame({'Valores': [1.0, None, 3.0, None, 5.0]})


@pytest.fixture
def df_non_numeric():
    """DataFrame with non-numeric values."""
    return pd.DataFrame({'Valores': [1.0, 'abc', 3.0, 'xyz', 5.0]})


@pytest.fixture
def df_no_numeric_column():
    """DataFrame with no numeric column at all."""
    return pd.DataFrame({'Name': ['A', 'B', 'C'], 'Category': ['X', 'Y', 'Z']})


@pytest.fixture
def df_european_decimal():
    """DataFrame with European decimal format (comma as separator)."""
    return pd.DataFrame({'Valores': ['10,5', '11,2', '12,8', '13,1', '14,5'] * 4})


@pytest.fixture
def df_whitespace_padded():
    """DataFrame with whitespace-padded numeric strings."""
    return pd.DataFrame({'Valores': ['  10.5  ', ' 11.2', '12.8 ', '13.1', '14.5'] * 4})


# =============================================================================
# Module Import Tests
# =============================================================================

class TestModuleExists:
    """Tests that the validator module exists and has required functions."""

    def test_module_can_be_imported(self):
        """Test that capacidad_proceso_validator module can be imported."""
        from utils import capacidad_proceso_validator
        assert capacidad_proceso_validator is not None

    def test_validate_function_exists(self):
        """Test that validate_capacidad_proceso_file function exists."""
        from utils.capacidad_proceso_validator import validate_capacidad_proceso_file
        assert callable(validate_capacidad_proceso_file)

    def test_detect_numeric_column_exists(self):
        """Test that detect_numeric_column function exists."""
        from utils.capacidad_proceso_validator import detect_numeric_column
        assert callable(detect_numeric_column)


# =============================================================================
# Column Detection Tests
# =============================================================================

class TestColumnDetection:
    """Tests for numeric column detection."""

    def test_valores_column_detected(self, valid_df_valores):
        """Test that Valores column is detected."""
        from utils.capacidad_proceso_validator import detect_numeric_column
        column = detect_numeric_column(valid_df_valores)
        assert column == 'Valores'

    def test_valores_case_insensitive(self):
        """Test that Valores detection is case-insensitive."""
        from utils.capacidad_proceso_validator import detect_numeric_column

        for col_name in ['Valores', 'VALORES', 'valores']:
            df = pd.DataFrame({col_name: [1.0, 2.0, 3.0]})
            column = detect_numeric_column(df)
            assert column == col_name, f"Failed for column name: {col_name}"

    def test_first_numeric_column_fallback(self, valid_df_numeric_first):
        """Test that first numeric column is used when Valores not present."""
        from utils.capacidad_proceso_validator import detect_numeric_column
        column = detect_numeric_column(valid_df_numeric_first)
        assert column == 'Data'

    def test_no_numeric_column_returns_none(self, df_no_numeric_column):
        """Test that None is returned when no numeric column exists."""
        from utils.capacidad_proceso_validator import detect_numeric_column
        column = detect_numeric_column(df_no_numeric_column)
        assert column is None


# =============================================================================
# Empty Cell Detection Tests
# =============================================================================

class TestEmptyCellDetection:
    """Tests for empty cell detection."""

    def test_no_empty_cells_returns_empty_list(self, valid_df_valores):
        """Test that DataFrame without empty cells returns empty list."""
        from utils.capacidad_proceso_validator import validate_empty_cells
        empty_rows = validate_empty_cells(valid_df_valores, 'Valores')
        assert empty_rows == []

    def test_empty_cells_detected(self, df_empty_cells):
        """Test that empty cells are detected."""
        from utils.capacidad_proceso_validator import validate_empty_cells
        empty_rows = validate_empty_cells(df_empty_cells, 'Valores')
        assert len(empty_rows) == 2
        # Rows should be 3 and 5 (1-indexed + header)
        assert 3 in empty_rows
        assert 5 in empty_rows

    def test_empty_cells_reports_row_numbers(self):
        """Test that empty cells report correct row numbers."""
        from utils.capacidad_proceso_validator import validate_capacidad_proceso_file

        df = pd.DataFrame({'Valores': [1.0, None, 3.0, None, 5.0]})
        validated, error = validate_capacidad_proceso_file(df)

        assert error is not None
        assert error['code'] == 'EMPTY_CELLS'
        assert '3' in error['message']  # Row 3 (0-indexed row 1 + 1 header + 1 for 1-indexing)
        assert '5' in error['message']  # Row 5


# =============================================================================
# Non-Numeric Value Detection Tests
# =============================================================================

class TestNonNumericDetection:
    """Tests for non-numeric value detection."""

    def test_valid_numeric_returns_empty_list(self, valid_df_valores):
        """Test that valid numeric data returns empty list."""
        from utils.capacidad_proceso_validator import validate_numeric_values
        non_numeric = validate_numeric_values(valid_df_valores, 'Valores')
        assert non_numeric == []

    def test_non_numeric_detected(self, df_non_numeric):
        """Test that non-numeric values are detected."""
        from utils.capacidad_proceso_validator import validate_numeric_values
        non_numeric = validate_numeric_values(df_non_numeric, 'Valores')
        assert len(non_numeric) == 2
        # Rows should be 3 and 5 (1-indexed + header)
        assert 3 in non_numeric
        assert 5 in non_numeric

    def test_non_numeric_reports_row_numbers(self):
        """Test that non-numeric values report correct row numbers."""
        from utils.capacidad_proceso_validator import validate_capacidad_proceso_file

        df = pd.DataFrame({'Valores': [1.0, 'abc', 3.0, 'xyz', 5.0]})
        validated, error = validate_capacidad_proceso_file(df)

        assert error is not None
        assert error['code'] == 'NON_NUMERIC_VALUES'
        assert '3' in error['message']
        assert '5' in error['message']


# =============================================================================
# Sample Size Warning Tests
# =============================================================================

class TestSampleSizeWarning:
    """Tests for sample size warning."""

    def test_below_20_values_warning(self, valid_df_valores_below_20):
        """Test that < 20 values produces a warning."""
        from utils.capacidad_proceso_validator import validate_capacidad_proceso_file

        validated, error = validate_capacidad_proceso_file(valid_df_valores_below_20)

        assert error is None  # Not an error, just a warning
        assert validated is not None
        assert len(validated['warnings']) == 1
        assert '20' in validated['warnings'][0]
        assert '5' in validated['warnings'][0]  # Contains the actual count

    def test_exactly_20_values_no_warning(self):
        """Test that exactly 20 values produces no warning."""
        from utils.capacidad_proceso_validator import validate_capacidad_proceso_file

        df = pd.DataFrame({'Valores': list(range(1, 21))})  # 20 values
        validated, error = validate_capacidad_proceso_file(df)

        assert error is None
        assert validated is not None
        assert validated['warnings'] == []

    def test_above_20_values_no_warning(self, valid_df_valores_20_plus):
        """Test that > 20 values produces no warning."""
        from utils.capacidad_proceso_validator import validate_capacidad_proceso_file

        validated, error = validate_capacidad_proceso_file(valid_df_valores_20_plus)

        assert error is None
        assert validated is not None
        assert validated['warnings'] == []


# =============================================================================
# Main Validation Function Tests
# =============================================================================

class TestValidateCapacidadProcesoFile:
    """Tests for the main validation orchestrator."""

    def test_valid_file_returns_data(self, valid_df_valores_20_plus):
        """Test that valid file returns validated data and no error."""
        from utils.capacidad_proceso_validator import validate_capacidad_proceso_file

        validated, error = validate_capacidad_proceso_file(valid_df_valores_20_plus)

        assert error is None
        assert validated is not None
        assert 'column_name' in validated
        assert 'values' in validated
        assert 'warnings' in validated
        assert validated['column_name'] == 'Valores'
        assert len(validated['values']) == 25

    def test_no_numeric_column_returns_error(self, df_no_numeric_column):
        """Test that missing numeric column returns error."""
        from utils.capacidad_proceso_validator import validate_capacidad_proceso_file

        validated, error = validate_capacidad_proceso_file(df_no_numeric_column)

        assert validated is None
        assert error is not None
        assert error['code'] == 'NO_NUMERIC_COLUMN'

    def test_empty_cells_returns_error(self, df_empty_cells):
        """Test that empty cells return error."""
        from utils.capacidad_proceso_validator import validate_capacidad_proceso_file

        validated, error = validate_capacidad_proceso_file(df_empty_cells)

        assert validated is None
        assert error is not None
        assert error['code'] == 'EMPTY_CELLS'

    def test_non_numeric_returns_error(self, df_non_numeric):
        """Test that non-numeric values return error."""
        from utils.capacidad_proceso_validator import validate_capacidad_proceso_file

        validated, error = validate_capacidad_proceso_file(df_non_numeric)

        assert validated is None
        assert error is not None
        assert error['code'] == 'NON_NUMERIC_VALUES'


# =============================================================================
# Spanish Error Message Tests
# =============================================================================

class TestSpanishErrorMessages:
    """Tests for Spanish error messages."""

    def test_no_numeric_column_message_spanish(self, df_no_numeric_column):
        """Test that no numeric column error is in Spanish."""
        from utils.capacidad_proceso_validator import validate_capacidad_proceso_file

        validated, error = validate_capacidad_proceso_file(df_no_numeric_column)

        assert 'numérica' in error['message'].lower() or 'valores' in error['message'].lower()

    def test_empty_cells_message_spanish(self, df_empty_cells):
        """Test that empty cells error is in Spanish."""
        from utils.capacidad_proceso_validator import validate_capacidad_proceso_file

        validated, error = validate_capacidad_proceso_file(df_empty_cells)

        assert 'vacías' in error['message'].lower() or 'vacía' in error['message'].lower()

    def test_non_numeric_message_spanish(self, df_non_numeric):
        """Test that non-numeric error is in Spanish."""
        from utils.capacidad_proceso_validator import validate_capacidad_proceso_file

        validated, error = validate_capacidad_proceso_file(df_non_numeric)

        assert 'numéricos' in error['message'].lower() or 'números' in error['message'].lower()

    def test_sample_warning_spanish(self, valid_df_valores_below_20):
        """Test that sample size warning is in Spanish."""
        from utils.capacidad_proceso_validator import validate_capacidad_proceso_file

        validated, error = validate_capacidad_proceso_file(valid_df_valores_below_20)

        assert 'mínimo' in validated['warnings'][0].lower()
        assert 'valores' in validated['warnings'][0].lower()


# =============================================================================
# Edge Case Tests
# =============================================================================

class TestEdgeCases:
    """Tests for edge cases."""

    def test_european_decimal_format_accepted(self, df_european_decimal):
        """Test that European decimal format (comma as separator) is accepted."""
        from utils.capacidad_proceso_validator import validate_capacidad_proceso_file

        validated, error = validate_capacidad_proceso_file(df_european_decimal)

        assert error is None
        assert validated is not None
        assert len(validated['values']) == 20

    def test_whitespace_padded_values_accepted(self, df_whitespace_padded):
        """Test that whitespace-padded numeric values are accepted."""
        from utils.capacidad_proceso_validator import validate_capacidad_proceso_file

        validated, error = validate_capacidad_proceso_file(df_whitespace_padded)

        assert error is None
        assert validated is not None
        assert len(validated['values']) == 20

    def test_mixed_int_float(self):
        """Test that mixed integer and float values are handled."""
        from utils.capacidad_proceso_validator import validate_capacidad_proceso_file

        df = pd.DataFrame({'Valores': [1, 2.5, 3, 4.5, 5] * 4})
        validated, error = validate_capacidad_proceso_file(df)

        assert error is None
        assert validated is not None
        assert len(validated['values']) == 20

    def test_values_extracted_correctly(self):
        """Test that values are extracted with correct precision."""
        from utils.capacidad_proceso_validator import validate_capacidad_proceso_file

        df = pd.DataFrame({'Valores': [97.52, 111.20, 83.97, 103.58, 99.45] * 4})
        validated, error = validate_capacidad_proceso_file(df)

        assert error is None
        values = validated['values']
        assert abs(values[0] - 97.52) < 0.001
        assert abs(values[1] - 111.20) < 0.001

    def test_empty_dataframe(self):
        """Test that empty DataFrame is handled."""
        from utils.capacidad_proceso_validator import validate_capacidad_proceso_file

        df = pd.DataFrame({'Valores': []})
        validated, error = validate_capacidad_proceso_file(df)

        # Empty values should trigger sample size warning, not error
        assert error is None
        assert validated is not None
        assert len(validated['values']) == 0
        assert len(validated['warnings']) == 1  # Sample size warning

    def test_error_limit_20(self):
        """Test that errors are limited to 20."""
        from utils.capacidad_proceso_validator import validate_empty_cells

        # Create DataFrame with 30 empty cells
        df = pd.DataFrame({'Valores': [None] * 30})
        empty_rows = validate_empty_cells(df, 'Valores')

        assert len(empty_rows) == 20  # Limited to 20
