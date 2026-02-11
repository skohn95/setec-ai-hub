"""Tests for the MSA file validator module."""
import pytest
import pandas as pd
import sys
import os

# Add api directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


# =============================================================================
# Test Fixtures
# =============================================================================

@pytest.fixture
def valid_msa_df():
    """Create a valid MSA DataFrame with all required columns and data."""
    return pd.DataFrame({
        'Part': ['A', 'A', 'B', 'B'],
        'Operator': ['Op1', 'Op2', 'Op1', 'Op2'],
        'Measurement1': [10.1, 10.2, 10.3, 10.4],
        'Measurement2': [10.5, 10.6, 10.7, 10.8],
    })


@pytest.fixture
def valid_msa_df_spanish():
    """Create a valid MSA DataFrame with Spanish column names."""
    return pd.DataFrame({
        'Parte': ['A', 'A', 'B', 'B'],
        'Operador': ['Op1', 'Op2', 'Op1', 'Op2'],
        'Medicion1': [10.1, 10.2, 10.3, 10.4],
        'Medicion2': [10.5, 10.6, 10.7, 10.8],
    })


@pytest.fixture
def df_missing_part():
    """DataFrame missing Part column."""
    return pd.DataFrame({
        'Operator': ['Op1', 'Op2'],
        'Measurement1': [10.1, 10.2],
        'Measurement2': [10.3, 10.4],
    })


@pytest.fixture
def df_missing_operator():
    """DataFrame missing Operator column."""
    return pd.DataFrame({
        'Part': ['A', 'B'],
        'Measurement1': [10.1, 10.2],
        'Measurement2': [10.3, 10.4],
    })


@pytest.fixture
def df_missing_measurements():
    """DataFrame with only one measurement column."""
    return pd.DataFrame({
        'Part': ['A', 'B'],
        'Operator': ['Op1', 'Op2'],
        'Measurement1': [10.1, 10.2],
    })


@pytest.fixture
def df_non_numeric():
    """DataFrame with non-numeric data in measurement columns."""
    return pd.DataFrame({
        'Part': ['A', 'A', 'B', 'B'],
        'Operator': ['Op1', 'Op2', 'Op1', 'Op2'],
        'Measurement1': [10.1, 'abc', 10.3, 10.4],
        'Measurement2': [10.5, 10.6, 'xyz', 10.8],
    })


@pytest.fixture
def df_empty_cells():
    """DataFrame with empty cells in measurement columns."""
    return pd.DataFrame({
        'Part': ['A', 'A', 'B', 'B'],
        'Operator': ['Op1', 'Op2', 'Op1', 'Op2'],
        'Measurement1': [10.1, None, 10.3, 10.4],
        'Measurement2': [10.5, 10.6, None, 10.8],
    })


@pytest.fixture
def df_insufficient_parts():
    """DataFrame with only 1 unique part."""
    return pd.DataFrame({
        'Part': ['A', 'A', 'A', 'A'],
        'Operator': ['Op1', 'Op2', 'Op1', 'Op2'],
        'Measurement1': [10.1, 10.2, 10.3, 10.4],
        'Measurement2': [10.5, 10.6, 10.7, 10.8],
    })


@pytest.fixture
def df_insufficient_operators():
    """DataFrame with only 1 unique operator."""
    return pd.DataFrame({
        'Part': ['A', 'A', 'B', 'B'],
        'Operator': ['Op1', 'Op1', 'Op1', 'Op1'],
        'Measurement1': [10.1, 10.2, 10.3, 10.4],
        'Measurement2': [10.5, 10.6, 10.7, 10.8],
    })


# =============================================================================
# Task 1 Tests: Core Module Structure
# =============================================================================

