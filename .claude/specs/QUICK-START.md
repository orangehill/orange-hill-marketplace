# Quick Start Guide

This guide provides step-by-step instructions to implement the Orange Hill Marketplace.

---

## Prerequisites

- Claude Code CLI installed
- Git configured
- Access to all three Orange Hill repositories
- GitHub account with repository creation permissions

---

## Step 1: Initialize Repository (15 min)

```bash
cd /Users/tihomir/AgenticAI/Repositores/orange-hill-marketplace

# Initialize git if not done
git init

# Create full directory structure
mkdir -p .claude-plugin
mkdir -p plugins/orange-hill-engineering/.claude-plugin
mkdir -p plugins/orange-hill-engineering/agents/{review,data,research,workflow}
mkdir -p plugins/orange-hill-engineering/commands/{workflows,utilities}
mkdir -p plugins/orange-hill-engineering/skills
mkdir -p plugins/orange-hill-engineering/hooks
mkdir -p plugins/orange-hill-engineering/mcp-servers
mkdir -p plugins/orange-hill-engineering/tests/{agents,commands,skills}

# Create placeholder files
touch plugins/orange-hill-engineering/README.md
touch plugins/orange-hill-engineering/CHANGELOG.md
touch README.md
touch LICENSE
touch .gitignore
```

---

## Step 2: Create Configuration Files (10 min)

### Marketplace Config

Create `.claude-plugin/marketplace.json` with the content from IMPLEMENTATION-PLAN.md Phase 1.2

### Plugin Config

Create `plugins/orange-hill-engineering/.claude-plugin/plugin.json` with content from Phase 1.3

### Security Hook

Create `plugins/orange-hill-engineering/hooks/pre_tool_use.py` with content from Phase 6.1

---

## Step 3: Port Assets from Compound Engineering (1-2 hours)

### Source Location

```
/Users/tihomir/Downloads/compound-engineering-plugin-main/plugins/compound-engineering/
```

### Port Order (by priority)

#### A. Critical - Compound Docs System

```bash
SOURCE="/Users/tihomir/Downloads/compound-engineering-plugin-main/plugins/compound-engineering"
DEST="/Users/tihomir/AgenticAI/Repositores/orange-hill-marketplace/plugins/orange-hill-engineering"

# Port compound-docs skill first (core philosophy)
cp -r "$SOURCE/skills/compound-docs" "$DEST/skills/"

# Port the compound command
cp "$SOURCE/commands/workflows-compound.md" "$DEST/commands/workflows/"
```

#### B. Core Workflow Commands

```bash
# Port all workflow commands
cp "$SOURCE/commands/workflows-plan.md" "$DEST/commands/workflows/"
cp "$SOURCE/commands/workflows-review.md" "$DEST/commands/workflows/"
cp "$SOURCE/commands/workflows-work.md" "$DEST/commands/workflows/"
cp "$SOURCE/commands/deepen-plan.md" "$DEST/commands/workflows/"
```

#### C. Stack-Agnostic Agents

```bash
# Review agents
cp "$SOURCE/agents/security-sentinel.md" "$DEST/agents/review/"
cp "$SOURCE/agents/performance-oracle.md" "$DEST/agents/review/"
cp "$SOURCE/agents/pattern-recognition-specialist.md" "$DEST/agents/review/"
cp "$SOURCE/agents/architecture-strategist.md" "$DEST/agents/review/"
cp "$SOURCE/agents/code-simplicity-reviewer.md" "$DEST/agents/review/"
cp "$SOURCE/agents/kieran-typescript-reviewer.md" "$DEST/agents/review/"

# Data agents
cp "$SOURCE/agents/data-integrity-guardian.md" "$DEST/agents/data/"
cp "$SOURCE/agents/data-migration-expert.md" "$DEST/agents/data/"
cp "$SOURCE/agents/deployment-verification-agent.md" "$DEST/agents/data/"

# Research agents
cp "$SOURCE/agents/best-practices-researcher.md" "$DEST/agents/research/"
cp "$SOURCE/agents/framework-docs-researcher.md" "$DEST/agents/research/"
cp "$SOURCE/agents/git-history-analyzer.md" "$DEST/agents/research/"

# Workflow agents
cp "$SOURCE/agents/pr-comment-resolver.md" "$DEST/agents/workflow/"
```

#### D. Utility Commands

