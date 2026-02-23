"""
Capacidad de Proceso File Validator Module

Validates Excel files for Process Capability (Capacidad de Proceso) analysis.
Checks for required numeric column, data types, empty cells, and minimum data requirements.

All user-facing error messages are in Spanish as per project requirements.
"""
import pandas as pd
import numpy as np
from typing import Any


# =============================================================================
# Validation Message Templates (Spanish)
# =============================================================================

VALIDATION_MESSAGES = {
    'NO_NUMERIC_COLUMN': 'No se encontró una columna numérica. El archivo debe contener una columna "Valores" con datos numéricos.',
    'EMPTY_CELLS': 'Se encontraron celdas vacías en las siguientes filas: {rows}. Por favor, completa todos los valores.',
    'NON_NUMERIC_VALUES': 'Se encontraron valores no numéricos en las siguientes filas: {rows}. Todos los valores deben ser números.',
    'SAMPLE_SIZE_WARNING': 'Se recomienda un mínimo de 20 valores para obtener estimaciones confiables de capacidad. El archivo contiene {count} valores.',
}

# Error limits
MAX_ERRORS = 20


# =============================================================================
# Column Detection Functions
# =============================================================================

def _find_valores_column(df: pd.DataFrame) -> str | None:
    """
    Find the "Valores" column (case-insensitive) in the DataFrame.

    Args:
        df: DataFrame to search

    Returns:
        The original column name if found, None otherwise
    """
    for col in df.columns:
        col_lower = str(col).lower().strip()
        if col_lower == 'valores':
            return col
    return None


def _find_first_numeric_column(df: pd.DataFrame) -> str | None:
    """
    Find the first column that contains numeric data.

    Args:
        df: DataFrame to search

    Returns:
        The first numeric column name if found, None otherwise
    """
    for col in df.columns:
        # Check if column is numeric type
        if pd.api.types.is_numeric_dtype(df[col]):
            return col

        # Check if column contains convertible numeric strings
        try:
            # Try to convert first non-null value
            non_null = df[col].dropna()
            if len(non_null) > 0:
                first_val = non_null.iloc[0]
                if isinstance(first_val, (int, float)):
                    return col
                # Try converting string
                str_val = str(first_val).replace(',', '.').strip()
                float(str_val)
                return col
        except (ValueError, TypeError):
            continue

    return None


def detect_numeric_column(df: pd.DataFrame) -> str | None:
    """
    Detect the numeric column for Capacidad de Proceso analysis.

    Priority:
    1. Column named "Valores" (case-insensitive)
    2. First numeric column found

    Args:
        df: DataFrame to search

    Returns:
        Column name if found, None otherwise
    """
    # First, look for "Valores" column
    valores_col = _find_valores_column(df)
    if valores_col is not None:
        return valores_col

    # Fall back to first numeric column
    return _find_first_numeric_column(df)


# =============================================================================
# Validation Functions
# =============================================================================

def validate_has_numeric_column(df: pd.DataFrame) -> tuple[str | None, dict[str, Any] | None]:
    """
    Validate that DataFrame has at least one numeric column.

    Args:
        df: DataFrame to validate

    Returns:
        tuple: (column_name, error)
        - On success: (column_name, None)
        - On failure: (None, error_dict)
    """
    column = detect_numeric_column(df)

    if column is None:
        return None, {
            'code': 'NO_NUMERIC_COLUMN',
            'message': VALIDATION_MESSAGES['NO_NUMERIC_COLUMN'],
            'details': [],
        }

    return column, None


def validate_empty_cells(
    df: pd.DataFrame,
    column: str
) -> list[int]:
    """
    Check for empty cells in the specified column.

    Args:
        df: DataFrame to validate
        column: Column name to check

    Returns:
        List of 1-indexed row numbers with empty cells (accounting for header).
        Limited to first MAX_ERRORS empty cells.
    """
    empty_rows = []

    for idx, value in enumerate(df[column]):
        if len(empty_rows) >= MAX_ERRORS:
            break

        # Check for empty/NaN values
        if pd.isna(value) or (isinstance(value, str) and value.strip() == ''):
            # Row number is 1-indexed + header row
            excel_row = idx + 2
            empty_rows.append(excel_row)

    return empty_rows


