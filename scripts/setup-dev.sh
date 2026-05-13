#!/usr/bin/env bash
set -euo pipefail

echo "Install frontend dependencies with:"
echo "  (cd frontend && npm install)"
echo "Install protocol dependencies with:"
echo "  (cd protocol && npm install)"
echo "Configure backend with:"
echo "  cmake -S backend -B backend/build"