class TestMsaValidatorModuleExists:
    """Tests that the validator module exists and has required functions."""

    def test_module_can_be_imported(self):
        """Test that msa_validator module can be imported."""
        from utils import msa_validator
        assert msa_validator is not None

    def test_find_required_columns_function_exists(self):
        """Test that find_required_columns function exists."""
        from utils.msa_validator import find_required_columns
        assert callable(find_required_columns)

    def test_detect_measurement_columns_function_exists(self):
        """Test that detect_measurement_columns function exists."""
        from utils.msa_validator import detect_measurement_columns
        assert callable(detect_measurement_columns)

    def test_validate_minimum_data_function_exists(self):
        """Test that validate_minimum_data function exists."""
        from utils.msa_validator import validate_minimum_data
        assert callable(validate_minimum_data)


# =============================================================================
# Task 2 Tests: Column Structure Validation
# =============================================================================

class TestValidateColumnStructure:
    """Tests for column structure validation."""

    def test_valid_columns_returns_mapping(self, valid_msa_df):
        """Test that valid DataFrame returns column mapping."""
        from utils.msa_validator import validate_column_structure
        mapping, error = validate_column_structure(valid_msa_df)
        assert mapping is not None
        assert error is None
        assert 'part' in mapping
        assert 'operator' in mapping
        assert 'measurements' in mapping
        assert len(mapping['measurements']) >= 2

    def test_missing_part_column_returns_error(self, df_missing_part):
        """Test that missing Part column returns appropriate error."""
        from utils.msa_validator import validate_column_structure
        mapping, error = validate_column_structure(df_missing_part)
        assert mapping is None
        assert error is not None
        assert error['code'] == 'MISSING_COLUMNS'
        assert 'Pieza' in error['missing']

    def test_missing_operator_column_returns_error(self, df_missing_operator):
        """Test that missing Operator column returns appropriate error."""
        from utils.msa_validator import validate_column_structure
        mapping, error = validate_column_structure(df_missing_operator)
        assert mapping is None
        assert error is not None
        assert error['code'] == 'MISSING_COLUMNS'
        assert 'Operador' in error['missing']

    def test_missing_measurements_returns_error(self, df_missing_measurements):
        """Test that insufficient measurement columns returns error."""
        from utils.msa_validator import validate_column_structure
        mapping, error = validate_column_structure(df_missing_measurements)
        assert mapping is None
        assert error is not None
        assert error['code'] == 'MISSING_COLUMNS'
        assert 'measurements' in error['message'].lower() or 'medición' in error['message'].lower()

    def test_case_insensitive_part_column(self):
        """Test that Part column detection is case-insensitive."""
        from utils.msa_validator import validate_column_structure

        for col_name in ['Part', 'PART', 'part', 'Parte', 'PARTE']:
            df = pd.DataFrame({
                col_name: ['A', 'B'],
                'Operator': ['Op1', 'Op2'],
                'Measurement1': [10.1, 10.2],
                'Measurement2': [10.3, 10.4],
            })
            mapping, error = validate_column_structure(df)
            assert mapping is not None, f"Failed for column name: {col_name}"
            assert mapping['part'] == col_name

    def test_case_insensitive_operator_column(self):
        """Test that Operator column detection is case-insensitive."""
        from utils.msa_validator import validate_column_structure

        for col_name in ['Operator', 'OPERATOR', 'operator', 'Operador', 'OPERADOR']:
            df = pd.DataFrame({
                'Part': ['A', 'B'],
                col_name: ['Op1', 'Op2'],
                'Measurement1': [10.1, 10.2],
                'Measurement2': [10.3, 10.4],
            })
            mapping, error = validate_column_structure(df)
            assert mapping is not None, f"Failed for column name: {col_name}"
            assert mapping['operator'] == col_name

    def test_measurement_column_patterns(self):
        """Test various measurement column patterns are recognized."""
        from utils.msa_validator import detect_measurement_columns

        df = pd.DataFrame({
            'Part': ['A'],
            'Operator': ['Op1'],
            'Measurement1': [10.1],
            'Medicion2': [10.2],
            'M3': [10.3],
            'Med4': [10.4],
            'Replica1': [10.5],
        })
        cols = detect_measurement_columns(df)
        assert len(cols) >= 4  # At least Measurement1, Medicion2, M3, Med4

    def test_spanish_columns_accepted(self, valid_msa_df_spanish):
        """Test that Spanish column names are accepted."""
        from utils.msa_validator import validate_column_structure
        mapping, error = validate_column_structure(valid_msa_df_spanish)
        assert mapping is not None
        assert error is None


