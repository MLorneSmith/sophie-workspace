# Agent-Browser CLI - AI Agent Browser Automation Reference

**Purpose**: Headless browser automation CLI designed specifically for AI agents. Uses accessibility-focused, semantic selectors instead of fragile CSS selectors.

**Related Files**:

- `apps/e2e/` - E2E testing infrastructure (can integrate with agent-browser)
- `.ai/ai_docs/tool-docs/playwright.md` - Playwright E2E testing patterns
- `CLAUDE.md` - Testing philosophy and standards

## Installation

```bash
# Install globally via pnpm
pnpm add -g agent-browser

# Download Chromium browser
agent-browser install

# Linux: Also install system dependencies if browser fails to launch
agent-browser install --with-deps
```

## Core Concepts

### Semantic Selectors vs CSS Selectors

Agent-browser uses **accessibility-first** selectors that are more resilient than CSS:

| Type | Agent-Browser (Recommended) | CSS Selector (Fragile) |
|------|---------------------------|------------------------|
| Button | `find role button "Submit"` | `.btn-primary` |
| Input | `find label "Email"` | `#email-input` |
| Link | `find role link "Home"` | `a[href="/"]` |
| Heading | `find role heading "Welcome"` | `h1.welcome-title` |

### Accessibility Tree Snapshots

The `snapshot` command returns a machine-parseable accessibility tree with element references:

```bash
agent-browser snapshot
```

Output includes `@ref` identifiers for each element that can be used directly in subsequent commands:

```
[1] button "Submit" @ref=abc123
[2] textbox "Email" @ref=def456
```

Use references in commands:

```bash
agent-browser click @abc123
agent-browser fill @def456 "user@example.com"
```

## Quick Reference

### Navigation

```bash
agent-browser open https://example.com    # Navigate to URL
agent-browser back                        # Go back
agent-browser forward                     # Go forward
agent-browser reload                      # Reload page
```

### Element Interaction

```bash
# Click elements
agent-browser click @ref                  # Click by reference
agent-browser click "Submit"              # Click by text
agent-browser dblclick @ref               # Double-click

# Form input
agent-browser fill @ref "text"            # Clear and fill
agent-browser type @ref "text"            # Type without clearing
agent-browser press Enter                 # Press key
agent-browser check @ref                  # Check checkbox
agent-browser uncheck @ref                # Uncheck checkbox
agent-browser select @ref "option"        # Select dropdown

# Other interactions
agent-browser hover @ref                  # Hover element
agent-browser focus @ref                  # Focus element
agent-browser scroll down 500             # Scroll direction
agent-browser scrollintoview @ref         # Scroll element into view
agent-browser drag @src @dst              # Drag and drop
agent-browser upload @ref file.pdf        # Upload files
```

### Find Elements (Semantic Locators)

```bash
# By ARIA role
agent-browser find role button "Submit" click
agent-browser find role textbox "Email" fill "user@test.com"
agent-browser find role link "Home" click
agent-browser find role heading "Welcome" get text

# By label
agent-browser find label "Email" fill "user@example.com"
agent-browser find label "Password" fill "secret"

# By placeholder
agent-browser find placeholder "Enter email" fill "user@example.com"

# By text content
agent-browser find text "Click here" click

# By test ID (fallback)
agent-browser find testid "submit-button" click

# Position-based
agent-browser find first button click
agent-browser find last link click
agent-browser find nth 2 button click
```

### Get Information

```bash
agent-browser get text @ref               # Get text content
agent-browser get html @ref               # Get inner HTML
agent-browser get value @ref              # Get input value
agent-browser get attr href @ref          # Get attribute
agent-browser get title                   # Get page title
agent-browser get url                     # Get current URL
agent-browser get count @ref              # Count matching elements
agent-browser get box @ref                # Get bounding box
agent-browser get styles @ref             # Get computed styles
```

### Check State

