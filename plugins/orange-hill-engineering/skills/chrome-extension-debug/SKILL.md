---
name: chrome-extension-debug
description: This skill provides debugging workflows and patterns for Chrome extensions using the chrome-devtools MCP server. It should be used when troubleshooting extension issues, testing features, or debugging service workers.
---

# Chrome Extension Debug Skill

This skill provides comprehensive debugging workflows for Chrome extensions using the chrome-devtools MCP server.

## Overview

Debugging Chrome extensions requires connecting to a Chrome instance with remote debugging enabled. This skill covers:

- Setting up debugging environment
- Service worker debugging
- Content script inspection
- Network request monitoring
- Console log analysis

For common debugging scenarios, see [debug-scenarios.md](./references/debug-scenarios.md).

---

## Setup

### Start Chrome with Remote Debugging

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-profile-link
```

**Flags explained:**
- `--remote-debugging-port=9222`: Enables Chrome DevTools Protocol
- `--user-data-dir=/tmp/chrome-profile-link`: Uses your profile data via symlink

### Create Profile Symlink (One-Time)

```bash
# Link your actual Chrome profile
ln -s "$HOME/Library/Application Support/Google/Chrome/Default" /tmp/chrome-profile-link
```

This gives the debugging Chrome instance access to:
- Your installed extensions
- Saved passwords and autofill
- Cookies and sessions
- Bookmarks

### Verify Connection

The chrome-devtools MCP server connects automatically. Test with:

```javascript
// List open pages
mcp__chrome-devtools__list_pages()

// Take a snapshot
mcp__chrome-devtools__take_snapshot()
```

---

## Service Worker Debugging

### Check Service Worker Status

```javascript
// Navigate to extension's service worker
mcp__chrome-devtools__navigate_page({
  url: 'chrome://serviceworker-internals/'
})

mcp__chrome-devtools__take_snapshot()
```

### View Service Worker Console

```javascript
// Check for errors in service worker
mcp__chrome-devtools__list_console_messages({
  types: ['error', 'warn', 'log']
})
```

### Common Service Worker Issues

**1. Service Worker Not Starting**
```javascript
// Check if service worker is registered
mcp__chrome-devtools__evaluate_script({
  function: `async () => {
    const regs = await navigator.serviceWorker.getRegistrations();
    return regs.map(r => ({
      scope: r.scope,
      active: r.active?.state,
      waiting: r.waiting?.state
    }));
  }`
})
```

**2. Service Worker Terminated**

Service workers can be terminated at any time. Check:
- No global state being relied upon
- chrome.storage used for persistence
- Alarms used instead of setInterval

**3. Event Listeners Not Firing**
```javascript
// Verify event listeners are registered
mcp__chrome-devtools__list_console_messages({
  types: ['log']
})
// Look for "Event listener registered" logs
```

---

## Content Script Debugging

### Verify Content Script Injection

```javascript
// Navigate to target page
mcp__chrome-devtools__navigate_page({
  url: 'https://example.com'
})

// Take snapshot - look for injected elements
mcp__chrome-devtools__take_snapshot()
```

### Check Content Script Errors

```javascript
// Filter for content script errors
mcp__chrome-devtools__list_console_messages({
  types: ['error']
})
```

### Test Content Script Communication

```javascript
// Send message to content script
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {type: 'ping'}, (response) => {
        console.log('Content script response:', response);
      });
    });
  }`
})
```

---

## Network Request Debugging

### Monitor Extension Requests

```javascript
// List all network requests
mcp__chrome-devtools__list_network_requests({
  resourceTypes: ['fetch', 'xhr']
})
```

### Inspect Specific Request

```javascript
// Get detailed request info
mcp__chrome-devtools__get_network_request({
  reqid: 123  // From list_network_requests
})
```

### Check for CORS Issues

```javascript
// Look for CORS errors in console
mcp__chrome-devtools__list_console_messages({
  types: ['error']
})
// Filter output for "CORS" or "Access-Control"
```

---

## Popup Debugging

### Open and Inspect Popup

```javascript
// Click extension action to open popup
mcp__chrome-devtools__click({
  uid: 'extension-button-uid'  // Get from snapshot
})

// Take screenshot of popup
mcp__chrome-devtools__take_screenshot()
```

### Debug Popup JavaScript

```javascript
// Check popup console
mcp__chrome-devtools__list_console_messages({
  types: ['error', 'log']
})
```

---

## Storage Debugging

### Inspect Chrome Storage

```javascript
mcp__chrome-devtools__evaluate_script({
  function: `async () => {
    const local = await chrome.storage.local.get(null);
    const sync = await chrome.storage.sync.get(null);
    return { local, sync };
  }`
})
```

### Clear Storage

```javascript
mcp__chrome-devtools__evaluate_script({
  function: `async () => {
    await chrome.storage.local.clear();
    await chrome.storage.sync.clear();
    return 'Storage cleared';
  }`
})
```

---

## Debugging Workflow

### 1. Initial Diagnosis

```javascript
// 1. Check for console errors
mcp__chrome-devtools__list_console_messages({ types: ['error'] })

// 2. Take page snapshot
mcp__chrome-devtools__take_snapshot()

// 3. Check network requests
mcp__chrome-devtools__list_network_requests()
```

### 2. Reproduce Issue

```javascript
// Navigate to problem page
mcp__chrome-devtools__navigate_page({ url: 'https://problem-site.com' })

// Perform action that causes issue
mcp__chrome-devtools__click({ uid: 'trigger-element' })

// Capture state after action
mcp__chrome-devtools__take_snapshot()
mcp__chrome-devtools__list_console_messages()
```

### 3. Verify Fix

```javascript
// Reload extension
// (Done manually in chrome://extensions)

// Re-test the scenario
mcp__chrome-devtools__navigate_page({ url: 'https://problem-site.com' })
mcp__chrome-devtools__click({ uid: 'trigger-element' })

// Verify no errors
mcp__chrome-devtools__list_console_messages({ types: ['error'] })
```

---

## Common Issues & Solutions

### "Extension context invalidated"

**Cause:** Extension was reloaded while content script was running.

**Solution:**
```javascript
// Wrap chrome API calls
function safeChromeCall(fn) {
  try {
    return fn();
  } catch (e) {
    if (e.message.includes('Extension context invalidated')) {
      console.log('Extension reloaded, refreshing page...');
      window.location.reload();
    }
    throw e;
  }
}
```

### "Cannot read property of undefined"

**Cause:** Async data not ready.

**Solution:**
```javascript
// Always check data exists
chrome.storage.local.get('key', (result) => {
  if (result.key) {
    // Use result.key
  } else {
    // Handle missing data
  }
});
```

### "Service worker was terminated"

**Cause:** Long-running operation in service worker.

**Solution:**
- Use alarms instead of timers
- Store state in chrome.storage
- Keep service worker operations short

---

## Related Commands

- `/extension-build` - Build extension
- `/workflows:review` - Code review
- `/test-browser` - Browser tests
