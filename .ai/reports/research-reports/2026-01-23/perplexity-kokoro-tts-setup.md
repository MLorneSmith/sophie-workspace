# Perplexity Research: Kokoro TTS Complete Setup Guide

**Date**: 2026-01-23
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API

## Query Summary

Comprehensive research on Kokoro TTS (Text-to-Speech) covering installation methods, available voices, CLI usage, configuration options, WSL2/Linux setup, and integration examples.

---

## 1. Installation Methods

### Primary Package: `kokoro` (hexgrad/kokoro)

**GitHub Repository**: https://github.com/hexgrad/kokoro
**Hugging Face Model**: https://huggingface.co/hexgrad/Kokoro-82M
**License**: Apache 2.0

#### pip Install Commands

```bash
# Basic installation
pip install kokoro>=0.9.4 soundfile

# For Japanese language support
pip install misaki[ja]

# For Chinese language support
pip install misaki[zh]

# Full installation with all dependencies
pip install kokoro soundfile torch
```

#### System Dependencies

**espeak-ng** is REQUIRED for phoneme processing:

```bash
# Ubuntu/Debian/WSL2
sudo apt-get install espeak-ng

# Fedora/RHEL
sudo dnf install espeak-ng

# macOS
brew install espeak

# Windows
# Download from: https://github.com/espeak-ng/espeak-ng/releases
# Install the .msi file (e.g., espeak-ng-20191129-b702b03-x64.msi)
```

#### Python Version Requirements

- **Minimum**: Python 3.8+
- **Recommended**: Python 3.9-3.12
- **NOT Supported**: Python 3.13+ (for kokoro-tts CLI package)

#### Complete Setup (Colab/Linux)

```bash
# Install Python packages
pip install -q kokoro>=0.9.4 soundfile

# Install system dependency
apt-get -qq -y install espeak-ng > /dev/null 2>&1
```

### Alternative: `kokoro-tts` CLI Tool (nazdridoy/kokoro-tts)

**GitHub Repository**: https://github.com/nazdridoy/kokoro-tts
**License**: MIT

```bash
# Recommended: Using uv
uv tool install kokoro-tts

# Using pip
pip install kokoro-tts

# From Git
uv tool install git+https://github.com/nazdridoy/kokoro-tts
pip install git+https://github.com/nazdridoy/kokoro-tts
```

**After installation, download model files**:

```bash
# Download voice data
wget https://github.com/nazdridoy/kokoro-tts/releases/download/v1.0.0/voices-v1.0.bin

# Download the model
wget https://github.com/nazdridoy/kokoro-tts/releases/download/v1.0.0/kokoro-v1.0.onnx
```

### Conda Environment (for dependency issues)

```yaml
# environment.yml
name: kokoro
channels:
  - defaults
dependencies:
  - python==3.9
  - libstdcxx~=12.4.0  # Needed for espeak
  - pip:
      - kokoro>=0.3.1
      - soundfile
      - misaki[en]
```

---

## 2. Available Voices/Models

### Voice Naming Convention

Format: `{lang}{gender}_{name}`
- First letter: Language code
- Second letter: Gender (f=female, m=male)
- Underscore + name

### American English (en-us) - Language Code: 'a'

**Female Voices (af_*)**:
- `af_alloy`, `af_aoede`, `af_bella`, `af_heart`, `af_jessica`
- `af_kore`, `af_nicole`, `af_nova`, `af_river`, `af_sarah`, `af_sky`

**Male Voices (am_*)**:
- `am_adam`, `am_echo`, `am_eric`, `am_fenrir`
- `am_liam`, `am_michael`, `am_onyx`, `am_puck`

### British English (en-gb) - Language Code: 'b'

**Female Voices (bf_*)**:
- `bf_alice`, `bf_emma`, `bf_isabella`, `bf_lily`

**Male Voices (bm_*)**:
- `bm_daniel`, `bm_fable`, `bm_george`, `bm_lewis`

### Japanese - Language Code: 'j'

- `jf_alpha`, `jf_gongitsune`, `jf_nezumi`, `jf_tebukuro`, `jm_kumo`

**Requires**: `pip install misaki[ja]`

### Mandarin Chinese (cmn) - Language Code: 'z'

**Female**: `zf_xiaobei`, `zf_xiaoni`, `zf_xiaoxiao`, `zf_xiaoyi`
**Male**: `zm_yunjian`, `zm_yunxi`, `zm_yunxia`, `zm_yunyang`

**Requires**: `pip install misaki[zh]`

### Other Languages

| Language | Code | Voices |
|----------|------|--------|
| French (fr-fr) | 'f' | `ff_siwis` |
| Italian (it) | 'i' | `if_sara`, `im_nicola` |
| Spanish (es) | 'e' | (available) |
| Hindi (hi) | 'h' | `hf_alpha`, `hf_beta`, `hm_omega`, `hm_psi` |
| Brazilian Portuguese (pt-br) | 'p' | (available) |

