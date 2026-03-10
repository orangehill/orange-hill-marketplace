#!/bin/bash
# verify.sh -- Quick verification that gogcli is ready to use
# Usage: bash verify.sh
# Exit codes: 0 = ready, 1 = not ready
set -euo pipefail

JQ_BIN="${JQ_BIN:-/opt/homebrew/bin/jq}"
errors=0

# Check binary
if command -v gog >/dev/null 2>&1; then
    echo "[OK] gog binary found: $(command -v gog)"
else
    echo "[FAIL] gog not found. Install: brew install steipete/tap/gogcli"
    exit 1
fi

# Check version
version=$(gog --version 2>/dev/null || echo "unknown")
echo "[OK] Version: $version"

# Check accounts
auth_output=$(gog auth list --json 2>/dev/null || echo '{"accounts":[]}')
account_count=$(echo "$auth_output" | "$JQ_BIN" '.accounts | length' 2>/dev/null || echo "0")

if [ "$account_count" -eq 0 ]; then
    echo "[FAIL] No accounts configured. Run: bash scripts/setup.sh"
    exit 1
fi

echo "[OK] $account_count account(s) configured"

# Check each account's token validity
check_output=$(gog auth list --check --json 2>/dev/null || echo '{}')
echo "$auth_output" | "$JQ_BIN" -r '.accounts[].email // .accounts[].account // "unknown"' 2>/dev/null | while read -r email; do
    echo "  - $email"
done

# Quick read-only test (optional, only if tokens are valid)
if gog gmail search 'newer_than:1d' --max 1 --json --no-input >/dev/null 2>&1; then
    echo "[OK] Gmail API responding"
else
    echo "[WARN] Gmail API test failed (may need re-auth or different account)"
    errors=$((errors + 1))
fi

if [ "$errors" -gt 0 ]; then
    echo ""
    echo "Some checks failed. Run: bash scripts/setup.sh"
    exit 1
fi

echo ""
echo "All checks passed. gogcli is ready to use."
