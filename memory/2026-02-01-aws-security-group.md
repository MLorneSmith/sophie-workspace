# 2026-02-01 — AWS Security Group

*Truncated 2026-03-01 — full history in git*

## Issue
HTTPS (port 443) not accessible despite local firewall being open.

## Root Cause
AWS Security Group wasn't allowing port 443 inbound. AWS blocks before traffic reaches server.

## Fix
In AWS Console: EC2 → Instances → Security → Edit inbound rules → Add HTTPS (port 443, source 0.0.0.0/0 or Cloudflare IPs).
