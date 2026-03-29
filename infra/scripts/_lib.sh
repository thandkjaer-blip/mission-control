#!/usr/bin/env bash
set -euo pipefail

MC_ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MC_COMPOSE_FILE="$MC_ROOT_DIR/infra/docker/docker-compose.yml"

mc_load_env() {
  if [[ -f "$MC_ROOT_DIR/.env" ]]; then
    set -a
    # shellcheck disable=SC1091
    source "$MC_ROOT_DIR/.env"
    set +a
  fi
}

mc_require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Missing required command: $cmd" >&2
    return 1
  fi
}

mc_compose() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    docker compose -f "$MC_COMPOSE_FILE" "$@"
    return
  fi

  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f "$MC_COMPOSE_FILE" "$@"
    return
  fi

  echo "Neither 'docker compose' nor 'docker-compose' is available." >&2
  return 1
}

mc_wait_for_tcp() {
  local host="$1"
  local port="$2"
  local label="$3"
  local attempts="${4:-30}"

  node -e '
    const net = require("node:net");
    const host = process.argv[1];
    const port = Number(process.argv[2]);
    const label = process.argv[3];
    const attempts = Number(process.argv[4]);

    let count = 0;
    const tryOnce = () => {
      count += 1;
      const socket = net.createConnection({ host, port });
      socket.setTimeout(1000);
      socket.on("connect", () => {
        console.log(`${label} is reachable on ${host}:${port}`);
        socket.destroy();
        process.exit(0);
      });
      const retry = () => {
        socket.destroy();
        if (count >= attempts) {
          console.error(`Timed out waiting for ${label} on ${host}:${port}`);
          process.exit(1);
        }
        setTimeout(tryOnce, 1000);
      };
      socket.on("error", retry);
      socket.on("timeout", retry);
    };

    tryOnce();
  ' "$host" "$port" "$label" "$attempts"
}