```bash
agent-browser is visible @ref             # Check if visible
agent-browser is enabled @ref             # Check if enabled
agent-browser is checked @ref             # Check if checked
```

### Screenshots and PDF

```bash
agent-browser screenshot                  # Screenshot (auto-named)
agent-browser screenshot page.png         # Screenshot to file
agent-browser screenshot --full page.png  # Full page screenshot
agent-browser pdf document.pdf            # Save as PDF
```

### Wait Commands

```bash
agent-browser wait 5000                   # Wait 5 seconds
agent-browser wait @ref                   # Wait for element
agent-browser wait "Loading complete"     # Wait for text
```

## AI Agent Workflow Patterns

### Pattern 1: Snapshot-Driven Interaction

The recommended workflow for AI agents:

```bash
# 1. Open page and get snapshot
agent-browser open https://app.example.com
agent-browser snapshot -i -c

# 2. Parse snapshot to identify elements by @ref
# 3. Interact using references
agent-browser click @abc123
agent-browser fill @def456 "input value"

# 4. Get new snapshot after changes
agent-browser snapshot -i -c
```

**Snapshot Options**:

| Flag | Description |
|------|-------------|
| `-i, --interactive` | Only interactive elements (buttons, inputs, links) |
| `-c, --compact` | Remove empty structural elements |
| `-d, --depth <n>` | Limit tree depth |
| `-s, --selector <sel>` | Scope to CSS selector |

### Pattern 2: Form Filling

```bash
# Navigate and snapshot
agent-browser open https://app.example.com/login
agent-browser snapshot -i

# Fill form using semantic locators
agent-browser find label "Email" fill "user@example.com"
agent-browser find label "Password" fill "secret123"
agent-browser find role button "Sign in" click

# Wait for navigation
agent-browser wait 2000
agent-browser snapshot -i
```

### Pattern 3: Data Extraction

```bash
agent-browser open https://example.com/data
agent-browser snapshot --json > data.json

# Or extract specific content
agent-browser get text "table.results"
agent-browser eval "document.querySelector('table').innerText"
```

## Network Interception

### Mock API Responses

```bash
# Block requests
agent-browser network route "**/api/analytics" --abort

# Return mock data
agent-browser network route "**/api/user" --body '{"name":"Test User","id":123}'

# Clear routes
agent-browser network unroute
agent-browser network unroute "**/api/analytics"

# View captured requests
agent-browser network requests
agent-browser network requests --filter "**/api/*"
agent-browser network requests --clear
```

### HTTP Headers and Authentication

```bash
# Set auth headers for requests
agent-browser open https://api.example.com --headers '{"Authorization":"Bearer token123"}'

# Set basic auth credentials
agent-browser set credentials username password
```

## Session Management

Sessions provide isolated browser contexts:

```bash
# Use named session
agent-browser open https://example.com --session test-user-1

# List active sessions
agent-browser session list

# Show current session
agent-browser session

# Environment variable
export AGENT_BROWSER_SESSION=my-session
agent-browser open https://example.com
```

### State Persistence

```bash
# Get/set cookies
agent-browser cookies get
agent-browser cookies set '{"name":"auth","value":"token123"}'
agent-browser cookies clear

# Local/session storage
agent-browser storage local get
agent-browser storage local set '{"key":"value"}'
agent-browser storage session get
```

## Multi-Tab Operations

```bash
agent-browser tab new                     # Open new tab
agent-browser tab list                    # List tabs
agent-browser tab 2                       # Switch to tab 2
agent-browser tab close                   # Close current tab
```

## Device Emulation

```bash
# Set viewport
agent-browser set viewport 1920 1080

# Emulate device
agent-browser set device "iPhone 14 Pro"
agent-browser set device "Pixel 7"

# Set geolocation
agent-browser set geo 40.7128 -74.0060

# Offline mode
agent-browser set offline on
agent-browser set offline off

# Color scheme
agent-browser set media dark
agent-browser set media light reduced-motion
```

## Debugging

### Visual Debugging

