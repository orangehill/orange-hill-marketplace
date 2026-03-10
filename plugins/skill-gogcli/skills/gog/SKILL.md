---
name: gog
description: >
  Google Workspace CLI — gmail, email, inbox, calendar, events, meetings,
  drive, files, docs, documents, sheets, spreadsheets, slides, presentations,
  contacts, address book, tasks, todo, forms, chat, groups, people, keep,
  classroom, admin, appscript, google workspace
allowed-tools:
  - Bash(gog *)
  - Bash(which gog)
  - Bash(brew install steipete/tap/gogcli)
  - Bash(brew upgrade gogcli)
---

# Google Workspace CLI (gog)

You have access to Google Workspace services via the `gog` CLI (gogcli).

## Prerequisite Check

Before running any gog command, verify it's installed:

```bash
which gog
```

If not found, install it:

```bash
brew install steipete/tap/gogcli
```

Then check authentication:

```bash
gog auth list --json
```

If no accounts are configured, tell the user to run the setup script:
`bash plugins/built/skill-gogcli/scripts/setup.sh`

## Global Conventions

**Always follow these rules for every gog command:**

1. **Always use `--json`** for machine-readable output. Parse results with `jq`.
2. **Always use `--no-input`** to prevent interactive prompts that would hang.
3. **Always use `--force`** when creating or modifying resources to skip confirmation prompts.
4. **Combine flags**: `gog <service> <command> --json --no-input`
5. **Error handling**: Check exit codes. Non-zero means failure — read stderr for details.
6. **Help**: Use `gog <service> <command> --help` to discover flags for any command.

## Safety Rules

**Require explicit user confirmation before:**

- Sending emails (`gog gmail send`)
- Deleting anything (`gog gmail trash`, `gog drive delete`, `gog calendar delete`)
- Sharing files or changing permissions (`gog drive share`)
- Creating calendar events that invite others
- Batch operations affecting multiple items
- Any operation with `--force` that modifies data

**Always safe (no confirmation needed):**

- Search, list, read, get, download, export operations
- Checking auth status
- Listing labels, calendars, task lists

## Multi-Account Support

### Discovering accounts

Always discover configured accounts dynamically:

```bash
gog auth list --json --no-input
```

This returns all accounts with their emails and authorized services.

### Adding more services

Each account may only have a subset of services authorized. If a user requests a service that isn't authorized for their account (e.g., Drive, Sheets, Docs), they can add it:

```bash
gog auth add user@example.com --services gmail,calendar,drive,sheets,docs --force-consent
```

All available services: `gmail`, `calendar`, `drive`, `docs`, `sheets`, `slides`, `contacts`, `tasks`, `forms`, `chat`, `classroom`, `people`, `keep`, `groups`, `admin`, `appscript`. Use `--services all` to authorize everything.

### Using accounts

Specify the account with `--account`:

```bash
gog gmail search 'is:unread' --account user@example.com --json --no-input
gog calendar events primary --account user@example.com --json --no-input
```

### Default behavior

If multiple accounts are configured and the user doesn't specify which one, list the available accounts and ask. If context makes it obvious (e.g., the user mentions a company name matching an account domain), use the appropriate account.

## Service Quick Reference

### Gmail

```bash
# Search emails (supports Gmail search syntax)
gog gmail search 'is:unread newer_than:7d' --max 20 --json --no-input

# Read a specific thread
gog gmail thread <threadId> --json --no-input

# Send an email (REQUIRES USER CONFIRMATION)
gog gmail send --to user@example.com --subject "Subject" --body "Body text" --json --no-input --force

# Reply to a thread (REQUIRES USER CONFIRMATION)
gog gmail reply <threadId> --body "Reply text" --json --no-input --force

# List labels
gog gmail labels list --json --no-input

# Apply/remove labels
gog gmail label <messageId> --add LABEL_NAME --json --no-input
gog gmail label <messageId> --remove LABEL_NAME --json --no-input

# Trash a message (REQUIRES USER CONFIRMATION)
gog gmail trash <messageId> --json --no-input --force
```

**Gmail search operators**: `from:`, `to:`, `subject:`, `is:unread`, `is:starred`, `has:attachment`, `newer_than:`, `older_than:`, `label:`, `in:sent`, `in:drafts`, `filename:`.

### Calendar

```bash
# List today's events
gog calendar events primary --from $(date -u +%Y-%m-%dT00:00:00Z) --to $(date -u +%Y-%m-%dT23:59:59Z) --json --no-input

# List events in a date range
gog calendar events primary --from 2026-03-10T00:00:00Z --to 2026-03-17T23:59:59Z --json --no-input

# List all calendars
gog calendar calendars --json --no-input

# Create an event (REQUIRES USER CONFIRMATION if attendees included)
gog calendar create primary --summary "Meeting" --from 2026-03-10T14:00:00Z --to 2026-03-10T15:00:00Z --json --no-input --force

# Create event with attendees (REQUIRES USER CONFIRMATION)
gog calendar create primary --summary "Meeting" --from <RFC3339> --to <RFC3339> --attendee user@example.com --json --no-input --force

# Delete an event (REQUIRES USER CONFIRMATION)
gog calendar delete primary <eventId> --json --no-input --force

# Free/busy check
gog calendar freebusy --from <RFC3339> --to <RFC3339> --json --no-input
```

