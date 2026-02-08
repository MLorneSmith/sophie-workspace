# Chore: Setup Kokoro TTS for Claude Code Audio Notifications

## Chore Description

Configure Kokoro TTS (Text-to-Speech) to provide audio notifications when Claude Code completes tasks. This integrates with the existing Claude Code hooks system to speak completion messages, enabling hands-free awareness of task completion without needing to watch the terminal.

**Background**: The user wants audio feedback when Claude Code finishes responding. Kokoro TTS was selected as the optimal solution because:
- **Actively maintained** (unlike Piper TTS which was archived October 2025)
- **Lightweight** - Only 82M parameters
- **High quality** - Neural voices comparable to much larger models
- **Apache 2.0 license** - Permissive for any use
- **CLI-friendly** - Has dedicated CLI tool (`kokoro-tts`)

## Relevant Files

Files relevant to this chore:

- **`.claude/settings.json`** - Contains hook configuration; will add new TTS hook to Stop event
- **`.claude/hooks/stop.py`** - Existing Stop hook that runs when Claude finishes; reference for hook patterns
- **`.claude/hooks/notification.py`** - Existing notification hook; reference for audio notification patterns
- **`.claude/hooks/utils/constants.py`** - Shared utilities for hooks; may need TTS configuration constants

### New Files

- **`.claude/hooks/speak.py`** - New TTS hook script that speaks completion messages using Kokoro
- **`.claude/hooks/utils/tts.py`** - TTS utility module with Kokoro integration and configuration
- **`scripts/setup-kokoro-tts.sh`** - Installation script for Kokoro TTS and dependencies

## Impact Analysis

This chore adds a new optional feature without modifying existing functionality.

### Dependencies Affected

- **System dependencies**: Requires `espeak-ng` (phoneme generation backend)
- **Python dependencies**: `kokoro>=0.9.4`, `soundfile`, `sounddevice`
- **Audio system**: Requires working audio output (PulseAudio on WSL2)

No existing code depends on this new feature.

### Risk Assessment

**Low Risk**:
- Additive change only - no existing code modified
- Hook uses `|| true` pattern to fail silently
- TTS runs in background to not block Claude
- Feature can be easily disabled by removing hook configuration

### Backward Compatibility

- Fully backward compatible - existing hooks continue to work unchanged
- TTS is opt-in via hook configuration
- No API changes or breaking modifications

## Pre-Chore Checklist

Before starting implementation:
- [ ] Create feature branch: `chore/setup-kokoro-tts`
- [ ] Verify Python 3.11+ is available (required by existing hooks)
- [ ] Test audio output works on WSL2 (`paplay /usr/share/sounds/alsa/Front_Center.wav`)
- [ ] Confirm `uv` is installed for running Python scripts

## Documentation Updates Required

- **CLAUDE.md** - Add section on TTS notifications and configuration
- **`.claude/hooks/README.md`** - Document the new speak.py hook and configuration options
- Code comments in new files explaining usage and configuration

## Rollback Plan

To rollback this chore:
1. Remove the TTS hook entry from `.claude/settings.json` in the `Stop` array
2. Optionally delete the new files:
   - `.claude/hooks/speak.py`
   - `.claude/hooks/utils/tts.py`
   - `scripts/setup-kokoro-tts.sh`
3. Optionally uninstall Kokoro: `pip uninstall kokoro soundfile sounddevice`

No database changes or migrations required.

## Step by Step Tasks

### Step 1: Install System Dependencies

Install espeak-ng which Kokoro requires for phoneme generation:

```bash
sudo apt-get update
sudo apt-get install -y espeak-ng pulseaudio-utils
```

### Step 2: Install Kokoro TTS Python Package

Install Kokoro and audio dependencies:

```bash
# Using pip (will be available to uv scripts)
pip install kokoro>=0.9.4 soundfile sounddevice

# Alternatively, install the CLI tool
pip install kokoro-tts
```

### Step 3: Verify Audio Output Works

Test that audio works on the system:

```bash
# Test with a simple beep or sound
paplay /usr/share/sounds/alsa/Front_Center.wav

# If that fails on WSL2, ensure PulseAudio is configured
export PULSE_SERVER=tcp:$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}')
```

### Step 4: Create TTS Utility Module

Create `.claude/hooks/utils/tts.py` with Kokoro integration:

```python
#!/usr/bin/env python3
"""
TTS utility module for Claude Code hooks.
Uses Kokoro TTS for high-quality neural text-to-speech.
"""

import os
import subprocess
from pathlib import Path


# Configuration
TTS_ENABLED = os.environ.get("CLAUDE_TTS_ENABLED", "1") == "1"
TTS_VOICE = os.environ.get("CLAUDE_TTS_VOICE", "af_heart")  # American female, warm voice
TTS_SPEED = float(os.environ.get("CLAUDE_TTS_SPEED", "1.1"))  # Slightly faster


def speak(text: str, background: bool = True) -> bool:
    """
    Speak text using Kokoro TTS.

    Args:
        text: Text to speak
        background: Run in background (non-blocking)

    Returns:
        True if TTS started successfully, False otherwise
    """
    if not TTS_ENABLED:
        return False

    try:
        # Use kokoro-tts CLI with streaming for immediate playback
        cmd = [
            "python3", "-c",
            f'''
import sounddevice as sd
from kokoro import KPipeline

pipeline = KPipeline(lang_code='a')
for _, _, audio in pipeline("{text}", voice="{TTS_VOICE}", speed={TTS_SPEED}):
    sd.play(audio, samplerate=24000)
    sd.wait()
'''
        ]

        if background:
            # Run in background, detached from parent
            subprocess.Popen(
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                start_new_session=True
            )
        else:
            subprocess.run(cmd, check=True)

        return True
    except Exception:
        return False


def speak_completion(task_type: str = "task") -> bool:
    """Speak a completion message."""
    messages = {
        "task": "Done",
        "build": "Build complete",
        "test": "Tests finished",
        "error": "Task failed",
    }
    return speak(messages.get(task_type, "Done"))
```

### Step 5: Create Speak Hook Script