# =============================================================================
# Task 3 Tests: Data Type Validation
# =============================================================================

class TestValidateNumericData:
    """Tests for numeric data validation."""

    def test_valid_numeric_data_returns_empty_list(self, valid_msa_df):
        """Test that valid numeric data returns no errors."""
        from utils.msa_validator import validate_numeric_data
        errors = validate_numeric_data(valid_msa_df, ['Measurement1', 'Measurement2'])
        assert errors == []

    def test_non_numeric_data_returns_errors(self, df_non_numeric):
        """Test that non-numeric data returns error list."""
        from utils.msa_validator import validate_numeric_data
        errors = validate_numeric_data(df_non_numeric, ['Measurement1', 'Measurement2'])
        assert len(errors) >= 2  # 'abc' and 'xyz'
        # Each error should have column, row, value
        for error in errors:
            assert 'column' in error
            assert 'row' in error
            assert 'value' in error

    def test_multiple_errors_collected(self):
        """Test that multiple non-numeric errors are all collected."""
        from utils.msa_validator import validate_numeric_data

        df = pd.DataFrame({
            'Part': ['A'] * 10,
            'Operator': ['Op1'] * 10,
            'Measurement1': ['bad1', 'bad2', 'bad3', 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 11.0],
            'Measurement2': [10.1, 10.2, 10.3, 'bad4', 'bad5', 10.6, 10.7, 10.8, 10.9, 11.0],
        })
        errors = validate_numeric_data(df, ['Measurement1', 'Measurement2'])
        assert len(errors) == 5  # bad1, bad2, bad3, bad4, bad5

    def test_error_limit_20(self):
        """Test that errors are limited to first 20."""
        from utils.msa_validator import validate_numeric_data

        # Create DataFrame with 30 non-numeric values
        df = pd.DataFrame({
            'Part': ['A'] * 30,
            'Operator': ['Op1'] * 30,
            'Measurement1': [f'bad{i}' for i in range(30)],
        })
        errors = validate_numeric_data(df, ['Measurement1'])
        assert len(errors) == 20  # Limited to 20


# =============================================================================
# Task 4 Tests: Empty Cell Detection
# =============================================================================

class TestValidateNoEmptyCells:
    """Tests for empty cell detection."""

    def test_no_empty_cells_returns_empty_list(self, valid_msa_df):
        """Test that DataFrame without empty cells returns no errors."""
        from utils.msa_validator import validate_no_empty_cells
        empty_cells = validate_no_empty_cells(valid_msa_df, ['Measurement1', 'Measurement2'])
        assert empty_cells == []

    def test_empty_cells_detected(self, df_empty_cells):
        """Test that empty cells are detected and returned."""
        from utils.msa_validator import validate_no_empty_cells
        empty_cells = validate_no_empty_cells(df_empty_cells, ['Measurement1', 'Measurement2'])
        assert len(empty_cells) >= 2  # At least 2 empty cells
        # Should be in Excel notation like 'C2', 'D3'
        for cell in empty_cells:
            assert len(cell) >= 2
            assert cell[0].isalpha()  # Column letter

    def test_empty_part_operator_detected(self):
        """Test that empty Part/Operator cells are also detected."""
        from utils.msa_validator import validate_no_empty_cells

        df = pd.DataFrame({
            'Part': ['A', None, 'B'],
            'Operator': ['Op1', 'Op2', None],
            'Measurement1': [10.1, 10.2, 10.3],
            'Measurement2': [10.4, 10.5, 10.6],
        })
        # Part and Operator should also be checked
        empty_cells = validate_no_empty_cells(df, ['Measurement1', 'Measurement2'],
                                               part_col='Part', operator_col='Operator')
        assert len(empty_cells) >= 2  # At least the None in Part and Operator

    def test_empty_cells_limit_20(self):
        """Test that empty cells are limited to first 20."""
        from utils.msa_validator import validate_no_empty_cells

        # Create DataFrame with 30 empty cells
        df = pd.DataFrame({
            'Part': ['A'] * 30,
            'Operator': ['Op1'] * 30,
            'Measurement1': [None] * 30,
        })
        empty_cells = validate_no_empty_cells(df, ['Measurement1'])
        assert len(empty_cells) == 20  # Limited to 20


