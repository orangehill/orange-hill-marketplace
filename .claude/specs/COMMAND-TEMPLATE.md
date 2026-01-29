# Command Template

Use this template when creating new commands for the skupio-engineering plugin.

---

## Template Structure

```markdown
---
name: {command-name}
description: {One-line description}
# Original: Compound Engineering Plugin by Kieran Klaassen (if derived)
# Source: https://github.com/kieranklaassen/compound-engineering (if derived)
---

# /{command-name}

## Purpose

{2-3 sentences explaining what this command accomplishes and why it's valuable}

## Usage

```
/{command-name} [required-arg] [--optional-flag]
```

## Arguments

| Argument | Required | Description | Default |
|----------|----------|-------------|---------|
| `{arg1}` | Yes | {Description} | - |
| `--{flag}` | No | {Description} | `{default}` |

## Workflow

{Step-by-step description of what the command does}

1. **{Step Name}**
   - {What happens}
   - {Expected output}

2. **{Step Name}**
   - {What happens}
   - {Agents or tools invoked}

3. **{Step Name}**
   - {Final output or artifact}

## Output

{Description of what the command produces}

### Artifacts Created

| Artifact | Location | Purpose |
|----------|----------|---------|
| {File/Output} | `{path}` | {Why it's created} |

### Success Indicators

- {What indicates successful completion}
- {Expected state after command}

## Examples

### Basic Usage

```bash
/{command-name} "description of task"
```

### With Options

```bash
/{command-name} "description" --verbose --dry-run
```

### Real-World Example

```bash
# {Scenario description}
/{command-name} "{actual example}"

# Expected output:
# {Show what user sees}
```

## Dependencies

### Required Agents

| Agent | Purpose |
|-------|---------|
| `{agent-name}` | {How it's used in this command} |

### Required Tools

| Tool | Purpose |
|------|---------|
| `{tool}` | {How it's used} |

### Required Skills

| Skill | Purpose |
|-------|---------|
| `{skill-name}` | {How it's used} |

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| {Error message} | {Why it happens} | {How to fix} |

## Related Commands

- `/{related-command}` - {Relationship}
- `/{related-command}` - {Relationship}

## Notes

{Any additional context, warnings, or tips}
```

---

## Command Categories

### Workflow Commands (prefix: `workflows:`)

Core development lifecycle commands:
- `/workflows:plan` - Planning phase
- `/workflows:review` - Review phase
- `/workflows:work` - Execution phase
- `/workflows:compound` - Documentation phase

### Utility Commands (no prefix)

Supporting commands for specific tasks:
- `/changelog` - Generate changelogs
- `/triage` - Prioritize issues
- `/test-{framework}` - Run tests

---

## Naming Conventions

| Pattern | Use For | Example |
|---------|---------|---------|
| `workflows:{verb}` | Core lifecycle | `/workflows:plan` |
| `{verb}` | Simple actions | `/changelog` |
| `{verb}-{noun}` | Specific targets | `/test-laravel` |
| `{noun}-{verb}` | Entity actions | `/pr-resolve` |

---

## Checklist for New Commands

Before finalizing a new command:

- [ ] Name follows conventions
- [ ] Description is one line, starts with verb
- [ ] Attribution header present if derived
- [ ] All arguments documented with types
- [ ] Workflow steps are clear and sequential
- [ ] Output artifacts are specified
- [ ] Dependencies are listed
- [ ] Error cases are documented
- [ ] Examples are realistic and tested
- [ ] Related commands are referenced

---

## Example: /test-laravel

```markdown
---
name: test-laravel
description: Runs Laravel test suites with smart filtering
---

# /test-laravel

## Purpose

Runs Laravel PHPUnit/Pest tests with intelligent filtering based on changed files. Identifies affected test suites and runs them in priority order, providing clear feedback on failures.

## Usage

```
/test-laravel [filter] [--coverage] [--parallel]
```

## Arguments

| Argument | Required | Description | Default |
|----------|----------|-------------|---------|
| `filter` | No | Test name or path filter | All tests |
| `--coverage` | No | Generate coverage report | `false` |
| `--parallel` | No | Run tests in parallel | `false` |
| `--affected` | No | Only tests for changed files | `false` |

## Workflow

1. **Detect Changes**
   - Check git status for modified files
   - Map files to related test suites
   - Prioritize unit tests over feature tests

2. **Run Tests**
   - Execute `php artisan test` with filters
   - Stream output in real-time
   - Capture failures for analysis

3. **Report Results**
   - Summary of passed/failed/skipped
   - Failure details with file:line
   - Suggestions for fixing common issues

## Output

### Success Output

```
✓ Tests completed: 45 passed, 0 failed
  - Unit: 30 passed (0.8s)
  - Feature: 15 passed (2.3s)
```

### Failure Output

```
✗ Tests completed: 43 passed, 2 failed

Failures:
1. UserServiceTest::test_create_user_validates_email
   Location: tests/Unit/Services/UserServiceTest.php:45
   Message: Failed asserting that exception was thrown

2. ApiAuthTest::test_login_requires_valid_credentials
   Location: tests/Feature/Api/ApiAuthTest.php:78
   Message: Expected status 401, got 200
```

## Examples

### Run All Tests

```bash
/test-laravel
```

### Run Specific Test Class

```bash
/test-laravel UserServiceTest
```

### Run Affected Tests Only

```bash
/test-laravel --affected
```

### With Coverage

```bash
/test-laravel --coverage
```

## Dependencies

### Required Tools

| Tool | Purpose |
|------|---------|
| `php artisan` | Laravel CLI |
| `phpunit` or `pest` | Test runner |

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| "No tests found" | Filter too specific | Broaden filter or check path |
| "Database not configured" | Test DB missing | Run `php artisan migrate --env=testing` |
| "Class not found" | Autoload stale | Run `composer dump-autoload` |

## Related Commands

- `/migrate-check` - Validate migrations before testing
- `/queue-status` - Check queue for job tests
```
