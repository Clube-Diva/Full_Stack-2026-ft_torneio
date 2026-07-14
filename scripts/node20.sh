#!/usr/bin/env bash
set -euo pipefail

NODE_VERSION="20.19.0"
NODE_DIR="$HOME/.local/node20/node-v${NODE_VERSION}-linux-x64"
NODE_ARCHIVE="$HOME/.local/node20/node-v${NODE_VERSION}-linux-x64.tar.xz"
NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz"

if [[ ! -x "$NODE_DIR/bin/node" ]]; then
  mkdir -p "$HOME/.local/node20"
  if [[ ! -f "$NODE_ARCHIVE" ]]; then
    curl -fsSLo "$NODE_ARCHIVE" "$NODE_URL"
  fi
  tar -xf "$NODE_ARCHIVE" -C "$HOME/.local/node20"
fi

export PATH="$NODE_DIR/bin:$PATH"
exec "$@"