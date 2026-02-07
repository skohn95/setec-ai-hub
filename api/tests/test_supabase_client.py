"""Tests for Supabase client utilities."""
import pytest
import sys
import os
from unittest.mock import Mock, patch, MagicMock

# Add api directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


class TestGetSupabaseClient:
    """Tests for get_supabase_client function."""

    @patch.dict(os.environ, {'SUPABASE_URL': 'https://test.supabase.co', 'SUPABASE_SERVICE_ROLE_KEY': 'test-key'})
    @patch('utils.supabase_client.create_client')
    def test_creates_client_with_env_vars(self, mock_create_client):
        """Test that client is created with environment variables."""
        from utils.supabase_client import get_supabase_client

        mock_client = Mock()
        mock_create_client.return_value = mock_client

        result = get_supabase_client()

        mock_create_client.assert_called_once_with('https://test.supabase.co', 'test-key')
        assert result == mock_client

    @patch.dict(os.environ, {}, clear=True)
    def test_raises_error_when_url_missing(self):
        """Test that ValueError is raised when SUPABASE_URL is missing."""
        # Clear the module cache to force re-import with new env
        import importlib
        import utils.supabase_client as sc
        importlib.reload(sc)

        with pytest.raises(ValueError) as exc_info:
            sc.get_supabase_client()

        assert 'SUPABASE_URL' in str(exc_info.value)

    @patch.dict(os.environ, {'SUPABASE_URL': 'https://test.supabase.co'}, clear=True)
    def test_raises_error_when_key_missing(self):
        """Test that ValueError is raised when SUPABASE_SERVICE_ROLE_KEY is missing."""
        import importlib
        import utils.supabase_client as sc
        importlib.reload(sc)

        with pytest.raises(ValueError) as exc_info:
            sc.get_supabase_client()

        assert 'SUPABASE_SERVICE_ROLE_KEY' in str(exc_info.value)


class TestFetchFileFromStorage:
    """Tests for fetch_file_from_storage function."""

    @patch('utils.supabase_client.get_supabase_client')
    def test_returns_file_bytes_on_success(self, mock_get_client):
        """Test successful file fetch returns bytes."""
        from utils.supabase_client import fetch_file_from_storage

        # Setup mock
        mock_client = Mock()
        mock_get_client.return_value = mock_client

        # Mock table query
        mock_result = Mock()
        mock_result.data = {'storage_path': 'user/conv/file.xlsx'}
        mock_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_result

        # Mock storage download
        mock_client.storage.from_.return_value.download.return_value = b'file_content'

        file_bytes, error = fetch_file_from_storage('test-file-id')

        assert file_bytes == b'file_content'
        assert error is None

    @patch('utils.supabase_client.get_supabase_client')
    def test_returns_file_not_found_when_no_record(self, mock_get_client):
        """Test FILE_NOT_FOUND error when file record doesn't exist."""
        from utils.supabase_client import fetch_file_from_storage

        mock_client = Mock()
        mock_get_client.return_value = mock_client

        # Mock empty result
        mock_result = Mock()
        mock_result.data = None
        mock_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_result

        file_bytes, error = fetch_file_from_storage('nonexistent-id')

        assert file_bytes is None
        assert error == 'FILE_NOT_FOUND'

    @patch('utils.supabase_client.get_supabase_client')
    def test_returns_fetch_error_on_storage_exception(self, mock_get_client):
        """Test FILE_FETCH_ERROR when storage download fails."""
        from utils.supabase_client import fetch_file_from_storage

        mock_client = Mock()
        mock_get_client.return_value = mock_client

        # Mock successful table query
        mock_result = Mock()
        mock_result.data = {'storage_path': 'user/conv/file.xlsx'}
        mock_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = mock_result

        # Mock storage download failure
        mock_client.storage.from_.return_value.download.side_effect = Exception('Storage error')

        file_bytes, error = fetch_file_from_storage('test-file-id')

        assert file_bytes is None
        assert error == 'FILE_FETCH_ERROR'

    @patch('utils.supabase_client.get_supabase_client')
    def test_returns_file_not_found_on_no_rows_exception(self, mock_get_client):
        """Test FILE_NOT_FOUND when exception contains 'no rows'."""
        from utils.supabase_client import fetch_file_from_storage

        mock_client = Mock()
        mock_get_client.return_value = mock_client

        # Mock exception with "no rows" message
        mock_client.table.return_value.select.return_value.eq.return_value.single.return_value.execute.side_effect = Exception('no rows returned')

        file_bytes, error = fetch_file_from_storage('test-file-id')

        assert file_bytes is None
        assert error == 'FILE_NOT_FOUND'


