"""
Response helper functions for the Analysis API.

Provides standardized response formatting for success and error cases.
All error messages are in Spanish as per project requirements.
"""
from typing import Any

# Standard error messages in Spanish
ERROR_MESSAGES = {
    'UNKNOWN_ANALYSIS_TYPE': 'Tipo de análisis no soportado.',
    'FILE_NOT_FOUND': 'El archivo no fue encontrado.',
    'FILE_FETCH_ERROR': 'No se pudo obtener el archivo del almacenamiento.',
    'INVALID_FILE': 'El archivo no es un Excel válido o está corrupto.',
    'ANALYSIS_ERROR': 'Error en el cálculo del análisis MSA.',
    'DATABASE_ERROR': 'Error al guardar los resultados.',
    'MISSING_FIELD': 'Faltan campos requeridos: {fields}.',
    'VALIDATION_ERROR': 'Error de validación: {details}.',
    'FILE_VALIDATION_ERROR': 'El archivo no cumple con el formato requerido.',
}


def success_response(
    results: dict[str, Any],
    chart_data: list[dict[str, Any]],
    instructions: str
) -> dict[str, Any]:
    """
    Create a standardized success response.

    Args:
        results: Numerical analysis data dictionary
        chart_data: List of chart data objects for frontend visualization
        instructions: Markdown text with presentation guidance

    Returns:
        Dictionary with structure: { data: {...}, error: null }
    """
    return {
        'data': {
            'results': results,
            'chartData': chart_data,
            'instructions': instructions,
        },
        'error': None,
    }


def error_response(
    code: str,
    message: str,
    details: dict[str, Any] | None = None
) -> dict[str, Any]:
    """
    Create a standardized error response.

    Args:
        code: Error code string (e.g., 'UNKNOWN_ANALYSIS_TYPE')
        message: User-facing error message in Spanish
        details: Optional technical details for debugging

    Returns:
        Dictionary with structure: { data: null, error: {...} }
    """
    error = {
        'code': code,
        'message': message,
    }

    if details is not None:
        error['details'] = details

    return {
        'data': None,
        'error': error,
    }


def validation_error_response(error_dict: dict[str, Any]) -> dict[str, Any]:
    """
    Create a standardized validation error response.

    Args:
        error_dict: Validation error dictionary from msa_validator

    Returns:
        Dictionary with structure: { data: null, error: {...} }
    """
    return error_response(
        code='FILE_VALIDATION_ERROR',
        message=error_dict.get('message', ERROR_MESSAGES['FILE_VALIDATION_ERROR']),
        details={
            'type': error_dict.get('code', 'UNKNOWN'),
            'items': error_dict.get('details', []),
        }
    )
