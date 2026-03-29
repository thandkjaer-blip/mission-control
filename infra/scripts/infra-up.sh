#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/_lib.sh"
mc_load_env

mc_require_cmd node >/dev/null
mc_compose up -d
mc_wait_for_tcp "127.0.0.1" "5432" "Postgres"
mc_wait_for_tcp "127.0.0.1" "6379" "Redis"

echo "Infrastructure is up."