**Date format**: Always RFC 3339 (`2026-03-10T14:00:00Z` or with timezone offset `2026-03-10T14:00:00+01:00`).

### Drive

```bash
# List files in root
gog drive ls --json --no-input

# List files in a folder
gog drive ls --parent <folderId> --json --no-input

# Search files
gog drive search "quarterly report" --json --no-input

# Search by type
gog drive ls --query "mimeType='application/pdf'" --max 10 --json --no-input

# Download a file
gog drive download <fileId> --out ./filename.pdf --no-input

# Upload a file (REQUIRES USER CONFIRMATION for shared drives)
gog drive upload ./file.pdf --parent <folderId> --json --no-input --force

# Share a file (REQUIRES USER CONFIRMATION)
gog drive share <fileId> --email user@example.com --role reader --json --no-input --force

# Get file metadata
gog drive info <fileId> --json --no-input
```

### Docs

```bash
# Read document content
gog docs cat <docId> --no-input

# Export to different format
gog docs export <docId> --format docx --out ./document.docx --no-input
gog docs export <docId> --format pdf --out ./document.pdf --no-input

# Create a new document (REQUIRES USER CONFIRMATION)
gog docs create --title "New Document" --json --no-input --force
```

### Sheets

```bash
# Read a range
gog sheets get <spreadsheetId> 'Sheet1!A1:D10' --json --no-input

# Read entire sheet
gog sheets get <spreadsheetId> 'Sheet1' --json --no-input

# Update cells (REQUIRES USER CONFIRMATION)
gog sheets update <spreadsheetId> 'Sheet1!A1:B2' --values '[["a","b"],["c","d"]]' --json --no-input --force

# Append rows (REQUIRES USER CONFIRMATION)
gog sheets append <spreadsheetId> 'Sheet1' --values '[["new","row"]]' --json --no-input --force

# List sheet tabs
gog sheets tabs <spreadsheetId> --json --no-input

# Export spreadsheet
gog sheets export <spreadsheetId> --format csv --out ./data.csv --no-input
```

### Contacts

```bash
# Search contacts
gog contacts search "John" --json --no-input

# List contacts
gog contacts list --max 50 --json --no-input

# Directory search (Workspace)
gog people search "Jane" --json --no-input
```

### Tasks

```bash
# List task lists
gog tasks lists --json --no-input

# List tasks in a list
gog tasks list <tasklistId> --json --no-input

# Add a task (REQUIRES USER CONFIRMATION)
gog tasks add <tasklistId> --title "Do something" --json --no-input --force

# Add task with due date
gog tasks add <tasklistId> --title "Do something" --due 2026-03-15T00:00:00Z --json --no-input --force

# Complete a task (REQUIRES USER CONFIRMATION)
gog tasks done <tasklistId> <taskId> --json --no-input --force
```

### Slides

```bash
# Export presentation
gog slides export <presentationId> --format pptx --out ./deck.pptx --no-input

# Create presentation (REQUIRES USER CONFIRMATION)
gog slides create --title "New Deck" --json --no-input --force
```

### Forms, Chat, Keep, Groups, Classroom, Admin

For less common services, use `gog <service> --help` to discover commands. Key patterns:

```bash
# Forms
gog forms get <formId> --json --no-input
gog forms responses <formId> --json --no-input

# Chat
gog chat spaces --json --no-input
gog chat send <spaceName> --text "Hello" --json --no-input --force

# Keep (Workspace only)
gog keep list --json --no-input
gog keep get <noteId> --json --no-input

# Groups (Workspace only)
gog groups list --json --no-input
gog groups members <groupId> --json --no-input

# Classroom
gog classroom courses --json --no-input

# Admin (Workspace only)
gog admin users --json --no-input
```

## Error Handling

| Error | Cause | Fix |
|-------|-------|-----|
| `token expired` | OAuth token needs refresh | `gog auth add <email> --force-consent` |
| `insufficient scopes` | Missing API permissions | Re-auth with needed services: `gog auth add <email> --services gmail,calendar` |
| `not found` | Invalid ID or no access | Verify the resource ID and account permissions |
| `rate limit` | Too many API calls | Wait and retry; reduce `--max` values |
| `no credentials` | Missing client_secret.json | Run `gog auth credentials <path>` first |

When an auth error occurs, suggest the user run: `bash plugins/built/skill-gogcli/scripts/setup.sh`

## References

For detailed command reference by service, read: `plugins/built/skill-gogcli/skills/gog/references/commands.md`

For OAuth setup and troubleshooting, read: `plugins/built/skill-gogcli/skills/gog/references/setup.md`
