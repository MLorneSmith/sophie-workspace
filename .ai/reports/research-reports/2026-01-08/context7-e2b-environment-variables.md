# Context7 Research: E2B Sandbox Environment Variables

**Date**: 2026-01-08
**Agent**: context7-expert
**Libraries Researched**: e2b-dev/e2b

## Query Summary

Researched how E2B sandboxes handle environment variables, specifically:
1. Passing environment variables at sandbox creation time (runtime injection)
2. Passing environment variables when running commands in a sandbox
3. Persistence of environment variables set via `Sandbox.create({ envs: {...} })`
4. Whether template environment variables can be overridden at runtime

The goal is to understand the best approach for injecting Supabase credentials (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.) into E2B sandboxes at runtime rather than baking them into templates.

## Findings

### 1. Setting Environment Variables at Sandbox Creation (Runtime Injection)

Environment variables can be passed at sandbox creation time using the `envs` option in `Sandbox.create()`. These become **global environment variables** available for all subsequent operations within that sandbox.

**JavaScript/TypeScript:**
```typescript
import { Sandbox } from '@e2b/code-interpreter'

const sandbox = await Sandbox.create({
  envs: { 
    NEXT_PUBLIC_SUPABASE_URL: 'https://xxx.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'your-service-role-key',
    MY_VAR: 'my_value',
  },
})
```

**Python:**
```python
from e2b_code_interpreter import Sandbox

sandbox = Sandbox.create(
  envs={
    'NEXT_PUBLIC_SUPABASE_URL': 'https://xxx.supabase.co',
    'SUPABASE_SERVICE_ROLE_KEY': 'your-service-role-key',
    'MY_VAR': 'my_value',
  },
)
```

**Key Behavior:**
- These variables are set at sandbox creation time
- They persist for the **entire sandbox lifetime**
- They are available to all subsequent `commands.run()` and `runCode()` calls
- They can be **overridden** on a per-command basis (see below)

### 2. Setting Environment Variables for Individual Commands

You can set or override environment variables for specific command or code execution calls. These are **temporary** and only apply to that specific execution.

**For Command Execution (`sandbox.commands.run()`):**
```typescript
const sandbox = await Sandbox.create()

// Override or add env vars for this specific command
sandbox.commands.run('echo $MY_VAR', {
  envs: { 
    MY_VAR: '123',
  },
})
```

**For Code Execution (`sandbox.runCode()`):**
```typescript
const sandbox = await Sandbox.create()

const result = await sandbox.runCode('import os; print(os.environ.get("MY_VAR"))', {
  envs: { 
    MY_VAR: 'my_value',
  },
})
```

**Key Behavior:**
- Command-level `envs` **override** any global variables with the same name
- Command-level `envs` only apply to that specific command/code execution
- After the command completes, the override is gone (next commands use global envs again)
- Default value is an empty object `{}`

### 3. Environment Variable Persistence

**Yes, environment variables set via `Sandbox.create({ envs: {...} })` persist for the sandbox lifetime.**

From the SDK documentation:
> "Custom environment variables for the sandbox. Used when executing commands and code in the sandbox. Can be overridden with the `envs` argument when executing commands or code."

The hierarchy is:
1. **Template-baked environment variables** (from Dockerfile `ENV` statements)
2. **Sandbox creation environment variables** (from `Sandbox.create({ envs: {...} })`) - override template vars
3. **Command-level environment variables** (from `commands.run({ envs: {...} })`) - override sandbox vars for that command only

### 4. Template Environment Variables vs Runtime Override

**Template environment variables are baked in but CAN be overridden at runtime.**

There are two ways environment variables get into a template:

#### Method A: Dockerfile ENV statements (Baked In)
```dockerfile
FROM e2bdev/code-interpreter:latest
ENV MY_TEMPLATE_VAR="default_value"
```
These are baked into the template image and cannot be removed, but they **can be overridden** at runtime via `Sandbox.create({ envs: {...} })`.

#### Method B: Default E2B Environment Variables
E2B provides built-in environment variables accessible via dot files:
```bash
user@e2b:~$ ls -a /run/e2b/
.E2B_SANDBOX  .E2B_SANDBOX_ID  .E2B_TEAM_ID  .E2B_TEMPLATE_ID
```

#### Runtime Override Behavior
When you pass `envs` to `Sandbox.create()`:
- **Overrides** any template environment variables with the same name
- **Adds** new environment variables not in the template
- **Does NOT** remove template variables you don't specify

**Example:**
```typescript
// Template has: ENV DATABASE_URL="default_db" baked in

// At runtime, override it:
const sandbox = await Sandbox.create({
  template: 'my-custom-template',
  envs: {
    DATABASE_URL: 'production_db',  // Overrides template default
    NEW_VAR: 'new_value',           // Adds new variable
  },
})
```

