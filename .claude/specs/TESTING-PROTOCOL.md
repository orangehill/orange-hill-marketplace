# Testing Protocol

This document defines how to test agents, commands, and skills in the orange-hill-engineering plugin to ensure effectiveness and compliance.

---

## Testing Philosophy

Every asset must be tested against:
1. **Positive cases** - Good code that should pass
2. **Negative cases** - Bad code that should be flagged
3. **Edge cases** - Boundary conditions and unusual inputs
4. **Compliance** - Adherence to templates and conventions

---

## Test Directory Structure

```
plugins/orange-hill-engineering/
└── tests/
    ├── agents/
    │   └── {agent-name}/
    │       ├── good-code/           # Should pass review
    │       │   ├── example1.{ext}
    │       │   └── example2.{ext}
    │       ├── bad-code/            # Should flag issues
    │       │   ├── issue1.{ext}
    │       │   └── issue2.{ext}
    │       └── expected/            # Expected outputs
    │           ├── issue1.md
    │           └── issue2.md
    ├── commands/
    │   └── {command-name}/
    │       ├── input/               # Test inputs
    │       └── expected/            # Expected outputs
    └── skills/
        └── {skill-name}/
            └── scenarios/           # Test scenarios
```

---

## Agent Testing

### 1. Effectiveness Tests

#### Positive Test (False Positive Check)

**Goal**: Ensure agent doesn't flag correct code

```bash
# Run agent on known-good code
claude agent {agent-name} "Review tests/agents/{agent-name}/good-code/"

# Expected: No issues or only minor suggestions
# Fail if: Any CRITICAL or WARNING issues on good code
```

**Test Cases for Good Code**:
- Idiomatic framework code
- Code following all documented conventions
- Well-structured, clean implementations
- Production code from the Orange Hill projects (verified good)

#### Negative Test (False Negative Check)

**Goal**: Ensure agent catches all known issues

```bash
# Run agent on known-bad code
claude agent {agent-name} "Review tests/agents/{agent-name}/bad-code/issue1.{ext}"

# Expected: Specific issues flagged
# Fail if: Known issues not detected
```

**Test Cases for Bad Code**:

Create files with intentional issues:

| Issue Category | Example |
|----------------|---------|
| Security | SQL injection, XSS, exposed secrets |
| Performance | N+1 queries, missing indexes, memory leaks |
| Convention | Wrong patterns, anti-patterns |
| Architecture | SOLID violations, coupling issues |
| Data | Missing validation, unsafe migrations |

#### Output Comparison

Compare agent output against expected findings:

```bash
# Generate output
claude agent {agent-name} "Review bad-code/issue1.php" > actual.md

# Compare key elements
# - Same issues detected
# - Correct severity levels
# - Accurate file:line references
```

### 2. Performance Tests

**Goal**: Agent completes in reasonable time

| File Size | Max Time |
|-----------|----------|
| < 100 lines | 30 seconds |
| 100-500 lines | 1 minute |
| 500+ lines | 2 minutes |

### 3. Compliance Tests

Use this checklist for every agent:

```markdown
## Agent Compliance Checklist: {agent-name}

### Structure
- [ ] Frontmatter has all required fields (name, description, model, color)
- [ ] Attribution header present if derived from another agent
- [ ] Role section clearly defines perspective
- [ ] Checklist items are specific and actionable
- [ ] Output format matches template
- [ ] Examples are present and realistic

### Content Quality
- [ ] No references to wrong framework
- [ ] Checklist covers all relevant concerns
- [ ] Severity levels used appropriately
- [ ] Code examples are syntactically correct
- [ ] Related agents accurately listed

### Functional
- [ ] Passes all positive tests (no false positives on good code)
- [ ] Passes all negative tests (catches known issues)
- [ ] Output is consistently formatted
- [ ] Completes within time limits
```

---

## Command Testing

### 1. Dry Run Tests

If command supports `--dry-run`:

```bash
/{command-name} "test input" --dry-run

# Verify:
# - Correct steps would be executed
# - No actual changes made
# - Output describes what would happen
```

### 2. Integration Tests

Run on test branch:

```bash
# Create test branch
git checkout -b test/{command-name}

# Run command
/{command-name} "test scenario"

# Verify:
# - Expected artifacts created
# - No unintended side effects
# - Output matches documentation

# Cleanup
git checkout main
git branch -D test/{command-name}
```

### 3. Error Handling Tests

Test each documented error case:

```bash
# Test invalid input
/{command-name} ""
# Expected: Appropriate error message

# Test missing dependencies
# (simulate by removing required file/tool)
/{command-name} "valid input"
# Expected: Clear error about missing dependency
```

### 4. Compliance Tests

