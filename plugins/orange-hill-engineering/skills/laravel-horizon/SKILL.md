---
name: laravel-horizon
description: This skill provides patterns and best practices for Laravel Horizon queue management, job design, and monitoring. It should be used when implementing queue jobs, configuring Horizon, or troubleshooting queue issues.
---

# Laravel Horizon Skill

This skill provides comprehensive guidance for working with Laravel Horizon and queue-based job processing.

## Overview

Laravel Horizon provides a dashboard and code-driven configuration for Laravel Redis queues. This skill covers:

- Job design patterns
- Horizon configuration
- Queue monitoring
- Performance optimization
- Troubleshooting common issues

For detailed job configuration patterns, see [job-patterns.md](./references/job-patterns.md).

---

## Core Concepts

### Queue Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Request   │────▶│   Dispatch  │────▶│    Redis    │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Complete  │◀────│   Process   │◀────│   Worker    │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Queue Priorities

| Queue | Use Case | Timeout | Retries |
|-------|----------|---------|---------|
| `high` | Payment processing, critical notifications | 60s | 3 |
| `default` | Standard processing, emails | 120s | 3 |
| `low` | Reports, bulk operations | 300s | 1 |
| `batch` | Large data imports | 600s | 1 |

---

## Job Design Patterns

### Idempotent Jobs

Jobs must be safe to run multiple times:

```php
class ProcessPayment implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        private int $orderId,
        private string $idempotencyKey
    ) {}

    public function handle(PaymentGateway $gateway): void
    {
        // Check if already processed
        if (Payment::where('idempotency_key', $this->idempotencyKey)->exists()) {
            Log::info('Payment already processed', ['key' => $this->idempotencyKey]);
            return;
        }

        DB::transaction(function () use ($gateway) {
            $order = Order::lockForUpdate()->findOrFail($this->orderId);

            // Process payment
            $result = $gateway->charge($order->total, $this->idempotencyKey);

            // Record payment
            Payment::create([
                'order_id' => $order->id,
                'idempotency_key' => $this->idempotencyKey,
                'amount' => $order->total,
                'gateway_id' => $result->id,
            ]);
        });
    }
}
```

### Job Configuration

```php
class ProcessLargeImport implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    // Retry configuration
    public int $tries = 3;
    public int $maxExceptions = 2;
    public array $backoff = [30, 60, 120];

    // Timeout
    public int $timeout = 600;

    // Unique job prevention
    public function uniqueId(): string
    {
        return $this->importId;
    }

    public int $uniqueFor = 3600;

    // Delete if model is missing
    public bool $deleteWhenMissingModels = true;

    public function __construct(
        private int $importId
    ) {}

    public function handle(): void
    {
        // Process import
    }

    public function failed(\Throwable $exception): void
    {
        // Handle failure - notify, cleanup, etc.
        Import::find($this->importId)?->update(['status' => 'failed']);

        Notification::send(
            User::admins()->get(),
            new ImportFailedNotification($this->importId, $exception)
        );
    }
}
```

---

## Horizon Configuration

### Basic Setup

```php
// config/horizon.php
return [
    'domain' => null,
    'path' => 'horizon',
    'use' => 'default',
    'prefix' => env('HORIZON_PREFIX', 'horizon:'),
    'middleware' => ['web', 'auth:admin'],

    'environments' => [
        'production' => [
            'supervisor-default' => [
                'connection' => 'redis',
                'queue' => ['high', 'default', 'low'],
                'balance' => 'auto',
                'autoScalingStrategy' => 'time',
                'maxProcesses' => 10,
                'minProcesses' => 2,
                'maxTime' => 3600,
                'maxJobs' => 1000,
                'memory' => 128,
                'tries' => 3,
                'timeout' => 60,
                'nice' => 0,
            ],
            'supervisor-batch' => [
                'connection' => 'redis',
                'queue' => ['batch'],
                'balance' => 'simple',
                'maxProcesses' => 3,
                'maxTime' => 3600,
                'maxJobs' => 100,
                'memory' => 256,
                'tries' => 1,
                'timeout' => 600,
            ],
        ],
        'local' => [
            'supervisor-1' => [
                'connection' => 'redis',
                'queue' => ['high', 'default', 'low', 'batch'],
                'balance' => 'simple',
                'maxProcesses' => 3,
                'memory' => 128,
                'tries' => 3,
                'timeout' => 60,
            ],
        ],
    ],
];
```

