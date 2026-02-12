#!/usr/bin/env python3
"""Query Google Search Console data.

Usage:
  gsc-query.py [--days N] [--type queries|pages|both] [--limit N] [--query FILTER]

Examples:
  gsc-query.py                          # Top queries, last 28 days
  gsc-query.py --type pages             # Top pages
  gsc-query.py --days 90 --limit 50     # More data, longer range
  gsc-query.py --query "presentation"   # Filter to queries containing "presentation"
"""

import argparse
import json
from datetime import datetime, timedelta
from pathlib import Path
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

TOKEN_FILE = Path.home() / '.config' / 'gsc' / 'token.json'
SITE_URL = 'https://www.slideheroes.com/'

def get_creds():
    with open(TOKEN_FILE) as f:
        t = json.load(f)
    creds = Credentials(
        token=t['token'],
        refresh_token=t['refresh_token'],
        token_uri=t['token_uri'],
        client_id=t['client_id'],
        client_secret=t['client_secret'],
        scopes=t['scopes']
    )
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        with open(TOKEN_FILE, 'w') as f:
            json.dump({
                'token': creds.token,
                'refresh_token': creds.refresh_token,
                'token_uri': creds.token_uri,
                'client_id': creds.client_id,
                'client_secret': creds.client_secret,
                'scopes': list(creds.scopes),
            }, f, indent=2)
    return creds

def query_gsc(dimensions, days, limit, query_filter=None):
    creds = get_creds()
    service = build('searchconsole', 'v1', credentials=creds)
    
    end = datetime.now() - timedelta(days=3)  # GSC data has ~3 day lag
    start = end - timedelta(days=days)
    
    body = {
        'startDate': start.strftime('%Y-%m-%d'),
        'endDate': end.strftime('%Y-%m-%d'),
        'dimensions': dimensions,
        'rowLimit': limit,
    }
    
    if query_filter:
        body['dimensionFilterGroups'] = [{
            'filters': [{
                'dimension': 'query',
                'operator': 'contains',
                'expression': query_filter
            }]
        }]
    
    resp = service.searchanalytics().query(siteUrl=SITE_URL, body=body).execute()
    return resp, start.strftime('%Y-%m-%d'), end.strftime('%Y-%m-%d')

def main():
    parser = argparse.ArgumentParser(description='Query Google Search Console')
    parser.add_argument('--days', type=int, default=28, help='Number of days (default 28)')
    parser.add_argument('--type', choices=['queries', 'pages', 'both'], default='queries')
    parser.add_argument('--limit', type=int, default=25, help='Max rows (default 25)')
    parser.add_argument('--query', type=str, help='Filter queries containing this text')
    parser.add_argument('--json', action='store_true', help='Output raw JSON')
    args = parser.parse_args()
    
    results = {}
    
    if args.type in ('queries', 'both'):
        resp, start, end = query_gsc(['query'], args.days, args.limit, args.query)
        results['queries'] = {
            'period': f'{start} to {end}',
            'rows': [{
                'query': r['keys'][0],
                'clicks': r['clicks'],
                'impressions': r['impressions'],
                'ctr': round(r['ctr'] * 100, 1),
                'position': round(r['position'], 1)
            } for r in resp.get('rows', [])]
        }
    
    if args.type in ('pages', 'both'):
        resp, start, end = query_gsc(['page'], args.days, args.limit, args.query)
        results['pages'] = {
            'period': f'{start} to {end}',
            'rows': [{
                'page': r['keys'][0],
                'clicks': r['clicks'],
                'impressions': r['impressions'],
                'ctr': round(r['ctr'] * 100, 1),
                'position': round(r['position'], 1)
            } for r in resp.get('rows', [])]
        }
    
    if args.json:
        print(json.dumps(results, indent=2))
    else:
        for section, data in results.items():
            print(f"\n{'='*60}")
            print(f" {section.upper()} — {data['period']}")
            print(f"{'='*60}")
            if not data['rows']:
                print("  (no data)")
                continue
            print(f"  {'Query/Page':<45} {'Clicks':>6} {'Impr':>7} {'CTR':>6} {'Pos':>5}")
            print(f"  {'-'*45} {'-'*6} {'-'*7} {'-'*6} {'-'*5}")
            for r in data['rows']:
                key = r.get('query', r.get('page', ''))
                if len(key) > 44:
                    key = key[:41] + '...'
                print(f"  {key:<45} {r['clicks']:>6} {r['impressions']:>7} {r['ctr']:>5.1f}% {r['position']:>5.1f}")

if __name__ == '__main__':
    main()
