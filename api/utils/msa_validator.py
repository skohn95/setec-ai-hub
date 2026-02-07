"""
MSA File Validator Module

Validates Excel files for Measurement System Analysis (MSA).
Checks for required columns, data types, empty cells, and minimum data requirements.

All user-facing error messages are in Spanish as per project requirements.
"""
import re
import pandas as pd
from typing import Any


# =============================================================================
# Validation Message Templates (Spanish)
# =============================================================================

VALIDATION_MESSAGES = {
    'MISSING_COLUMNS': 'Faltan columnas requeridas: {columns}. La plantilla debe incluir Part, Operator, y columnas de medición.',
    'NON_NUMERIC_CELL': 'La celda {column}{row} contiene \'{value}\' pero se esperaba un número.',
    'NON_NUMERIC_SUMMARY': 'Las siguientes celdas contienen datos no numéricos:',
    'EMPTY_CELLS': 'Celdas vacías encontradas en: {cells}. Todos los campos de medición son requeridos.',
    'INSUFFICIENT_PARTS': 'Datos insuficientes: Se requieren al menos 2 partes diferentes (encontradas: {count}).',
    'INSUFFICIENT_OPERATORS': 'Datos insuficientes: Se requieren al menos 2 operadores diferentes (encontrados: {count}).',
    'INSUFFICIENT_MEASUREMENTS': 'Datos insuficientes: Se requieren al menos 2 columnas de medición (encontradas: {count}).',
}

# Column name patterns (case-insensitive)
PART_PATTERNS = ['part', 'parte', 'pieza']
OPERATOR_PATTERNS = ['operator', 'operador', 'op']
MEASUREMENT_PATTERNS = [
    r'^measurement\s*\d*$',
    r'^medici[oó]n\s*\d*$',
    r'^med\s*\d+$',
    r'^m\d+$',
    r'^replica\s*\d*$',
    r'^rep\s*\d+$',
]

# Error limits
MAX_ERRORS = 20


# =============================================================================
# Column Detection Functions
# =============================================================================

def _find_column_by_patterns(df: pd.DataFrame, patterns: list[str]) -> str | None:
    """
    Find a column name that matches any of the given patterns (case-insensitive).

    Args:
        df: DataFrame to search
        patterns: List of string patterns to match against (exact match, case-insensitive)

    Returns:
        The original column name if found, None otherwise
    """
    for col in df.columns:
        col_lower = str(col).lower().strip()
        if col_lower in patterns:
            return col
    return None


def detect_measurement_columns(df: pd.DataFrame) -> list[str]:
    """
    Find columns that appear to be measurement columns.

    Patterns to match (case-insensitive):
    - Measurement*, Medicion*, Medición*, Med*
    - M1, M2, M3, etc.
    - Replica*, Rep*

    Args:
        df: DataFrame to search

    Returns:
        List of column names that match measurement patterns
    """
    measurement_cols = []

    for col in df.columns:
        col_lower = str(col).lower().strip()
        for pattern in MEASUREMENT_PATTERNS:
            if re.match(pattern, col_lower):
                measurement_cols.append(col)
                break

    return measurement_cols


def find_required_columns(df: pd.DataFrame) -> tuple[dict[str, Any], list[str]]:
    """
    Find required columns in the DataFrame.

    Args:
        df: DataFrame to search

    Returns:
        tuple: (column_mapping, missing_columns)
        - column_mapping: dict with 'part', 'operator', 'measurements' keys
        - missing_columns: list of missing column names
    """
    missing = []

    # Find Part column
    part_col = _find_column_by_patterns(df, PART_PATTERNS)
    if part_col is None:
        missing.append('Part')

    # Find Operator column
    operator_col = _find_column_by_patterns(df, OPERATOR_PATTERNS)
    if operator_col is None:
        missing.append('Operator')

    # Find Measurement columns
    measurement_cols = detect_measurement_columns(df)
    if len(measurement_cols) < 2:
        missing.append('columnas de medición (mínimo 2)')

    column_mapping = {
        'part': part_col,
        'operator': operator_col,
        'measurements': measurement_cols,
    }

    return column_mapping, missing


