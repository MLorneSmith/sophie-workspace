#!/usr/bin/env python3
"""
Capture Classification & Extraction Pipeline

Fetches unprocessed captures from MC, classifies them via LLM,
and updates MC with intents, topic tags, and extracted insights.

Uses ZAI/GLM (cheap) for classification.

Exit codes:
0 = Success
1 = Error
"""

import json
import os
import subprocess
import sys
from datetime import datetime

# MC API config
MC_BASE_URL = "https://internal.slideheroes.com/api/v1"
CF_CLIENT_ID = os.environ.get("CF_ACCESS_CLIENT_ID", "")
CF_CLIENT_SECRET = os.environ.get("CF_ACCESS_CLIENT_SECRET", "")

# LLM config — OpenAI gpt-4.1-mini (fast/cheap), fallback to ZAI/GLM
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
OPENAI_BASE_URL = "https://api.openai.com/v1"
ZAI_API_KEY = os.environ.get("ZAI_API_KEY", "")
ZAI_BASE_URL = "https://api.z.ai/api/coding/paas/v4"  # Coding Plan endpoint!

VALID_INTENTS = [
    "best-practice",
    "competitive-intel",
    "inspiration-design",
    "inspiration-email",
    "inspiration-content",
    "market-insight",
    "case-study",
    "quote-stat",
    "technical-ref",
    "automate-with-sophie",
    "voice-context",
    "general-learning",
]

CLASSIFICATION_PROMPT = """You are a content classifier for SlideHeroes, an AI-powered SaaS for business presentations.

Analyze the following captured content and return a JSON object with these fields:

1. "intents" — array of 1-3 intent labels from this list ONLY:
   - best-practice: actionable technique for presentations, consulting, or SaaS
   - competitive-intel: info about competitor products (Gamma, Tome, Beautiful.ai, Canva, etc.)
   - inspiration-design: visual design inspiration for slides/UI
   - inspiration-email: email marketing examples worth studying
   - inspiration-content: content marketing or copywriting examples
   - market-insight: industry trends, market data, customer behavior
   - case-study: real-world success story or implementation example
   - quote-stat: notable quote or statistic worth referencing
   - technical-ref: technical documentation, API reference, code pattern
   - automate-with-sophie: idea Sophie (AI assistant) could automate
   - voice-context: examples of brand voice or tone to learn from
   - general-learning: anything educational that doesn't fit above

2. "topicTags" — array of 2-5 short topic tags (lowercase, hyphenated). Examples: "pricing", "onboarding", "slide-design", "ai-tools", "consulting", "email-marketing"

3. "extraction" — a JSON object with intent-specific extractions:
   - For best-practice: {{"practice": "...", "why_it_works": "...", "how_to_apply": "..."}}
   - For competitive-intel: {{"company": "...", "product": "...", "key_finding": "..."}}
   - For market-insight: {{"insight": "...", "source": "...", "implications": "..."}}
   - For quote-stat: {{"quote_or_stat": "...", "attribution": "...", "context": "..."}}
   - For others: {{"summary": "...", "key_takeaway": "...", "relevance": "..."}}

Return ONLY valid JSON. No markdown, no explanation.

---

URL: {url}
Title: {title}
Content:
{content}
"""


def mc_get(path: str) -> dict | list | None:
    """GET from MC API."""
    try:
        result = subprocess.run(
            [
                "curl", "-s",
                f"{MC_BASE_URL}{path}",
                "-H", f"CF-Access-Client-Id: {CF_CLIENT_ID}",
                "-H", f"CF-Access-Client-Secret: {CF_CLIENT_SECRET}",
            ],
            capture_output=True, text=True, timeout=15,
        )
        if result.returncode == 0 and result.stdout.strip():
            return json.loads(result.stdout)
    except (subprocess.SubprocessError, json.JSONDecodeError) as e:
        print(f"MC GET error: {e}", file=sys.stderr)
    return None


def mc_patch(path: str, data: dict) -> dict | None:
    """PATCH to MC API."""
    try:
        result = subprocess.run(
            [
                "curl", "-s",
                "-X", "PATCH",
                f"{MC_BASE_URL}{path}",
                "-H", "Content-Type: application/json",
                "-H", f"CF-Access-Client-Id: {CF_CLIENT_ID}",
                "-H", f"CF-Access-Client-Secret: {CF_CLIENT_SECRET}",
                "-d", json.dumps(data),
            ],
            capture_output=True, text=True, timeout=15,
        )
        if result.returncode == 0 and result.stdout.strip():
            return json.loads(result.stdout)
    except (subprocess.SubprocessError, json.JSONDecodeError) as e:
        print(f"MC PATCH error: {e}", file=sys.stderr)
    return None


