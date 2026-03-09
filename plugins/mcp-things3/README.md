# mcp-things3

Things 3 task manager integration for Claude Code. Read your todos, projects, and areas via AppleScript, and create new todos and projects via the Things URL scheme.

## Setup

### Prerequisites
- Node.js 18+
- macOS with Things 3 installed
- Things 3 must have been opened at least once (for AppleScript access)

### Environment Variables

No API keys required. This plugin communicates with Things 3 directly via AppleScript (read) and the `things:///` URL scheme (write).

### Installation

**As a Claude Code plugin:**
```bash
claude --plugin-dir /path/to/mcp-things3
```

### Manual setup
```bash
cd mcp-things3
npm install
```

## Available Tools

| Tool | Description |
|------|-------------|
| `get_todos` | Get todos from a Things 3 list (Inbox, Today, Anytime, Upcoming, Someday, Logbook, Trash) |
| `search_todos` | Search for todos by name across all lists |
| `get_projects` | List all projects with their areas and todo counts |
| `add_todo` | Create a new todo with optional notes, schedule, deadline, tags, checklist items |
| `add_project` | Create a new project with optional todos, notes, schedule, deadline, tags |

## Usage Examples

After installing the plugin, you can ask Claude:
- "Show me my todos for today"
- "What's in my Things inbox?"
- "Search for todos about groceries"
- "List all my projects"
- "Add a todo to buy milk, due tomorrow"
- "Create a todo 'Review PR' for today with tags 'work, code'"
- "Create a project 'Kitchen Renovation' with todos: get quotes, choose contractor, schedule work"

## How It Works

- **Reading data**: Uses AppleScript to query Things 3 directly. Things 3 must be installed but does not need to be running (AppleScript will launch it if needed).
- **Creating items**: Uses the `things:///` URL scheme via `open` command. Items are created silently without showing the Things UI.

## Limitations

- **macOS only** -- Things 3 is a macOS/iOS app; AppleScript only works on macOS.
- **Read via AppleScript** -- Cannot read checklist items or headings (AppleScript API limitation).
- **Write via URL scheme** -- Creating items is one-way; the tool confirms the URL was opened but cannot verify the item was created.
- **Updating existing todos** requires an auth token from Things settings. This is not currently implemented to keep setup simple.

## Testing

```bash
npm test
```

## License

MIT