### 5. Template Configuration (e2b.toml)

The `e2b.toml` configuration file does **NOT** have an `envs` field for baking environment variables. It only supports:

```toml
template_id = "1wdqsf9le9gk21ztb4mo"
dockerfile = "e2b.Dockerfile"
template_name = "my-agent-sandbox"
start_cmd = "<your-start-command>"
ready_cmd = "<your-ready-command>"
```

**To bake environment variables into a template, use Dockerfile `ENV` statements.**

### 6. Build-time Arguments (--build-arg)

For secrets needed during template build (not runtime), use `--build-arg`:

```bash
e2b template build --build-arg SOME_BUILD_SECRET=value
```

**IMPORTANT:** Build args are for build-time only. They do NOT persist into the running sandbox unless you explicitly copy them to an ENV in your Dockerfile:

```dockerfile
ARG SOME_BUILD_SECRET
# This would bake the secret into the image (NOT recommended for secrets!)
# ENV SOME_BUILD_SECRET=$SOME_BUILD_SECRET
```

## Recommendations for Supabase Credentials

Based on the research, here is the recommended approach for injecting Supabase credentials:

### Recommended: Runtime Injection via Sandbox.create()

```typescript
import { Sandbox } from '@e2b/code-interpreter'

const sandbox = await Sandbox.create({
  template: 'your-template-name',
  envs: {
    NEXT_PUBLIC_SUPABASE_URL: getEnvVar('SUPABASE_URL'),
    SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
    SUPABASE_ANON_KEY: getEnvVar('SUPABASE_ANON_KEY'),
    // Add any other credentials needed
  },
})
```

### Why This Approach

| Approach | Security | Flexibility | Recommended |
|----------|----------|-------------|-------------|
| Bake in Dockerfile | Low (secrets in image) | Low (requires rebuild) | No |
| Runtime via Sandbox.create() | High (secrets not in image) | High (change per sandbox) | Yes |
| Command-level envs | High | Medium (must repeat per command) | For overrides only |

### Security Benefits

1. **Secrets not baked into template** - The template image contains no credentials
2. **Per-sandbox credentials** - Different sandboxes can use different credentials
3. **Rotation without rebuild** - Rotate credentials without rebuilding templates
4. **Environment separation** - Use different credentials for dev/staging/prod

### Implementation Pattern

```typescript
// In your server action or API route
async function createSecureSandbox() {
  const sandbox = await Sandbox.create({
    template: 'slideheroes-sandbox',
    envs: {
      // Inject at runtime from server environment
      NEXT_PUBLIC_SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
      SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    },
    timeout: 300, // 5 minutes
  })

  return sandbox
}
```

## Key Takeaways

1. **Use `Sandbox.create({ envs: {...} })` for runtime credential injection** - This is the recommended approach for secrets
2. **Environment variables persist for the sandbox lifetime** - No need to re-pass them on every command
3. **Command-level envs override sandbox-level envs** - Useful for temporary overrides
4. **Template ENV statements can be overridden at runtime** - But avoid baking secrets in templates
5. **e2b.toml does not support envs** - Use Dockerfile ENV for template defaults (non-sensitive only)
6. **--build-arg is for build-time only** - Not for runtime credentials

## Code Examples

### Complete Sandbox Creation with Supabase Credentials

```typescript
import { Sandbox } from '@e2b/code-interpreter'

interface SandboxConfig {
  supabaseUrl: string
  supabaseServiceKey: string
  supabaseAnonKey: string
  additionalEnvs?: Record<string, string>
}

async function createConfiguredSandbox(config: SandboxConfig) {
  const sandbox = await Sandbox.create({
    template: 'slideheroes-sandbox',
    envs: {
      NEXT_PUBLIC_SUPABASE_URL: config.supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: config.supabaseServiceKey,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: config.supabaseAnonKey,
      ...config.additionalEnvs,
    },
    timeout: 600, // 10 minutes
  })

  // Verify environment variables are set
  const result = await sandbox.commands.run('echo $NEXT_PUBLIC_SUPABASE_URL')
  console.log('Supabase URL configured:', result.stdout ? 'Yes' : 'No')

  return sandbox
}
```

### Running Commands with Environment Variable Override

```typescript
// Use sandbox-level env for most operations
await sandbox.commands.run('npm run migrate')

// Override for specific command (e.g., different database)
await sandbox.commands.run('npm run test', {
  envs: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
  },
})
```

## Sources

- E2B SDK Documentation via Context7 (e2b-dev/e2b)
- E2B Environment Variables Page: https://github.com/e2b-dev/e2b/blob/main/apps/web/src/app/(docs)/docs/sandbox/environment-variables/page.mdx
- E2B CLI Template Build Documentation
- E2B JavaScript SDK Reference (v1.13.x)
- E2B Python SDK Reference (v1.5.x, v2.x)
