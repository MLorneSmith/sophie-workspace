#!/usr/bin/env python3
"""Sync Supabase Postgres tables to BigQuery.

Usage:
  sync-supabase-bigquery.py                    # Sync all tables
  sync-supabase-bigquery.py --tables accounts,ai_request_logs  # Specific tables
  sync-supabase-bigquery.py --dry-run          # Show what would sync

Strategy: Full replace (truncate + reload) for each table.
For small datasets (<100K rows) this is simpler and more reliable than incremental.
Switch to incremental when tables grow.
"""

import argparse
import json
import os
import sys
from datetime import datetime, timezone

from decimal import Decimal

import psycopg2
import psycopg2.extras
from google.cloud import bigquery

# Config
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/ubuntu/.clawdbot/gcp-service-account.json'
BQ_PROJECT = 'slideheroes-data-platform'
BQ_DATASET = 'staging'  # Raw data goes to staging; dbt transforms to core

# Postgres type → BigQuery type mapping
PG_TO_BQ = {
    'uuid': 'STRING',
    'text': 'STRING',
    'character varying': 'STRING',
    'boolean': 'BOOLEAN',
    'integer': 'INTEGER',
    'bigint': 'INTEGER',
    'smallint': 'INTEGER',
    'numeric': 'FLOAT64',
    'double precision': 'FLOAT64',
    'real': 'FLOAT64',
    'timestamp with time zone': 'TIMESTAMP',
    'timestamp without time zone': 'TIMESTAMP',
    'date': 'DATE',
    'jsonb': 'STRING',  # Store as JSON string
    'json': 'STRING',
    'USER-DEFINED': 'STRING',  # Enums → strings
    'ARRAY': 'STRING',  # Arrays → JSON strings
}

def read_env():
    env = {}
    with open('/home/ubuntu/.clawdbot/.env') as f:
        for line in f:
            line = line.strip()
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env

def get_pg_schema(cur, table):
    cur.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema='public' AND table_name=%s
        ORDER BY ordinal_position
    """, (table,))
    return cur.fetchall()

def pg_to_bq_schema(pg_columns):
    fields = []
    for col_name, data_type, nullable in pg_columns:
        bq_type = PG_TO_BQ.get(data_type, 'STRING')
        mode = 'NULLABLE' if nullable == 'YES' else 'REQUIRED'
        # BQ is strict about REQUIRED + empty data, safer to use NULLABLE
        fields.append(bigquery.SchemaField(col_name, bq_type, mode='NULLABLE'))
    return fields

def fetch_table_data(cur, table, pg_columns):
    """Fetch all rows, converting types as needed."""
    cur.execute(f'SELECT * FROM public."{table}"')
    rows = []
    col_types = {col[0]: col[1] for col in pg_columns}
    
    for row in cur.fetchall():
        record = {}
        for i, col in enumerate(pg_columns):
            col_name = col[0]
            val = row[i]
            # Convert Decimal to float
            if isinstance(val, Decimal):
                val = float(val)
            # Convert jsonb/json to string
            elif col_types[col_name] in ('jsonb', 'json') and val is not None:
                val = json.dumps(val) if not isinstance(val, str) else val
            # Convert other non-serializable types
            elif hasattr(val, 'isoformat'):
                val = val.isoformat()
            record[col_name] = val
        rows.append(record)
    return rows

def sync_table(bq_client, pg_cur, table, dry_run=False):
    """Sync a single table from Postgres to BigQuery."""
    # Get schema
    pg_columns = get_pg_schema(pg_cur, table)
    if not pg_columns:
        print(f'  ⚠️  {table}: no columns found, skipping')
        return 0
    
    bq_schema = pg_to_bq_schema(pg_columns)
    
    # Get row count
    pg_cur.execute(f'SELECT count(*) FROM public."{table}"')
    count = pg_cur.fetchone()[0]
    
    if dry_run:
        print(f'  {table}: {count} rows, {len(pg_columns)} columns → {BQ_DATASET}.{table}')
        return count
    
    # Fetch data
    rows = fetch_table_data(pg_cur, table, pg_columns)
    
    # Create/replace BQ table
    table_ref = f'{BQ_PROJECT}.{BQ_DATASET}.{table}'
    
    job_config = bigquery.LoadJobConfig(
        schema=bq_schema,
        write_disposition=bigquery.WriteDisposition.WRITE_TRUNCATE,
        source_format=bigquery.SourceFormat.NEWLINE_DELIMITED_JSON,
    )
    
    if rows:
        job = bq_client.load_table_from_json(rows, table_ref, job_config=job_config)
        job.result()  # Wait for completion
        print(f'  ✅ {table}: {count} rows synced')
    else:
        # Create empty table with schema
        bq_table = bigquery.Table(table_ref, schema=bq_schema)
        bq_client.create_table(bq_table, exists_ok=True)
        # Truncate if exists
        bq_client.query(f'DELETE FROM `{table_ref}` WHERE TRUE').result()
        print(f'  ✅ {table}: 0 rows (empty table created)')
    
    return count

def main():
    parser = argparse.ArgumentParser(description='Sync Supabase → BigQuery')
    parser.add_argument('--tables', type=str, help='Comma-separated table names')
    parser.add_argument('--dry-run', action='store_true', help='Show what would sync')
    parser.add_argument('--min-rows', type=int, default=0, help='Only sync tables with ≥N rows')
    args = parser.parse_args()
    
    env = read_env()
    db_url = env.get('SUPABASE_DB_URL', '').strip()
    if not db_url:
        print('ERROR: SUPABASE_DB_URL not found')
        sys.exit(1)
    
    # Connect
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    bq_client = bigquery.Client(project=BQ_PROJECT)
    
    # Get table list
    if args.tables:
        tables = [t.strip() for t in args.tables.split(',')]
    else:
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
        tables = [t[0] for t in cur.fetchall()]
    
    # Skip system/view tables
    skip = {'timezone_performance_monitor', 'user_account_workspace', 'user_accounts'}
    tables = [t for t in tables if t not in skip]
    
    print(f'{"DRY RUN: " if args.dry_run else ""}Syncing {len(tables)} tables to {BQ_PROJECT}.{BQ_DATASET}')
    print(f'Started: {datetime.now(timezone.utc).isoformat()}\n')
    
    total_rows = 0
    synced = 0
    errors = []
    
    for table in tables:
        try:
            # Check row count for min-rows filter
            if args.min_rows > 0:
                cur.execute(f'SELECT count(*) FROM public."{table}"')
                if cur.fetchone()[0] < args.min_rows:
                    continue
            
            rows = sync_table(bq_client, cur, table, args.dry_run)
            total_rows += rows
            synced += 1
        except Exception as e:
            print(f'  ❌ {table}: {e}')
            errors.append((table, str(e)))
            conn.rollback()
    
    print(f'\nDone: {synced} tables, {total_rows} total rows')
    if errors:
        print(f'Errors: {len(errors)}')
        for t, e in errors:
            print(f'  - {t}: {e}')
    
    conn.close()

if __name__ == '__main__':
    main()
