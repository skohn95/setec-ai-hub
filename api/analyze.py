"""
MSA Analysis Endpoint

This Python serverless function handles Excel file analysis for
Measurement System Analysis (MSA) and other analysis types.

Endpoint: POST /api/analyze
Request Body:
    {
        "analysis_type": string,  // Required. Analysis type (MVP: "msa")
        "file_id": string,        // Required. UUID of file in files table
        "message_id": string      // Optional. UUID of associated message
    }

Success Response (200):
    {
        "data": {
            "results": { /* numerical analysis data */ },
            "chartData": [ /* structured data for frontend charts */ ],
            "instructions": "markdown presentation guidance"
        },
        "error": null
    }

Error Response (4xx/5xx):
    {
        "data": null,
        "error": {
            "code": "ERROR_CODE",
            "message": "Mensaje en español para el usuario",
            "details": { /* optional technical details */ }
        }
    }

Error Codes:
    - MISSING_FIELD: Required field missing from request (400)
    - UNKNOWN_ANALYSIS_TYPE: Unsupported analysis type (400)
    - FILE_NOT_FOUND: File record not in database (404)
    - FILE_FETCH_ERROR: Failed to download from storage (500)
    - INVALID_FILE: File cannot be parsed as Excel (400)
    - FILE_VALIDATION_ERROR: File structure/data validation failed (400)
    - ANALYSIS_ERROR: Error during analysis calculation (500)
    - DATABASE_ERROR: Failed to save results (500)
"""
from http.server import BaseHTTPRequestHandler
import json
import traceback
import uuid

from api.utils.response import success_response, error_response, validation_error_response, ERROR_MESSAGES
from api.utils.supabase_client import (
    fetch_file_from_storage,
    update_file_status,
    update_file_validation,
    save_analysis_results,
)
from api.utils.file_loader import load_excel_to_dataframe
from api.utils.msa_validator import validate_msa_file
from api.utils.msa_calculator import analyze_msa


def is_valid_uuid(value: str) -> bool:
    """Validate that a string is a valid UUID format."""
    try:
        uuid.UUID(value)
        return True
    except (ValueError, AttributeError):
        return False


# Supported analysis types
SUPPORTED_ANALYSIS_TYPES = {'msa'}


