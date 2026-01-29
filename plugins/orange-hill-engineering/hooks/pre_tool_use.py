#!/usr/bin/env python3
"""
Pre-tool-use security hook for orange-hill-engineering plugin.
Blocks dangerous rm commands while allowing all other operations.

Derived from claude-code-boilerplate by Orange Hill.
"""

import json
import re
import sys

# Dangerous rm patterns to block
DANGEROUS_RM_PATTERNS = [
    r'rm\s+-rf\s+/',           # rm -rf /
    r'rm\s+-rf\s+~',           # rm -rf ~
    r'rm\s+-rf\s+\$HOME',      # rm -rf $HOME
    r'rm\s+-rf\s+\.\.',        # rm -rf ..
    r'rm\s+-rf\s+\*',          # rm -rf *
    r'rm\s+-rf\s+\.',          # rm -rf .
    r'rm\s+-r\s+-f\s+/',       # rm -r -f /
    r'rm\s+--recursive.*/',    # rm --recursive /
]

def check_dangerous_command(command: str) -> tuple[bool, str]:
    """Check if command matches dangerous patterns."""
    for pattern in DANGEROUS_RM_PATTERNS:
        if re.search(pattern, command, re.IGNORECASE):
            return True, f"Blocked dangerous rm command matching: {pattern}"
    return False, ""

def main():
    try:
        # Read tool input from stdin
        input_data = json.loads(sys.stdin.read())

        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})

        # Only check Bash commands
        if tool_name != "Bash":
            # Allow all non-Bash tools
            print(json.dumps({"decision": "approve"}))
            return

        command = tool_input.get("command", "")

        # Check for dangerous rm commands
        is_dangerous, reason = check_dangerous_command(command)

        if is_dangerous:
            print(json.dumps({
                "decision": "block",
                "reason": reason
            }))
        else:
            print(json.dumps({"decision": "approve"}))

    except Exception as e:
        # On error, allow the command but log
        print(json.dumps({
            "decision": "approve",
            "warning": f"Hook error: {str(e)}"
        }), file=sys.stderr)

if __name__ == "__main__":
    main()
