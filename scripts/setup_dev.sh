#!/usr/bin/env bash
set -e

echo "=== Initializing FraudTrace AI Development Environment ==="
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "Step 1: Setting up Python backend virtual environment..."
cd "$PROJECT_ROOT/backend"
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "Step 2: Generating synthetic demo fixtures..."
python -m app.seed.generate_fixtures

echo "Step 3: Setting up Next.js frontend dependencies..."
cd "$PROJECT_ROOT/frontend"
npm install

echo "=== Setup Complete! ==="
echo "To run backend: cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000"
echo "To run frontend: cd frontend && npm run dev"
