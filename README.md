# Orange Hill Marketplace

A Claude Code plugin marketplace with **37 plugins** — MCP servers, CLI skill integrations, and development tools.

## Credits

This marketplace includes plugins derived from:
- [Compound Engineering Plugin](https://github.com/kieranklaassen/compound-engineering) by Kieran Klaassen
- [OpenClaw](https://github.com/nichochar/open-claw) skills by Nicholas Charriere

## Installation

```bash
# Add marketplace
claude /plugin marketplace add https://github.com/orange-hill/orange-hill-marketplace

# Install a plugin
claude /plugin install orange-hill-engineering
```

## Available Plugins

### MCP Servers

| Plugin | Description |
|--------|-------------|
| **mcp-things3** | Things 3 task manager integration via AppleScript and URL scheme |
| **mcp-weather** | Weather forecasts and geocoding via Open-Meteo API (free, no key) |

### Development & Engineering

| Plugin | Description |
|--------|-------------|
| **orange-hill-engineering** | AI-powered dev tools: 23 agents, 19 commands, 11 skills for Laravel, Next.js, Chrome extensions |
| **skill-github** | GitHub operations via `gh` CLI: issues, PRs, CI runs, code review |
| **skill-gh-issues** | Fetch issues, spawn agents to implement fixes, open PRs, monitor reviews |
| **skill-tmux** | Remote-control tmux sessions for interactive CLIs |
| **skill-model-usage** | Per-model usage/cost summaries via CodexBar CLI |

### Productivity & Notes

| Plugin | Description |
|--------|-------------|
| **skill-apple-notes** | Manage Apple Notes via `memo` CLI (create, view, edit, search) |
| **skill-apple-reminders** | Manage Apple Reminders via `remindctl` CLI |
| **skill-bear-notes** | Create, search, and manage Bear notes via `grizzly` CLI |
| **skill-notion** | Notion API for pages, databases, and blocks |
| **skill-obsidian** | Work with Obsidian vaults and automate via `obsidian-cli` |
| **skill-trello** | Manage Trello boards, lists, and cards via REST API |
| **skill-nano-pdf** | Edit PDFs with natural-language instructions |

### Google & Communication

| Plugin | Description |
|--------|-------------|
| **skill-gogcli** | Google Workspace CLI: Gmail, Calendar, Drive, Docs, Sheets, Contacts, Tasks |
| **skill-himalaya** | Email management via IMAP/SMTP with `himalaya` CLI |
| **skill-imsg** | iMessage/SMS: list chats, history, send messages |
| **skill-xurl** | X (Twitter) API: tweets, replies, search, DMs, media upload |

### AI & Generation

| Plugin | Description |
|--------|-------------|
| **skill-gemini** | Gemini CLI for Q&A, summaries, and generation |
| **skill-nano-banana-pro** | Image generation/editing via Gemini 3 Pro Image |
| **skill-openai-image-gen** | Batch image generation via OpenAI Images API |
| **skill-openai-whisper-api** | Audio transcription via OpenAI Whisper API |
| **skill-oracle** | Oracle CLI for prompt bundling, engines, and sessions |

### Smart Home & IoT

| Plugin | Description |
|--------|-------------|
| **skill-openhue** | Control Philips Hue lights and scenes |
| **skill-sonoscli** | Control Sonos speakers (discover, play, volume, group) |
| **skill-blucli** | BluOS CLI for discovery, playback, grouping |
| **skill-eightctl** | Control Eight Sleep pods (temperature, alarms, schedules) |
| **skill-camsnap** | Capture frames/clips from RTSP/ONVIF cameras |

### Music & Media

| Plugin | Description |
|--------|-------------|
| **skill-spotify-player** | Spotify playback/search via `spogo` or `spotify_player` |
| **skill-songsee** | Audio spectrograms and feature visualizations |
| **skill-gifgrep** | Search GIF providers, download, extract stills |
| **skill-video-frames** | Extract frames or clips from videos via ffmpeg |

### macOS Utilities

| Plugin | Description |
|--------|-------------|
| **skill-1password** | 1Password CLI setup, secrets, and desktop integration |
| **skill-peekaboo** | Capture and automate macOS UI |

### Location & Lifestyle

| Plugin | Description |
|--------|-------------|
| **skill-weather** | Weather forecasts via wttr.in or Open-Meteo (no API key) |
| **skill-goplaces** | Google Places API for location search and reviews |
| **skill-ordercli** | Foodora order history and active order status |

## License

MIT License - See LICENSE file.
