#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -s "$HOME/.nvm/nvm.sh" ]; then
    export NVM_DIR="$HOME/.nvm"
    # Prefer the user's default nvm runtime when available.
    . "$NVM_DIR/nvm.sh"
    nvm use default >/dev/null
fi

cd "$ROOT_DIR/protocol"
npm install

cd "$ROOT_DIR/frontend"
npm install
npm run typecheck
npm run build
npm audit

cmake -S "$ROOT_DIR/backend" -B "$ROOT_DIR/backend/build"
cmake --build "$ROOT_DIR/backend/build"

bash "$ROOT_DIR/scripts/check-conformance.sh"