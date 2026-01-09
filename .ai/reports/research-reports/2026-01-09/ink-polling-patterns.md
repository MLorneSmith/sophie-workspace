# Context7 Research: Ink Polling Patterns and Efficient State Updates

**Date**: 2026-01-09
**Agent**: context7-expert
**Libraries Researched**: vadimdemedes/ink (28,568 stars)

## Query Summary

Researched best practices for managing frequent state updates in Ink CLI applications, focusing on:
1. State updates during polling/intervals
2. Partial re-renders vs full screen redraws
3. `<Static>` component for non-re-rendering content
4. `useStdout` hook and `write()` for raw output
5. Patterns for reducing flicker in progress displays
6. How Ink's reconciler handles updates efficiently

## Findings

### 1. State Updates During Polling/Intervals

Ink handles state updates using standard React patterns. The key is to use `useState` and `useEffect` properly with interval cleanup.

**Best Practice Pattern:**
```typescript
import React, {useState, useEffect} from 'react';
import {render, Text} from 'ink';

const Counter = () => {
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCounter(previousCounter => previousCounter + 1);
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return <Text color="green">{counter} tests passed</Text>;
};

render(<Counter />);
```

**Key Points:**
- Always clean up intervals in the `useEffect` return function
- Use functional updates (`previousCounter => previousCounter + 1`) to avoid stale closures
- Ink batches React state updates just like React DOM

### 2. `maxFps` Option for Controlling Render Frequency

Ink provides a `maxFps` option to throttle renders, which is critical for reducing flicker during frequent state updates.

**Configuration:**
```typescript
import {render} from 'ink';

const instance = render(<App />, {
  stdout: process.stdout,
  stdin: process.stdin,
  stderr: process.stderr,
  exitOnCtrlC: true,
  patchConsole: true,
  debug: false,
  maxFps: 30,  // Limit renders to 30 FPS (default is higher)
  isScreenReaderEnabled: false
});
```

**Recommendation for polling/progress displays:**
- Use `maxFps: 30` or lower for most CLI applications
- This throttles how often the terminal actually redraws, even if state updates more frequently
- Reduces flicker by preventing excessive terminal repaints

### 3. `<Static>` Component for Non-Re-Rendering Content

The `<Static>` component is the primary mechanism for preventing re-renders on content that has already been displayed. It renders content **permanently above** all other dynamic output.

**Critical Behavior:**
- Items in `<Static>` are rendered once and never re-rendered
- Changes to existing items in the `items` array are **ignored**
- Only **new items** trigger rendering
- Perfect for logs, completed tasks, or any "write-once" content

**Task Runner Example:**
```typescript
import React, {useState, useEffect} from 'react';
import {render, Static, Box, Text} from 'ink';

function TaskRunner() {
  const [completedTasks, setCompletedTasks] = useState([]);
  const [runningTask, setRunningTask] = useState(0);

  useEffect(() => {
    if (runningTask >= 10) return;

    const timer = setTimeout(() => {
      setCompletedTasks(prev => [
        ...prev,
        {
          id: prev.length,
          name: `Task #${prev.length + 1}`,
          duration: Math.floor(Math.random() * 1000)
        }
      ]);
      setRunningTask(prev => prev + 1);
    }, 500);

    return () => clearTimeout(timer);
  }, [runningTask]);

  return (
    <>
      {/* Static content - rendered once, never re-rendered */}
      <Static items={completedTasks} style={{marginBottom: 1}}>
        {(task, index) => (
          <Box key={task.id}>
            <Text color="green">✓ </Text>
            <Text>{task.name}</Text>
            <Text dimColor> ({task.duration}ms)</Text>
          </Box>
        )}
      </Static>

      {/* Dynamic content - updates on every state change */}
      <Box>
        <Text>
          {runningTask < 10 ? (
            <Text color="blue">⠋ Running task {runningTask + 1}...</Text>
          ) : (
            <Text color="green" bold>All tasks completed!</Text>
          )}
        </Text>
      </Box>
    </>
  );
}

render(<TaskRunner />);
```

**Architecture Pattern for Progress Displays:**
```
┌─────────────────────────────────────┐
│  <Static> - Completed items         │  ← Write-once, never redraws
│    ✓ Task 1 (230ms)                 │
│    ✓ Task 2 (145ms)                 │
│    ✓ Task 3 (312ms)                 │
├─────────────────────────────────────┤
│  Dynamic Area - Current progress    │  ← Redraws on state change
│    ⠋ Running task 4...              │
│    Progress: 40%                    │
└─────────────────────────────────────┘
```

### 4. `useStdout` Hook and `write()` for Raw Output

The `useStdout` hook provides direct access to stdout and a `write()` function that outputs text **above Ink's rendering area** without interfering with the UI.

**Use Cases:**
- External logging that shouldn't be part of the UI
- Debug output during development
- Heartbeat/status messages

**Example:**
```typescript
import React, {useEffect} from 'react';
import {render, useStdout, Box, Text} from 'ink';

