# Perplexity Research: Text-to-Speech (TTS) Solutions - Piper History & Alternatives

**Date**: 2026-01-23
**Agent**: perplexity-expert
**Search Type**: Chat API + Search API (Multiple queries)

## Query Summary

Research on four main topics:
1. Piper TTS development history and timeline
2. New TTS projects released November 2025 - January 2026
3. Recent advancements in local/offline TTS technology
4. Emerging TTS projects as alternatives to Piper for CLI integration

---

## 1. Piper TTS History

### Overview
Piper TTS is a fast, local neural text-to-speech system that converts text into natural-sounding speech. It uses ONNX Runtime architecture and is designed to run efficiently on resource-constrained devices like Raspberry Pi 4.

### Development Timeline

| Date | Version | Notes |
|------|---------|-------|
| **January 10, 2023** | v0.0.2 | **Initial release** |
| June 12, 2023 | v1.0.0 | Added phoneme support, Arabic diacritization, library integration |
| July 10, 2023 | v1.1.0 | Added `--json-input` and `--version` CLI options |
| August 1, 2023 | v1.2.0 | Added `--phoneme_silence` option, Luxembourgish phonemes |
| November 14, 2023 | 2023.11.14-2 | **Latest stable release** |
| **October 6, 2025** | - | **Repository archived**, development moved to OHF-Voice |

### Developer & Maintenance

- **Primary Developer**: Mike Hansen, PhD (GitHub: `synesthesiam`)
- **Organization**: Originally under Nabu Casa / Rhasspy project
- **Original Repository**: https://github.com/rhasspy/piper (ARCHIVED - READ-ONLY)
- **New Repository**: https://github.com/OHF-Voice/piper1-gpl (GPL licensed successor)
- **License**: Original MIT, successor GPL

### Key Features
- 100+ voices across 40+ languages
- Generates 1.6 seconds of audio per 1 second of processing (medium quality)
- Runs on Raspberry Pi 4 and low-power devices
- ONNX Runtime for cross-platform deployment

---

## 2. New TTS Projects (November 2025 - January 2026)

### Major New Releases

| Project | Parameters | Release | Developer | License | Key Feature |
|---------|------------|---------|-----------|---------|-------------|
| **Higgs Audio V2** | 5.77B | July 2025 | Boson AI | Apache 2.0 | Emotional expression, multi-speaker |
| **Dia2** | 1B/2B | 2025-2026 | Nari Labs | Apache 2.0 | Streaming, dialogue-focused |
| **Chatterbox-Turbo** | 350M | May 2025+ | Resemble AI | MIT | One-step decoder, fast inference |
| **Fish Speech/OpenAudio S1** | 4B/0.5B | 2025-2026 | Fish Audio | Apache 2.0 (code) | #1 on TTS Arena2 |
| **CosyVoice2-0.5B** | 0.5B | 2025 | FunAudioLLM | - | 150ms streaming latency |
| **IndexTTS-2** | - | 2025 | IndexTeam | - | Duration control, zero-shot |

### Notable 2025-2026 Projects

#### Higgs Audio V2 (July 2025)
- Built on Llama 3.2 3B
- Trained on 10+ million hours of audio
- Industry-leading emotional expression and question-asking
- Dual-FFN architecture for audio-specific processing
- **GitHub**: Search "BosonAI Higgs Audio"

#### Dia / Dia2 (April 2025 - 2026)
- 1.6B parameters (Dia), 1B/2B (Dia2)
- Streaming architecture for real-time synthesis
- Multi-speaker dialogue with `[S1]` `[S2]` tags
- Non-verbal sounds: `(laughs)`, `(coughs)`, `(gasps)`
- **GitHub**: https://github.com/nari-labs/dia

#### Fish Speech / OpenAudio S1 (2024-2026)
- Rebranded to OpenAudio
- S1 (4B), S1-mini (0.5B)
- **#1 ranking on TTS Arena2**
- WER: 0.008 (S1), 0.011 (S1-mini)
- Emotion and tone control markers
- **GitHub**: https://github.com/fishaudio/fish-speech

---

## 3. Best Piper TTS Alternatives for CLI Integration

### Top Recommendations

#### 1. Kokoro TTS (January 2025)
- **Parameters**: 82M (extremely lightweight)
- **Developer**: Hexgrad (indie developer)
- **License**: Apache 2.0
- **GitHub**: https://github.com/hexgrad/kokoro
- **Stars**: 4.6k

**CLI Usage**:
```bash
pip install kokoro soundfile
apt-get install espeak-ng  # Linux

# Python usage
from kokoro import KPipeline
pipeline = KPipeline(lang_code='a')
generator = pipeline(text, voice='af_heart')
```

**Strengths**:
- Only 82M parameters - runs fast on CPU
- High quality comparable to larger models
- Multiple languages: English (US/UK), Spanish, French, Hindi, Italian, Japanese, Chinese, Portuguese
- Active ecosystem: 71+ related projects on GitHub
- CLI tools: `kokoro-tts` CLI wrapper available

#### 2. Coqui TTS (Community Maintained)
- **Languages**: 1100+ via Fairseq models
- **License**: MPL-2.0 / Apache
- **GitHub**: https://github.com/idiap/coqui-ai-TTS (active fork)
- **PyPI**: `pip install coqui-tts`

**CLI Usage**:
```bash
tts --text "Hello world" --model_name "tts_models/en/ljspeech/glow-tts" --out_path output.wav
```

**Strengths**:
- Battle-tested in research and production
- XTTSv2 with streaming <200ms latency
- Voice cloning with 6-second audio sample
- Comprehensive CLI support

#### 3. Chatterbox (May 2025)
- **Parameters**: 350M (Turbo version)
- **Developer**: Resemble AI
- **License**: MIT
- **Strength**: Fast, one-step diffusion decoder

