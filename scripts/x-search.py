#!/usr/bin/env python3
"""
X/Twitter Search CLI - Search for tweets using X API v2
Usage: x-search.py <query> [--max N] [--sort recent|relevant]
"""

import os
import sys
import json
import argparse
import requests

def search_tweets(query: str, max_results: int = 10, sort_order: str = "relevancy") -> dict:
    """Search tweets using X API v2."""
    bearer_token = os.environ.get("X_BEARER_TOKEN")
    if not bearer_token:
        return {"error": "X_BEARER_TOKEN environment variable not set"}
    
    url = "https://api.twitter.com/2/tweets/search/recent"
    
    headers = {
        "Authorization": f"Bearer {bearer_token}",
        "User-Agent": "ClawdbotXSearch/1.0"
    }
    
    params = {
        "query": query,
        "max_results": min(max_results, 100),  # API max is 100
        "sort_order": sort_order,  # "recency" or "relevancy"
        "tweet.fields": "created_at,author_id,public_metrics,context_annotations",
        "expansions": "author_id",
        "user.fields": "name,username,verified,public_metrics"
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        return {"error": f"HTTP {response.status_code}: {response.text}"}
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

def format_results(data: dict) -> str:
    """Format search results for readability."""
    if "error" in data:
        return f"Error: {data['error']}"
    
    if "data" not in data or not data["data"]:
        return "No tweets found."
    
    # Build user lookup
    users = {}
    if "includes" in data and "users" in data["includes"]:
        for user in data["includes"]["users"]:
            users[user["id"]] = user
    
    output = []
    output.append(f"Found {len(data['data'])} tweets:\n")
    
    for i, tweet in enumerate(data["data"], 1):
        author = users.get(tweet.get("author_id"), {})
        username = author.get("username", "unknown")
        name = author.get("name", "Unknown")
        verified = "✓" if author.get("verified") else ""
        
        metrics = tweet.get("public_metrics", {})
        likes = metrics.get("like_count", 0)
        retweets = metrics.get("retweet_count", 0)
        replies = metrics.get("reply_count", 0)
        
        created = tweet.get("created_at", "")[:10]  # Just date
        
        output.append(f"---[{i}]---")
        output.append(f"@{username} {verified}({name}) · {created}")
        output.append(tweet["text"])
        output.append(f"💬 {replies}  🔁 {retweets}  ❤️ {likes}")
        output.append(f"https://x.com/{username}/status/{tweet['id']}")
        output.append("")
    
    meta = data.get("meta", {})
    if "next_token" in meta:
        output.append(f"[More results available]")
    
    return "\n".join(output)

def main():
    parser = argparse.ArgumentParser(description="Search X/Twitter for tweets")
    parser.add_argument("query", help="Search query (supports operators like 'from:', '#', etc.)")
    parser.add_argument("--max", type=int, default=10, help="Max results (default: 10, max: 100)")
    parser.add_argument("--sort", choices=["recent", "relevant"], default="relevant",
                        help="Sort order (default: relevant)")
    parser.add_argument("--json", action="store_true", help="Output raw JSON")
    
    args = parser.parse_args()
    
    sort_order = "recency" if args.sort == "recent" else "relevancy"
    
    results = search_tweets(args.query, max_results=args.max, sort_order=sort_order)
    
    if args.json:
        print(json.dumps(results, indent=2))
    else:
        print(format_results(results))

if __name__ == "__main__":
    main()