function LoggingApp() {
  const {stdout, write} = useStdout();

  useEffect(() => {
    // Write external logs above Ink output
    write('Application starting...\n');
    write('Loading configuration...\n');

    const timer = setInterval(() => {
      write(`[${new Date().toISOString()}] Heartbeat\n`);
    }, 2000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Box borderStyle="round" padding={1}>
      <Text>Main application UI (logs appear above)</Text>
    </Box>
  );
}

render(<LoggingApp />);
```

**Key Differences: `<Static>` vs `useStdout.write()`:**

| Feature | `<Static>` | `useStdout.write()` |
|---------|------------|---------------------|
| Output type | React components | Plain strings only |
| Styling | Full Ink styling (colors, borders) | ANSI escape codes only |
| Structure | Array-based, keyed items | Free-form text |
| Use case | UI elements (task lists) | Raw logs, debug output |

### 5. `rerender()` for External Updates

The `render()` function returns a handle with a `rerender()` method for updating the root component from outside React.

**Pattern:**
```typescript
import {render} from 'ink';

const {rerender} = render(<Counter count={1} />);

// Later, from external code (polling callback, etc.)
rerender(<Counter count={2} />);
```

**Use Cases:**
- Integrating with external event sources
- Updating from polling callbacks outside the React tree
- Testing scenarios

### 6. Focus Management for Selective Updates

The `useFocusManager` hook provides programmatic control over which components receive focus and can help optimize renders in complex UIs.

**Methods:**
- `focusNext()` - Move focus to next focusable component
- `focusPrevious()` - Move focus to previous focusable component
- `focus(id)` - Focus specific component by ID
- `enableFocus()` / `disableFocus()` - Toggle focus system

**Example with ID-based focus:**
```typescript
import React, {useState} from 'react';
import {render, useFocus, useFocusManager, useInput, Box, Text} from 'ink';

function MenuItem({id, label}) {
  const {isFocused} = useFocus({id});
  return (
    <Text color={isFocused ? 'green' : 'white'}>
      {isFocused ? '→ ' : '  '}{label}
    </Text>
  );
}

function Menu() {
  const {focusNext, focusPrevious, focus, enableFocus, disableFocus} = useFocusManager();
  const [menuActive, setMenuActive] = useState(true);

  useInput((input, key) => {
    if (key.upArrow) focusPrevious();
    if (key.downArrow) focusNext();

    // Jump to specific item
    if (input === '1') focus('home');
    if (input === '2') focus('settings');
    if (input === '3') focus('exit');

    // Toggle focus system
    if (input === 'd') {
      setMenuActive(false);
      disableFocus();
    }
    if (input === 'e') {
      setMenuActive(true);
      enableFocus();
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold>Menu {menuActive ? '(Active)' : '(Disabled)'}</Text>
      <MenuItem id="home" label="Home" />
      <MenuItem id="settings" label="Settings" />
      <MenuItem id="exit" label="Exit" />
    </Box>
  );
}

render(<Menu />);
```

**Note:** Focus management does not prevent re-renders of unfocused components - it only controls which component is "active" for input handling. For true partial re-renders, use `<Static>`.

### 7. How Ink's Reconciler Handles Updates

Ink uses a custom React reconciler built on `react-reconciler`. Key behaviors:

1. **Batched Updates**: Like React DOM, Ink batches multiple state updates into single renders
2. **Differential Rendering**: Only changed portions of the terminal output are rewritten
3. **Frame Rate Limiting**: The `maxFps` option throttles actual terminal writes
4. **Static Content Optimization**: `<Static>` content is written once and excluded from the reconciliation cycle

**Reconciler Flow:**
```
State Change → React Reconciliation → Ink Layout → Terminal Diff → Write to stdout
                                                         ↑
                                            maxFps throttle applied here
```

### 8. Best Practices for Reducing Flicker

**Architecture Pattern for Polling Applications:**

```typescript
import React, {useState, useEffect} from 'react';
import {render, Static, Box, Text} from 'ink';

function PollingDashboard() {
  const [completedItems, setCompletedItems] = useState([]);
  const [currentStatus, setCurrentStatus] = useState({ progress: 0, message: 'Starting...' });

  useEffect(() => {
    // Polling interval
    const pollInterval = setInterval(async () => {
      const result = await fetchStatus();
      
      // Move completed items to Static (write-once)
      if (result.newCompletedItems.length > 0) {
        setCompletedItems(prev => [...prev, ...result.newCompletedItems]);
      }
      
      // Update dynamic status (will re-render)
      setCurrentStatus({
        progress: result.progress,
        message: result.message
      });
    }, 1000);

    return () => clearInterval(pollInterval);
  }, []);

  return (
    <>
      {/* Completed items - never re-render */}
      <Static items={completedItems}>
        {item => (
          <Box key={item.id}>
            <Text color="green">✓ {item.name}</Text>
          </Box>
        )}
      </Static>

      {/* Current status - updates on each poll */}
      <Box flexDirection="column" marginTop={1}>
        <Text>Progress: {currentStatus.progress}%</Text>
        <Text dimColor>{currentStatus.message}</Text>
      </Box>
    </>
  );
}

// Use maxFps to limit terminal redraws
render(<PollingDashboard />, { maxFps: 15 });
```

**Flicker Reduction Checklist:**

1. **Use `maxFps: 15-30`** - Limit terminal redraws
2. **Use `<Static>` for completed content** - Write once, never redraw
3. **Minimize dynamic content area** - Keep updating region small
4. **Avoid rapid state updates** - Debounce/throttle if needed
5. **Use `useStdout.write()` for logs** - Keep logs out of the React tree
6. **Keep component tree shallow** - Fewer components = faster reconciliation

## Key Takeaways

- **`<Static>` is the primary tool** for preventing re-renders on completed/historical content
- **`maxFps` option** is critical for reducing flicker - default is too high for most CLIs
- **`useStdout.write()`** is for raw string output, `<Static>` is for React components
- **Ink's reconciler** already optimizes via differential rendering and batching
- **Focus management** does NOT control re-renders, only input focus
- **Architecture pattern**: Static content above, dynamic content below
- **`rerender()`** allows external code to update the UI (useful for polling outside React)

## Code Examples

### Complete Polling Progress Display

```typescript
import React, {useState, useEffect, useCallback} from 'react';
import {render, Static, Box, Text, useApp} from 'ink';

interface Task {
  id: number;
  name: string;
  duration: number;
}

interface PollingState {
  completedTasks: Task[];
  currentTask: number;
  progress: number;
  isComplete: boolean;
}

function ProgressDisplay() {
  const {exit} = useApp();
  const [state, setState] = useState<PollingState>({
    completedTasks: [],
    currentTask: 0,
    progress: 0,
    isComplete: false
  });

  // Simulate polling
  useEffect(() => {
    if (state.isComplete) {
      setTimeout(() => exit(), 1000);
      return;
    }

    const poll = setInterval(() => {
      setState(prev => {
        const newProgress = prev.progress + Math.random() * 20;
        
        if (newProgress >= 100) {
          // Task complete - move to static
          const completedTask: Task = {
            id: prev.currentTask,
            name: `Task #${prev.currentTask + 1}`,
            duration: Math.floor(Math.random() * 1000)
          };
          
          const nextTask = prev.currentTask + 1;
          const isComplete = nextTask >= 5;
          
          return {
            completedTasks: [...prev.completedTasks, completedTask],
            currentTask: nextTask,
            progress: 0,
            isComplete
          };
        }
        
        return { ...prev, progress: newProgress };
      });
    }, 200);

    return () => clearInterval(poll);
  }, [state.isComplete, exit]);

  const progressBar = useCallback((percent: number) => {
    const filled = Math.floor(percent / 5);
    const empty = 20 - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }, []);

  return (
    <>
      {/* Completed tasks - rendered once, never updated */}
      <Static items={state.completedTasks}>
        {task => (
          <Box key={task.id}>
            <Text color="green">✓ </Text>
            <Text>{task.name}</Text>
            <Text dimColor> ({task.duration}ms)</Text>
          </Box>
        )}
      </Static>

      {/* Dynamic progress - updates frequently */}
      <Box flexDirection="column" marginTop={1}>
        {state.isComplete ? (
          <Text color="green" bold>All tasks completed!</Text>
        ) : (
          <>
            <Text color="blue">⠋ Running Task #{state.currentTask + 1}...</Text>
            <Text>
              {progressBar(state.progress)} {Math.floor(state.progress)}%
            </Text>
          </>
        )}
      </Box>
    </>
  );
}

// CRITICAL: Use maxFps to reduce flicker
render(<ProgressDisplay />, { maxFps: 15 });
```

## Sources

- vadimdemedes/ink via Context7 (vadimdemedes/ink)
  - Static component documentation
  - useStdout hooks documentation
  - State updates and render performance documentation
  - useFocusManager focus documentation
  - Render options (maxFps, debug) documentation
