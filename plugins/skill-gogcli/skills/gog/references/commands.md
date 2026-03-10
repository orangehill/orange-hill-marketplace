# gog Command Reference

Complete command reference organized by service. All examples use `--json --no-input` flags.

## Global Flags

| Flag | Description |
|------|-------------|
| `--json` | JSON output for scripting |
| `--plain` | Tab-separated values for piping |
| `--account <email>` | Specify which account to use |
| `--no-input` | Non-interactive mode (never prompt) |
| `--force` | Skip confirmation prompts |
| `--readonly` | Request read-only scopes only |
| `--max <n>` | Limit number of results |
| `--help` | Show command help |

## Auth

```bash
# List configured accounts
gog auth list --json

# Check token validity
gog auth list --check --json

# Add a new account (interactive -- do NOT use --no-input here)
gog auth add user@gmail.com

# Add with specific services
gog auth add user@gmail.com --services gmail,calendar,drive

# Re-authorize with forced consent (refreshes scopes)
gog auth add user@gmail.com --force-consent

# Store OAuth client credentials
gog auth credentials ~/Downloads/client_secret.json

# Set up a service account (Workspace)
gog auth service-account set user@domain.com --key ./service-account.json

# Create account alias
gog auth alias set myalias user@gmail.com

# Remove an account
gog auth remove user@gmail.com

# Manage credentials interactively
gog auth manage
```

## Gmail

### Search

```bash
# Basic search
gog gmail search 'is:unread' --max 20 --json --no-input

# Complex search
gog gmail search 'from:boss@company.com newer_than:3d has:attachment' --max 10 --json --no-input

# Search with account
gog gmail search 'label:important' --account user@gmail.com --max 50 --json --no-input
```

**Search operators**: `from:`, `to:`, `cc:`, `bcc:`, `subject:`, `is:unread`, `is:read`, `is:starred`, `is:important`, `has:attachment`, `filename:`, `newer_than:`, `older_than:`, `after:`, `before:`, `label:`, `in:sent`, `in:drafts`, `in:trash`, `in:spam`, `category:`, `size:`, `larger:`, `smaller:`.

### Read

```bash
# Read a thread (full messages)
gog gmail thread <threadId> --json --no-input

# Read a specific message
gog gmail message <messageId> --json --no-input
```

### Send

```bash
# Send a plain text email
gog gmail send --to recipient@example.com --subject "Subject line" --body "Email body" --json --no-input --force

# Send with CC/BCC
gog gmail send --to a@example.com --cc b@example.com --bcc c@example.com --subject "Subject" --body "Body" --json --no-input --force

# Reply to a thread
gog gmail reply <threadId> --body "Reply text" --json --no-input --force

# Forward a message
gog gmail forward <messageId> --to recipient@example.com --json --no-input --force
```

### Labels

```bash
# List all labels
gog gmail labels list --json --no-input

# Create a label
gog gmail labels create "My Label" --json --no-input --force

# Apply label to message
gog gmail label <messageId> --add "LABEL_NAME" --json --no-input

# Remove label from message
gog gmail label <messageId> --remove "LABEL_NAME" --json --no-input

# Mark as read
gog gmail label <messageId> --remove "UNREAD" --json --no-input

# Star a message
gog gmail label <messageId> --add "STARRED" --json --no-input
```

### Drafts

```bash
# List drafts
gog gmail drafts list --json --no-input

# Create a draft
gog gmail drafts create --to user@example.com --subject "Draft" --body "Content" --json --no-input --force
```

### Other

```bash
# Trash a message
gog gmail trash <messageId> --json --no-input --force

# Get Gmail profile
gog gmail profile --json --no-input

# List filters
gog gmail filters list --json --no-input
```

## Calendar

### Events

```bash
# List today's events
gog calendar events primary --from $(date -u +%Y-%m-%dT00:00:00Z) --to $(date -u +%Y-%m-%dT23:59:59Z) --json --no-input

# List this week's events
gog calendar events primary --from 2026-03-10T00:00:00Z --to 2026-03-17T23:59:59Z --json --no-input

# List events from a specific calendar
gog calendar events <calendarId> --from <RFC3339> --to <RFC3339> --json --no-input

# Get a single event
gog calendar event primary <eventId> --json --no-input
```

### Create & Modify

