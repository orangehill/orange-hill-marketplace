# skill-gogcli

Google Workspace CLI skill for Claude Code. Gives Claude direct access to Gmail, Calendar, Drive, Docs, Sheets, Slides, Contacts, Tasks, and more via [gogcli](https://github.com/steipete/gogcli).

## What is this?

A **skill-only plugin** (no MCP server) that teaches Claude how to use the `gog` command-line tool. Claude invokes `gog` commands via Bash with `--json` output and parses results with `jq`.

## Supported Services

| Service | Commands | Examples |
|---------|----------|---------|
| Gmail | search, read, send, reply, labels, drafts | "check my unread email" |
| Calendar | events, create, delete, free/busy | "what's on my calendar today" |
| Drive | list, search, upload, download, share | "find the quarterly report" |
| Docs | read, export, create | "export that doc as PDF" |
| Sheets | read range, update cells, append, export | "read the first 10 rows" |
| Slides | export, create | "export the deck as PPTX" |
| Contacts | search, list, create | "find John's email" |
| Tasks | list, add, complete | "add a task for Friday" |
| Forms | get, responses | "show form responses" |
| Chat | spaces, send | "send a chat message" |
| Keep | list, search, create | "search my notes" |
| Groups | list, members | "list group members" |
| Classroom | courses, roster | "list my courses" |

## Setup

### Quick start

```bash
# Install gogcli
brew install steipete/tap/gogcli

# Run the interactive setup
bash scripts/setup.sh
```

### Manual setup

1. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/)
2. Download `client_secret.json`
3. Register credentials: `gog auth credentials ~/Downloads/client_secret.json`
4. Add your account: `gog auth add you@gmail.com --services all`

See [setup guide](skills/gog/references/setup.md) for detailed instructions.

### Verify setup

```bash
bash scripts/verify.sh
```

## Multi-Account Support

Configure multiple Google accounts and switch between them:

```bash
# Add accounts
gog auth add account1@gmail.com --services all
gog auth add account2@gmail.com --services all

# Set aliases
gog auth alias set a1 account1@gmail.com
gog auth alias set a2 account2@gmail.com

# Use with --account flag
gog gmail search 'is:unread' --account a1 --json --no-input
```

## Install as Claude Code Plugin

```bash
claude --plugin-dir plugins/built/skill-gogcli
```

The skill auto-activates when you mention Google services (email, calendar, drive, etc.).

## Testing

```bash
bash tests/test.sh
```

## Safety

The skill requires explicit user confirmation before:
- Sending emails
- Deleting resources
- Sharing files or changing permissions
- Creating events with attendees
- Any batch modification

Read-only operations (search, list, read, export) execute without confirmation.

## License

MIT
