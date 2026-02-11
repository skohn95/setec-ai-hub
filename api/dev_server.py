#!/usr/bin/env python3
"""
Local development server for Python API endpoints.
Runs on port 3002 to serve /api/analyze locally.

Usage: python3 api/dev_server.py (from project root)
"""
import sys
import os

# Add project root to path so 'api.utils' imports work
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Load environment variables from .env.local
from dotenv import load_dotenv
env_path = os.path.join(project_root, '.env.local')
load_dotenv(env_path)
print(f'Loaded environment from: {env_path}')

from http.server import HTTPServer
from api.analyze import handler

PORT = 3002

if __name__ == '__main__':
    server = HTTPServer(('localhost', PORT), handler)
    print(f'Python API server running on http://localhost:{PORT}')
    print(f'  POST /api/analyze -> MSA analysis')
    print('Press Ctrl+C to stop')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down...')
        server.shutdown()