class handler(BaseHTTPRequestHandler):
    """HTTP request handler for the analysis endpoint."""

    def send_cors_headers(self):
        """Add CORS headers for frontend access."""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def send_json_response(self, status_code: int, body: dict):
        """Send a JSON response with proper headers."""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(body).encode())

    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(204)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self):
        """Handle GET requests - return endpoint status."""
        response = {
            'data': {
                'status': 'ok',
                'message': 'MSA Analysis endpoint - Ready',
                'supported_types': list(SUPPORTED_ANALYSIS_TYPES),
            },
            'error': None,
        }
        self.send_json_response(200, response)

    def do_POST(self):
        """Handle POST requests - perform analysis."""
        try:
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length == 0:
                body = {}
            else:
                body_bytes = self.rfile.read(content_length)
                body = json.loads(body_bytes.decode('utf-8'))

            # Validate required fields
            missing_fields = []
            if 'analysis_type' not in body:
                missing_fields.append('analysis_type')
            if 'file_id' not in body:
                missing_fields.append('file_id')

            if missing_fields:
                response = error_response(
                    'MISSING_FIELD',
                    ERROR_MESSAGES['MISSING_FIELD'].format(fields=', '.join(missing_fields))
                )
                self.send_json_response(400, response)
                return

            analysis_type = body['analysis_type']
            file_id = body['file_id']
            message_id = body.get('message_id')  # Optional

            # Validate file_id is a valid UUID format
            if not is_valid_uuid(file_id):
                response = error_response(
                    'VALIDATION_ERROR',
                    ERROR_MESSAGES['VALIDATION_ERROR'].format(details='file_id debe ser un UUID válido')
                )
                self.send_json_response(400, response)
                return

            # Validate message_id format if provided
            if message_id is not None and not is_valid_uuid(message_id):
                response = error_response(
                    'VALIDATION_ERROR',
                    ERROR_MESSAGES['VALIDATION_ERROR'].format(details='message_id debe ser un UUID válido')
                )
                self.send_json_response(400, response)
                return

            # Validate analysis type
            if analysis_type not in SUPPORTED_ANALYSIS_TYPES:
                response = error_response(
                    'UNKNOWN_ANALYSIS_TYPE',
                    ERROR_MESSAGES['UNKNOWN_ANALYSIS_TYPE']
                )
                self.send_json_response(400, response)
                return

            # Fetch file from Supabase Storage
            file_bytes, fetch_error = fetch_file_from_storage(file_id)
            if fetch_error:
                status_code = 404 if fetch_error == 'FILE_NOT_FOUND' else 500
                response = error_response(fetch_error, ERROR_MESSAGES.get(fetch_error, 'Error desconocido.'))
                self.send_json_response(status_code, response)
                return

            # Load file into DataFrame
            df, load_error = load_excel_to_dataframe(file_bytes)
            if load_error:
                response = error_response(load_error, ERROR_MESSAGES.get(load_error, 'Error desconocido.'))
                self.send_json_response(400, response)
                return

            # Validate file structure and data for MSA analysis
            if analysis_type == 'msa':
                validated_columns, validation_error = validate_msa_file(df)
                if validation_error:
                    # Update file status to invalid with error details
                    update_file_validation(file_id, is_valid=False, errors=validation_error)
                    response = validation_error_response(validation_error)
                    self.send_json_response(400, response)
                    return

                # Update file status to valid
                update_file_validation(file_id, is_valid=True)

            # Route to appropriate analyzer
            if analysis_type == 'msa':
                analysis_output, analysis_error = analyze_msa(df, validated_columns)
            else:
                # This shouldn't happen due to earlier validation, but handle it
                response = error_response(
                    'UNKNOWN_ANALYSIS_TYPE',
                    ERROR_MESSAGES['UNKNOWN_ANALYSIS_TYPE']
                )
                self.send_json_response(400, response)
                return

            if analysis_error:
                response = error_response(
                    'ANALYSIS_ERROR',
                    ERROR_MESSAGES.get('ANALYSIS_ERROR', 'Error durante el análisis.')
                )
                self.send_json_response(500, response)
                return

            # Update file status to 'processed'
            if not update_file_status(file_id, 'processed'):
                print(f'Warning: Failed to update file status for {file_id}')
                # Continue anyway - analysis succeeded

            # Save results to database (if message_id provided)
            if message_id:
                save_success = save_analysis_results(
                    message_id=message_id,
                    file_id=file_id,
                    analysis_type=analysis_type,
                    results=analysis_output['results'],
                    chart_data=analysis_output['chartData'],
                    instructions=analysis_output['instructions'],
                )
                if not save_success:
                    print(f'Warning: Failed to save analysis results for file {file_id}')
                    # Continue anyway - analysis succeeded

            # Return success response
            response = success_response(
                results=analysis_output['results'],
                chart_data=analysis_output['chartData'],
                instructions=analysis_output['instructions'],
            )
            self.send_json_response(200, response)

        except json.JSONDecodeError as e:
            print(f'JSON parse error: {e}')
            response = error_response(
                'VALIDATION_ERROR',
                ERROR_MESSAGES['VALIDATION_ERROR'].format(details='Invalid JSON body')
            )
            self.send_json_response(400, response)

        except Exception as e:
            # Log full error details for debugging
            print(f'Unexpected error: {type(e).__name__}: {e}')
            print(f'Traceback:\n{traceback.format_exc()}')
            response = error_response(
                'ANALYSIS_ERROR',
                ERROR_MESSAGES.get('ANALYSIS_ERROR', 'Ocurrió un error durante el análisis.'),
                details={'error_type': type(e).__name__}  # Include error type for debugging
            )
            self.send_json_response(500, response)