class TestUpdateFileStatus:
    """Tests for update_file_status function."""

    @patch('utils.supabase_client.get_supabase_client')
    def test_returns_true_on_success(self, mock_get_client):
        """Test successful status update returns True."""
        from utils.supabase_client import update_file_status

        mock_client = Mock()
        mock_get_client.return_value = mock_client

        # Mock successful update
        mock_result = Mock()
        mock_result.data = [{'id': 'test-id', 'status': 'processed'}]
        mock_client.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_result

        result = update_file_status('test-file-id', 'processed')

        assert result is True

    @patch('utils.supabase_client.get_supabase_client')
    def test_returns_false_on_empty_result(self, mock_get_client):
        """Test update returns False when no rows updated."""
        from utils.supabase_client import update_file_status

        mock_client = Mock()
        mock_get_client.return_value = mock_client

        # Mock empty result
        mock_result = Mock()
        mock_result.data = []
        mock_client.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_result

        result = update_file_status('nonexistent-id', 'processed')

        assert result is False

    @patch('utils.supabase_client.get_supabase_client')
    def test_returns_false_on_exception(self, mock_get_client):
        """Test update returns False on exception."""
        from utils.supabase_client import update_file_status

        mock_client = Mock()
        mock_get_client.return_value = mock_client

        mock_client.table.return_value.update.return_value.eq.return_value.execute.side_effect = Exception('DB error')

        result = update_file_status('test-file-id', 'processed')

        assert result is False

    @patch('utils.supabase_client.get_supabase_client')
    def test_includes_validation_errors_when_provided(self, mock_get_client):
        """Test that validation_errors are included in update."""
        from utils.supabase_client import update_file_status

        mock_client = Mock()
        mock_get_client.return_value = mock_client

        mock_result = Mock()
        mock_result.data = [{'id': 'test-id'}]
        mock_client.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_result

        validation_errors = {'column_missing': 'Part column not found'}
        update_file_status('test-file-id', 'invalid', validation_errors)

        # Verify update was called with validation_errors
        call_args = mock_client.table.return_value.update.call_args[0][0]
        assert 'validation_errors' in call_args
        assert call_args['validation_errors'] == validation_errors


class TestUpdateFileValidation:
    """Tests for update_file_validation function."""

    @patch('utils.supabase_client.get_supabase_client')
    def test_valid_file_sets_status_to_valid(self, mock_get_client):
        """Test that valid file sets status to 'valid'."""
        from utils.supabase_client import update_file_validation

        mock_client = Mock()
        mock_get_client.return_value = mock_client

        mock_result = Mock()
        mock_result.data = [{'id': 'test-id', 'status': 'valid'}]
        mock_client.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_result

        result = update_file_validation('test-file-id', is_valid=True)

        assert result is True
        call_args = mock_client.table.return_value.update.call_args[0][0]
        assert call_args['status'] == 'valid'
        assert call_args['validation_errors'] is None
        assert 'validated_at' in call_args

    @patch('utils.supabase_client.get_supabase_client')
    def test_invalid_file_sets_status_to_invalid(self, mock_get_client):
        """Test that invalid file sets status to 'invalid' with errors."""
        from utils.supabase_client import update_file_validation

        mock_client = Mock()
        mock_get_client.return_value = mock_client

        mock_result = Mock()
        mock_result.data = [{'id': 'test-id', 'status': 'invalid'}]
        mock_client.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_result

        errors = {'code': 'MISSING_COLUMNS', 'message': 'Test error'}
        result = update_file_validation('test-file-id', is_valid=False, errors=errors)

        assert result is True
        call_args = mock_client.table.return_value.update.call_args[0][0]
        assert call_args['status'] == 'invalid'
        assert call_args['validation_errors'] == errors

    @patch('utils.supabase_client.get_supabase_client')
    def test_returns_false_on_exception(self, mock_get_client):
        """Test that exception returns False."""
        from utils.supabase_client import update_file_validation

        mock_client = Mock()
        mock_get_client.return_value = mock_client

        mock_client.table.return_value.update.return_value.eq.return_value.execute.side_effect = Exception('DB error')

        result = update_file_validation('test-file-id', is_valid=True)

        assert result is False

    @patch('utils.supabase_client.get_supabase_client')
    def test_returns_false_on_empty_result(self, mock_get_client):
        """Test that empty result returns False."""
        from utils.supabase_client import update_file_validation

        mock_client = Mock()
        mock_get_client.return_value = mock_client

        mock_result = Mock()
        mock_result.data = []
        mock_client.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_result

        result = update_file_validation('nonexistent-id', is_valid=True)

        assert result is False