### Default Voice

The default voice `af` is a 50-50 blend of `af_bella` and `af_sarah`.

### Voice Blending

Create custom voices by blending:

```python
import torch
bella = torch.load('voices/af_bella.pt', weights_only=True)
sarah = torch.load('voices/af_sarah.pt', weights_only=True)
custom = torch.mean(torch.stack([bella, sarah]), dim=0)
```

CLI blending:
```bash
kokoro-tts input.txt --voice "af_bella:0.7,bf_emma:0.3"
```

---

## 3. CLI Usage

### kokoro-tts CLI (nazdridoy/kokoro-tts)

#### Basic Commands

```bash
# Basic file input
kokoro-tts input.txt output.wav

# With voice and speed
kokoro-tts input.txt output.wav --speed 1.2 --lang en-us --voice af_sarah

# Stream audio directly (no file save)
kokoro-tts input.txt --stream

# Read from stdin
echo "Hello World" | kokoro-tts - --stream
cat input.txt | kokoro-tts - output.wav

# Pipe from clipboard (macOS)
pbpaste | kokoro-tts -i
```

#### Command Line Options

| Option | Description |
|--------|-------------|
| `--stream` | Stream audio instead of saving to file |
| `--speed <float>` | Speech speed (default: 1.0, range: 0.5-2.0) |
| `--lang <str>` | Language (default: en-us) |
| `--voice <str>` | Voice name or blend (e.g., "af_sarah" or "af_bella:0.7,bf_emma:0.3") |
| `--format <str>` | Audio format: wav or mp3 (default: wav) |
| `--split-output <dir>` | Save each chunk as separate file |
| `--debug` | Show detailed debug information |
| `--help-voices` | List available voices |
| `--help-languages` | List supported languages |
| `--batch` | Process entire text at once (faster WAV generation) |
| `--verbose` | Display batch processing progress |
| `-i` | Interactive mode with playback controls |

#### Input Formats Supported

- `.txt` - Text files
- `.epub` - EPUB books (auto chapter extraction)
- `.pdf` - PDF documents
- `-` or `/dev/stdin` - Standard input (stdin)

#### Piping to Audio Players

```bash
# Direct streaming (built-in)
kokoro-tts input.txt --stream

# If you need to pipe raw audio:
kokoro-tts input.txt --batch --save output.wav && aplay output.wav

# Real-time with Rust version (Kokoros)
curl -s -X POST http://localhost:3000/v1/audio/speech \
  -H "Content-Type: application/json" \
  -d '{"model":"tts-1","input":"Hello","voice":"af_sky","stream":true}' \
  | ffplay -f s16le -ar 24000 -ac 1 -
```

---

## 4. Configuration Options

### Environment Variables

```bash
# Mac Apple Silicon GPU acceleration
export PYTORCH_ENABLE_MPS_FALLBACK=1

# For kokoro-fastapi integration
export TTS_BASE_URL="http://127.0.0.1:8880/v1"
export TTS_VOICE="af_sky"
```

### Voice Parameters

| Parameter | Description | Values |
|-----------|-------------|--------|
| `speed` | Playback rate | 0.5 - 2.0 (default: 1.0) |
| `voice` | Speaker selection | Voice ID string |
| `lang_code` | Language code | 'a', 'b', 'j', 'z', etc. |
| `split_pattern` | Text splitting | regex (e.g., `r'\n+'`) |

### Audio Format Settings

- **Sample Rate**: 24kHz (24000 Hz)
- **Output Formats**: WAV, MP3 (requires ffmpeg)
- **Bit Depth**: 16-bit

### Python API Configuration

```python
from kokoro import KPipeline

# Initialize pipeline with language code
pipeline = KPipeline(lang_code='a')  # 'a' for American English

# Generate with parameters
generator = pipeline(
    text="Hello world",
    voice='af_heart',
    speed=1.0,
    split_pattern=r'\n+'
)

for i, (graphemes, phonemes, audio) in enumerate(generator):
    # audio is numpy array at 24000 Hz
    pass
```

---

## 5. WSL2/Linux Specific Setup

### Complete WSL2 Installation

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Python and pip
sudo apt install python3 python3-pip python3-venv -y

# 3. Install espeak-ng (REQUIRED)
sudo apt install espeak-ng -y

# 4. Create virtual environment
python3 -m venv kokoro_env
source kokoro_env/bin/activate

# 5. Install Kokoro
pip install kokoro>=0.9.4 soundfile torch

# 6. Verify installation
python -c "from kokoro import KPipeline; print('OK')"
```

### Audio Output in WSL2

WSL2 requires PulseAudio or PipeWire for audio. In WSL2 with Windows 11+, audio should work automatically via WSLg.

**For older WSL2 setups**:

```bash
# Install PulseAudio
sudo apt install pulseaudio -y