**Key Features**:
- Built on 0.5B Llama
- Emotion tags: `[laugh]`, `[cough]`, `[chuckle]`
- Side-by-side comparable to ElevenLabs

#### 4. eSpeak-ng (Classic, Lightweight)
- **Size**: ~5MB
- **License**: GPL
- **GitHub**: https://github.com/espeak-ng/espeak-ng

**CLI Usage**:
```bash
espeak-ng "Hello world" -w output.wav
```

**Strengths**:
- Extremely lightweight
- Multi-language
- Perfect for embedded/IoT
- Dependency for many neural TTS systems

### Comparison Matrix

| Feature | Piper | Kokoro | Coqui TTS | Chatterbox | eSpeak |
|---------|-------|--------|-----------|------------|--------|
| **Size** | 15-32M | 82M | Varies | 350M | ~5MB |
| **Voice Quality** | Good | Excellent | Excellent | Excellent | Basic |
| **CLI Support** | Excellent | Good | Excellent | Moderate | Excellent |
| **Real-time** | Yes | Yes | Yes | Yes | Yes |
| **Languages** | 40+ | 9 | 1100+ | Limited | 100+ |
| **Local/Offline** | Yes | Yes | Yes | Yes | Yes |
| **License** | MIT/GPL | Apache 2.0 | MPL-2.0 | MIT | GPL |
| **Streaming** | Yes | Yes | Yes (<200ms) | Yes | N/A |

---

## 4. Emerging Projects to Watch (2025-2026)

### High Priority

1. **Kokoro-FastAPI** (3.8k stars)
   - Dockerized FastAPI wrapper for Kokoro
   - ONNX CPU + NVIDIA GPU support
   - OpenAI-compatible API
   - GitHub: https://github.com/remsky/Kokoro-FastAPI

2. **kokoro-tts CLI** (856 stars)
   - Full CLI tool with EPUB/PDF support
   - Voice blending
   - Streaming audio playback
   - GitHub: https://github.com/nazdridoy/kokoro-tts

3. **audiblez** (5.4k stars)
   - Audiobook generator from e-books
   - Uses Kokoro backend
   - GitHub: https://github.com/santinic/audiblez

4. **kokoro-onnx** (2.2k stars)
   - ONNX runtime implementation
   - Cross-platform
   - GitHub: https://github.com/thewh1teagle/kokoro-onnx

5. **VoiceMode for Claude Code** (252 stars)
   - Voice interface using Kokoro + Whisper
   - MCP server integration
   - GitHub: https://github.com/mbailey/voicemode

### Promising New Architectures

1. **VibeVoice-1.5B** (Microsoft)
   - Long-form audio (up to 90 minutes)
   - 4 distinct speakers
   - 7.5 Hz tokenizers for efficiency

2. **NeuTTS Air** (Neuphonic)
   - 0.5B parameters
   - On-device, runs on Raspberry Pi
   - Instant voice cloning

---

## 5. CLI Integration Recommendations

### For Simple Shell Scripts
```bash
# Option 1: Kokoro (recommended for quality)
pip install kokoro soundfile
echo "Hello" | python -c "from kokoro import KPipeline; p=KPipeline('a'); ..."

# Option 2: Coqui TTS (most comprehensive)
pip install coqui-tts
tts --text "Hello" --out_path /dev/stdout --pipe_out | aplay

# Option 3: Piper (if already using)
echo "Hello" | piper --model en_US-lessac-medium --output-raw | aplay -r 22050 -f S16_LE -t raw -

# Option 4: eSpeak (fastest, lowest quality)
espeak-ng "Hello" --stdout | aplay
```

### Docker Solutions
```bash
# Kokoro-FastAPI (OpenAI-compatible)
docker run -p 8880:8880 ghcr.io/remsky/kokoro-fastapi

# Kokoro-Web (Web UI + API)
docker run -p 3000:3000 ghcr.io/eduardolat/kokoro-web
```

---

## Sources & Citations

### Primary Sources
- https://github.com/rhasspy/piper (archived)
- https://github.com/OHF-Voice/piper1-gpl
- https://github.com/hexgrad/kokoro
- https://github.com/fishaudio/fish-speech
- https://github.com/idiap/coqui-ai-TTS
- https://github.com/coqui-ai/TTS
- https://modal.com/blog/open-source-tts
- https://www.bentoml.com/blog/exploring-the-world-of-open-source-text-to-speech-models
- https://www.siliconflow.com/articles/en/best-open-source-text-to-speech-models

### Model Repositories
- https://huggingface.co/hexgrad/Kokoro-82M
- https://huggingface.co/rhasspy/piper-voices

---

## Key Takeaways

1. **Piper TTS**: First released January 2023, archived October 2025, development continues at OHF-Voice/piper1-gpl

2. **Best Current Alternative**: **Kokoro TTS** - 82M parameters, Apache 2.0 license, excellent quality-to-size ratio, strong CLI tooling ecosystem

3. **For Production**: **Coqui TTS** - Most mature, 1100+ languages, battle-tested, excellent CLI

4. **For Bleeding Edge**: **Fish Speech/OpenAudio S1** - #1 on TTS Arena, but larger model size (4B)

5. **Trend**: TTS models are getting smaller while maintaining quality (Kokoro at 82M rivals larger models)

6. **CLI Integration Winner**: Kokoro-tts CLI wrapper (`pip install kokoro-tts`) provides the most comprehensive shell integration with EPUB/PDF support, streaming, and voice blending

---

## Related Searches

- "Piper TTS migration OHF-Voice guide"
- "Kokoro TTS vs Coqui TTS benchmark 2026"
- "OpenAudio S1 local deployment guide"
- "TTS Arena leaderboard 2026"
