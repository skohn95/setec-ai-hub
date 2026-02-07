"""Tests for file loader utilities."""
import pytest
import sys
import os
from io import BytesIO

# Add api directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from utils.file_loader import load_excel_to_dataframe


class TestLoadExcelToDataFrame:
    """Tests for load_excel_to_dataframe function."""

    def test_load_valid_excel_bytes(self):
        """Test loading a valid Excel file from bytes returns DataFrame."""
        # Create a simple Excel file in memory using pandas
        import pandas as pd
        from io import BytesIO

        # Create test DataFrame
        test_df = pd.DataFrame({
            'Part': [1, 2, 3],
            'Operator': ['A', 'B', 'C'],
            'Measurement': [10.5, 11.2, 10.8]
        })

        # Save to bytes
        buffer = BytesIO()
        test_df.to_excel(buffer, index=False, engine='openpyxl')
        file_bytes = buffer.getvalue()

        # Load using our function
        df, error = load_excel_to_dataframe(file_bytes)

        assert error is None
        assert df is not None
        assert len(df) == 3
        assert 'Part' in df.columns
        assert 'Operator' in df.columns
        assert 'Measurement' in df.columns

    def test_load_invalid_bytes_returns_error(self):
        """Test loading invalid bytes returns error."""
        invalid_bytes = b'not an excel file content'

        df, error = load_excel_to_dataframe(invalid_bytes)

        assert df is None
        assert error == 'INVALID_FILE'

    def test_load_empty_bytes_returns_error(self):
        """Test loading empty bytes returns error."""
        empty_bytes = b''

        df, error = load_excel_to_dataframe(empty_bytes)

        assert df is None
        assert error == 'INVALID_FILE'

    def test_load_corrupted_excel_returns_error(self):
        """Test loading corrupted Excel bytes returns error."""
        # Start with Excel magic bytes but corrupt the rest
        corrupted_bytes = b'PK\x03\x04' + b'\x00' * 100

        df, error = load_excel_to_dataframe(corrupted_bytes)

        assert df is None
        assert error == 'INVALID_FILE'

    def test_return_type_is_tuple(self):
        """Test that function returns a tuple of (DataFrame|None, str|None)."""
        invalid_bytes = b'invalid'
        result = load_excel_to_dataframe(invalid_bytes)

        assert isinstance(result, tuple)
        assert len(result) == 2