Create `.claude/hooks/speak.py`:

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = [
#     "kokoro>=0.9.4",
#     "soundfile",
#     "sounddevice",
# ]
# ///
"""
Claude Code hook for TTS notifications on task completion.
Runs on the Stop event to announce when Claude finishes responding.
"""

import json
import os
import sys
import subprocess


# Configuration via environment variables
TTS_ENABLED = os.environ.get("CLAUDE_TTS_ENABLED", "1") == "1"
TTS_VOICE = os.environ.get("CLAUDE_TTS_VOICE", "af_heart")
TTS_SPEED = float(os.environ.get("CLAUDE_TTS_SPEED", "1.1"))


def speak(text: str) -> None:
    """Speak text using Kokoro TTS in background."""
    if not TTS_ENABLED:
        return

    # Run TTS in a completely detached subprocess
    script = f'''
import sounddevice as sd
from kokoro import KPipeline

try:
    pipeline = KPipeline(lang_code='a')
    for _, _, audio in pipeline("{text}", voice="{TTS_VOICE}", speed={TTS_SPEED}):
        sd.play(audio, samplerate=24000)
        sd.wait()
except Exception:
    pass  # Fail silently
'''

    subprocess.Popen(
        ["python3", "-c", script],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        start_new_session=True,
    )


def main():
    try:
        # Read hook input (not used currently, but available for future enhancements)
        input_data = json.load(sys.stdin)

        # Speak completion message
        speak("Done")

        sys.exit(0)
    except Exception:
        # Always exit cleanly to not block Claude
        sys.exit(0)


if __name__ == "__main__":
    main()
```

### Step 6: Create Installation Script

Create `scripts/setup-kokoro-tts.sh`:

```bash
#!/bin/bash
# Setup Kokoro TTS for Claude Code audio notifications

set -e

echo "=== Setting up Kokoro TTS ==="

# Check Python version
python_version=$(python3 --version 2>&1 | cut -d' ' -f2 | cut -d'.' -f1,2)
if [[ $(echo "$python_version < 3.9" | bc -l) -eq 1 ]]; then
    echo "ERROR: Python 3.9+ required, found $python_version"
    exit 1
fi
echo "✓ Python $python_version detected"

# Install system dependencies
echo "Installing system dependencies..."
if command -v apt-get &> /dev/null; then
    sudo apt-get update -qq
    sudo apt-get install -y -qq espeak-ng pulseaudio-utils
    echo "✓ System dependencies installed"
else
    echo "WARNING: apt-get not found, please install espeak-ng manually"
fi

# Install Python packages
echo "Installing Kokoro TTS..."
pip install --quiet kokoro>=0.9.4 soundfile sounddevice
echo "✓ Kokoro TTS installed"

# Test audio (optional)
echo "Testing audio output..."
if command -v paplay &> /dev/null; then
    # Try to play a test sound
    if paplay /usr/share/sounds/alsa/Front_Center.wav 2>/dev/null; then
        echo "✓ Audio output working"
    else
        echo "⚠ Audio test failed - you may need to configure PulseAudio"
        echo "  For WSL2, add to ~/.bashrc:"
        echo '  export PULSE_SERVER=tcp:$(cat /etc/resolv.conf | grep nameserver | awk "{print \$2}")'
    fi
fi

# Test Kokoro
echo "Testing Kokoro TTS..."
python3 -c "from kokoro import KPipeline; print('✓ Kokoro TTS working')" 2>/dev/null || {
    echo "⚠ Kokoro import test failed - check installation"
}

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To enable TTS notifications, the hook is already configured in .claude/settings.json"
echo ""
echo "Configuration (via environment variables):"
echo "  CLAUDE_TTS_ENABLED=1     # Enable/disable (default: 1)"
echo "  CLAUDE_TTS_VOICE=af_heart # Voice selection (default: af_heart)"
echo "  CLAUDE_TTS_SPEED=1.1     # Speech speed (default: 1.1)"
echo ""
echo "Available voices: af_alloy, af_bella, af_heart, af_sarah, am_adam, am_michael, bf_emma, bm_george"
```

### Step 7: Update Claude Settings to Add TTS Hook

Add the TTS hook to `.claude/settings.json` in the `Stop` hooks array:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "uv run $CLAUDE_PROJECT_DIR/.claude/hooks/stop.py --chat || true",
            "timeout": 5
          },
          {
            "type": "command",
            "command": "uv run $CLAUDE_PROJECT_DIR/.claude/hooks/speak.py || true",
            "timeout": 3
          }
        ]
      }
    ]
  }
}
```

### Step 8: Make Scripts Executable

```bash
chmod +x .claude/hooks/speak.py
chmod +x scripts/setup-kokoro-tts.sh
```

### Step 9: Test the Integration

1. Run the setup script:
   ```bash
   ./scripts/setup-kokoro-tts.sh
   ```

2. Test the speak hook manually:
   ```bash
   echo '{"session_id": "test"}' | uv run .claude/hooks/speak.py
   ```

3. Start a Claude Code session and verify audio plays when Claude finishes responding.

### Step 10: Update Documentation

Update `.claude/hooks/README.md` to document the new TTS feature:

```markdown
## TTS Notifications (speak.py)

The `speak.py` hook provides audio notifications when Claude finishes responding.

### Setup

Run the setup script:
```bash
./scripts/setup-kokoro-tts.sh
```

### Configuration

Environment variables:
- `CLAUDE_TTS_ENABLED` - Set to "0" to disable (default: "1")
- `CLAUDE_TTS_VOICE` - Voice selection (default: "af_heart")
- `CLAUDE_TTS_SPEED` - Speech speed multiplier (default: "1.1")

### Available Voices

| Voice | Description |
|-------|-------------|
| af_heart | American female, warm (recommended) |
| af_bella | American female, clear |
| af_sarah | American female, professional |
| am_adam | American male, neutral |
| am_michael | American male, friendly |
| bf_emma | British female |
| bm_george | British male |
```

### Step 11: Run Validation Commands

Execute validation to ensure the chore is complete with zero regressions.

## Validation Commands

Execute every command to validate the chore is complete with zero regressions.

```bash
# 1. Verify system dependencies installed
which espeak-ng && echo "✓ espeak-ng installed"

# 2. Verify Python packages installed
python3 -c "from kokoro import KPipeline; print('✓ kokoro installed')"
python3 -c "import sounddevice; print('✓ sounddevice installed')"
python3 -c "import soundfile; print('✓ soundfile installed')"

# 3. Verify hook script syntax
python3 -m py_compile .claude/hooks/speak.py && echo "✓ speak.py syntax valid"

# 4. Verify hook script runs without error (manual test)
echo '{"session_id": "test"}' | timeout 10 uv run .claude/hooks/speak.py && echo "✓ speak.py executes"

# 5. Verify settings.json is valid JSON
python3 -c "import json; json.load(open('.claude/settings.json')); print('✓ settings.json valid')"

# 6. Verify existing hooks still work
echo '{"session_id": "test", "transcript_path": "/tmp/test.jsonl"}' | uv run .claude/hooks/stop.py --chat && echo "✓ stop.py still works"

# 7. Run project typecheck to ensure no regressions
pnpm typecheck

# 8. Run project lint to ensure code quality
pnpm lint
```

## Notes

### Voice Selection Guide

For completion notifications, short voices work best:
- **`af_heart`** (recommended) - Warm, pleasant, good for "Done" messages
- **`af_bella`** - Clear, professional alternative
- **`am_adam`** - Male voice option

### WSL2 Audio Configuration

If audio doesn't work on WSL2, add to `~/.bashrc`:
```bash
export PULSE_SERVER=tcp:$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}')
```

Then restart your terminal or run `source ~/.bashrc`.

### Disabling TTS

To temporarily disable without removing the hook:
```bash
export CLAUDE_TTS_ENABLED=0
```

To permanently disable, remove the speak.py entry from `.claude/settings.json`.

### Future Enhancements

Potential improvements for future iterations:
1. Different messages based on task outcome (success vs error)
2. Configurable messages via environment variable
3. Volume control
4. Queue multiple messages instead of overlapping
5. Integration with SubagentStop for sub-agent completion notifications
