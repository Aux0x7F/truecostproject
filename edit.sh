#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"
PORT="${PORT:-8787}"
if command -v node >/dev/null 2>&1; then
  NODE="node"
elif [ -x "./.local/node/bin/node" ]; then
  NODE="./.local/node/bin/node"
elif [ -x "./.local/node/node" ]; then
  NODE="./.local/node/node"
else
  printf '%s\n' "Node is needed to run the editor. Ask your agent to set up a local portable Node runtime for this repo." >&2
  exit 1
fi

export TRUECOST_EDIT_PORT="$PORT"
"$NODE" ./tools/apply-copy.mjs
printf '%s\n' "Open http://127.0.0.1:${PORT}/index.html?dev=1"
"$NODE" ./tools/edit-server.mjs
