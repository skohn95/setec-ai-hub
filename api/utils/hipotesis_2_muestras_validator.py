"""
Hipótesis 2 Muestras File Validator Module

Validates Excel files for 2-Sample Hypothesis Testing analysis.
Checks for required two numeric columns, data types, empty cells within data ranges,
trailing blank handling, and minimum data requirements.

All user-facing error messages are in Spanish as per project requirements.
"""
import pandas as pd
import numpy as np
from typing import Any


# =============================================================================
# Validation Message Templates (Spanish)
# =============================================================================

VALIDATION_MESSAGES = {
    'NO_NUMERIC_COLUMNS': 'No se encontraron columnas numéricas. El archivo debe contener exactamente 2 columnas con datos numéricos (por ejemplo, "Muestra A" y "Muestra B").',
    'SINGLE_COLUMN': 'Solo se encontró una columna numérica ({column}). El archivo debe contener exactamente 2 columnas de datos numéricos. Por favor, agregue una segunda columna de muestra.',
    'TOO_MANY_COLUMNS': 'Se encontraron {count} columnas numéricas. El archivo debe contener exactamente 2 columnas de datos numéricos.',
    'INTERCALATED_EMPTY': "Celda vacía intercalada en columna '{column}', fila {row}. Las celdas vacías dentro del rango de datos no están permitidas. Solo se permiten celdas vacías al final de la columna más corta.",
    'NON_NUMERIC_VALUE': "Valor no numérico en columna '{column}', fila {row}: '{value}'. Todos los valores deben ser números.",
    'MINIMUM_VALUES': "La columna '{column}' contiene solo {count} valor(es). Se requieren al menos 2 valores por muestra.",
    'SAMPLE_SIZE_WARNING': 'Se recomienda un mínimo de 20 valores por muestra para resultados confiables. Muestra "{column}" contiene {count} valores.',
}

# Error limits
MAX_ERRORS = 20


# =============================================================================
# Column Detection Functions
# =============================================================================

def _detect_numeric_columns(df: pd.DataFrame) -> list[str]:
    """
    Detect columns that contain numeric data.

    Checks:
    1. Columns with numeric dtype
    2. Columns with convertible string values

    Args:
        df: DataFrame to search

    Returns:
        List of column names that contain numeric data
    """
    numeric_cols = []

    for col in df.columns:
        # Check if column is numeric type
        if pd.api.types.is_numeric_dtype(df[col]):
            numeric_cols.append(col)
            continue

        # Check if column contains convertible numeric strings
        non_null = df[col].dropna()
        if len(non_null) == 0:
            continue

        try:
            first_val = non_null.iloc[0]
            if isinstance(first_val, (int, float)):
                numeric_cols.append(col)
                continue
            str_val = str(first_val).replace(',', '.').strip()
            float(str_val)
            numeric_cols.append(col)
        except (ValueError, TypeError):
            continue

    return numeric_cols


# =============================================================================
# Validation Functions
# =============================================================================

def validate_column_structure(df: pd.DataFrame) -> tuple[list[str] | None, dict[str, Any] | None]:
    """
    Validate that DataFrame has exactly 2 numeric columns.

    Args:
        df: DataFrame to validate

    Returns:
        tuple: (column_names, error)
        - On success: ([col_a, col_b], None)
        - On failure: (None, error_dict)
    """
    numeric_cols = _detect_numeric_columns(df)

    if len(numeric_cols) == 0:
        return None, {
            'code': 'NO_NUMERIC_COLUMNS',
            'message': VALIDATION_MESSAGES['NO_NUMERIC_COLUMNS'],
            'details': [],
        }

    if len(numeric_cols) == 1:
        return None, {
            'code': 'SINGLE_COLUMN',
            'message': VALIDATION_MESSAGES['SINGLE_COLUMN'].format(column=numeric_cols[0]),
            'details': [],
        }

    if len(numeric_cols) > 2:
        return None, {
            'code': 'TOO_MANY_COLUMNS',
            'message': VALIDATION_MESSAGES['TOO_MANY_COLUMNS'].format(count=len(numeric_cols)),
            'details': [],
        }

    return numeric_cols, None