```bash
cp "$SOURCE/commands/plan_review.md" "$DEST/commands/utilities/"
cp "$SOURCE/commands/triage.md" "$DEST/commands/utilities/"
cp "$SOURCE/commands/changelog.md" "$DEST/commands/utilities/"
cp "$SOURCE/commands/resolve_pr_parallel.md" "$DEST/commands/utilities/"
cp "$SOURCE/commands/resolve_todo_parallel.md" "$DEST/commands/utilities/"
cp "$SOURCE/commands/test-browser.md" "$DEST/commands/utilities/"
```

#### E. Skills

```bash
cp -r "$SOURCE/skills/file-todos" "$DEST/skills/"
cp -r "$SOURCE/skills/git-worktree" "$DEST/skills/"
cp -r "$SOURCE/skills/rclone" "$DEST/skills/"
cp -r "$SOURCE/skills/frontend-design" "$DEST/skills/"
cp -r "$SOURCE/skills/agent-browser" "$DEST/skills/"
cp -r "$SOURCE/skills/brainstorming" "$DEST/skills/"
```

#### F. Add Attribution Headers

After copying, add this header to each ported file:

```markdown
---
# Original: Compound Engineering Plugin by Kieran Klaassen
# Source: https://github.com/kieranklaassen/compound-engineering
# Adapted for: Orange Hill Engineering Plugin
---
```

---

## Step 4: Create New Stack-Specific Assets (2-4 hours)

Use the templates in `.claude/specs/AGENT-TEMPLATE.md` and `.claude/specs/COMMAND-TEMPLATE.md`

### Priority 1: Laravel Agents

Use `kieran-rails-reviewer.md` as template:

```bash
# Copy template
cp "$SOURCE/agents/kieran-rails-reviewer.md" "$DEST/agents/review/laravel-reviewer.md"

# Edit to adapt for Laravel (see AGENT-TEMPLATE.md for guidance)
```

Create these Laravel agents:
- [ ] `laravel-reviewer.md` - General Laravel review
- [ ] `laravel-conventions-reviewer.md` - Laravel idioms
- [ ] `photoncms-navigator.md` - PhotonCMS specifics
- [ ] `queue-job-reviewer.md` - Horizon/queue patterns

### Priority 2: Next.js Agents

- [ ] `nextjs-reviewer.md` - App Router patterns
- [ ] `nextjs-async-reviewer.md` - React 19 async patterns
- [ ] `tailwind-reviewer.md` - Tailwind conventions

### Priority 3: Chrome Extension Agents

- [ ] `chrome-extension-reviewer.md` - Manifest V3 patterns
- [ ] `fetch-interceptor-reviewer.md` - API interception

### Priority 4: New Commands

- [ ] `test-laravel.md` - Laravel test runner
- [ ] `test-nextjs.md` - Next.js test runner
- [ ] `queue-status.md` - Horizon status
- [ ] `migrate-check.md` - Migration validator
- [ ] `api-health.md` - External API health
- [ ] `extension-build.md` - Chrome extension build

### Priority 5: New Skills

- [ ] `laravel-horizon/` - Queue monitoring
- [ ] `photoncms-schema/` - Schema navigation
- [ ] `chrome-extension-debug/` - Extension debugging
- [ ] `nextjs-patterns/` - App Router patterns

---

## Step 5: Test Assets (1-2 hours)

Follow TESTING-PROTOCOL.md:

1. Create test cases in `tests/` directory
2. Run positive tests (good code should pass)
3. Run negative tests (bad code should flag issues)
4. Check compliance with templates
5. **Run referential integrity checks** (CRITICAL):

