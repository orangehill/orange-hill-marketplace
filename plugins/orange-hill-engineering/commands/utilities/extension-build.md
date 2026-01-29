---
name: extension-build
description: Build and package Chrome extension for development or production
argument-hint: "[--dev|--prod|--watch|--zip]"
---

# Extension Build Command

Build, package, and validate Chrome extensions (Manifest V3).

## Usage

```bash
/extension-build                # Development build
/extension-build --dev          # Development build with source maps
/extension-build --prod         # Production build (minified)
/extension-build --watch        # Watch mode for development
/extension-build --zip          # Create distributable zip
/extension-build --validate     # Validate manifest and structure
```

## Prerequisites

### Chrome with Remote Debugging

Start Chrome with remote debugging for live testing:

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-profile-link
```

This enables:
- Live extension reloading
- Console log inspection via MCP
- Network request monitoring
- Screenshot capture for testing

### Project Structure

Expected extension structure:

```
extension/
├── manifest.json           # Extension manifest (v3)
├── src/
│   ├── background.ts       # Service worker
│   ├── content.ts          # Content scripts
│   ├── popup/
│   │   ├── popup.html
│   │   └── popup.ts
│   └── options/
│       ├── options.html
│       └── options.ts
├── public/
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
├── dist/                   # Build output
└── package.json
```

## Execution Flow

### 1. Validate Structure

```bash
# Check manifest.json exists and is valid
if [ ! -f "manifest.json" ]; then
    echo "❌ manifest.json not found"
    exit 1
fi

# Validate manifest version
MANIFEST_VERSION=$(jq -r '.manifest_version' manifest.json)
if [ "$MANIFEST_VERSION" != "3" ]; then
    echo "⚠️ Not Manifest V3 - consider upgrading"
fi
```

### 2. Build Based on Mode

**Development Build:**
```bash
# Build with source maps for debugging
npm run build:dev
# or
npx webpack --mode development --devtool source-map
```

**Production Build:**
```bash
# Minified build without source maps
npm run build:prod
# or
npx webpack --mode production
```

**Watch Mode:**
```bash
# Rebuild on file changes
npm run watch
# or
npx webpack --watch --mode development
```

### 3. Validate Build

```bash
# Check all required files exist
REQUIRED_FILES=("background.js" "manifest.json")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "dist/$file" ]; then
        echo "❌ Missing: $file"
    fi
done

# Validate manifest references
CONTENT_SCRIPTS=$(jq -r '.content_scripts[].js[]' dist/manifest.json)
for script in $CONTENT_SCRIPTS; do
    if [ ! -f "dist/$script" ]; then
        echo "❌ Content script not found: $script"
    fi
done
```

### 4. Output Results

**Success:**
```
✅ Extension Build Complete

Mode: development
Output: dist/

Files:
  ✅ manifest.json (v3)
  ✅ background.js (12kb)
  ✅ content.js (8kb)
  ✅ popup.html
  ✅ popup.js (15kb)
  ✅ icons/ (3 files)

Permissions requested:
  - storage
  - activeTab
  - https://api.example.com/*

Next steps:
1. Load extension in Chrome: chrome://extensions
2. Enable "Developer mode"
3. Click "Load unpacked" → select dist/
4. Or test with MCP: mcp__chrome-devtools__take_snapshot
```

**With Zip:**
```
✅ Extension packaged

Production build: dist/
Package: extension-v1.0.0.zip (45kb)

Ready for:
- Chrome Web Store upload
- Manual distribution
```

## Build Configuration

### Webpack Config

```javascript
// webpack.config.js
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background.ts',
    content: './src/content.ts',
    popup: './src/popup/popup.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'public', to: '.' },
        { from: 'src/popup/popup.html', to: 'popup.html' },
      ],
    }),
  ],
};
```

### Package Scripts

```json
{
  "scripts": {
    "build": "webpack --mode production",
    "build:dev": "webpack --mode development --devtool source-map",
    "watch": "webpack --watch --mode development",
    "zip": "npm run build && zip -r extension.zip dist/",
    "validate": "node scripts/validate-manifest.js"
  }
}
```

## Manifest Validation

The command validates:

1. **Required Fields:**
   - `manifest_version: 3`
   - `name`
   - `version`
   - `description`

2. **Service Worker:**
   - Background script registered
   - File exists

3. **Content Scripts:**
   - All referenced files exist
   - Match patterns valid

4. **Permissions:**
   - No deprecated permissions
   - Host permissions specific

5. **Icons:**
   - All sizes present (16, 48, 128)
   - Files exist

## Testing with Chrome DevTools MCP

After building, test the extension:

```javascript
// Load extension and check console
mcp__chrome-devtools__list_console_messages({
  types: ['error', 'warn']
})

// Take screenshot of popup
mcp__chrome-devtools__take_screenshot()

// Check network requests
mcp__chrome-devtools__list_network_requests()
```

## Troubleshooting

### Service Worker Not Registering

```
❌ Service worker registration failed

Check:
1. background.js exists in dist/
2. No syntax errors in background.js
3. manifest.json has correct path:
   "background": {
     "service_worker": "background.js"
   }
```

### Content Script Not Injecting

```
❌ Content script not running

Check:
1. URL matches content_scripts.matches pattern
2. Script file exists
3. No CSP blocking script
4. Reload extension after changes
```

### Popup Not Showing

```
❌ Popup failed to load

Check:
1. popup.html exists at specified path
2. No JavaScript errors (check console)
3. HTML is valid
```

## Related Commands

- `/test-browser` - Browser automation tests
- `/workflows:review` - Code review with extension agents
- `/api-health` - Check API connectivity
