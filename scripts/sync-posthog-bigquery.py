#!/usr/bin/env python3
"""Sync PostHog → BigQuery (staging dataset).

Usage:
  sync-posthog-bigquery.py                       # Incremental (events) + full replace (others)
  sync-posthog-bigquery.py --full                # Ignore state; sync all events
  sync-posthog-bigquery.py --objects events,persons
  sync-posthog-bigquery.py --dry-run

Objects:
  - events                Incremental via HogQL query API (paged by timestamp/uuid cursor)
  - persons               Full replace (persons change frequently)
  - event_definitions     Full replace
  - property_definitions  Full replace

State:
  - Stored in ~/clawd/config/posthog-sync-state.json
  - Tracks last_event_timestamp and last_event_uuid

Notes:
  - Nested dict/list fields are stored as JSON strings for BigQuery compatibility.
  - Uses requests directly (no PostHog SDK).
"""

import argparse
import json
import os
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


# Config
POSTHOG_HOST = "https://eu.posthog.com"
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/home/ubuntu/.openclaw/gcp-service-account.json"
BQ_PROJECT = "slideheroes-data-platform"
BQ_DATASET = "staging"

DEFAULT_STATE_FILE = os.path.expanduser("~/clawd/config/posthog-sync-state.json")

SUPPORTED_OBJECTS = [
    "events",
    "persons",
    "event_definitions",
    "property_definitions",
]

TABLES = {
    "events": f"{BQ_PROJECT}.{BQ_DATASET}.posthog_events",
    "persons": f"{BQ_PROJECT}.{BQ_DATASET}.posthog_persons",
    "event_definitions": f"{BQ_PROJECT}.{BQ_DATASET}.posthog_event_definitions",
    "property_definitions": f"{BQ_PROJECT}.{BQ_DATASET}.posthog_property_definitions",
}


def read_env() -> dict:
    env: dict = {}
    with open("/home/ubuntu/.openclaw/.secrets.env") as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def json_dumps_safe(v: Any) -> str:
    return json.dumps(v, default=str, ensure_ascii=False, sort_keys=True)


import re

_BQ_NAME_RE = re.compile(r'[^a-zA-Z0-9_]')

def _sanitize_bq_name(name: str) -> str:
    """Replace invalid BigQuery column chars (like $) with underscore, strip leading underscores."""
    s = _BQ_NAME_RE.sub('_', name)
    return s.lstrip('_') or 'col'