# =============================================================================
# Validation Functions
# =============================================================================

def validate_column_structure(df: pd.DataFrame) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    """
    Validate that DataFrame has required column structure.

    Args:
        df: DataFrame to validate

    Returns:
        tuple: (column_mapping, error)
        - On success: (column_mapping_dict, None)
        - On failure: (None, error_dict)

    Error dict format:
        { 'code': 'MISSING_COLUMNS', 'message': str, 'missing': list[str] }
    """
    column_mapping, missing = find_required_columns(df)

    if missing:
        return None, {
            'code': 'MISSING_COLUMNS',
            'message': VALIDATION_MESSAGES['MISSING_COLUMNS'].format(columns=', '.join(missing)),
            'missing': missing,
        }

    return column_mapping, None


def validate_numeric_data(
    df: pd.DataFrame,
    measurement_cols: list[str]
) -> list[dict[str, Any]]:
    """
    Validate that measurement columns contain only numeric data.

    Args:
        df: DataFrame to validate
        measurement_cols: List of measurement column names to check

    Returns:
        List of error objects: { 'column': str, 'row': int, 'value': str }
        Empty list if all data is valid.
        Limited to first MAX_ERRORS errors.
    """
    errors = []

    for col in measurement_cols:
        if col not in df.columns:
            continue

        for idx, value in enumerate(df[col]):
            if len(errors) >= MAX_ERRORS:
                return errors

            # Skip if already a number
            if pd.isna(value):
                continue  # Empty cells handled by validate_no_empty_cells

            # Try to convert to numeric
            try:
                if isinstance(value, (int, float)):
                    continue
                # Try converting string
                float(str(value).replace(',', '.').strip())
            except (ValueError, TypeError):
                errors.append({
                    'column': col,
                    'row': idx + 2,  # Excel row (1-indexed + header)
                    'value': str(value),
                })

    return errors


def _column_index_to_letter(col_idx: int) -> str:
    """
    Convert column index to Excel-style letter (0->A, 1->B, ... 25->Z, 26->AA).

    Args:
        col_idx: Zero-based column index

    Returns:
        Excel column letter(s)
    """
    result = ""
    while col_idx >= 0:
        result = chr(col_idx % 26 + ord('A')) + result
        col_idx = col_idx // 26 - 1
    return result


def validate_no_empty_cells(
    df: pd.DataFrame,
    measurement_cols: list[str],
    part_col: str | None = None,
    operator_col: str | None = None
) -> list[str]:
    """
    Check for empty cells in required columns.

    Args:
        df: DataFrame to validate
        measurement_cols: List of measurement column names to check
        part_col: Name of Part column (optional, to also check for empty parts)
        operator_col: Name of Operator column (optional, to also check for empty operators)

    Returns:
        List of cell references in Excel notation (e.g., 'C5', 'D8').
        Limited to first MAX_ERRORS empty cells.
    """
    empty_cells = []

    # Columns to check
    cols_to_check = list(measurement_cols)
    if part_col:
        cols_to_check.append(part_col)
    if operator_col:
        cols_to_check.append(operator_col)

    for col in cols_to_check:
        if col not in df.columns:
            continue

        col_idx = list(df.columns).index(col)
        col_letter = _column_index_to_letter(col_idx)

        for idx, value in enumerate(df[col]):
            if len(empty_cells) >= MAX_ERRORS:
                return empty_cells

            # Check for empty/NaN values
            if pd.isna(value) or (isinstance(value, str) and value.strip() == ''):
                excel_row = idx + 2  # Excel row (1-indexed + header)
                empty_cells.append(f'{col_letter}{excel_row}')

    return empty_cells


