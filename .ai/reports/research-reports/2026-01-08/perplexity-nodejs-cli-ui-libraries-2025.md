# Perplexity Research: Node.js CLI UI Libraries for Terminal Dashboards (2025)

**Date**: 2026-01-08
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Research into CLI UI technologies for creating persistent, multi-column terminal interfaces in Node.js/TypeScript applications. Focus on:
- Blessed/Blessed-contrib current state
- Ink (React for CLI) capabilities
- Modern alternatives (2024-2025)
- Best choice for 3-column persistent dashboard with real-time updates

## Executive Summary

**RECOMMENDED: Ink** is the best choice for your use case - a 3-column persistent dashboard with 30-second update intervals.

| Library | Recommendation | Key Reason |
|---------|---------------|------------|
| **Ink** | **BEST CHOICE** | Modern React DX, excellent TypeScript, active maintenance, used by Claude Code, Gemini CLI, Qwen Code |
| Neo-Blessed | Viable Alternative | Good for widget-heavy dashboards, weaker TypeScript |
| terminal-kit | Specialized Use | Best for low-level terminal control, imperative API |
| Blessed | Legacy | Not recommended for new projects |

## Detailed Findings

### 1. Blessed / Blessed-Contrib

**Current State (2025):** Legacy / Mostly Unmaintained

- **blessed (original)**: Explicitly described as "no longer maintained" in curated resources
- **blessed-contrib**: Still published on npm but no clear active maintenance
- **Practical implication**: Works but expect no bug fixes or Node.js compatibility updates

**Maintained Forks:**
- **neo-blessed**: Maintained fork with updates and compatibility fixes
- **neo-neo-blessed**: Fork of neo-blessed with further bug fixes

**Capabilities:**
- Multi-column layouts via box layouts and positioning APIs
- Persistent screen management (widgets re-render in place)
- Real-time updates via widget.setData() and screen re-rendering
- blessed-contrib provides dashboard-ready widgets (charts, gauges, maps, tables, logs)

**Recommendation:** Use **neo-blessed + blessed-contrib** if you specifically need the blessed ecosystem. Not recommended for new TypeScript projects due to weak typing.

### 2. Ink (React for CLI)

**Current State (2025):** Actively Maintained, Industry Standard

- **Version**: v3+ with modern React hooks API
- **Maintenance**: Regular updates, actively developed
- **Adoption**: Used by major tools: Claude Code, Gemini CLI, Qwen Code, Gatsby, Prisma, Shopify

**Key Capabilities for Your Use Case:**

1. **Multi-Column Layouts**
   - Uses Yoga (Flexbox layout engine)
   - Create columns with `Box` component and `flexDirection="row"`
   - CSS-like properties: `width`, `padding`, `margin`, `borderStyle`

2. **Persistent, Non-Scrolling Updates**
   - React component tree renders in place (not line-by-line output)
   - State changes trigger re-renders within fixed regions
   - Does NOT scroll - updates appear in same position

3. **Real-Time Updates (30-second intervals)**
   - Trivial for Ink - production CLIs handle streaming token-by-token updates
   - Use `setInterval` with React state to trigger re-renders
   - Actually hardcoded to 32 FPS max, more than sufficient for 30-second polling

4. **TypeScript Support**
   - Full JSX typing, component props, hooks
   - `create-ink-app --typescript` scaffolder
   - Modern TS-native developer experience

**Performance Notes (from research):**
- Development mode: ~50MB memory
- Bundled production: ~32MB memory
- Comparison: BubbleTea (Go) uses ~4MB for equivalent app
- 32 FPS cap is hardcoded but more than adequate for dashboard use

**3-Column Dashboard Architecture:**

```typescript
import React, { useState, useEffect } from 'react';
import { render, Box, Text } from 'ink';

interface SandboxState {
  name: string;
  status: 'running' | 'idle' | 'error';
  lastHeartbeat: Date;
  progress: number;
  currentTask: string;
}

const SandboxColumn = ({ sandbox }: { sandbox: SandboxState }) => (
  <Box flexDirection="column" borderStyle="round" width="33%" padding={1}>
    <Text bold color="cyan">{sandbox.name}</Text>
    <Text>Status: <Text color={sandbox.status === 'running' ? 'green' : 'yellow'}>{sandbox.status}</Text></Text>
    <Text>Heartbeat: {sandbox.lastHeartbeat.toLocaleTimeString()}</Text>
    <Text>Progress: {sandbox.progress}%</Text>
    <Text dimColor>{sandbox.currentTask}</Text>
  </Box>
);

const Dashboard = () => {
  const [sandboxes, setSandboxes] = useState<SandboxState[]>([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      // Poll for updates every 30 seconds
      const updates = await fetchSandboxStatus();
      setSandboxes(updates);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Box flexDirection="row" width="100%">
      {sandboxes.map((sandbox, i) => (
        <SandboxColumn key={i} sandbox={sandbox} />
      ))}
    </Box>
  );
};

render(<Dashboard />);
```

