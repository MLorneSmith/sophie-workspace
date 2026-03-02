#!/usr/bin/env python3
"""
Structured Data Store — SQLite database for dense, queryable data.

Usage:
    python3 structured-db.py init                    # Create tables
    python3 structured-db.py query "SELECT * FROM tools WHERE category='crm'"
    python3 structured-db.py insert tools '{"name":"Attio","category":"crm","status":"active"}'
    python3 structured-db.py stats                   # Show table sizes

Tables:
    - tools: SaaS tools and services (name, category, status, url, notes)
    - contacts: People and organizations (name, role, org, email, notes)
    - decisions: Key decisions with context (topic, decision, rationale, date)
    - projects: Project metadata (name, repo, status, description)
    - competitive_intel: Competitor data (company, product, pricing, strengths, weaknesses)
    - api_endpoints: API documentation (service, path, method, auth_required, description)
"""

import json
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

DB_PATH = Path.home() / "clawd" / "data" / "structured.db"

SCHEMA = """
CREATE TABLE IF NOT EXISTS tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT,
    status TEXT DEFAULT 'active',
    url TEXT,
    cost TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    role TEXT,
    org TEXT,
    email TEXT,
    phone TEXT,
    channel TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    decision TEXT NOT NULL,
    rationale TEXT,
    status TEXT DEFAULT 'active',
    date TEXT DEFAULT (date('now')),
    superseded_by INTEGER REFERENCES decisions(id),
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    repo TEXT,
    status TEXT DEFAULT 'active',
    description TEXT,
    tech_stack TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS competitive_intel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    product TEXT,
    category TEXT,
    pricing TEXT,
    strengths TEXT,
    weaknesses TEXT,
    url TEXT,
    last_checked TEXT DEFAULT (date('now')),
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS api_endpoints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service TEXT NOT NULL,
    path TEXT NOT NULL,
    method TEXT DEFAULT 'GET',
    auth_required INTEGER DEFAULT 1,
    rate_limit TEXT,
    description TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);
"""

def get_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript(SCHEMA)
    conn.commit()
    conn.close()
    print(f"✅ Database initialized at {DB_PATH}")
    print("Tables: tools, contacts, decisions, projects, competitive_intel, api_endpoints")

def run_query(sql: str):
    conn = get_db()
    try:
        cursor = conn.execute(sql)
        if sql.strip().upper().startswith("SELECT"):
            rows = cursor.fetchall()
            if not rows:
                print("No results.")
                return
            # Print as formatted table
            keys = rows[0].keys()
            print(" | ".join(keys))
            print("-" * (len(keys) * 20))
            for row in rows:
                print(" | ".join(str(row[k]) for k in keys))
            print(f"\n({len(rows)} rows)")
        else:
            conn.commit()
            print(f"✅ {cursor.rowcount} row(s) affected.")
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
    finally:
        conn.close()

def insert_row(table: str, data_json: str):
    data = json.loads(data_json)
    keys = list(data.keys())
    placeholders = ", ".join(["?"] * len(keys))
    cols = ", ".join(keys)
    values = [data[k] for k in keys]
    
    conn = get_db()
    try:
        conn.execute(f"INSERT OR REPLACE INTO {table} ({cols}) VALUES ({placeholders})", values)
        conn.commit()
        print(f"✅ Inserted into {table}: {data.get('name', data.get('topic', data.get('company', '?')))}")
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
    finally:
        conn.close()

def show_stats():
    conn = get_db()
    tables = ["tools", "contacts", "decisions", "projects", "competitive_intel", "api_endpoints"]
    print("📊 Structured Data Store Stats\n")
    for table in tables:
        try:
            count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
            print(f"  {table}: {count} rows")
        except Exception:
            print(f"  {table}: (not created)")
    conn.close()
    print(f"\n  DB path: {DB_PATH}")
    if DB_PATH.exists():
        size = DB_PATH.stat().st_size
        print(f"  DB size: {size:,} bytes")

def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return
    
    cmd = sys.argv[1]
    
    if cmd == "init":
        init_db()
    elif cmd == "query" and len(sys.argv) > 2:
        run_query(sys.argv[2])
    elif cmd == "insert" and len(sys.argv) > 3:
        insert_row(sys.argv[2], sys.argv[3])
    elif cmd == "stats":
        show_stats()
    else:
        print(__doc__)

if __name__ == "__main__":
    main()
