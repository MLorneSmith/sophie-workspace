# Perplexity Research: CLI Audio Alerts and Claude Code Hooks

**Date**: 2025-12-17
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Researched four interconnected topics:
1. Linux/WSL2 command line audio alert methods
2. WSL2 desktop notification integration with Windows
3. Cross-platform audio alert solutions
4. Claude Code CLI hooks and extensibility system

## Findings

### 1. Linux/WSL2 Command Line Audio Alerts

#### Terminal Bell (Simplest, No Setup)
The terminal bell character works instantly without PulseAudio setup:
```bash
echo -e '\a'     # ASCII bell character
tput bel         # Alternative using tput
printf '\a'      # printf version
```
- **Non-blocking**: `echo -e '\a' & disown`
- **Pros**: Zero setup, lightweight, works everywhere
- **Cons**: Only produces system beep sound

#### paplay (PulseAudio - Best for Custom Sounds)
```bash
sudo apt install pulseaudio-utils
paplay /usr/share/sounds/alsa/Front_Center.wav
paplay beep.wav & disown                          # Non-blocking
paplay --volume=50000 beep.wav & disown           # With volume (0-65536)
```

#### aplay (ALSA Direct)
```bash
sudo apt install alsa-utils
aplay /usr/share/sounds/alsa/Noise.wav
aplay beep.wav & disown                           # Non-blocking
speaker-test -t sine -f 1000 -l 1 -s 1 & disown  # Generate 1kHz tone
```

#### mpv (Modern, Versatile)
```bash
sudo apt install mpv
mpv --no-video --audio-display=no beep.mp3
mpv --length=0.5 beep.wav --no-audio-display & disown  # 0.5s playback
mpv --volume=50 beep.wav & disown                      # With volume control
```

#### Modern Alternatives
| Tool | Command | Description |
|------|---------|-------------|
| **sox** | `play -n synth 0.1 sin 800 & disown` | Generate tones on-the-fly |
| **spd-say** | `spd-say "Alert!" & disown` | Text-to-speech alerts |
| **ffplay** | `ffplay -nodisp -autoexit -t 0.5 beep.wav & disown` | FFmpeg player |

#### WSL2 PulseAudio Setup (One-Time)
1. Download PulseAudio for Windows, extract to `C:\pulse`
2. Create `C:\pulse\config.pa`:
   ```
   load-module module-native-protocol-tcp auth-anonymous=1
   load-module module-waveout sink_name=output source_name=input record=0
   ```
3. Edit `C:\pulse\etc\pulse\daemon.conf`: `exit-idle-time = -1`
4. Run: `C:\pulse\pulseaudio.exe -F config.pa`
5. In WSL add to `.bashrc`:
   ```bash
   export PULSE_SERVER=tcp:$(grep nameserver /etc/resolv.conf | awk '{print $2}')
   ```

### 2. WSL2 Desktop Notifications with Sound

**Key Finding**: Native Linux `notify-send` does NOT reach Windows notification center. You must use Windows-side tools.

#### wsl-notify-send (Recommended)
Stuart Leeks' tool emulates `notify-send` but triggers Windows toast notifications:
```bash
# Install: Download wsl-notify-send.exe to C:\Tools\ and add to PATH

# Option A: Alias in ~/.bashrc
alias notify-send=wsl-notify-send.exe

# Option B: Replace binary in PATH
# Copy wsl-notify-send.exe as 'notify-send' to a directory early in PATH
```
Usage:
```bash
notify-send "Title" "Body text"
```

#### PowerShell Integration
For more control over sound, use PowerShell with BurntToast module:
```bash
# Create wrapper function in ~/.bashrc
notify-send() {
    local title="$1"
    local body="${2:-}"
    powershell.exe -NoProfile -ExecutionPolicy Bypass \
      -File C:\\Tools\\wsl-toast.ps1 \
      -Title "$title" -Message "$body"
}
```

PowerShell script with BurntToast can specify toast audio (Reminder, IM, Mail) or mute.

### 3. Cross-Platform Audio Solutions

#### OS-Native Commands (Fastest, No Dependencies)
| Platform | Command |
|----------|---------|
| macOS | `afplay /path/to/sound.wav` |
| Linux | `paplay /path/to/sound.wav` or `aplay /path/to/sound.wav` |
| Windows (PowerShell) | `[System.Media.SoundPlayer]::new("C:\path\sound.wav").PlaySync()` |
| Windows (Beep) | `[System.Media.SystemSounds]::Beep.Play()` |

#### Node.js Packages
- **`play-sound`**: Thin wrapper detecting platform, calls underlying player
  ```javascript
  const player = require('play-sound')();
  player.play('alert.mp3', err => { if (err) console.error(err); });
  ```
- **`node-notifier`**: Desktop notifications with sound (cross-platform)

