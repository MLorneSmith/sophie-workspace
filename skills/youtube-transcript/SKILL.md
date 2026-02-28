# YouTube Transcript Skill

Extract transcripts from YouTube videos. Use when the user asks for a transcript, subtitles, captions, or summary of a YouTube video and provides a YouTube URL (youtube.com/watch?v=, youtu.be/, or similar).

## Usage

Run the script with a YouTube URL or video ID:

```bash
~/.local/bin/uv run ~/.openclaw/skills/youtube-transcript/scripts/get_transcript.py "VIDEO_URL_OR_ID"
```

With timestamps:

```bash
~/.local/bin/uv run ~/.openclaw/skills/youtube-transcript/scripts/get_transcript.py "VIDEO_URL_OR_ID" --timestamps
```

## Supported URL Formats

- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`
- `https://youtube.com/embed/VIDEO_ID`
- Raw video ID (11 characters)

## Output Guidelines

- **NEVER modify the returned transcript** when asked to save it verbatim
- If transcript is without timestamps, clean it up so paragraphs flow naturally (don't cut mid-sentence)
- If asked to save to a specific file, use that filename
- If no output file specified, use `{video_id}-transcript.txt`

## Notes

- Fetches auto-generated or manually added captions (whichever available)
- Requires the video to have captions enabled
- Falls back to auto-generated captions if manual ones aren't available
- Some videos may not have transcripts available (live streams, restricted content)

## ⚠️ Cloud IP Limitation

YouTube blocks requests from cloud provider IPs (AWS, GCP, Azure). This skill will fail from the Clawdbot server with "IP blocked" errors.

**Workarounds:**
1. Run from a non-cloud environment (local machine, home server)
2. Use a residential proxy service
3. Use web-based transcript tools like youtubetranscript.com and fetch via web_fetch

## Credits

Based on skill by [Eleanor (@intellectronica)](https://intellectronica.net/)
