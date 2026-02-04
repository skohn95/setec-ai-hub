"""
MSA Analysis Endpoint - Placeholder

This Python serverless function will handle Excel file analysis
for Measurement System Analysis (MSA) calculations.

The actual implementation will be done in Epic 4.
"""

from http.server import BaseHTTPRequestHandler
import json


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        self.send_response(501)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()

        response = {
            'data': None,
            'error': {
                'code': 'NOT_IMPLEMENTED',
                'message': 'Análisis MSA no implementado todavía. Ver Epic 4.'
            }
        }

        self.wfile.write(json.dumps(response).encode())

    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()

        response = {
            'data': {
                'status': 'ok',
                'message': 'MSA Analysis endpoint - Ready for implementation'
            },
            'error': None
        }

        self.wfile.write(json.dumps(response).encode())
