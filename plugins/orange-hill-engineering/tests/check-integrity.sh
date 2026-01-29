#!/bin/bash

# Referential Integrity Check Script for orange-hill-engineering plugin
# Run this after all work is completed to verify all references are valid.

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# Get script directory and plugin directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"

echo "Checking referential integrity for orange-hill-engineering..."
echo "Plugin directory: $PLUGIN_DIR"
echo "=================================="

# 1. Check all markdown links resolve
echo -e "\n${YELLOW}[1/6] Checking markdown links...${NC}"
for file in $(find "$PLUGIN_DIR" -name "*.md" -type f); do
    # Extract markdown links [text](path)
    links=$(grep -oE '\[([^]]+)\]\(([^)]+)\)' "$file" 2>/dev/null | grep -oE '\]\([^)]+\)' | sed 's/](\(.*\))/\1/')

    for link in $links; do
        # Skip external URLs
        if [[ "$link" =~ ^https?:// ]]; then
            continue
        fi

        # Skip anchors
        if [[ "$link" =~ ^# ]]; then
            continue
        fi

        # Skip template placeholders
        if [[ "$link" == "URL" ]] || [[ "$link" =~ ^\$[A-Z_]+$ ]] || [[ "$link" =~ \.\./category/ ]]; then
            continue
        fi

        # Resolve relative path
        dir=$(dirname "$file")
        target="$dir/$link"

        if [[ ! -e "$target" ]]; then
            echo -e "${RED}BROKEN LINK${NC}: $(basename $file) -> $link"
            ((ERRORS++))
        fi
    done
done

# 2. Check for references to skipped agents (Rails/Python specific)
# Excludes attribution comments (lines starting with #)
echo -e "\n${YELLOW}[2/6] Checking for references to skipped agents...${NC}"
SKIPPED_AGENTS="kieran-rails-reviewer|dhh-rails-reviewer|kieran-python-reviewer|julik-frontend-races-reviewer|ankane-readme-writer|cora-test-reviewer|every-style-editor\.md"
for file in $(find "$PLUGIN_DIR" -name "*.md" -type f); do
    # Skip attribution comments and source comments when checking
    matches=$(grep -iE "$SKIPPED_AGENTS" "$file" 2>/dev/null | grep -v "^#" | grep -v "# Original:" | grep -v "# Adapted from:" | grep -v "# Source:")
    if [[ -n "$matches" ]]; then
        echo -e "${RED}SKIPPED AGENT REF${NC}: $(basename $file) references skipped agent"
        echo "  $matches"
        ((ERRORS++))
    fi
done

# 3. Check for Rails/Ruby references that shouldn't be there
echo -e "\n${YELLOW}[3/6] Checking for Rails/Ruby references in non-Ruby files...${NC}"
for file in $(find "$PLUGIN_DIR/agents" -name "*.md" -type f); do
    # Skip files that are supposed to have Ruby references
    if [[ "$(basename $file)" == *"ruby"* ]] || [[ "$(basename $file)" == *"rails"* ]]; then
        continue
    fi

    matches=$(grep -E "Rails|ActiveRecord|\.rb\b|Gemfile|bundle\b" "$file" 2>/dev/null | grep -v "Original:" | grep -v "Source:" | grep -v "Adapted from:")
    if [[ -n "$matches" ]]; then
        echo -e "${YELLOW}RUBY REFERENCE${NC}: $(basename $file) has Ruby/Rails references"
        echo "  $(echo "$matches" | head -2)"
        ((WARNINGS++))
    fi
done

# 4. Check for Python references that shouldn't be there
echo -e "\n${YELLOW}[4/6] Checking for Python references in non-Python files...${NC}"
for file in $(find "$PLUGIN_DIR/agents" -name "*.md" -type f); do
    if [[ "$(basename $file)" == *"python"* ]]; then
        continue
    fi

    matches=$(grep -E "Python|\.py\b|pip install|pytest|pylint" "$file" 2>/dev/null | grep -v "hooks/pre_tool_use.py" | grep -v "python3")
    if [[ -n "$matches" ]]; then
        echo -e "${YELLOW}PYTHON REFERENCE${NC}: $(basename $file) has Python references"
        echo "  $(echo "$matches" | head -2)"
        ((WARNINGS++))
    fi
done

# 5. Check skill references are properly linked
echo -e "\n${YELLOW}[5/6] Checking for unlinked reference files in skills...${NC}"
for skill_dir in $(find "$PLUGIN_DIR/skills" -mindepth 1 -maxdepth 1 -type d 2>/dev/null); do
    skill_file="$skill_dir/SKILL.md"
    if [[ -f "$skill_file" ]]; then
        # Check references/ directory
        if [[ -d "$skill_dir/references" ]]; then
            for ref_file in $(find "$skill_dir/references" -type f 2>/dev/null); do
                basename_ref=$(basename "$ref_file")
                if ! grep -q "\[.*\](.*references/$basename_ref)" "$skill_file" 2>/dev/null; then
                    echo -e "${RED}UNLINKED FILE${NC}: $ref_file not linked in SKILL.md"
                    ((ERRORS++))
                fi
            done
        fi
    fi
done

# 6. Check for backtick references that should be markdown links
echo -e "\n${YELLOW}[6/6] Checking for backtick refs that should be links...${NC}"
for file in $(find "$PLUGIN_DIR/skills" -name "SKILL.md" -type f 2>/dev/null); do
    bad_refs=$(grep -E '`(references|assets|scripts)/[^`]+`' "$file" 2>/dev/null)
    if [[ -n "$bad_refs" ]]; then
        echo -e "${RED}BAD REFERENCE FORMAT${NC}: $(basename $(dirname $file))/SKILL.md has backtick refs"
        echo "  $bad_refs"
        ((ERRORS++))
    fi
done

# Summary
echo ""
echo "=================================="
if [[ $ERRORS -eq 0 && $WARNINGS -eq 0 ]]; then
    echo -e "${GREEN}All integrity checks passed!${NC}"
else
    echo -e "Results: ${RED}$ERRORS errors${NC}, ${YELLOW}$WARNINGS warnings${NC}"
fi

exit $ERRORS
