#!/usr/bin/env python3
"""
Download presentations from catalog.json and upload to Cloudflare R2
Respects rate limits and handles errors gracefully
"""

import json
import os
import time
import requests
import boto3
from pathlib import Path
from urllib.parse import urlparse, unquote
from botocore.config import Config

CATALOG_PATH = Path(__file__).parent.parent / "sources" / "catalog.json"
DELAY_SECONDS = 2  # Be respectful with rate limiting

# R2 configuration from environment
R2_ACCOUNT_ID = os.environ.get("R2_ACCOUNT_ID")
R2_ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")
R2_BUCKET_NAME = os.environ.get("R2_BUCKET_NAME")
R2_PREFIX = "to-be-evaluated"  # New downloads go here for evaluation

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def get_s3_client():
    """Create S3 client configured for Cloudflare R2"""
    if not all([R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME]):
        raise ValueError("Missing R2 environment variables. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME")
    
    return boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
    )

def object_exists(s3_client, key: str) -> bool:
    """Check if object already exists in R2"""
    try:
        s3_client.head_object(Bucket=R2_BUCKET_NAME, Key=key)
        return True
    except s3_client.exceptions.ClientError:
        return False

def sanitize_filename(title: str) -> str:
    """Convert title to safe filename"""
    unsafe = '<>:"/\\|?*'
    for char in unsafe:
        title = title.replace(char, '')
    return title[:100].strip()

def get_file_extension(url: str, content_type: str = None) -> str:
    """Determine file extension from URL or content-type"""
    parsed = urlparse(url)
    path = unquote(parsed.path.lower())
    
    if path.endswith('.pdf'):
        return '.pdf'
    elif path.endswith('.pptx'):
        return '.pptx'
    elif path.endswith('.ppt'):
        return '.ppt'
    elif content_type:
        if 'pdf' in content_type:
            return '.pdf'
        elif 'powerpoint' in content_type or 'presentation' in content_type:
            return '.pptx'
    return '.pdf'

def download_and_upload(s3_client, url: str, title: str, source: str) -> dict:
    """Download a presentation and upload to R2"""
    safe_title = sanitize_filename(title)
    
    try:
        # First check if URL is reachable
        response = requests.get(url, headers=HEADERS, timeout=30, stream=True)
        response.raise_for_status()
        
        # Determine extension
        content_type = response.headers.get('content-type', '')
        ext = get_file_extension(url, content_type)
        
        # Skip if not a downloadable file
        if 'text/html' in content_type and not url.endswith('.pdf'):
            return {
                "title": title,
                "url": url,
                "status": "skipped",
                "reason": "HTML page, not direct download"
            }
        
        # Create R2 key
        filename = f"{safe_title}{ext}"
        r2_key = f"{R2_PREFIX}/{source}/{filename}"
        
        # Skip if already exists in R2
        if object_exists(s3_client, r2_key):
            return {
                "title": title,
                "url": url,
                "status": "exists",
                "r2_key": r2_key
            }
        
        # Download content
        content = response.content
        
        # Verify it's actually a PDF/PPTX (check magic bytes)
        if ext == '.pdf' and not content[:4] == b'%PDF':
            return {
                "title": title,
                "url": url,
                "status": "skipped",
                "reason": "Not a valid PDF file"
            }
        
        # Upload to R2
        content_type_header = 'application/pdf' if ext == '.pdf' else 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        s3_client.put_object(
            Bucket=R2_BUCKET_NAME,
            Key=r2_key,
            Body=content,
            ContentType=content_type_header
        )
        
        file_size = len(content)
        
        return {
            "title": title,
            "url": url,
            "status": "uploaded",
            "r2_key": r2_key,
            "size_kb": file_size // 1024
        }
        
    except requests.exceptions.Timeout:
        return {"title": title, "url": url, "status": "error", "reason": "Timeout"}
    except requests.exceptions.HTTPError as e:
        return {"title": title, "url": url, "status": "error", "reason": f"HTTP {e.response.status_code}"}
    except Exception as e:
        return {"title": title, "url": url, "status": "error", "reason": str(e)}

def main():
    # Initialize R2 client
    print("Connecting to Cloudflare R2...")
    s3_client = get_s3_client()
    print(f"Connected to bucket: {R2_BUCKET_NAME}")
    
    # Load catalog
    with open(CATALOG_PATH) as f:
        catalog = json.load(f)
    
    results = {
        "uploaded": [],
        "exists": [],
        "skipped": [],
        "errors": []
    }
    
    # Process each source
    for source, presentations in catalog["presentations"].items():
        if not presentations:
            continue
            
        print(f"\n=== Processing {source.upper()} ({len(presentations)} presentations) ===")
        
        for i, pres in enumerate(presentations):
            title = pres.get("title", f"unknown_{i}")
            url = pres.get("url", "")
            
            if not url:
                continue
            
            print(f"  [{i+1}/{len(presentations)}] {title[:60]}...")
            
            result = download_and_upload(s3_client, url, title, source)
            
            # Categorize result
            status = result.get("status", "error")
            if status == "uploaded":
                results["uploaded"].append(result)
                print(f"    ✓ Uploaded to R2 ({result.get('size_kb', 0)} KB)")
            elif status == "exists":
                results["exists"].append(result)
                print(f"    ○ Already in R2")
            elif status == "skipped":
                results["skipped"].append(result)
                print(f"    - Skipped: {result.get('reason', 'unknown')}")
            else:
                results["errors"].append(result)
                print(f"    ✗ Error: {result.get('reason', 'unknown')}")
            
            # Rate limiting
            time.sleep(DELAY_SECONDS)
    
    # Summary
    print("\n" + "="*50)
    print("SUMMARY")
    print("="*50)
    print(f"Uploaded to R2: {len(results['uploaded'])}")
    print(f"Already in R2: {len(results['exists'])}")
    print(f"Skipped (HTML pages): {len(results['skipped'])}")
    print(f"Errors: {len(results['errors'])}")

if __name__ == "__main__":
    main()
