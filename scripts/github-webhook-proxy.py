#!/usr/bin/env python3
"""
GitHub Webhook → OpenClaw Hook Proxy

Receives GitHub webhooks with HMAC-SHA256 verification,
then forwards to OpenClaw's hook endpoint with Bearer auth.
"""

import hashlib
import hmac
import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request

LISTEN_PORT = 8790
OPENCLAW_HOOK_BASE = "http://127.0.0.1:18789/hooks"

# Read secrets from environment or files
WEBHOOK_SECRET = os.environ.get("GITHUB_WEBHOOK_SECRET", "").strip()
OPENCLAW_TOKEN = os.environ.get("OPENCLAW_HOOK_TOKEN", "").strip()

if not WEBHOOK_SECRET:
    try:
        with open("/tmp/github-webhook-secret.txt") as f:
            WEBHOOK_SECRET = f.read().strip()
    except FileNotFoundError:
        pass

if not OPENCLAW_TOKEN:
    try:
        with open(os.path.expanduser("~/.openclaw/openclaw.json")) as f:
            config = json.load(f)
            OPENCLAW_TOKEN = config.get("hooks", {}).get("token", "")
    except (FileNotFoundError, json.JSONDecodeError):
        pass


def verify_signature(payload: bytes, signature: str) -> bool:
    """Verify GitHub webhook HMAC-SHA256 signature."""
    if not WEBHOOK_SECRET:
        return True
    if not signature or not signature.startswith("sha256="):
        return False
    expected = hmac.new(
        WEBHOOK_SECRET.encode(), payload, hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(f"sha256={expected}", signature)


class WebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        payload = self.rfile.read(content_length)
        event = self.headers.get("X-GitHub-Event", "unknown")
        signature = self.headers.get("X-Hub-Signature-256", "")
        
        # Log ALL incoming requests
        print(f"[webhook] event={event} len={len(payload)} sig={signature[:30] if signature else 'none'}")
        sys.stdout.flush()
        
        # Verify signature
        if not verify_signature(payload, signature):
            print(f"[webhook] INVALID SIGNATURE")
            sys.stdout.flush()
            self.send_response(401)
            self.end_headers()
            self.wfile.write(b"Invalid signature")
            return
        
        # Parse JSON
        try:
            data = json.loads(payload)
        except json.JSONDecodeError:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Invalid JSON")
            return
        
        # Determine reviewer based on event type
        reviewer = "unknown"
        if event == "pull_request_review":
            reviewer = data.get("review", {}).get("user", {}).get("login", "unknown")
        elif event == "pull_request_review_comment":
            reviewer = data.get("comment", {}).get("user", {}).get("login", "unknown")
        elif event == "issue_comment":
            reviewer = data.get("comment", {}).get("user", {}).get("login", "unknown")
        
        print(f"[webhook] reviewer={reviewer} event={event}")
        sys.stdout.flush()
        
        # Filter: only forward from coderabbitai[bot]
        if reviewer != "coderabbitai[bot]":
            print(f"[webhook] SKIPPED (not CodeRabbit)")
            sys.stdout.flush()
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Skipped")
            return
        
        # Determine hook path based on event type
        if event == "issue_comment" and "pull_request" not in data.get("issue", {}):
            hook_path = "github-plan"
        else:
            hook_path = "github-pr"
        hook_url = f"{OPENCLAW_HOOK_BASE}/{hook_path}"

        # Forward to OpenClaw
        print(f"[webhook] FORWARDING to OpenClaw ({hook_path})...")
        sys.stdout.flush()
        try:
            req = urllib.request.Request(
                hook_url,
                data=payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {OPENCLAW_TOKEN}",
                    "X-GitHub-Event": event,
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                status = resp.status
                body = resp.read().decode()
            
            print(f"[webhook] FORWARDED ({status})")
            sys.stdout.flush()
            self.send_response(200)
            self.end_headers()
            self.wfile.write(f"Forwarded ({status})".encode())
        except Exception as e:
            print(f"[webhook] ERROR: {e}")
            sys.stdout.flush()
            self.send_response(502)
            self.end_headers()
            self.wfile.write(f"Error: {e}".encode())

    def log_message(self, format, *args):
        pass  # Suppress default logging


if __name__ == "__main__":
    print(f"GitHub webhook proxy starting on port {LISTEN_PORT}")
    print(f"Forwarding CodeRabbit events to {OPENCLAW_HOOK_BASE}/github-{{pr,plan}}")
    print(f"Webhook secret: {'configured' if WEBHOOK_SECRET else 'NOT SET'}")
    print(f"OpenClaw token: {'configured' if OPENCLAW_TOKEN else 'NOT SET'}")
    sys.stdout.flush()
    
    server = HTTPServer(("127.0.0.1", LISTEN_PORT), WebhookHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down")
        server.shutdown()
