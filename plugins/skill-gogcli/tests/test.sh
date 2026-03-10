#!/bin/bash
# test.sh -- Validation tests for skill-gogcli plugin
# Usage: bash tests/test.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
JQ_BIN="${JQ_BIN:-/opt/homebrew/bin/jq}"

pass=0
fail=0
skip=0

assert_ok() {
    local desc="$1"
    shift
    if "$@" >/dev/null 2>&1; then
        echo "  [PASS] $desc"
        pass=$((pass + 1))
    else
        echo "  [FAIL] $desc"
        fail=$((fail + 1))
    fi
}

assert_fail() {
    local desc="$1"
    shift
    if ! "$@" >/dev/null 2>&1; then
        echo "  [PASS] $desc"
        pass=$((pass + 1))
    else
        echo "  [FAIL] $desc (expected failure)"
        fail=$((fail + 1))
    fi
}

assert_contains() {
    local desc="$1"
    local file="$2"
    local pattern="$3"
    if grep -q "$pattern" "$file" 2>/dev/null; then
        echo "  [PASS] $desc"
        pass=$((pass + 1))
    else
        echo "  [FAIL] $desc (pattern not found: $pattern)"
        fail=$((fail + 1))
    fi
}

skip_test() {
    local desc="$1"
    echo "  [SKIP] $desc"
    skip=$((skip + 1))
}

# ============================================================
echo "=== Structure Validation ==="
# ============================================================

assert_ok "plugin.json exists" test -f "$PLUGIN_DIR/.claude-plugin/plugin.json"
assert_ok "SKILL.md exists" test -f "$PLUGIN_DIR/skills/gog/SKILL.md"
assert_ok "commands.md exists" test -f "$PLUGIN_DIR/skills/gog/references/commands.md"
assert_ok "setup.md exists" test -f "$PLUGIN_DIR/skills/gog/references/setup.md"
assert_ok "setup.sh exists" test -f "$PLUGIN_DIR/scripts/setup.sh"
assert_ok "verify.sh exists" test -f "$PLUGIN_DIR/scripts/verify.sh"
assert_ok "test.sh exists" test -f "$PLUGIN_DIR/tests/test.sh"
assert_ok "README.md exists" test -f "$PLUGIN_DIR/README.md"
assert_ok "LICENSE exists" test -f "$PLUGIN_DIR/LICENSE"

# ============================================================
echo ""
echo "=== plugin.json Validation ==="
# ============================================================

assert_ok "plugin.json is valid JSON" "$JQ_BIN" '.' "$PLUGIN_DIR/.claude-plugin/plugin.json"

# Check required fields
name=$("$JQ_BIN" -r '.name' "$PLUGIN_DIR/.claude-plugin/plugin.json")
assert_ok "plugin name is skill-gogcli" test "$name" = "skill-gogcli"

version=$("$JQ_BIN" -r '.version' "$PLUGIN_DIR/.claude-plugin/plugin.json")
assert_ok "plugin has version" test -n "$version"

desc=$("$JQ_BIN" -r '.description' "$PLUGIN_DIR/.claude-plugin/plugin.json")
assert_ok "plugin has description" test -n "$desc"

keyword_count=$("$JQ_BIN" '.keywords | length' "$PLUGIN_DIR/.claude-plugin/plugin.json")
assert_ok "plugin has keywords" test "$keyword_count" -gt 0

# Check key keywords are present
for kw in skill google gmail calendar drive sheets docs; do
    has_kw=$("$JQ_BIN" --arg kw "$kw" '.keywords | index($kw) != null' "$PLUGIN_DIR/.claude-plugin/plugin.json")
    assert_ok "keyword '$kw' present" test "$has_kw" = "true"
done

# ============================================================
echo ""
echo "=== SKILL.md Validation ==="
# ============================================================

# Check frontmatter exists
assert_contains "SKILL.md has frontmatter start" "$PLUGIN_DIR/skills/gog/SKILL.md" "^---"
assert_contains "SKILL.md has name field" "$PLUGIN_DIR/skills/gog/SKILL.md" "^name:"
assert_contains "SKILL.md has description field" "$PLUGIN_DIR/skills/gog/SKILL.md" "^description:"
assert_contains "SKILL.md has allowed-tools" "$PLUGIN_DIR/skills/gog/SKILL.md" "^allowed-tools:"

# Check key content sections
assert_contains "has prerequisite check section" "$PLUGIN_DIR/skills/gog/SKILL.md" "Prerequisite Check"
assert_contains "has global conventions section" "$PLUGIN_DIR/skills/gog/SKILL.md" "Global Conventions"
assert_contains "has safety rules section" "$PLUGIN_DIR/skills/gog/SKILL.md" "Safety Rules"
assert_contains "has multi-account section" "$PLUGIN_DIR/skills/gog/SKILL.md" "Multi-Account"
assert_contains "has error handling section" "$PLUGIN_DIR/skills/gog/SKILL.md" "Error Handling"

