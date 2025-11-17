# Claude Code Hooks

## Active Hooks

### Commit Message Validation

**Hook**: `validate-commit-message.sh`
**Trigger**: Before `Bash` tool executes `git commit` commands
**Purpose**: Validates commit messages follow project conventions

#### Format Required

```
type(scope): description [agent: name]
```

#### Quick Reference

**Valid Types**: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert

**Valid Scopes**:
- Apps: web, payload, e2e, dev-tool
- Features: auth, billing, canvas, course, quiz, admin, api
- Technical: cms, ui, migration, config, deps, tooling
- Infrastructure: ci, deploy, docker, security

**Examples**:
```bash
✅ feat(auth): add OAuth2 login [agent: sdlc_implementor]
✅ fix(cms): resolve bug [agent: debug_engineer]
✅ chore(deps): update Next.js [agent: sdlc_planner]
❌ Added some stuff
❌ FEAT(auth): Add login
❌ feat(auth): Added login.
```

#### Using `/commit` Command

```bash
/commit sdlc_implementor feat auth
/commit debug_engineer fix cms
/commit test_writer test e2e
```

The `/commit` command automatically generates properly formatted messages that pass validation.

#### Configuration

Edit `.claude/settings.json` to configure or disable:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/validate-commit-message.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

To disable all hooks:
```json
{
  "disableAllHooks": true
}
```

#### Troubleshooting

**Hook not running?**
1. Check file is executable: `chmod +x .claude/hooks/validate-commit-message.sh`
2. Verify settings.json has hooks configuration
3. Check line endings: `sed -i 's/\r$//' .claude/hooks/validate-commit-message.sh`

**Always blocks valid messages?**
- Ensure format is exact: `type(scope): description [agent: name]`
- Check type and scope are lowercase and in valid list
- Description should start with lowercase letter
- No period at end

**Hook times out?**
- Increase timeout in settings.json: `"timeout": 10`

#### Documentation

See `/temp/commit-validation-hook-guide.md` for comprehensive documentation.

See `CLAUDE.md` "Git Commit Convention" section for project standards.

---

## Adding New Hooks

To add a new hook:

1. Create hook script in `.claude/hooks/`
2. Make executable: `chmod +x .claude/hooks/your-hook.sh`
3. Add to `.claude/settings.json`:
   ```json
   {
     "hooks": {
       "PreToolUse": [
         {
           "matcher": "ToolName",
           "hooks": [
             {
               "type": "command",
               "command": "bash .claude/hooks/your-hook.sh",
               "timeout": 5
             }
           ]
         }
       ]
     }
   }
   ```

### Available Hook Types

- **PreToolUse**: Before tool execution
- **PostToolUse**: After tool execution
- **UserPromptSubmit**: When user submits prompt
- **SessionStart**: At session start
- **SessionEnd**: At session end
- **Stop**: Before stopping
- **SubagentStop**: Before subagent stops
- **PreCompact**: Before context compaction

### Hook Environment Variables

Your hook has access to:
- `CLAUDE_TOOL`: Name of the tool being used
- `CLAUDE_PARAM_*`: Tool parameters (e.g., `CLAUDE_PARAM_command`)
- `CLAUDE_PROJECT_DIR`: Project root directory

### Hook Exit Codes

- `0`: Success, continue
- `1`: Error (logs but continues)
- `2`: Block operation (stops tool execution)

---

## Best Practices

1. **Keep hooks fast**: Timeout default is 5 seconds
2. **Provide helpful errors**: Clear messages with examples
3. **Use exit code 2 to block**: For validation failures
4. **Log with identifiers**: `echo "[hook-name] message" >&2`
5. **Test thoroughly**: Create test scripts for validation
6. **Document well**: Add README sections for each hook
