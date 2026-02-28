# SOP: OpenClaw Gateway Watchdog

**Purpose:** Automatically monitor and recover the OpenClaw gateway from known failure patterns without manual intervention.

---

## What It Does

The watchdog runs as a systemd user service, checking the gateway every 60 seconds for three failure modes:

### 1. Dead Process
If the gateway process isn't running, the watchdog restarts it immediately.

### 2. ZAI False Billing Cooldown
**The problem:** OpenClaw's error classifier pattern-matches API responses for billing keywords (`402`, `"credit"`, `"billing"`). When ZAI returns any transient error matching these patterns, OpenClaw enters a multi-hour billing cooldown for the entire ZAI provider — even though the API is fine.

**What the watchdog does:**
1. Detects billing error pattern in gateway logs
2. Waits 30 seconds (avoids restarting during legitimate billing issues)
3. Tests the ZAI API directly (coding plan endpoint)
4. If ZAI responds OK but OpenClaw shows billing errors → restarts gateway
5. If ZAI actually has a billing problem → does nothing

### 3. Stuck Process
If the gateway process exists but hasn't written logs in 10+ minutes, the watchdog restarts it.

---

## Safety Features

- **Circuit breaker:** Maximum 3 restarts per hour. If exceeded, restarts are suppressed and logged.
- **Health check:** After restart, waits up to 90 seconds for the gateway to become healthy (active + logs flowing).
- **State tracking:** `state/watchdog-openclaw.json` tracks journal cursor, last log timestamp, and restart history.
- **All events logged:** `logs/watchdog.log` with UTC timestamps.

---

## Files

| File | Purpose |
|------|---------|
| `scripts/watchdog.sh` | Main watchdog script (310 lines bash) |
| `scripts/watchdog.service` | Systemd service definition |
| `logs/watchdog.log` | Watchdog event log |
| `state/watchdog-openclaw.json` | Runtime state (cursor, restart history) |

---

## Service Management

```bash
# Check status
systemctl --user status watchdog-openclaw.service

# View logs
tail -f ~/clawd/logs/watchdog.log

# Restart watchdog
systemctl --user restart watchdog-openclaw.service

# Stop watchdog
systemctl --user stop watchdog-openclaw.service

# Disable watchdog (stop + prevent auto-start)
systemctl --user disable --now watchdog-openclaw.service

# Re-enable
systemctl --user enable --now watchdog-openclaw.service
```

---

## Installation (if reinstalling)

```bash
chmod +x ~/clawd/scripts/watchdog.sh
mkdir -p ~/.config/systemd/user
cp ~/clawd/scripts/watchdog.service ~/.config/systemd/user/watchdog-openclaw.service
systemctl --user daemon-reload
systemctl --user enable --now watchdog-openclaw.service
```

---

## Configuration

All config is at the top of `scripts/watchdog.sh`:

| Variable | Default | Description |
|----------|---------|-------------|
| `LOOP_SECONDS` | 60 | Check interval |
| `STUCK_SECONDS` | 600 | Seconds without logs before "stuck" restart |
| `BILLING_WAIT_SECONDS` | 30 | Wait before verifying ZAI after billing pattern detected |
| `MAX_RESTARTS_PER_HOUR` | 3 | Circuit breaker limit |
| `HEALTHCHECK_TIMEOUT_SECONDS` | 90 | Max wait for healthy restart |
| `ZAI_ENDPOINT` | `https://api.z.ai/api/coding/paas/v4/chat/completions` | ZAI coding plan endpoint |
| `ZAI_TEST_MODEL` | `glm-4.7` | Model used for ZAI health check |

ZAI API key is read from `~/.openclaw/.secrets.env` (`ZAI_API_KEY`).

---

## Troubleshooting

**Watchdog keeps restarting gateway unnecessarily:**
- Check `logs/watchdog.log` for the detection reason
- If "process_not_running" but gateway IS running: the `gateway_is_active()` function may not be matching. Check `systemctl --user list-units | grep openclaw`

**Watchdog hit circuit breaker:**
- Log shows `CIRCUIT_BREAKER: restart suppressed`
- Wait for the hour window to reset, or investigate the root cause
- Can manually restart gateway: `systemctl --user restart openclaw-gateway.service`

**ZAI verification failing but API is fine:**
- Check `ZAI_API_KEY` in `~/.openclaw/.secrets.env` is current
- Test manually: `curl -H "Authorization: Bearer $ZAI_API_KEY" https://api.z.ai/api/coding/paas/v4/chat/completions -d '{"model":"glm-4.7","messages":[{"role":"user","content":"ping"}],"max_tokens":1}'`
- Remember: coding plan endpoint, NOT regular endpoint

---

## History

- **2026-02-14:** Created and installed. Triggered by 4th occurrence of ZAI false billing cooldown in one day.
- **2026-02-14:** Fixed `gateway_is_active()` grep pattern (leading whitespace in systemd output).