```markdown
## Command Compliance Checklist: {command-name}

### Structure
- [ ] Frontmatter has all required fields
- [ ] Attribution header present if derived
- [ ] Arguments fully documented with types
- [ ] Workflow steps are sequential and clear
- [ ] Output artifacts specified
- [ ] Dependencies listed

### Functional
- [ ] Executes without errors on valid input
- [ ] Produces documented output/artifacts
- [ ] Error cases handled gracefully
- [ ] Completes within reasonable time
```

---

## Skill Testing

### 1. Invocation Test

```bash
# Test skill loads correctly
claude skill {skill-name}

# Verify:
# - No loading errors
# - Skill description displayed
# - Ready for use
```

### 2. Functionality Tests

Create scenarios in `tests/skills/{skill-name}/scenarios/`:

```markdown
# Scenario: {scenario-name}

## Setup
{Prerequisites}

## Input
{User action or command}

## Expected Output
{What should happen}

## Verification
{How to verify success}
```

### 3. Integration Tests

Test skill with related commands/agents:

```bash
# If skill is used by a command
/{command-that-uses-skill}

# Verify skill functionality within command context
```

---

## Automated Test Runner

Create a test runner script:

**File: `plugins/orange-hill-engineering/tests/run-tests.sh`**

```bash
#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

PASS=0
FAIL=0

echo "Running orange-hill-engineering plugin tests..."
echo "=========================================="

# Test each agent
for agent_dir in tests/agents/*/; do
    agent_name=$(basename "$agent_dir")
    echo -n "Testing agent: $agent_name... "

    # Run positive tests
    # Run negative tests
    # Compare outputs

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}PASS${NC}"
        ((PASS++))
    else
        echo -e "${RED}FAIL${NC}"
        ((FAIL++))
    fi
done

# Test each command
for cmd_dir in tests/commands/*/; do
    cmd_name=$(basename "$cmd_dir")
    echo -n "Testing command: $cmd_name... "

    # Run command tests

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}PASS${NC}"
        ((PASS++))
    else
        echo -e "${RED}FAIL${NC}"
        ((FAIL++))
    fi
done

echo "=========================================="
echo -e "Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}"

exit $FAIL
```

---

## Test Data from Orange Hill Projects

Use real code from Orange Hill projects as test data:

### Good Code Sources

| Project | Path | Use For |
|---------|------|---------|
| Backend | `app/Services/` | Laravel service patterns |
| Backend | `app/Http/Controllers/` | Controller conventions |
| Frontend | `src/components/` | Next.js component patterns |
| Extension | `src/lib/` | JS utility patterns |

### Creating Bad Code Samples

1. Copy good code
2. Introduce specific issues:
   - Remove validation
   - Add N+1 queries
   - Introduce security vulnerabilities
   - Break conventions
3. Document expected findings

---

## Referential Integrity Tests

**IMPORTANT**: After all work is completed, read each `.md` file and verify all references are valid.

### What to Check

| Reference Type | Pattern | Validation |
|----------------|---------|------------|
| Agent references | `agent {name}` or backticks | Agent file exists in `agents/` |
| Command references | `/{command}` | Command file exists in `commands/` |
| Skill references | `skill {name}` | Skill directory exists in `skills/` |
| File links | `[text](./path)` | Target file exists |
| Relative paths | `references/`, `assets/`, `scripts/` | Target exists |
| Cross-agent refs | "works well with X agent" | Referenced agent exists |

### Automated Integrity Check Script

**File: `plugins/orange-hill-engineering/tests/check-integrity.sh`**

```bash
#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0
PLUGIN_DIR="plugins/orange-hill-engineering"

echo "Checking referential integrity..."
echo "=================================="

# 1. Check all markdown links resolve
echo -e "\n${YELLOW}Checking markdown links...${NC}"
for file in $(find "$PLUGIN_DIR" -name "*.md" -type f); do
    # Extract markdown links [text](path)
    links=$(grep -oE '\[([^]]+)\]\(([^)]+)\)' "$file" | grep -oE '\]\([^)]+\)' | sed 's/](\(.*\))/\1/')

    for link in $links; do
        # Skip external URLs
        if [[ "$link" =~ ^https?:// ]]; then
            continue
        fi

        # Skip anchors
        if [[ "$link" =~ ^# ]]; then
            continue
        fi

        # Resolve relative path
        dir=$(dirname "$file")
        target="$dir/$link"

        if [[ ! -e "$target" ]]; then
            echo -e "${RED}BROKEN LINK${NC}: $file -> $link"
            ((ERRORS++))
        fi
    done
done

# 2. Check agent cross-references
echo -e "\n${YELLOW}Checking agent cross-references...${NC}"
for file in $(find "$PLUGIN_DIR/agents" -name "*.md" -type f 2>/dev/null); do
    # Look for "works with" or "related agent" patterns
    refs=$(grep -iE '(works.*(with|well)|related.*agent|use.*agent|invoke.*agent).*`[a-z-]+`' "$file" | grep -oE '`[a-z-]+`' | tr -d '`')

    for ref in $refs; do
        # Check if referenced agent exists
        if ! find "$PLUGIN_DIR/agents" -name "$ref.md" -type f | grep -q .; then
            echo -e "${RED}MISSING AGENT${NC}: $file references '$ref' but agent not found"
            ((ERRORS++))
        fi
    done
