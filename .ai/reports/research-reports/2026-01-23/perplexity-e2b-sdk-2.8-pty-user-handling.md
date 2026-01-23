# Perplexity Research: E2B SDK 2.8 PTY User Handling

**Date**: 2026-01-23
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API (multiple queries)

## Query Summary

Investigated E2B SDK version 2.8 changelog, release notes, and breaking changes with specific focus on:
1. What's new or changed in E2B SDK 2.8.x
2. PTY user handling and default user context
3. Template/sandbox user behavior changes

## Key Findings

### 1. Default User in E2B Sandboxes

**Critical Finding**: E2B's default user is `"user"` (NOT `root`), which is intentionally different from Docker defaults.

From E2B documentation (https://e2b.dev/docs/template/user-and-workdir):

> "The default user is `user` with the `/home/user` (home directory) as the working directory. This is **different from the Docker defaults**, where the default user is `root` with `/` as the working directory. This is to help with tools installation, and to improve default security."

### 2. PTY User Parameter

When creating a PTY session, the `user` parameter defaults to `"user"`:

**Python:**
```python
sandbox.pty.create(
    size=PtySize(...),
    user="user",  # Default value
    cwd="/home/user",
    envs={...}
)
```

**JavaScript:**
```javascript
await sandbox.pty.create({
    user: "user"  // Default value
})
```

### 3. ENVD_DEFAULT_USER Version Behavior

From DeepWiki analysis of the Python SDK source code:

> "For envd versions prior to `ENVD_DEFAULT_USER` (0.4.0), an explicit username must be provided. Newer versions default to the template's configured user."

This suggests there may be version-dependent behavior where:
- **envd < 0.4.0**: Explicit username required (may fall back to root if not provided)
- **envd >= 0.4.0**: Defaults to template's configured user (typically "user")

### 4. SDK 2.8.x Specific Changes

The E2B SDK 2.8.x releases on PyPI/NPM exist but detailed v2.8-specific changelogs are sparse. Key changes found around the 2.x series:

| Change | Description |
|--------|-------------|
| PTY Bug Fix (Week #57, Aug 2024) | "Fixed a bug with starting process with PTY more than once" |
| PTY Python SDK Support | "Add terminal (`pty`) support to Python SDK" |
| PTY Output Fix | "Fix terminal `pty` missing output" |
| SDK v2 Breaking Changes | Sandbox creation changed from constructor `Sandbox()` to class method `Sandbox.create()` |
| Communication Security | "Secure by default" (auth required; SDK handles automatically) |

### 5. Template User Persistence

The last user set in the template definition is persisted as the default for sandbox execution:

```javascript
const template = Template()
  .fromBaseImage()
  .runCmd("whoami") // user
  .setUser("guest")
  .runCmd("whoami") // guest

const sbx = await Sandbox.create()
await sbx.commands.run("whoami") // guest (persisted from template)
```

### 6. Possible Root User Scenarios

If PTY is running as root when it should be "user", possible causes include:

1. **Custom template built with root user** - If the template's Dockerfile uses `USER root` without switching back
2. **Old envd version** - envd < 0.4.0 may have different default user behavior
3. **Explicit user parameter** - Code may be passing `user="root"` explicitly
4. **Template user setting** - The `.setUser()` in template definition may be set to root
5. **SDK version mismatch** - Version 2.8.2 may interact differently with older infrastructure

## Sources & Citations

1. E2B Documentation - User and Workdir: https://e2b.dev/docs/template/user-and-workdir
2. E2B Changelog: https://changelog.e2b.dev/changelog
3. E2B GitHub Releases: https://github.com/e2b-dev/E2B/releases
4. DeepWiki E2B Analysis: https://deepwiki.com/e2b-dev/E2B/
5. E2B Framer Changelog: https://e2b-changelog.framer.website

## Key Takeaways

- **E2B defaults to "user" not "root"** - This is by design for security
- **PTY `user` parameter defaults to "user"** - Should not run as root unless explicitly specified
- **Template user persists** - Check template definition if wrong user is being used
- **envd version matters** - ENVD_DEFAULT_USER (0.4.0) changed default user behavior
- **No v2.8-specific breaking changes** for PTY user handling were documented

## Recommendations for Investigation

1. **Check template definition** - Verify the template doesn't set `USER root` without switching back
2. **Check PTY creation code** - Ensure `user` parameter is not explicitly set to "root"
3. **Verify envd version** - Check if sandbox infrastructure is using envd >= 0.4.0
4. **Test with explicit user** - Try `sandbox.pty.create(user="user")` to force non-root
5. **Check SDK initialization** - Review how sandbox is created and if any user context is set

## Related Searches

- E2B envd changelog and version history
- E2B template Dockerfile USER directive best practices
- E2B SDK v2 migration guide for user context changes
