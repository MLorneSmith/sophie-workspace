# Perplexity Research: Brandfetch API Integration

**Date**: 2026-03-03
**Agent**: perplexity-expert
**Search Type**: Chat API (sonar-pro) + Search API

---

## Query Summary

Researched the Brandfetch API for practical integration details: endpoints, auth, signup, response format, CDN URL approach, rate limits, and TypeScript code examples.

---

## Findings

### 1. Products Overview

Brandfetch offers two distinct products:

- **Brand API (v2)** — Full JSON API returning logos, colors, fonts, images, and metadata. Requires Bearer token. Has a free tier of 100 requests/month.
- **Logo API / Logo Link** — A free CDN-based URL approach similar to Clearbit. Requires only a Client ID appended as a query param. Free with fair-use limits.
