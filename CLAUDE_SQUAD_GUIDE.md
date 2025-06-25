# Claude Squad Quick Start Guide

Claude Squad is a terminal-based application that manages multiple AI coding assistants in separate workspaces,
allowing you to work on multiple tasks simultaneously.

## Installation

Claude Squad has been installed and is available as the `cs` command.

## Quick Start

```bash
cd /home/msmith/projects/2025slideheroes
cs
```

## Key Commands

### Session Management

- **`n`** - Create new Claude Code session
- **`N`** - Create new session with custom prompt
- **`Enter`/`o`** - Attach to selected session (reprompt)
- **`Ctrl+q`** - Detach from session (work continues in background)
- **`D`** - Kill selected session
- **`r`** - Resume paused session

### Navigation

- **`↑`/`j`** - Move up in session list
- **`↓`/`k`** - Move down in session list
- **`Tab`** - Switch between preview/diff tabs
- **`Shift+↑/↓`** - Scroll in diff view
- **`q`** - Quit Claude Squad
- **`?`** - Show help

### Git Operations

- **`c`** - Checkout changes locally (commits but doesn't push)
- **`s`** - Commit and push branch to GitHub

## Usage Tips

1. **Isolated Workspaces**: Each session creates a separate git worktree/branch, preventing conflicts between tasks
2. **Background Execution**: Detach with `Ctrl+q` to let Claude continue working while you start other tasks
3. **Review Before Commit**: Always review changes in the diff view before committing
4. **Multiple Tasks**: Work on multiple features, bug fixes, or refactoring tasks simultaneously

## Example Workflow

1. Start Claude Squad in your project:

   ```bash
   cd /home/msmith/projects/2025slideheroes
   cs
   ```

2. Create a new session by pressing `n`

3. Give Claude a task, for example:

   - "Fix all TypeScript errors in the components directory"
   - "Add unit tests for the authentication module"
   - "Refactor the API client to use async/await"

4. Press `Ctrl+q` to detach and let Claude work in the background

5. Create another session with `n` for a different task

6. Monitor progress by selecting sessions and viewing their output

7. When a task is complete:
   - Review changes using the diff view (Tab to switch)
   - Press `c` to commit locally, or
   - Press `s` to commit and push to GitHub

## Advanced Usage

### Using Different AI Assistants

```bash
# Use Aider with GPT-4
cs -p "aider --model gpt-4"

# Use a custom AI tool
cs -p "your-ai-tool --your-options"
```

### Auto-Accept Mode (Experimental)

```bash
# Automatically accept all AI prompts
cs -y
```

## Important Notes

- Each session creates a new git worktree, so changes are isolated
- The `c` command only commits locally without pushing
- Use `s` to push changes to GitHub
- Always ensure you're in your project directory before starting Claude Squad
- Review the diff carefully before committing any changes

## Troubleshooting

If you encounter issues:

1. Check debug information: `cs debug`
2. Reset all instances: `cs reset`
3. Ensure tmux is running properly: `tmux ls`
4. Verify git status in your project: `git status`

## Integration with tmux

Claude Squad uses tmux under the hood. You can:

- Use your existing tmux keybindings within Claude sessions
- Access Claude Squad sessions directly via tmux: `tmux ls`
- Attach to a specific tmux session: `tmux attach -t <session-name>`
