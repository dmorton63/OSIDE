#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PID=""

cleanup() {
    if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
        kill "$BACKEND_PID"
        wait "$BACKEND_PID" 2>/dev/null || true
    fi
}

trap cleanup EXIT INT TERM

if [ -s "$HOME/.nvm/nvm.sh" ]; then
    export NVM_DIR="$HOME/.nvm"
    . "$NVM_DIR/nvm.sh"
    nvm use default >/dev/null
fi

cmake -S "$ROOT_DIR/backend" -B "$ROOT_DIR/backend/build"
cmake --build "$ROOT_DIR/backend/build"

"$ROOT_DIR/backend/build/oside-backend" &
BACKEND_PID="$!"

cd "$ROOT_DIR/frontend"
npm run dev -- --host 127.0.0.1