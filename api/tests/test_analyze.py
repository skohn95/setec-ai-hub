"""Tests for the analyze.py endpoint handler."""
import pytest
import json
import sys
import os
from unittest.mock import Mock, patch, MagicMock
from io import BytesIO

# Add api directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


class MockRequestHandler:
    """Mock HTTP request handler for testing."""

    def __init__(self, body: dict | None = None, method: str = 'POST'):
        self.body = body
        self.method = method
        self.response_code = None
        self.response_headers = {}
        self.response_body = None
        self.wfile = BytesIO()
        self.rfile = BytesIO()

        if body is not None:
            body_bytes = json.dumps(body).encode('utf-8')
            self.rfile = BytesIO(body_bytes)
            self.headers = {'Content-Length': str(len(body_bytes))}
        else:
            self.headers = {}

    def send_response(self, code):
        self.response_code = code

    def send_header(self, name, value):
        self.response_headers[name] = value

    def end_headers(self):
        pass


class TestAnalyzeEndpointValidation:
    """Tests for request validation in the analyze endpoint."""

    def test_post_with_missing_analysis_type_returns_400(self):
        """Test that POST without analysis_type returns 400."""
        from analyze import handler

        mock_handler = MockRequestHandler(body={'file_id': '550e8400-e29b-41d4-a716-446655440000'})

        # Create instance and call do_POST
        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert mock_handler.response_code == 400

        # Check response body
        response = json.loads(mock_handler.wfile.getvalue().decode())
        assert response['data'] is None
        assert response['error']['code'] == 'MISSING_FIELD'

    def test_post_with_missing_file_id_returns_400(self):
        """Test that POST without file_id returns 400."""
        from analyze import handler

        mock_handler = MockRequestHandler(body={'analysis_type': 'msa'})

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert mock_handler.response_code == 400

        response = json.loads(mock_handler.wfile.getvalue().decode())
        assert response['data'] is None
        assert response['error']['code'] == 'MISSING_FIELD'

    def test_post_with_unknown_analysis_type_returns_400(self):
        """Test that POST with unknown analysis_type returns 400."""
        from analyze import handler

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'unknown_type',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert mock_handler.response_code == 400

        response = json.loads(mock_handler.wfile.getvalue().decode())
        assert response['data'] is None
        assert response['error']['code'] == 'UNKNOWN_ANALYSIS_TYPE'
        assert 'no soportado' in response['error']['message']


class TestAnalyzeEndpointErrorFormat:
    """Tests for error response format."""

    def test_error_response_has_correct_structure(self):
        """Test that error responses have data: null and error object."""
        from analyze import handler

        mock_handler = MockRequestHandler(body={})

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        response = json.loads(mock_handler.wfile.getvalue().decode())
        assert 'data' in response
        assert 'error' in response
        assert response['data'] is None
        assert 'code' in response['error']
        assert 'message' in response['error']


class TestAnalyzeEndpointCORS:
    """Tests for CORS headers."""

    def test_options_returns_204_with_cors_headers(self):
        """Test that OPTIONS request returns 204 with CORS headers."""
        from analyze import handler

        mock_handler = MockRequestHandler(method='OPTIONS')

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile

        h.do_OPTIONS()

        assert mock_handler.response_code == 204
        assert 'Access-Control-Allow-Origin' in mock_handler.response_headers
        assert 'Access-Control-Allow-Methods' in mock_handler.response_headers
        assert 'Access-Control-Allow-Headers' in mock_handler.response_headers

    def test_post_response_includes_cors_headers(self):
        """Test that POST responses include CORS headers."""
        from analyze import handler

        mock_handler = MockRequestHandler(body={})

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert 'Access-Control-Allow-Origin' in mock_handler.response_headers