# =============================================================================
# Task 5 Tests: Minimum Data Requirements
# =============================================================================

class TestValidateDataRequirements:
    """Tests for minimum data requirements validation."""

    def test_valid_data_returns_none(self, valid_msa_df):
        """Test that valid data returns None (no error)."""
        from utils.msa_validator import validate_data_requirements

        columns = {'part': 'Part', 'operator': 'Operator',
                   'measurements': ['Measurement1', 'Measurement2']}
        error = validate_data_requirements(valid_msa_df, columns)
        assert error is None

    def test_insufficient_parts_returns_error(self, df_insufficient_parts):
        """Test that 1 unique part returns error."""
        from utils.msa_validator import validate_data_requirements

        columns = {'part': 'Part', 'operator': 'Operator',
                   'measurements': ['Measurement1', 'Measurement2']}
        error = validate_data_requirements(df_insufficient_parts, columns)
        assert error is not None
        assert 'piezas' in error['message'].lower()

    def test_insufficient_operators_returns_error(self, df_insufficient_operators):
        """Test that 1 unique operator returns error."""
        from utils.msa_validator import validate_data_requirements

        columns = {'part': 'Part', 'operator': 'Operator',
                   'measurements': ['Measurement1', 'Measurement2']}
        error = validate_data_requirements(df_insufficient_operators, columns)
        assert error is not None
        assert 'operator' in error['message'].lower() or 'operador' in error['message'].lower()


# =============================================================================
# Task 6 Tests: Main Validation Orchestrator
# =============================================================================

class TestValidateMsaFile:
    """Tests for the main validation orchestrator."""

    def test_valid_file_returns_columns_no_error(self, valid_msa_df):
        """Test that valid file returns column mapping and no error."""
        from utils.msa_validator import validate_msa_file
        columns, error = validate_msa_file(valid_msa_df)
        assert columns is not None
        assert error is None
        assert 'part' in columns
        assert 'operator' in columns
        assert 'measurements' in columns

    def test_invalid_structure_returns_error(self, df_missing_part):
        """Test that invalid structure returns error."""
        from utils.msa_validator import validate_msa_file
        columns, error = validate_msa_file(df_missing_part)
        assert columns is None
        assert error is not None
        assert 'code' in error
        assert 'message' in error

    def test_non_numeric_returns_error(self, df_non_numeric):
        """Test that non-numeric data returns error."""
        from utils.msa_validator import validate_msa_file
        columns, error = validate_msa_file(df_non_numeric)
        assert columns is None
        assert error is not None

    def test_empty_cells_returns_error(self, df_empty_cells):
        """Test that empty cells return error."""
        from utils.msa_validator import validate_msa_file
        columns, error = validate_msa_file(df_empty_cells)
        assert columns is None
        assert error is not None

    def test_insufficient_data_returns_error(self, df_insufficient_parts):
        """Test that insufficient data returns error."""
        from utils.msa_validator import validate_msa_file
        columns, error = validate_msa_file(df_insufficient_parts)
        assert columns is None
        assert error is not None


# =============================================================================
# Task 7 Tests: Error Message Formatting
# =============================================================================

