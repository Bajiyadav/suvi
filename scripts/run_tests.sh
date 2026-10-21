#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "=== Running FraudTrace AI Backend Automated Tests ==="
cd "$PROJECT_ROOT/backend"
if [ -d "venv" ]; then
    source venv/bin/activate
fi
pytest -v --tb=short tests/
