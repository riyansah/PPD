#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="${1:-start}"

cd "$ROOT_DIR"

if ! command -v npm >/dev/null 2>&1; then
  echo "npm tidak ditemukan. Install Node.js dan npm terlebih dahulu." >&2
  exit 1
fi

if [ ! -d "$ROOT_DIR/node_modules" ]; then
  echo "Dependency belum terpasang. Jalankan 'npm install' terlebih dahulu." >&2
  exit 1
fi

run_app() {
  npm run migrate
  exec npm run "$1"
}

case "$MODE" in
  start)
    run_app start
    ;;
  dev)
    run_app dev
    ;;
  migrate)
    exec npm run migrate
    ;;
  setup-account)
    exec npm run setup:account
    ;;
  test)
    exec npm test
    ;;
  lint)
    exec npm run lint
    ;;
  *)
    echo "Penggunaan: ./launcher.sh [start|dev|migrate|setup-account|test|lint]" >&2
    exit 1
    ;;
esac