### 3. Modern Alternatives (2024-2025)

#### terminal-kit
- **Type**: Full-featured terminal UI toolkit (ncurses-like)
- **Best for**: Low-level terminal control, no React abstraction
- **Pros**: Pure JS, no native compilation, rich terminal control
- **Cons**: Imperative API, fewer pre-built dashboard widgets
- **TypeScript**: Official types, better than blessed but not as good as Ink

#### cli-boxes / box-cli-maker
- **NOT suitable** for persistent dashboards
- Only provide box border characters/styling
- No layout, rendering, or event handling

#### OpenTUI (SST)
- **Status**: Emerging (2025), built on Zig + TypeScript + Bun FFI
- **Promise**: Better performance than Ink (lower memory, higher FPS)
- **Caveat**: Very new, less ecosystem, not yet production-proven
- **Watch**: https://github.com/sst/opentui

#### Rust-based (tui-rs / ratatui)
- **No well-maintained Node.js bindings** as of 2025
- Would require custom napi-rs/Neon bindings
- Not practical for Node.js/TypeScript projects

### 4. Library Comparison Matrix

| Feature | Ink | Neo-Blessed | terminal-kit |
|---------|-----|-------------|--------------|
| **Maintenance (2025)** | Active | Moderate | Active |
| **TypeScript** | Excellent | Poor | Good |
| **Multi-Column Layout** | Flexbox (Yoga) | Manual positioning | Manual |
| **Persistent Updates** | Yes (React diff) | Yes (screen refresh) | Yes (buffer) |
| **Pre-built Widgets** | Via @inkjs/ui | blessed-contrib | Limited |
| **Learning Curve** | Low (if know React) | Medium | Medium |
| **Memory Usage** | Higher (~32MB) | Lower | Lower |
| **npm Downloads** | Highest | Low | Moderate |
| **Production Users** | Claude Code, Gemini CLI | Legacy tools | Niche tools |

### 5. Recommendation for Your Use Case

**Your Requirements:**
- 3 persistent columns side-by-side
- Update individual fields without redrawing entire screen
- Progress bars, status indicators, timestamps
- Updates every 30 seconds
- TypeScript support

**Best Choice: Ink**

Reasons:
1. **Flexbox layouts** make 3-column design trivial
2. **React state** handles field-level updates automatically
3. **Rich ecosystem** for progress bars, spinners via @inkjs/ui
4. **TypeScript-first** with full JSX typing
5. **Production-proven** - same architecture as Claude Code, Gemini CLI
6. **30-second updates** are well within Ink's capabilities (handles streaming)
7. **Modern DX** - component-based, hooks, familiar patterns

**Implementation Tips:**
- Use `Box` with `flexDirection="row"` for column layout
- Each column is a `Box` with `width="33%"` or fixed pixel width
- Use `useState` + `useEffect` with `setInterval` for polling
- Avoid `console.log` - use only Ink components to prevent scrolling
- Consider `Static` component for any accumulated log-style output

**Performance Considerations:**
- 32MB memory overhead is acceptable for a dashboard tool
- If memory is critical, consider neo-blessed (more complex code)
- OpenTUI may be viable alternative in future but not production-ready yet

## Sources & Citations

Research based on Perplexity AI synthesis from:
- GitHub: vadimdemedes/ink (official repository)
- npm package statistics and download trends
- freeCodeCamp React + Ink CLI Tutorial
- DEV Community "Building Reactive CLIs with Ink"
- YouTube: "INK: The React Library POWERING AI Terminal Tools"
- npm-stat download analysis
- Various CLI library comparisons and documentation

## Key Takeaways

1. **Ink is the clear winner** for modern TypeScript CLI dashboards in 2025
2. **Blessed ecosystem is legacy** - use neo-blessed only if you have specific widget needs
3. **terminal-kit** is good for low-level work but requires more manual effort
4. **OpenTUI** is emerging but not production-ready
5. **No practical Rust bindings** exist for Node.js TUI development
6. Major AI CLI tools (Claude Code, Gemini CLI, Qwen Code) all use Ink

## Related Searches

For follow-up research:
- "@inkjs/ui components" - explore pre-built widgets
- "Ink progress bar component" - specific widget implementations
- "OpenTUI SST" - track emerging alternative
- "Ink vs BubbleTea performance" - if considering Go alternative
