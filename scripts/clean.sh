#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

rm -rf "$ROOT_DIR/backend/build"
rm -rf "$ROOT_DIR/frontend/dist"
rm -rf "$ROOT_DIR/frontend/node_modules"
rm -rf "$ROOT_DIR/protocol/node_modules"