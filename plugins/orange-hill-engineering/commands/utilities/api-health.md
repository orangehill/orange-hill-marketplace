---
name: api-health
description: Check external API health, connectivity, and response times
argument-hint: "[api-name|--all|--verbose]"
---

# API Health Command

Check the health and connectivity of external APIs used by your project.

## Usage

```bash
/api-health                     # Check all configured APIs
/api-health stripe              # Check specific API
/api-health --verbose           # Detailed response info
/api-health --timeout=5000      # Custom timeout (ms)
```

## Configuration

Create `.api-health.json` in your project root:

```json
{
  "apis": [
    {
      "name": "stripe",
      "url": "https://api.stripe.com/v1/charges",
      "method": "GET",
      "headers": {
        "Authorization": "Bearer $STRIPE_SECRET_KEY"
      },
      "expectedStatus": 401,
      "timeout": 5000
    },
    {
      "name": "backend",
      "url": "$API_BASE_URL/health",
      "method": "GET",
      "expectedStatus": 200,
      "expectedBody": { "status": "ok" }
    },
    {
      "name": "photoncms",
      "url": "$PHOTONCMS_URL/api/v1/ping",
      "method": "GET",
      "expectedStatus": 200
    }
  ]
}
```

## Execution Flow

### 1. Load Configuration

```bash
# Read config file
if [ -f ".api-health.json" ]; then
    CONFIG=$(cat .api-health.json)
else
    echo "No .api-health.json found. Creating template..."
fi
```

### 2. Run Health Checks

For each configured API:
1. Substitute environment variables
2. Make HTTP request with timeout
3. Verify status code
4. Optionally verify response body
5. Record response time

### 3. Output Results

**Success:**
```
🏥 API HEALTH CHECK

✅ stripe          200ms   OK (401 expected - auth required)
✅ backend         45ms    OK (200)
✅ photoncms       120ms   OK (200)

All APIs healthy (3/3)
```

**Failure:**
```
🏥 API HEALTH CHECK

✅ stripe          200ms   OK
❌ backend         5000ms  TIMEOUT
⚠️ photoncms       350ms   DEGRADED (slow response)

Issues detected:
1. backend: Connection timeout after 5000ms
   - Check if server is running
   - Verify API_BASE_URL environment variable

2. photoncms: Response time 350ms (threshold: 300ms)
   - API responding but slower than expected
   - Consider checking server load

Status: 1 FAILED, 1 DEGRADED, 1 OK
```

## Health Check Patterns

### Basic Availability

```json
{
  "name": "api",
  "url": "https://api.example.com/health",
  "expectedStatus": 200
}
```

### Auth Endpoint (Expect 401)

```json
{
  "name": "auth-api",
  "url": "https://api.example.com/protected",
  "expectedStatus": 401
}
```

### Response Body Validation

```json
{
  "name": "backend",
  "url": "https://api.example.com/health",
  "expectedStatus": 200,
  "expectedBody": {
    "status": "healthy",
    "database": "connected"
  }
}
```

### Multiple Endpoints

```json
{
  "name": "microservices",
  "endpoints": [
    { "url": "https://users.api.com/health" },
    { "url": "https://orders.api.com/health" },
    { "url": "https://payments.api.com/health" }
  ]
}
```

## Environment Variables

Reference environment variables with `$VAR_NAME`:

```json
{
  "url": "$API_BASE_URL/health",
  "headers": {
    "Authorization": "Bearer $API_TOKEN"
  }
}
```

## Thresholds

Configure response time thresholds:

```json
{
  "thresholds": {
    "fast": 100,
    "acceptable": 300,
    "slow": 1000
  }
}
```

Output uses thresholds:
- ✅ < 100ms: Fast
- ✅ < 300ms: Acceptable
- ⚠️ < 1000ms: Slow (warning)
- ❌ > 1000ms: Critical

## Integration Points

### Pre-Deployment

```bash
# Run before deployment
/api-health --all || exit 1
```

### CI/CD Pipeline

```yaml
- name: Check API Health
  run: |
    claude /api-health --all
```

### With Review Command

The `/workflows:review` command can trigger `/api-health` when API changes are detected.

## Troubleshooting

### Common Issues

**Connection Refused:**
```
❌ backend: Connection refused
   - Server not running
   - Wrong port
   - Firewall blocking
```

**DNS Resolution Failed:**
```
❌ api: getaddrinfo ENOTFOUND api.example.com
   - Domain doesn't exist
   - DNS misconfigured
   - Network issues
```

**SSL Certificate Error:**
```
❌ api: SSL certificate problem
   - Expired certificate
   - Self-signed cert (add allowInsecure: true for dev)
```

**Timeout:**
```
❌ api: Timeout after 5000ms
   - Server overloaded
   - Network latency
   - Increase timeout if expected
```

## Related Commands

- `/test-laravel` - Laravel tests
- `/test-nextjs` - Next.js tests
- `/queue-status` - Queue health
