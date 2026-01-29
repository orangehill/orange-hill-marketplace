# Job Patterns Reference

Detailed patterns for Laravel queue job implementation.

## Job Batching

Process multiple jobs as a batch with callbacks:

```php
use Illuminate\Bus\Batch;
use Illuminate\Support\Facades\Bus;

$batch = Bus::batch([
    new ProcessImage($image1),
    new ProcessImage($image2),
    new ProcessImage($image3),
])
->then(function (Batch $batch) {
    // All jobs completed successfully
    ProcessingComplete::dispatch($batch->id);
})
->catch(function (Batch $batch, \Throwable $e) {
    // First batch job failure detected
    Log::error('Batch failed', ['batch' => $batch->id, 'error' => $e->getMessage()]);
})
->finally(function (Batch $batch) {
    // Batch finished executing (success or fail)
    CleanupBatch::dispatch($batch->id);
})
->name('Process Images')
->allowFailures()
->dispatch();

// Check batch progress
$batch = Bus::findBatch($batchId);
echo $batch->progress(); // 0-100
```

## Job Chaining

Execute jobs sequentially:

```php
Bus::chain([
    new ValidateFile($file),
    new ProcessFile($file),
    new NotifyUser($user),
    new CleanupTempFiles($file),
])->catch(function (\Throwable $e) {
    // Handle chain failure
})->dispatch();
```

## Rate Limited Jobs

Respect external API rate limits:

```php
class CallExternalApi implements ShouldQueue
{
    public function handle(): void
    {
        Redis::throttle('external-api')
            ->block(0)  // Don't wait if rate limited
            ->allow(100)  // 100 requests
            ->every(60)  // Per minute
            ->then(function () {
                // Make API call
                $this->callApi();
            }, function () {
                // Rate limited - release back to queue
                $this->release(10);
            });
    }
}
```

## Unique Jobs

Prevent duplicate job processing:

```php
class ProcessOrder implements ShouldQueue, ShouldBeUnique
{
    public function __construct(
        private Order $order
    ) {}

    public function uniqueId(): string
    {
        return (string) $this->order->id;
    }

    // Optional: How long to maintain uniqueness
    public int $uniqueFor = 3600;

    // Optional: Custom unique lock logic
    public function uniqueVia(): Repository
    {
        return Cache::driver('redis');
    }
}
```

## Job Middleware

Apply cross-cutting concerns:

```php
// RateLimited middleware
class RateLimited
{
    public function handle($job, $next): void
    {
        Redis::throttle('jobs')
            ->allow(100)
            ->every(60)
            ->then(function () use ($job, $next) {
                $next($job);
            }, function () use ($job) {
                $job->release(30);
            });
    }
}

// Without Overlap middleware
class WithoutOverlapping
{
    public function handle($job, $next): void
    {
        $lock = Cache::lock('job-' . $job->uniqueId(), 60);

        if ($lock->get()) {
            try {
                $next($job);
            } finally {
                $lock->release();
            }
        } else {
            $job->release(10);
        }
    }
}

// Usage
class ProcessOrder implements ShouldQueue
{
    public function middleware(): array
    {
        return [
            new RateLimited,
            new WithoutOverlapping,
        ];
    }
}
```

## Encrypted Jobs

Secure sensitive data:

```php
class ProcessSensitiveData implements ShouldQueue, ShouldBeEncrypted
{
    public function __construct(
        private string $creditCardNumber,
        private string $ssn
    ) {}

    public function handle(): void
    {
        // Data is automatically decrypted
        // Process sensitive data
    }
}
```

## Job Events

Listen to job lifecycle:

```php
// In EventServiceProvider
protected $listen = [
    JobProcessing::class => [
        LogJobStarted::class,
    ],
    JobProcessed::class => [
        LogJobCompleted::class,
    ],
    JobFailed::class => [
        NotifyJobFailed::class,
    ],
    JobExceptionOccurred::class => [
        LogJobException::class,
    ],
];
```

## Chunked Processing

Handle large datasets efficiently:

```php
class ProcessLargeDataset implements ShouldQueue
{
    public int $timeout = 600;

    public function handle(): void
    {
        $processed = 0;

        User::where('needs_processing', true)
            ->cursor()
            ->each(function (User $user) use (&$processed) {
                $this->processUser($user);

                $processed++;

                // Garbage collection every 1000 items
                if ($processed % 1000 === 0) {
                    gc_collect_cycles();
                }
            });
    }
}
```

## Conditional Dispatch

Dispatch based on conditions:

```php
// Dispatch if condition is true
ProcessOrder::dispatchIf($order->isPaid(), $order);

// Dispatch unless condition is true
SendReminder::dispatchUnless($user->optedOut(), $user);

// Dispatch after response is sent
ProcessOrder::dispatchAfterResponse($order);
```

## Queue Connections

Use different queue connections:

```php
// Send to specific connection
ProcessOrder::dispatch($order)->onConnection('sqs');

// Send to specific queue
ProcessOrder::dispatch($order)->onQueue('high');

// Delay execution
ProcessOrder::dispatch($order)->delay(now()->addMinutes(10));

// Chain with connection
Bus::chain([...])->onConnection('redis')->onQueue('batch')->dispatch();
```
