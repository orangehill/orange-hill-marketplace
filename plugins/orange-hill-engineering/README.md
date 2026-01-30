# Orange Hill Engineering Plugin

AI-powered development tools for Orange Hill projects. Includes 23 specialized agents, 19 commands, and 11 skills for Laravel, Next.js, and Chrome extensions.

## Credits

This plugin is derived from the [Compound Engineering Plugin](https://github.com/kieranklaassen/compound-engineering) by [Kieran Klaassen](https://github.com/kieranklaassen).

> "Each unit of engineering work should make subsequent units of work easier—not harder."

## Installation

```bash
# Add marketplace
claude /plugin marketplace add https://github.com/orange-hill/orange-hill-marketplace

# Install plugin
claude /plugin install orange-hill-engineering
```

## Components

### Agents (23)

#### Review Agents (15)
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

#### Data Agents (3)
| Agent | Purpose |
|-------|---------|
| `data-integrity-guardian` | Migrations, transactions |
| `data-migration-expert` | Migration validation |
| `deployment-verification-agent` | Go/No-Go checklists |

#### Research Agents (3)
| Agent | Purpose |
|-------|---------|
| `best-practices-researcher` | External documentation |
| `framework-docs-researcher` | Context7 MCP integration |
| `git-history-analyzer` | Code archaeology |

#### Workflow Agents (2)
| Agent | Purpose |
|-------|---------|
| `pr-comment-resolver` | PR feedback resolution |
| `orange-hill-style-editor` | Style guide compliance |

### Commands (19)

#### Workflow Commands (6)
| Command | Purpose |
|---------|---------|
| `/workflows:plan` | Create implementation plans |
| `/workflows:review` | Multi-agent code review |
| `/workflows:work` | Execute plans with commits |
| `/workflows:compound` | Document solved problems |
| `/workflows:brainstorm` | Explore requirements |
| `/deepen-plan` | Parallel research enrichment |

#### Utility Commands (13)
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

### Skills (11)

| Skill | Purpose |
|-------|---------|
| `compound-docs` | Capture solved problems as searchable docs |
| `file-todos` | Structured todo tracking |
| `git-worktree` | Parallel development |
| `rclone` | Cloud storage uploads |
| `frontend-design` | Frontend interface patterns |
| `agent-browser` | Browser automation |
| `brainstorming` | Requirements exploration |
| `laravel-horizon` | Queue monitoring and job patterns |
| `photoncms-schema` | Dynamic schema navigation |
| `nextjs-patterns` | App Router patterns and data fetching |
| `chrome-extension-debug` | Chrome extension debugging workflows |

### MCP Servers (2)

| Server | Purpose |
|--------|---------|
| `context7` | Framework documentation (Laravel, Next.js, React, etc.) |
| `chrome-devtools` | Chrome extension debugging via DevTools Protocol |

## Supported Stacks

- **PHP Backend**: Laravel 10+, PhotonCMS, Horizon
- **JS/TS Frontend**: Next.js 14+, React, TypeScript, Tailwind
- **Browser Extensions**: Chrome Manifest V3

## Key Workflows

### Plan → Review → Work → Compound

1. **Plan**: `/workflows:plan "Add user authentication"`
2. **Review**: `/workflows:review` (multi-agent code review)
3. **Work**: `/workflows:work` (execute with commits)
4. **Compound**: `/workflows:compound` (document learnings)

### Laravel-Specific Workflows

```bash
# Run tests before committing
/test-laravel

# Validate migrations before running
/migrate-check

# Check queue health
/queue-status
```

### Next.js Workflows

```bash
# Run tests
/test-nextjs

# Check API health
/api-health
```

### Chrome Extension Workflows

```bash
# Build extension
/extension-build

# Debug with Chrome DevTools MCP (requires Chrome with remote debugging)
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-profile-link
```

### Knowledge Compounding

The `/workflows:compound` command captures solved problems in `docs/solutions/` with searchable frontmatter. This ensures your team's knowledge compounds over time.

## Security

The plugin includes a pre-tool-use hook that blocks dangerous `rm` commands (like `rm -rf /`, `rm -rf ~`, etc.) while allowing all other operations.

## License

See LICENSE file.
