---
name: openai-whisper-api
description: >
  Transcribe audio via OpenAI Audio Transcriptions API (Whisper).
allowed-tools:
  - Bash(curl *)
  - Bash(which curl)
---

# OpenAI Whisper API (curl)

Transcribe an audio file via OpenAI’s `/v1/audio/transcriptions` endpoint.

## Quick start

```bash
${CLAUDE_SKILL_DIR}/scripts/transcribe.sh /path/to/audio.m4a
```

Defaults:

- Model: `whisper-1`
- Output: `<input>.txt`

## Useful flags

```bash
${CLAUDE_SKILL_DIR}/scripts/transcribe.sh /path/to/audio.ogg --model whisper-1 --out /tmp/transcript.txt
${CLAUDE_SKILL_DIR}/scripts/transcribe.sh /path/to/audio.m4a --language en
${CLAUDE_SKILL_DIR}/scripts/transcribe.sh /path/to/audio.m4a --prompt "Speaker names: Peter, Daniel"
${CLAUDE_SKILL_DIR}/scripts/transcribe.sh /path/to/audio.m4a --json --out /tmp/transcript.json
```

## API key

Set `OPENAI_API_KEY`, or configure it in `~/.claude-code/claude-code.json`:

```json5
{
  skills: {
    "openai-whisper-api": {
      apiKey: "OPENAI_KEY_HERE",
    },
  },
}
```
