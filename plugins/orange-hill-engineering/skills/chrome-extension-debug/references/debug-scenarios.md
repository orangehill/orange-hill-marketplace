# Chrome Extension Debug Scenarios

Common debugging scenarios with step-by-step MCP commands.

## Scenario 1: Extension Not Loading

**Symptoms:** Extension icon doesn't appear, or extension doesn't work.

### Debug Steps

```javascript
// 1. Check if extension is installed
mcp__chrome-devtools__navigate_page({
  url: 'chrome://extensions/'
})

mcp__chrome-devtools__take_snapshot()
// Look for extension in list, check if enabled

// 2. Check for manifest errors
mcp__chrome-devtools__list_console_messages({
  types: ['error']
})

// 3. Check service worker status
mcp__chrome-devtools__navigate_page({
  url: 'chrome://serviceworker-internals/'
})
```

### Common Fixes

1. **Invalid manifest.json** - Check JSON syntax
2. **Missing permissions** - Add required permissions
3. **Service worker error** - Check background.js for syntax errors

---

## Scenario 2: Content Script Not Injecting

**Symptoms:** Extension doesn't modify web pages as expected.

### Debug Steps

```javascript
// 1. Navigate to target page
mcp__chrome-devtools__navigate_page({
  url: 'https://target-website.com'
})

// 2. Check if content script ran
mcp__chrome-devtools__list_console_messages({
  types: ['log', 'error']
})

// 3. Check for injected elements
mcp__chrome-devtools__take_snapshot()

// 4. Manually test if content script context exists
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    // This runs in page context, not extension context
    return typeof window.__extensionInjected !== 'undefined';
  }`
})
```

### Common Fixes

1. **Match pattern wrong** - Check `matches` in manifest
2. **CSP blocking** - Check for Content Security Policy errors
3. **Run timing** - Try `"run_at": "document_end"`

---

## Scenario 3: API Requests Failing

**Symptoms:** Extension can't communicate with external APIs.

### Debug Steps

```javascript
// 1. Check network requests
mcp__chrome-devtools__list_network_requests({
  resourceTypes: ['fetch', 'xhr']
})

// 2. Get details of failed request
mcp__chrome-devtools__get_network_request({
  reqid: 42  // From above list
})

// 3. Check for CORS errors
mcp__chrome-devtools__list_console_messages({
  types: ['error']
})
```

### Common Fixes

1. **Missing host_permissions** - Add API domain to manifest
2. **CORS** - Make requests from background, not content script
3. **HTTPS** - Ensure using https:// URLs

---

## Scenario 4: Popup Not Working

**Symptoms:** Popup opens but functionality broken.

### Debug Steps

```javascript
// 1. Click extension to open popup
// (May need to do manually)

// 2. Check popup console errors
mcp__chrome-devtools__list_console_messages({
  types: ['error', 'warn']
})

// 3. Take screenshot of popup state
mcp__chrome-devtools__take_screenshot()

// 4. Check storage for popup data
mcp__chrome-devtools__evaluate_script({
  function: `async () => {
    return await chrome.storage.local.get(null);
  }`
})
```

### Common Fixes

1. **JavaScript error** - Check popup.js for errors
2. **CSP violation** - No inline scripts in popup.html
3. **Missing data** - Check chrome.storage has expected data

---

## Scenario 5: Message Passing Broken

**Symptoms:** Communication between components fails.

### Debug Steps

```javascript
// 1. Add logging to message handlers
// In background.js:
chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  console.log('BG received:', msg, 'from:', sender);
});

// 2. Check console for messages
mcp__chrome-devtools__list_console_messages({
  types: ['log']
})

// 3. Test sending message
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    chrome.runtime.sendMessage({type: 'test'}, (response) => {
      console.log('Response:', response, chrome.runtime.lastError);
    });
  }`
})
```

### Common Fixes

1. **Missing `return true`** - Async responses need `return true`
2. **Wrong context** - Content scripts use `chrome.runtime`, not `chrome.extension`
3. **Tab not active** - Check tab ID when sending to content script

---

## Scenario 6: Storage Issues

**Symptoms:** Data not persisting or wrong data returned.

### Debug Steps

```javascript
// 1. Dump all storage
mcp__chrome-devtools__evaluate_script({
  function: `async () => {
    const local = await chrome.storage.local.get(null);
    const sync = await chrome.storage.sync.get(null);
    console.log('Local storage:', JSON.stringify(local, null, 2));
    console.log('Sync storage:', JSON.stringify(sync, null, 2));
    return { local, sync };
  }`
})

// 2. Check storage quota
mcp__chrome-devtools__evaluate_script({
  function: `async () => {
    const bytes = await chrome.storage.local.getBytesInUse(null);
    return { bytesUsed: bytes, limit: 5242880 }; // 5MB limit
  }`
})

// 3. Watch for storage changes
// Add to background.js:
chrome.storage.onChanged.addListener((changes, area) => {
  console.log('Storage changed:', area, changes);
});
```

### Common Fixes

1. **Quota exceeded** - Clean up old data
2. **Race condition** - Use `await` with storage operations
3. **Wrong storage area** - Check `local` vs `sync`

---

## Scenario 7: Performance Issues

**Symptoms:** Extension slows down browser or pages.

### Debug Steps

```javascript
// 1. Check for long-running scripts
mcp__chrome-devtools__performance_start_trace({
  reload: true,
  autoStop: true
})

// 2. Check memory usage
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    return performance.memory;
  }`
})

// 3. Look for excessive network requests
mcp__chrome-devtools__list_network_requests()
```

### Common Fixes

1. **Memory leak** - Check for event listener cleanup
2. **Too many requests** - Add caching/debouncing
3. **Heavy DOM manipulation** - Use batch updates

---

## Scenario 8: Context Menu Issues

**Symptoms:** Context menu items not appearing or not working.

### Debug Steps

```javascript
// 1. Check if menu was created
mcp__chrome-devtools__evaluate_script({
  function: `() => {
    // Context menus can't be queried, but check for creation errors
    chrome.contextMenus.create({
      id: 'test-menu',
      title: 'Test',
      contexts: ['all']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Menu creation failed:', chrome.runtime.lastError);
      } else {
        console.log('Menu created successfully');
      }
    });
  }`
})

// 2. Check console for errors
mcp__chrome-devtools__list_console_messages({
  types: ['error']
})
```

### Common Fixes

1. **Missing permission** - Add `"contextMenus"` to permissions
2. **Duplicate ID** - Remove old menu before creating
3. **Wrong context** - Check `contexts` array matches where you right-click
