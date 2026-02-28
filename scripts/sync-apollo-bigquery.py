#!/usr/bin/env python3
"""Sync Apollo.io objects → BigQuery (staging dataset).

Usage:
  sync-apollo-bigquery.py                         # Full replace (default)
  sync-apollo-bigquery.py --full                  # Full replace (same as default)
  sync-apollo-bigquery.py --objects people,organizations
  sync-apollo-bigquery.py --dry-run

Apollo API:
  - Host: https://api.apollo.io
  - Auth: x-api-key: $APOLLO_API_KEY

Endpoints:
  - POST /api/v1/mixed_people/search
      Body: {"page": 1, "per_page": 100}
      Returns: {"people": [...], "pagination": {"total_entries": N, "per_page": 100, "page": 1}}
  - POST /api/v1/mixed_companies/search
      Body: {"page": 1, "per_page": 100}
      Returns: {"organizations": [...], "pagination": {...}}
  - GET  /api/v1/labels
  - GET  /api/v1/typed_custom_fields

BigQuery:
  - Project: slideheroes-data-platform
  - Dataset: staging
  - Tables:
      apollo_people, apollo_organizations, apollo_labels, apollo_custom_fields

State:
  - ~/clawd/config/apollo-sync-state.json
  - Stores a single last_sync_iso timestamp (best-effort)

Notes:
  - Apollo sync is always full replace (truncate + reload).
  - Nested objects/arrays are JSON-stringified to prevent schema explosions.
  - Field/column names are sanitized for BigQuery.
  - Handles strict rate limits with exponential backoff.
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from math import ceil
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import requests

try:
    from google.cloud import bigquery
except Exception as e:  # pragma: no cover
    print(f"ERROR: google-cloud-bigquery package not available: {e}")
    print("Install with: pip install google-cloud-bigquery --break-system-packages")
    sys.exit(1)


APOLLO_HOST = "https://api.apollo.io"

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/home/ubuntu/.openclaw/gcp-service-account.json"
BQ_PROJECT = "slideheroes-data-platform"
BQ_DATASET = "staging"

DEFAULT_STATE_FILE = os.path.expanduser("~/clawd/config/apollo-sync-state.json")

SUPPORTED_OBJECTS = [
    "people",
    "organizations",
    "labels",
    "custom_fields",
]

TABLES = {
    "people": f"{BQ_PROJECT}.{BQ_DATASET}.apollo_people",
    "organizations": f"{BQ_PROJECT}.{BQ_DATASET}.apollo_organizations",
    "labels": f"{BQ_PROJECT}.{BQ_DATASET}.apollo_labels",
    "custom_fields": f"{BQ_PROJECT}.{BQ_DATASET}.apollo_custom_fields",
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


class ApolloRateLimiter:
    """Simple Apollo API rate limiter.

    Free plan limits (approx):
      - 50 req/min
      - 200 req/hour
      - 600 req/day

    We enforce:
      - min interval between requests (default 1.5s)
      - stop when nearing daily cap
    """

    def __init__(
        self,
        *,
        min_interval_s: float = 1.5,
        daily_cap: int = 600,
        stop_before_cap: int = 15,
    ):
        self.min_interval_s = float(min_interval_s)
        self.daily_cap = int(daily_cap)
        self.stop_before_cap = int(stop_before_cap)
        self._last_request_ts: Optional[float] = None
        self.total_requests: int = 0

    @property
    def stop_threshold(self) -> int:
        return max(0, self.daily_cap - self.stop_before_cap)

    def before_request(self):
        if self.total_requests >= self.stop_threshold:
            raise RuntimeError(
                f"Apollo rate limit safety stop: {self.total_requests} requests made; "
                f"threshold={self.stop_threshold} (daily cap={self.daily_cap})."
            )

        now = time.time()
        if self._last_request_ts is not None:
            elapsed = now - self._last_request_ts
            wait = self.min_interval_s - elapsed
            if wait > 0:
                time.sleep(wait)

    def after_request(self):
        self.total_requests += 1
        self._last_request_ts = time.time()


def request_with_backoff(
    session: requests.Session,
    method: str,
    url: str,
    *,
    headers: Dict[str, str],
    json_body: Optional[dict] = None,
    timeout_s: int = 60,
    max_retries: int = 10,
    rate_limiter: Optional[ApolloRateLimiter] = None,
) -> requests.Response:
    """HTTP request with exponential backoff for rate limits/transient errors."""

    delay = 1.0
    for attempt in range(max_retries):
        if rate_limiter is not None:
            rate_limiter.before_request()
        resp = session.request(method, url, headers=headers, json=json_body, timeout=timeout_s)
        if rate_limiter is not None:
            rate_limiter.after_request()
        if resp.status_code < 400:
            return resp

        retryable = resp.status_code in (429, 500, 502, 503, 504)
        if not retryable or attempt == max_retries - 1:
            body = resp.text
            if len(body) > 1200:
                body = body[:1200] + "→"
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


def flatten_for_bq(record: Dict[str, Any]) -> Dict[str, Any]:
    """Flatten an Apollo record into a BigQuery-friendly row.

    Rules:
      - sanitize all top-level keys
      - primitives pass through
      - dict/list -> JSON string
      - unknown objects -> str
    """

    out: Dict[str, Any] = {}
    for k, v in record.items():
        kk = _sanitize_bq_name(str(k))
        if kk in out:
            # Deterministic suffixing on collision
            base = kk
            i = 1
            kk = f"{base}__{i}"
            while kk in out:
                i += 1
                kk = f"{base}__{i}"

        if isinstance(v, (dict, list)):
            out[kk] = json_dumps_safe(v)
        elif isinstance(v, str) or v is None:
            out[kk] = v
        elif isinstance(v, (int, float, bool)):
            # Apollo data can vary types across rows; keep staging stable by stringifying
            out[kk] = str(v)
        else:
            if hasattr(v, "isoformat"):
                out[kk] = v.isoformat()
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
) -> List[bigquery.SchemaField]:
    col_types: Dict[str, str] = {}
    for row in sample_rows:
        for k, v in row.items():
            t = infer_bq_type(v)
            col_types[k] = merge_types(col_types.get(k, t), t)

    if ensure_cols:
        for c, t in ensure_cols.items():
            col_types.setdefault(c, t)

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
    schema: Optional[List[bigquery.SchemaField]] = None,
    write_disposition: str = bigquery.WriteDisposition.WRITE_APPEND,
):
    schema_updates = []
    if write_disposition == bigquery.WriteDisposition.WRITE_APPEND:
        schema_updates = [
            bigquery.SchemaUpdateOption.ALLOW_FIELD_ADDITION,
            bigquery.SchemaUpdateOption.ALLOW_FIELD_RELAXATION,
        ]

    job_config = bigquery.LoadJobConfig(
        schema=schema,
        autodetect=(schema is None),
        write_disposition=write_disposition,
        create_disposition=bigquery.CreateDisposition.CREATE_IF_NEEDED,
        source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
        schema_update_options=schema_updates,
    )
    job = bq_client.load_table_from_json(rows, table_ref, job_config=job_config)
    job.result()


def _total_pages_from_pagination(pagination: Any) -> Optional[int]:
    if not isinstance(pagination, dict):
        return None
    total_entries = pagination.get("total_entries")
    per_page = pagination.get("per_page")
    if total_entries is None or per_page in (None, 0, "0"):
        return None
    try:
        return int(ceil(float(total_entries) / float(per_page)))
    except Exception:
        return None


def iter_apollo_search_pages(
    session: requests.Session,
    *,
    path: str,
    list_key: str,
    headers: Dict[str, str],
    per_page: int = 100,
    body_extra: Optional[Dict[str, Any]] = None,
    max_pages: Optional[int] = None,
    rate_limiter: Optional[ApolloRateLimiter] = None,
) -> Iterable[List[dict]]:
    """Yield pages from Apollo search endpoints (page-based pagination)."""

    page = 1
    total_pages: Optional[int] = None

    while True:
        if max_pages is not None and page > max_pages:
            break

        url = f"{APOLLO_HOST}{path}"
        body: Dict[str, Any] = {"page": int(page), "per_page": int(per_page)}
        if body_extra:
            body.update(body_extra)
        resp = request_with_backoff(
            session, "POST", url, headers=headers, json_body=body, rate_limiter=rate_limiter
        )
        payload = resp.json() if resp.content else {}

        items: List[dict] = []
        if isinstance(payload, dict) and isinstance(payload.get(list_key), list):
            items = [x for x in payload.get(list_key) if isinstance(x, dict)]

        if total_pages is None:
            total_pages = _total_pages_from_pagination(payload.get("pagination"))

        if not items:
            break

        yield items

        page += 1
        if total_pages is not None and page > total_pages:
            break


def fetch_simple_list(
    session: requests.Session,
    *,
    path: str,
    headers: Dict[str, str],
    rate_limiter: Optional[ApolloRateLimiter] = None,
) -> List[dict]:
    """Fetch a non-paginated list endpoint.

    Apollo responses vary; we attempt to locate the first list value in the payload.
    """

    url = f"{APOLLO_HOST}{path}"
    resp = request_with_backoff(session, "GET", url, headers=headers, rate_limiter=rate_limiter)
    payload = resp.json() if resp.content else {}

    if isinstance(payload, list):
        return [x for x in payload if isinstance(x, dict)]

    if isinstance(payload, dict):
        # Prefer known keys
        for key in ("labels", "typed_custom_fields", "custom_fields", "data"):
            v = payload.get(key)
            if isinstance(v, list):
                return [x for x in v if isinstance(x, dict)]
        # Otherwise return the first list found
        for v in payload.values():
            if isinstance(v, list):
                return [x for x in v if isinstance(x, dict)]

    return []


def iter_icp_filtered_organizations_pages(
    session: requests.Session,
    *,
    headers: Dict[str, str],
    rate_limiter: Optional[ApolloRateLimiter],
    per_page: int = 100,
    secondary_max_pages: int = 100,
    secondary_max_records: int = 10_000,
) -> Iterable[List[dict]]:
    """Run two ICP searches sequentially and yield deduped organization pages.

    Primary search takes priority; secondary is capped.
    Adds icp_search_tier = 'primary'|'secondary'.
    """

    primary_body = {
        "organization_num_employees_ranges": ["5,50"],
        "organization_locations": ["United States", "United Kingdom", "Canada", "Australia"],
        "q_organization_keyword_tags": [
            "management consulting",
            "strategy consulting",
            "business consulting",
        ],
        "organization_sic_codes": ["8742"],
    }

    secondary_body = {
        "organization_num_employees_ranges": ["5,200"],
        "organization_locations": ["United States", "United Kingdom", "Canada", "Australia"],
        "q_organization_keyword_tags": [
            "management consulting",
            "strategy consulting",
            "business consulting",
            "advisory",
            "consulting firm",
        ],
    }

    seen_ids: set = set()

    def _dedupe_and_tag(page: List[dict], tier: str, *, secondary_count: Optional[List[int]] = None):
        out: List[dict] = []
        for org in page:
            oid = org.get("id")
            if oid is None:
                # If Apollo ever omits id, keep record (can't reliably dedupe)
                row = dict(org)
                row["icp_search_tier"] = tier
                out.append(row)
                if secondary_count is not None:
                    secondary_count[0] += 1
                continue

            oid_s = str(oid)
            if oid_s in seen_ids:
                continue
            seen_ids.add(oid_s)

            row = dict(org)
            row["icp_search_tier"] = tier
            out.append(row)
            if secondary_count is not None:
                secondary_count[0] += 1
        return out

    # Search 1: primary (no cap)
    for page in iter_apollo_search_pages(
        session,
        path="/api/v1/mixed_companies/search",
        list_key="organizations",
        headers=headers,
        per_page=per_page,
        body_extra=primary_body,
        rate_limiter=rate_limiter,
    ):
        out = _dedupe_and_tag(page, "primary")
        if out:
            yield out

    # Search 2: secondary (cap)
    secondary_count = [0]
    for page in iter_apollo_search_pages(
        session,
        path="/api/v1/mixed_companies/search",
        list_key="organizations",
        headers=headers,
        per_page=per_page,
        body_extra=secondary_body,
        max_pages=secondary_max_pages,
        rate_limiter=rate_limiter,
    ):
        if secondary_count[0] >= secondary_max_records:
            break
        out = _dedupe_and_tag(page, "secondary", secondary_count=secondary_count)
        if not out:
            continue

        # Enforce record cap as well as page cap
        remaining = secondary_max_records - (secondary_count[0] - len(out))
        if remaining <= 0:
            break
        if len(out) > remaining:
            out = out[:remaining]
            secondary_count[0] = secondary_max_records

        yield out


def sync_full_replace_pages(
    session: requests.Session,
    bq_client: bigquery.Client,
    *,
    obj: str,
    page_iter: Iterable[List[dict]],
    dry_run: bool,
    ensure_cols: Optional[Dict[str, str]] = None,
) -> int:
    table_ref = TABLES[obj]

    required_cols = {"id": "STRING"}
    if ensure_cols:
        required_cols.update(ensure_cols)

    total = 0
    loaded_any = False

    for page in page_iter:
        rows = [flatten_for_bq(r) for r in page]
        if not rows:
            continue

        # Ensure required cols exist in every row so schema can include them
        for r in rows:
            for col in required_cols.keys():
                r.setdefault(col, None)

        total += len(rows)

        if dry_run:
            continue

        if not loaded_any:
            # Full replace: one load job that truncates/creates the table.
            # Use autodetect + schema update to handle new fields across subsequent pages.
            bq_load_json_rows(
                bq_client,
                table_ref=table_ref,
                rows=rows,
                schema=None,
                write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
            )
            loaded_any = True
        else:
            bq_load_json_rows(
                bq_client,
                table_ref=table_ref,
                rows=rows,
                schema=None,
                write_disposition=bigquery.WriteDisposition.WRITE_APPEND,
            )

    if dry_run:
        print(f"  {obj}: would full-replace {total} rows → {table_ref}")
        return total

    # Ensure table exists even if we got 0 records
    if not loaded_any:
        schema = autodetect_schema([], ensure_cols=required_cols)
        bq_client.delete_table(table_ref, not_found_ok=True)
        ensure_bq_table(bq_client, table_ref, schema)
        truncate_table(bq_client, table_ref)

    print(f"  ✅ {obj}: {total} rows")
    return total


def sync_object(
    session: requests.Session,
    bq_client: bigquery.Client,
    *,
    obj: str,
    headers: Dict[str, str],
    dry_run: bool,
    icp_filter: bool,
    rate_limiter: Optional[ApolloRateLimiter],
) -> int:
    if obj == "people":
        pages = iter_apollo_search_pages(
            session,
            path="/api/v1/mixed_people/search",
            list_key="people",
            headers=headers,
            per_page=100,
            rate_limiter=rate_limiter,
        )
        return sync_full_replace_pages(session, bq_client, obj=obj, page_iter=pages, dry_run=dry_run)

    if obj == "organizations":
        if icp_filter:
            pages = iter_icp_filtered_organizations_pages(
                session,
                headers=headers,
                rate_limiter=rate_limiter,
                per_page=100,
                secondary_max_pages=100,
                secondary_max_records=10_000,
            )
            return sync_full_replace_pages(
                session,
                bq_client,
                obj=obj,
                page_iter=pages,
                dry_run=dry_run,
                ensure_cols={"icp_search_tier": "STRING"},
            )

        pages = iter_apollo_search_pages(
            session,
            path="/api/v1/mixed_companies/search",
            list_key="organizations",
            headers=headers,
            per_page=100,
            rate_limiter=rate_limiter,
        )
        return sync_full_replace_pages(session, bq_client, obj=obj, page_iter=pages, dry_run=dry_run)

    if obj == "labels":
        data = fetch_simple_list(session, path="/api/v1/labels", headers=headers, rate_limiter=rate_limiter)
        return sync_full_replace_pages(session, bq_client, obj=obj, page_iter=[data], dry_run=dry_run)

    if obj == "custom_fields":
        data = fetch_simple_list(
            session, path="/api/v1/typed_custom_fields", headers=headers, rate_limiter=rate_limiter
        )
        return sync_full_replace_pages(session, bq_client, obj=obj, page_iter=[data], dry_run=dry_run)

    raise ValueError(f"Unknown object: {obj}")


def main():
    parser = argparse.ArgumentParser(description="Sync Apollo.io → BigQuery (staging)")
    parser.add_argument("--full", action="store_true", help="Full replace (default; kept for parity)")
    parser.add_argument(
        "--objects",
        type=str,
        help=f"Comma-separated objects to sync (default: all: {','.join(SUPPORTED_OBJECTS)})",
    )

    icp_group = parser.add_mutually_exclusive_group()
    icp_group.add_argument(
        "--icp-filter",
        dest="icp_filter",
        action="store_true",
        default=True,
        help="Use ICP-filtered org searches (default)",
    )
    icp_group.add_argument(
        "--no-icp-filter",
        dest="icp_filter",
        action="store_false",
        help="Disable ICP filtering (use legacy unfiltered org search)",
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
    api_key = env.get("APOLLO_API_KEY", "").strip() or os.environ.get("APOLLO_API_KEY", "").strip()
    if not api_key:
        if args.dry_run:
            print("WARNING: APOLLO_API_KEY not found (dry-run)")
        else:
            print("ERROR: APOLLO_API_KEY not found in .env or environment")
            sys.exit(1)

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
        "x-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    print(
        f"{'DRY RUN: ' if args.dry_run else ''}Syncing Apollo → BigQuery {BQ_PROJECT}.{BQ_DATASET} (FULL REPLACE)"
    )
    print(f"Host:       {APOLLO_HOST}")
    print(f"State file: {os.path.expanduser(args.state_file)}")
    print(f"Objects:    {', '.join(objects)}")
    if "organizations" in objects:
        print(f"Org ICP filter: {'ON' if args.icp_filter else 'OFF (legacy unfiltered search)'}")
    print(f"Started:    {utc_now_iso()}\n")

    totals = {"rows": 0, "errors": []}

    rate_limiter = ApolloRateLimiter(min_interval_s=1.5, daily_cap=600, stop_before_cap=15)

    with requests.Session() as session:
        for obj in objects:
            try:
                rows = sync_object(
                    session,
                    bq_client,
                    obj=obj,
                    headers=headers,
                    dry_run=args.dry_run,
                    icp_filter=bool(args.icp_filter),
                    rate_limiter=rate_limiter,
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
