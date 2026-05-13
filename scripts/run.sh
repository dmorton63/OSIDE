#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_BINARY="$ROOT_DIR/backend/build/oside-backend"

if [ ! -x "$BACKEND_BINARY" ]; then
	"$ROOT_DIR/scripts/build.sh"
fi

exec "$BACKEND_BINARY"
