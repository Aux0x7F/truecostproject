#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"
PORT="${PORT:-8787}"
export TRUECOST_EDIT_PORT="$PORT"
node ./tools/apply-copy.mjs
printf '%s\n' "Open http://127.0.0.1:${PORT}/index.html?dev=1"
node ./tools/edit-server.mjs
