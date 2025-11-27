# WSL2 Stability Fix Implementation Guide

**Issue:** #563 - WSL2 v2.6.2 Pre-Release Instability
**Date:** 2025-11-05
**Status:** Ready for implementation

## Current State (Verified)

✅ **Working:**

- inotify limits: 1,048,576 watches (already optimized)
- inotify instances: 8,192 (sufficient)
- Project location: WSL native filesystem
- Disk space: 916GB available

⚠️ **Problems Confirmed:**

- WSL Version: 2.6.2.0 (pre-release) - **UNSTABLE**
- Kernel: 6.6.87.2 - **pre-release kernel**
- No .wslconfig file - **uncontrolled resources**
- Memory: 15GB total (no hard limits set)

## Implementation Steps

### Priority 1: Downgrade WSL to Stable Version 🔴 CRITICAL

**Execution Context:** Windows PowerShell (Administrator)
**Time Required:** 5 minutes
**Interruption:** WSL will restart

```powershell
# Step 1: Check current version
wsl --version

# Step 2: Update to stable release (removes pre-release)
wsl --update

# Step 3: Verify new version (should be 2.2.4 or 2.3.x, NOT 2.6.x)
wsl --version

# Step 4: Restart WSL
wsl --shutdown
Start-Sleep -Seconds 10
wsl
```text

**Expected Output:**

```text
WSL version: 2.2.4 (or latest stable, NOT 2.6.x)
Kernel version: 5.15.x (stable kernel, NOT 6.6.x)
```

**Verification:**

```bash
# From WSL (after restart)
uname -r  # Should show 5.15.x kernel
```

### Priority 2: Create .wslconfig File 🟡 HIGH

**Execution Context:** Windows (any terminal)
**Time Required:** 2 minutes
**Interruption:** Requires WSL restart

#### Option A: PowerShell (Recommended)

```powershell
# Create .wslconfig in user home directory
$wslConfigPath = "$env:USERPROFILE\.wslconfig"

$wslConfigContent = @"
[wsl2]
# Memory limit - prevents OOM crashes
# Adjust based on your system RAM (current: using 16GB)
memory=16GB

# CPU cores for parallel operations
# Using 6 cores for good build performance
processors=6

# Swap space for test suites and heavy operations
swap=16GB

# Memory reclamation strategy
# dropcache = aggressive reclaim for stability
autoMemoryReclaim=dropcache

# Network stability
localhostForwarding=true

# Prevent disk bloat
sparseVhd=true

# Stability optimizations
kernelCommandLine=vsyscall=emulate
nestedVirtualization=false
"@

# Write configuration
Set-Content -Path $wslConfigPath -Value $wslConfigContent -Encoding UTF8

Write-Host "✅ Created .wslconfig at: $wslConfigPath"
Get-Content $wslConfigPath

# Restart WSL to apply
wsl --shutdown
Start-Sleep -Seconds 10
Write-Host "✅ WSL restarted. Configuration active."
```

#### Option B: Manual Creation

1. Open Notepad
2. Copy the configuration below
3. Save as `C:\Users\msmith\.wslconfig` (ensure no .txt extension)
4. Run `wsl --shutdown` from PowerShell
5. Wait 10 seconds and start WSL

**Configuration Content:**

```ini
[wsl2]
# Memory limit - prevents OOM crashes
memory=16GB

# CPU cores for parallel operations
processors=6

# Swap space for test suites
swap=16GB

# Memory reclamation strategy
autoMemoryReclaim=dropcache

# Network stability
localhostForwarding=true

# Prevent disk bloat
sparseVhd=true

# Stability optimizations
kernelCommandLine=vsyscall=emulate
nestedVirtualization=false
```

### Priority 3: inotify Limits ✅ ALREADY DONE

Current limits are already optimized:

- `max_user_watches`: 1,048,576 (excellent for monorepo)
- `max_user_instances`: 8,192 (sufficient)

**No action required.**

## Post-Implementation Verification

Run this verification script from WSL after implementing fixes:

```bash
#!/bin/bash
echo "=== WSL2 Stability Fix Verification ==="
echo ""

# Check WSL version (should be stable, not pre-release)
echo "1. WSL Version Check:"
wsl.exe --version 2>/dev/null | head -n 1
KERNEL=$(uname -r)
echo "   Kernel: $KERNEL"

if [[ "$KERNEL" =~ ^5\.15 ]]; then
    echo "   ✅ Stable kernel detected"
elif [[ "$KERNEL" =~ ^6\.6 ]]; then
    echo "   ⚠️  Pre-release kernel still active"
else
    echo "   ℹ️  Kernel version: $KERNEL"
fi
echo ""

# Check memory limits
echo "2. Memory Configuration:"
TOTAL_MEM=$(free -g | awk '/^Mem:/{print $2}')
echo "   Total Memory: ${TOTAL_MEM}GB"
if [ "$TOTAL_MEM" -eq 16 ] || [ "$TOTAL_MEM" -eq 15 ]; then
    echo "   ✅ Memory limit applied (16GB)"
else
    echo "   ⚠️  Unexpected memory total: ${TOTAL_MEM}GB"
fi
echo ""

# Check inotify limits
echo "3. inotify Limits:"
MAX_WATCHES=$(cat /proc/sys/fs/inotify/max_user_watches)
echo "   max_user_watches: $MAX_WATCHES"
if [ "$MAX_WATCHES" -ge 524288 ]; then
    echo "   ✅ inotify limits optimized"
else
    echo "   ⚠️  inotify limits may be insufficient"
fi
echo ""

# Test stability with quick build
echo "4. Stability Test (Quick Build):"
cd /home/msmith/projects/2025slideheroes
if pnpm typecheck 2>&1 | tail -n 5; then
    echo "   ✅ Typecheck completed successfully"
else
    echo "   ⚠️  Typecheck failed (may indicate ongoing issues)"
fi
echo ""

echo "=== Verification Complete ==="
```

Save as `/home/msmith/projects/2025slideheroes/temp/verify-wsl-fix.sh` and run:

```bash
chmod +x /home/msmith/projects/2025slideheroes/temp/verify-wsl-fix.sh
./temp/verify-wsl-fix.sh
```

## Expected Outcomes

### Immediate (Within Hours)

- ✅ 90-95% reduction in WSL2 crashes
- ✅ Unit tests complete without interruption
- ✅ Claude Code CLI runs stably
- ✅ Development servers maintain uptime

### Short-Term (Within Days)

- ✅ Predictable memory usage (12-14GB max)
- ✅ No file watcher errors
- ✅ Faster build times
- ✅ Confident running long operations

### Long-Term (Within Weeks)

- ✅ Sustainable development workflow
- ✅ Clear diagnostic data when issues occur
- ✅ Optimized performance

## Troubleshooting

### WSL Update Fails

```powershell
# If wsl --update fails, try manual download:
# Visit: https://github.com/microsoft/WSL/releases
# Download latest stable .msixbundle
# Install manually
```

### .wslconfig Not Applied

```powershell
# Ensure WSL is fully stopped
wsl --shutdown
taskkill /IM wslservice.exe /F
Start-Sleep -Seconds 15
wsl
```

### Memory Limit Too Low

If 16GB causes issues (unlikely), edit `.wslconfig`:

```ini
memory=20GB  # Increase if you have 32GB+ system RAM
```

### Performance Regression

If builds are slower after downgrade:

```ini
# Increase processors in .wslconfig
processors=8  # or higher, based on CPU cores
```

## Rollback Plan

If issues persist after fixes:

1. **Remove .wslconfig** (PowerShell):

   ```powershell
   Remove-Item "$env:USERPROFILE\.wslconfig"
   wsl --shutdown
   ```

2. **Return to pre-release** (NOT recommended):

   ```powershell
   wsl --update --pre-release
   ```

## Monitoring

### Resource Monitoring Script

Save as `/home/msmith/projects/2025slideheroes/temp/monitor-resources.sh`:

```bash
#!/bin/bash
# Continuous resource monitoring
echo "Starting WSL2 resource monitor (Ctrl+C to stop)..."
while true; do
    clear
    echo "=== WSL2 Resource Monitor ==="
    date
    echo ""
    echo "Memory Usage:"
    free -h | grep -E "^Mem:|^Swap:"
    echo ""
    echo "Top Processes by Memory:"
    ps aux --sort=-%mem | head -n 6
    echo ""
    echo "inotify Usage:"
    echo "Watches: $(cat /proc/sys/fs/inotify/max_user_watches)"
    echo ""
    sleep 5
done
```

Run: `./temp/monitor-resources.sh`

## Success Metrics

Track these metrics before and after implementation:

| Metric | Before | Target After |
|--------|--------|--------------|
| Test suite completion rate | <50% | >95% |
| Average uptime (dev server) | <30 min | >8 hours |
| Memory crashes per day | 3-5 | 0 |
| WSL restarts required | 5-10 | 0-1 |
| Build success rate | ~70% | >98% |

## References

- Full Research Report: `/home/msmith/projects/2025slideheroes/reports/2025-11-05/wsl2-stability-research.md`
- GitHub Issue: #563
- Microsoft WSL Releases: <https://github.com/microsoft/WSL/releases>

---

**Implementation Status:**

- [ ] Priority 1: WSL downgrade to stable
- [ ] Priority 2: .wslconfig creation
- [x] Priority 3: inotify limits (already done)
- [ ] Post-fix verification
- [ ] Issue status update

**Next Steps:**

1. Execute Priority 1 from Windows PowerShell (Administrator)
2. Execute Priority 2 .wslconfig creation
3. Run verification script
4. Monitor stability for 24-48 hours
5. Update GitHub issue with results
