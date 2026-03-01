# 2026-02-12 — Morning Briefing Fixes

*Truncated 2026-03-01 — full history in git*

## 5 Issues Fixed

### 1. Weather Not Working
- **Root cause:** `wttr.in` timing out (exit code 28)
- **Fix:** New `get-weather.sh` using Open-Meteo API (free, no key, reliable)

### 2. No Links in Top Headlines
- **Root cause:** LLM generating headlines without links + JSON key mismatch (`feed` vs `feed_items`)
- **Fix:** Headlines now from feed monitor data (has links), no web search

### 3. Thumbs Up/Down Buttons
- **Root cause:** LLM modifying HMAC-signed URLs
- **Fix:** Cron payload explicitly says copy URLs character-for-character

### 4. Model Usage Script Timeout
- **Root cause:** Spawning `jq` for each of 4,162 session files (~10s)
- **Fix:** grep prefilter + single jq pass (0.2s, 50x faster)

### 5. Overnight Work Misreported
- **Root cause:** LLM inferring from `state/current.md`
- **Fix:** New `get-overnight-work.sh` queries MC API for deterministic data

## Architecture Principle
All 5 fixes reduce LLM dependency — weather, headlines, model usage, overnight work are now deterministic scripts. LLM only formats output.

## Scripts Created
- `~/clawd/scripts/get-weather.sh`
- `~/clawd/scripts/get-model-usage.sh`
- `~/clawd/scripts/get-overnight-work.sh`
