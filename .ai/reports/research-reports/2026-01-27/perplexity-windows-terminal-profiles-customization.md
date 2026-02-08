# Perplexity Research: Windows Terminal Custom Profiles and Visual Customization

**Date**: 2026-01-27
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Researched how to set up Windows Terminal with multiple distinct visual profiles/styles for running Claude Code and Claude Code Router in separate, easily distinguishable terminal windows.

---

## Findings

### 1. Creating Custom Profiles in settings.json

Windows Terminal profiles are configured in the `settings.json` file, accessible via:
- **Keyboard**: `Ctrl + ,` then click "Open JSON file"
- **UI**: Settings dropdown > Settings > Open JSON file (bottom left)

#### Profile Structure

```json
{
    "profiles": {
        "defaults": {
            // Settings applied to ALL profiles
        },
        "list": [
            // Individual profile objects
        ]
    },
    "schemes": [
        // Color scheme definitions
    ]
}
```

#### Generating Unique GUIDs

Every custom profile requires a unique GUID. Generate one using PowerShell:

```powershell
[guid]::NewGuid()
# Or: New-Guid
```

Format: `{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}`

---

### 2. Visual Customization Options

#### Complete Property Reference

| Property | Description | Example Value |
|----------|-------------|---------------|
| `name` | Display name in dropdown/tabs | `"Claude Code"` |
| `guid` | Unique identifier (required) | `"{your-guid-here}"` |
| `commandline` | Shell executable | `"wsl.exe -d Ubuntu"` |
| `colorScheme` | References scheme name | `"Dracula"` |
| `tabColor` | Tab background color (hex) | `"#FF6B6B"` |
| `icon` | Profile icon path (32x32px) | `"C:\\path\\to\\icon.png"` |
| `font.face` | Font family | `"Cascadia Code NF"` |
| `font.size` | Font size (pt) | `12` |
| `font.weight` | Font weight | `"normal"`, `"bold"`, `"semi-bold"` |
| `useAcrylic` | Enable transparency effect | `true` |
| `opacity` | Background opacity (0-100) | `85` |
| `backgroundImage` | Background image path | `"C:\\path\\to\\image.png"` |
| `backgroundImageOpacity` | Image opacity (0.0-1.0) | `0.3` |
| `backgroundImageStretchMode` | Image sizing | `"fill"`, `"none"`, `"uniform"`, `"uniformToFill"` |
| `backgroundImageAlignment` | Image position | `"center"`, `"bottomRight"`, `"topLeft"` |
| `cursorColor` | Cursor color (hex) | `"#FFFFFF"` |
| `cursorShape` | Cursor style | `"bar"`, `"vintage"`, `"underscore"`, `"filledBox"` |
| `foreground` | Text color override | `"#E3E1E4"` |
| `background` | Background color override | `"#2D2A2E"` |
| `selectionBackground` | Selection highlight color | `"#3366CC"` |
| `startingDirectory` | Initial directory | `"%USERPROFILE%"` |

#### Color Scheme Structure

```json
{
    "name": "Custom Scheme Name",
    "background": "#0C0C0C",
    "foreground": "#CCCCCC",
    "cursorColor": "#FFFFFF",
    "selectionBackground": "#FFFFFF",
    "black": "#0C0C0C",
    "blue": "#0037DA",
    "cyan": "#3A96DD",
    "green": "#13A10E",
    "purple": "#881798",
    "red": "#C50F1F",
    "white": "#CCCCCC",
    "yellow": "#C19C00",
    "brightBlack": "#767676",
    "brightBlue": "#3B78FF",
    "brightCyan": "#61D6D6",
    "brightGreen": "#16C60C",
    "brightPurple": "#B4009E",
    "brightRed": "#E74856",
    "brightWhite": "#F2F2F2",
    "brightYellow": "#F9F1A5"
}
```

#### Light/Dark Mode Auto-Switching

```json
"colorScheme": {
    "light": "One Half Light",
    "dark": "One Half Dark"
}
```

---

### 3. Example Configurations for Claude Code vs Claude Code Router

#### Profile 1: Claude Code (Blue/Cool Theme)

```json
{
    "guid": "{generate-new-guid-1}",
    "name": "Claude Code",
    "commandline": "wsl.exe -d Ubuntu",
    "hidden": false,
    "startingDirectory": "//wsl$/Ubuntu/home/msmith/projects/2025slideheroes",
    "icon": "C:\\Users\\msmith\\terminal-icons\\claude-code.png",
    "colorScheme": "One Half Dark",
    "tabColor": "#3B78FF",
    "font": {
        "face": "Cascadia Code NF",
        "size": 11,
        "weight": "normal"
    },
    "useAcrylic": true,
    "opacity": 90,
    "cursorShape": "bar",
    "cursorColor": "#3B78FF"
}
```

