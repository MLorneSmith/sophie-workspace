# Perplexity Research: Local TTS Solutions for Linux/WSL2 CLI Integration

**Date**: 2026-01-23
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

## Query Summary

Researched free text-to-speech (TTS) engines that run locally on Linux/WSL2 with focus on:
- Voice quality comparison
- Ease of installation
- CLI friendliness for shell scripts/hooks
- Resource requirements
- LM Studio TTS capabilities

---

## Executive Summary

**Top Recommendations for CLI Integration:**

| Rank | Engine | Best For | Voice Quality | Setup Difficulty |
|------|--------|----------|---------------|------------------|
| 1 | **Piper TTS** | Balance of quality + speed | Excellent (neural) | Easy |
| 2 | **espeak-ng** | Simplicity, low resources | Robotic but clear | Trivial |
| 3 | **Coqui TTS** | Advanced features, cloning | Very good (VITS) | Moderate |
| 4 | **Kokoro TTS** | Lightweight neural | Excellent | Moderate |

---

## Detailed Engine Comparison

### 1. Piper TTS (RECOMMENDED)

**Overview**: Fast, locally-running neural TTS using ONNX models. Created by Michael Hansen (rhasspy project).

**Pros**:
- Excellent voice quality (neural network based)
- Very fast synthesis (runs on Raspberry Pi)
- 100+ voices across 40+ languages
- Simple CLI interface with piping support
- Low resource usage for neural TTS

**Cons**:
- Requires downloading voice models separately
- Python or binary installation needed

**Installation**:
```bash
# Option A: pip install (recommended)
pip install piper-tts

# Option B: Download binary
wget https://github.com/rhasspy/piper/releases/download/2023.11.14-2/piper_linux_x86_64.tar.gz
tar -xzf piper_linux_x86_64.tar.gz

# Download a voice model (example: US English)
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx
wget https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/en_US-lessac-medium.onnx.json
```

**CLI Usage**:
```bash
# Save to file
echo "Hello world" | piper --model en_US-lessac-medium --output_file output.wav

# Real-time playback (no file)
echo "Speaking directly" | piper --model en_US-lessac-medium.onnx --output-raw | \
  aplay -r 22050 -f S16_LE -t raw -

# With PulseAudio
echo "PulseAudio test" | piper --model en_US-lessac-medium.onnx --output-raw | \
  paplay --raw --rate=22050 --format=s16le --channels=1 -

# From text file
cat message.txt | piper --model en_US-lessac-medium --output_file message.wav
```

**Voice Models**: Browse at https://huggingface.co/rhasspy/piper-voices

---

### 2. espeak-ng (Simplest)

**Overview**: Lightweight, open-source formant synthesizer supporting 100+ languages. The "ng" is "next generation" fork of eSpeak.

**Pros**:
- Trivial installation via apt
- Extremely lightweight (few MB total)
- Runs on any hardware
- Native CLI, pipes easily
- Excellent language coverage

**Cons**:
- Robotic-sounding voice
- Limited naturalness

**Installation**:
```bash
sudo apt update && sudo apt install espeak-ng
```

**CLI Usage**:
```bash
# Direct speech
espeak-ng "Hello world"

# With speed control (-s words per minute)
espeak-ng -s 150 "Speaking slowly"

# Save to WAV file
espeak-ng "Hello world" -w output.wav

# Pipe to stdout and play
echo "Hello from espeak" | espeak-ng -w - | aplay -r 22050 -f S16_LE -t raw -

# Different voice
espeak-ng -v en-us "American English"
espeak-ng -v en-gb "British English"

# List available voices
espeak-ng --voices
```

---

### 3. Coqui TTS

**Overview**: Deep learning TTS with VITS models. Original Coqui company discontinued, but community fork (coqui-tts) actively maintained.

**Pros**:
- High quality with VITS models
- Voice cloning capabilities (XTTS)
- Multilingual support
- Auto-downloads models

**Cons**:
- Larger resource requirements (GBs disk, higher CPU)
- Slower synthesis than Piper
- Python 3.7-3.10 required (not 3.11+)

**Installation**:
```bash
# Community fork (recommended)
pip install coqui-tts

# Or original (if compatible Python version)
pip install TTS
```

**CLI Usage**:
```bash
# List available models
tts --list_models

# Basic synthesis
tts --text "Hello world" --model_name "tts_models/en/ljspeech/vits" --out_path output.wav

# With specific model (auto-downloads)
tts --text "Testing Coqui" --model_name "tts_models/en/vctk/vits" --out_path test.wav
```

---

### 4. Kokoro TTS (New, Lightweight Neural)

**Overview**: 82M parameter open-weight model delivering quality comparable to larger models.

**Pros**:
- Excellent quality for size
- Auto-installs PyTorch/CUDA
- Relatively fast

**Cons**:
- Newer, less documentation
- Python API primarily (no native CLI)

