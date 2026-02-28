#!/usr/bin/env python3
"""Sync Stripe objects to BigQuery (staging dataset).

Usage:
  sync-stripe-bigquery.py                    # Incremental sync (default)
  sync-stripe-bigquery.py --full             # Full reload (truncate + reload)
  sync-stripe-bigquery.py --objects customers,products
  sync-stripe-bigquery.py --dry-run

Incremental strategy:
  - For each Stripe object, read a per-object last_created timestamp from
    ~/clawd/config/stripe-sync-state.json
  - Fetch records using Stripe's `created` filter (gte last_created)
  - Upsert into BigQuery using MERGE on `id`
  - Advance state to max(created) seen (best-effort; uses gte to avoid misses)

Notes:
  - Deletes are not captured (Stripe API lists current objects; deleted records
    may remain in BigQuery).
  - Nested objects/arrays/metadata are stored as JSON strings.
"""

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

from google.cloud import bigquery

# Config
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "/home/ubuntu/.openclaw/gcp-service-account.json"
BQ_PROJECT = "slideheroes-data-platform"
BQ_DATASET = "staging"

DEFAULT_STATE_FILE = os.path.expanduser("~/clawd/config/stripe-sync-state.json")

SUPPORTED_OBJECTS = [
    "customers",
    "products",
    "prices",
    "subscriptions",
    "invoices",
    "payment_intents",
    "charges",
]


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


def load_state(state_file: str) -> dict:
    path = Path(os.path.expanduser(state_file))
    if not path.exists():
        return {"objects": {}}
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            return {"objects": {}}
        if "objects" not in data or not isinstance(data.get("objects"), dict):
            data["objects"] = {}
        return data
    except Exception:
        return {"objects": {}}


def save_state(state_file: str, state: dict):
    path = Path(os.path.expanduser(state_file))
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(state, f, indent=2)
        f.write("\n")
    tmp.replace(path)


def get_last_created(state: dict, obj_name: str) -> int:
    # Stripe epoch seconds. Default epoch start.
    try:
        v = state.get("objects", {}).get(obj_name, {}).get("last_created")
        if v is None:
            return 0
        return int(v)
    except Exception:
        return 0


def set_last_created(state: dict, obj_name: str, last_created: int):
    state.setdefault("objects", {}).setdefault(obj_name, {})["last_created"] = int(last_created)
    state["objects"][obj_name]["last_sync_iso"] = utc_now_iso()


def json_dumps_safe(v: Any) -> str:
    return json.dumps(v, default=str, ensure_ascii=False, sort_keys=True)


def flatten_for_bq(record: Dict[str, Any]) -> Dict[str, Any]:
    """Flatten a Stripe record into BQ-compatible JSON row.

    Rules:
      - primitives pass through
      - dict/list -> JSON string
    """
    out: Dict[str, Any] = {}
    for k, v in record.items():
        if isinstance(v, (dict, list)):
            out[k] = json_dumps_safe(v)
        elif isinstance(v, (str, int, float, bool)) or v is None:
            out[k] = v
        else:
            # datetime, Decimal, StripeObject, etc.
            if hasattr(v, "isoformat"):
                out[k] = v.isoformat()
            else:
                out[k] = str(v)
    return out


def infer_bq_type(value: Any) -> str:
    if value is None:
        return "STRING"  # default; will remain NULLABLE
    if isinstance(value, bool):
        return "BOOLEAN"
    if isinstance(value, int):
        return "INTEGER"
    if isinstance(value, float):
        return "FLOAT64"
    if isinstance(value, str):
        return "STRING"
    if hasattr(value, "isoformat"):
        return "TIMESTAMP"
    return "STRING"


def merge_types(a: str, b: str) -> str:
    if a == b:
        return a
    # Prefer STRING on conflict.
    numeric = {"INTEGER", "FLOAT64"}
    if a in numeric and b in numeric:
        return "FLOAT64"
    return "STRING"


def autodetect_schema(sample_rows: List[Dict[str, Any]]) -> List[bigquery.SchemaField]:
    col_types: Dict[str, str] = {}
    for row in sample_rows:
        for k, v in row.items():
            t = infer_bq_type(v)
            col_types[k] = merge_types(col_types.get(k, t), t)
    # Ensure id exists
    col_types.setdefault("id", "STRING")

    fields = [
        bigquery.SchemaField(name, typ, mode="NULLABLE")
        for name, typ in sorted(col_types.items())
    ]
    return fields