# Check key flags are mentioned
assert_contains "mentions --json flag" "$PLUGIN_DIR/skills/gog/SKILL.md" "\-\-json"
assert_contains "mentions --no-input flag" "$PLUGIN_DIR/skills/gog/SKILL.md" "\-\-no-input"
assert_contains "mentions --force flag" "$PLUGIN_DIR/skills/gog/SKILL.md" "\-\-force"

# Check services are covered
for service in Gmail Calendar Drive Docs Sheets Contacts Tasks; do
    assert_contains "covers $service" "$PLUGIN_DIR/skills/gog/SKILL.md" "$service"
done

# Check safety warnings
assert_contains "send requires confirmation" "$PLUGIN_DIR/skills/gog/SKILL.md" "REQUIRES USER CONFIRMATION"

# ============================================================
echo ""
echo "=== Command Reference Validation ==="
# ============================================================

for service in Gmail Calendar Drive Docs Sheets Slides Contacts Tasks People Forms Chat Keep Groups Admin; do
    assert_contains "commands.md covers $service" "$PLUGIN_DIR/skills/gog/references/commands.md" "$service"
done

assert_contains "commands.md has jq patterns" "$PLUGIN_DIR/skills/gog/references/commands.md" "jq Patterns"

# ============================================================
echo ""
echo "=== Setup Guide Validation ==="
# ============================================================

assert_contains "setup.md covers installation" "$PLUGIN_DIR/skills/gog/references/setup.md" "brew install"
assert_contains "setup.md covers OAuth" "$PLUGIN_DIR/skills/gog/references/setup.md" "OAuth"
assert_contains "setup.md covers multi-account" "$PLUGIN_DIR/skills/gog/references/setup.md" "Multi-Account"
assert_contains "setup.md covers troubleshooting" "$PLUGIN_DIR/skills/gog/references/setup.md" "Troubleshooting"
assert_contains "setup.md covers service account" "$PLUGIN_DIR/skills/gog/references/setup.md" "Service Account"

# ============================================================
echo ""
echo "=== Script Syntax Validation ==="
# ============================================================

assert_ok "setup.sh has valid bash syntax" bash -n "$PLUGIN_DIR/scripts/setup.sh"
assert_ok "verify.sh has valid bash syntax" bash -n "$PLUGIN_DIR/scripts/verify.sh"
assert_ok "test.sh has valid bash syntax" bash -n "$PLUGIN_DIR/tests/test.sh"

# ============================================================
echo ""
echo "=== Skill-Only Plugin Validation ==="
# ============================================================

# A skill-only plugin should NOT have .mcp.json
assert_fail "no .mcp.json (skill-only plugin)" test -f "$PLUGIN_DIR/.mcp.json"

# Should have skills directory
assert_ok "skills directory exists" test -d "$PLUGIN_DIR/skills"

# SKILL.md line count should be under 500
line_count=$(wc -l < "$PLUGIN_DIR/skills/gog/SKILL.md")
assert_ok "SKILL.md under 500 lines ($line_count)" test "$line_count" -lt 500

# ============================================================
echo ""
echo "=== Live Tests (optional) ==="
# ============================================================

if command -v gog >/dev/null 2>&1; then
    gog_version=$(gog --version 2>/dev/null || echo "unknown")
    echo "  [INFO] gog found: $gog_version"

    assert_ok "gog --help works" gog --help

    # Check if authenticated
    if gog auth list --json 2>/dev/null | "$JQ_BIN" -e '.accounts | length > 0' >/dev/null 2>&1; then
        echo "  [INFO] Accounts configured, running API tests..."

        # Read-only Gmail test
        if gog gmail search 'newer_than:1d' --max 1 --json --no-input >/dev/null 2>&1; then
            echo "  [PASS] Gmail search works"
            pass=$((pass + 1))
        else
            skip_test "Gmail search (may need re-auth)"
        fi

        # Read-only Calendar test
        today=$(date -u +%Y-%m-%dT00:00:00Z)
        tomorrow=$(date -v+1d -u +%Y-%m-%dT00:00:00Z 2>/dev/null || date -u +%Y-%m-%dT23:59:59Z)
        if gog calendar events primary --from "$today" --to "$tomorrow" --json --no-input >/dev/null 2>&1; then
            echo "  [PASS] Calendar events works"
            pass=$((pass + 1))
        else
            skip_test "Calendar events (may need re-auth)"
        fi

        # Read-only Drive test
        if gog drive ls --max 1 --json --no-input >/dev/null 2>&1; then
            echo "  [PASS] Drive list works"
            pass=$((pass + 1))
        else
            skip_test "Drive list (may need re-auth)"
        fi
    else
        skip_test "API tests (no accounts configured)"
    fi
else
    skip_test "Live tests (gog not installed)"
fi

# ============================================================
echo ""
echo "=== Results ==="
total=$((pass + fail + skip))
echo "  $pass passed, $fail failed, $skip skipped (of $total)"

if [ "$fail" -gt 0 ]; then
    exit 1
fi