class TestAnalyzeEndpointValidRequest:
    """Tests for valid request handling (mocked Supabase)."""

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.validate_msa_file')
    @patch('analyze.update_file_validation')
    @patch('analyze.analyze_msa')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_post_with_valid_msa_request_returns_200(
        self,
        mock_save_results,
        mock_update_status,
        mock_analyze,
        mock_update_validation,
        mock_validate,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that valid MSA request returns 200 with results."""
        from analyze import handler
        import pandas as pd

        # Setup mocks
        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (pd.DataFrame({'A': [1, 2, 3]}), None)
        mock_validate.return_value = ({'part': 'Part', 'operator': 'Operator', 'measurements': ['M1', 'M2']}, None)
        mock_update_validation.return_value = True
        mock_analyze.return_value = ({
            'results': {'grr_percentage': 10.5},
            'chartData': [],
            'instructions': '# Results'
        }, None)
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'msa',
            'file_id': '550e8400-e29b-41d4-a716-446655440001'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert mock_handler.response_code == 200

        response = json.loads(mock_handler.wfile.getvalue().decode())
        assert response['error'] is None
        assert response['data'] is not None
        assert 'results' in response['data']
        assert 'chartData' in response['data']
        assert 'instructions' in response['data']

    @patch('analyze.fetch_file_from_storage')
    def test_post_with_file_not_found_returns_404(self, mock_fetch_file):
        """Test that file not found returns 404."""
        from analyze import handler

        mock_fetch_file.return_value = (None, 'FILE_NOT_FOUND')

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'msa',
            'file_id': '550e8400-e29b-41d4-a716-446655440002'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert mock_handler.response_code == 404

        response = json.loads(mock_handler.wfile.getvalue().decode())
        assert response['error']['code'] == 'FILE_NOT_FOUND'


class TestAnalyzeEndpointInvalidJSON:
    """Tests for invalid JSON handling."""

    def test_post_with_invalid_json_returns_400(self):
        """Test that POST with invalid JSON body returns 400."""
        from analyze import handler

        # Create mock with raw invalid JSON bytes
        mock_handler = MockRequestHandler()
        invalid_json = b'{invalid json content'
        mock_handler.rfile = BytesIO(invalid_json)
        mock_handler.headers = {'Content-Length': str(len(invalid_json))}

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert mock_handler.response_code == 400

        response = json.loads(mock_handler.wfile.getvalue().decode())
        assert response['data'] is None
        assert response['error']['code'] == 'VALIDATION_ERROR'


class TestAnalyzeEndpointUUIDValidation:
    """Tests for UUID format validation."""

    def test_post_with_invalid_file_id_format_returns_400(self):
        """Test that POST with invalid file_id format returns 400."""
        from analyze import handler

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'msa',
            'file_id': 'not-a-valid-uuid'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert mock_handler.response_code == 400

        response = json.loads(mock_handler.wfile.getvalue().decode())
        assert response['data'] is None
        assert response['error']['code'] == 'VALIDATION_ERROR'
        assert 'UUID' in response['error']['message']

    def test_post_with_invalid_message_id_format_returns_400(self):
        """Test that POST with invalid message_id format returns 400."""
        from analyze import handler

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'msa',
            'file_id': '550e8400-e29b-41d4-a716-446655440000',
            'message_id': 'not-a-valid-uuid'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert mock_handler.response_code == 400

        response = json.loads(mock_handler.wfile.getvalue().decode())
        assert response['data'] is None
        assert response['error']['code'] == 'VALIDATION_ERROR'

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.validate_msa_file')
    @patch('analyze.update_file_validation')
    @patch('analyze.analyze_msa')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_post_with_valid_uuids_proceeds(
        self,
        mock_save_results,
        mock_update_status,
        mock_analyze,
        mock_update_validation,
        mock_validate,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that valid UUIDs pass validation and proceed."""
        from analyze import handler
        import pandas as pd

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (pd.DataFrame({'A': [1]}), None)
        mock_validate.return_value = ({'part': 'Part', 'operator': 'Operator', 'measurements': ['M1', 'M2']}, None)
        mock_update_validation.return_value = True
        mock_analyze.return_value = ({'results': {}, 'chartData': [], 'instructions': ''}, None)
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'msa',
            'file_id': '550e8400-e29b-41d4-a716-446655440000',
            'message_id': '550e8400-e29b-41d4-a716-446655440001'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert mock_handler.response_code == 200


class TestAnalyzeEndpointFileValidation:
    """Tests for file validation integration in the analyze endpoint."""

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.validate_msa_file')
    @patch('analyze.update_file_validation')
    def test_validation_failure_returns_400_with_file_validation_error(
        self,
        mock_update_validation,
        mock_validate,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that validation failure returns 400 with FILE_VALIDATION_ERROR."""
        from analyze import handler
        import pandas as pd

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (pd.DataFrame({'A': [1]}), None)
        mock_validate.return_value = (None, {
            'code': 'MISSING_COLUMNS',
            'message': 'Faltan columnas requeridas: Part, Operator',
            'missing': ['Part', 'Operator']
        })
        mock_update_validation.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'msa',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert mock_handler.response_code == 400

        response = json.loads(mock_handler.wfile.getvalue().decode())
        assert response['data'] is None
        assert response['error']['code'] == 'FILE_VALIDATION_ERROR'
        assert 'columnas' in response['error']['message'].lower()

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.validate_msa_file')
    @patch('analyze.update_file_validation')
    def test_validation_failure_updates_file_status_to_invalid(
        self,
        mock_update_validation,
        mock_validate,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that validation failure updates file status to invalid."""
        from analyze import handler
        import pandas as pd

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (pd.DataFrame({'A': [1]}), None)
        mock_validate.return_value = (None, {
            'code': 'MISSING_COLUMNS',
            'message': 'Test error',
            'missing': ['Part']
        })
        mock_update_validation.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'msa',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        # Verify update_file_validation was called with is_valid=False
        mock_update_validation.assert_called_once()
        call_args = mock_update_validation.call_args
        assert call_args[1]['is_valid'] is False
        assert call_args[1]['errors'] is not None

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.validate_msa_file')
    @patch('analyze.update_file_validation')
    @patch('analyze.analyze_msa')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_validation_success_updates_file_status_to_valid(
        self,
        mock_save_results,
        mock_update_status,
        mock_analyze,
        mock_update_validation,
        mock_validate,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that validation success updates file status to valid."""
        from analyze import handler
        import pandas as pd

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (pd.DataFrame({'A': [1]}), None)
        mock_validate.return_value = ({
            'part': 'Part',
            'operator': 'Operator',
            'measurements': ['M1', 'M2']
        }, None)
        mock_update_validation.return_value = True
        mock_analyze.return_value = ({'results': {}, 'chartData': [], 'instructions': ''}, None)
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'msa',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert mock_handler.response_code == 200

        # Verify update_file_validation was called with is_valid=True
        mock_update_validation.assert_called_once_with(
            '550e8400-e29b-41d4-a716-446655440000',
            is_valid=True
        )

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.validate_msa_file')
    @patch('analyze.update_file_validation')
    def test_validation_error_includes_spanish_message(
        self,
        mock_update_validation,
        mock_validate,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that validation error response includes Spanish message."""
        from analyze import handler
        import pandas as pd

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (pd.DataFrame({'A': [1]}), None)
        mock_validate.return_value = (None, {
            'code': 'NON_NUMERIC_DATA',
            'message': 'La celda C5 contiene \'abc\' pero se esperaba un número.',
            'details': [{'column': 'C', 'row': 5, 'value': 'abc'}]
        })
        mock_update_validation.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'msa',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        response = json.loads(mock_handler.wfile.getvalue().decode())
        assert 'número' in response['error']['message'].lower()


class TestAnalyzeEndpointMSAIntegration:
    """Integration tests for MSA analysis pipeline (Story 4.3)."""

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.validate_msa_file')
    @patch('analyze.update_file_validation')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_msa_analysis_returns_complete_results_structure(
        self,
        mock_save_results,
        mock_update_status,
        mock_update_validation,
        mock_validate,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that MSA analysis returns complete results structure with all required fields."""
        from analyze import handler
        import pandas as pd

        # Create test DataFrame with valid MSA data
        test_df = pd.DataFrame({
            'Part': [1, 1, 2, 2, 3, 3],
            'Operator': ['A', 'B', 'A', 'B', 'A', 'B'],
            'M1': [10.0, 10.5, 20.0, 20.5, 30.0, 30.5],
            'M2': [10.1, 10.4, 20.1, 20.4, 30.1, 30.4],
        })

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (test_df, None)
        mock_validate.return_value = ({
            'part': 'Part',
            'operator': 'Operator',
            'measurements': ['M1', 'M2']
        }, None)
        mock_update_validation.return_value = True
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'msa',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert mock_handler.response_code == 200

        response = json.loads(mock_handler.wfile.getvalue().decode())
        assert response['error'] is None
        assert response['data'] is not None

        # Verify results structure
        results = response['data']['results']
        assert 'grr_percent' in results
        assert 'repeatability_percent' in results
        assert 'reproducibility_percent' in results
        assert 'part_to_part_percent' in results
        assert 'total_variation' in results
        assert 'ndc' in results
        assert 'classification' in results

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.validate_msa_file')
    @patch('analyze.update_file_validation')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_msa_analysis_returns_chart_data_for_recharts(
        self,
        mock_save_results,
        mock_update_status,
        mock_update_validation,
        mock_validate,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that chartData is structured for Recharts components."""
        from analyze import handler
        import pandas as pd

        test_df = pd.DataFrame({
            'Part': [1, 1, 2, 2, 3, 3],
            'Operator': ['A', 'B', 'A', 'B', 'A', 'B'],
            'M1': [10.0, 10.5, 20.0, 20.5, 30.0, 30.5],
            'M2': [10.1, 10.4, 20.1, 20.4, 30.1, 30.4],
        })

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (test_df, None)
        mock_validate.return_value = ({
            'part': 'Part',
            'operator': 'Operator',
            'measurements': ['M1', 'M2']
        }, None)
        mock_update_validation.return_value = True
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'msa',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        response = json.loads(mock_handler.wfile.getvalue().decode())
        chart_data = response['data']['chartData']

        assert isinstance(chart_data, list)
        assert len(chart_data) >= 2

        # Find variation breakdown
        variation_breakdown = None
        operator_comparison = None
        for item in chart_data:
            if item.get('type') == 'variationBreakdown':
                variation_breakdown = item
            if item.get('type') == 'operatorComparison':
                operator_comparison = item

        assert variation_breakdown is not None
        assert operator_comparison is not None

        # Verify variation breakdown structure
        for entry in variation_breakdown['data']:
            assert 'source' in entry
            assert 'percentage' in entry
            assert 'color' in entry

        # Verify operator comparison structure
        for entry in operator_comparison['data']:
            assert 'operator' in entry
            assert 'mean' in entry
            assert 'stdDev' in entry

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.validate_msa_file')
    @patch('analyze.update_file_validation')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_msa_analysis_returns_markdown_instructions(
        self,
        mock_save_results,
        mock_update_status,
        mock_update_validation,
        mock_validate,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that instructions is a non-empty markdown string."""
        from analyze import handler
        import pandas as pd

        test_df = pd.DataFrame({
            'Part': [1, 1, 2, 2, 3, 3],
            'Operator': ['A', 'B', 'A', 'B', 'A', 'B'],
            'M1': [10.0, 10.5, 20.0, 20.5, 30.0, 30.5],
            'M2': [10.1, 10.4, 20.1, 20.4, 30.1, 30.4],
        })

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (test_df, None)
        mock_validate.return_value = ({
            'part': 'Part',
            'operator': 'Operator',
            'measurements': ['M1', 'M2']
        }, None)
        mock_update_validation.return_value = True
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'msa',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        response = json.loads(mock_handler.wfile.getvalue().decode())
        instructions = response['data']['instructions']

        assert isinstance(instructions, str)
        assert len(instructions) > 0
        assert '#' in instructions  # Markdown headers
        # Enhanced instructions for agent include GRR terminology
        assert 'GRR' in instructions or 'RESUMEN EJECUTIVO' in instructions

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.validate_msa_file')
    @patch('analyze.update_file_validation')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_msa_analysis_updates_file_status_to_processed(
        self,
        mock_save_results,
        mock_update_status,
        mock_update_validation,
        mock_validate,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that file status is updated to 'processed' on successful analysis."""
        from analyze import handler
        import pandas as pd

        test_df = pd.DataFrame({
            'Part': [1, 1, 2, 2, 3, 3],
            'Operator': ['A', 'B', 'A', 'B', 'A', 'B'],
            'M1': [10.0, 10.5, 20.0, 20.5, 30.0, 30.5],
            'M2': [10.1, 10.4, 20.1, 20.4, 30.1, 30.4],
        })

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (test_df, None)
        mock_validate.return_value = ({
            'part': 'Part',
            'operator': 'Operator',
            'measurements': ['M1', 'M2']
        }, None)
        mock_update_validation.return_value = True
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'msa',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert mock_handler.response_code == 200

        # Verify update_file_status was called with 'processed'
        mock_update_status.assert_called_once_with(
            '550e8400-e29b-41d4-a716-446655440000',
            'processed'
        )

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.validate_msa_file')
    @patch('analyze.update_file_validation')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_msa_analysis_classification_is_valid(
        self,
        mock_save_results,
        mock_update_status,
        mock_update_validation,
        mock_validate,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that classification value is one of the valid options."""
        from analyze import handler
        import pandas as pd

        test_df = pd.DataFrame({
            'Part': [1, 1, 2, 2, 3, 3],
            'Operator': ['A', 'B', 'A', 'B', 'A', 'B'],
            'M1': [10.0, 10.5, 20.0, 20.5, 30.0, 30.5],
            'M2': [10.1, 10.4, 20.1, 20.4, 30.1, 30.4],
        })

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (test_df, None)
        mock_validate.return_value = ({
            'part': 'Part',
            'operator': 'Operator',
            'measurements': ['M1', 'M2']
        }, None)
        mock_update_validation.return_value = True
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'msa',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        response = json.loads(mock_handler.wfile.getvalue().decode())
        classification = response['data']['results']['classification']

        valid_classifications = ['aceptable', 'marginal', 'inaceptable']
        assert classification in valid_classifications


class TestAnalyzeEndpointCapacidadProcesoIntegration:
    """Integration tests for Capacidad de Proceso analysis pipeline (Story 7.1)."""

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.update_file_validation')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_capacidad_proceso_analysis_returns_200_with_results(
        self,
        mock_save_results,
        mock_update_status,
        mock_update_validation,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that valid capacidad_proceso request returns 200 with results."""
        from analyze import handler
        import pandas as pd

        # Create valid DataFrame with numeric values
        test_df = pd.DataFrame({'Valores': [97.52, 111.20, 83.97, 103.58, 99.45] * 4})

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (test_df, None)
        mock_update_validation.return_value = True
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'capacidad_proceso',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert mock_handler.response_code == 200

        response = json.loads(mock_handler.wfile.getvalue().decode())
        assert response['error'] is None
        assert response['data'] is not None
        assert 'results' in response['data']
        assert 'chartData' in response['data']
        assert 'instructions' in response['data']

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.update_file_validation')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_capacidad_proceso_returns_basic_statistics(
        self,
        mock_save_results,
        mock_update_status,
        mock_update_validation,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that capacidad_proceso returns all required basic statistics fields."""
        from analyze import handler
        import pandas as pd

        test_df = pd.DataFrame({'Valores': [10.0, 20.0, 30.0, 40.0, 50.0] * 4})

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (test_df, None)
        mock_update_validation.return_value = True
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'capacidad_proceso',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        response = json.loads(mock_handler.wfile.getvalue().decode())
        results = response['data']['results']

        # Verify basic_statistics structure
        assert 'basic_statistics' in results
        stats = results['basic_statistics']
        assert 'mean' in stats
        assert 'median' in stats
        assert 'mode' in stats
        assert 'std_dev' in stats
        assert 'min' in stats
        assert 'max' in stats
        assert 'range' in stats
        assert 'count' in stats

        # Verify other fields
        assert 'sample_size' in results
        assert 'warnings' in results

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.update_file_validation')
    def test_capacidad_proceso_validation_error_returns_400(
        self,
        mock_update_validation,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that validation errors return 400 with FILE_VALIDATION_ERROR."""
        from analyze import handler
        import pandas as pd

        # DataFrame with non-numeric values
        test_df = pd.DataFrame({'Valores': ['text', 'abc', 'xyz']})

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (test_df, None)
        mock_update_validation.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'capacidad_proceso',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert mock_handler.response_code == 400

        response = json.loads(mock_handler.wfile.getvalue().decode())
        assert response['data'] is None
        assert response['error']['code'] == 'FILE_VALIDATION_ERROR'

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.update_file_validation')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_capacidad_proceso_with_small_sample_includes_warning(
        self,
        mock_save_results,
        mock_update_status,
        mock_update_validation,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that samples < 20 include a warning."""
        from analyze import handler
        import pandas as pd

        # Only 5 values - should trigger warning
        test_df = pd.DataFrame({'Valores': [1.0, 2.0, 3.0, 4.0, 5.0]})

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (test_df, None)
        mock_update_validation.return_value = True
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'capacidad_proceso',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert mock_handler.response_code == 200

        response = json.loads(mock_handler.wfile.getvalue().decode())
        results = response['data']['results']
        assert len(results['warnings']) > 0
        # Warning should mention sample size
        assert '20' in results['warnings'][0]

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.update_file_validation')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_capacidad_proceso_empty_dataframe_returns_results(
        self,
        mock_save_results,
        mock_update_status,
        mock_update_validation,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that empty DataFrame returns results with warning (edge case MEDIUM #6)."""
        from analyze import handler
        import pandas as pd

        # Empty DataFrame with Valores column
        test_df = pd.DataFrame({'Valores': []})

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (test_df, None)
        mock_update_validation.return_value = True
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'capacidad_proceso',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        # Should handle gracefully - either 200 with results or controlled error
        assert mock_handler.response_code in [200, 400]

        response = json.loads(mock_handler.wfile.getvalue().decode())
        if mock_handler.response_code == 200:
            # If 200, should have a sample size warning
            results = response['data']['results']
            assert results['sample_size'] == 0
            assert len(results['warnings']) > 0

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.update_file_validation')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_capacidad_proceso_updates_file_status_to_processed(
        self,
        mock_save_results,
        mock_update_status,
        mock_update_validation,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that file status is updated to processed on success."""
        from analyze import handler
        import pandas as pd

        test_df = pd.DataFrame({'Valores': list(range(1, 26))})

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (test_df, None)
        mock_update_validation.return_value = True
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'capacidad_proceso',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert mock_handler.response_code == 200
        mock_update_status.assert_called_once_with(
            '550e8400-e29b-41d4-a716-446655440000',
            'processed'
        )


class TestAnalyzeEndpointCapacidadProcesoStability:
    """Integration tests for Capacidad de Proceso stability analysis (Story 7.3)."""

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.update_file_validation')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_capacidad_proceso_returns_stability_results(
        self,
        mock_save_results,
        mock_update_status,
        mock_update_validation,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that capacidad_proceso returns stability analysis results."""
        from analyze import handler
        import pandas as pd

        # Create valid DataFrame with enough values
        test_df = pd.DataFrame({'Valores': [97.52, 111.20, 83.97, 103.58, 99.45] * 6})

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (test_df, None)
        mock_update_validation.return_value = True
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'capacidad_proceso',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert mock_handler.response_code == 200

        response = json.loads(mock_handler.wfile.getvalue().decode())
        results = response['data']['results']

        # Verify stability results structure
        assert 'stability' in results
        stability = results['stability']
        assert 'is_stable' in stability
        assert 'conclusion' in stability
        assert 'i_chart' in stability
        assert 'mr_chart' in stability
        assert 'rules' in stability
        assert 'sigma' in stability

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.update_file_validation')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_capacidad_proceso_stability_has_i_chart_structure(
        self,
        mock_save_results,
        mock_update_status,
        mock_update_validation,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that I-Chart results have correct structure."""
        from analyze import handler
        import pandas as pd

        test_df = pd.DataFrame({'Valores': [10.0, 20.0, 30.0, 40.0, 50.0] * 6})

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (test_df, None)
        mock_update_validation.return_value = True
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'capacidad_proceso',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        response = json.loads(mock_handler.wfile.getvalue().decode())
        i_chart = response['data']['results']['stability']['i_chart']

        assert 'center' in i_chart
        assert 'ucl' in i_chart
        assert 'lcl' in i_chart
        assert 'ooc_points' in i_chart
        assert isinstance(i_chart['ooc_points'], list)

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.update_file_validation')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_capacidad_proceso_stability_has_all_seven_rules(
        self,
        mock_save_results,
        mock_update_status,
        mock_update_validation,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that all 7 stability rules are evaluated."""
        from analyze import handler
        import pandas as pd

        test_df = pd.DataFrame({'Valores': [10.0, 20.0, 30.0, 40.0, 50.0] * 6})

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (test_df, None)
        mock_update_validation.return_value = True
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'capacidad_proceso',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        response = json.loads(mock_handler.wfile.getvalue().decode())
        rules = response['data']['results']['stability']['rules']

        # All 7 rules should be present
        for i in range(1, 8):
            rule_key = f'rule_{i}'
            assert rule_key in rules
            assert 'cumple' in rules[rule_key]
            assert 'violations' in rules[rule_key]

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.update_file_validation')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_capacidad_proceso_instructions_include_stability(
        self,
        mock_save_results,
        mock_update_status,
        mock_update_validation,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that instructions include stability analysis section."""
        from analyze import handler
        import pandas as pd

        test_df = pd.DataFrame({'Valores': [97.52, 111.20, 83.97, 103.58, 99.45] * 6})

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (test_df, None)
        mock_update_validation.return_value = True
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'capacidad_proceso',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        response = json.loads(mock_handler.wfile.getvalue().decode())
        instructions = response['data']['instructions']

        # Instructions should mention stability analysis
        assert 'Estabilidad' in instructions
        assert 'Carta I' in instructions or 'I-MR' in instructions
        assert 'Regla' in instructions or 'CUMPLE' in instructions


class TestAnalyzeEndpointCapacidadProcesoCapability:
    """Integration tests for Capacidad de Proceso capability analysis (Story 7.4)."""

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.update_file_validation')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_capacidad_proceso_returns_capability_with_spec_limits(
        self,
        mock_save_results,
        mock_update_status,
        mock_update_validation,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that capacidad_proceso returns capability analysis when spec limits provided."""
        from analyze import handler
        import pandas as pd

        # Create valid DataFrame with enough values
        test_df = pd.DataFrame({'Valores': [97.52, 111.20, 83.97, 103.58, 99.45] * 6})

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (test_df, None)
        mock_update_validation.return_value = True
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'capacidad_proceso',
            'file_id': '550e8400-e29b-41d4-a716-446655440000',
            'spec_limits': {'lei': 70, 'les': 130}
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert mock_handler.response_code == 200

        response = json.loads(mock_handler.wfile.getvalue().decode())
        results = response['data']['results']

        # Verify capability results structure
        assert 'capability' in results
        capability = results['capability']
        assert 'cp' in capability
        assert 'cpk' in capability
        assert 'pp' in capability
        assert 'ppk' in capability

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.update_file_validation')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_capacidad_proceso_no_capability_without_spec_limits(
        self,
        mock_save_results,
        mock_update_status,
        mock_update_validation,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that capability is not included when spec limits not provided."""
        from analyze import handler
        import pandas as pd

        test_df = pd.DataFrame({'Valores': [97.52, 111.20, 83.97, 103.58, 99.45] * 6})

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (test_df, None)
        mock_update_validation.return_value = True
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'capacidad_proceso',
            'file_id': '550e8400-e29b-41d4-a716-446655440000'
            # No spec_limits
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        assert mock_handler.response_code == 200

        response = json.loads(mock_handler.wfile.getvalue().decode())
        results = response['data']['results']

        # capability should NOT be present without spec limits
        assert 'capability' not in results

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.update_file_validation')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_capacidad_proceso_capability_has_classification(
        self,
        mock_save_results,
        mock_update_status,
        mock_update_validation,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that capability includes classification with color codes."""
        from analyze import handler
        import pandas as pd

        test_df = pd.DataFrame({'Valores': [100.0, 101.0, 99.0, 100.5, 99.5] * 6})

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (test_df, None)
        mock_update_validation.return_value = True
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'capacidad_proceso',
            'file_id': '550e8400-e29b-41d4-a716-446655440000',
            'spec_limits': {'lei': 95, 'les': 105}
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        response = json.loads(mock_handler.wfile.getvalue().decode())
        capability = response['data']['results']['capability']

        # Check classification structure
        assert 'cpk_classification' in capability
        cpk_class = capability['cpk_classification']
        assert 'classification' in cpk_class
        assert 'color' in cpk_class
        assert cpk_class['color'] in ['green', 'yellow', 'red', 'gray']

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.update_file_validation')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_capacidad_proceso_capability_has_ppm(
        self,
        mock_save_results,
        mock_update_status,
        mock_update_validation,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that capability includes PPM breakdown."""
        from analyze import handler
        import pandas as pd

        test_df = pd.DataFrame({'Valores': [100.0, 101.0, 99.0, 100.5, 99.5] * 6})

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (test_df, None)
        mock_update_validation.return_value = True
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'capacidad_proceso',
            'file_id': '550e8400-e29b-41d4-a716-446655440000',
            'spec_limits': {'lei': 95, 'les': 105}
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        response = json.loads(mock_handler.wfile.getvalue().decode())
        capability = response['data']['results']['capability']

        # Check PPM structure
        assert 'ppm' in capability
        ppm = capability['ppm']
        assert 'ppm_below_lei' in ppm
        assert 'ppm_above_les' in ppm
        assert 'ppm_total' in ppm
        assert isinstance(ppm['ppm_total'], int)

    @patch('analyze.fetch_file_from_storage')
    @patch('analyze.load_excel_to_dataframe')
    @patch('analyze.update_file_validation')
    @patch('analyze.update_file_status')
    @patch('analyze.save_analysis_results')
    def test_capacidad_proceso_capability_instructions_include_capability(
        self,
        mock_save_results,
        mock_update_status,
        mock_update_validation,
        mock_load_excel,
        mock_fetch_file
    ):
        """Test that instructions include capability analysis section."""
        from analyze import handler
        import pandas as pd

        test_df = pd.DataFrame({'Valores': [100.0, 101.0, 99.0, 100.5, 99.5] * 6})

        mock_fetch_file.return_value = (b'file_bytes', None)
        mock_load_excel.return_value = (test_df, None)
        mock_update_validation.return_value = True
        mock_update_status.return_value = True
        mock_save_results.return_value = True

        mock_handler = MockRequestHandler(body={
            'analysis_type': 'capacidad_proceso',
            'file_id': '550e8400-e29b-41d4-a716-446655440000',
            'spec_limits': {'lei': 95, 'les': 105}
        })

        h = handler.__new__(handler)
        h.__dict__.update(mock_handler.__dict__)
        h.send_response = mock_handler.send_response
        h.send_header = mock_handler.send_header
        h.end_headers = mock_handler.end_headers
        h.wfile = mock_handler.wfile
        h.rfile = mock_handler.rfile
        h.headers = mock_handler.headers

        h.do_POST()

        response = json.loads(mock_handler.wfile.getvalue().decode())
        instructions = response['data']['instructions']

        # Instructions should mention capability analysis
        assert 'Capacidad' in instructions
        assert 'Cpk' in instructions
        assert 'PPM' in instructions or 'ppm' in instructions.lower()
