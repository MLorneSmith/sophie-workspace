# E2B API Reference

Comprehensive reference for E2B sandbox SDK. For quick start, see SKILL.md.

## Configuration Options

### Python Sandbox.create()

```python
sandbox = Sandbox.create(
    template="base",              # Template name or ID (optional)
    timeout=300,                  # Seconds (default: 300, max: 86400 Pro, 3600 Hobby)
    metadata={"key": "value"},    # Custom tracking metadata
    envs={"VAR": "value"},        # Environment variables
    api_key="e2b_***",            # Defaults to E2B_API_KEY env var
    secure=False,                 # Require auth token for operations
    allow_internet_access=True    # Network access in sandbox
)
```

### TypeScript Sandbox.create()

```typescript
const sandbox = await Sandbox.create({
  template: 'base',
  timeoutMs: 300000,              // Milliseconds
  requestTimeoutMs: 60000,        // API request timeout
  metadata: { key: 'value' },
  envs: { VAR: 'value' },
  apiKey: 'e2b_***',
  secure: false,
  allowInternetAccess: true,
  debug: false,
  logger: console
})
```

## Error Types

### Python Exceptions

| Exception | Cause |
|-----------|-------|
| `AuthenticationException` | Invalid or missing API key |
| `SandboxException` | General sandbox operation failure |

### TypeScript Errors

| Error | Cause |
|-------|-------|
| `AuthenticationError` | Invalid or missing API key |
| `RateLimitError` | Too many requests |
| `TimeoutError` | Operation timed out |
| `TemplateError` | Invalid template version |
| `InvalidArgumentError` | Invalid parameters |
| `SandboxError` | General sandbox failure |

## Execution Results

### ExecutionResult Object

```python
execution = sandbox.run_code("code")

execution.text        # String result of last expression
execution.logs        # Combined stdout/stderr
execution.stdout      # List of stdout messages
execution.stderr      # List of stderr messages
execution.error       # ExecutionError if failed, None otherwise
execution.results     # List of Result objects (charts, etc.)
```

### ExecutionError Object

```python
if execution.error:
    execution.error.name       # Exception type (e.g., "ValueError")
    execution.error.value      # Error message
    execution.error.traceback  # Full Python traceback
```

## File System API

### Files Interface

```python
# Write content
sandbox.files.write(path, content, user="user")

# Read content
content = sandbox.files.read(path, format="text")  # or "bytes"

# List directory
entries = sandbox.files.list(path)
# Returns: [FileInfo(name, type, path), ...]

# Check existence
exists = sandbox.files.exists(path)

# Get file info
info = sandbox.files.getInfo(path)
# Returns: FileInfo(name, type, path)

# Create directory
sandbox.files.make_dir(path)

# Remove file/directory
sandbox.files.remove(path)

# Watch for changes
sandbox.files.watch(path, on_event=callback, timeout=60000)
```

### Download/Upload URLs

```python
# Get download URL (useful for large files)
url = sandbox.download_url(path, use_signature_expiration=3600)

# Get upload URL
url = sandbox.upload_url(path)
```

## Commands API

```python
# Run command
result = sandbox.commands.run("ls -la", cwd="/home", timeout=60)

result.stdout      # Standard output
result.stderr      # Standard error
result.exit_code   # Exit code (0 = success)

# Run in background
process = sandbox.commands.run("server &", background=True)
```

## Network Access

```python
# Get host URL for a port
host = sandbox.get_host(8000)
# Returns: "sandbox-id-8000.e2b.app"

# Use in code
sandbox.run_code("""
import http.server
server = http.server.HTTPServer(('0.0.0.0', 8000), Handler)
server.serve_forever()
""")

# Access from outside
# https://sandbox-id-8000.e2b.app
```

## Async API (Python)

```python
from e2b import AsyncSandbox

async def main():
    async with AsyncSandbox.create() as sandbox:
        result = await sandbox.run_code("print('async!')")

        # Async file operations
        await sandbox.files.write("/tmp/data.txt", "content")
        content = await sandbox.files.read("/tmp/data.txt")

        # Async commands
        result = await sandbox.commands.run("ls")
```

## Rate Limits

- Hobby tier: Lower limits, 1-hour max timeout
- Pro tier: Higher limits, 24-hour max timeout

Handle rate limits with exponential backoff:

```python
import time

def create_with_retry(max_retries=3):
    delay = 1
    for attempt in range(max_retries):
        try:
            return Sandbox.create()
        except Exception as e:
            if "rate limit" in str(e).lower():
                time.sleep(delay)
                delay *= 2
            else:
                raise
    raise Exception("Max retries exceeded")
```

## Templates

### Built-in Templates

- `base` - Minimal Linux environment
- `python-data-science` - Python with pandas, numpy, matplotlib
- `node` - Node.js environment

### Custom Templates

Create via E2B dashboard or CLI:

```bash
# List templates
e2b template list

# Publish template
e2b template publish --path ./my-template

# Template config (e2b.toml)
[template]
name = "my-custom-template"
dockerfile = "Dockerfile"
ready_cmd = "curl -s localhost:3000/health"
```

## Security Best Practices

1. **Use secure mode in production**:
   ```python
   sandbox = Sandbox.create(secure=True)
   ```

2. **Disable internet when not needed**:
   ```python
   sandbox = Sandbox.create(allow_internet_access=False)
   ```

3. **Use pre-signed URLs for file sharing**:
   ```python
   url = sandbox.download_url(path, use_signature_expiration=60)
   ```

4. **Pass secrets via environment variables**:
   ```python
   sandbox = Sandbox.create(envs={"API_KEY": os.environ["SECRET"]})
   ```

5. **Set appropriate timeouts**:
   ```python
   sandbox = Sandbox.create(timeout=min_needed + buffer)
   ```

## Common Patterns

### Parallel Execution

```python
import asyncio
from e2b import AsyncSandbox

async def run_parallel(code_snippets):
    async def run_one(code):
        async with AsyncSandbox.create() as sandbox:
            return await sandbox.run_code(code)

    return await asyncio.gather(*[run_one(c) for c in code_snippets])
```

### Sandbox Pool

```python
class SandboxPool:
    def __init__(self, size=3):
        self.sandboxes = [Sandbox.create() for _ in range(size)]
        self.available = list(self.sandboxes)

    def acquire(self):
        if self.available:
            return self.available.pop()
        return Sandbox.create()

    def release(self, sandbox):
        if sandbox.is_running():
            self.available.append(sandbox)

    def cleanup(self):
        for s in self.sandboxes:
            s.kill()
```

### Result Caching

```python
from functools import lru_cache
import hashlib

cache = {}

def execute_cached(code):
    key = hashlib.md5(code.encode()).hexdigest()
    if key in cache:
        return cache[key]

    with Sandbox.create() as sandbox:
        result = sandbox.run_code(code)
        cache[key] = result.text
        return result.text
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `AuthenticationException` | Check E2B_API_KEY is set and valid |
| Sandbox times out | Increase timeout or optimize code |
| Rate limit errors | Implement backoff, upgrade plan |
| Connection refused | Check internet access setting |
| File not found | Verify path, check permissions |

## Links

- Documentation: https://e2b.dev/docs
- Dashboard: https://e2b.dev/dashboard
- GitHub: https://github.com/e2b-dev/E2B
- Python SDK: https://pypi.org/project/e2b-code-interpreter/
- Node SDK: https://www.npmjs.com/package/@e2b/code-interpreter
