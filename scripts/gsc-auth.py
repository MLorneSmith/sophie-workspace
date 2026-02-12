#!/usr/bin/env python3
"""One-time OAuth setup for Google Search Console API.

Usage: python3 gsc-auth.py

Prints a URL. Open it, authorize, then paste the FULL redirect URL 
(it will fail to load — that's expected — just copy the URL from the address bar).
"""

import json
import re
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import requests

SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']
CRED_DIR = Path.home() / '.config' / 'gsc'
TOKEN_FILE = CRED_DIR / 'token.json'
GOG_CREDS = Path.home() / '.config' / 'gogcli' / 'credentials.json'
REDIRECT_URI = 'http://localhost:8085'

def main():
    CRED_DIR.mkdir(parents=True, exist_ok=True)
    
    with open(GOG_CREDS) as f:
        ci = json.load(f)
    
    client_id = ci['client_id']
    client_secret = ci['client_secret']
    
    auth_url = (
        f"https://accounts.google.com/o/oauth2/auth"
        f"?response_type=code"
        f"&client_id={client_id}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&scope={'%20'.join(s.replace('/', '%2F').replace(':', '%3A') for s in SCOPES)}"
        f"&access_type=offline"
        f"&prompt=consent"
        f"&login_hint=sophie%40slideheroes.com"
    )
    
    print(f"\n1. Open this URL in your browser:\n")
    print(auth_url)
    print(f"\n2. Sign in with sophie@slideheroes.com and authorize")
    print(f"3. The browser will redirect to a page that WON'T LOAD (that's OK!)")
    print(f"4. Copy the FULL URL from your browser's address bar and paste it here:\n")
    
    redirect_url = input("Paste URL: ").strip()
    
    # Extract code from URL
    parsed = urlparse(redirect_url)
    params = parse_qs(parsed.query)
    code = params.get('code', [None])[0]
    
    if not code:
        print("ERROR: Could not find authorization code in URL")
        return
    
    # Exchange code for tokens
    resp = requests.post('https://oauth2.googleapis.com/token', data={
        'code': code,
        'client_id': client_id,
        'client_secret': client_secret,
        'redirect_uri': REDIRECT_URI,
        'grant_type': 'authorization_code',
    })
    
    if resp.status_code != 200:
        print(f"ERROR: Token exchange failed: {resp.text}")
        return
    
    tokens = resp.json()
    
    with open(TOKEN_FILE, 'w') as f:
        json.dump({
            'token': tokens['access_token'],
            'refresh_token': tokens.get('refresh_token'),
            'token_uri': 'https://oauth2.googleapis.com/token',
            'client_id': client_id,
            'client_secret': client_secret,
            'scopes': SCOPES,
        }, f, indent=2)
    
    print(f"\n✅ Credentials saved to {TOKEN_FILE}")
    print("You can now use the GSC query script.")

if __name__ == '__main__':
    main()
