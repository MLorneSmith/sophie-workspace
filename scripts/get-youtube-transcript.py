#!/usr/bin/env python3
"""Fetch YouTube video transcript."""

import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi
import re

def extract_video_id(url_or_id):
    """Extract video ID from URL or return as-is if already an ID."""
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([^&\n?#]+)',
        r'^([a-zA-Z0-9_-]{11})$'
    ]
    for pattern in patterns:
        match = re.search(pattern, url_or_id)
        if match:
            return match.group(1)
    return url_or_id

def get_transcript(video_id):
    """Fetch transcript for a YouTube video."""
    try:
        api = YouTubeTranscriptApi()
        entries = api.fetch(video_id)
        
        # Combine into full text
        full_text = ' '.join([entry.text for entry in entries])
        
        return {
            'success': True,
            'video_id': video_id,
            'transcript': full_text,
            'segments': len(entries)
        }
        
    except Exception as e:
        error_msg = str(e)
        if 'disabled' in error_msg.lower():
            return {'success': False, 'error': 'Transcripts are disabled for this video'}
        elif 'not found' in error_msg.lower() or 'no transcript' in error_msg.lower():
            return {'success': False, 'error': 'No transcript found for this video'}
        else:
            return {'success': False, 'error': error_msg}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({'success': False, 'error': 'Usage: get-youtube-transcript.py <video_url_or_id>'}))
        sys.exit(1)
    
    video_id = extract_video_id(sys.argv[1])
    result = get_transcript(video_id)
    print(json.dumps(result))