done

# 3. Check command references in agents/skills
echo -e "\n${YELLOW}Checking command references...${NC}"
for file in $(find "$PLUGIN_DIR" -name "*.md" -type f ! -path "*/commands/*"); do
    # Look for /command patterns
    cmds=$(grep -oE '/[a-z][a-z0-9_:-]+' "$file" | sort -u)

    for cmd in $cmds; do
        cmd_name="${cmd#/}"
        # Check if command file exists (handle : in names)
        cmd_file=$(echo "$cmd_name" | tr ':' '-')
        if ! find "$PLUGIN_DIR/commands" -name "$cmd_file.md" -o -name "$cmd_name.md" 2>/dev/null | grep -q .; then
            echo -e "${YELLOW}UNVERIFIED COMMAND${NC}: $file references '$cmd' - verify it exists"
            ((WARNINGS++))
        fi
    done
done

# 4. Check skill references
echo -e "\n${YELLOW}Checking skill references...${NC}"
for file in $(find "$PLUGIN_DIR" -name "*.md" -type f ! -path "*/skills/*"); do
    # Look for skill invocations
    skills=$(grep -iE '(skill|claude skill)\s+[a-z-]+' "$file" | grep -oE 'skill\s+[a-z-]+' | awk '{print $2}')

    for skill in $skills; do
        if [[ ! -d "$PLUGIN_DIR/skills/$skill" ]]; then
            echo -e "${RED}MISSING SKILL${NC}: $file references '$skill' but skill not found"
            ((ERRORS++))
        fi
    done
done

# 5. Check for unlinked reference files (skill compliance)
echo -e "\n${YELLOW}Checking for unlinked reference files...${NC}"
for skill_dir in $(find "$PLUGIN_DIR/skills" -mindepth 1 -maxdepth 1 -type d 2>/dev/null); do
    skill_file="$skill_dir/SKILL.md"
    if [[ -f "$skill_file" ]]; then
        # Check references/ directory
        if [[ -d "$skill_dir/references" ]]; then
            for ref_file in $(find "$skill_dir/references" -type f); do
                basename_ref=$(basename "$ref_file")
                if ! grep -q "\[.*\](.*references/$basename_ref)" "$skill_file"; then
                    echo -e "${RED}UNLINKED FILE${NC}: $ref_file not linked in SKILL.md"
                    ((ERRORS++))
                fi
            done
        fi

        # Check assets/ directory
        if [[ -d "$skill_dir/assets" ]]; then
            for asset_file in $(find "$skill_dir/assets" -type f); do
                basename_asset=$(basename "$asset_file")
                if ! grep -q "\[.*\](.*assets/$basename_asset)" "$skill_file"; then
                    echo -e "${RED}UNLINKED FILE${NC}: $asset_file not linked in SKILL.md"
                    ((ERRORS++))
                fi
            done
        fi

        # Check scripts/ directory
        if [[ -d "$skill_dir/scripts" ]]; then
            for script_file in $(find "$skill_dir/scripts" -type f); do
                basename_script=$(basename "$script_file")
                if ! grep -q "\[.*\](.*scripts/$basename_script)" "$skill_file"; then
                    echo -e "${RED}UNLINKED FILE${NC}: $script_file not linked in SKILL.md"
                    ((ERRORS++))
                fi
            done
        fi
    fi
done

# 6. Check for backtick references that should be links
echo -e "\n${YELLOW}Checking for backtick refs that should be links...${NC}"
for file in $(find "$PLUGIN_DIR/skills" -name "SKILL.md" -type f 2>/dev/null); do
    bad_refs=$(grep -E '`(references|assets|scripts)/[^`]+`' "$file")
    if [[ -n "$bad_refs" ]]; then
        echo -e "${RED}BAD REFERENCE FORMAT${NC}: $file has backtick refs that should be markdown links:"
        echo "$bad_refs"
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
```

### Manual Integrity Review Checklist

After completing all asset creation/porting, manually verify:

```markdown
## Referential Integrity Checklist

### Agents
- [ ] All "works with" agent references point to existing agents
- [ ] All "Related agents" sections list valid agents
- [ ] No references to agents that were skipped (Rails, Python specific)
- [ ] Framework references match actual supported frameworks