def classify_with_llm(url: str, title: str | None, content: str | None) -> dict | None:
    """Call LLM to classify content. Uses OpenAI gpt-4.1-mini, falls back to ZAI/GLM."""
    prompt = CLASSIFICATION_PROMPT.format(
        url=url or "N/A",
        title=title or "N/A",
        content=(content or "No content available")[:3000],
    )

    # Try OpenAI first (gpt-4.1-mini — fast and cheap, ~$0.0004/call)
    if OPENAI_API_KEY:
        result = _call_llm(OPENAI_BASE_URL, OPENAI_API_KEY, "gpt-4.1-mini", prompt)
        if result is not None:
            return result
        print("  OpenAI failed, trying ZAI/GLM...", file=sys.stderr)

    # Fallback to ZAI/GLM
    if ZAI_API_KEY:
        return _call_llm(ZAI_BASE_URL, ZAI_API_KEY, "glm-4-plus", prompt)

    print("ERROR: No LLM API key available", file=sys.stderr)
    return None


def _call_llm(base_url: str, api_key: str, model: str, prompt: str) -> dict | None:
    """Make an OpenAI-compatible LLM API call."""
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
        "max_tokens": 1000,
    }

    try:
        result = subprocess.run(
            [
                "curl", "-s",
                "-X", "POST",
                f"{base_url}/chat/completions",
                "-H", "Content-Type: application/json",
                "-H", f"Authorization: Bearer {api_key}",
                "-d", json.dumps(payload),
            ],
            capture_output=True, text=True, timeout=60,
        )

        if result.returncode != 0:
            print(f"LLM call failed: {result.stderr}", file=sys.stderr)
            return None

        resp = json.loads(result.stdout)

        # Check for errors
        if "error" in resp:
            print(f"LLM API error: {resp['error']}", file=sys.stderr)
            return None

        content_str = resp["choices"][0]["message"]["content"].strip()

        # Strip markdown code fences if present
        if content_str.startswith("```"):
            lines = content_str.split("\n")
            # Remove first and last lines (```json and ```)
            lines = [l for l in lines if not l.strip().startswith("```")]
            content_str = "\n".join(lines).strip()

        classification = json.loads(content_str)
        return classification

    except (subprocess.SubprocessError, json.JSONDecodeError, KeyError, IndexError) as e:
        print(f"LLM classification error: {e}", file=sys.stderr)
        return None


def validate_intents(intents: list) -> list:
    """Filter to only valid intents."""
    return [i for i in intents if i in VALID_INTENTS][:3]


def main():
    print(f"=== Capture Classification Pipeline ===")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    if not CF_CLIENT_ID or not CF_CLIENT_SECRET:
        print("ERROR: CF_ACCESS_CLIENT_ID / CF_ACCESS_CLIENT_SECRET not set", file=sys.stderr)
        sys.exit(1)

    if not ZAI_API_KEY:
        print("ERROR: ZAI_API_KEY not set", file=sys.stderr)
        sys.exit(1)

    # Fetch unprocessed captures
    captures = mc_get("/captures?status=unprocessed&limit=10")

    if not captures or not isinstance(captures, list):
        print("No unprocessed captures found")
        sys.exit(0)

    print(f"Found {len(captures)} unprocessed capture(s)")

    processed = 0
    failed = 0

    for cap in captures:
        cap_id = cap.get("id")
        url = cap.get("url", "")
        title = cap.get("title")
        raw_content = cap.get("rawContent")

        print(f"\n--- Capture #{cap_id}: {url[:80]} ---")

        # Classify
        result = classify_with_llm(url, title, raw_content)

        if not result:
            print(f"  ❌ Classification failed")
            failed += 1
            continue

        # Validate and prepare update
        intents = validate_intents(result.get("intents", []))
        topic_tags = result.get("topicTags", [])[:5]
        extraction = result.get("extraction", {})

        if not intents:
            intents = ["general-learning"]

        update_data = {
            "intents": json.dumps(intents),
            "topicTags": json.dumps(topic_tags),
            "extraction": json.dumps(extraction),
            "status": "processed",
        }

        # Also set title if we got one from classification and it's missing
        if not title and extraction.get("summary"):
            update_data["title"] = extraction["summary"][:200]

        # Update MC
        updated = mc_patch(f"/captures/{cap_id}", update_data)

        if updated and "id" in updated:
            print(f"  ✅ Classified: intents={intents}, tags={topic_tags}")
            processed += 1
        else:
            print(f"  ❌ Failed to update MC")
            failed += 1

    print(f"\n=== Done: {processed} processed, {failed} failed ===")
    sys.exit(0)


if __name__ == "__main__":
    main()