#### Profile 2: Claude Code Router (Orange/Warm Theme)

```json
{
    "guid": "{generate-new-guid-2}",
    "name": "Claude Code Router",
    "commandline": "wsl.exe -d Ubuntu",
    "hidden": false,
    "startingDirectory": "//wsl$/Ubuntu/home/msmith/projects/2025slideheroes",
    "icon": "C:\\Users\\msmith\\terminal-icons\\claude-router.png",
    "colorScheme": "Dracula",
    "tabColor": "#FF6B35",
    "font": {
        "face": "Cascadia Code NF",
        "size": 11,
        "weight": "normal"
    },
    "useAcrylic": true,
    "opacity": 85,
    "cursorShape": "filledBox",
    "cursorColor": "#FF6B35"
}
```

#### Suggested Color Schemes for Visual Distinction

**For Claude Code (Cool/Blue):**
- One Half Dark (built-in)
- Nord
- Tokyo Night
- Cobalt2

**For Claude Code Router (Warm/Orange):**
- Dracula
- Monokai
- Synthwave
- Cyberpunk

---

### 4. Plugins, Extensions, and Third-Party Utilities

#### Oh My Posh (Primary Enhancement Tool)

The main tool for advanced prompt customization with themes, Git status indicators, and icons.

**Installation:**
```powershell
winget install JanDeDobbeleer.OhMyPosh
```

**Configuration:**
```powershell
# Add to $PROFILE
oh-my-posh init pwsh --config "$env:POSH_THEMES_PATH\paradox.omp.json" | Invoke-Expression
```

**Theme Gallery:** https://ohmyposh.dev/docs/themes

#### Nerd Fonts (Required for Icons)

Programming fonts patched with glyphs/icons. Essential for Oh My Posh and modern terminal aesthetics.

**Popular Options:**
- Cascadia Code NF
- Fira Code NF
- JetBrains Mono NF
- Hack NF

**Installation:**
1. Download from https://www.nerdfonts.com/font-downloads
2. Extract ZIP
3. Right-click font files > Install
4. Restart Windows Terminal
5. Set font in profile: `"font": { "face": "Cascadia Code NF" }`

#### Terminal-Icons Module

Adds file/folder icons to directory listings in PowerShell.

```powershell
Install-Module -Name Terminal-Icons -Repository PSGallery
Import-Module -Name Terminal-Icons  # Add to $PROFILE
```

#### Winfetch

System information display tool (like neofetch for Windows).

```powershell
Install-Script -Name pwshfetch-test-1
Set-Alias winfetch pwshfetch-test-1  # Add to $PROFILE
```

#### JSON Fragment Extensions

Windows Terminal supports JSON fragment extensions that can inject profiles, color schemes, and icons. Developers can add configurations by placing JSON snippets in specific directories.

---

### 5. Community Themes and Theme Packs

#### Primary Theme Sources

| Source | URL | Description |
|--------|-----|-------------|
| Windows Terminal Themes | https://windowsterminalthemes.dev | 200+ themes with preview |
| Terminal Splash | https://terminalsplash.com | Community themes with backgrounds |
| Dracula Theme | https://draculatheme.com/windows-terminal | Popular dark theme |
| atomcorp/themes (GitHub) | https://github.com/atomcorp/themes | 1.4k stars, comprehensive collection |
| rjcarneiro/windows-terminals | https://github.com/rjcarneiro/windows-terminals | Curated themed setups with backgrounds |
| GitHub Topic: windows-terminal-theme | https://github.com/topics/windows-terminal-theme | 47+ repositories |

#### Popular Theme Names

**Dark Themes:**
- Dracula
- One Half Dark
- Tokyo Night
- Nord
- Monokai Pro
- Synthwave
- Cyberpunk

**Light Themes:**
- One Half Light
- Tango Light
- Solarized Light
- Campbell

**Unique/Fun Themes:**
- Retrowave
- Fallout PipBoy
- Star Wars
- Aperture Science
- Shrek

#### Built-in Color Schemes

Windows Terminal includes these by default:
- Campbell
- Campbell PowerShell
- Vintage
- One Half Dark
- One Half Light
- Tango Dark
- Tango Light

---

### 6. Best Practices for Visually Distinct Profiles

#### Visual Hierarchy Recommendations

1. **Use Different Tab Colors**: Most immediate visual distinction
   - Claude Code: Blue (`#3B78FF`)
   - Claude Code Router: Orange/Red (`#FF6B35`)

2. **Contrasting Color Schemes**: Different background/text combinations
   - Cool tones for one, warm tones for the other

3. **Different Icons**: Custom 32x32px PNG/ICO files for instant recognition