# Configure PulseAudio over TCP (in Windows)
# Edit: C:\Users\<user>\.config\pulse\default.pa
# Add: load-module module-native-protocol-tcp auth-anonymous=1

# In WSL2, set environment
export PULSE_SERVER=tcp:$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}')
```

**Testing audio**:

```bash
# Install audio player
sudo apt install alsa-utils pulseaudio-utils -y

# Test with aplay (might not work without proper config)
aplay output.wav

# Test with paplay (PulseAudio)
paplay output.wav
```

### PipeWire Setup (Modern Alternative)

```bash
# Install PipeWire
sudo apt install pipewire pipewire-pulse -y

# Start PipeWire
systemctl --user start pipewire pipewire-pulse
```

---

## 6. Integration Examples

### Shell Script for TTS

```bash
#!/bin/bash
# tts.sh - Simple TTS wrapper

TEXT="$1"
VOICE="${2:-af_heart}"
OUTPUT="${3:-/tmp/tts_output.wav}"

# Activate environment if needed
source ~/kokoro_env/bin/activate 2>/dev/null

# Generate and play
echo "$TEXT" | kokoro-tts - "$OUTPUT" --voice "$VOICE"
aplay "$OUTPUT" 2>/dev/null || paplay "$OUTPUT"
```

Usage: `./tts.sh "Hello world" af_sarah`

### Bash Hook for Notifications

```bash
# Add to ~/.bashrc
tts_notify() {
    local message="$1"
    echo "$message" | kokoro-tts - --stream 2>/dev/null
}

# Usage in scripts
long_command && tts_notify "Task completed"
```

### Python Real-Time Playback (No File Save)

```python
import sounddevice as sd
from kokoro import KPipeline

pipeline = KPipeline(lang_code='a')

def speak(text, voice='af_heart'):
    """Speak text in real-time without saving to file."""
    for _, _, audio in pipeline(text, voice=voice):
        sd.play(audio, samplerate=24000)
        sd.wait()

# Usage
speak("Hello, this is real-time TTS!")
```

### Using with PyAudio for Streaming

```python
import pyaudio
import numpy as np
from kokoro import KPipeline

pipeline = KPipeline(lang_code='a')
p = pyaudio.PyAudio()

stream = p.open(
    format=pyaudio.paFloat32,
    channels=1,
    rate=24000,
    output=True
)

text = "This streams audio directly to speakers."
for _, _, audio in pipeline(text, voice='af_heart'):
    # Ensure float32 format
    audio_float = audio.astype(np.float32)
    stream.write(audio_float.tobytes())

stream.stop_stream()
stream.close()
p.terminate()
```

### Integration with External APIs (Kokoro-FastAPI)

For production use, consider Kokoro-FastAPI which provides an OpenAI-compatible API:

**GitHub**: https://github.com/remsky/Kokoro-FastAPI

```bash
# Docker deployment
docker run -p 8880:8880 remsky/kokoro-fastapi

# Use with OpenAI SDK
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8880/v1",
    api_key="not-needed"
)

response = client.audio.speech.create(
    model="kokoro",
    voice="af_heart",
    input="Hello world!"
)
response.stream_to_file("output.mp3")
```

---

## GitHub Repository URLs

| Project | URL | Stars | Description |
|---------|-----|-------|-------------|
| hexgrad/kokoro | https://github.com/hexgrad/kokoro | 4.6k | Official inference library |
| nazdridoy/kokoro-tts | https://github.com/nazdridoy/kokoro-tts | 862 | CLI tool with EPUB/PDF support |
| remsky/Kokoro-FastAPI | https://github.com/remsky/Kokoro-FastAPI | 3.8k | Docker FastAPI wrapper |
| lucasjinreal/Kokoros | https://github.com/lucasjinreal/Kokoros | 593 | Rust implementation |
| thewh1teagle/kokoro-onnx | https://github.com/thewh1teagle/kokoro-onnx | 2.2k | ONNX runtime version |
| eduardolat/kokoro-web | https://github.com/eduardolat/kokoro-web | 402 | Browser-based web interface |

---

## Key Takeaways

1. **Two main packages**: `kokoro` (official library) and `kokoro-tts` (CLI tool)
2. **espeak-ng is mandatory** - must be installed as a system dependency
3. **Python 3.9-3.12 recommended** - 3.13+ not yet supported
4. **24+ voices available** across 8+ languages
5. **Voice blending supported** with customizable weights
6. **Real-time streaming possible** with sounddevice or PyAudio
7. **WSL2 requires audio setup** - use PulseAudio or WSLg
8. **82M parameters** - lightweight but high quality
9. **Apache 2.0 license** - suitable for commercial use

---

## Related Searches

- Kokoro-FastAPI Docker deployment
- Voice cloning alternatives to Kokoro
- Comparing Kokoro vs ElevenLabs quality
- Real-time speech synthesis latency optimization
- Kokoro ONNX performance benchmarks
