#!/usr/bin/env python3
"""Promote MVL-qualified leads from BigQuery to Attio.

Reverse ETL: Query core.mvl_qualified_leads for records that meet the MVL
threshold but are not yet in Attio, then create/update them in Attio.

Usage:
  promote-mvl-to-attio.py                      # Sync all qualified leads
  promote-mvl-to-attio.py --dry-run            # Preview without writing
  promote-mvl-to-attio.py --limit 10           # Sync only 10 records
  promote-mvl-to-attio.py --tier outbound      # Only outbound tier

BigQuery Source:
  - Project: slideheroes-data-platform
  - Table: core.mvl_qualified_leads
  - Filter: already_in_attio = false AND mvl_tier = 'outbound'

Attio API:
  - PUT /v2/objects/companies/records?matching_attribute=domains
  - Creates or updates company records based on domain

State:
  - ~/clawd/config/mvl-attio-promotion-state.json
  - Tracks last sync time and counts
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests

try:
    from google.cloud import bigquery
except Exception as e:
    print(f"ERROR: google-cloud-bigquery package not available: {e}")
    print("Install with: pip install google-cloud-bigquery --break-system-packages")
    sys.exit(1)


ATTIO_HOST = "https://api.attio.com/v2"

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/home/ubuntu/.clawdbot/gcp-service-account.json"
BQ_PROJECT = "slideheroes-data-platform"
BQ_DATASET = "core"
BQ_TABLE = "mvl_qualified_leads"

DEFAULT_STATE_FILE = os.path.expanduser("~/clawd/config/mvl-attio-promotion-state.json")


def read_env() -> dict:
    """Read environment variables from .env file."""
    env: dict = {}
    try:
        with open("/home/ubuntu/.clawdbot/.env") as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    k, v = line.split("=", 1)
                    env[k.strip()] = v.strip().strip('"').strip("'")
    except FileNotFoundError:
        pass
    return env


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_state(state_file: str) -> dict:
    """Load sync state from file."""
    path = Path(os.path.expanduser(state_file))
    if not path.exists():
        return {
            "last_sync_iso": None,
            "total_promoted": 0,
            "total_errors": 0,
            "last_batch_count": 0,
        }
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            return {
                "last_sync_iso": None,
                "total_promoted": 0,
                "total_errors": 0,
                "last_batch_count": 0,
            }
        data.setdefault("last_sync_iso", None)
        data.setdefault("total_promoted", 0)
        data.setdefault("total_errors", 0)
        data.setdefault("last_batch_count", 0)
        return data
    except Exception:
        return {
            "last_sync_iso": None,
            "total_promoted": 0,
            "total_errors": 0,
            "last_batch_count": 0,
        }


def save_state(state_file: str, state: dict):
    """Save sync state to file."""
    path = Path(os.path.expanduser(state_file))
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
        f.write("\n")
    tmp.replace(path)


def request_with_backoff(
    session: requests.Session,
    method: str,
    url: str,
    *,
    headers: Dict[str, str],
    json_body: Optional[dict] = None,
    timeout_s: int = 60,
    max_retries: int = 10,
) -> requests.Response:
    """HTTP request with exponential backoff for rate limits/transient errors."""
    delay = 1.0
    for attempt in range(max_retries):
        resp = session.request(method, url, headers=headers, json=json_body, timeout=timeout_s)
        if resp.status_code < 400:
            return resp

        retryable = resp.status_code in (429, 500, 502, 503, 504)
        if not retryable or attempt == max_retries - 1:
            body = resp.text
            if len(body) > 1200:
                body = body[:1200] + "..."
            raise RuntimeError(f"HTTP {resp.status_code} for {method} {url}: {body}")

        retry_after = resp.headers.get("Retry-After")
        if retry_after:
            try:
                delay = max(delay, float(retry_after))
            except Exception:
                pass

        print(f"  Retrying ({attempt + 1}/{max_retries}) after {delay:.1f}s...")
        time.sleep(delay)
        delay = min(delay * 2, 60.0)

    raise RuntimeError("unreachable")


def extract_domain(domain: Optional[str]) -> Optional[str]:
    """Extract clean domain from various formats."""
    if not domain:
        return None
    
    domain = domain.strip().lower()
    
    # Remove protocol
    domain = re.sub(r'^https?://', '', domain)
    # Remove www.
    domain = re.sub(r'^www\.', '', domain)
    # Remove path
    domain = domain.split('/')[0]
    # Remove port
    domain = domain.split(':')[0]
    
    # Validate domain format
    if not re.match(r'^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$', domain):
        return None
    
    return domain


def query_mvl_leads(
    bq_client: bigquery.Client,
    *,
    tier: Optional[str] = None,
    limit: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Query MVL-qualified leads from BigQuery."""
    query = f"""
        SELECT
            company_id,
            company_name,
            domain,
            employee_count,
            industry,
            annual_revenue,
            primary_location,
            linkedin_url,
            website_url,
            icp_total_score,
            icp_grade,
            icp_segment,
            mvl_tier,
            has_product_engagement,
            contact_count
        FROM `{BQ_PROJECT}.{BQ_DATASET}.{BQ_TABLE}`
        WHERE already_in_attio = FALSE
    """
    
    if tier:
        query += f" AND mvl_tier = '{tier}'"
    
    query += " ORDER BY icp_total_score DESC"
    
    if limit:
        query += f" LIMIT {limit}"
    
    result = bq_client.query(query).result()
    return [dict(row) for row in result]


