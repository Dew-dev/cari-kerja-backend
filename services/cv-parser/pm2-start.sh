#!/usr/bin/env bash
# Quick start helper for VPS (run from repo root).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

PYTHON="${CV_PARSER_PYTHON:-$ROOT/.venv-cv/bin/python}"
if [[ ! -x "$PYTHON" ]]; then
  echo "Missing venv python at $PYTHON"
  echo "Create it: python3 -m venv .venv-cv && .venv-cv/bin/pip install -r services/cv-parser/requirements.txt"
  exit 1
fi

mkdir -p logs
exec pm2 start "$ROOT/services/cv-parser/ecosystem.config.cjs"