```bash
# Create a simple event
gog calendar create primary --summary "Team Standup" --from 2026-03-10T09:00:00Z --to 2026-03-10T09:30:00Z --json --no-input --force

# Create with location and description
gog calendar create primary --summary "Lunch" --from 2026-03-10T12:00:00Z --to 2026-03-10T13:00:00Z --location "Cafe Roma" --description "Weekly lunch" --json --no-input --force

# Create with attendees
gog calendar create primary --summary "Meeting" --from 2026-03-10T14:00:00Z --to 2026-03-10T15:00:00Z --attendee alice@example.com --attendee bob@example.com --json --no-input --force

# Delete an event
gog calendar delete primary <eventId> --json --no-input --force

# Update an event
gog calendar update primary <eventId> --summary "New Title" --json --no-input --force
```

### Other

```bash
# List calendars
gog calendar calendars --json --no-input

# Free/busy check
gog calendar freebusy --from 2026-03-10T00:00:00Z --to 2026-03-10T23:59:59Z --json --no-input
```

## Drive

### List & Search

```bash
# List files in root (My Drive)
gog drive ls --json --no-input

# List files in a folder
gog drive ls --parent <folderId> --json --no-input

# Search by name
gog drive search "quarterly report" --json --no-input

# Search by MIME type
gog drive ls --query "mimeType='application/pdf'" --max 10 --json --no-input

# Search in shared drives
gog drive ls --shared --json --no-input

# Get file metadata
gog drive info <fileId> --json --no-input
```

### Download & Export

```bash
# Download a file
gog drive download <fileId> --out ./filename.pdf --no-input

# Download to specific directory
gog drive download <fileId> --out ./downloads/ --no-input
```

### Upload

```bash
# Upload a file
gog drive upload ./file.pdf --json --no-input --force

# Upload to a specific folder
gog drive upload ./file.pdf --parent <folderId> --json --no-input --force

# Upload with a custom name
gog drive upload ./local-file.pdf --name "Remote Name.pdf" --json --no-input --force
```

### Permissions

```bash
# Share with a user (reader)
gog drive share <fileId> --email user@example.com --role reader --json --no-input --force

# Share with a user (writer)
gog drive share <fileId> --email user@example.com --role writer --json --no-input --force

# Share with anyone (link sharing)
gog drive share <fileId> --anyone --role reader --json --no-input --force

# List permissions
gog drive permissions <fileId> --json --no-input

# Remove permission
gog drive unshare <fileId> --permission <permissionId> --json --no-input --force
```

### Folders

```bash
# Create a folder
gog drive mkdir "New Folder" --json --no-input --force

# Create a folder inside another folder
gog drive mkdir "Subfolder" --parent <folderId> --json --no-input --force
```

### Delete

```bash
# Move to trash
gog drive trash <fileId> --json --no-input --force

# Delete permanently
gog drive delete <fileId> --json --no-input --force
```

## Docs

```bash
# Read document as plain text
gog docs cat <docId> --no-input

# Export as DOCX
gog docs export <docId> --format docx --out ./document.docx --no-input

# Export as PDF
gog docs export <docId> --format pdf --out ./document.pdf --no-input

# Export as Markdown
gog docs export <docId> --format md --out ./document.md --no-input

# Create a new document
gog docs create --title "New Document" --json --no-input --force

# Copy a document
gog docs copy <docId> --title "Copy of Document" --json --no-input --force
```

## Sheets

### Read

```bash
# Read a specific range
gog sheets get <spreadsheetId> 'Sheet1!A1:D10' --json --no-input

# Read an entire sheet
gog sheets get <spreadsheetId> 'Sheet1' --json --no-input

# List sheet tabs
gog sheets tabs <spreadsheetId> --json --no-input

# Get spreadsheet metadata
gog sheets info <spreadsheetId> --json --no-input
```

### Write

```bash
# Update a range (2D array of values)
gog sheets update <spreadsheetId> 'Sheet1!A1:B2' --values '[["Name","Score"],["Alice","95"]]' --json --no-input --force

# Append rows to end of data
gog sheets append <spreadsheetId> 'Sheet1' --values '[["New","Row","Data"]]' --json --no-input --force

# Clear a range
gog sheets clear <spreadsheetId> 'Sheet1!A1:D10' --json --no-input --force
```

### Export

```bash
# Export as CSV
gog sheets export <spreadsheetId> --format csv --out ./data.csv --no-input

# Export as PDF
gog sheets export <spreadsheetId> --format pdf --out ./sheet.pdf --no-input

# Export as XLSX
gog sheets export <spreadsheetId> --format xlsx --out ./sheet.xlsx --no-input
```

### Create