def _find_effective_length(df: pd.DataFrame, column: str) -> int:
    """
    Find the effective data length of a column, ignoring trailing blanks.

    Scans from the bottom up to find the last non-empty row.

    Args:
        df: DataFrame
        column: Column name

    Returns:
        Effective row count (0-indexed last data row + 1)
    """
    for idx in range(len(df) - 1, -1, -1):
        value = df[column].iloc[idx]
        if not (pd.isna(value) or (isinstance(value, str) and value.strip() == '')):
            return idx + 1
    return 0


def validate_intercalated_empty_cells(
    df: pd.DataFrame,
    columns: list[str],
    effective_lengths: dict[str, int] | None = None
) -> list[dict[str, Any]]:
    """
    Detect intercalated (non-trailing) empty cells within each column's data range.

    Trailing blanks beyond the effective length are NOT errors.
    Empty cells within the data range ARE errors.

    Args:
        df: DataFrame to validate
        columns: Column names to check
        effective_lengths: Pre-computed effective lengths per column (optional)

    Returns:
        List of error dicts: { 'column': str, 'row': int }
        Limited to MAX_ERRORS.
    """
    errors = []

    for col in columns:
        effective_length = (effective_lengths or {}).get(col) or _find_effective_length(df, col)

        for idx in range(effective_length):
            if len(errors) >= MAX_ERRORS:
                return errors

            value = df[col].iloc[idx]
            if pd.isna(value) or (isinstance(value, str) and value.strip() == ''):
                excel_row = idx + 2  # 1-indexed + header row
                errors.append({
                    'column': col,
                    'row': excel_row,
                })

    return errors


def validate_numeric_values(
    df: pd.DataFrame,
    columns: list[str],
    effective_lengths: dict[str, int] | None = None
) -> list[dict[str, Any]]:
    """
    Validate that values within data range are numeric.

    Args:
        df: DataFrame to validate
        columns: Column names to check
        effective_lengths: Pre-computed effective lengths per column (optional)

    Returns:
        List of error dicts: { 'column': str, 'row': int, 'value': str }
        Limited to MAX_ERRORS.
    """
    errors = []

    for col in columns:
        effective_length = (effective_lengths or {}).get(col) or _find_effective_length(df, col)

        for idx in range(effective_length):
            if len(errors) >= MAX_ERRORS:
                return errors

            value = df[col].iloc[idx]

            # Skip NaN (handled by empty cells check)
            if pd.isna(value):
                continue

            # Already numeric
            if isinstance(value, (int, float)):
                continue

            # Try to convert string to numeric (handle European decimal format)
            try:
                str_val = str(value).replace(',', '.').strip()
                float(str_val)
            except (ValueError, TypeError):
                excel_row = idx + 2  # 1-indexed + header row
                errors.append({
                    'column': col,
                    'row': excel_row,
                    'value': str(value),
                })

    return errors


def validate_minimum_values(
    df: pd.DataFrame,
    columns: list[str],
    effective_lengths: dict[str, int] | None = None
) -> list[dict[str, Any]]:
    """
    Validate that each column has at least 2 numeric values.

    Args:
        df: DataFrame to validate
        columns: Column names to check
        effective_lengths: Pre-computed effective lengths per column (optional)

    Returns:
        List of error dicts: { 'column': str, 'count': int }
    """
    errors = []

    for col in columns:
        effective_length = (effective_lengths or {}).get(col) or _find_effective_length(df, col)

        # Count actual numeric values within effective range
        count = 0
        for idx in range(effective_length):
            value = df[col].iloc[idx]
            if pd.isna(value) or (isinstance(value, str) and value.strip() == ''):
                continue
            if isinstance(value, (int, float)):
                count += 1
                continue
            try:
                str_val = str(value).replace(',', '.').strip()
                float(str_val)
                count += 1
            except (ValueError, TypeError):
                continue

        if count < 2:
            errors.append({
                'column': col,
                'count': count,
            })

    return errors


