#!/usr/bin/env python3
"""
Local development server for testing Python API functions.
Run this alongside `npm run dev` to test the full flow locally.

Usage: python api/local_server.py
Runs on: http://localhost:3002
"""
import sys
import os

# Add project root to path for imports
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)

# Load environment variables from .env.local
def load_env_file(filepath: str):
    """Load environment variables from a file."""
    if not os.path.exists(filepath):
        return
    with open(filepath) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                # Strip quotes from values
                value = value.strip().strip('"').strip("'")
                os.environ.setdefault(key.strip(), value)

load_env_file(os.path.join(PROJECT_ROOT, '.env.local'))

from http.server import HTTPServer
from api.analyze import handler

PORT = 3002

if __name__ == '__main__':
    server = HTTPServer(('localhost', PORT), handler)
    print(f'Python API server running on http://localhost:{PORT}')
    print(f'Test endpoint: http://localhost:{PORT}/api/analyze')
    print('Press Ctrl+C to stop')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped')