### Authorization

```php
// app/Providers/HorizonServiceProvider.php
protected function gate(): void
{
    Gate::define('viewHorizon', function ($user) {
        return $user->hasRole('admin');
    });
}
```

---

## Monitoring Patterns

### Health Checks

```php
// app/Console/Commands/QueueHealthCheck.php
class QueueHealthCheck extends Command
{
    protected $signature = 'queue:health';

    public function handle(): int
    {
        $checks = [
            'horizon_running' => $this->checkHorizon(),
            'queue_sizes' => $this->checkQueueSizes(),
            'failed_jobs' => $this->checkFailedJobs(),
            'worker_memory' => $this->checkWorkerMemory(),
        ];

        foreach ($checks as $name => $result) {
            $status = $result['healthy'] ? '✅' : '❌';
            $this->line("{$status} {$name}: {$result['message']}");
        }

        return collect($checks)->every('healthy') ? 0 : 1;
    }

    private function checkHorizon(): array
    {
        $status = Horizon::status();
        return [
            'healthy' => $status === 'running',
            'message' => $status,
        ];
    }

    private function checkQueueSizes(): array
    {
        $queues = ['high', 'default', 'low'];
        $sizes = [];

        foreach ($queues as $queue) {
            $sizes[$queue] = Queue::size($queue);
        }

        $total = array_sum($sizes);
        return [
            'healthy' => $total < 1000,
            'message' => "Total: {$total} jobs",
        ];
    }
}
```

### Metrics Collection

```php
// Dispatch with metrics
class ProcessOrderWithMetrics implements ShouldQueue
{
    public function handle(): void
    {
        $startTime = microtime(true);

        try {
            // Process order
            $this->processOrder();

            // Record success metric
            Metric::increment('jobs.processed');
            Metric::timing('jobs.duration', microtime(true) - $startTime);
        } catch (\Throwable $e) {
            Metric::increment('jobs.failed');
            throw $e;
        }
    }
}
```

---

## Best Practices

### Do's

- ✅ Make jobs idempotent
- ✅ Use unique job constraints for duplicate prevention
- ✅ Configure appropriate timeouts
- ✅ Implement failed() method for cleanup
- ✅ Use exponential backoff
- ✅ Chunk large datasets
- ✅ Monitor queue metrics

### Don'ts

- ❌ Store full Eloquent models in job payload
- ❌ Ignore rate limits for external APIs
- ❌ Skip error handling
- ❌ Use synchronous jobs in production for slow operations
- ❌ Forget to index job tables

---

## Troubleshooting

### Jobs Not Processing

1. Check Horizon is running: `php artisan horizon:status`
2. Check Redis connection: `php artisan tinker` → `Redis::ping()`
3. Check worker logs: `storage/logs/horizon.log`
4. Restart workers: `php artisan horizon:terminate`

### Memory Issues

1. Use `cursor()` instead of `get()` for large datasets
2. Call `gc_collect_cycles()` periodically
3. Limit worker jobs: `maxJobs` in config
4. Set appropriate `memory` limit

### Failed Jobs

1. View failed jobs: `php artisan queue:failed`
2. Retry specific job: `php artisan queue:retry [id]`
3. Retry all: `php artisan queue:retry all`
4. Clear failed: `php artisan queue:flush`

---

## Related Agents

- `queue-job-reviewer` - Reviews queue job implementations
- `laravel-reviewer` - General Laravel code review
- `performance-oracle` - Performance analysis
