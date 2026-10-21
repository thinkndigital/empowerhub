#!/usr/bin/env bash
# Builds EmpowerHub and assembles a ready-to-upload bundle for shared cPanel
# hosting (Node.js Selector / Passenger) — no Docker, no VPS.
#
# Usage:
#   ./scripts/build-for-cpanel.sh
#
# Output:
#   dist-cpanel/            — everything that must be uploaded to the app's
#                              document root on the server
#   dist-cpanel.zip         — the same folder, zipped for upload via
#                              cPanel File Manager (or scp/sftp if available)
#
# What it does:
#   1. npm ci (clean install matching package-lock.json)
#   2. npm run build (next build — output: standalone is set in next.config.js,
#      and distDir is set to "next-build" instead of the default ".next" so the
#      build output folder isn't hidden by default in cPanel's File Manager)
#   3. Assembles next-build/standalone + next-build/static + public into
#      dist-cpanel/ (the standalone build does NOT include the static assets
#      or public/ by itself — Next.js expects the deployer to copy those in
#      manually)
#   4. Zips the result
#      (package.json is already included inside next-build/standalone/ by Next.js)

set -euo pipefail
cd "$(dirname "$0")/.."

DIST_DIR="next-build"

echo "==> Installing dependencies (npm ci)"
npm ci

echo "==> Building (next build)"
npm run build

echo "==> Assembling dist-cpanel/"
rm -rf dist-cpanel dist-cpanel.zip
mkdir -p dist-cpanel

cp -r "$DIST_DIR/standalone/." dist-cpanel/
mkdir -p "dist-cpanel/$DIST_DIR"
cp -r "$DIST_DIR/static" "dist-cpanel/$DIST_DIR/static"
if [ -d public ]; then
  cp -r public dist-cpanel/public
fi
# package.json is already included by next-build/standalone/ — no need to copy it again.

# .env is NOT copied here on purpose — set environment variables through
# cPanel's "Setup Node.js App" screen (or dist-cpanel/.env, see DEPLOYMENT.md).

echo "==> Zipping dist-cpanel.zip"
(cd dist-cpanel && zip -rq ../dist-cpanel.zip .)

echo ""
echo "Done. Upload dist-cpanel.zip via cPanel File Manager and extract it"
echo "into your Node.js app's folder, or upload the dist-cpanel/ folder"
echo "directly via SFTP if your hosting account has SSH/SFTP access."
echo "See DEPLOYMENT.md for the full step-by-step."
