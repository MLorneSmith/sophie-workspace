# 2026-02-06 — Claude Performance Analysis

*Truncated 2026-03-01 — full history in git*

## Investigation: EC2 vs PC Performance

Compared Claude Code performance between AWS EC2 and Mike's Windows PC (WSL2).

### Results

| Factor | EC2 | PC |
|--------|-----|-----|
| MCP Servers | 0 | 29 (~3.5GB) |
| Node Processes | 2-3 | 29+ |
| File Count | 78K | 330K |
| Antivirus | None | Windows Defender |

### Verdict
Local Claude was right — network and disk were red herrings. The real culprits:

1. **MCP server bloat** — 29 processes adding latency to every tool call
2. **Windows Defender** — real-time scanning 330K files
3. **Two Claude instances** — duplicated MCP fleets competing

### Recommendations
- Audit and trim MCP servers aggressively
- Exclude WSL2/project dirs from Defender real-time scanning
- Run one Claude instance at a time
