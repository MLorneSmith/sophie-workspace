# Context7 Research: E2B Templates, Sandboxes, and Package Persistence

**Date**: 2026-01-23
**Agent**: context7-expert
**Libraries Researched**: E2B SDK (e2b-dev/e2b)

## Query Summary

This research investigates three critical aspects of E2B sandbox templates:

1. **Template Lifecycle**: How templates work and what happens when a sandbox is created from a template
2. **Version Immutability**: Whether software versions baked into templates are immutable or can be updated at runtime
3. **Package Persistence**: How `npm install -g` packages (and other globally installed packages) are handled in templates and persisted across sandbox instances

## Findings

### 1. How Templates Work and Sandbox Creation

#### Template Definition
E2B templates are **Docker-based sandbox images** defined via `e2b.Dockerfile` or `Dockerfile`. The template build process:

1. Create a Dockerfile with a base image and RUN commands to install software
2. Build the template using the CLI: `e2b template build [options]`
3. The CLI converts the Docker image into a E2B sandbox template (a VM image)
4. Once built, the template is published: `e2b template publish`
5. Templates are stored and can be referenced by ID or name

#### Sandbox Creation from Template
When a sandbox is created from a template:

- **JS/TS**:
  ```javascript
  import { Sandbox } from '@e2b/code-interpreter'
  
  // Create from template by name or ID
  const sbx = await Sandbox.create({
    template: 'YOUR_TEMPLATE_ID',
  })
  ```

- **Python**:
  ```python
  from e2b_code_interpreter import Sandbox
  
  sbx = Sandbox.create(template='YOUR_TEMPLATE_ID')
  ```

- **Default Template**: If no template is specified, the `base` sandbox template is used (Ubuntu with Node.js and Python pre-installed)

**Key Point**: Each sandbox instance is created as a **fresh clone** of the template. The template acts as a snapshot/image that's instantiated each time `Sandbox.create()` is called.

#### Template Persistence
Templates are persistent and reusable:
- Built once, published once
- Can spawn unlimited sandbox instances from a single template
- All instances start with identical state (what was baked into the template)

---

### 2. Version Immutability and Runtime Updates

#### Software Versions in Templates are **NOT Immutable**

Versions installed during template build time (in the Dockerfile) are baked into the template image, but they can be **updated at runtime within each sandbox instance**.

**Example - Template Definition**:
```dockerfile
FROM e2bdev/code-interpreter:latest

# Node.js comes from the base image (specific version)
# But individual packages can be updated
RUN npm install -g cowsay@1.4.0
RUN pip install numpy==1.24.0
```

**Example - Runtime Updates in Sandbox**:
```javascript
import { Sandbox } from '@e2b/code-interpreter'

const sbx = await Sandbox.create({ template: 'my-template' })

// Even though the template had cowsay 1.4.0, you can upgrade it
await sbx.commands.run('npm install -g cowsay@2.0.0')

// Or install new packages not in the template
await sbx.commands.run('npm install -g express')
```

#### Important Distinction
- **Template Build Time**: Versions are frozen in the image definition
- **Sandbox Runtime**: Versions can be updated within that specific sandbox instance
- **Isolation**: Updates in one sandbox instance don't affect the template or other sandboxes created from the same template
- **Ephemeral**: Runtime changes are lost when the sandbox is destroyed

---

### 3. How Globally Installed Packages are Handled

#### Packages Installed During Template Build

When you use `npm install -g` in the Dockerfile, those packages are:

**Included in the Template**:
```dockerfile
FROM e2bdev/code-interpreter:latest

RUN npm install -g cowsay
RUN npm install -g typescript
RUN npm install -g @parcel/bundler
```

**Persisted in Every Sandbox Instance**:
- Every sandbox created from this template will have `cowsay`, `typescript`, and `@parcel/bundler` globally available
- These packages are pre-loaded, reducing startup time
- No need to install them in every sandbox creation

#### Runtime Package Installation

Packages can be installed at runtime within each sandbox:

```javascript
import { Sandbox } from '@e2b/code-interpreter'

const sbx = await Sandbox.create()

// Install packages at runtime
await sbx.commands.run('npm install cowsay')  // project-local install
await sbx.commands.run('npm install -g cowsay')  // global install

// Use the installed package
await sbx.runCode(`
  const cowsay = require('cowsay')
  console.log(cowsay.say({ text: 'Hello!' }))
`, { language: 'javascript' })
```

#### Persistence Rules

| Installation Type | Location | Persists Across Calls? | Persists Across Sandboxes? |
|------------------|----------|------------------------|---------------------------|
| Template build `npm install -g` | Global in template | ✅ Yes (within template) | ✅ Yes (baked into all instances) |
| Runtime `npm install -g` | Global in sandbox | ✅ Yes (within sandbox) | ❌ No (lost when sandbox destroyed) |
| Runtime `npm install` | Local/project | ✅ Yes (within sandbox) | ❌ No (lost when sandbox destroyed) |

#### Practical Implications

**Best Practice - Bake into Template**:
```dockerfile
# For packages you always need
FROM e2bdev/code-interpreter:latest

RUN npm install -g @nestjs/cli
RUN npm install -g eslint
RUN pip install pandas numpy
```

**Use Runtime for Optional/Dynamic**:
```javascript
// For packages you might not need, or need specific versions per sandbox
const sbx = await Sandbox.create({ template: 'base-template' })

// Conditionally install based on use case
if (needsDataProcessing) {
  await sbx.commands.run('pip install scikit-learn')
}
```

---

## Key Takeaways

1. **Template = Snapshot**: Templates are Docker-based images that define a sandbox's initial state
2. **Sandbox = Clone**: Each sandbox is a fresh instance of the template, fully isolated from others
3. **Immutability Caveat**: Template content is immutable (can't change what's in the template post-build), but versions in running sandboxes can be updated independently
4. **Global Install Persistence**: Packages installed via `npm install -g` in template Dockerfile are available in all sandboxes created from that template
5. **Runtime Isolation**: Package updates at runtime affect only that specific sandbox instance and are lost when the sandbox is destroyed
6. **Design Pattern**: Pre-bake frequently-used packages into templates for consistency and performance; install optional packages at runtime

---

## Code Examples

### Complete Template Workflow

```dockerfile
# e2b.Dockerfile
FROM e2bdev/code-interpreter:latest

# Install globally used packages
RUN npm install -g typescript ts-node eslint

# Install Python packages
RUN pip install pandas numpy scipy

# Install system tools
RUN apt-get update && apt-get install -y git curl wget
```

### Building and Using Template

```bash
# 1. Build the template
e2b template build -n my-dev-template -c "/bin/bash"

# 2. Publish the template
e2b template publish

# 3. Get your template ID from the dashboard
```

### Creating Sandboxes from Template

```javascript
import { Sandbox } from '@e2b/code-interpreter'

// All instances have typescript, ts-node, eslint pre-installed
const sbx = await Sandbox.create({
  template: 'my-dev-template'
})

// Verify global packages
const result = await sbx.commands.run('npm list -g typescript')
console.log(result) // typescript is already installed

// Install additional packages at runtime (sandbox-specific)
await sbx.commands.run('npm install -g webpack')

// This webpack install only exists in this sandbox
// Other sandboxes from the same template won't have it
```

---

## Sources

- **Library**: E2B SDK via Context7
- **Owner/Repo**: e2b-dev/e2b
- **Documentation Topics**: templates, sandbox creation, packages npm install global, Dockerfile template build
- **Versions Researched**: Latest (v2.2.4)

---

## Next Steps for Implementation

If implementing E2B template-based sandboxes for the SlideHeroes project:

1. **Identify Core Dependencies**: List packages needed for every sandbox instance
2. **Create e2b.Dockerfile**: Include frequently-used tools and libraries
3. **Build and Test Template**: Verify all pre-installed packages work correctly
4. **Handle Dynamic Requirements**: Keep lightweight template, install optional packages at runtime
5. **Version Strategy**: Consider version pinning in template for consistency vs. flexibility at runtime