def validate_numeric_values(
    df: pd.DataFrame,
    column: str
) -> list[int]:
    """
    Validate that values in the column are numeric.

    Args:
        df: DataFrame to validate
        column: Column name to check

    Returns:
        List of 1-indexed row numbers with non-numeric values (accounting for header).
        Limited to first MAX_ERRORS non-numeric values.
    """
    non_numeric_rows = []

    for idx, value in enumerate(df[column]):
        if len(non_numeric_rows) >= MAX_ERRORS:
            break

        # Skip NaN (handled by empty cells check)
        if pd.isna(value):
            continue

        # Check if value is numeric
        if isinstance(value, (int, float)):
            continue

        # Try to convert string to numeric
        try:
            str_val = str(value).replace(',', '.').strip()
            float(str_val)
        except (ValueError, TypeError):
            # Row number is 1-indexed + header row
            excel_row = idx + 2
            non_numeric_rows.append(excel_row)

    return non_numeric_rows


def extract_numeric_values(
    df: pd.DataFrame,
    column: str
) -> np.ndarray:
    """
    Extract numeric values from the specified column.

    Handles:
    - Numeric types (int, float)
    - String numbers with European decimal format (comma -> period)
    - Whitespace padding

    Args:
        df: DataFrame to extract from
        column: Column name to extract

    Returns:
        NumPy array of float values (NaN excluded)
    """
    values = []

    for value in df[column]:
        # Skip NaN
        if pd.isna(value):
            continue

        # Handle numeric types
        if isinstance(value, (int, float)):
            values.append(float(value))
            continue

        # Handle string values
        try:
            str_val = str(value).replace(',', '.').strip()
            values.append(float(str_val))
        except (ValueError, TypeError):
            # Skip non-convertible values
            continue

    return np.array(values)


def check_sample_size(values: np.ndarray) -> str | None:
    """
    Check if sample size meets minimum requirements.

    Args:
        values: NumPy array of values

    Returns:
        Warning message if < 20 values, None otherwise
    """
    count = len(values)
    if count < 20:
        return VALIDATION_MESSAGES['SAMPLE_SIZE_WARNING'].format(count=count)
    return None


# =============================================================================
# Main Validation Orchestrator
# =============================================================================

def validate_capacidad_proceso_file(df: pd.DataFrame) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    """
    Validate a DataFrame for Capacidad de Proceso analysis.

    Performs validation in order:
    1. Check for numeric column (Valores or first numeric)
    2. Check for empty cells
    3. Check for non-numeric values
    4. Extract values and check sample size (warning only)

    Stops on first category of errors.

    Args:
        df: DataFrame to validate

    Returns:
        tuple: (validated_data, error)
        - On success: (validated_data_dict, None)
        - On failure: (None, error_dict)

    validated_data format:
        {
            'column_name': str,  # Name of the detected numeric column
            'values': np.ndarray,  # Extracted numeric values
            'warnings': list[str],  # Any warnings (e.g., sample size)
        }

    error format:
        {
            'code': str,  # Error code (NO_NUMERIC_COLUMN, EMPTY_CELLS, NON_NUMERIC_VALUES)
            'message': str,  # User-facing message in Spanish
            'details': list,  # Additional details (row numbers, etc.)
        }
    """
    # Step 1: Check for numeric column
    column, error = validate_has_numeric_column(df)
    if error:
        return None, error

    # Step 2: Check for empty cells
    empty_rows = validate_empty_cells(df, column)
    if empty_rows:
        rows_str = ', '.join(str(r) for r in empty_rows)
        return None, {
            'code': 'EMPTY_CELLS',
            'message': VALIDATION_MESSAGES['EMPTY_CELLS'].format(rows=rows_str),
            'details': empty_rows,
        }

    # Step 3: Check for non-numeric values
    non_numeric_rows = validate_numeric_values(df, column)
    if non_numeric_rows:
        rows_str = ', '.join(str(r) for r in non_numeric_rows)
        return None, {
            'code': 'NON_NUMERIC_VALUES',
            'message': VALIDATION_MESSAGES['NON_NUMERIC_VALUES'].format(rows=rows_str),
            'details': non_numeric_rows,
        }

    # Step 4: Extract values and check sample size
    values = extract_numeric_values(df, column)
    warnings = []

    sample_warning = check_sample_size(values)
    if sample_warning:
        warnings.append(sample_warning)

    validated_data = {
        'column_name': column,
        'values': values,
        'warnings': warnings,
    }

    return validated_data, None
