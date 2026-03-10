#!/bin/bash
# setup.sh -- Interactive setup helper for gogcli
# Usage: bash setup.sh
set -euo pipefail

echo "=== Google Workspace CLI (gogcli) Setup ==="
echo ""

# Step 1: Check if gog is installed
if command -v gog >/dev/null 2>&1; then
    echo "[OK] gog is installed: $(gog --version 2>/dev/null || echo 'version unknown')"
else
    echo "[!] gog is not installed."
    echo ""
    read -p "Install via Homebrew? (y/n) " -r answer
    if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
        echo "Installing gogcli..."
        brew install steipete/tap/gogcli
        echo "[OK] gog installed."
    else
        echo "Install manually: brew install steipete/tap/gogcli"
        exit 1
    fi
fi

echo ""

# Step 2: Check for credentials
echo "--- Checking OAuth credentials ---"
auth_output=$(gog auth list --json 2>/dev/null || echo '{"accounts":[]}')
account_count=$(echo "$auth_output" | /opt/homebrew/bin/jq '.accounts | length' 2>/dev/null || echo "0")

if [ "$account_count" -gt 0 ]; then
    echo "[OK] $account_count account(s) configured:"
    echo "$auth_output" | /opt/homebrew/bin/jq -r '.accounts[].email // .accounts[].account // "unknown"' 2>/dev/null || true
    echo ""
    read -p "Add another account? (y/n) " -r answer
    if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
        echo ""
        echo "--- Verifying tokens ---"
        gog auth list --check --json 2>/dev/null | /opt/homebrew/bin/jq '.' 2>/dev/null || echo "[!] Could not verify tokens."
        echo ""
        echo "Setup complete! You can now use gog commands."
        exit 0
    fi
else
    echo "[!] No accounts configured."
    echo ""
    echo "You need a client_secret.json file from Google Cloud Console."
    echo "See: plugins/built/skill-gogcli/skills/gog/references/setup.md"
    echo ""
    read -p "Path to client_secret.json (or press Enter to skip): " -r cred_path
    if [ -n "$cred_path" ]; then
        if [ -f "$cred_path" ]; then
            gog auth credentials "$cred_path"
            echo "[OK] Credentials stored."
        else
            echo "[!] File not found: $cred_path"
            exit 1
        fi
    else
        echo "Skipping credential setup. Run 'gog auth credentials <path>' when ready."
    fi
fi

# Step 3: Add an account
echo ""
echo "--- Add a Google account ---"
read -p "Email address to authorize: " -r email

if [ -z "$email" ]; then
    echo "No email provided. Skipping."
    exit 0
fi

echo ""
echo "Available services: gmail, calendar, drive, docs, sheets, slides, contacts, tasks, forms, chat, classroom, people, keep, groups, admin, appscript"
echo ""
read -p "Services to authorize (comma-separated, or 'all'): " -r services

if [ -z "$services" ]; then
    services="all"
fi

echo ""
echo "Authorizing $email with services: $services"
echo "A browser window will open for OAuth consent..."
echo ""

gog auth add "$email" --services "$services"

echo ""
echo "[OK] Account added."

# Step 4: Set up alias (optional)
echo ""
read -p "Set an alias for this account? (e.g., 'oh' for Orange Hill, or press Enter to skip): " -r alias_name
if [ -n "$alias_name" ]; then
    gog auth alias set "$alias_name" "$email"
    echo "[OK] Alias '$alias_name' set for $email"
fi

# Step 5: Verify
echo ""
echo "--- Verifying setup ---"
gog auth list --check --json 2>/dev/null | /opt/homebrew/bin/jq '.' 2>/dev/null || echo "[!] Could not verify tokens."

echo ""
echo "Setup complete! Test with:"
echo "  gog gmail search 'newer_than:1d' --max 1 --account $email --json --no-input"
