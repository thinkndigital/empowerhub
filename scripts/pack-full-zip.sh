#!/usr/bin/env bash
# Builds a fresh production build and assembles empowerhub-full.zip:
# full source tree (via git archive, so only committed files are included)
# plus the standalone server output, WITH static assets merged in (this is
# the step that is easy to forget and silently produces a build that 404s on
# every /_next/static/* request).
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf next-build dist-cpanel dist-cpanel.zip empowerhub-full.zip
npm run build

STAGE=$(mktemp -d)
git archive HEAD | tar -x -C "$STAGE"

mkdir -p "$STAGE/next-build/standalone/next-build"
cp -r next-build/standalone/. "$STAGE/next-build/standalone/"
cp -r next-build/static "$STAGE/next-build/standalone/next-build/static"

# public/ (logo, favicon, etc.) must be a sibling of server.js inside
# standalone/ to be served — Next.js does not bundle it there automatically,
# same as static/ above. The git-archived copy at $STAGE/public is also kept
# for the source tree, but it's this one the running server actually reads.
if [ -d public ]; then
  cp -r public "$STAGE/next-build/standalone/public"
fi

if [ ! -d "$STAGE/next-build/standalone/next-build/static/chunks" ]; then
  echo "FATAL: static/chunks missing from the package — aborting." >&2
  exit 1
fi
if [ ! -f "$STAGE/next-build/standalone/server.js" ]; then
  echo "FATAL: server.js missing from the package — aborting." >&2
  exit 1
fi
if [ ! -f "$STAGE/package.json" ] || [ ! -f "$STAGE/schema.sql" ]; then
  echo "FATAL: package.json or schema.sql missing from the package — aborting." >&2
  exit 1
fi

(cd "$STAGE" && zip -rq "$OLDPWD/empowerhub-full.zip" . -x ".git/*")
rm -rf "$STAGE"

echo "OK: empowerhub-full.zip ready ($(du -h empowerhub-full.zip | cut -f1))"
