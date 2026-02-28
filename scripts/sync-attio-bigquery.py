#!/usr/bin/env python3
"""Sync Attio objects → BigQuery (staging dataset).

Usage:
  sync-attio-bigquery.py                      # Full replace (default)
  sync-attio-bigquery.py --full               # Full replace (same as default)
  sync-attio-bigquery.py --objects companies,people
  sync-attio-bigquery.py --dry-run

Attio API:
  - Host: https://api.attio.com/v2
  - Auth: Authorization: Bearer $ATTIO_API_KEY
  - List records: POST /objects/{object_slug}/records/query
      Body: {"limit": 500, "offset": 0}
      Pagination: offset-based; stop when response.data is empty

BigQuery:
  - Project: slideheroes-data-platform
  - Dataset: staging
  - Tables: attio_companies, attio_people, attio_deals

State:
  - ~/clawd/config/attio-sync-state.json
  - Stores a single last_sync_iso timestamp (best-effort)

Notes:
  - Attio records have a complex `values` dict: attribute → list[value_object].
    We flatten values by taking the first value object and extracting a scalar
    field when possible; otherwise we JSON-stringify.
  - Column names are sanitized for BigQuery.
  - This sync is always full replace (truncate + reload).
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import requests

try:
    from google.cloud import bigquery
except Exception as e:  # pragma: no cover
    print(f"ERROR: google-cloud-bigquery package not available: {e}")
    print("Install with: pip install google-cloud-bigquery --break-system-packages")
    sys.exit(1)


ATTIO_HOST = "https://api.attio.com/v2"

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/home/ubuntu/.openclaw/gcp-service-account.json"
BQ_PROJECT = "slideheroes-data-platform"
BQ_DATASET = "staging"

DEFAULT_STATE_FILE = os.path.expanduser("~/clawd/config/attio-sync-state.json")

SUPPORTED_OBJECTS = [
    "companies",
    "people",
    "deals",
]

TABLES = {
    "companies": f"{BQ_PROJECT}.{BQ_DATASET}.attio_companies",
    "people": f"{BQ_PROJECT}.{BQ_DATASET}.attio_people",
    "deals": f"{BQ_PROJECT}.{BQ_DATASET}.attio_deals",
}


def read_env() -> dict:
    env: dict = {}
    try:
        with open("/home/ubuntu/.openclaw/.secrets.env") as f:
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


def iter_attio_object_records(
    session: requests.Session,
    *,
    object_slug: str,
    headers: Dict[str, str],
    limit: int = 500,
) -> Iterable[List[dict]]:
    """Yield pages (lists of records) from POST /objects/{slug}/records/query."""

    offset = 0
    while True:
        url = f"{ATTIO_HOST}/objects/{object_slug}/records/query"
        body = {"limit": int(limit), "offset": int(offset)}
        resp = request_with_backoff(session, "POST", url, headers=headers, json_body=body)
        payload = resp.json()

        data = []
        if isinstance(payload, dict) and isinstance(payload.get("data"), list):
            data = [d for d in payload.get("data") if isinstance(d, dict)]

        if not data:
            break

        yield data
        offset += len(data)


def _pick_scalar_from_value_obj(v0: Any) -> Any:
    """Best-effort extraction of a scalar from a single Attio value object."""

    if v0 is None:
        return None

    # Sometimes values might already be scalar-like.
    if isinstance(v0, (str, int, float, bool)):
        return v0

    if not isinstance(v0, dict):
        return json_dumps_safe(v0)

    # Prefer common scalar fields.
    preferred_keys = [
        "email_address",
        "phone_number",
        "domain",
        "url",
        "text",
        "value",
        "name",
        "label",
        "id",
        "number",
        "amount",
        "currency",
        "date",
        "timestamp",
        "first_name",
        "last_name",
    ]

    for k in preferred_keys:
        if k in v0 and isinstance(v0.get(k), (str, int, float, bool)):
            return v0.get(k)

    # If dict is all scalar, store JSON for stability (prevents unexpected schema explosions).
    if all(isinstance(v, (str, int, float, bool)) or v is None for v in v0.values()):
        return json_dumps_safe(v0)

    return json_dumps_safe(v0)


def flatten_attio_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """Flatten an Attio record into a BigQuery-friendly row."""

    out: Dict[str, Any] = {}

    # Top-level fields
    rec_id = record.get("id")
    if isinstance(rec_id, str):
        out["id"] = rec_id
    else:
        out["id"] = str(rec_id) if rec_id is not None else None

    created_at = record.get("created_at")
    if isinstance(created_at, str):
        out["created_at"] = created_at
    elif created_at is not None:
        out["created_at"] = str(created_at)
    else:
        out["created_at"] = None

    # Preserve raw values for debugging.
    values = record.get("values")
    if isinstance(values, dict):
        out["values_json"] = json_dumps_safe(values)

        for attr_key, arr in values.items():
            # Each attribute maps to an array of value objects.
            safe_attr = _sanitize_bq_name(str(attr_key))
            if not safe_attr:
                safe_attr = "col"

            v0 = None
            if isinstance(arr, list) and arr:
                v0 = arr[0]
            else:
                v0 = None

            extracted = _pick_scalar_from_value_obj(v0)
            # If collision occurs, keep deterministic suffix.
            col = safe_attr
            if col in out:
                col = f"{safe_attr}__1"
                i = 1
                while col in out:
                    i += 1
                    col = f"{safe_attr}__{i}"

            out[col] = extracted
    else:
        out["values_json"] = json_dumps_safe(values) if values is not None else None

    # Store any other top-level fields we might care about (best-effort)
    for k, v in record.items():
        if k in ("id", "created_at", "values"):
            continue
        kk = _sanitize_bq_name(str(k))
        if kk in out:
            kk = f"{kk}__meta"
        if isinstance(v, (dict, list)):
            out[kk] = json_dumps_safe(v)
        elif isinstance(v, (str, int, float, bool)) or v is None:
            out[kk] = v
        else:
            out[kk] = str(v)

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


def sync_object_full_replace(
    session: requests.Session,
    bq_client: bigquery.Client,
    *,
    object_slug: str,
    headers: Dict[str, str],
    dry_run: bool,
) -> int:
    table_ref = TABLES[object_slug]

    schema: Optional[List[bigquery.SchemaField]] = None
    truncated = False
    total = 0

    for page_idx, records in enumerate(
        iter_attio_object_records(session, object_slug=object_slug, headers=headers, limit=500)
    ):
        rows = [flatten_attio_record(r) for r in records]
        if not rows:
            continue

        total += len(rows)

        if dry_run:
            continue

        if schema is None:
            schema = autodetect_schema(
                rows[:50],
                ensure_cols={"id": "STRING", "created_at": "TIMESTAMP", "values_json": "STRING"},
                force_timestamp_cols={"created_at"},
            )
            ensure_bq_table(bq_client, table_ref, schema)

        if not truncated:
            truncate_table(bq_client, table_ref)
            truncated = True

        assert schema is not None
        # Append pages.
        bq_load_json_rows(
            bq_client,
            table_ref=table_ref,
            rows=rows,
            schema=schema,
            write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
        )

    if dry_run:
        print(f"  {object_slug}: would full-replace {total} rows → {table_ref}")
        return total

    # Ensure table exists even when there are 0 rows (create with minimal schema).
    if schema is None:
        schema = autodetect_schema(
            [],
            ensure_cols={"id": "STRING", "created_at": "TIMESTAMP", "values_json": "STRING"},
            force_timestamp_cols={"created_at"},
        )
        ensure_bq_table(bq_client, table_ref, schema)
        truncate_table(bq_client, table_ref)

    print(f"  ✅ {object_slug}: {total} rows")
    return total


def main():
    parser = argparse.ArgumentParser(description="Sync Attio → BigQuery (staging)")
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
    api_key = env.get("ATTIO_API_KEY", "").strip() or os.environ.get("ATTIO_API_KEY", "").strip()
    if not api_key:
        if args.dry_run:
            print("WARNING: ATTIO_API_KEY not found (dry-run)")
        else:
            print("ERROR: ATTIO_API_KEY not found in .env or environment")
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
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    print(
        f"{'DRY RUN: ' if args.dry_run else ''}Syncing Attio → BigQuery {BQ_PROJECT}.{BQ_DATASET} (FULL REPLACE)"
    )
    print(f"Host:       {ATTIO_HOST}")
    print(f"State file:  {os.path.expanduser(args.state_file)}")
    print(f"Objects:     {', '.join(objects)}")
    print(f"Started:     {utc_now_iso()}\n")

    totals = {"rows": 0, "errors": []}

    with requests.Session() as session:
        for obj in objects:
            try:
                rows = sync_object_full_replace(
                    session,
                    bq_client,
                    object_slug=obj,
                    headers=headers,
                    dry_run=args.dry_run,
                )
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
