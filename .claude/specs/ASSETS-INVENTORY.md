# Assets Inventory

Complete inventory of all assets: what to port, skip, or create new.

---

## Summary

| Category | Port | Skip | Create New | Total |
|----------|------|------|------------|-------|
| Agents | 14 | 14 | 9 | 23 |
| Commands | 11 | 9 | 6 | 17 |
| Skills | 7 | 8 | 4 | 11 |
| Hooks | 1 | 7 | 0 | 1 |
| MCP Servers | 1 | 0 | 0 | 1 |

---

## AGENTS

### Port (13 agents)

| Agent | Original Path | Destination | Category |
|-------|---------------|-------------|----------|
| `security-sentinel.md` | `agents/` | `agents/review/` | review |
| `performance-oracle.md` | `agents/` | `agents/review/` | review |
| `pattern-recognition-specialist.md` | `agents/` | `agents/review/` | review |
| `architecture-strategist.md` | `agents/` | `agents/review/` | review |
| `code-simplicity-reviewer.md` | `agents/` | `agents/review/` | review |
| `kieran-typescript-reviewer.md` | `agents/` | `agents/review/` | review |
| `data-integrity-guardian.md` | `agents/` | `agents/data/` | data |
| `data-migration-expert.md` | `agents/` | `agents/data/` | data |
| `deployment-verification-agent.md` | `agents/` | `agents/data/` | data |
| `best-practices-researcher.md` | `agents/` | `agents/research/` | research |
| `framework-docs-researcher.md` | `agents/` | `agents/research/` | research |
| `git-history-analyzer.md` | `agents/` | `agents/research/` | research |
| `pr-comment-resolver.md` | `agents/` | `agents/workflow/` | workflow |
| `every-style-editor.md` | `agents/workflow/` | `agents/workflow/orange-hill-style-editor.md` | workflow |

### Skip (15 agents) - Use as Templates

| Agent | Reason | Use As Template For |
|-------|--------|---------------------|
| `kieran-rails-reviewer.md` | Rails-specific | `laravel-reviewer.md` |
| `dhh-rails-reviewer.md` | Rails-specific | `laravel-conventions-reviewer.md` |
| `kieran-python-reviewer.md` | Python-specific | (reference only) |
| `julik-frontend-races-reviewer.md` | Stimulus-specific | `nextjs-async-reviewer.md` |
| `lint.md` | Ruby/ERB-specific | `laravel-lint.md` |
| `design-iterator.md` | Requires Figma setup | - |
| `design-implementation-reviewer.md` | Requires Figma | - |
| `figma-design-sync.md` | Requires Figma | - |
| `bug-reproduction-validator.md` | Complex setup | - |
| `every-style-editor.md` | Adapted | `orange-hill-style-editor.md` ✓ |
| `ankane-readme-writer.md` | Ruby/gem-specific | - |
| `learnings-researcher.md` | Needs path adaptation | Port & adapt |
| `agent-native-reviewer.md` | AI app specific | - |
| `spec-flow-analyzer.md` | Generic, add later | - |

### Create New (9 agents)

| Agent | Template From | Purpose | Priority |
|-------|---------------|---------|----------|
| `laravel-reviewer.md` | `kieran-rails-reviewer.md` | Laravel code review | P1 |
| `laravel-conventions-reviewer.md` | `dhh-rails-reviewer.md` | Laravel idioms | P1 |
| `photoncms-navigator.md` | (new) | PhotonCMS schema | P1 |
| `queue-job-reviewer.md` | (new) | Horizon/queue patterns | P1 |
| `nextjs-reviewer.md` | `kieran-typescript-reviewer.md` | Next.js App Router | P2 |
| `nextjs-async-reviewer.md` | `julik-frontend-races-reviewer.md` | React 19 async | P2 |
| `tailwind-reviewer.md` | (new) | Tailwind 4 patterns | P2 |
| `chrome-extension-reviewer.md` | (new) | Manifest V3 | P3 |
| `fetch-interceptor-reviewer.md` | (new) | API interception | P3 |

---

## COMMANDS

### Port (11 commands)

