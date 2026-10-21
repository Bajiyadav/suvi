#!/usr/bin/env bash
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "=== Seeding FraudTrace AI Deterministic Synthetic Fixtures ==="
cd "$PROJECT_ROOT/backend"
if [ -d "venv" ]; then
    source venv/bin/activate
fi
python -m app.seed.generate_fixtures
