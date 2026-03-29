#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"

ROOT_DIR="$MC_ROOT_DIR"
INDEX_PATH="${OPENCLAW_SESSION_INDEX_PATH:-/home/open/.openclaw/agents/main/sessions/sessions.json}"
SOURCE_ROOT="${OPENCLAW_SESSION_SOURCE_ROOT:-}"

usage() {
  cat <<'EOF'
Usage: bash infra/scripts/runtime-refresh.sh [--index PATH] [--source-root PATH]

Refresh Mission Control from real OpenClaw session data.

Options:
  --index PATH        Path to OpenClaw sessions.json index
  --source-root PATH  Optional directory with <sessionId>.jsonl files when index entries lack sessionFile
  --help              Show this help

Environment:
  OPENCLAW_SESSION_INDEX_PATH
  OPENCLAW_SESSION_SOURCE_ROOT
  DATABASE_URL
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --index)
      INDEX_PATH="$2"
      shift 2
      ;;
    --source-root)
      SOURCE_ROOT="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

mc_load_env

if [[ ! -f "$INDEX_PATH" ]]; then
  echo "OpenClaw session index not found: $INDEX_PATH" >&2
  exit 1
fi

if [[ -n "$SOURCE_ROOT" && ! -d "$SOURCE_ROOT" ]]; then
  echo "OpenClaw session source root not found: $SOURCE_ROOT" >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Create $ROOT_DIR/.env or export DATABASE_URL first." >&2
  exit 1
fi

cd "$ROOT_DIR"
exec corepack pnpm --filter @mission-control/api runtime:project --index="$INDEX_PATH" ${SOURCE_ROOT:+--source-root="$SOURCE_ROOT"}
