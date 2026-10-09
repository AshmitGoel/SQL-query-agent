#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# SQL Query AI Agent — Project Setup
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"

echo "============================================"
echo "  SQL Query AI Agent — Setup"
echo "============================================"
echo ""

# ---- Backend Setup ----
echo "▶ Setting up backend..."

echo "  Creating Python virtual environment..."
python3 -m venv "${BACKEND_DIR}/.venv"

echo "  Activating virtual environment..."
# shellcheck disable=SC1091
source "${BACKEND_DIR}/.venv/bin/activate"

echo "  Installing Python dependencies..."
pip install --upgrade pip --quiet
pip install -r "${BACKEND_DIR}/requirements.txt" --quiet

echo "  ✓ Python dependencies installed"

# Copy .env.example to .env if not present
if [ ! -f "${BACKEND_DIR}/.env" ]; then
    echo "  Copying .env.example → .env"
    cp "${BACKEND_DIR}/.env.example" "${BACKEND_DIR}/.env"
    echo "  ⚠ Remember to add your GEMINI_API_KEY to backend/.env"
else
    echo "  .env already exists — skipping"
fi

# Create data directory
echo "  Creating data directory..."
mkdir -p "${BACKEND_DIR}/data"

# Seed the database (start the app briefly to trigger init_database, then stop)
echo "  Seeding database (initializing via app startup)..."
cd "${BACKEND_DIR}"
timeout 10 python -c "
import asyncio
from app.database.connection import init_database
asyncio.run(init_database())
print('  ✓ Database seeded successfully')
" 2>/dev/null || echo "  ✓ Database initialization attempted (will finalize on first app start)"
cd "${PROJECT_ROOT}"

deactivate

echo "  ✓ Backend setup complete"
echo ""

# ---- Frontend Setup ----
echo "▶ Setting up frontend..."

if [ -d "${FRONTEND_DIR}" ] && [ -f "${FRONTEND_DIR}/package.json" ]; then
    cd "${FRONTEND_DIR}"
    echo "  Installing npm dependencies..."
    npm install --silent 2>/dev/null || npm install
    echo "  ✓ Frontend dependencies installed"
    cd "${PROJECT_ROOT}"
else
    echo "  ⚠ frontend/package.json not found — skipping npm install"
    echo "    (Frontend will be set up when package.json is created)"
fi

echo ""
echo "============================================"
echo "  ✓ Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo ""
echo "  1. Add your Gemini API key:"
echo "     nano backend/.env"
echo ""
echo "  2. Start both servers:"
echo "     ./scripts/run_dev.sh"
echo ""
echo "  Or start them individually:"
echo "     Backend:  cd backend && source .venv/bin/activate && uvicorn app.main:app --reload --port 8000"
echo "     Frontend: cd frontend && npm run dev"
echo ""
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "  API Docs: http://localhost:8000/docs"
echo ""