### Commands
- [ ] All "Dependencies > Required Agents" list existing agents
- [ ] All "Dependencies > Required Skills" list existing skills
- [ ] All "Related Commands" point to existing commands
- [ ] Workflow command chains are valid (plan → review → work → compound)

### Skills
- [ ] All files in `references/` are linked in SKILL.md
- [ ] All files in `assets/` are linked in SKILL.md
- [ ] All files in `scripts/` are linked in SKILL.md
- [ ] No backtick references like `references/file.md` (use proper links)
- [ ] All "Related skills" point to existing skills

### Cross-Cutting
- [ ] No references to "kieran-rails-reviewer" (skipped)
- [ ] No references to "dhh-rails-reviewer" (skipped)
- [ ] No references to Ruby/Python specific tooling
- [ ] All MCP server references are valid
```

### Common Integrity Issues

| Issue | Example | Fix |
|-------|---------|-----|
| Broken agent ref | "use `kieran-rails-reviewer`" | Replace with `laravel-reviewer` |
| Missing skill link | `` `references/guide.md` `` | Change to `[guide.md](./references/guide.md)` |
| Dead command ref | "then run `/deploy-docs`" | Remove or replace with valid command |
| Wrong framework | "Rails migrations" in Laravel agent | Update to "Laravel migrations" |
| Orphan file | `references/old-guide.md` not linked | Link it or remove file |

### Running Integrity Checks

```bash
# Run automated checks
cd /path/to/orange-hill-marketplace
./plugins/orange-hill-engineering/tests/check-integrity.sh

# Quick grep for common issues
# Find Rails/Ruby references that shouldn't be there
grep -rn "Rails\|ActiveRecord\|Ruby\|\.rb\b" plugins/orange-hill-engineering/agents/

# Find Python references that shouldn't be there
grep -rn "Python\|\.py\b\|pip\|pytest" plugins/orange-hill-engineering/agents/

# Find unlinked reference files
grep -rE '`(references|assets|scripts)/[^`]+`' plugins/orange-hill-engineering/skills/
```

---

## Continuous Testing

### Pre-Commit Checklist

Before committing changes to any asset:

- [ ] Run agent tests if agent modified
- [ ] Run command tests if command modified
- [ ] Run compliance checklist
- [ ] Run referential integrity checks
- [ ] Verify no regressions

### Release Testing

Before publishing new version:

- [ ] All agent tests pass
- [ ] All command tests pass
- [ ] All skill tests pass
- [ ] **Referential integrity check passes** (run `check-integrity.sh`)
- [ ] No references to skipped assets (Rails, Python agents)
- [ ] Integration tests across Orange Hill projects
- [ ] Manual smoke test of key workflows

---

## Test Case Examples

### Agent: laravel-reviewer

**Good Code: `good-code/UserService.php`**

```php
<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function __construct(
        private UserRepository $userRepository
    ) {}

    public function create(array $data): User
    {
        $data['password'] = Hash::make($data['password']);

        return $this->userRepository->create($data);
    }
}
```

**Bad Code: `bad-code/issue1-fat-controller.php`**

```php
<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    // Issue: Fat controller with business logic
    public function store(Request $request)
    {
        // Issue: Validation in controller
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|min:8',
        ]);

        // Issue: Business logic in controller
        $user = new User();
        $user->email = $request->email;
        $user->password = bcrypt($request->password);
        $user->save();

        // Issue: Direct model access, no repository
        // Issue: No service layer

        return response()->json($user);
    }
}
```

**Expected Output: `expected/issue1.md`**

```markdown
**WARNING** - issue1-fat-controller.php:15
Issue: Validation should be in Form Request class
Impact: Reduces reusability, clutters controller
Fix: Create StoreUserRequest with validation rules

**WARNING** - issue1-fat-controller.php:21-24
Issue: Business logic in controller
Impact: Violates single responsibility, hard to test
Fix: Extract to UserService class

**WARNING** - issue1-fat-controller.php:21
Issue: Direct model instantiation
Impact: Tight coupling, harder to mock in tests
Fix: Use repository pattern or service layer

**SUGGESTION** - issue1-fat-controller.php:26
Issue: Returning raw model
Impact: Exposes internal structure, no transformation
Fix: Use API Resource for response transformation
```

---

## Metrics & Reporting

Track these metrics over time:

| Metric | Target |
|--------|--------|
| False Positive Rate | < 5% |
| False Negative Rate | < 2% |
| Average Response Time | < 30s |
| Test Coverage | 100% of agents/commands |

Generate reports after each test run:

```markdown
# Test Report - {date}

## Summary
- Agents tested: X
- Commands tested: Y
- Skills tested: Z
- Overall pass rate: XX%

## Issues Found
{List any failures}

## Recommendations
{Improvements needed}
```
