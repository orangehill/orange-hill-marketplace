# Google Workspace CLI Setup Guide

## Prerequisites

- macOS with Homebrew
- A Google account (personal Gmail or Google Workspace)
- A Google Cloud project with OAuth credentials

## Step 1: Install gogcli

```bash
brew install steipete/tap/gogcli
```

Verify installation:

```bash
gog --version
```

## Step 2: Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the APIs you need:
   - Gmail API
   - Google Calendar API
   - Google Drive API
   - Google Sheets API
   - Google Docs API
   - Google Slides API
   - People API (for Contacts)
   - Tasks API
   - Any other APIs you plan to use
4. Go to **APIs & Services > Credentials**
5. Click **Create Credentials > OAuth client ID**
6. Select **Desktop app** as the application type
7. Download the `client_secret.json` file

## Step 3: Register Credentials with gog

```bash
gog auth credentials ~/Downloads/client_secret.json
```

This stores the OAuth client configuration securely in the OS keychain.

## Step 4: Add Google Accounts

### Add with all services

```bash
gog auth add user@gmail.com --services all
```

### Add with specific services only

```bash
gog auth add user@gmail.com --services gmail,calendar,drive,sheets,docs
```

### Add a second account

```bash
gog auth add other@gmail.com --services all
```

Each `auth add` opens a browser window for OAuth consent. You'll need to grant permissions for the requested services.

### Available services

`gmail`, `calendar`, `drive`, `docs`, `sheets`, `slides`, `contacts`, `tasks`, `forms`, `chat`, `classroom`, `people`, `keep`, `groups`, `admin`, `appscript`

## Step 5: Verify Setup

```bash
# List configured accounts
gog auth list --json

# Check token validity
gog auth list --check --json

# Quick test
gog gmail search 'newer_than:1d' --max 1 --json --no-input
```

## Step 6: Set Up Account Aliases (Optional)

Create short aliases for frequently used accounts:

```bash
gog auth alias set oh orangehillconsulting@gmail.com
gog auth alias set ss smartstatsapp@gmail.com
```

Then use `--account oh` instead of the full email.

## Multi-Account Usage

### Using --account flag

```bash
gog gmail search 'is:unread' --account orangehillconsulting@gmail.com --json --no-input
gog calendar events primary --account smartstatsapp@gmail.com --json --no-input
```

### Using GOG_ACCOUNT environment variable

```bash
export GOG_ACCOUNT=orangehillconsulting@gmail.com
gog gmail search 'is:unread' --json --no-input
```

### Using aliases

```bash
gog gmail search 'is:unread' --account oh --json --no-input
```

## Service Account Setup (Workspace Only)

For Workspace-only APIs (Keep, Groups, Admin) or server-side automation:

1. Create a service account in Google Cloud Console
2. Enable domain-wide delegation in the admin console
3. Configure with gog:

```bash
gog auth service-account set user@domain.com --key ./service-account-key.json
```

### Required admin console steps

1. Go to [Google Workspace Admin](https://admin.google.com/)
2. Navigate to **Security > API Controls > Domain-wide Delegation**
3. Add the service account's client ID
4. Grant the OAuth scopes needed for your services

## Troubleshooting

### Token expired

```
Error: token expired
```

Re-authenticate the account:

```bash
gog auth add user@gmail.com --force-consent
```

### Insufficient scopes

```
Error: insufficient scopes for this operation
```

Re-authenticate with the needed services:

```bash
gog auth add user@gmail.com --services gmail,calendar,drive --force-consent
```

### No credentials found

```
Error: no credentials configured
```

Register your OAuth client first:

```bash
gog auth credentials ~/Downloads/client_secret.json
```

### Rate limit exceeded

```
Error: rate limit exceeded
```

Reduce the `--max` parameter and add delays between requests. Google API quotas:
- Gmail: 250 quota units per second
- Calendar: 500 requests per 100 seconds
- Drive: 1000 requests per 100 seconds

### Headless/SSH authentication

If you need to authenticate on a machine without a browser:

1. Run `gog auth add` on a machine with a browser
2. Copy the keychain entry to the headless machine
3. Or use a service account instead

### Command hangs

If a command hangs, it's likely waiting for input. Always use `--no-input` and `--force` flags to prevent interactive prompts.

### API not enabled

```
Error: API has not been used in project X before or it is disabled
```

Enable the API in [Google Cloud Console](https://console.cloud.google.com/apis/library):
1. Search for the API name (e.g., "Gmail API")
2. Click **Enable**
3. Wait a few minutes for propagation

### Permission denied

For Workspace accounts, the admin may need to:
1. Enable API access for the user
2. Allow the OAuth app in the admin console
3. Grant the necessary organizational unit permissions
