#!/usr/bin/env python3
"""Sync Cal.com (API v2)  BigQuery (staging dataset).

Usage:
  sync-calcom-bigquery.py                          # Incremental bookings + full replace event_types
  sync-calcom-bigquery.py --full                   # Ignore state; sync all bookings
  sync-calcom-bigquery.py --objects bookings,event_types
  sync-calcom-bigquery.py --dry-run

Objects:
  - bookings     Incremental via GET /v2/bookings?afterStart=ISO_DATE (paged)
  - event_types  Full replace via GET /v2/event-types (paged)

State:
  - Stored in ~/clawd/config/calcom-sync-state.json
  - Tracks bookings.last_after_start (ISO timestamp used for next incremental fetch)

Notes:
  - Cal.com API responses may be shaped like {"status":"success","data":[...],"pagination":{...}}
    so we always read from the `data` key.
  - Nested dict/list fields are stored as JSON strings for BigQuery compatibility.
  - Column names are sanitized for BigQuery.
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
CALCOM_HOST = "https://api.cal.com/v2"
CAL_API_VERSION = "2024-06-14"

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/home/ubuntu/.clawdbot/gcp-service-account.json"
BQ_PROJECT = "slideheroes-data-platform"
BQ_DATASET = "staging"

DEFAULT_STATE_FILE = os.path.expanduser("~/clawd/config/calcom-sync-state.json")

SUPPORTED_OBJECTS = [
    "bookings",
    "event_types",
]

TABLES = {
    "bookings": f"{BQ_PROJECT}.{BQ_DATASET}.calcom_bookings",
    "event_types": f"{BQ_PROJECT}.{BQ_DATASET}.calcom_event_types",
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


import re

_BQ_NAME_RE = re.compile(r"[^a-zA-Z0-9_]")


def _sanitize_bq_name(name: str) -> str:
    s = _BQ_NAME_RE.sub("_", name)
    return s.lstrip("_") or "col"


def flatten_for_bq(record: Dict[str, Any]) -> Dict[str, Any]:
    out: Dict[str, Any] = {}
    for k, v in record.items():
        k = _sanitize_bq_name(str(k))
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
    force_timestamp_cols: Optional[set] = None,
    ensure_cols: Optional[Dict[str, str]] = None,
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

    fields = [bigquery.SchemaField(name, typ, mode="NULLABLE") for name, typ in sorted(col_types.items())]
    return fields


def ensure_bq_table(bq_client: bigquery.Client, table_ref: str, schema: List[bigquery.SchemaField]):
    table = bigquery.Table(table_ref, schema=schema)
    bq_client.create_table(table, exists_ok=True)


def truncate_table(bq_client: bigquery.Client, table_ref: str):
    bq_client.query(f"DELETE FROM `{table_ref}` WHERE TRUE").result()


def load_state(state_file: str) -> dict:
    path = Path(os.path.expanduser(state_file))
    if not path.exists():
        return {
            "bookings": {"last_after_start": None, "last_sync_iso": None},
        }
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            raise ValueError("state not a dict")
        data.setdefault("bookings", {})
        data["bookings"].setdefault("last_after_start", None)
        data["bookings"].setdefault("last_sync_iso", None)
        return data
    except Exception:
        return {
            "bookings": {"last_after_start": None, "last_sync_iso": None},
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
    return dt.isoformat().replace("+00:00", "Z")


def request_with_backoff(
    session: requests.Session,
    method: str,
    url: str,
    *,
    headers: Dict[str, str],
    params: Optional[dict] = None,
    timeout_s: int = 60,
    max_retries: int = 8,
) -> requests.Response:
    delay = 1.0
    for attempt in range(max_retries):
        resp = session.request(method, url, headers=headers, params=params, timeout=timeout_s)
        if resp.status_code < 400:
            return resp

        retryable = resp.status_code in (429, 500, 502, 503, 504)
        if not retryable or attempt == max_retries - 1:
            body = resp.text
            if len(body) > 800:
                body = body[:800] + "…"
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


def _extract_data(resp_json: Any) -> List[dict]:
    if isinstance(resp_json, dict) and "data" in resp_json:
        data = resp_json.get("data")
        if isinstance(data, list):
            return [d for d in data if isinstance(d, dict)]
        return []
    if isinstance(resp_json, list):
        return [d for d in resp_json if isinstance(d, dict)]
    return []


def iter_calcom_pages(
    session: requests.Session,
    *,
    path: str,
    headers: Dict[str, str],
    params: Optional[dict] = None,
) -> Iterable[List[dict]]:
    """Yield pages of objects from a Cal.com v2 list endpoint.

    Supports both:
      - page-based pagination via response.pagination.hasNextPage
      - cursor-based pagination if response includes pagination.nextCursor or nextCursor
    """

    base_url = f"{CALCOM_HOST}{path}"
    next_params = dict(params or {})

    page = int(next_params.get("page") or 1)
    cursor: Optional[str] = next_params.get("cursor")

    while True:
        next_params["page"] = page
        if cursor:
            next_params["cursor"] = cursor

        resp = request_with_backoff(session, "GET", base_url, headers=headers, params=next_params)
        payload = resp.json()

        items = _extract_data(payload)
        yield items

        if not isinstance(payload, dict):
            if not items:
                break
            page += 1
            continue

        pagination = payload.get("pagination")
        next_cursor = None
        has_next = False

        if isinstance(pagination, dict):
            has_next = bool(pagination.get("hasNextPage"))
            next_cursor = pagination.get("nextCursor") or pagination.get("cursor")

            # Some APIs provide currentPage/totalPages
            cur = pagination.get("currentPage")
            tot = pagination.get("totalPages")
            if isinstance(cur, int) and isinstance(tot, int) and cur < tot:
                has_next = True

        # Fallback keys
        if next_cursor is None and isinstance(payload.get("nextCursor"), str):
            next_cursor = payload.get("nextCursor")

        if next_cursor:
            cursor = str(next_cursor)
            # keep page stable when using cursor; some APIs ignore page when cursor is set
            continue

        if has_next:
            page += 1
            continue

        # If no pagination info, stop when items empty.
        if not items:
            break
        # Otherwise assume we reached the end.
        break


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


def merge_tmp_into_dest(
    bq_client: bigquery.Client,
    *,
    dest_ref: str,
    tmp_ref: str,
    schema_fields: List[bigquery.SchemaField],
    pk_cols: List[str],
):
    cols = [f.name for f in schema_fields]

    on_clause = " AND ".join([f"T.`{c}` = S.`{c}`" for c in pk_cols])
    update_cols = [c for c in cols if c not in pk_cols]
    update_set = ", ".join([f"`{c}` = S.`{c}`" for c in update_cols])
    insert_cols = ", ".join([f"`{c}`" for c in cols])
    insert_vals = ", ".join([f"S.`{c}`" for c in cols])

    when_matched = (
        f"WHEN MATCHED THEN UPDATE SET {update_set}"
        if update_set
        else f"WHEN MATCHED THEN UPDATE SET `{pk_cols[0]}` = S.`{pk_cols[0]}`"
    )

    merge_sql = f"""
    MERGE `{dest_ref}` T
    USING `{tmp_ref}` S
    ON {on_clause}
    {when_matched}
    WHEN NOT MATCHED THEN
      INSERT ({insert_cols}) VALUES ({insert_vals})
    """
    bq_client.query(merge_sql).result()


def sync_event_types(
    session: requests.Session,
    bq_client: bigquery.Client,
    *,
    headers: Dict[str, str],
    dry_run: bool,
) -> int:
    rows: List[Dict[str, Any]] = []

    for items in iter_calcom_pages(session, path="/event-types", headers=headers, params={}):
        for item in items:
            rows.append(flatten_for_bq(dict(item)))

    total = len(rows)
    table_ref = TABLES["event_types"]

    if dry_run:
        print(f"  event_types: would full-replace {total} rows → {table_ref}")
        return total

    schema = autodetect_schema(
        rows[:50],
        ensure_cols={"id": "INTEGER"},
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

    print(f"  ✅ event_types: {total} rows")
    return total


def sync_bookings(
    session: requests.Session,
    bq_client: bigquery.Client,
    *,
    headers: Dict[str, str],
    state: dict,
    full: bool,
    dry_run: bool,
) -> Tuple[int, dict]:
    table_ref = TABLES["bookings"]
    tmp_ref = f"{table_ref}__tmp"

    last_after_start = None if full else state.get("bookings", {}).get("last_after_start")

    params: Dict[str, Any] = {}
    if last_after_start:
        params["afterStart"] = str(last_after_start)

    total = 0
    schema: Optional[List[bigquery.SchemaField]] = None
    truncated = False

    max_start_dt = parse_iso_dt(last_after_start) if last_after_start else datetime(1970, 1, 1, tzinfo=timezone.utc)

    for page_idx, items in enumerate(iter_calcom_pages(session, path="/bookings", headers=headers, params=params)):
        if not items:
            continue

        rows = [flatten_for_bq(dict(it)) for it in items]
        total += len(rows)

        # watermark = max(start)
        for it in items:
            if isinstance(it, dict):
                s = it.get("start")
                if isinstance(s, str):
                    max_start_dt = max(max_start_dt, parse_iso_dt(s))

        if dry_run:
            continue

        if schema is None:
            schema = autodetect_schema(
                rows[:50],
                force_timestamp_cols={"start", "end", "createdAt", "updatedAt"},
                ensure_cols={"id": "INTEGER"},
            )
            ensure_bq_table(bq_client, table_ref, schema)

        # For --full, perform a full reload (best-effort) by truncating once before upserts.
        if full and (not truncated):
            truncate_table(bq_client, table_ref)
            truncated = True

        assert schema is not None

        # Load page  tmp then MERGE
        bq_load_json_rows(
            bq_client,
            table_ref=tmp_ref,
            rows=rows,
            schema=schema,
            write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
        )
        merge_tmp_into_dest(bq_client, dest_ref=table_ref, tmp_ref=tmp_ref, schema_fields=schema, pk_cols=["id"])

    if not dry_run:
        try:
            bq_client.delete_table(tmp_ref, not_found_ok=True)
        except Exception:
            pass

    new_state = dict(state)
    new_state.setdefault("bookings", {})

    # Only advance if we actually saw any bookings.
    if total > 0:
        new_state["bookings"]["last_after_start"] = isoformat_z(max_start_dt)
    new_state["bookings"]["last_sync_iso"] = utc_now_iso()

    if dry_run:
        print(
            f"  bookings: would upsert {total} rows → {table_ref} "
            f"(afterStart={last_after_start or 'epoch'}, new_afterStart={new_state['bookings'].get('last_after_start')})"
        )
    else:
        print(f"  ✅ bookings: {total} rows")

    return total, new_state


def main():
    parser = argparse.ArgumentParser(description="Sync Cal.com → BigQuery (staging)")
    parser.add_argument("--full", action="store_true", help="Ignore state and sync all bookings")
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
    api_key = env.get("CAL_API_KEY", "").strip() or os.environ.get("CAL_API_KEY", "").strip()
    if not api_key:
        if args.dry_run:
            print("WARNING: CAL_API_KEY not found (dry-run)")
        else:
            print("ERROR: CAL_API_KEY not found in .env or environment")
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
        "cal-api-version": CAL_API_VERSION,
        "Content-Type": "application/json",
    }

    print(
        f"{'DRY RUN: ' if args.dry_run else ''}Syncing Cal.com → BigQuery {BQ_PROJECT}.{BQ_DATASET} "
        f"({'FULL BOOKINGS' if args.full else 'INCREMENTAL BOOKINGS'})"
    )
    print(f"Host:       {CALCOM_HOST}")
    print(f"State file:  {os.path.expanduser(args.state_file)}")
    print(f"Objects:     {', '.join(objects)}")
    print(f"Started:     {utc_now_iso()}\n")

    totals = {"rows": 0, "errors": []}

    with requests.Session() as session:
        for obj in objects:
            try:
                if obj == "event_types":
                    rows = sync_event_types(session, bq_client, headers=headers, dry_run=args.dry_run)
                    totals["rows"] += int(rows)

                elif obj == "bookings":
                    rows, new_state = sync_bookings(
                        session,
                        bq_client,
                        headers=headers,
                        state=state,
                        full=args.full,
                        dry_run=args.dry_run,
                    )
                    totals["rows"] += int(rows)
                    if not args.dry_run:
                        state = new_state

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