def ensure_bq_table(bq_client: bigquery.Client, table_ref: str, schema: List[bigquery.SchemaField]):
    table = bigquery.Table(table_ref, schema=schema)
    bq_client.create_table(table, exists_ok=True)


def bq_table_ref(obj_name: str) -> str:
    return f"{BQ_PROJECT}.{BQ_DATASET}.stripe_{obj_name}"


def tmp_table_ref(obj_name: str) -> str:
    return f"{BQ_PROJECT}.{BQ_DATASET}.stripe_{obj_name}__tmp"


def stripe_call_with_backoff(fn, *, max_retries: int = 8):
    """Call Stripe API with exponential backoff for rate limits/transient errors."""
    import stripe  # local import for easier error handling if missing

    delay = 1.0
    for attempt in range(max_retries):
        try:
            return fn()
        except stripe.error.RateLimitError:
            if attempt == max_retries - 1:
                raise
            time.sleep(delay)
            delay = min(delay * 2, 60)
        except (stripe.error.APIConnectionError, stripe.error.APIError):
            if attempt == max_retries - 1:
                raise
            time.sleep(delay)
            delay = min(delay * 2, 60)


def stripe_list_pages(
    list_fn,
    *,
    created_gte: Optional[int] = None,
    limit: int = 100,
) -> Iterable[List[Dict[str, Any]]]:
    """Yield pages (lists of dict rows) using cursor-based pagination."""
    import stripe

    starting_after = None
    while True:
        params: Dict[str, Any] = {"limit": limit}
        if starting_after:
            params["starting_after"] = starting_after
        if created_gte is not None and created_gte > 0:
            params["created"] = {"gte": int(created_gte)}

        def _call():
            return list_fn(**params)

        resp = stripe_call_with_backoff(_call)
        data = resp.get("data", []) if isinstance(resp, dict) else resp.data

        page: List[Dict[str, Any]] = []
        for item in data:
            # Convert StripeObject -> dict recursively
            if hasattr(item, "to_dict_recursive"):
                d = item.to_dict_recursive()
            elif isinstance(item, dict):
                d = item
            else:
                d = dict(item)
            page.append(flatten_for_bq(d))

        yield page

        has_more = resp.get("has_more") if isinstance(resp, dict) else getattr(resp, "has_more", False)
        if not has_more or not data:
            break
        last = data[-1]
        starting_after = last.get("id") if isinstance(last, dict) else getattr(last, "id", None)
        if not starting_after:
            break


