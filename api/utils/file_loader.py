"""
File loading utilities for the Analysis API.

Provides functions to load Excel files into pandas DataFrames.
"""
import pandas as pd
from io import BytesIO


def load_excel_to_dataframe(file_bytes: bytes) -> tuple[pd.DataFrame | None, str | None]:
    """
    Load Excel file bytes into pandas DataFrame.

    Uses openpyxl engine for .xlsx file support.

    Args:
        file_bytes: Raw bytes of the Excel file

    Returns:
        tuple: (DataFrame, error_message)
        - On success: (DataFrame, None)
        - On error: (None, error_code)

    Error codes:
        - INVALID_FILE: File cannot be parsed as Excel
    """
    if not file_bytes:
        return None, 'INVALID_FILE'

    try:
        df = pd.read_excel(BytesIO(file_bytes), engine='openpyxl')
        return df, None
    except Exception as e:
        print(f'Excel parse error: {e}')
        return None, 'INVALID_FILE'