```bash
# Create a new spreadsheet
gog sheets create --title "New Spreadsheet" --json --no-input --force
```

## Slides

```bash
# Export as PPTX
gog slides export <presentationId> --format pptx --out ./deck.pptx --no-input

# Export as PDF
gog slides export <presentationId> --format pdf --out ./deck.pdf --no-input

# Create a new presentation
gog slides create --title "New Deck" --json --no-input --force

# Get presentation info
gog slides info <presentationId> --json --no-input
```

## Contacts

```bash
# Search contacts
gog contacts search "John" --json --no-input

# List all contacts
gog contacts list --max 100 --json --no-input

# Create a contact
gog contacts create --name "John Doe" --email john@example.com --phone "+1234567890" --json --no-input --force

# Update a contact
gog contacts update <contactId> --email new@example.com --json --no-input --force

# Delete a contact
gog contacts delete <contactId> --json --no-input --force
```

## People (Directory)

```bash
# Search directory (Workspace)
gog people search "Jane" --json --no-input

# Get profile
gog people get <resourceName> --json --no-input
```

## Tasks

```bash
# List task lists
gog tasks lists --json --no-input

# List tasks in a list
gog tasks list <tasklistId> --json --no-input

# Add a task
gog tasks add <tasklistId> --title "Buy groceries" --json --no-input --force

# Add a task with due date
gog tasks add <tasklistId> --title "Submit report" --due 2026-03-15T00:00:00Z --json --no-input --force

# Complete a task
gog tasks done <tasklistId> <taskId> --json --no-input --force

# Delete a task
gog tasks delete <tasklistId> <taskId> --json --no-input --force

# Create a task list
gog tasks lists create --title "Work Tasks" --json --no-input --force
```

## Forms

```bash
# Get form details
gog forms get <formId> --json --no-input

# List form responses
gog forms responses <formId> --json --no-input

# Create a form
gog forms create --title "Survey" --json --no-input --force

# Update a form
gog forms update <formId> --title "Updated Survey" --json --no-input --force
```

## Chat

```bash
# List spaces
gog chat spaces --json --no-input

# Find a specific space
gog chat find "General" --json --no-input

# Send a message
gog chat send <spaceName> --text "Hello team!" --json --no-input --force

# List messages in a space
gog chat messages <spaceName> --json --no-input

# React to a message
gog chat react <spaceName> <messageId> --emoji "thumbsup" --json --no-input --force
```

## Keep (Workspace Only)

Requires service account with domain-wide delegation.

```bash
# List notes
gog keep list --json --no-input

# Get a note
gog keep get <noteId> --json --no-input

# Search notes
gog keep search "meeting notes" --json --no-input

# Create a note
gog keep create --title "Meeting Notes" --body "Discussion points..." --json --no-input --force
```

## Groups (Workspace Only)

```bash
# List groups
gog groups list --json --no-input

# List members of a group
gog groups members <groupId> --json --no-input
```

## Classroom

```bash
# List courses
gog classroom courses --json --no-input

# List students in a course
gog classroom roster <courseId> --json --no-input

# List coursework
gog classroom coursework <courseId> --json --no-input

# List submissions
gog classroom submissions <courseId> <courseworkId> --json --no-input
```

## Admin (Workspace Only)

```bash
# List users
gog admin users --json --no-input

# Get user details
gog admin user <userId> --json --no-input
```

## Apps Script

```bash
# List projects
gog appscript projects --json --no-input

# Get a project
gog appscript get <scriptId> --json --no-input

# Run a function
gog appscript run <scriptId> --function myFunction --json --no-input --force
```

## Common jq Patterns

```bash
# Extract email subjects from search
gog gmail search 'is:unread' --max 10 --json --no-input | jq -r '.threads[] | "\(.subject) — \(.from)"'

# Get calendar event summaries
gog calendar events primary --from <start> --to <end> --json --no-input | jq -r '.events[] | "\(.start.dateTime) \(.summary)"'

# List drive file names and IDs
gog drive ls --json --no-input | jq -r '.files[] | "\(.id)\t\(.name)"'

# Get sheet data as TSV
gog sheets get <id> 'Sheet1!A:D' --json --no-input | jq -r '.values[] | @tsv'

# Count unread emails by sender
gog gmail search 'is:unread' --max 100 --json --no-input | jq -r '[.threads[].from] | group_by(.) | map({sender: .[0], count: length}) | sort_by(-.count)[:10][] | "\(.count)\t\(.sender)"'
```