4. **Naming Conventions**: Clear, descriptive names
   - "Claude Code (Main)"
   - "Claude Code Router (Orchestrator)"

5. **Background Images** (Optional): Subtle watermarks or logos
   - Keep opacity low (0.1-0.3) for readability

6. **Cursor Styles**: Different shapes/colors reinforce distinction
   - Bar cursor for one, filled box for the other

#### Configuration Tips

- Use `defaults` section for shared settings (font, size)
- Override specific properties per profile
- Test in both light and dark Windows themes
- Backup `settings.json` before making changes
- Terminal auto-reloads on save

---

### 7. Complete Example settings.json Configuration

```json
{
    "$schema": "https://aka.ms/terminal-profiles-schema",
    "defaultProfile": "{your-claude-code-guid}",
    
    "profiles": {
        "defaults": {
            "font": {
                "face": "Cascadia Code NF",
                "size": 11
            },
            "useAcrylic": true,
            "opacity": 90
        },
        "list": [
            {
                "guid": "{61c54bbd-c2c6-5271-96e7-009a87ff44bf}",
                "name": "Claude Code",
                "commandline": "wsl.exe -d Ubuntu",
                "startingDirectory": "//wsl$/Ubuntu/home/msmith/projects/2025slideheroes",
                "colorScheme": "One Half Dark",
                "tabColor": "#3B78FF",
                "cursorColor": "#3B78FF",
                "cursorShape": "bar"
            },
            {
                "guid": "{0caa0dad-35be-5f56-a8ff-afceeeaa6101}",
                "name": "Claude Code Router",
                "commandline": "wsl.exe -d Ubuntu",
                "startingDirectory": "//wsl$/Ubuntu/home/msmith/projects/2025slideheroes",
                "colorScheme": "Dracula",
                "tabColor": "#FF6B35",
                "cursorColor": "#FF6B35",
                "cursorShape": "filledBox"
            }
        ]
    },
    
    "schemes": [
        {
            "name": "Dracula",
            "background": "#282A36",
            "black": "#21222C",
            "blue": "#BD93F9",
            "brightBlack": "#6272A4",
            "brightBlue": "#D6ACFF",
            "brightCyan": "#A4FFFF",
            "brightGreen": "#69FF94",
            "brightPurple": "#FF92DF",
            "brightRed": "#FF6E6E",
            "brightWhite": "#FFFFFF",
            "brightYellow": "#FFFFA5",
            "cyan": "#8BE9FD",
            "foreground": "#F8F8F2",
            "green": "#50FA7B",
            "purple": "#FF79C6",
            "red": "#FF5555",
            "white": "#F8F8F2",
            "yellow": "#F1FA8C",
            "cursorColor": "#F8F8F2",
            "selectionBackground": "#44475A"
        }
    ]
}
```

---

## Sources & Citations

- Microsoft Learn: Appearance Profile Settings - https://learn.microsoft.com/en-us/windows/terminal/customize-settings/profile-appearance
- Microsoft Learn: Color Schemes - https://learn.microsoft.com/en-us/windows/terminal/customize-settings/color-schemes
- Microsoft Learn: Theme Gallery - https://learn.microsoft.com/en-us/windows/terminal/custom-terminal-gallery/theme-gallery
- Windows Terminal Themes - https://windowsterminalthemes.dev
- Terminal Splash - https://terminalsplash.com
- GitHub atomcorp/themes - https://github.com/atomcorp/themes
- GitHub rjcarneiro/windows-terminals - https://github.com/rjcarneiro/windows-terminals
- Oh My Posh Documentation - https://ohmyposh.dev
- Nerd Fonts - https://www.nerdfonts.com
- FreeCodeCamp: PowerShell Themes Guide - https://www.freecodecamp.org/news/windows-terminal-themes-color-schemes-powershell-customize/
- Dev.to: Customize & Beautify Windows Terminal - https://dev.to/ansonh/customize-beautify-your-windows-terminal-2022-edition-541l

---

## Key Takeaways

- Windows Terminal profiles are fully configured via `settings.json` with extensive visual customization options
- **Tab colors** (`tabColor`) provide the most immediate visual distinction between profiles
- **Color schemes** can be custom-defined or imported from 200+ community themes
- **Oh My Posh** is the primary tool for advanced prompt theming with Git integration
- **Nerd Fonts** are essential for icon support in modern terminal setups
- Each profile needs a unique **GUID** generated via PowerShell
- Settings auto-reload on save; no restart required
- Community resources like windowsterminalthemes.dev and terminalsplash.com offer ready-to-use themes

## Related Searches

- Oh My Posh theme customization for different projects
- Creating custom Windows Terminal icons
- PowerShell profile configuration for different environments
- Windows Terminal keyboard shortcuts and actions