class TestSaveAnalysisResults:
    """Tests for save_analysis_results function."""

    @patch('utils.supabase_client.get_supabase_client')
    def test_returns_true_on_success(self, mock_get_client):
        """Test successful save returns True."""
        from utils.supabase_client import save_analysis_results

        mock_client = Mock()
        mock_get_client.return_value = mock_client

        mock_result = Mock()
        mock_result.data = [{'id': 'new-result-id'}]
        mock_client.table.return_value.insert.return_value.execute.return_value = mock_result

        result = save_analysis_results(
            message_id='msg-123',
            file_id='file-123',
            analysis_type='msa',
            results={'grr': 10.5},
            chart_data=[],
            instructions='# Results'
        )

        assert result is True

    @patch('utils.supabase_client.get_supabase_client')
    def test_returns_false_on_exception(self, mock_get_client):
        """Test save returns False on exception."""
        from utils.supabase_client import save_analysis_results

        mock_client = Mock()
        mock_get_client.return_value = mock_client

        mock_client.table.return_value.insert.return_value.execute.side_effect = Exception('Insert failed')

        result = save_analysis_results(
            message_id='msg-123',
            file_id='file-123',
            analysis_type='msa',
            results={},
            chart_data=[],
            instructions=''
        )

        assert result is False

    @patch('utils.supabase_client.get_supabase_client')
    def test_excludes_message_id_when_none(self, mock_get_client):
        """Test that message_id is excluded from insert when None."""
        from utils.supabase_client import save_analysis_results

        mock_client = Mock()
        mock_get_client.return_value = mock_client

        mock_result = Mock()
        mock_result.data = [{'id': 'new-result-id'}]
        mock_client.table.return_value.insert.return_value.execute.return_value = mock_result

        save_analysis_results(
            message_id=None,  # No message_id
            file_id='file-123',
            analysis_type='msa',
            results={},
            chart_data=[],
            instructions=''
        )

        # Verify insert was called without message_id
        call_args = mock_client.table.return_value.insert.call_args[0][0]
        assert 'message_id' not in call_args

    @patch('utils.supabase_client.get_supabase_client')
    def test_includes_python_version(self, mock_get_client):
        """Test that python_version is included in insert."""
        from utils.supabase_client import save_analysis_results

        mock_client = Mock()
        mock_get_client.return_value = mock_client

        mock_result = Mock()
        mock_result.data = [{'id': 'new-result-id'}]
        mock_client.table.return_value.insert.return_value.execute.return_value = mock_result

        save_analysis_results(
            message_id='msg-123',
            file_id='file-123',
            analysis_type='msa',
            results={},
            chart_data=[],
            instructions=''
        )

        call_args = mock_client.table.return_value.insert.call_args[0][0]
        assert 'python_version' in call_args
        assert call_args['python_version'] == '1.0.0'