```bash
# Run in headed mode (visible browser)
agent-browser open https://example.com --headed

# Highlight element
agent-browser highlight @ref

# Debug output
agent-browser open https://example.com --debug
```

### Tracing and Recording

```bash
# Record trace
agent-browser trace start
# ... perform actions ...
agent-browser trace stop trace.zip

# Record video
agent-browser record start recording.webm https://example.com
# ... perform actions ...
agent-browser record stop
```

### Console and Errors

```bash
# View console logs
agent-browser console
agent-browser console --clear

# View page errors
agent-browser errors
agent-browser errors --clear
```

## Connect to Existing Browser

```bash
# Connect to browser running with remote debugging
# Start Chrome with: google-chrome --remote-debugging-port=9222
agent-browser connect 9222

# Or use CDP flag
agent-browser open https://example.com --cdp 9222
```

## JSON Output

For programmatic parsing:

```bash
agent-browser snapshot --json
agent-browser get text @ref --json
agent-browser network requests --json
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `AGENT_BROWSER_SESSION` | Default session name |
| `AGENT_BROWSER_EXECUTABLE_PATH` | Custom browser path |

## Comparison with Playwright

| Feature | agent-browser | Playwright |
|---------|--------------|------------|
| **Primary Use** | AI agent automation | Developer E2E testing |
| **Selector Style** | Accessibility-first (roles, labels) | CSS/XPath/role hybrid |
| **Interface** | CLI (shell commands) | Node.js/Python API |
| **Snapshot** | Accessibility tree with refs | DOM snapshot |
| **Multi-session** | Built-in isolation | Context API |
| **Learning Curve** | Lower (shell commands) | Higher (programming) |

### When to Use Each

**Use agent-browser when**:
- AI agent needs browser automation
- Shell-based automation workflow
- Accessibility-focused testing
- Quick interactive exploration

**Use Playwright when**:
- Full E2E test suites with assertions
- Complex test setup/teardown
- Integration with CI/CD pipelines
- Need programmatic control

## Integration with SlideHeroes Workflow

### AI-Assisted Testing

```bash
# Take accessibility snapshot for analysis
agent-browser open http://localhost:3000
agent-browser snapshot -i -c > snapshot.txt

# AI analyzes snapshot and performs interactions
agent-browser find role button "New Presentation" click
agent-browser find label "Title" fill "Q4 Results"
agent-browser find role button "Create" click
agent-browser screenshot result.png
```

### Quick Visual Verification

```bash
# Verify page state visually
agent-browser open http://localhost:3000/dashboard
agent-browser screenshot --full dashboard.png

# Check specific elements
agent-browser find role heading "Dashboard" get text
agent-browser is visible "Welcome back"
```

## Troubleshooting

### Browser Won't Launch

```bash
# Linux: Install system dependencies
agent-browser install --with-deps

# Or manually with Playwright
npx playwright install-deps chromium
```

### Element Not Found

```bash
# Get full snapshot to see available elements
agent-browser snapshot

# Try different locator strategies
agent-browser find text "Submit" click
agent-browser find role button "Submit" click
agent-browser find label "Submit" click

# Check if element exists
agent-browser is visible "Submit"
```

### Timeout Issues

```bash
# Explicit wait before action
agent-browser wait 3000
agent-browser wait "Loading complete"
agent-browser click @ref
```

### Debug Mode

```bash
# Enable verbose output
agent-browser open https://example.com --debug
```

## Related Documentation

- **Playwright E2E Testing**: `.ai/ai_docs/tool-docs/playwright.md`
- **E2E Testing Guide**: `.ai/ai_docs/context-docs/testing/e2e-testing.md`
- **Testing Fundamentals**: `.ai/ai_docs/context-docs/testing/fundamentals.md`
- **SlideHeroes Testing Philosophy**: `CLAUDE.md` - Testing section
- **agent-browser GitHub**: https://github.com/AffogatoNetwork/agent-browser