#### Python Libraries
- **`playsound`**: Minimal cross-platform sound playback
  ```python
  from playsound import playsound
  playsound("alert.mp3")
  ```
- **`simpleaudio`**: More control (non-blocking, stop, etc.)
- **`pygame.mixer`**: Heavy but powerful for complex audio

#### Universal Cross-Platform Script Pattern
```bash
#!/bin/bash
play_alert() {
    local sound="${1:-alert.wav}"
    case "$(uname -s)" in
        Darwin)  afplay "$sound" & ;;
        Linux)   paplay "$sound" & disown 2>/dev/null || aplay "$sound" & disown ;;
        MINGW*|CYGWIN*|MSYS*) 
            powershell.exe -c "[System.Media.SoundPlayer]::new('$sound').Play()" & ;;
    esac
}
```

### 4. Claude Code Hooks and Extensibility (Major Finding!)

**Claude Code has a comprehensive hook system** - contrary to initial search results suggesting it didn't exist.

#### Hook Events Available
| Hook Event | When It Fires | Can Block? |
|------------|---------------|------------|
| **PreToolUse** | Before tool calls | Yes (exit code 2) |
| **PostToolUse** | After tool calls complete | No (tool already ran) |
| **UserPromptSubmit** | When user submits prompt | Yes |
| **PermissionRequest** | When permission dialog shown | Yes (allow/deny) |
| **Notification** | When Claude sends notifications | No |
| **Stop** | When Claude finishes responding | Yes (force continuation) |
| **SubagentStop** | When subagent tasks complete | No |
| **PreCompact** | Before compaction operation | No |
| **SessionStart** | When session starts/resumes | No |
| **SessionEnd** | When session ends | No |

#### Hook Configuration
Hooks are configured in `~/.claude/settings.json` or `.claude/settings.json`:
```json
{
  "hooks": {
    "Notification": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "notify-send 'Claude Code' 'Awaiting your input'"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "paplay ~/.sounds/task-complete.wav & disown"
          }
        ]
      }
    ]
  }
}
```

#### Setting Up Hooks via CLI
1. Run `/hooks` slash command
2. Select hook event (e.g., `Notification`, `Stop`)
3. Add matcher (use `*` for all, or specific tool names)
4. Add hook command
5. Choose storage location (User or Project)

#### Notification Hook for Audio Alerts
Perfect for your use case:
```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "wsl-notify-send.exe 'Claude Code' 'Needs input' && paplay ~/.sounds/alert.wav & disown"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "paplay ~/.sounds/complete.wav & disown"
          }
        ]
      }
    ]
  }
}
```

#### Plugin System (October 2025)
Claude Code now supports plugins for packaging and sharing:
- Custom slash commands
- Subagents
- MCP servers
- Hooks

Install plugins: `/plugin install <name>`
Add marketplaces: `/plugin marketplace add user/repo`

## Sources & Citations

1. Claude Code Hooks Guide: https://code.claude.com/docs/en/hooks-guide
2. Claude Code Plugins Announcement: https://www.claude.com/blog/claude-code-plugins
3. Claude Code Hooks Mastery (GitHub): https://github.com/disler/claude-code-hooks-mastery
4. Building Claude Code Plugins: https://alexop.dev/posts/building-my-first-claude-code-plugin/
5. Claude Code CLI Cheatsheet: https://shipyard.build/blog/claude-code-cheat-sheet/

## Key Takeaways

### For Audio Alerts on WSL2
1. **Simplest**: Use terminal bell `echo -e '\a'` - works without setup
2. **Best quality**: Set up PulseAudio, then use `paplay` or `mpv`
3. **Always use `& disown`** for non-blocking execution in scripts
4. **Pre-download** short WAV files to `~/sounds/` for consistent alerts

### For Desktop Notifications
1. **Use `wsl-notify-send`** aliased as `notify-send` for transparent integration
2. Windows notification sound is controlled by Windows settings
3. For custom sounds, combine with PowerShell + BurntToast

### For Claude Code Integration (Best Option!)
1. **Claude Code has native hooks** - use the `Notification` hook for input alerts
2. **Use the `Stop` hook** to play a sound when Claude finishes
3. Configure via `/hooks` command or edit `settings.json` directly
4. Hooks run shell commands, so any audio method works

### Recommended Implementation
```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [{
          "type": "command",
          "command": "echo -e '\\a' && wsl-notify-send.exe 'Claude Code' 'Awaiting input'"
        }]
      }
    ],
    "Stop": [
      {
        "hooks": [{
          "type": "command", 
          "command": "echo -e '\\a'"
        }]
      }
    ]
  }
}
```

## Related Searches

- PulseAudio alternatives for WSL2 (pipewire)
- BurntToast PowerShell module documentation
- Claude Code plugin development guide
- ElevenLabs TTS integration for Claude Code hooks