class TestFormatValidationError:
    """Tests for user-friendly error message formatting."""

    def test_missing_columns_message_in_spanish(self, df_missing_part):
        """Test that missing columns error is in Spanish."""
        from utils.msa_validator import validate_msa_file, format_validation_error
        columns, error = validate_msa_file(df_missing_part)
        message = format_validation_error(error)
        assert 'Faltan columnas requeridas' in message or 'columnas' in message.lower()

    def test_non_numeric_message_in_spanish(self, df_non_numeric):
        """Test that non-numeric error is in Spanish."""
        from utils.msa_validator import validate_msa_file, format_validation_error
        columns, error = validate_msa_file(df_non_numeric)
        message = format_validation_error(error)
        assert 'número' in message.lower() or 'numérico' in message.lower()

    def test_empty_cells_message_in_spanish(self, df_empty_cells):
        """Test that empty cells error is in Spanish."""
        from utils.msa_validator import validate_msa_file, format_validation_error
        columns, error = validate_msa_file(df_empty_cells)
        message = format_validation_error(error)
        assert 'vacías' in message.lower() or 'vacía' in message.lower()

    def test_insufficient_data_message_in_spanish(self, df_insufficient_parts):
        """Test that insufficient data error is in Spanish."""
        from utils.msa_validator import validate_msa_file, format_validation_error
        columns, error = validate_msa_file(df_insufficient_parts)
        message = format_validation_error(error)
        assert 'insuficiente' in message.lower() or 'requieren' in message.lower()


# =============================================================================
# Edge Case Tests: European Decimal Format, Whitespace, Pieza Column
# =============================================================================

class TestEdgeCases:
    """Tests for edge cases identified in code review."""

    def test_european_decimal_format_accepted(self):
        """Test that European decimal format (comma as separator) is accepted and converted."""
        from utils.msa_validator import validate_numeric_data

        df = pd.DataFrame({
            'Part': ['A', 'B', 'C'],
            'Operator': ['Op1', 'Op1', 'Op1'],
            'Measurement1': ['10,5', '11,2', '12,8'],  # European format with comma
            'Measurement2': [10.1, 10.2, 10.3],
        })
        errors = validate_numeric_data(df, ['Measurement1', 'Measurement2'])
        # Code converts comma to period, so European format should be accepted
        assert len(errors) == 0

    def test_whitespace_padded_values_accepted(self):
        """Test that whitespace-padded numeric values are accepted."""
        from utils.msa_validator import validate_numeric_data

        df = pd.DataFrame({
            'Part': ['A', 'B'],
            'Operator': ['Op1', 'Op2'],
            'Measurement1': ['  10.5  ', '  11.2  '],  # Whitespace padded
            'Measurement2': [10.1, 10.2],
        })
        errors = validate_numeric_data(df, ['Measurement1', 'Measurement2'])
        # Code strips whitespace during conversion, so these should be accepted
        assert len(errors) == 0

    def test_pieza_column_pattern_recognized(self):
        """Test that 'Pieza' column is recognized as a valid Part column variant."""
        from utils.msa_validator import validate_column_structure

        df = pd.DataFrame({
            'Pieza': ['A', 'B'],
            'Operator': ['Op1', 'Op2'],
            'Measurement1': [10.1, 10.2],
            'Measurement2': [10.3, 10.4],
        })
        mapping, error = validate_column_structure(df)
        assert mapping is not None, "Pieza column should be recognized as Part variant"
        assert mapping['part'] == 'Pieza'
        assert error is None

    def test_mixed_case_pieza_column(self):
        """Test that 'PIEZA', 'pieza' variants are recognized."""
        from utils.msa_validator import validate_column_structure

        for col_name in ['Pieza', 'PIEZA', 'pieza']:
            df = pd.DataFrame({
                col_name: ['A', 'B'],
                'Operator': ['Op1', 'Op2'],
                'Measurement1': [10.1, 10.2],
                'Measurement2': [10.3, 10.4],
            })
            mapping, error = validate_column_structure(df)
            assert mapping is not None, f"Failed for column name: {col_name}"
            assert mapping['part'] == col_name

    def test_combined_european_and_whitespace(self):
        """Test that European format with whitespace is handled correctly."""
        from utils.msa_validator import validate_numeric_data

        df = pd.DataFrame({
            'Part': ['A', 'B'],
            'Operator': ['Op1', 'Op2'],
            'Measurement1': ['  10,5  ', ' 11,2'],  # European format + whitespace
            'Measurement2': [10.1, 10.2],
        })
        errors = validate_numeric_data(df, ['Measurement1', 'Measurement2'])
        # Code handles both: strips whitespace, then converts comma to period
        assert len(errors) == 0