```bash
# Run the integrity check script
./plugins/orange-hill-engineering/tests/check-integrity.sh

# Or manually check for common issues:

# Find any remaining Rails/Ruby references
grep -rn "Rails\|ActiveRecord\|\.rb\b" plugins/orange-hill-engineering/agents/

# Find any Python references that shouldn't be there
grep -rn "Python\|\.py\b\|pip\|pytest" plugins/orange-hill-engineering/agents/

# Find backtick refs that should be markdown links
grep -rE '`(references|assets|scripts)/[^`]+`' plugins/orange-hill-engineering/skills/

# Find broken cross-agent references
# Read each agent and verify "works with" agents exist
```

6. **Manual review**: Read each ported/created `.md` file and verify:
   - All referenced agents exist
   - All referenced commands exist
   - All referenced skills exist
   - All file links resolve
   - No references to skipped assets (kieran-rails-reviewer, dhh-rails-reviewer, etc.)

---

## Step 6: Finalize Documentation (30 min)

### README.md

Create main README with:
- Credits to Compound Engineering
- Installation instructions
- List of included assets
- Philosophy section

### CHANGELOG.md

```markdown
# Changelog

## [1.0.0] - {date}

### Added
- Initial release derived from Compound Engineering Plugin
- X agents for code review, research, and workflow
- Y commands for development lifecycle
- Z skills for patterns and automation
- Support for Laravel, Next.js, and Chrome extensions

### Credits
- Based on Compound Engineering Plugin by Kieran Klaassen
```

### LICENSE

Choose appropriate license considering original's terms

---

## Step 7: Publish to GitHub (15 min)

```bash
# Create .gitignore
cat > .gitignore << 'EOF'
# Logs
*.log
logs/

# Environment
.env
.env.local

# OS
.DS_Store
Thumbs.db

# IDE
.idea/
.vscode/
*.swp

# Test artifacts
tests/**/actual/
EOF

# Initial commit
git add .
git commit -m "Initial commit: orange-hill-engineering plugin

Derived from Compound Engineering Plugin by Kieran Klaassen
https://github.com/kieranklaassen/compound-engineering"

# Create GitHub repo (using gh CLI)
gh repo create orange-hill/orange-hill-marketplace --public \
  --description "Claude Code plugin marketplace by Orange Hill"

# Push
git remote add origin git@github.com:orange-hill/orange-hill-marketplace.git
git push -u origin main

# Create release
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
gh release create v1.0.0 --title "v1.0.0" --notes "Initial release of orange-hill-engineering plugin"
```

---

## Step 8: Install and Test (15 min)

```bash
# Add marketplace
claude /plugin marketplace add https://github.com/orange-hill/orange-hill-marketplace

# Install plugin
claude /plugin install orange-hill-engineering

# Test in each Orange Hill project
cd /Users/tihomir/Sites/skupio-api
claude agent laravel-reviewer "Review app/Services/UserService.php"

cd /Users/tihomir/Sites/skupio
claude agent nextjs-reviewer "Review src/app/page.tsx"

cd /Users/tihomir/AI/linkedin-scraper-chrome-plugin
claude agent chrome-extension-reviewer "Review src/content/content-script.js"
```

---

## Step 9: Update Orange Hill Projects (30 min)

Add/update CLAUDE.md in each project:

### Backend (`/Users/tihomir/Sites/skupio-api/CLAUDE.md`)

```markdown
# Orange Hill API

## Plugin

This project uses orange-hill-engineering from orange-hill-marketplace.

## Knowledge Base

Solved problems → `docs/solutions/`

## Key Workflows

- `/workflows:plan` → Plan features
- `/workflows:review` → Code review
- `/workflows:compound` → Document learnings
```

### Frontend (`/Users/tihomir/Sites/skupio/CLAUDE.md`)

Similar structure, focused on Next.js

### Extension (`/Users/tihomir/AI/linkedin-scraper-chrome-plugin/CLAUDE.md`)

Similar structure, focused on Chrome extension

---

## Estimated Total Time

| Phase | Time |
|-------|------|
| Repository setup | 15 min |
| Configuration files | 10 min |
| Port assets | 1-2 hours |
| Create new assets | 2-4 hours |
| Testing | 1-2 hours |
| Documentation | 30 min |
| GitHub publishing | 15 min |
| Installation & testing | 15 min |
| Project updates | 30 min |
| **Total** | **6-10 hours** |

---

## Next Steps After Initial Setup

1. **Iterate on agents** - Refine based on real usage
2. **Add more test cases** - From actual Orange Hill code
3. **Document learnings** - Use `/workflows:compound` regularly
4. **Update from upstream** - Check compound-engineering for updates
5. **Add project-specific agents** - As patterns emerge

---

## Troubleshooting

### Plugin not found after install

```bash
# Verify marketplace added
claude /plugin marketplace list

# Re-add if needed
claude /plugin marketplace remove orange-hill-marketplace
claude /plugin marketplace add https://github.com/orange-hill/orange-hill-marketplace
```

### Hook not executing

```bash
# Verify hook file is executable
chmod +x plugins/orange-hill-engineering/hooks/pre_tool_use.py

# Test hook manually
echo '{"tool_name":"Bash","tool_input":{"command":"rm -rf /"}}' | python3 hooks/pre_tool_use.py
```

### Agent not recognized

```bash
# Check agent file exists and has correct frontmatter
cat plugins/orange-hill-engineering/agents/review/laravel-reviewer.md | head -20
```
