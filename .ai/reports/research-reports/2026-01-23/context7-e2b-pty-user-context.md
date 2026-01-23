# Context7 Research: E2B SDK PTY User Context

**Date**: 2026-01-23
**Agent**: context7-expert
**Libraries Researched**: e2b-dev/e2b (E2B SDK)

## Query Summary

Investigated E2B SDK documentation to understand PTY (pseudo-terminal) user context:
1. What user does PTY run as by default?
2. Is there a `user` option for the PTY create method?
3. Any recent SDK changes affecting user context?

## Findings

### 1. Default PTY User

**The PTY runs as `"user"` by default, NOT as root.**

From the E2B SDK documentation:

```python
# Python SDK
def create(size: PtySize,
           user: Username = "user",  # <-- Default is "user"
           cwd: Optional[str] = None,
           envs: Optional[Dict[str, str]] = None,
           timeout: Optional[float] = 60,
           request_timeout: Optional[float] = None) -> CommandHandle
```

```typescript
// JavaScript/TypeScript SDK
interface CommandStartOpts {
  user?: Username;  // Default: user
  // ...
}
```

The documentation explicitly states:
> `user` (Username) - Optional - The user to run the PTY as (defaults to "user").

### 2. User Option Availability

**Yes, the `user` option IS available** on the PTY create method in both Python and JavaScript SDKs.

#### Python SDK
```python
async def create(
    size: PtySize,
    on_data: OutputHandler[PtyOutput],
    user: Username = "user",  # <-- User parameter available
    cwd: Optional[str] = None,
    envs: Optional[Dict[str, str]] = None,
    timeout: Optional[float] = 60,
    request_timeout: Optional[float] = None
) -> AsyncCommandHandle
```

#### JavaScript/TypeScript SDK
The `PtyCreateOpts` interface includes a `user` option (inherited from CommandStartOpts pattern):
```typescript
interface CommandStartOpts {
  background?: boolean;
  cwd?: string;
  envs?: Record<string, string>;
  onStderr?: (data: string) => void | Promise<void>;
  onStdout?: (data: string) => void | Promise<void>;
  requestTimeoutMs?: number;
  timeoutMs?: number;
  user?: Username;  // <-- User parameter available
}
```

### 3. Version History Analysis

The documentation shows the `user` parameter has been consistently available with default `"user"` across all documented SDK versions:
- Python SDK v1.0.0 through v2.1.4 - consistent `user: Username = "user"` default
- JavaScript SDK v1.0.6 through v2.1.3 - consistent `user?: Username` with default "user"

**No breaking changes observed** in user context handling between versions.

## Key Takeaways

1. **Default user is `"user"`, not `root`** - If you're seeing root privileges, something else is setting the user context.

2. **User option is available** - You can explicitly set `user: "user"` in the PTY create options to ensure non-root execution.

3. **Possible causes of root execution**:
   - The command inside PTY is using `sudo`
   - The sandbox template was configured with root as default
   - Custom sandbox configuration overriding user context
   - A different API method (not PTY) being used that has different defaults

4. **Recommended fix**: Explicitly pass `user: "user"` when creating PTY to guarantee non-root execution:

   ```typescript
   // TypeScript
   const pty = await sandbox.pty.create({
     size: { cols: 80, rows: 24 },
     user: "user",  // Explicitly set non-root user
     // ...other options
   });
   ```

   ```python
   # Python
   pty = await sandbox.pty.create(
       size=PtySize(cols=80, rows=24),
       user="user",  # Explicitly set non-root user
       on_data=handler
   )
   ```

## Code Examples

### Explicit User Setting (Recommended)

```typescript
// TypeScript - Ensure non-root execution
import { Sandbox } from '@e2b/code-interpreter';

const sandbox = await Sandbox.create();

// Explicitly set user to avoid any root issues
const pty = await sandbox.pty.create({
  size: { cols: 80, rows: 24 },
  user: "user",
  cwd: "/home/user",
  envs: { PATH: "/usr/local/bin:/usr/bin:/bin" }
});
```

### Python Equivalent

```python
from e2b import Sandbox

sandbox = await Sandbox.create()

pty = await sandbox.pty.create(
    size=PtySize(cols=80, rows=24),
    user="user",
    cwd="/home/user",
    on_data=lambda data: print(data)
)
```

## Sources

- E2B SDK via Context7 (e2b-dev/e2b)
- Python SDK Reference: v1.0.0 - v2.1.4
- JavaScript SDK Reference: v1.0.6 - v2.1.3
- Documentation sections: sandbox_sync, sandbox_async, commands

## Debugging Suggestions

If PTY is running as root despite the default:

1. **Check sandbox template**: Custom templates may override user defaults
2. **Check if sudo is in the command**: The PTY user may be "user" but a command using sudo
3. **Check sandbox create options**: Some sandbox options may affect user context
4. **Verify E2B SDK version**: Ensure using a recent version with documented behavior
5. **Check environment**: Custom envs might include `USER=root` or similar
