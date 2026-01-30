# Orange Hill Engineering Plugin - Practical Guide

## Quick Reference

### Daily Workflows

| Task | Command |
|------|---------|
| Plan a feature | `/plan "Add user authentication"` |
| Review code before commit | `/review` |
| Execute plan with commits | `/work` |
| Document what you learned | `/compound` |

---

## 1. Planning & Implementing Features

```bash
# Start with a plan
/plan "Add export to PDF feature"

# Deepen the plan with parallel research
/deepen-plan

# Review the plan with multiple agents
/plan_review

# Execute the plan (creates commits)
/work
```

---

## 2. Code Review

```bash
# Multi-agent review (runs all relevant reviewers)
/review

# The review command automatically selects agents based on file types:
# - Laravel files → laravel-reviewer, laravel-conventions-reviewer
# - Next.js files → nextjs-reviewer, nextjs-async-reviewer
# - Chrome extension → chrome-extension-reviewer, fetch-interceptor-reviewer
# - TypeScript → kieran-typescript-reviewer
# - All code → security-sentinel, performance-oracle
```

---

## 3. Testing

```bash
# Laravel projects
/test-laravel                    # Run all tests
/test-laravel --filter=UserTest  # Run specific test

# Next.js projects
/test-nextjs                     # Detects Jest/Vitest/Playwright

# Browser testing (Playwright)
/test-browser

# Check external APIs
/api-health
```

---

## 4. Laravel-Specific

```bash
# Before running migrations
/migrate-check

# Check queue health (Horizon)
/queue-status

# Use agents directly
claude agent laravel-reviewer "Review app/Services/PaymentService.php"
claude agent queue-job-reviewer "Review app/Jobs/ProcessOrder.php"
```

---

## 5. Chrome Extension Development

```bash
# Build extension
/extension-build              # Dev build
/extension-build --prod       # Production build
/extension-build --zip        # Create distributable

# Debug with Chrome DevTools MCP
# First, start Chrome with remote debugging:
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-profile-link

# Then use MCP tools:
mcp__chrome-devtools__take_snapshot
mcp__chrome-devtools__list_console_messages
mcp__chrome-devtools__list_network_requests
```

---

## 6. PR & Issue Management

```bash
# Triage issues
/triage

# Fix PR comments in parallel
/resolve_pr_parallel

# Resolve TODOs across codebase
/resolve_todo_parallel

# Generate changelog
/changelog
```

---

## 7. Knowledge Compounding

After solving a tricky problem:

```bash
/compound
```

This creates a searchable document in `docs/solutions/` with:
- Problem description
- Solution approach
- Code examples
- Tags for future searching

---

## 8. Using Agents Directly

```bash
# Syntax: claude agent <agent-name> "<prompt>"

# Security audit
claude agent security-sentinel "Audit src/auth/ for vulnerabilities"

# Performance review
claude agent performance-oracle "Review database queries in UserRepository"

# Architecture advice
claude agent architecture-strategist "How should I structure the payment module?"

# Research framework docs
claude agent framework-docs-researcher "How does Laravel handle rate limiting?"
```

---

## 9. Skills (Contextual Knowledge)

Skills are automatically loaded when relevant. Key skills:

| Skill | When It Helps |
|-------|---------------|
| `nextjs-patterns` | App Router, data fetching, Server Components |
| `chrome-extension-debug` | Extension debugging scenarios |
| `laravel-horizon` | Queue job design, Horizon monitoring |
| `compound-docs` | Documenting solutions |
| `git-worktree` | Parallel development on multiple branches |

---

## Typical Day Workflow

```bash
# Morning: Start a new feature
/plan "Implement user notifications"
/deepen-plan

# Coding...

# Before commit: Review your work
/review

# After solving something tricky
/compound

# Before PR: Run tests
/test-laravel  # or /test-nextjs

# PR feedback came in
/resolve_pr_parallel
```

---

## Pro Tips

1. **Use `/review` before every commit** - catches issues early
2. **Use `/compound` after solving hard problems** - builds team knowledge
3. **Use `/plan` for anything non-trivial** - prevents wasted effort
4. **Agents can be chained** - run security-sentinel, then performance-oracle
5. **Chrome DevTools MCP** - essential for extension debugging

---

## All Available Agents

### Review Agents (15)
| Agent | Purpose |
|-------|---------|
| `security-sentinel` | OWASP Top 10, security audits |
| `performance-oracle` | Algorithm, DB, memory optimization |
| `pattern-recognition-specialist` | Code smells, anti-patterns |
| `architecture-strategist` | SOLID, component boundaries |
| `code-simplicity-reviewer` | YAGNI, complexity reduction |
| `kieran-typescript-reviewer` | TypeScript conventions |
| `laravel-reviewer` | Laravel code review with high standards |
| `laravel-conventions-reviewer` | Laravel idioms and best practices |
| `photoncms-navigator` | PhotonCMS schema navigation |
| `queue-job-reviewer` | Horizon and queue job patterns |
| `nextjs-reviewer` | Next.js App Router, Server/Client Components |
| `nextjs-async-reviewer` | Async patterns, race conditions, Suspense |
| `tailwind-reviewer` | Tailwind CSS v3/v4 best practices |
| `chrome-extension-reviewer` | Manifest V3, service workers, chrome APIs |
| `fetch-interceptor-reviewer` | Fetch/XHR interception patterns |

### Data Agents (3)
| Agent | Purpose |
|-------|---------|
| `data-integrity-guardian` | Migrations, transactions |
| `data-migration-expert` | Migration validation |
| `deployment-verification-agent` | Go/No-Go checklists |

### Research Agents (3)
| Agent | Purpose |
|-------|---------|
| `best-practices-researcher` | External documentation |
| `framework-docs-researcher` | Context7 MCP integration |
| `git-history-analyzer` | Code archaeology |

### Workflow Agents (2)
| Agent | Purpose |
|-------|---------|
| `pr-comment-resolver` | PR feedback resolution |
| `orange-hill-style-editor` | Style guide compliance |

---

## All Available Commands

### Workflow Commands (6)
| Command | Purpose |
|---------|---------|
| `/plan` | Create implementation plans |
| `/review` | Multi-agent code review |
| `/work` | Execute plans with commits |
| `/compound` | Document solved problems |
| `/brainstorm` | Explore requirements |
| `/deepen-plan` | Parallel research enrichment |

### Utility Commands (13)
| Command | Purpose |
|---------|---------|
| `/plan_review` | Multi-agent plan review |
| `/triage` | Issue prioritization |
| `/changelog` | Generate changelogs |
| `/resolve_pr_parallel` | Fix PR comments in parallel |
| `/resolve_todo_parallel` | Resolve todos in parallel |
| `/test-browser` | Browser tests with Playwright |
| `/test-laravel` | Run Laravel test suites |
| `/migrate-check` | Validate migrations before running |
| `/queue-status` | Check Horizon queue health |
| `/test-nextjs` | Run Next.js tests (Jest/Vitest/Playwright) |
| `/api-health` | Check external API health |
| `/extension-build` | Build/package Chrome extensions |
| `/generate_command` | Create custom slash commands |

---

## MCP Servers

| Server | Purpose | Setup |
|--------|---------|-------|
| `context7` | Framework docs (Laravel, Next.js, React) | Auto-configured |
| `chrome-devtools` | Chrome extension debugging | Requires Chrome with `--remote-debugging-port=9222` |
