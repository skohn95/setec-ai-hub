"""
Supabase client and database utilities for the Analysis API.

Provides functions for:
- Creating authenticated Supabase clients
- Fetching files from Supabase Storage
- Updating file status in the database
- Saving analysis results
"""
import os
from datetime import datetime, timezone
from typing import Any
from supabase import create_client, Client


def get_supabase_client() -> Client:
    """
    Create Supabase client using service role key.

    Service role bypasses RLS for server-side operations.

    Returns:
        Supabase client instance

    Raises:
        ValueError: If required environment variables are missing
    """
    # Support both SUPABASE_URL (Vercel) and NEXT_PUBLIC_SUPABASE_URL (local)
    url = os.environ.get('SUPABASE_URL') or os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
    key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

    if not url or not key:
        raise ValueError('Missing Supabase environment variables: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY are required')

    return create_client(url, key)


def fetch_file_from_storage(file_id: str) -> tuple[bytes | None, str | None]:
    """
    Fetch file bytes from Supabase Storage.

    Retrieves the storage path from the files table, then downloads
    the file content from the analysis-files bucket.

    Args:
        file_id: UUID of the file record in the files table

    Returns:
        tuple: (file_bytes, error_code)
        - On success: (bytes, None)
        - On error: (None, error_code)

    Error codes:
        - FILE_NOT_FOUND: File record doesn't exist in database
        - FILE_FETCH_ERROR: Failed to download from storage
    """
    try:
        supabase = get_supabase_client()

        # Get file record to retrieve storage path
        result = supabase.table('files').select('storage_path').eq('id', file_id).single().execute()

        if not result.data:
            return None, 'FILE_NOT_FOUND'

        storage_path = result.data['storage_path']

        # Download file from storage
        response = supabase.storage.from_('analysis-files').download(storage_path)
        return response, None

    except Exception as e:
        error_str = str(e)
        print(f'Supabase error: {e}')

        # Check if it's a "not found" type error
        if 'not found' in error_str.lower() or 'no rows' in error_str.lower():
            return None, 'FILE_NOT_FOUND'

        return None, 'FILE_FETCH_ERROR'


def update_file_status(
    file_id: str,
    status: str,
    validation_errors: dict[str, Any] | None = None
) -> bool:
    """
    Update the status of a file in the files table.

    Args:
        file_id: UUID of the file record
        status: New status value ('pending', 'validating', 'valid', 'invalid', 'processed')
        validation_errors: Optional dict with validation error details

    Returns:
        bool: True if update succeeded, False otherwise
    """
    try:
        supabase = get_supabase_client()

        update_data: dict[str, Any] = {'status': status}
        if validation_errors is not None:
            update_data['validation_errors'] = validation_errors

        result = supabase.table('files').update(update_data).eq('id', file_id).execute()

        return result.data is not None and len(result.data) > 0

    except Exception as e:
        print(f'Database update error: {e}')
        return False


def update_file_validation(
    file_id: str,
    is_valid: bool,
    errors: dict[str, Any] | None = None
) -> bool:
    """
    Update file validation status.

    Sets the file status to 'valid' or 'invalid' based on validation results.
    On validation success, records the validated_at timestamp.

    Args:
        file_id: UUID of the file record
        is_valid: True if validation passed, False if failed
        errors: Validation error details (only used when is_valid=False)

    Returns:
        bool: True if update succeeded, False otherwise
    """
    try:
        supabase = get_supabase_client()

        if is_valid:
            # Valid file: set status and record timestamp
            result = supabase.table('files').update({
                'status': 'valid',
                'validation_errors': None,
                'validated_at': datetime.now(timezone.utc).isoformat(),
            }).eq('id', file_id).execute()
        else:
            # Invalid file: set status and store errors
            result = supabase.table('files').update({
                'status': 'invalid',
                'validation_errors': errors,
            }).eq('id', file_id).execute()

        return result.data is not None and len(result.data) > 0

    except Exception as e:
        print(f'Validation status update error: {e}')
        return False


def save_analysis_results(
    message_id: str | None,
    file_id: str,
    analysis_type: str,
    results: dict[str, Any],
    chart_data: list[dict[str, Any]],
    instructions: str
) -> bool:
    """
    Save analysis results to the analysis_results table.

    Args:
        message_id: UUID of the associated message (can be None for standalone analysis)
        file_id: UUID of the analyzed file
        analysis_type: Type of analysis performed (e.g., 'msa')
        results: Dictionary of numerical analysis results
        chart_data: List of chart data objects for visualization
        instructions: Markdown text with presentation guidance

    Returns:
        bool: True if save succeeded, False otherwise
    """
    try:
        supabase = get_supabase_client()

        insert_data = {
            'file_id': file_id,
            'analysis_type': analysis_type,
            'results': results,
            'chart_data': chart_data,
            'instructions': instructions,
            'python_version': '1.0.0',
        }

        # Only include message_id if provided
        if message_id is not None:
            insert_data['message_id'] = message_id

        result = supabase.table('analysis_results').insert(insert_data).execute()

        return result.data is not None and len(result.data) > 0

    except Exception as e:
        print(f'Database insert error: {e}')
        return False