def build_attio_payload(lead: Dict[str, Any]) -> dict:
    """Build Attio company record payload from MVL lead."""
    values: Dict[str, List[dict]] = {}
    
    # Domain (required for matching)
    domain = extract_domain(lead.get("domain"))
    if domain:
        values["domains"] = [{"domain": domain}]
    
    # Company name
    if lead.get("company_name"):
        values["name"] = [{"value": lead["company_name"]}]
    
    # Industry (map to categories if possible)
    if lead.get("industry"):
        values["categories"] = [{"option": lead["industry"]}]
    
    # Employee count (map to employee_range)
    emp_count = lead.get("employee_count")
    if emp_count:
        if emp_count < 10:
            emp_range = "1-9"
        elif emp_count < 50:
            emp_range = "10-49"
        elif emp_count < 200:
            emp_range = "50-199"
        elif emp_count < 500:
            emp_range = "200-499"
        elif emp_count < 1000:
            emp_range = "500-999"
        else:
            emp_range = "1000+"
        values["employee_range"] = [{"option": emp_range}]
    
    # Revenue (map to estimated_arr_usd)
    revenue = lead.get("annual_revenue")
    if revenue:
        if revenue < 1_000_000:
            arr_range = "<$1M"
        elif revenue < 5_000_000:
            arr_range = "$1M-$5M"
        elif revenue < 10_000_000:
            arr_range = "$5M-$10M"
        elif revenue < 50_000_000:
            arr_range = "$10M-$50M"
        else:
            arr_range = "$50M+"
        values["estimated_arr_usd"] = [{"option": arr_range}]
    
    # Primary location
    if lead.get("primary_location"):
        values["primary_location"] = [{
            "line_1": None,
            "line_2": None,
            "line_3": None,
            "line_4": None,
            "locality": lead["primary_location"],
            "region": None,
            "postcode": None,
            "country_code": None,
            "latitude": None,
            "longitude": None,
        }]
    
    # LinkedIn URL
    if lead.get("linkedin_url"):
        values["linkedin"] = [{"value": lead["linkedin_url"]}]
    
    # Website URL
    if lead.get("website_url"):
        # Use website as additional domain if different from primary domain
        website_domain = extract_domain(lead["website_url"])
        if website_domain and website_domain != domain:
            if "domains" not in values:
                values["domains"] = []
            if not any(d.get("domain") == website_domain for d in values["domains"]):
                values["domains"].append({"domain": website_domain})
    
    return {"data": {"values": values}}


def promote_lead_to_attio(
    session: requests.Session,
    lead: Dict[str, Any],
    headers: Dict[str, str],
    dry_run: bool = False,
) -> Dict[str, Any]:
    """Promote a single lead to Attio."""
    domain = extract_domain(lead.get("domain"))
    company_name = lead.get("company_name", "Unknown")
    
    if not domain:
        return {
            "success": False,
            "company_id": lead.get("company_id"),
            "company_name": company_name,
            "error": "No valid domain",
        }
    
    payload = build_attio_payload(lead)
    
    if dry_run:
        return {
            "success": True,
            "company_id": lead.get("company_id"),
            "company_name": company_name,
            "domain": domain,
            "dry_run": True,
        }
    
    try:
        url = f"{ATTIO_HOST}/objects/companies/records?matching_attribute=domains"
        resp = request_with_backoff(session, "PUT", url, headers=headers, json_body=payload)
        data = resp.json()
        
        record_id = None
        if isinstance(data, dict):
            record_id = data.get("data", {}).get("id", {}).get("record_id")
        
        return {
            "success": True,
            "company_id": lead.get("company_id"),
            "company_name": company_name,
            "domain": domain,
            "attio_record_id": record_id,
        }
    except Exception as e:
        return {
            "success": False,
            "company_id": lead.get("company_id"),
            "company_name": company_name,
            "domain": domain,
            "error": str(e),
        }


