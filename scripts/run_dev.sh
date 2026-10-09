#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# SQL Query AI Agent — Development Server Runner
# Starts both backend (uvicorn) and frontend (vite) in parallel.
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
FRONTEND_DIR="${PROJECT_ROOT}/frontend"

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo ""
    echo "Shutting down..."
    if [ -n "${BACKEND_PID}" ] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
        echo "  Stopping backend (PID ${BACKEND_PID})..."
        kill "${BACKEND_PID}" 2>/dev/null || true
    fi
    if [ -n "${FRONTEND_PID}" ] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
        echo "  Stopping frontend (PID ${FRONTEND_PID})..."
        kill "${FRONTEND_PID}" 2>/dev/null || true
    fi
    wait 2>/dev/null
    echo "  ✓ All servers stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo "============================================"
echo "  SQL Query AI Agent — Dev Servers"
echo "============================================"
echo ""

# ---- Start Backend ----
echo "▶ Starting backend on http://localhost:8000 ..."

if [ ! -d "${BACKEND_DIR}/.venv" ]; then
    echo "  ✗ Virtual environment not found at backend/.venv"
    echo "    Run ./scripts/setup.sh first."
    exit 1
fi

(
    cd "${BACKEND_DIR}"
    # shellcheck disable=SC1091
    source .venv/bin/activate
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
) &
BACKEND_PID=$!
echo "  Backend started (PID ${BACKEND_PID})"
echo ""

# ---- Start Frontend ----
echo "▶ Starting frontend on http://localhost:5173 ..."

if [ -d "${FRONTEND_DIR}" ] && [ -f "${FRONTEND_DIR}/package.json" ]; then
    (
        cd "${FRONTEND_DIR}"
        npm run dev -- --port 5173
    ) &
    FRONTEND_PID=$!
    echo "  Frontend started (PID ${FRONTEND_PID})"
else
    echo "  ⚠ frontend/package.json not found — skipping frontend"
    echo "    Only the backend will be running."
fi

echo ""
echo "============================================"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo "  Frontend: http://localhost:5173"
echo "============================================"
echo ""
echo "Press Ctrl+C to stop all servers."
echo ""

# Wait for background processes
wait