| Command | Original Path | Destination | Category |
|---------|---------------|-------------|----------|
| `workflows-plan.md` | `commands/` | `commands/workflows/` | workflows |
| `workflows-review.md` | `commands/` | `commands/workflows/` | workflows |
| `workflows-work.md` | `commands/` | `commands/workflows/` | workflows |
| `workflows-compound.md` | `commands/` | `commands/workflows/` | **CRITICAL** |
| `deepen-plan.md` | `commands/` | `commands/workflows/` | workflows |
| `plan_review.md` | `commands/` | `commands/utilities/` | utilities |
| `triage.md` | `commands/` | `commands/utilities/` | utilities |
| `changelog.md` | `commands/` | `commands/utilities/` | utilities |
| `resolve_pr_parallel.md` | `commands/` | `commands/utilities/` | utilities |
| `resolve_todo_parallel.md` | `commands/` | `commands/utilities/` | utilities |
| `test-browser.md` | `commands/` | `commands/utilities/` | utilities |

### Skip (9 commands)

| Command | Reason |
|---------|--------|
| `create-agent-skill.md` | Meta command, add later |
| `generate_command.md` | Meta command |
| `heal-skill.md` | Meta command |
| `report-bug.md` | Plugin-specific |
| `reproduce-bug.md` | Complex setup |
| `xcode-test.md` | iOS-specific |
| `feature-video.md` | Video recording |
| `deploy-docs.md` | Their docs setup |
| `release-docs.md` | Their docs setup |

### Create New (6 commands)

| Command | Purpose | Priority |
|---------|---------|----------|
| `test-laravel.md` | Run Laravel test suites | P1 |
| `test-nextjs.md` | Run Next.js tests | P2 |
| `queue-status.md` | Check Horizon queue | P1 |
| `migrate-check.md` | Validate migrations | P1 |
| `api-health.md` | External API health | P2 |
| `extension-build.md` | Build Chrome extension | P3 |

---

## SKILLS

### Port (7 skills)

| Skill | Original Path | Purpose |
|-------|---------------|---------|
| `compound-docs/` | `skills/` | **CRITICAL** - Document solutions |
| `file-todos/` | `skills/` | Structured todo tracking |
| `git-worktree/` | `skills/` | Parallel development |
| `rclone/` | `skills/` | Cloud storage uploads |
| `frontend-design/` | `skills/` | Frontend patterns |
| `agent-browser/` | `skills/` | Browser automation |
| `brainstorming/` | `skills/` | Requirements exploration |

### Skip (8 skills)

| Skill | Reason |
|-------|--------|
| `dhh-rails-style/` | Rails-specific |
| `andrew-kane-gem-writer/` | Ruby gem-specific |
| `dspy-ruby/` | Ruby DSPy |
| `agent-native-architecture/` | AI app specific |
| `create-agent-skills/` | Meta skill |
| `skill-creator/` | Meta skill |
| `every-style-editor/` | Company-specific |
| `gemini-imagegen/` | Optional, add later if needed |

### Create New (4 skills)

| Skill | Purpose | Priority |
|-------|---------|----------|
| `laravel-horizon/` | Queue monitoring patterns | P1 |
| `photoncms-schema/` | Dynamic schema navigation | P1 |
| `chrome-extension-debug/` | Service worker debugging | P2 |
| `nextjs-patterns/` | App Router best practices | P2 |

---

## HOOKS

### Port (1 hook) - Simplified

| Hook | Original | Changes |
|------|----------|---------|
| `pre_tool_use.py` | `claude-code-boilerplate` | Keep only rm protection |

### Skip (7 hooks)

| Hook | Reason |
|------|--------|
| `post_tool_use.py` | Logging not needed |
| `session_start.py` | User config not needed |
| `stop.py` | TTS not needed |
| `user_prompt_submit.py` | Session tracking not needed |
| `notification.py` | TTS not needed |
| `subagent_stop.py` | TTS not needed |
| `pre_compact.py` | Backup not needed |

---

## MCP SERVERS

### Port (1 server)

| Server | Purpose |
|--------|---------|
| `context7` | Framework documentation (supports Laravel, Next.js) |

---

## Implementation Checklist

