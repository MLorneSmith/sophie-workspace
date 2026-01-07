# Context7 Research: E2B Sandbox Memory and CPU Configuration

**Date**: 2026-01-07
**Agent**: context7-expert
**Libraries Researched**: e2b-dev/e2b, e2b-dev/code-interpreter

## Query Summary

Researched how to configure memory (RAM) and CPU when creating E2B sandboxes programmatically. Specifically looking for `Sandbox.create()` parameters.

## Key Finding

**Memory and CPU are configured at TEMPLATE BUILD TIME, not at runtime.**

The `Sandbox.create()` method does NOT accept `memory` or `cpu` parameters. These resources are configured when building the sandbox template using the E2B CLI.

## Findings

### Template Build Configuration (CLI)

CPU and memory are specified when building a template:

```bash
e2b template build [options] [template]
```

**Relevant Options:**
- `--cpu-count <cpu-count>` - Number of CPUs for the sandbox. **Default: 2**
- `--memory-mb <memory-mb>` - Memory in megabytes. **Must be an even number. Default: 512**

**Example:**
```bash
e2b template build \
  --name my-custom-sandbox \
  --cpu-count 4 \
  --memory-mb 2048 \
  --dockerfile ./Dockerfile
```

### e2b.toml Configuration

These values are stored in the `e2b.toml` configuration file:

```toml
# e2b.toml
template_id = "1wdqsf9le9gk21ztb4mo"
dockerfile = "e2b.Dockerfile"
template_name = "my-agent-sandbox"
start_cmd = "<your-start-command>"
# cpu_count and memory_mb are stored here after build
```

### Sandbox.create() Parameters (Runtime)

The `Sandbox.create()` method accepts these parameters - **NOT including CPU or memory**:

**TypeScript/JavaScript:**
```typescript
static create<S>(this: S, opts?: SandboxOpts): Promise<InstanceType<S>>
static create<S>(this: S, template: string, opts?: SandboxOpts): Promise<InstanceType<S>>

interface SandboxOpts {
  allowInternetAccess?: boolean;
  apiKey?: string;
  debug?: boolean;
  domain?: string;
  envs?: Record<string, string>;
  headers?: Record<string, string>;
  logger?: Logger;
  metadata?: Record<string, string>;
  requestTimeoutMs?: number;
  secure?: boolean;
  timeoutMs?: number;
}
```

**Python:**
```python
@classmethod
async def create(cls,
    template: Optional[str] = None,
    timeout: Optional[int] = None,           # Sandbox timeout in seconds (max 24h Pro, 1h Hobby)
    metadata: Optional[Dict[str, str]] = None,
    envs: Optional[Dict[str, str]] = None,
    api_key: Optional[str] = None,
    domain: Optional[str] = None,
    debug: Optional[bool] = None,
    request_timeout: Optional[float] = None,
    proxy: Optional[ProxyTypes] = None,
    secure: Optional[bool] = None,
    allow_internet_access: Optional[bool] = True
) -> 'AsyncSandbox'
```

### Code Interpreter SDK

The `@e2b/code-interpreter` package inherits from the base Sandbox and uses the same pattern - CPU/memory come from the template:

```typescript
import { Sandbox } from '@e2b/code-interpreter'

// Uses default template with default resources (2 CPU, 512MB)
const sandbox = await Sandbox.create()

// Uses custom template with custom resources
const sandbox = await Sandbox.create({ template: 'your-custom-sandbox-name' })
```

### Available Resource Tiers (from metrics output)

From the sandbox metrics CLI output example:
- CPU: 2 Cores (default)
- Memory: 484 MiB available
- Disk: 2453 MiB available

## Key Takeaways

1. **NO runtime CPU/memory configuration** - `Sandbox.create()` does not accept `memory`, `memoryMb`, `cpu`, or `cpuCount` parameters
2. **Template build time only** - Use `--cpu-count` and `--memory-mb` flags with `e2b template build`
3. **Parameter names** (CLI only):
   - `--cpu-count <number>` - Number of CPUs (default: 2)
   - `--memory-mb <number>` - Memory in MB, must be even (default: 512)
4. **To change resources**: Build a custom template with desired CPU/memory, then use that template name in `Sandbox.create()`

## Workflow for Custom Resources

1. Create a Dockerfile for your sandbox
2. Build template with custom resources:
   ```bash
   e2b template build \
     --name high-memory-sandbox \
     --cpu-count 4 \
     --memory-mb 4096
   ```
3. Use the template at runtime:
   ```typescript
   const sandbox = await Sandbox.create('high-memory-sandbox')
   ```

## Sources

- E2B SDK via Context7 (e2b-dev/e2b)
- E2B Code Interpreter via Context7 (e2b-dev/code-interpreter)
- CLI Documentation: sdk-reference/cli/v2.2.1/template/page.mdx
- JS SDK Documentation: sdk-reference/js-sdk/v1.13.0/sandbox/page.mdx
- Python SDK Documentation: sdk-reference/python-sdk/v1.11.1/sandbox_async/page.mdx