def flatten_for_bq(record: Dict[str, Any]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for k, v in record.items():
        k = _sanitize_bq_name(k)
        if isinstance(v, (dict, list)):
            out[k] = json_dumps_safe(v)
        elif isinstance(v, (str, int, float, bool)) or v is None:
            out[k] = v
        else:
            if hasattr(v, "isoformat"):
                out[k] = v.isoformat()
            else:
                out[k] = str(v)
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
        # best-effort timestamp detection
        if "T" in value and (value.endswith("Z") or "+" in value):
            # don't be too clever; keep as STRING unless it's clearly ISO
            pass
        return "STRING"
    return "STRING"


def merge_types(a: str, b: str) -> str:
    if a == b:
        return a
    numeric = {"INTEGER", "FLOAT64"}
    if a in numeric and b in numeric:
        return "FLOAT64"
    return "STRING"


def autodetect_schema(sample_rows: List[Dict[str, Any]], *, force_timestamp_cols: Optional[set] = None) -> List[bigquery.SchemaField]:
    col_types: Dict[str, str] = {}
    for row in sample_rows:
        for k, v in row.items():
            t = infer_bq_type(v)
            col_types[k] = merge_types(col_types.get(k, t), t)

    if force_timestamp_cols:
        for c in force_timestamp_cols:
            if c in col_types:
                col_types[c] = "TIMESTAMP"

    fields = [bigquery.SchemaField(name, typ, mode="NULLABLE") for name, typ in sorted(col_types.items())]
    return fields


def ensure_bq_table(bq_client: bigquery.Client, table_ref: str, schema: List[bigquery.SchemaField]):
    table = bigquery.Table(table_ref, schema=schema)
    try:
        existing = bq_client.get_table(table_ref)
        # Merge schemas: add any new columns from the detected schema
        existing_names = {f.name for f in existing.schema}
        new_fields = [f for f in schema if f.name not in existing_names]
        if new_fields:
            merged = list(existing.schema) + new_fields
            existing.schema = merged
            bq_client.update_table(existing, ["schema"])
            print(f"  📐 Schema updated: added {[f.name for f in new_fields]} to {table_ref}")
    except Exception:
        # Table doesn't exist yet — create it
        bq_client.create_table(table, exists_ok=True)


def load_state(state_file: str) -> dict:
    path = Path(os.path.expanduser(state_file))
    if not path.exists():
        return {
            "events": {"last_event_timestamp": None, "last_event_uuid": None, "last_sync_iso": None},
        }
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            raise ValueError("state not a dict")
        data.setdefault("events", {})
        data["events"].setdefault("last_event_timestamp", None)
        data["events"].setdefault("last_event_uuid", None)
        data["events"].setdefault("last_sync_iso", None)
        return data
    except Exception:
        return {
            "events": {"last_event_timestamp": None, "last_event_uuid": None, "last_sync_iso": None},
        }


def save_state(state_file: str, state: dict):
    path = Path(os.path.expanduser(state_file))
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
        f.write("\n")
    tmp.replace(path)


def parse_iso_dt(v: Optional[str]) -> datetime:
    if not v:
        return datetime(1970, 1, 1, tzinfo=timezone.utc)
    try:
        # handle Z
        if v.endswith("Z"):
            v = v[:-1] + "+00:00"
        dt = datetime.fromisoformat(v)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        return datetime(1970, 1, 1, tzinfo=timezone.utc)


def isoformat_z(dt: datetime) -> str:
    dt = dt.astimezone(timezone.utc)
    # PostHog timestamps are typically ISO with Z
    return dt.isoformat().replace("+00:00", "Z")


def request_with_backoff(
    session: requests.Session,
    method: str,
    url: str,
    *,
    headers: Dict[str, str],
    params: Optional[dict] = None,
    json_body: Optional[dict] = None,
    timeout_s: int = 60,
    max_retries: int = 8,
) -> requests.Response:
    delay = 1.0
    for attempt in range(max_retries):
        resp = session.request(method, url, headers=headers, params=params, json=json_body, timeout=timeout_s)
        if resp.status_code < 400:
            return resp

        retryable = resp.status_code in (429, 500, 502, 503, 504)
        if not retryable or attempt == max_retries - 1:
            # include body snippet for debugging
            body = resp.text
            if len(body) > 500:
                body = body[:500] + "…"
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


def iter_posthog_list_endpoint(
    session: requests.Session,
    *,
    url: str,
    headers: Dict[str, str],
    params: Optional[dict] = None,
) -> Iterable[dict]:
    """Yield objects from a standard PostHog list endpoint.

    PostHog list endpoints typically return: {"count": N, "next": URL|null, "previous":..., "results": [...]}.
    """
    next_url = url
    next_params = dict(params or {})

    while next_url:
        resp = request_with_backoff(session, "GET", next_url, headers=headers, params=next_params)
        data = resp.json()
        results = data.get("results", []) if isinstance(data, dict) else []
        for item in results:
            yield item

        next_url = data.get("next") if isinstance(data, dict) else None
        # When following `next`, it already includes query params.
        next_params = None


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


def truncate_table(bq_client: bigquery.Client, table_ref: str):
    bq_client.query(f"DELETE FROM `{table_ref}` WHERE TRUE").result()


def sync_persons(
    session: requests.Session,
    bq_client: bigquery.Client,
    *,
    project_id: str,
    headers: Dict[str, str],
    dry_run: bool,
) -> int:
    url = f"{POSTHOG_HOST}/api/projects/{project_id}/persons"

    rows: List[Dict[str, Any]] = []
    # Pull everything into memory (OK for moderate size); load in chunks to BQ.
    for item in iter_posthog_list_endpoint(session, url=url, headers=headers, params={"limit": 100}):
        # Flatten nested properties
        if isinstance(item, dict):
            item = dict(item)
            if "properties" in item and isinstance(item["properties"], (dict, list)):
                item["properties"] = json_dumps_safe(item["properties"])
            rows.append(flatten_for_bq(item))

    total = len(rows)
    if dry_run:
        print(f"  persons: would full-replace {total} rows → {TABLES['persons']}")
        return total

    # Schema from sample
    schema = autodetect_schema(rows[:50], force_timestamp_cols={"created_at", "last_seen_at"})
    ensure_bq_table(bq_client, TABLES["persons"], schema)
    truncate_table(bq_client, TABLES["persons"])

    # Load in chunks
    chunk = 5000
    for i in range(0, len(rows), chunk):
        bq_load_json_rows(
            bq_client,
            table_ref=TABLES["persons"],
            rows=rows[i : i + chunk],
            schema=schema,
            write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
        )

    print(f"  ✅ persons: {total} rows")
    return total


def sync_definitions(
    session: requests.Session,
    bq_client: bigquery.Client,
    *,
    project_id: str,
    headers: Dict[str, str],
    object_name: str,
    endpoint: str,
    dry_run: bool,
) -> int:
    url = f"{POSTHOG_HOST}/api/projects/{project_id}/{endpoint}"

    rows: List[Dict[str, Any]] = []
    for item in iter_posthog_list_endpoint(session, url=url, headers=headers, params={"limit": 500}):
        if isinstance(item, dict):
            rows.append(flatten_for_bq(item))

    total = len(rows)
    table_ref = TABLES[object_name]

    if dry_run:
        print(f"  {object_name}: would full-replace {total} rows → {table_ref}")
        return total

    schema = autodetect_schema(rows[:50])
    ensure_bq_table(bq_client, table_ref, schema)
    truncate_table(bq_client, table_ref)

    if rows:
        bq_load_json_rows(
            bq_client,
            table_ref=table_ref,
            rows=rows,
            schema=schema,
            write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
        )

    print(f"  ✅ {object_name}: {total} rows")
    return total


def hogql_query_events_page(
    session: requests.Session,
    *,
    project_id: str,
    headers: Dict[str, str],
    where_clause: str,
    limit: int,
) -> Tuple[List[str], List[List[Any]]]:
    url = f"{POSTHOG_HOST}/api/projects/{project_id}/query"
    q = f"SELECT * FROM events WHERE {where_clause} ORDER BY timestamp ASC, uuid ASC LIMIT {int(limit)}"
    body = {"query": {"kind": "HogQLQuery", "query": q}}

    resp = request_with_backoff(session, "POST", url, headers=headers, json_body=body, timeout_s=120)
    data = resp.json()
    columns = data.get("columns") or []
    results = data.get("results") or []

    if not isinstance(columns, list) or not isinstance(results, list):
        raise RuntimeError(f"Unexpected HogQL response shape: keys={list(data.keys())}")

    return [str(c) for c in columns], results


def rows_from_hogql(columns: List[str], results: List[list]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for row in results:
        if isinstance(row, dict):
            d = row
        else:
            d = {columns[i]: (row[i] if i < len(row) else None) for i in range(len(columns))}
        # Explicitly JSON-stringify nested properties fields if present
        for k in ("properties", "person_properties", "elements"):
            if k in d and isinstance(d[k], (dict, list)):
                d[k] = json_dumps_safe(d[k])
        out.append(flatten_for_bq(d))
    return out


def sync_events(
    session: requests.Session,
    bq_client: bigquery.Client,
    *,
    project_id: str,
    headers: Dict[str, str],
    state: dict,
    full: bool,
    dry_run: bool,
) -> Tuple[int, dict]:
    limit = 1000

    last_ts = state.get("events", {}).get("last_event_timestamp")
    last_uuid = state.get("events", {}).get("last_event_uuid")

    if full:
        cursor_ts = None
        cursor_uuid = ""
    else:
        cursor_ts = last_ts  # None on first run
        cursor_uuid = last_uuid or ""

    total = 0
    schema: Optional[List[bigquery.SchemaField]] = None
    table_ref = TABLES["events"]

    while True:
        # (timestamp, uuid) cursor to avoid duplicates/misses when many events share the same timestamp
        if cursor_ts is None:
            # First sync — no filter, get everything
            where_clause = "1 = 1"
        elif cursor_uuid:
            # Strip trailing Z and microseconds for ClickHouse compatibility
            ts_clean = cursor_ts.replace("Z", "").replace("+00:00", "")
            # Truncate to seconds (ClickHouse DateTime comparison)
            if "." in ts_clean:
                ts_clean = ts_clean.split(".")[0]
            where_clause = (
                f"(timestamp > parseDateTimeBestEffort('{ts_clean}')) OR (timestamp = parseDateTimeBestEffort('{ts_clean}') AND uuid > '{cursor_uuid}')"
            )
        else:
            ts_clean = cursor_ts.replace("Z", "").replace("+00:00", "")
            if "." in ts_clean:
                ts_clean = ts_clean.split(".")[0]
            where_clause = f"timestamp > parseDateTimeBestEffort('{ts_clean}')"

        columns, results = hogql_query_events_page(
            session,
            project_id=project_id,
            headers=headers,
            where_clause=where_clause,
            limit=limit,
        )

        if not results:
            break

        rows = rows_from_hogql(columns, results)
        total += len(rows)

        # Determine next cursor from the last row (ordered ASC)
        last_row = rows[-1]
        next_ts = last_row.get("timestamp")
        next_uuid = last_row.get("uuid")

        if isinstance(next_ts, str) and next_ts.endswith("+00:00"):
            next_ts = next_ts.replace("+00:00", "Z")

        if not isinstance(next_ts, str) or not isinstance(next_uuid, str):
            # Best-effort fallback: try to find max
            ts_candidates = [r.get("timestamp") for r in rows if isinstance(r.get("timestamp"), str)]
            uuid_candidates = [r.get("uuid") for r in rows if isinstance(r.get("uuid"), str)]
            next_ts = ts_candidates[-1] if ts_candidates else cursor_ts
            next_uuid = uuid_candidates[-1] if uuid_candidates else cursor_uuid

        cursor_ts = next_ts
        cursor_uuid = next_uuid

        if dry_run:
            # In dry-run we still page to report row count.
            if len(rows) < limit:
                break
            continue

        # Create table & schema on first batch
        if schema is None:
            schema = autodetect_schema(rows[:50], force_timestamp_cols={"timestamp"})
            ensure_bq_table(bq_client, table_ref, schema)

        assert schema is not None
        bq_load_json_rows(
            bq_client,
            table_ref=table_ref,
            rows=rows,
            schema=schema,
            write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
        )

        if len(rows) < limit:
            break

    # Update state
    new_state = dict(state)
    new_state.setdefault("events", {})
    new_state["events"]["last_event_timestamp"] = cursor_ts
    new_state["events"]["last_event_uuid"] = cursor_uuid
    new_state["events"]["last_sync_iso"] = utc_now_iso()

    if dry_run:
        print(f"  events: would append {total} rows → {table_ref} (start_cursor={last_ts or 'epoch'})")
    else:
        print(f"  ✅ events: {total} rows")

    return total, new_state


def main():
    parser = argparse.ArgumentParser(description="Sync PostHog → BigQuery (staging)")
    parser.add_argument("--full", action="store_true", help="Ignore state and sync all events")
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
    api_key = (env.get("POSTHOG_API_KEY", "").strip() or os.environ.get("POSTHOG_API_KEY", "").strip())
    project_id = (env.get("POSTHOG_PROJECT_ID", "").strip() or os.environ.get("POSTHOG_PROJECT_ID", "").strip())

    if not api_key or not project_id:
        if args.dry_run:
            print("WARNING: POSTHOG_API_KEY and/or POSTHOG_PROJECT_ID missing (dry-run)")
        else:
            print("ERROR: POSTHOG_API_KEY and POSTHOG_PROJECT_ID are required (.env or environment)")
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
    }

    print(
        f"{'DRY RUN: ' if args.dry_run else ''}Syncing PostHog → BigQuery {BQ_PROJECT}.{BQ_DATASET} "
        f"({'FULL EVENTS' if args.full else 'INCREMENTAL EVENTS'})"
    )
    print(f"Host:       {POSTHOG_HOST}")
    print(f"Project ID:  {project_id}")
    print(f"State file:  {os.path.expanduser(args.state_file)}")
    print(f"Objects:     {', '.join(objects)}")
    print(f"Started:     {utc_now_iso()}\n")

    totals = {"rows": 0, "errors": []}

    with requests.Session() as session:
        for obj in objects:
            try:
                if obj == "events":
                    rows, new_state = sync_events(
                        session,
                        bq_client,
                        project_id=project_id,
                        headers=headers,
                        state=state,
                        full=args.full,
                        dry_run=args.dry_run,
                    )
                    totals["rows"] += int(rows)
                    if not args.dry_run:
                        state = new_state

                elif obj == "persons":
                    rows = sync_persons(
                        session,
                        bq_client,
                        project_id=project_id,
                        headers=headers,
                        dry_run=args.dry_run,
                    )
                    totals["rows"] += int(rows)

                elif obj == "event_definitions":
                    rows = sync_definitions(
                        session,
                        bq_client,
                        project_id=project_id,
                        headers=headers,
                        object_name="event_definitions",
                        endpoint="event_definitions",
                        dry_run=args.dry_run,
                    )
                    totals["rows"] += int(rows)

                elif obj == "property_definitions":
                    rows = sync_definitions(
                        session,
                        bq_client,
                        project_id=project_id,
                        headers=headers,
                        object_name="property_definitions",
                        endpoint="property_definitions",
                        dry_run=args.dry_run,
                    )
                    totals["rows"] += int(rows)

            except Exception as e:
                print(f"  ❌ {obj}: {e}")
                totals["errors"].append((obj, str(e)))

    if (not args.dry_run) and (not totals["errors"]):
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
