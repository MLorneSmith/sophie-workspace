#!/usr/bin/env python3
"""Sync Loops (API v1) → BigQuery (staging dataset).

Usage:
  sync-loops-bigquery.py                                  # Full replace (default)
  sync-loops-bigquery.py --full                           # Full replace (same as default)
  sync-loops-bigquery.py --objects contact_properties,mailing_lists,transactional_emails
  sync-loops-bigquery.py --dry-run

Loops API:
  - Host: https://app.loops.so/api/v1
  - Auth: Authorization: Bearer $LOOPS_API_KEY

Supported objects (all full replace):
  - contact_properties   GET /contacts/properties
  - mailing_lists        GET /lists
  - transactional_emails GET /transactional

Important:
  Loops does NOT provide a bulk “list all contacts” endpoint, so this sync only
  loads small configuration/reference tables.

BigQuery:
  - Project: slideheroes-data-platform
  - Dataset: staging
  - Tables:
      loops_contact_properties
      loops_mailing_lists
      loops_transactional_emails

State:
  - ~/clawd/config/loops-sync-state.json
  - Stores last_sync_iso (best-effort)

Notes:
  - Nested dict/list values are JSON-stringified for BigQuery compatibility.
  - Column names are sanitized for BigQuery.
  - Rate limits / transient errors use exponential backoff.
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
except Exception as e:  # pragma: no cover
    print(f"ERROR: google-cloud-bigquery package not available: {e}")
    print("Install with: pip install google-cloud-bigquery --break-system-packages")
    sys.exit(1)


LOOPS_HOST = "https://app.loops.so/api/v1"

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/home/ubuntu/.clawdbot/gcp-service-account.json"
BQ_PROJECT = "slideheroes-data-platform"
BQ_DATASET = "staging"

DEFAULT_STATE_FILE = os.path.expanduser("~/clawd/config/loops-sync-state.json")

SUPPORTED_OBJECTS = [
    "contact_properties",
    "mailing_lists",
    "transactional_emails",
]

OBJECT_ENDPOINTS = {
    "contact_properties": "/contacts/properties",
    "mailing_lists": "/lists",
    "transactional_emails": "/transactional",
}

TABLES = {
    "contact_properties": f"{BQ_PROJECT}.{BQ_DATASET}.loops_contact_properties",
    "mailing_lists": f"{BQ_PROJECT}.{BQ_DATASET}.loops_mailing_lists",
    "transactional_emails": f"{BQ_PROJECT}.{BQ_DATASET}.loops_transactional_emails",
}


def read_env() -> dict:
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


def json_dumps_safe(v: Any) -> str:
    return json.dumps(v, default=str, ensure_ascii=False, sort_keys=True)


_BQ_NAME_RE = re.compile(r"[^a-zA-Z0-9_]")


def _sanitize_bq_name(name: str) -> str:
    s = _BQ_NAME_RE.sub("_", name)
    return s.lstrip("_") or "col"


def _dedupe_col(existing: set, col: str) -> str:
    if col not in existing:
        existing.add(col)
        return col
    i = 1
    new_col = f"{col}__{i}"
    while new_col in existing:
        i += 1
        new_col = f"{col}__{i}"
    existing.add(new_col)
    return new_col


def flatten_for_bq(record: Dict[str, Any]) -> Dict[str, Any]:
    """Flatten a Loops object into a BigQuery-friendly row."""

    out: Dict[str, Any] = {}
    seen: set = set()

    # Always include raw JSON for debugging/stability and to avoid empty-schema tables.
    out["raw_json"] = json_dumps_safe(record)
    seen.add("raw_json")

    for k, v in record.items():
        kk = _sanitize_bq_name(str(k))
        kk = _dedupe_col(seen, kk)

        if isinstance(v, (dict, list)):
            out[kk] = json_dumps_safe(v)
        elif isinstance(v, (str, int, float, bool)) or v is None:
            out[kk] = v
        else:
            if hasattr(v, "isoformat"):
                out[kk] = v.isoformat()
            else:
                out[kk] = str(v)

    out["synced_at"] = utc_now_iso()
    return out


def infer_bq_type(value: Any) -> str:
    if value is None:
        return "STRING"
    if isinstance(value, bool):
        return "BOOLEAN"
    if isinstance(value, int):
        return "INTEGER"
    if isinstance(value, float):
        return "FLOAT64"
    if isinstance(value, str):
        return "STRING"
    return "STRING"


def merge_types(a: str, b: str) -> str:
    if a == b:
        return a
    numeric = {"INTEGER", "FLOAT64"}
    if a in numeric and b in numeric:
        return "FLOAT64"
    return "STRING"


def autodetect_schema(
    sample_rows: List[Dict[str, Any]],
    *,
    ensure_cols: Optional[Dict[str, str]] = None,
    force_timestamp_cols: Optional[set] = None,
) -> List[bigquery.SchemaField]:
    col_types: Dict[str, str] = {}
    for row in sample_rows:
        for k, v in row.items():
            t = infer_bq_type(v)
            col_types[k] = merge_types(col_types.get(k, t), t)

    if ensure_cols:
        for c, t in ensure_cols.items():
            col_types.setdefault(c, t)

    if force_timestamp_cols:
        for c in force_timestamp_cols:
            if c in col_types:
                col_types[c] = "TIMESTAMP"

    return [bigquery.SchemaField(name, typ, mode="NULLABLE") for name, typ in sorted(col_types.items())]


def ensure_bq_table(bq_client: bigquery.Client, table_ref: str, schema: List[bigquery.SchemaField]):
    table = bigquery.Table(table_ref, schema=schema)
    bq_client.create_table(table, exists_ok=True)


def truncate_table(bq_client: bigquery.Client, table_ref: str):
    bq_client.query(f"DELETE FROM `{table_ref}` WHERE TRUE").result()


def bq_load_json_rows(
    bq_client: bigquery.Client,
    *,
    table_ref: str,
    rows: List[Dict[str, Any]],
    schema: List[bigquery.SchemaField],
    write_disposition: str,
):
    job_config = bigquery.LoadJobConfig(
        schema=schema,
        write_disposition=write_disposition,
        source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
    )
    job = bq_client.load_table_from_json(rows, table_ref, job_config=job_config)
    job.result()


def load_state(state_file: str) -> dict:
    path = Path(os.path.expanduser(state_file))
    if not path.exists():
        return {"last_sync_iso": None}
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            return {"last_sync_iso": None}
        data.setdefault("last_sync_iso", None)
        return data
    except Exception:
        return {"last_sync_iso": None}


def save_state(state_file: str, state: dict):
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
    params: Optional[dict] = None,
    timeout_s: int = 60,
    max_retries: int = 10,
) -> requests.Response:
    """HTTP request with exponential backoff for rate limits/transient errors."""

    delay = 1.0
    for attempt in range(max_retries):
        resp = session.request(method, url, headers=headers, params=params, timeout=timeout_s)
        if resp.status_code < 400:
            return resp

        retryable = resp.status_code in (429, 500, 502, 503, 504)
        if not retryable or attempt == max_retries - 1:
            body = resp.text
            if len(body) > 1200:
                body = body[:1200] + "…"
            raise RuntimeError(f"HTTP {resp.status_code} for {method} {url}: {body}")

        retry_after = resp.headers.get("Retry-After")
        if retry_after:
            try:
                delay = max(delay, float(retry_after))
            except Exception:
                pass

        time.sleep(delay)
        delay = min(delay * 2, 60.0)

    raise RuntimeError("unreachable")


def _extract_list_payload(payload: Any) -> List[dict]:
    """Loops endpoints may return a list or a dict with a list value."""

    if isinstance(payload, list):
        return [d for d in payload if isinstance(d, dict)]

    if isinstance(payload, dict):
        # Common patterns: {"data": [...]}, {"lists": [...]}, etc.
        for key in ("data", "items", "results", "lists", "properties", "templates", "transactional"):
            v = payload.get(key)
            if isinstance(v, list):
                return [d for d in v if isinstance(d, dict)]

        # If dict itself looks like a single object, wrap it.
        if payload:
            return [payload]

    return []


def fetch_object_rows(session: requests.Session, *, obj: str, headers: Dict[str, str]) -> List[Dict[str, Any]]:
    path = OBJECT_ENDPOINTS[obj]
    url = f"{LOOPS_HOST}{path}"

    resp = request_with_backoff(session, "GET", url, headers=headers, params=None)
    payload = resp.json()

    items = _extract_list_payload(payload)
    return [flatten_for_bq(dict(it)) for it in items]


def sync_full_replace(
    session: requests.Session,
    bq_client: bigquery.Client,
    *,
    obj: str,
    headers: Dict[str, str],
    dry_run: bool,
) -> int:
    table_ref = TABLES[obj]

    rows = fetch_object_rows(session, obj=obj, headers=headers)
    total = len(rows)

    if dry_run:
        print(f"  {obj}: would full-replace {total} rows → {table_ref}")
        return total

    schema = autodetect_schema(
        rows[:50],
        ensure_cols={"raw_json": "STRING", "synced_at": "TIMESTAMP"},
        force_timestamp_cols={"synced_at"},
    )

    ensure_bq_table(bq_client, table_ref, schema)
    truncate_table(bq_client, table_ref)

    if rows:
        chunk = 5000
        for i in range(0, len(rows), chunk):
            bq_load_json_rows(
                bq_client,
                table_ref=table_ref,
                rows=rows[i : i + chunk],
                schema=schema,
                write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
            )

    print(f"  ✅ {obj}: {total} rows")
    return total


def main():
    parser = argparse.ArgumentParser(description="Sync Loops → BigQuery (staging)")
    parser.add_argument("--full", action="store_true", help="Full replace (default; kept for parity)")
    parser.add_argument(
        "--objects",
        type=str,
        help=f"Comma-separated objects to sync (default: all: {','.join(SUPPORTED_OBJECTS)})",
    )
    parser.add_argument("--dry-run", action="store_true", help="Fetch and report; do not write to BigQuery/state")
    parser.add_argument(
        "--state-file",
        type=str,
        default=DEFAULT_STATE_FILE,
        help=f"Path to state file (default: {DEFAULT_STATE_FILE})",
    )
    args = parser.parse_args()

    env = read_env()
    api_key = env.get("LOOPS_API_KEY", "").strip() or os.environ.get("LOOPS_API_KEY", "").strip()
    if not api_key:
        if args.dry_run:
            print("WARNING: LOOPS_API_KEY not found (dry-run)")
        else:
            print("ERROR: LOOPS_API_KEY not found in .env or environment")
            sys.exit(1)

    # Object selection
    if args.objects:
        objects = [o.strip() for o in args.objects.split(",") if o.strip()]
    else:
        objects = list(SUPPORTED_OBJECTS)

    unknown = [o for o in objects if o not in SUPPORTED_OBJECTS]
    if unknown:
        print(f"ERROR: unknown objects: {unknown}")
        sys.exit(2)

    state = load_state(args.state_file)

    bq_client = bigquery.Client(project=BQ_PROJECT)

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }

    print(
        f"{'DRY RUN: ' if args.dry_run else ''}Syncing Loops → BigQuery {BQ_PROJECT}.{BQ_DATASET} (FULL REPLACE)"
    )
    print(f"Host:       {LOOPS_HOST}")
    print(f"State file:  {os.path.expanduser(args.state_file)}")
    print(f"Objects:     {', '.join(objects)}")
    print(f"Started:     {utc_now_iso()}\n")

    totals = {"rows": 0, "errors": []}

    with requests.Session() as session:
        for obj in objects:
            try:
                rows = sync_full_replace(session, bq_client, obj=obj, headers=headers, dry_run=args.dry_run)
                totals["rows"] += int(rows)
            except Exception as e:
                print(f"  ❌ {obj}: {e}")
                totals["errors"].append((obj, str(e)))

    if (not args.dry_run) and (not totals["errors"]):
        state["last_sync_iso"] = utc_now_iso()
        save_state(args.state_file, state)

    print("\nSummary")
    print("-------")
    print(f"Rows synced: {totals['rows']}")
    if totals["errors"]:
        print(f"Errors:     {len(totals['errors'])}")
        for obj, err in totals["errors"]:
            print(f"  - {obj}: {err}")
        sys.exit(2)


if __name__ == "__main__":
    main()
