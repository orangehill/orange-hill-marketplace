---
name: test-laravel
description: Run Laravel test suites with intelligent filtering and parallel execution
argument-hint: "[filter|--parallel|--coverage]"
---

# Test Laravel Command

Run Laravel test suites with smart defaults and helpful output.

## Usage

```bash
/test-laravel                    # Run all tests
/test-laravel UserTest           # Run specific test class
/test-laravel --filter=login     # Filter by test name
/test-laravel --parallel         # Run tests in parallel
/test-laravel --coverage         # Run with coverage report
/test-laravel Feature            # Run only Feature tests
/test-laravel Unit               # Run only Unit tests
```

## Execution Flow

### 1. Detect Test Configuration

First, check the Laravel project setup:

```bash
# Check if using Pest or PHPUnit
if [ -f "tests/Pest.php" ]; then
    TEST_RUNNER="pest"
else
    TEST_RUNNER="phpunit"
fi

# Check for parallel testing support
if composer show 2>/dev/null | grep -q "brianium/paratest"; then
    PARALLEL_AVAILABLE=true
fi
```

### 2. Run Tests Based on Arguments

**No arguments - Run all tests:**
```bash
php artisan test
```

**With filter:**
```bash
php artisan test --filter="$ARGUMENTS"
```

**Parallel mode:**
```bash
php artisan test --parallel --processes=4
```

**With coverage:**
```bash
php artisan test --coverage --min=80
```

### 3. Handle Test Results

**On Success:**
```
✅ All tests passed

Tests:    45 passed
Duration: 12.3s

Ready to proceed with next task.
```

**On Failure:**
```
❌ Tests failed

Failed tests:
1. Tests\Feature\UserTest::test_login_requires_verification
   - Expected status 200, got 302
   - Location: tests/Feature/UserTest.php:45

2. Tests\Unit\OrderTest::test_total_calculation
   - Assert equals failed: expected 100.00, got 99.99
   - Location: tests/Unit/OrderTest.php:78

Would you like me to:
1. Fix the failing tests
2. Show test details
3. Skip and continue
```

## Test Organization

### Recommended Structure

```
tests/
├── Feature/
│   ├── Auth/
│   │   ├── LoginTest.php
│   │   └── RegistrationTest.php
│   ├── Api/
│   │   └── ArticleApiTest.php
│   └── Http/
│       └── ArticleControllerTest.php
├── Unit/
│   ├── Models/
│   │   └── UserTest.php
│   └── Services/
│       └── OrderServiceTest.php
└── TestCase.php
```

### Test Naming Convention

```php
// Feature tests - describe behavior
test_user_can_login_with_valid_credentials()
test_guest_cannot_access_dashboard()

// Unit tests - describe function
test_calculates_order_total_with_tax()
test_throws_exception_for_invalid_input()
```

## Common Test Patterns

### Testing API Endpoints

```php
public function test_api_returns_articles(): void
{
    $articles = Article::factory()->count(3)->create();

    $response = $this->getJson('/api/articles');

    $response
        ->assertOk()
        ->assertJsonCount(3, 'data')
        ->assertJsonStructure([
            'data' => [
                '*' => ['id', 'title', 'content'],
            ],
        ]);
}
```

### Testing with Authentication

```php
public function test_authenticated_user_can_create_post(): void
{
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->postJson('/api/posts', [
            'title' => 'Test Post',
            'content' => 'Content here',
        ]);

    $response->assertCreated();
    $this->assertDatabaseHas('posts', ['title' => 'Test Post']);
}
```

### Testing Jobs

```php
public function test_job_processes_order(): void
{
    Queue::fake();

    $order = Order::factory()->create();

    ProcessOrder::dispatch($order);

    Queue::assertPushed(ProcessOrder::class, function ($job) use ($order) {
        return $job->order->id === $order->id;
    });
}
```

## Integration with Review

After running tests:

1. If all pass, proceed with PR/commit
2. If failures, analyze and suggest fixes
3. Track flaky tests for investigation

## Related Commands

- `/migrate-check` - Validate migrations before testing
- `/queue-status` - Check queue health
- `/workflows:review` - Full code review including tests
