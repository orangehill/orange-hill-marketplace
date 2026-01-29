---
name: test-nextjs
description: Run Next.js tests with Jest/Vitest, check TypeScript, and validate build
argument-hint: "[filter|--type-check|--build|--e2e]"
---

# Test Next.js Command

Run Next.js test suites, type checking, and build validation.

## Usage

```bash
/test-nextjs                    # Run all tests
/test-nextjs UserProfile        # Run specific test
/test-nextjs --filter=auth      # Filter by test name
/test-nextjs --type-check       # TypeScript type checking only
/test-nextjs --build            # Test production build
/test-nextjs --e2e              # Run Playwright e2e tests
/test-nextjs --coverage         # Run with coverage report
```

## Execution Flow

### 1. Detect Test Configuration

```bash
# Check test runner
if [ -f "vitest.config.ts" ] || [ -f "vitest.config.js" ]; then
    TEST_RUNNER="vitest"
elif [ -f "jest.config.ts" ] || [ -f "jest.config.js" ]; then
    TEST_RUNNER="jest"
fi

# Check for Playwright
if [ -f "playwright.config.ts" ]; then
    E2E_RUNNER="playwright"
fi
```

### 2. Run Tests Based on Arguments

**Unit/Integration Tests:**
```bash
# Vitest
npm run test
# or
npx vitest run

# Jest
npm run test
# or
npx jest
```

**Type Checking:**
```bash
npx tsc --noEmit
```

**Build Validation:**
```bash
npm run build
```

**E2E Tests:**
```bash
npx playwright test
```

### 3. Handle Results

**On Success:**
```
✅ All checks passed

Tests:     45 passed
TypeCheck: No errors
Build:     Successful (2.3s)

Ready to proceed.
```

**On Failure:**
```
❌ Checks failed

Failed tests:
1. src/__tests__/auth.test.tsx
   - Expected: signed in
   - Received: null
   - Location: line 45

TypeScript errors:
1. src/components/Button.tsx:23
   - Property 'onClick' is missing in type...

Would you like me to:
1. Fix the failing tests
2. Show error details
3. Skip and continue
```

## Test Organization

### Recommended Structure

```
src/
├── __tests__/              # Test files
│   ├── components/
│   │   └── Button.test.tsx
│   ├── hooks/
│   │   └── useAuth.test.ts
│   └── utils/
│       └── format.test.ts
├── app/
│   ├── __tests__/          # Route-specific tests
│   │   └── page.test.tsx
│   └── page.tsx
└── e2e/                    # Playwright tests
    └── auth.spec.ts
```

### Test Patterns

**Component Testing:**
```tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('renders with label', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

**Server Component Testing:**
```tsx
import { render } from '@testing-library/react';
import Page from '@/app/dashboard/page';

// Mock fetch for server component
vi.mock('next/headers', () => ({
  cookies: () => ({ get: vi.fn() }),
}));

describe('Dashboard Page', () => {
  it('renders user data', async () => {
    const page = await Page();
    const { getByText } = render(page);
    expect(getByText('Welcome')).toBeInTheDocument();
  });
});
```

**API Route Testing:**
```tsx
import { GET } from '@/app/api/users/route';

describe('GET /api/users', () => {
  it('returns users list', async () => {
    const response = await GET(new Request('http://localhost/api/users'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(3);
  });
});
```

## Common Configurations

### Vitest Config

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

### Jest Config

```typescript
// jest.config.ts
import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

export default createJestConfig(config);
```

### Playwright Config

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Integration with Review

After running tests:

1. If all pass, proceed with PR/commit
2. If failures, analyze and suggest fixes
3. Track flaky tests for investigation

## Related Commands

- `/test-browser` - Browser automation tests
- `/workflows:review` - Full code review
- `/api-health` - Check API endpoints
