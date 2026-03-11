---
name: nano-banana-pro
description: >
  Generate or edit images via Gemini 3 Pro Image (Nano Banana Pro).
allowed-tools:
  - Bash(uv *)
  - Bash(which uv)
  - Bash(brew install uv)
---

# Nano Banana Pro (Gemini 3 Pro Image)

Use the bundled script to generate or edit images.

Generate

```bash
uv run ${CLAUDE_SKILL_DIR}/scripts/generate_image.py --prompt "your image description" --filename "output.png" --resolution 1K
```

Edit (single image)

```bash
uv run ${CLAUDE_SKILL_DIR}/scripts/generate_image.py --prompt "edit instructions" --filename "output.png" -i "/path/in.png" --resolution 2K
```

Multi-image composition (up to 14 images)

```bash
uv run ${CLAUDE_SKILL_DIR}/scripts/generate_image.py --prompt "combine these into one scene" --filename "output.png" -i img1.png -i img2.png -i img3.png
```

API key

- `GEMINI_API_KEY` env var
- Or set `skills."nano-banana-pro".apiKey` / `skills."nano-banana-pro".env.GEMINI_API_KEY` in `~/.claude-code/claude-code.json`

Specific aspect ratio (optional)

```bash
uv run ${CLAUDE_SKILL_DIR}/scripts/generate_image.py --prompt "portrait photo" --filename "output.png" --aspect-ratio 9:16
```

Notes

- Resolutions: `1K` (default), `2K`, `4K`.
- Aspect ratios: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`. Without `--aspect-ratio` / `-a`, the model picks freely - use this flag for avatars, profile pics, or consistent batch generation.
- Use timestamps in filenames: `yyyy-mm-dd-hh-mm-ss-name.png`.
- The script prints a `MEDIA:` line for Claude Code to auto-attach on supported chat providers.
- Do not read the image back; report the saved path only.