def _extract_column_values(df: pd.DataFrame, column: str) -> np.ndarray:
    """
    Extract numeric values from a column, handling European decimal format.

    Args:
        df: DataFrame
        column: Column name

    Returns:
        NumPy array of float values (NaN and trailing blanks excluded)
    """
    effective_length = _find_effective_length(df, column)
    values = []

    for idx in range(effective_length):
        value = df[column].iloc[idx]

        if pd.isna(value):
            continue

        if isinstance(value, (int, float)):
            values.append(float(value))
            continue

        try:
            str_val = str(value).replace(',', '.').strip()
            values.append(float(str_val))
        except (ValueError, TypeError):
            continue

    return np.array(values)


# =============================================================================
# Main Validation Orchestrator
# =============================================================================

def validate_hipotesis_2_muestras_file(df: pd.DataFrame) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    """
    Validate a DataFrame for 2-Sample Hypothesis Testing analysis.

    Performs validation in order (stops at first category of errors):
    1. Column structure (exactly 2 numeric columns)
    2. Intercalated empty cell detection (gaps within data range, not trailing)
    3. Non-numeric value detection (with cell location)
    4. Minimum data requirements (>= 2 values per sample)

    Args:
        df: DataFrame to validate

    Returns:
        tuple: (validated_data, error)
        - On success: (validated_data_dict, None)
        - On failure: (None, error_dict)

    validated_data format:
        {
            'muestra_a': np.ndarray,   # Extracted numeric values for first column
            'muestra_b': np.ndarray,   # Extracted numeric values for second column
            'column_names': list[str], # Original column names [col_a, col_b]
            'warnings': list[str],     # Any warnings (e.g., sample size)
        }

    error format:
        {
            'code': str,       # Error code
            'message': str,    # User-facing message in Spanish
            'details': list,   # Additional details
        }
    """
    # Stage 1: Column structure validation
    columns, error = validate_column_structure(df)
    if error:
        return None, error

    # Pre-compute effective lengths once for all stages
    effective_lengths = {col: _find_effective_length(df, col) for col in columns}

    # Stage 2: Intercalated empty cell detection
    empty_errors = validate_intercalated_empty_cells(df, columns, effective_lengths)
    if empty_errors:
        details = [
            VALIDATION_MESSAGES['INTERCALATED_EMPTY'].format(
                column=e['column'], row=e['row']
            )
            for e in empty_errors
        ]
        return None, {
            'code': 'INTERCALATED_EMPTY_CELLS',
            'message': details[0] if len(details) == 1 else 'Se encontraron celdas vacías intercaladas:\n- ' + '\n- '.join(details),
            'details': empty_errors,
        }

    # Stage 3: Non-numeric value detection
    numeric_errors = validate_numeric_values(df, columns, effective_lengths)
    if numeric_errors:
        details = [
            VALIDATION_MESSAGES['NON_NUMERIC_VALUE'].format(
                column=e['column'], row=e['row'], value=e['value']
            )
            for e in numeric_errors
        ]
        return None, {
            'code': 'NON_NUMERIC_VALUES',
            'message': details[0] if len(details) == 1 else 'Se encontraron valores no numéricos:\n- ' + '\n- '.join(details),
            'details': numeric_errors,
        }

    # Stage 4: Minimum data requirements
    min_errors = validate_minimum_values(df, columns, effective_lengths)
    if min_errors:
        details = [
            VALIDATION_MESSAGES['MINIMUM_VALUES'].format(
                column=e['column'], count=e['count']
            )
            for e in min_errors
        ]
        return None, {
            'code': 'MINIMUM_VALUES',
            'message': '\n'.join(details),
            'details': min_errors,
        }

    # All validations passed — extract data
    muestra_a = _extract_column_values(df, columns[0])
    muestra_b = _extract_column_values(df, columns[1])

    warnings = []
    for col, values in [(columns[0], muestra_a), (columns[1], muestra_b)]:
        if len(values) < 20:
            warnings.append(
                VALIDATION_MESSAGES['SAMPLE_SIZE_WARNING'].format(column=col, count=len(values))
            )

    validated_data = {
        'muestra_a': muestra_a,
        'muestra_b': muestra_b,
        'column_names': columns,
        'warnings': warnings,
    }

    return validated_data, None
