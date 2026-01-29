# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-29

### Added

Initial release of the Orange Hill Engineering plugin, derived from [Compound Engineering Plugin](https://github.com/kieranklaassen/compound-engineering) by Kieran Klaassen.

#### Agents (23)
- **Review (15)**: security-sentinel, performance-oracle, pattern-recognition-specialist, architecture-strategist, code-simplicity-reviewer, kieran-typescript-reviewer, laravel-reviewer, laravel-conventions-reviewer, photoncms-navigator, queue-job-reviewer, nextjs-reviewer, nextjs-async-reviewer, tailwind-reviewer, chrome-extension-reviewer, fetch-interceptor-reviewer
- **Data (3)**: data-integrity-guardian, data-migration-expert, deployment-verification-agent
- **Research (3)**: best-practices-researcher, framework-docs-researcher, git-history-analyzer
- **Workflow (2)**: pr-comment-resolver, orange-hill-style-editor

#### Commands (18)
- **Workflows (6)**: plan, review, work, compound, brainstorm, deepen-plan
- **Utilities (12)**: plan_review, triage, changelog, resolve_pr_parallel, resolve_todo_parallel, test-browser, test-laravel, migrate-check, queue-status, test-nextjs, api-health, extension-build

#### Skills (11)
- **Ported (7)**: compound-docs, file-todos, git-worktree, rclone, frontend-design, agent-browser, brainstorming
- **Laravel (2)**: laravel-horizon, photoncms-schema
- **Next.js (1)**: nextjs-patterns
- **Chrome Extension (1)**: chrome-extension-debug

#### MCP Servers (2)
- **context7** - Framework documentation (Laravel, Next.js, React, TypeScript)
- **chrome-devtools** - Chrome extension debugging via DevTools Protocol

#### Infrastructure
- Pre-tool-use security hook (blocks dangerous rm commands)

### Laravel-Specific Components

#### Agents
- `laravel-reviewer` - Laravel code review with strict conventions
- `laravel-conventions-reviewer` - Laravel idioms and best practices
- `photoncms-navigator` - PhotonCMS schema navigation
- `queue-job-reviewer` - Horizon and queue job patterns

#### Commands
- `/test-laravel` - Run Laravel test suites with smart filtering
- `/migrate-check` - Validate migrations before running
- `/queue-status` - Check Horizon queue health

#### Skills
- `laravel-horizon` - Queue monitoring and job design patterns
- `photoncms-schema` - Dynamic schema navigation for PhotonCMS

### Next.js Components

#### Agents
- `nextjs-reviewer` - Next.js App Router patterns, Server/Client Components
- `nextjs-async-reviewer` - Async patterns, race conditions, Suspense, streaming
- `tailwind-reviewer` - Tailwind CSS v3/v4 best practices

#### Commands
- `/test-nextjs` - Run Next.js tests (Jest/Vitest/Playwright)
- `/api-health` - Check external API health

#### Skills
- `nextjs-patterns` - App Router patterns and data fetching strategies

### Chrome Extension Components

#### Agents
- `chrome-extension-reviewer` - Manifest V3, service workers, chrome APIs
- `fetch-interceptor-reviewer` - Fetch/XHR interception patterns

#### Commands
- `/extension-build` - Build/package Chrome extensions (dev/prod/watch/zip)

#### Skills
- `chrome-extension-debug` - Chrome debugging workflows with MCP integration

### Credits

Based on Compound Engineering Plugin by Kieran Klaassen.
- Original repository: https://github.com/kieranklaassen/compound-engineering
- Philosophy: https://every.to/source-code/my-ai-had-already-fixed-the-code-before-i-saw-it