def merge_tmp_into_dest(
    bq_client: bigquery.Client,
    *,
    dest_ref: str,
    tmp_ref: str,
    schema_fields: List[bigquery.SchemaField],
):
    cols = [f.name for f in schema_fields]
    pk_cols = ["id"]

    on_clause = " AND ".join([f"T.`{c}` = S.`{c}`" for c in pk_cols])
    update_cols = [c for c in cols if c not in pk_cols]
    update_set = ", ".join([f"`{c}` = S.`{c}`" for c in update_cols])
    insert_cols = ", ".join([f"`{c}`" for c in cols])
    insert_vals = ", ".join([f"S.`{c}`" for c in cols])

    when_matched = (
        f"WHEN MATCHED THEN UPDATE SET {update_set}"
        if update_set
        else "WHEN MATCHED THEN UPDATE SET `id` = S.`id`"
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


def sync_object(
    bq_client: bigquery.Client,
    *,
    obj_name: str,
    list_fn,
    last_created: int,
    full: bool,
    dry_run: bool,
) -> Tuple[int, int]:
    """Return (rows_synced, max_created_seen)."""
    dest = bq_table_ref(obj_name)
    tmp = tmp_table_ref(obj_name)

    created_gte = None if full else last_created

    total_rows = 0
    max_created_seen = last_created if not full else 0
    schema_fields: Optional[List[bigquery.SchemaField]] = None
    table_ready = False

    for page_idx, page in enumerate(stripe_list_pages(list_fn, created_gte=created_gte)):
        if page_idx == 0:
            # Schema from first batch (or empty fallback)
            sample = page[:50]
            schema_fields = autodetect_schema(sample)

            if dry_run:
                # Table ops not executed.
                table_ready = True
            else:
                ensure_bq_table(bq_client, dest, schema_fields)
                table_ready = True
                if full:
                    # Truncate destination before loading.
                    bq_client.query(f"DELETE FROM `{dest}` WHERE TRUE").result()

        if not page:
            continue

        # Update created watermark
        for row in page:
            c = row.get("created")
            if isinstance(c, int):
                max_created_seen = max(max_created_seen, c)
            elif isinstance(c, str) and c.isdigit():
                max_created_seen = max(max_created_seen, int(c))

        total_rows += len(page)

        if dry_run:
            continue

        assert schema_fields is not None
        job_config = bigquery.LoadJobConfig(
            schema=schema_fields,
            source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
        )

        if full:
            # Append pages into dest.
            job_config.write_disposition = bigquery.WriteDisposition.WRITE_APPEND
            job = bq_client.load_table_from_json(page, dest, job_config=job_config)
            job.result()
        else:
            # Load into tmp, then merge.
            job_config.write_disposition = bigquery.WriteDisposition.WRITE_TRUNCATE
            job = bq_client.load_table_from_json(page, tmp, job_config=job_config)
            job.result()
            merge_tmp_into_dest(bq_client, dest_ref=dest, tmp_ref=tmp, schema_fields=schema_fields)

    if dry_run and not table_ready:
        # No records, but still show schema as minimal.
        schema_fields = autodetect_schema([])

    if not dry_run:
        # Cleanup tmp table best-effort
        try:
            bq_client.delete_table(tmp, not_found_ok=True)
        except Exception:
            pass

    return total_rows, max_created_seen


def main():
    parser = argparse.ArgumentParser(description="Sync Stripe → BigQuery (staging)")
    parser.add_argument("--full", action="store_true", help="Ignore state and sync everything")
    parser.add_argument(
        "--objects",
        type=str,
        help=f"Comma-separated objects to sync (default: all: {','.join(SUPPORTED_OBJECTS)})",
    )
    parser.add_argument("--dry-run", action="store_true", help="Print what would sync")
    parser.add_argument(
        "--state-file",
        type=str,
        default=DEFAULT_STATE_FILE,
        help=f"Path to state file (default: {DEFAULT_STATE_FILE})",
    )
    args = parser.parse_args()

    env = read_env()
    stripe_key = env.get("STRIPE_SECRET_KEY", "").strip() or os.environ.get("STRIPE_SECRET_KEY", "").strip()
    if not stripe_key:
        if args.dry_run:
            print("WARNING: STRIPE_SECRET_KEY not found (dry-run)")
        else:
            print("ERROR: STRIPE_SECRET_KEY not found in .env or environment")
            sys.exit(1)

    try:
        import stripe
    except Exception as e:
        print(f"ERROR: stripe package not available: {e}")
        print("Install with: pip install stripe --break-system-packages")
        sys.exit(1)

    stripe.api_key = stripe_key

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

    obj_to_list_fn = {
        "customers": stripe.Customer.list,
        "products": stripe.Product.list,
        "prices": stripe.Price.list,
        "subscriptions": stripe.Subscription.list,
        "invoices": stripe.Invoice.list,
        "payment_intents": stripe.PaymentIntent.list,
        "charges": stripe.Charge.list,
    }

    bq_client = bigquery.Client(project=BQ_PROJECT)

    print(
        f"{'DRY RUN: ' if args.dry_run else ''}Syncing Stripe → BigQuery {BQ_PROJECT}.{BQ_DATASET} "
        f"({'FULL' if args.full else 'INCREMENTAL'})"
    )
    print(f"State file: {os.path.expanduser(args.state_file)}")
    print(f"Objects:    {', '.join(objects)}")
    print(f"Started:    {utc_now_iso()}\n")

    totals = {"rows": 0, "errors": []}

    for obj in objects:
        try:
            last_created = 0 if args.full else get_last_created(state, obj)
            mode = "FULL" if args.full else "INCR"
            print(f"{obj:16s} {mode} | last_created={last_created}")

            if args.dry_run:
                # We don't have an easy way to count without fetching; just execute paging but
                # skip BQ writes.
                pass

            rows_synced, max_created = sync_object(
                bq_client,
                obj_name=obj,
                list_fn=obj_to_list_fn[obj],
                last_created=last_created,
                full=args.full,
                dry_run=args.dry_run,
            )

            totals["rows"] += int(rows_synced)
            print(f"  ✅ {obj}: {rows_synced} rows")

            if (not args.dry_run) and (not args.full):
                # Advance watermark only when we actually fetched something.
                if max_created and max_created >= last_created:
                    set_last_created(state, obj, max_created)

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