def validate_minimum_data(df: pd.DataFrame, columns: dict[str, Any]) -> list[str]:
    """
    Validate minimum data requirements.

    Args:
        df: DataFrame to validate
        columns: Column mapping with 'part', 'operator', 'measurements' keys

    Returns:
        List of error messages for any violations.
        Empty list if all requirements met.
    """
    errors = []

    part_col = columns.get('part')
    operator_col = columns.get('operator')
    measurements = columns.get('measurements', [])

    # Check minimum parts
    if part_col and part_col in df.columns:
        unique_parts = df[part_col].dropna().nunique()
        if unique_parts < 2:
            errors.append(VALIDATION_MESSAGES['INSUFFICIENT_PARTS'].format(count=unique_parts))

    # Check minimum operators
    if operator_col and operator_col in df.columns:
        unique_operators = df[operator_col].dropna().nunique()
        if unique_operators < 2:
            errors.append(VALIDATION_MESSAGES['INSUFFICIENT_OPERATORS'].format(count=unique_operators))

    # Check minimum measurement columns (already checked in column validation)
    if len(measurements) < 2:
        errors.append(VALIDATION_MESSAGES['INSUFFICIENT_MEASUREMENTS'].format(count=len(measurements)))

    return errors


def validate_data_requirements(
    df: pd.DataFrame,
    columns: dict[str, Any]
) -> dict[str, Any] | None:
    """
    Validate that DataFrame meets minimum data requirements.

    Args:
        df: DataFrame to validate
        columns: Column mapping with 'part', 'operator', 'measurements' keys

    Returns:
        None if valid, or error dict with specific violations
    """
    errors = validate_minimum_data(df, columns)

    if errors:
        return {
            'code': 'INSUFFICIENT_DATA',
            'message': '\n'.join(errors),
            'details': errors,
        }

    return None


# =============================================================================
# Main Validation Orchestrator
# =============================================================================

def validate_msa_file(df: pd.DataFrame) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    """
    Validate a DataFrame for MSA analysis.

    Performs validation in order:
    1. Column structure (required columns present)
    2. Data types (measurement columns are numeric)
    3. Empty cells (no missing values in required fields)
    4. Data requirements (minimum parts, operators, measurements)

    Stops on first category of errors.

    Args:
        df: DataFrame to validate

    Returns:
        tuple: (validated_columns, error)
        - On success: (column_mapping_dict, None)
        - On failure: (None, error_dict)

    Error dict format:
        { 'code': str, 'message': str, 'details': list[dict] }
    """
    # Step 1: Validate column structure
    columns, error = validate_column_structure(df)
    if error:
        return None, error

    # Step 2: Validate numeric data in measurement columns
    numeric_errors = validate_numeric_data(df, columns['measurements'])
    if numeric_errors:
        error_details = [
            VALIDATION_MESSAGES['NON_NUMERIC_CELL'].format(
                column=e['column'],
                row=e['row'],
                value=e['value']
            )
            for e in numeric_errors
        ]
        return None, {
            'code': 'NON_NUMERIC_DATA',
            'message': VALIDATION_MESSAGES['NON_NUMERIC_SUMMARY'] + '\n- ' + '\n- '.join(error_details),
            'details': numeric_errors,
        }

    # Step 3: Validate no empty cells
    empty_cells = validate_no_empty_cells(
        df,
        columns['measurements'],
        part_col=columns['part'],
        operator_col=columns['operator']
    )
    if empty_cells:
        return None, {
            'code': 'EMPTY_CELLS',
            'message': VALIDATION_MESSAGES['EMPTY_CELLS'].format(cells=', '.join(empty_cells)),
            'details': empty_cells,
        }

    # Step 4: Validate data requirements
    req_error = validate_data_requirements(df, columns)
    if req_error:
        return None, req_error

    return columns, None


# =============================================================================
# Error Message Formatting
# =============================================================================

def format_validation_error(error_dict: dict[str, Any]) -> str:
    """
    Format a validation error dictionary into a user-friendly message.

    Args:
        error_dict: Error dictionary from validation functions

    Returns:
        Formatted error message in Spanish
    """
    if error_dict is None:
        return ''

    code = error_dict.get('code', '')
    message = error_dict.get('message', '')

    return message
