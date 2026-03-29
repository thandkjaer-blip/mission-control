#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"
mc_load_env

if [[ ! -f "$MC_ROOT_DIR/.env" ]]; then
  echo "Missing $MC_ROOT_DIR/.env. Start from: cp .env.example .env" >&2
  exit 1
fi

if [[ -z "${DATABASE_URL:-}" || -z "${REDIS_URL:-}" ]]; then
  echo "DATABASE_URL and REDIS_URL must be set in .env" >&2
  exit 1
fi

port_open() {
  node -e 'const net = require("node:net"); const socket = net.createConnection({ host: process.argv[1], port: Number(process.argv[2]) }); socket.setTimeout(500); const done = (ok) => { socket.destroy(); process.exit(ok ? 0 : 1); }; socket.on("connect", () => done(true)); socket.on("timeout", () => done(false)); socket.on("error", () => done(false));' "$1" "$2"
}

if port_open 127.0.0.1 5432 && port_open 127.0.0.1 6379; then
  echo "Reusing existing Postgres/Redis on localhost."
elif command -v docker >/dev/null 2>&1 || command -v docker-compose >/dev/null 2>&1; then
  bash "$MC_ROOT_DIR/infra/scripts/infra-up.sh"
else
  echo "Postgres/Redis are not reachable and Docker is unavailable for recovery." >&2
  exit 1
fi

cd "$MC_ROOT_DIR/apps/api"
DATABASE_URL="$DATABASE_URL" corepack pnpm exec prisma validate
DATABASE_URL="$DATABASE_URL" corepack pnpm exec prisma generate
DATABASE_URL="$DATABASE_URL" corepack pnpm exec prisma migrate deploy

echo "API is ready to start. Run:"
echo "  cd $MC_ROOT_DIR/apps/api && corepack pnpm dev"