**Installation**:
```bash
python3 -m venv kokoro-env && source kokoro-env/bin/activate
pip install kokoro soundfile
```

**Usage** (Python script):
```python
#!/usr/bin/env python3
from kokoro import KPipeline
import soundfile as sf
import sys

pipeline = KPipeline("kokoro-model")
text = sys.argv[1] if len(sys.argv) > 1 else "Hello world"
audio = pipeline(text)
sf.write("/tmp/output.wav", audio, 24000)
```

---

### 5. Other Notable Options

| Engine | Quality | Notes |
|--------|---------|-------|
| **Festival** | Moderate | Academic, modular, scripting support |
| **MaryTTS** | Good | Java-based, modular architecture |
| **Orpheus TTS** | Excellent | 3B params, GPU-heavy, emotional voices |
| **StyleTTS2** | Excellent | Human-level cloning, Docker-based |
| **XTTS** | Very Good | Coqui successor, multilingual cloning |

---

## LM Studio TTS Capabilities

**LM Studio does NOT have native text-to-speech capabilities.** It is a local LLM inference tool focused on text generation, not speech synthesis.

**Integration Options**:
1. **Pipe LM Studio output to external TTS**: 
   ```bash
   # Conceptual example
   lms chat "Tell me a joke" | piper --model en_US-lessac-medium --output-raw | aplay ...
   ```

2. **Orpheus TTS with VLLM**: Can run as a separate service alongside LM Studio

3. **Python integration**: Use pyttsx3 or other TTS libraries to voice LM Studio responses

---

## CLI Integration Patterns

### Simple Notification Function (Bash)
```bash
# Add to ~/.bashrc or ~/.zshrc
speak() {
    echo "$*" | piper --model ~/.local/share/piper/en_US-lessac-medium.onnx --output-raw | \
    aplay -r 22050 -f S16_LE -t raw - 2>/dev/null
}

# Usage
speak "Build completed"
```

### Git Hook Example (post-commit)
```bash
#!/bin/bash
# .git/hooks/post-commit

# Quick notification with espeak (robotic but fast)
espeak-ng "Commit successful" &

# Or with Piper (better quality)
echo "Commit successful" | piper --model en_US-lessac-medium.onnx --output-raw | \
  aplay -r 22050 -f S16_LE -t raw - &
```

### Build Completion Notification
```bash
#!/bin/bash
pnpm build && speak "Build succeeded" || speak "Build failed"
```

### Background Speech (Non-blocking)
```bash
speak_async() {
    (echo "$*" | piper --model ~/.local/share/piper/en_US-lessac-medium.onnx --output-raw | \
    aplay -r 22050 -f S16_LE -t raw - 2>/dev/null) &
}
```

---

## Resource Comparison

| Engine | Disk Space | RAM Usage | CPU Load | GPU Support |
|--------|------------|-----------|----------|-------------|
| espeak-ng | ~5 MB | Minimal | Very Low | No |
| Piper TTS | ~50-200 MB/model | Low | Low-Medium | No (ONNX CPU) |
| Coqui TTS | ~500 MB-2 GB | High | High | Yes (CUDA) |
| Kokoro TTS | ~200 MB | Medium | Medium | Yes (auto) |

---

## Quick Start Recommendations

### For Maximum Simplicity (espeak-ng)
```bash
sudo apt install espeak-ng
espeak-ng "Hello world"
```

### For Best Quality + Speed Balance (Piper)
```bash
pip install piper-tts
# Download model from https://huggingface.co/rhasspy/piper-voices
echo "Hello world" | piper --model en_US-lessac-medium --output-raw | \
  aplay -r 22050 -f S16_LE -t raw -
```

### WSL2 Audio Notes
For WSL2, ensure PulseAudio or PipeWire is configured:
```bash
# Add to ~/.bashrc for WSL2
export PULSE_SERVER=tcp:$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}')
```
Or use `paplay` instead of `aplay` if PulseAudio is available.

---

## Sources & Citations

Research conducted via Perplexity AI with citations from:
- GitHub repositories (rhasspy/piper, espeak-ng/espeak-ng, coqui-ai/TTS)
- Hugging Face model repositories
- PyPI package documentation
- Linux audio system documentation
- Community forums and tutorials

## Key Takeaways

1. **Piper TTS** is the best overall choice for CLI integration - excellent quality, fast, easy to use
2. **espeak-ng** is perfect for quick/simple notifications where quality doesn't matter
3. **Coqui TTS** is best when you need voice cloning or advanced features
4. **LM Studio** does NOT support TTS natively - requires external integration
5. Real-time playback without files is possible with `--output-raw` and piping to `aplay`/`paplay`/`ffplay`

## Related Searches

- Voice cloning with XTTS for custom voices
- Setting up PulseAudio in WSL2 for audio playback
- Speech recognition (STT) options for bidirectional voice interfaces
- Building conversational AI with local LLM + TTS pipeline
