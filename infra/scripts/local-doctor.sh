#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"
mc_load_env

ROOT_DIR="$MC_ROOT_DIR"

status_ok() { echo "[ok] $1"; }
status_warn() { echo "[warn] $1"; }
status_fail() { echo "[fail] $1"; }

check_cmd() {
  local cmd="$1"
  local label="${2:-$1}"
  if command -v "$cmd" >/dev/null 2>&1; then
    status_ok "$label: $(command -v "$cmd")"
  else
    status_warn "$label missing"
  fi
}

check_file() {
  local path="$1"
  local label="$2"
  if [[ -e "$path" ]]; then
    status_ok "$label: $path"
  else
    status_warn "$label missing: $path"
  fi
}

check_port() {
  local host="$1"
  local port="$2"
  local label="$3"
  if node -e 'const net = require("node:net"); const s = net.createConnection({host: process.argv[1], port: Number(process.argv[2])}); s.setTimeout(750); const done=(ok,msg)=>{ console.log(msg); s.destroy(); process.exit(ok?0:1); }; s.on("connect",()=>done(true,`[ok] ${process.argv[3]} reachable on ${process.argv[1]}:${process.argv[2]}`)); s.on("timeout",()=>done(false,`[warn] ${process.argv[3]} not reachable on ${process.argv[1]}:${process.argv[2]}`)); s.on("error",()=>done(false,`[warn] ${process.argv[3]} not reachable on ${process.argv[1]}:${process.argv[2]}`));' "$host" "$port" "$label"; then
    :
  fi
}

echo "Mission Control local doctor"
echo "root: $ROOT_DIR"

echo
echo "Commands"
check_cmd node
check_cmd corepack
check_cmd docker
check_cmd docker-compose

echo
echo "Config"
check_file "$ROOT_DIR/.env" ".env"
check_file "$ROOT_DIR/apps/api/prisma/schema.prisma" "Prisma schema"
check_file "${OPENCLAW_SESSION_INDEX_PATH:-/home/open/.openclaw/agents/main/sessions/sessions.json}" "OpenClaw session index"

if [[ -n "${DATABASE_URL:-}" ]]; then
  status_ok "DATABASE_URL present"
else
  status_warn "DATABASE_URL missing from environment/.env"
fi

if [[ -n "${REDIS_URL:-}" ]]; then
  status_ok "REDIS_URL present"
else
  status_warn "REDIS_URL missing from environment/.env"
fi

echo
echo "Ports"
check_port 127.0.0.1 5432 Postgres
check_port 127.0.0.1 6379 Redis
check_port 127.0.0.1 "${API_PORT:-4001}" "Mission Control API"
check_port 127.0.0.1 "${WEB_PORT:-3000}" "Mission Control Web"

echo
echo "Prisma"
if [[ -n "${DATABASE_URL:-}" ]]; then
  if (
    cd "$ROOT_DIR/apps/api"
    DATABASE_URL="$DATABASE_URL" corepack pnpm exec prisma validate --schema prisma/schema.prisma
  ) >/tmp/mission-control-prisma-validate.log 2>&1; then
    status_ok "Prisma schema validate"
  else
    status_warn "Prisma schema validate failed (see /tmp/mission-control-prisma-validate.log)"
  fi
else
  status_warn "Skipping Prisma validate because DATABASE_URL is missing"
fi
