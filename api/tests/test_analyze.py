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
