# Orange Hill Marketplace - Implementation Plan

## Overview

This document outlines the complete implementation plan for creating the **Orange Hill Marketplace**, a Claude Code plugin marketplace derived from the [Compound Engineering Plugin](https://github.com/kieranklaassen/compound-engineering) by Kieran Klaassen.

The primary goal is to create a specialized plugin called **orange-hill-engineering** that adapts the compounding engineering philosophy to our tech stacks while maintaining compatibility across diverse project environments (Laravel, Next.js, Chrome extensions, and more).

---

## Credits & Attribution

### Original Work

This plugin is a derivative work based on:

- **Compound Engineering Plugin** by [Kieran Klaassen](https://github.com/kieranklaassen)
- Original repository: https://github.com/kieranklaassen/compound-engineering
- Philosophy source: [Every.to - My AI Had Already Fixed The Code Before I Saw It](https://every.to/source-code/my-ai-had-already-fixed-the-code-before-i-saw-it)

### Core Philosophy (from original)

> "Each unit of engineering work should make subsequent units of work easier—not harder."

The `/compound` command and `compound-docs` skill are the cornerstone of this philosophy - capturing solved problems as searchable documentation ensures that knowledge compounds over time.

### License Compliance

When publishing, ensure compliance with the original repository's license terms. Include attribution in:
- `README.md` - Credits section
- `plugin.json` - Author/credits metadata
- `CHANGELOG.md` - Initial entry noting derivative work

---

## Target Environment

### Supported Tech Stacks

| Stack | Frameworks | Key Patterns |
|-------|------------|--------------|
| PHP Backend | Laravel 10+, PhotonCMS | Queue jobs, services, repositories, migrations |
| JS/TS Frontend | Next.js 14+, React, TypeScript, Tailwind | App Router, Server Components, API routes |
| Browser Extensions | Chrome Manifest V3, Vanilla JS | Service workers, content scripts, fetch interception |

### Example Projects (Skupio)

| Project | Path | Stack |
|---------|------|-------|
| Chrome Extension | `/Users/tihomir/AI/linkedin-scraper-chrome-plugin` | Manifest V3 |
| Frontend | `/Users/tihomir/Sites/skupio` | Next.js 15 |
| Backend | `/Users/tihomir/Sites/skupio-api` | Laravel 10 + PhotonCMS |

### Development Workflow Integration

Each project should have a CLAUDE.md that references the plugin knowledge base, enabling:
- Cross-project learning capture
- Consistent review standards
- Unified documentation patterns

---

## Repository Structure

```
orange-hill-marketplace/
├── .claude-plugin/
│   └── marketplace.json              # Marketplace catalog
├── .claude/
│   └── specs/                        # Implementation specs (this folder)
│       ├── IMPLEMENTATION-PLAN.md    # This document
│       ├── AGENT-TEMPLATE.md         # Template for creating agents
│       ├── COMMAND-TEMPLATE.md       # Template for creating commands
│       └── TESTING-PROTOCOL.md       # Testing procedures
├── plugins/
│   └── orange-hill-engineering/      # Main plugin
│       ├── .claude-plugin/
│       │   └── plugin.json           # Plugin metadata
│       ├── agents/
│       │   ├── review/               # Code review agents
│       │   ├── data/                 # Data & migration agents
│       │   ├── research/             # Research agents
│       │   └── workflow/             # Workflow automation agents
│       ├── commands/
│       │   ├── workflows/            # Core workflow commands
│       │   └── utilities/            # Utility commands
│       ├── skills/
│       ├── hooks/
│       │   └── pre_tool_use.py       # Security hook (rm protection)
│       ├── mcp-servers/
│       ├── README.md
│       └── CHANGELOG.md
├── docs/                             # Documentation site (optional)
├── LICENSE
└── README.md
```

---

## Phase 1: Repository Setup

### 1.1 Initialize Repository

```bash
cd /Users/tihomir/AgenticAI/Repositores/orange-hill-marketplace

# Initialize git
git init

# Create base structure
mkdir -p .claude-plugin
mkdir -p plugins/orange-hill-engineering/.claude-plugin
mkdir -p plugins/orange-hill-engineering/agents/{review,data,research,workflow}
mkdir -p plugins/orange-hill-engineering/commands/{workflows,utilities}
mkdir -p plugins/orange-hill-engineering/skills
mkdir -p plugins/orange-hill-engineering/hooks
mkdir -p plugins/orange-hill-engineering/mcp-servers
```

### 1.2 Create Marketplace Configuration

**File: `.claude-plugin/marketplace.json`**

```json
{
  "name": "orange-hill-marketplace",
  "owner": {
    "name": "Orange Hill",
    "url": "https://github.com/orange-hill"
  },
  "metadata": {
    "description": "Claude Code plugin marketplace by Orange Hill",
    "version": "1.0.0"
  },
  "plugins": [
    {
      "name": "orange-hill-engineering",
      "description": "AI-powered development tools for Orange Hill projects. Specialized agents for Laravel, Next.js, and Chrome extensions, plus workflow automation commands and compound engineering.",
      "version": "1.0.0",
      "author": {
        "name": "Orange Hill",
        "url": "https://github.com/orange-hill"
      },
      "homepage": "https://github.com/orange-hill/orange-hill-marketplace",
      "tags": [
        "compound-engineering",
        "laravel",
        "nextjs",
        "typescript",
        "chrome-extension",
        "workflow-automation"
      ],
      "source": "./plugins/orange-hill-engineering"
    }
  ]
}
```

### 1.3 Create Plugin Configuration

**File: `plugins/orange-hill-engineering/.claude-plugin/plugin.json`**

```json
{
  "name": "orange-hill-engineering",
  "version": "1.0.0",
  "description": "AI-powered development tools for Laravel, Next.js, and Chrome extensions. Derived from Compound Engineering by Kieran Klaassen.",
  "author": {
    "name": "Orange Hill",
    "url": "https://github.com/orange-hill"
  },
  "credits": {
    "original": "Compound Engineering Plugin by Kieran Klaassen",
    "repository": "https://github.com/kieranklaassen/compound-engineering"
  },
  "keywords": [
    "compound-engineering",
    "laravel",
    "photoncms",
    "nextjs",
    "typescript",
    "chrome-extension",
    "workflow-automation"
  ],
  "mcpServers": {
    "context7": {
      "type": "http",
      "url": "https://mcp.context7.com/mcp"
    }
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 hooks/pre_tool_use.py"
          }
        ]
      }
    ]
  }
}
```

---

## Phase 2: Port Assets from Compound Engineering

### 2.1 Assets to Port (Keep As-Is)

These assets are stack-agnostic and should be copied directly from the original:

**Reference Path:** `/Users/tihomir/Downloads/compound-engineering-plugin-main/plugins/compound-engineering/`

#### Agents to Port

| Agent | Category | Purpose |
|-------|----------|---------|
| `security-sentinel.md` | review | OWASP Top 10, security audits |
| `performance-oracle.md` | review | Algorithm, DB, memory optimization |
| `pattern-recognition-specialist.md` | review | Code smells, anti-patterns |
| `architecture-strategist.md` | review | SOLID, component boundaries |
| `code-simplicity-reviewer.md` | review | YAGNI, complexity reduction |
| `data-integrity-guardian.md` | data | Migrations, transactions |
| `data-migration-expert.md` | data | Migration validation |
| `deployment-verification-agent.md` | data | Go/No-Go checklists |
| `best-practices-researcher.md` | research | External documentation |
| `framework-docs-researcher.md` | research | Context7 MCP integration |
| `git-history-analyzer.md` | research | Code archaeology |
| `pr-comment-resolver.md` | workflow | PR feedback resolution |

#### Commands to Port

| Command | Category | Purpose |
|---------|----------|---------|
| `workflows-plan.md` | workflows | Feature → implementation plan |
| `workflows-review.md` | workflows | Multi-agent code review |
| `workflows-work.md` | workflows | Execute plans with commits |
| `workflows-compound.md` | workflows | **CRITICAL** - Document solved problems |
| `deepen-plan.md` | workflows | Parallel research enrichment |
| `plan_review.md` | utilities | Multi-agent plan review |
| `triage.md` | utilities | Issue prioritization |
| `changelog.md` | utilities | Generate changelogs |
| `resolve_pr_parallel.md` | utilities | Fix PR comments in parallel |
| `resolve_todo_parallel.md` | utilities | Resolve todos in parallel |
| `test-browser.md` | utilities | Browser tests |

#### Skills to Port

| Skill | Purpose |
|-------|---------|
| `compound-docs/` | **CRITICAL** - Capture solved problems |
| `file-todos/` | Structured todo tracking |
| `git-worktree/` | Parallel development |
| `rclone/` | Cloud storage uploads |
| `frontend-design/` | Frontend interface patterns |
| `agent-browser/` | Browser automation |
| `brainstorming/` | Requirements exploration |

### 2.2 Assets to Skip (Stack-Specific)

These are Ruby/Python specific and will be used as **templates** for new assets:

| Asset | Type | Use As Template For |
|-------|------|---------------------|
| `kieran-rails-reviewer.md` | agent | `laravel-reviewer.md` |
| `dhh-rails-reviewer.md` | agent | `laravel-conventions-reviewer.md` |
| `kieran-python-reviewer.md` | agent | (reference for strict conventions) |
| `kieran-typescript-reviewer.md` | agent | Port directly, it's relevant |
| `julik-frontend-races-reviewer.md` | agent | `nextjs-async-reviewer.md` |
| `lint.md` | agent | `laravel-lint.md`, `nextjs-lint.md` |
| `every-style-editor.md` | agent | Skip (company-specific) |
| `ankane-readme-writer.md` | agent | Skip (Ruby-specific) |
| `learnings-researcher.md` | agent | Port & adapt for our docs structure |
| `dhh-rails-style/` | skill | `laravel-conventions/` |
| `andrew-kane-gem-writer/` | skill | Skip |
| `dspy-ruby/` | skill | Skip |

### 2.3 Port Procedure

For each asset to port:

```bash
# Example: Port security-sentinel agent
SOURCE="/Users/tihomir/Downloads/compound-engineering-plugin-main/plugins/compound-engineering"
DEST="/Users/tihomir/AgenticAI/Repositores/orange-hill-marketplace/plugins/orange-hill-engineering"

# Copy agent
cp "$SOURCE/agents/security-sentinel.md" "$DEST/agents/review/"

# Review and update any Ruby/Rails specific references
# Add header comment crediting original
```

**Header to Add to Ported Files:**

```markdown
---
# Original: Compound Engineering Plugin by Kieran Klaassen
# Source: https://github.com/kieranklaassen/compound-engineering
# Adapted for: Orange Hill Engineering Plugin
---
```

---

## Phase 3: Create New Stack-Specific Assets

### 3.1 New Agents to Create

#### Laravel Agents

| Agent | Template From | Key Adaptations |
|-------|---------------|-----------------|
| `laravel-reviewer.md` | `kieran-rails-reviewer.md` | Laravel conventions, service pattern, repository pattern |
| `laravel-conventions-reviewer.md` | `dhh-rails-reviewer.md` | Laravel idioms, Eloquent patterns, facade usage |
| `photoncms-navigator.md` | (new) | Dynamic schema understanding, module extensions |
| `queue-job-reviewer.md` | (new) | Horizon jobs, retry logic, dead letters |

#### Next.js Agents

| Agent | Template From | Key Adaptations |
|-------|---------------|-----------------|
| `nextjs-reviewer.md` | `kieran-typescript-reviewer.md` | App Router, Server Components, API routes |
| `nextjs-async-reviewer.md` | `julik-frontend-races-reviewer.md` | React 19 patterns, Suspense, streaming |
| `tailwind-reviewer.md` | (new) | Tailwind 4, utility patterns |

#### Chrome Extension Agents

| Agent | Template From | Key Adaptations |
|-------|---------------|-----------------|
| `chrome-extension-reviewer.md` | (new) | Manifest V3, service workers, content scripts |
| `fetch-interceptor-reviewer.md` | (new) | API interception patterns, rate limiting |

### 3.2 New Commands to Create

| Command | Purpose | Implementation Notes |
|---------|---------|----------------------|
| `/test-laravel` | Run Laravel test suites | `php artisan test --filter` |
| `/test-nextjs` | Run Next.js tests | `npm test` or `vitest` |
| `/queue-status` | Check Horizon status | `php artisan horizon:status` |
| `/migrate-check` | Validate migrations | Dry-run migrations, check rollback |
| `/api-health` | Check external APIs | Apollo, Hunter, etc. status |
| `/extension-build` | Build Chrome extension | Lint + format + package |

### 3.3 New Skills to Create

| Skill | Purpose |
|-------|---------|
| `laravel-horizon/` | Queue monitoring patterns, job debugging |
| `photoncms-schema/` | Dynamic schema navigation, module patterns |
| `chrome-extension-debug/` | Service worker debugging, content script patterns |
| `nextjs-patterns/` | App Router best practices, Server Component patterns |

---

## Phase 4: Asset Generation Protocol

### 4.1 Agent Template

**File: `.claude/specs/AGENT-TEMPLATE.md`**

```markdown
---
name: {agent-name}
description: {brief description}
model: sonnet  # or opus for complex analysis
color: {cyan|green|yellow|magenta}
# Original: {if derived, credit source}
---

# {Agent Display Name}

## Role

{Clear statement of the agent's purpose and expertise}

## Review Checklist

{Numbered list of specific things to check}

1. **Category**: Specific check
2. **Category**: Specific check
...

## Output Format

{How the agent should structure its response}

### Issues Found

For each issue:
- **Severity**: Critical | Warning | Suggestion
- **Location**: file:line
- **Issue**: Description
- **Fix**: Recommended solution

### Summary

{How to summarize findings}

## Context

{Any framework-specific context, conventions, or references}

## Examples

{Good and bad code examples}
```

### 4.2 Agent Generation Procedure

For each new agent:

1. **Research Phase**
   ```
   Use framework-docs-researcher to gather:
   - Official documentation conventions
   - Community best practices
   - Common anti-patterns
   ```

2. **Template Phase**
   ```
   If adapting from existing agent:
   - Copy template structure
   - Replace framework-specific references
   - Update checklist items for target framework
   ```

3. **Validation Phase**
   ```
   Test agent against:
   - Known good code (should pass)
   - Known bad code (should catch issues)
   - Edge cases specific to framework
   ```

4. **Documentation Phase**
   ```
   - Add examples from real Skupio codebase
   - Document any Skupio-specific conventions
   ```

### 4.3 Command Template

**File: `.claude/specs/COMMAND-TEMPLATE.md`**

```markdown
---
name: {command-name}
description: {brief description}
# Original: {if derived, credit source}
---

# /{command-name}

## Purpose

{What this command accomplishes}

## Usage

```
/{command-name} [arguments]
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| arg1 | Yes/No | Description |

## Workflow

1. Step one
2. Step two
...

## Output

{What the command produces}

## Examples

```
/{command-name} example-usage
```

## Dependencies

{Other commands, agents, or tools required}
```

---

## Phase 5: Testing Protocol

### 5.1 Agent Testing

**File: `.claude/specs/TESTING-PROTOCOL.md`**

#### Effectiveness Tests

For each agent, create test cases:

```
tests/
└── agents/
    └── {agent-name}/
        ├── good-code/          # Should pass review
        │   ├── example1.{ext}
        │   └── example2.{ext}
        ├── bad-code/           # Should catch issues
        │   ├── issue1.{ext}
        │   └── issue2.{ext}
        └── expected-output/    # Expected findings
            ├── issue1.md
            └── issue2.md
```

#### Test Procedure

1. **Positive Test**: Run agent on good-code, verify no false positives
2. **Negative Test**: Run agent on bad-code, verify all issues caught
3. **Output Test**: Compare agent output to expected findings
4. **Performance Test**: Ensure agent completes in reasonable time

#### Compliance Checks

Each agent must:
- [ ] Follow template structure
- [ ] Include attribution if derived
- [ ] Have working examples
- [ ] Not reference wrong framework (e.g., no Rails in Laravel agent)
- [ ] Use correct model specification
- [ ] Have appropriate color coding

### 5.2 Command Testing

For each command:

1. **Dry Run**: Execute with `--dry-run` flag if available
2. **Integration Test**: Run on test branch of Skupio project
3. **Output Validation**: Verify expected artifacts created
4. **Error Handling**: Test with invalid inputs

### 5.3 Skill Testing

For each skill:

1. **Invocation Test**: `claude skill {skill-name}` works
2. **Functionality Test**: Skill performs documented actions
3. **Integration Test**: Skill works with related commands/agents

---

## Phase 6: Security Hook Implementation

### 6.1 Simplified Hook

**File: `plugins/orange-hill-engineering/hooks/pre_tool_use.py`**

```python
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
```

### 6.2 Hook Registration

The hook is registered in `plugin.json` under the `hooks` key (see Phase 1.3).

---

## Phase 7: Integration with Skupio Projects

### 7.1 Per-Project CLAUDE.md Updates

Each Skupio project should have a CLAUDE.md that references the plugin:

**Template for project CLAUDE.md:**

```markdown
# {Project Name}

## Stack

{Brief stack description}

## Plugin Integration

This project uses the orange-hill-engineering plugin from orange-hill-marketplace.

### Knowledge Base

Solved problems are documented in `docs/solutions/` following the compound-docs pattern.

### Available Agents

- `/agent laravel-reviewer` - Laravel code review
- `/agent security-sentinel` - Security audit
- (etc.)

### Workflow

1. `/workflows:plan` - Create implementation plan
2. `/workflows:review` - Review before merge
3. `/workflows:compound` - Document learnings

## Project-Specific Instructions

{Project-specific conventions and patterns}
```

### 7.2 Shared Knowledge Base

Create a shared solutions directory structure in each project:

```
docs/
└── solutions/
    ├── api-integration/
    ├── authentication/
    ├── data-migration/
    ├── performance/
    ├── security/
    └── testing/
```

### 7.3 Cross-Project Learning

When a solution applies to multiple projects:

1. Document in the originating project's `docs/solutions/`
2. Add frontmatter tags: `projects: [chrome-extension, frontend, backend]`
3. The `learnings-researcher` agent will find cross-project solutions

---

## Phase 8: Publishing to GitHub

### 8.1 Repository Setup

```bash
cd /Users/tihomir/AgenticAI/Repositores/orange-hill-marketplace

# Create GitHub repository (assuming gh CLI configured)
gh repo create orange-hill/orange-hill-marketplace --public --description "Claude Code plugin marketplace by Orange Hill"

# Add remote
git remote add origin git@github.com:orange-hill/orange-hill-marketplace.git
```

### 8.2 Required Files

Before publishing:

1. **LICENSE** - Choose appropriate license (consider original's license)
2. **README.md** - Comprehensive documentation with credits
3. **.gitignore** - Exclude logs, temp files, .env
4. **CHANGELOG.md** - Version history

### 8.3 README.md Template

```markdown
# Orange Hill Marketplace

A Claude Code plugin marketplace featuring the **orange-hill-engineering** plugin.

## Credits

This marketplace includes plugins derived from:
- [Compound Engineering Plugin](https://github.com/kieranklaassen/compound-engineering) by Kieran Klaassen

## Installation

```bash
# Add marketplace
claude /plugin marketplace add https://github.com/orange-hill/orange-hill-marketplace

# Install plugin
claude /plugin install orange-hill-engineering
```

## Available Plugins

### orange-hill-engineering

AI-powered development tools for:
- Laravel / PhotonCMS backends
- Next.js / TypeScript frontends
- Chrome extensions (Manifest V3)

**Features:**
- X agents for code review, security, and research
- Y commands for workflow automation
- Z skills for development patterns
- Compound engineering philosophy - knowledge that grows

## Philosophy

> "Each unit of engineering work should make subsequent units of work easier—not harder."

The `/workflows:compound` command captures solved problems as searchable documentation, ensuring your team's knowledge compounds over time.

## License

{License text}
```

### 8.4 Publishing Checklist

- [ ] All ported files have attribution headers
- [ ] `plugin.json` has credits field
- [ ] README.md credits original work
- [ ] CHANGELOG.md documents derivative origin
- [ ] LICENSE file is appropriate
- [ ] All tests pass
- [ ] No sensitive data (API keys, etc.)
- [ ] .gitignore is comprehensive

### 8.5 Release Process

```bash
# Tag release
git tag -a v1.0.0 -m "Initial release of orange-hill-engineering plugin"
git push origin main --tags

# Create GitHub release
gh release create v1.0.0 --title "v1.0.0 - Initial Release" --notes "Initial release of the orange-hill-engineering plugin, derived from Compound Engineering."
```

---

## Phase 9: Maintenance & Evolution

### 9.1 Updating from Upstream

When compound-engineering releases updates:

1. Review changelog for relevant changes
2. Port applicable updates (skip Ruby/Python specific)
3. Update attribution headers with new version
4. Test affected assets
5. Document in CHANGELOG.md

### 9.2 Adding New Assets

Follow the generation protocol in Phase 4:

1. Use appropriate template
2. Test thoroughly
3. Add to plugin.json components count
4. Update README.md
5. Document in CHANGELOG.md

### 9.3 Version Numbering

- **Major** (X.0.0): Breaking changes to commands/agents
- **Minor** (0.X.0): New agents, commands, or skills
- **Patch** (0.0.X): Bug fixes, documentation updates

---

## Appendix A: File Reference Map

| Source File | Destination | Action |
|-------------|-------------|--------|
| `compound-engineering/agents/security-sentinel.md` | `orange-hill-engineering/agents/review/` | Port |
| `compound-engineering/agents/kieran-rails-reviewer.md` | N/A | Template for `laravel-reviewer.md` |
| `compound-engineering/commands/workflows-compound.md` | `orange-hill-engineering/commands/workflows/` | Port |
| `compound-engineering/skills/compound-docs/` | `orange-hill-engineering/skills/` | Port |
| `claude-code-boilerplate/.claude/hooks/pre_tool_use.py` | `orange-hill-engineering/hooks/` | Simplify & Port |

See the full mapping in the implementation tasks below.

---

## Appendix B: Implementation Tasks

### Task List

1. [ ] Initialize repository structure
2. [ ] Create marketplace.json
3. [ ] Create plugin.json
4. [ ] Port stack-agnostic agents (12 agents)
5. [ ] Port stack-agnostic commands (11 commands)
6. [ ] Port stack-agnostic skills (7 skills)
7. [ ] Create Laravel agents (4 new)
8. [ ] Create Next.js agents (3 new)
9. [ ] Create Chrome extension agents (2 new)
10. [ ] Create new commands (6 new)
11. [ ] Create new skills (4 new)
12. [ ] Implement security hook
13. [ ] Create test cases for all agents
14. [ ] Run compliance checks
15. [ ] **Run referential integrity checks on ALL .md files**
16. [ ] **Verify no references to skipped assets (Rails, Python agents)**
17. [ ] Write README.md with credits
18. [ ] Write CHANGELOG.md
19. [ ] Add LICENSE file
18. [ ] Create .gitignore
19. [ ] Initialize git and push to GitHub
20. [ ] Create GitHub release
21. [ ] Update project CLAUDE.md files
22. [ ] Test plugin installation across all projects

---

## Appendix C: Quick Reference

### Install Plugin (after publishing)

```bash
claude /plugin marketplace add https://github.com/orange-hill/orange-hill-marketplace
claude /plugin install orange-hill-engineering
```

### Key Commands

```bash
/workflows:plan "feature description"    # Create implementation plan
/workflows:review                        # Multi-agent code review
/workflows:work                          # Execute plan
/workflows:compound                      # Document what you learned
```

### Agent Invocation

```bash
claude agent laravel-reviewer "review this controller"
claude agent security-sentinel "audit authentication"
claude agent nextjs-reviewer "check this component"
```

### Original Reference

For questions about the compound engineering philosophy or to see the original implementation:

- Repository: https://github.com/kieranklaassen/compound-engineering
- Article: https://every.to/source-code/my-ai-had-already-fixed-the-code-before-i-saw-it
