# mcp-things3

Things 3 task manager integration for Claude Code. Read, create, update, and complete todos and projects via AppleScript and the Things URL scheme.

## Setup

### Prerequisites
- Node.js 18+
- macOS with Things 3 installed
- Things 3 must have been opened at least once (for AppleScript access)

### Environment Variables

Most tools require no API keys — they communicate with Things 3 directly via AppleScript (read/status changes) and the `things:///` URL scheme (create).

**Optional:** To update scheduling (`when`), deadlines, or checklist items on existing todos/projects, set `THINGS_AUTH_TOKEN`:
1. Open Things 3 → Settings → General → Enable Things URLs
2. Copy the auth token
3. Set it in your environment: `export THINGS_AUTH_TOKEN=your-token-here`

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

## Available Tools (15)

### Reading
| Tool | Description |
|------|-------------|
| `get_todos` | Get todos from a Things 3 list (Inbox, Today, Anytime, Upcoming, Someday, Logbook, Trash) |
| `search_todos` | Search for todos by name across all lists |
| `get_projects` | List all projects with their areas and todo counts |
| `get_areas` | List all areas with their projects |
| `get_tags` | List all tags (with parent tag hierarchy) |
| `get_todo_detail` | Get full details of a single todo by ID (name, notes, dates, tags, project, area, status) |
| `get_project_todos` | Get all todos within a specific project (by name or ID) |

### Creating
| Tool | Description |
|------|-------------|
| `add_todo` | Create a new todo with optional notes, schedule, deadline, tags, checklist items |
| `add_project` | Create a new project with optional todos, notes, schedule, deadline, tags |

### Status Changes
| Tool | Description |
|------|-------------|
| `complete_todo` | Mark a todo as completed by ID |
| `cancel_todo` | Cancel a todo by ID |
| `delete_todo` | Move a todo to Trash by ID |
| `complete_project` | Mark a project as completed by ID |

### Updating
| Tool | Description | Auth Token |
|------|-------------|------------|
| `update_todo` | Update title, notes, due date, tags, status (AppleScript) | Not needed |
| `update_todo` | Update when, deadline, checklist items (URL scheme) | Required |
| `update_project` | Update title, notes, tags (AppleScript) | Not needed |
| `update_project` | Update when, deadline, area (URL scheme) | Required |

## Usage Examples

After installing the plugin, you can ask Claude:
- "Show me my todos for today"
- "What's in my Things inbox?"
- "Search for todos about groceries"
- "List all my projects"
- "Add a todo to buy milk, due tomorrow"
- "Create a todo 'Review PR' for today with tags 'work, code'"
- "Create a project 'Kitchen Renovation' with todos: get quotes, choose contractor, schedule work"
- "Mark the grocery shopping todo as done"
- "What are my areas?"
- "Show me all tags"
- "Get the details of that todo"
- "Update the todo title to 'Buy organic milk'"
- "Complete the Kitchen Renovation project"

## How It Works

- **Reading data**: Uses AppleScript to query Things 3 directly. Things 3 must be installed but does not need to be running (AppleScript will launch it if needed).
- **Creating items**: Uses the `things:///` URL scheme via `open` command. Items are created silently without showing the Things UI.

## Limitations

- **macOS only** -- Things 3 is a macOS/iOS app; AppleScript only works on macOS.
- **Read via AppleScript** -- Cannot read checklist items or headings (AppleScript API limitation).
- **Write via URL scheme** -- Creating items is one-way; the tool confirms the URL was opened but cannot verify the item was created.
- **Updating schedule/checklists** requires an auth token from Things settings (see Setup above). Title, notes, tags, and status changes work without a token.

## Testing

```bash
npm test
```

## License

MIT
