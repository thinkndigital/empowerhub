#!/usr/bin/env bash
# Runs automatically after `next build` (see package.json "postinstall") to finish
# assembling the standalone runtime bundle IN PLACE, so the app can be started
# directly via cPanel's "Setup Node.js App" (Application startup file) with no
# extra manual step and no terminal access needed.
#
# `output: standalone` (next.config.js) produces next-build/standalone/server.js
# with its own trimmed node_modules, but it does NOT copy the static assets or
# public/ into that folder by itself — Next.js expects the deployer to do that.

set -euo pipefail
cd "$(dirname "$0")/.."

echo "==> Copying static assets into next-build/standalone/"
mkdir -p next-build/standalone/next-build
cp -r next-build/static next-build/standalone/next-build/static

if [ -d public ]; then
  cp -r public next-build/standalone/public
fi

echo ""
echo "Build ready. In cPanel's Setup Node.js App, set:"
echo "  Application startup file: next-build/standalone/server.js"