### Phase 1: Critical Path
- [ ] Create repository structure
- [ ] Port `compound-docs` skill
- [ ] Port `workflows-compound.md` command
- [ ] Port workflow commands (plan, review, work)
- [ ] Implement security hook

### Phase 2: Core Agents
- [ ] Port all 13 stack-agnostic agents
- [ ] Add attribution headers

### Phase 3: Stack-Specific (Laravel - P1)
- [ ] Create `laravel-reviewer.md`
- [ ] Create `laravel-conventions-reviewer.md`
- [ ] Create `photoncms-navigator.md`
- [ ] Create `queue-job-reviewer.md`
- [ ] Create `test-laravel.md`
- [ ] Create `migrate-check.md`
- [ ] Create `queue-status.md`
- [ ] Create `laravel-horizon/` skill
- [ ] Create `photoncms-schema/` skill

### Phase 4: Stack-Specific (Next.js - P2)
- [ ] Create `nextjs-reviewer.md`
- [ ] Create `nextjs-async-reviewer.md`
- [ ] Create `tailwind-reviewer.md`
- [ ] Create `test-nextjs.md`
- [ ] Create `api-health.md`
- [ ] Create `nextjs-patterns/` skill

### Phase 5: Stack-Specific (Chrome Extension - P3)
- [ ] Create `chrome-extension-reviewer.md`
- [ ] Create `fetch-interceptor-reviewer.md`
- [ ] Create `extension-build.md`
- [ ] Create `chrome-extension-debug/` skill

### Phase 6: Testing & Documentation
- [ ] Create test cases for all agents
- [ ] Create test cases for commands
- [ ] Write README.md
- [ ] Write CHANGELOG.md
- [ ] Create LICENSE

### Phase 7: Publishing
- [ ] Initialize git
- [ ] Create GitHub repository
- [ ] Push initial commit
- [ ] Create v1.0.0 release
- [ ] Test installation

### Phase 8: Integration
- [ ] Update Orange Hill API CLAUDE.md
- [ ] Update Orange Hill frontend CLAUDE.md
- [ ] Update Chrome extension CLAUDE.md
- [ ] Create docs/solutions/ in each project

---

## Port Commands Reference

Quick copy-paste commands for porting:

```bash
# Set paths
SOURCE="/Users/tihomir/Downloads/compound-engineering-plugin-main/plugins/compound-engineering"
DEST="/Users/tihomir/AgenticAI/Repositores/orange-hill-marketplace/plugins/orange-hill-engineering"

# Create directories
mkdir -p "$DEST/agents/"{review,data,research,workflow}
mkdir -p "$DEST/commands/"{workflows,utilities}
mkdir -p "$DEST/skills"
mkdir -p "$DEST/hooks"

# Port critical skill
cp -r "$SOURCE/skills/compound-docs" "$DEST/skills/"

# Port workflow commands
for cmd in workflows-plan workflows-review workflows-work workflows-compound deepen-plan; do
  cp "$SOURCE/commands/$cmd.md" "$DEST/commands/workflows/"
done

# Port utility commands
for cmd in plan_review triage changelog resolve_pr_parallel resolve_todo_parallel test-browser; do
  cp "$SOURCE/commands/$cmd.md" "$DEST/commands/utilities/"
done

# Port review agents
for agent in security-sentinel performance-oracle pattern-recognition-specialist architecture-strategist code-simplicity-reviewer kieran-typescript-reviewer; do
  cp "$SOURCE/agents/$agent.md" "$DEST/agents/review/"
done

# Port data agents
for agent in data-integrity-guardian data-migration-expert deployment-verification-agent; do
  cp "$SOURCE/agents/$agent.md" "$DEST/agents/data/"
done

# Port research agents
for agent in best-practices-researcher framework-docs-researcher git-history-analyzer; do
  cp "$SOURCE/agents/$agent.md" "$DEST/agents/research/"
done

# Port workflow agents
cp "$SOURCE/agents/pr-comment-resolver.md" "$DEST/agents/workflow/"

# Port remaining skills
for skill in file-todos git-worktree rclone frontend-design agent-browser brainstorming; do
  cp -r "$SOURCE/skills/$skill" "$DEST/skills/"
done

echo "Porting complete. Don't forget to add attribution headers!"
```
