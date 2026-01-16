# Context7 Research: E2B CLI Sandbox Logs

**Date**: 2026-01-09
**Agent**: context7-expert
**Libraries Researched**: e2b-dev/e2b

## Query Summary

Researched E2B CLI documentation for:
1. The `e2b sandbox logs` command options
2. Log streaming limitations and buffer sizes
3. Real-time log retrieval methods
4. Alternative methods (API vs CLI) for getting sandbox logs

## Findings

### E2B CLI `sandbox logs` Command

The `e2b sandbox logs` command retrieves and displays logs for a specific sandbox.

**Syntax:**
```bash
e2b sandbox logs [options] <sandboxID>
```

**Available Options:**

| Option | Description | Default |
|--------|-------------|---------|
| `--level <level>` | Filter logs by level (DEBUG, INFO, WARN, ERROR). Higher levels are also shown. | INFO |
| `-f, --follow` | Keep streaming logs until the sandbox is closed | - |
| `--format <format>` | Output format (json, pretty) | pretty |
| `--loggers [loggers]` | Filter by logger names (comma-separated) | - |

**Notable Findings:**
- **No `--since` or `--tail` options** are documented
- **No `--refresh` or force-refresh option** exists
- The `-f/--follow` flag enables real-time log streaming

### Log Streaming Capabilities

**Real-time Streaming:**
- Use `-f` or `--follow` to stream logs continuously
- Logs stream until the sandbox is closed
- Supports JSON or pretty output formats

**Filtering:**
- Filter by log level (DEBUG, INFO, WARN, ERROR)
- Filter by specific logger names
- No time-based filtering (--since, --after, --before)

### No Documented Limitations

The Context7 documentation does not mention:
- Log buffer size limits
- Maximum log retention periods
- Log truncation behavior
- Rate limiting on log retrieval

### Alternative Methods: SDK vs CLI

**CLI Method:**
```bash
e2b sandbox logs <sandboxID>
e2b sandbox logs -f <sandboxID>  # Real-time
e2b sandbox logs --level DEBUG <sandboxID>
e2b sandbox logs --format json <sandboxID>
```

**SDK Method (JavaScript):**
```javascript
import { Sandbox } from '@e2b/code-interpreter'

const sandbox = await Sandbox.create()
const result = await sandbox.commands.run('command', {
  onStdout: (data) => console.log(data),
  onStderr: (data) => console.error(data),
})
```

**SDK Method (Python):**
```python
from e2b_code_interpreter import Sandbox

sandbox = Sandbox.create()
result = sandbox.commands.run(
  'command',
  on_stdout=lambda data: print(data),
  on_stderr=lambda data: print(data),
)
```

**Key Differences:**
| Feature | CLI | SDK |
|---------|-----|-----|
| Real-time streaming | `-f` flag | Callbacks (on_stdout/on_stderr) |
| Log level filtering | --level flag | Not directly supported |
| Logger filtering | --loggers flag | Not documented |
| Output format | json/pretty | Raw data via callbacks |
| Historical logs | Yes | No (only live output) |

### Related CLI Commands

**List Sandboxes:**
```bash
e2b sandbox list
e2b sandbox list --state running,paused
```

**Sandbox Metrics:**
```bash
e2b sandbox metrics <sandboxID>
e2b sandbox metrics -f <sandboxID>  # Follow mode
```

**Kill Sandbox:**
```bash
e2b sandbox kill <sandboxID>
e2b sandbox kill --all
```

## Key Takeaways

1. **No `--since` or `--tail` options exist** - The CLI does not support fetching "last N lines" or logs "since timestamp"
2. **Real-time streaming works via `-f/--follow`** - This is the only way to get live logs
3. **No force-refresh option** - Logs are fetched as-is; no cache-busting mechanism documented
4. **SDK provides live callbacks** but no historical log access
5. **CLI provides historical logs** via `e2b sandbox logs` without follow mode
6. **No documented buffer limits** - Potential undocumented limitations may exist
7. **Log level filtering available** - DEBUG, INFO, WARN, ERROR with inheritance

## Recommendations

For scenarios needing recent logs:
1. Use `-f/--follow` to stream real-time logs going forward
2. Use `--level DEBUG` to capture all log levels
3. Use `--format json` for programmatic parsing
4. For historical analysis, the basic `e2b sandbox logs <id>` returns all available logs

For programmatic access:
1. SDK callbacks (`on_stdout`/`on_stderr`) provide real-time output during execution
2. The `CommandHandle` object stores stdout/stderr after execution completes

## Sources

- E2B SDK Reference (e2b-dev/e2b) via Context7
- CLI documentation versions: v1.0.0 through v2.2.4
