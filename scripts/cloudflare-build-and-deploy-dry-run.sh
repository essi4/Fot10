#!/usr/bin/env bash
set -euo pipefail

# B-only validation. This builds OpenNext locally in CI and then asks Wrangler
# to validate the generated Worker/assets without uploading or deploying.
npx --yes opennextjs-cloudflare build
npx --yes wrangler@4.68.0 deploy --dry-run
