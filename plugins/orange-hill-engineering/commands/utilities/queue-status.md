---
name: queue-status
description: Check Laravel Horizon queue health, pending jobs, and worker status
argument-hint: "[--watch|--failed|--metrics]"
---

# Queue Status Command

Monitor Laravel Horizon queue health, check pending jobs, and analyze worker performance.

## Usage

```bash
/queue-status                # Quick status overview
/queue-status --watch        # Continuous monitoring
/queue-status --failed       # Show failed jobs
/queue-status --metrics      # Detailed performance metrics
/queue-status --queue=high   # Status of specific queue
```

## Status Overview

### Quick Status Check

```bash
php artisan horizon:status
php artisan queue:monitor redis:default,redis:high --max=100
```

**Output format:**
```
🚦 QUEUE STATUS

Horizon: Running ✅
Workers: 8 active

Queues:
  high     │ 12 pending │ 0 failed │ 156/min throughput
  default  │ 45 pending │ 2 failed │ 89/min throughput
  low      │ 234 pending│ 0 failed │ 23/min throughput

Recent Activity (last 5 min):
  ✅ 423 jobs completed
  ❌ 2 jobs failed
  ⏱️  Avg wait time: 1.2s

Status: HEALTHY
```

### Failed Jobs Analysis

```bash
php artisan queue:failed
```

**Output format:**
```
❌ FAILED JOBS (2)

1. ProcessOrder #12345
   Queue: high
   Failed: 2024-01-15 10:23:45 (15 min ago)
   Attempts: 3/3
   Error: PaymentGatewayException: Card declined

   Job payload:
   - order_id: 12345
   - amount: 99.99

   Actions: [Retry] [Delete] [View Details]

2. SendNotification #67890
   Queue: default
   Failed: 2024-01-15 10:20:12 (18 min ago)
   Attempts: 3/3
   Error: Connection timeout to SMTP server

   Actions: [Retry] [Delete] [View Details]

Quick Actions:
  /queue-status --retry-all    # Retry all failed jobs
  /queue-status --flush-failed # Clear all failed jobs
```

### Performance Metrics

```bash
# Via Horizon API or Redis
```

**Output format:**
```
📊 QUEUE METRICS (Last Hour)

Throughput:
  Total Jobs:      2,456
  Peak:            312/min at 10:15
  Current:         89/min
  Avg Processing:  145ms

Wait Times:
  high:     0.3s avg │ 1.2s max
  default:  1.1s avg │ 4.5s max
  low:      8.2s avg │ 45s max

Worker Utilization:
  ████████░░ 80% (8/10 workers active)

Memory Usage:
  Worker 1: 89MB / 128MB
  Worker 2: 92MB / 128MB
  Worker 3: 78MB / 128MB
  ...

Recommendations:
  ⚠️  'low' queue wait time is high
     Consider: Increase workers or move jobs to 'default'
```

## Common Operations

### Retry Failed Jobs

```bash
# Retry specific job
php artisan queue:retry [job-id]

# Retry all failed jobs
php artisan queue:retry all

# Retry jobs from specific queue
php artisan queue:retry --queue=high
```

### Clear Queues

```bash
# Clear specific queue (USE WITH CAUTION)
php artisan queue:clear redis --queue=default

# Flush all failed jobs
php artisan queue:flush
```

### Worker Management

```bash
# Restart workers (graceful)
php artisan horizon:terminate

# Pause processing
php artisan horizon:pause

# Resume processing
php artisan horizon:continue
```

## Health Checks

### Automated Health Report

```
🏥 QUEUE HEALTH CHECK

Core Systems:
  ✅ Redis connection: OK (1ms latency)
  ✅ Horizon supervisor: Running
  ✅ Workers: 8/8 healthy

Queue Health:
  ✅ high:    Healthy (12 pending, 0 failed)
  ✅ default: Healthy (45 pending, 2 failed)
  ⚠️  low:    Backlog (234 pending, growing)

Alerts:
  ⚠️  'low' queue backlog increasing
     - 234 jobs pending (was 180 an hour ago)
     - Estimated clear time: 45 minutes
     - Consider: Scale workers or investigate slow jobs

Failed Job Patterns:
  ⚠️  2 failures in last hour for SendNotification
     - All failures: SMTP connection timeout
     - Check: Mail server connectivity
```

### Alert Thresholds

Configure alerts for:

| Metric | Warning | Critical |
|--------|---------|----------|
| Queue Size | >100 | >500 |
| Wait Time | >30s | >120s |
| Failed/Hour | >5 | >20 |
| Worker Memory | >100MB | >120MB |

## Integration Points

### Pre-Deployment Check

Before deploying code that affects jobs:

```
/queue-status --pre-deploy

📋 PRE-DEPLOYMENT CHECK

Queue State:
  ⚠️  45 pending jobs in 'default' queue
  ℹ️  No jobs running for affected classes

Recommendations:
  1. Wait for ProcessOrder jobs to complete (12 pending)
  2. Or proceed - changes are backwards compatible

Safe to deploy: YES (with caution)
```

### With Migration Check

Before running migrations:

```
/migrate-check + /queue-status

⚠️  QUEUE CONSIDERATION

Pending migration affects 'orders' table.
Currently 23 jobs reference Order model.

Recommendations:
  1. Let pending jobs complete (est. 2 min)
  2. Or enable maintenance mode first
```

## Troubleshooting

### High Memory Workers

```bash
# Identify memory-heavy jobs
php artisan horizon:snapshot

# Restart workers periodically
# In Supervisor config:
# max_jobs=1000
```

### Stuck Jobs

```bash
# Find long-running jobs
php artisan tinker
>>> \DB::table('jobs')->where('reserved_at', '<', now()->subMinutes(30))->get();
```

### Queue Not Processing

```
❌ QUEUE ISSUE DETECTED

Symptoms:
  - Jobs not being processed
  - Queue size increasing

Checks:
  1. ✅ Redis: Connected
  2. ❌ Horizon: Not running
  3. ⚠️  Workers: 0 active

Fix:
  php artisan horizon
  # or
  supervisorctl start horizon
```

## Related Commands

- `/test-laravel` - Run tests including queue tests
- `/migrate-check` - Check migrations before running
- `/workflows:work` - Full implementation workflow