def update_bigquery_sync_status(
    bq_client: bigquery.Client,
    company_ids: List[str],
):
    """Update already_in_attio flag in BigQuery for synced companies."""
    if not company_ids:
        return
    
    # Build update query
    ids_str = ", ".join(f"'{cid}'" for cid in company_ids)
    query = f"""
        UPDATE `{BQ_PROJECT}.{BQ_DATASET}.{BQ_TABLE}`
        SET already_in_attio = TRUE
        WHERE company_id IN ({ids_str})
    """
    
    bq_client.query(query).result()


def main():
    parser = argparse.ArgumentParser(description="Promote MVL-qualified leads from BigQuery to Attio")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing to Attio/BigQuery")
    parser.add_argument("--limit", type=int, help="Maximum number of leads to sync")
    parser.add_argument("--tier", type=str, default="outbound", help="MVL tier to sync (default: outbound)")
    parser.add_argument(
        "--state-file",
        type=str,
        default=DEFAULT_STATE_FILE,
        help=f"Path to state file (default: {DEFAULT_STATE_FILE})",
    )
    parser.add_argument("--skip-bq-update", action="store_true", help="Skip updating BigQuery sync status")
    args = parser.parse_args()

    env = read_env()
    api_key = env.get("ATTIO_API_KEY", "").strip() or os.environ.get("ATTIO_API_KEY", "").strip()
    if not api_key:
        if args.dry_run:
            print("WARNING: ATTIO_API_KEY not found (dry-run)")
        else:
            print("ERROR: ATTIO_API_KEY not found in .env or environment")
            sys.exit(1)

    state = load_state(args.state_file)
    bq_client = bigquery.Client(project=BQ_PROJECT)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    print(f"{'DRY RUN: ' if args.dry_run else ''}Promoting MVL leads to Attio")
    print(f"Project:     {BQ_PROJECT}")
    print(f"Table:       {BQ_DATASET}.{BQ_TABLE}")
    print(f"Tier:        {args.tier}")
    print(f"Limit:       {args.limit or 'unlimited'}")
    print(f"State file:  {os.path.expanduser(args.state_file)}")
    print(f"Started:     {utc_now_iso()}\n")

    # Query leads
    print("Querying MVL-qualified leads...")
    leads = query_mvl_leads(bq_client, tier=args.tier, limit=args.limit)
    print(f"Found {len(leads)} leads to promote\n")

    if not leads:
        print("No leads to sync. Exiting.")
        return

    # Promote leads
    results = {
        "promoted": [],
        "errors": [],
    }

    with requests.Session() as session:
        for i, lead in enumerate(leads, 1):
            company_name = lead.get("company_name", "Unknown")
            domain = extract_domain(lead.get("domain")) or "no-domain"
            print(f"[{i}/{len(leads)}] {company_name} ({domain})...", end=" ", flush=True)
            
            result = promote_lead_to_attio(session, lead, headers, dry_run=args.dry_run)
            
            if result["success"]:
                print("✓")
                results["promoted"].append(result)
            else:
                print(f"✗ ({result.get('error', 'unknown error')})")
                results["errors"].append(result)
            
            # Rate limiting: small delay between requests
            if not args.dry_run and i < len(leads):
                time.sleep(0.2)

    # Update BigQuery sync status
    if not args.dry_run and not args.skip_bq_update and results["promoted"]:
        print(f"\nUpdating BigQuery sync status for {len(results['promoted'])} companies...")
        company_ids = [r["company_id"] for r in results["promoted"] if r.get("company_id")]
        if company_ids:
            update_bigquery_sync_status(bq_client, company_ids)
            print("✓ BigQuery updated")

    # Update state
    if not args.dry_run:
        state["last_sync_iso"] = utc_now_iso()
        state["total_promoted"] += len(results["promoted"])
        state["total_errors"] += len(results["errors"])
        state["last_batch_count"] = len(results["promoted"])
        save_state(args.state_file, state)

    # Summary
    print("\nSummary")
    print("-------")
    print(f"Promoted: {len(results['promoted'])}")
    print(f"Errors:   {len(results['errors'])}")
    
    if results["errors"]:
        print("\nError details:")
        for err in results["errors"][:5]:
            print(f"  - {err.get('company_name', 'Unknown')}: {err.get('error', 'unknown')}")
        if len(results["errors"]) > 5:
            print(f"  ... and {len(results['errors']) - 5} more")

    if args.dry_run:
        print("\n[DRY RUN] No changes were made to Attio or BigQuery")


if __name__ == "__main__":
    main()
