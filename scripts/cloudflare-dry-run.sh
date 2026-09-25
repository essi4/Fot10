#!/usr/bin/env bash
set -euo pipefail

# Safe Cloudflare setup preview: no files are modified and nothing is deployed.
npx --yes wrangler@4.68.0 setup --dry-run
