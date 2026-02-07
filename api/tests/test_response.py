"""Tests for response helper functions."""
import pytest
import sys
import os

# Add api directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from utils.response import (
    success_response,
    error_response,
    ERROR_MESSAGES,
)


class TestSuccessResponse:
    """Tests for success_response function."""

    def test_success_response_basic_structure(self):
        """Test that success response has correct structure."""
        result = success_response(
            results={'total': 100},
            chart_data=[{'x': 1, 'y': 2}],
            instructions='# Test'
        )

        assert result is not None
        assert 'data' in result
        assert 'error' in result
        assert result['error'] is None

    def test_success_response_data_fields(self):
        """Test that success response data contains all required fields."""
        results = {'total_variation': 0.5, 'grr_percentage': 10.2}
        chart_data = [{'type': 'bar', 'values': [1, 2, 3]}]
        instructions = '# MSA Results\n\nInterpretation text'

        result = success_response(results, chart_data, instructions)

        assert result['data']['results'] == results
        assert result['data']['chartData'] == chart_data
        assert result['data']['instructions'] == instructions

    def test_success_response_empty_data(self):
        """Test success response with empty data."""
        result = success_response(
            results={},
            chart_data=[],
            instructions=''
        )

        assert result['data']['results'] == {}
        assert result['data']['chartData'] == []
        assert result['data']['instructions'] == ''
        assert result['error'] is None


class TestErrorResponse:
    """Tests for error_response function."""

    def test_error_response_basic_structure(self):
        """Test that error response has correct structure."""
        result = error_response('TEST_ERROR', 'Test message')

        assert result is not None
        assert 'data' in result
        assert 'error' in result
        assert result['data'] is None

    def test_error_response_error_fields(self):
        """Test that error response error contains all required fields."""
        result = error_response('TEST_CODE', 'Test message')

        assert result['error']['code'] == 'TEST_CODE'
        assert result['error']['message'] == 'Test message'

    def test_error_response_with_details(self):
        """Test error response with details field."""
        details = {'field': 'analysis_type', 'reason': 'missing'}
        result = error_response('VALIDATION_ERROR', 'Validation failed', details)

        assert result['error']['details'] == details

    def test_error_response_without_details(self):
        """Test error response without details field omits it."""
        result = error_response('TEST_ERROR', 'Test message')

        assert 'details' not in result['error']


class TestErrorMessages:
    """Tests for ERROR_MESSAGES constants."""

    def test_unknown_analysis_type_message(self):
        """Test UNKNOWN_ANALYSIS_TYPE error message exists and is Spanish."""
        assert 'UNKNOWN_ANALYSIS_TYPE' in ERROR_MESSAGES
        assert 'no soportado' in ERROR_MESSAGES['UNKNOWN_ANALYSIS_TYPE']

    def test_file_not_found_message(self):
        """Test FILE_NOT_FOUND error message exists and is Spanish."""
        assert 'FILE_NOT_FOUND' in ERROR_MESSAGES
        assert 'no fue encontrado' in ERROR_MESSAGES['FILE_NOT_FOUND']

    def test_file_fetch_error_message(self):
        """Test FILE_FETCH_ERROR error message exists."""
        assert 'FILE_FETCH_ERROR' in ERROR_MESSAGES

    def test_invalid_file_message(self):
        """Test INVALID_FILE error message exists."""
        assert 'INVALID_FILE' in ERROR_MESSAGES

    def test_analysis_error_message(self):
        """Test ANALYSIS_ERROR error message exists."""
        assert 'ANALYSIS_ERROR' in ERROR_MESSAGES

    def test_database_error_message(self):
        """Test DATABASE_ERROR error message exists."""
        assert 'DATABASE_ERROR' in ERROR_MESSAGES

    def test_missing_field_message(self):
        """Test MISSING_FIELD error message exists."""
        assert 'MISSING_FIELD' in ERROR_MESSAGES

    def test_all_messages_are_spanish(self):
        """Test that all error messages are in Spanish (contain Spanish characters/words)."""
        spanish_indicators = ['no', 'el', 'un', 'error', 'archivo', 'análisis', 'durante', 'válido']

        for code, message in ERROR_MESSAGES.items():
            has_spanish = any(word in message.lower() for word in spanish_indicators)
            assert has_spanish, f"Message for {code} does not appear to be in Spanish: {message}"
